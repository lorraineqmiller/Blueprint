-- Blueprint — fit checks (formerly "group chats").
--
-- Run after 0007. One transaction, same reason as 0007: it swaps out most
-- of the chat policies, and a half-applied version would be worse than
-- either side.
--
-- What changes:
--   * Friend groups: named (or unnamed) lists of friends you regularly ask
--     for outfit advice. Owner-only — nobody sees which groups they're in.
--   * A fit check has an event name, vibe/dress code, weather, and an end
--     time; voting closes on its own at ends_at.
--   * Audience is one of:
--       community — your verified school community (public profiles only)
--       friends   — all your friends, including ones you add later
--       group     — one friend group, snapshotted into chat_members
--   * Two modes:
--       vote  — up to 4 options, each built from closet pieces and/or one
--               uploaded fit pic (private storage bucket)
--       ideas — no options; friends browse your closet, suggest a look, and
--               can offer pieces from their own closet to lend
--   * Only the creator can add options or lock in the result.

begin;

-- ─────────────────────────────────────────────────────────────────────────
-- friend groups
-- ─────────────────────────────────────────────────────────────────────────
create table friend_groups (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references profiles (id) on delete cascade,
  name text not null default '',
  created_at timestamptz not null default now()
);

create table friend_group_members (
  group_id uuid not null references friend_groups (id) on delete cascade,
  user_id uuid not null references profiles (id) on delete cascade,
  primary key (group_id, user_id)
);

alter table friend_groups enable row level security;
alter table friend_group_members enable row level security;

create policy "owners manage their groups" on friend_groups
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

create policy "owners read their group rosters" on friend_group_members
  for select using (exists (select 1 from friend_groups g where g.id = group_id and g.owner_id = auth.uid()));
create policy "owners add friends to their groups" on friend_group_members
  for insert with check (
    exists (select 1 from friend_groups g where g.id = group_id and g.owner_id = auth.uid())
    and public.are_friends(user_id, auth.uid())
  );
create policy "owners remove people from their groups" on friend_group_members
  for delete using (exists (select 1 from friend_groups g where g.id = group_id and g.owner_id = auth.uid()));

-- ─────────────────────────────────────────────────────────────────────────
-- fit checks (the chats table)
-- ─────────────────────────────────────────────────────────────────────────
alter table chats add column vibe text not null default '';
alter table chats add column weather text not null default '';
alter table chats add column ends_at timestamptz;
alter table chats add column mode text not null default 'vote' check (mode in ('vote', 'ideas'));
alter table chats add column group_id uuid references friend_groups (id) on delete set null;
alter table chats add column decided_suggestion_id uuid;

-- 'public' (everyone on Blueprint) becomes 'community' (your school).
alter table chats drop constraint chats_audience_check;
update chats set audience = 'community' where audience = 'public';
alter table chats add constraint chats_audience_check check (audience in ('community', 'friends', 'group'));

-- Can see the fit check (and vote on it while it's open).
create or replace function public.can_view_chat(p_chat_id uuid, p_uid uuid)
returns boolean
language sql security definer stable
set search_path = public
as $$
  select p_uid is not null and exists (
    select 1
    from chats c
    join profiles creator on creator.id = c.created_by
    where c.id = p_chat_id
      and (
        c.created_by = p_uid
        or public.is_chat_member(c.id, p_uid)
        or (c.audience in ('friends', 'community') and public.are_friends(c.created_by, p_uid))
        or (
          c.audience = 'community'
          and creator.is_public
          and creator.community_id is not null
          and creator.community_id = (select v.community_id from profiles v where v.id = p_uid)
        )
      )
  );
$$;

-- Can comment and suggest looks: the creator's own circle for this fit
-- check (never strangers from the community audience).
create or replace function public.can_participate_in_chat(p_chat_id uuid, p_uid uuid)
returns boolean
language sql security definer stable
set search_path = public
as $$
  select p_uid is not null and exists (
    select 1 from chats c
    where c.id = p_chat_id
      and (
        c.created_by = p_uid
        or public.is_chat_member(c.id, p_uid)
        or (c.audience in ('friends', 'community') and public.are_friends(c.created_by, p_uid))
      )
  );
$$;

create or replace function public.chat_is_open(p_chat_id uuid)
returns boolean
language sql security definer stable
set search_path = public
as $$
  select exists (
    select 1 from chats c
    where c.id = p_chat_id and c.status = 'voting' and (c.ends_at is null or c.ends_at > now())
  );
$$;

drop policy if exists "creator can start a chat; public only from a public profile" on chats;
create policy "creator starts a fit check for an audience they're allowed" on chats
  for insert with check (
    created_by = auth.uid()
    and (
      audience = 'friends'
      or (
        audience = 'community'
        and exists (select 1 from profiles p where p.id = auth.uid() and p.is_public and p.community_id is not null)
      )
      or (
        audience = 'group'
        and exists (select 1 from friend_groups g where g.id = group_id and g.owner_id = auth.uid())
      )
    )
  );

-- Locking in a result is the creator's call, not any member's.
drop policy if exists "members can update their chats" on chats;
create policy "creator updates their fit check" on chats
  for update using (created_by = auth.uid()) with check (created_by = auth.uid());

-- Options: creator only, vote mode only, at most 4, and only pieces the
-- creator can actually see.
alter table chat_options add column image_path text;
alter table chat_options add column position integer not null default 0;

drop policy if exists "members can add options" on chat_options;
create policy "creator adds up to 4 options" on chat_options
  for insert with check (
    exists (select 1 from chats c where c.id = chat_id and c.created_by = auth.uid() and c.mode = 'vote')
    and (select count(*) from chat_options o where o.chat_id = chat_options.chat_id) < 4
    and (cardinality(item_ids) > 0 or image_path is not null)
    and not exists (
      select 1 from unnest(item_ids) as x(item_id)
      where not exists (select 1 from items i where i.id = x.item_id)
    )
  );

drop policy if exists "anyone who can see the chat can vote" on votes;
drop policy if exists "voters can change their own vote" on votes;
create policy "viewers vote while it's open" on votes
  for insert with check (user_id = auth.uid() and public.can_view_chat(chat_id, auth.uid()) and public.chat_is_open(chat_id));
create policy "voters change their vote while it's open" on votes
  for update using (user_id = auth.uid())
  with check (user_id = auth.uid() and public.can_view_chat(chat_id, auth.uid()) and public.chat_is_open(chat_id));

drop policy if exists "members can post their own comments" on chat_comments;
create policy "the creator's circle can comment" on chat_comments
  for insert with check (author_id = auth.uid() and public.can_participate_in_chat(chat_id, auth.uid()));

-- ─────────────────────────────────────────────────────────────────────────
-- suggestions (ideas mode)
-- ─────────────────────────────────────────────────────────────────────────
-- item_ids: pieces from the asker's closet. lend_item_ids: pieces from the
-- suggester's own closet they're offering to lend for this.
create table fit_suggestions (
  id uuid primary key default gen_random_uuid(),
  chat_id uuid not null references chats (id) on delete cascade,
  author_id uuid not null references profiles (id) on delete cascade,
  item_ids uuid[] not null default '{}',
  lend_item_ids uuid[] not null default '{}',
  note text not null default '',
  created_at timestamptz not null default now(),
  check (cardinality(item_ids) + cardinality(lend_item_ids) > 0 or note <> '')
);

alter table fit_suggestions enable row level security;

alter table chats add constraint chats_decided_suggestion_fkey
  foreign key (decided_suggestion_id) references fit_suggestions (id) on delete set null;

create policy "suggestions visible to anyone who can see the fit check" on fit_suggestions
  for select using (public.can_view_chat(chat_id, auth.uid()));

create policy "the creator's circle suggests looks while it's open" on fit_suggestions
  for insert with check (
    author_id = auth.uid()
    and public.can_participate_in_chat(chat_id, auth.uid())
    and public.chat_is_open(chat_id)
    and exists (select 1 from chats c where c.id = chat_id and c.mode = 'ideas' and c.created_by <> auth.uid())
    -- from the asker's closet: theirs, and not private
    and not exists (
      select 1 from unnest(item_ids) as x(item_id)
      where not exists (
        select 1 from items i join chats c on c.id = fit_suggestions.chat_id
        where i.id = x.item_id and i.owner_id = c.created_by and not i.is_private
      )
    )
    -- offered to lend: the suggester's own, and not private
    and not exists (
      select 1 from unnest(lend_item_ids) as x(item_id)
      where not exists (select 1 from items i where i.id = x.item_id and i.owner_id = auth.uid() and not i.is_private)
    )
  );

-- Pieces in a suggestion are visible to whoever can see the fit check,
-- same as pieces in an option (0007). The asker could already see them as
-- a friend; this covers community viewers of a public profile's fit check.
create or replace function public.item_in_visible_chat(p_item_id uuid, p_uid uuid)
returns boolean
language sql security definer stable
set search_path = public
as $$
  select exists (
    select 1 from chat_options o
    where p_item_id = any (o.item_ids) and public.can_view_chat(o.chat_id, p_uid)
  ) or exists (
    select 1 from fit_suggestions s
    where (p_item_id = any (s.item_ids) or p_item_id = any (s.lend_item_ids))
      and public.can_view_chat(s.chat_id, p_uid)
  );
$$;

-- Borrowing: also allowed for a piece a friend explicitly offered to you
-- in a suggestion, even if they haven't opened it to lending generally.
drop policy if exists "friends can request lendable items" on borrow_requests;
create policy "friends can request lendable or offered items" on borrow_requests
  for insert with check (
    requester_id = auth.uid()
    and public.are_friends(owner_id, auth.uid())
    and exists (
      select 1 from items i
      where i.id = borrow_requests.item_id
        and i.owner_id = borrow_requests.owner_id
        and not i.is_private
        and (
          i.lendable
          or exists (
            select 1 from fit_suggestions s join chats c on c.id = s.chat_id
            where s.author_id = i.owner_id and c.created_by = auth.uid() and i.id = any (s.lend_item_ids)
          )
        )
    )
  );

-- ─────────────────────────────────────────────────────────────────────────
-- fit pics: private bucket, readable by whoever can see the fit check
-- ─────────────────────────────────────────────────────────────────────────
-- Mirror selfies don't belong in the public-read bucket. Path is
-- <chat id>/<option id>.<ext>; the app reads them through signed URLs.
insert into storage.buckets (id, name, public)
values ('fit-photos', 'fit-photos', false)
on conflict (id) do nothing;

create or replace function public.fit_photo_chat_id(p_name text)
returns uuid
language sql immutable
as $$
  select case
    when split_part(p_name, '/', 1) ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    then split_part(p_name, '/', 1)::uuid
  end;
$$;

drop policy if exists "fit photos readable by fit check viewers" on storage.objects;
create policy "fit photos readable by fit check viewers" on storage.objects
  for select using (bucket_id = 'fit-photos' and public.can_view_chat(public.fit_photo_chat_id(name), auth.uid()));

drop policy if exists "fit check creators upload fit photos" on storage.objects;
create policy "fit check creators upload fit photos" on storage.objects
  for insert with check (
    bucket_id = 'fit-photos'
    and exists (select 1 from public.chats c where c.id = public.fit_photo_chat_id(name) and c.created_by = auth.uid())
  );

-- ─────────────────────────────────────────────────────────────────────────
-- realtime
-- ─────────────────────────────────────────────────────────────────────────
do $$
begin
  alter publication supabase_realtime add table fit_suggestions;
exception
  when undefined_object then
    raise notice 'supabase_realtime publication not found — enable Realtime for fit_suggestions manually (Database > Replication) if you want live updates';
  when duplicate_object then
    null;
end $$;

commit;
