-- Blueprint — Phase 2 schema (friend graph, real-time group chats/voting)
--
-- Builds on 0001_init.sql. Run this against the same project after that one.
-- Tightens item visibility from "any public profile" to "public AND an
-- accepted friend," and adds chats/chat_options/votes/chat_comments with a
-- security-definer membership check to avoid RLS self-recursion on
-- chat_members.

-- ─────────────────────────────────────────────────────────────────────────
-- friendships
-- ─────────────────────────────────────────────────────────────────────────
create table friendships (
  requester_id uuid not null references profiles (id) on delete cascade,
  addressee_id uuid not null references profiles (id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'accepted')),
  created_at timestamptz not null default now(),
  primary key (requester_id, addressee_id),
  check (requester_id <> addressee_id)
);

alter table friendships enable row level security;

create policy "friendships visible to either side" on friendships
  for select using (requester_id = auth.uid() or addressee_id = auth.uid());

create policy "anyone can send a friend request" on friendships
  for insert with check (requester_id = auth.uid());

create policy "either side can update (accept/decline)" on friendships
  for update using (requester_id = auth.uid() or addressee_id = auth.uid());

-- Items were visible to anyone if public+lendable in Phase 1; now requires
-- an accepted friendship too, matching "browse FRIENDS' digitized closets."
drop policy if exists "items readable by owner or as public lendable" on items;

create policy "items readable by owner or accepted friend when lendable" on items
  for select using (
    owner_id = auth.uid()
    or (
      lendable
      and exists (select 1 from profiles p where p.id = items.owner_id and p.is_public)
      and exists (
        select 1 from friendships f
        where f.status = 'accepted'
          and (
            (f.requester_id = auth.uid() and f.addressee_id = items.owner_id)
            or (f.addressee_id = auth.uid() and f.requester_id = items.owner_id)
          )
      )
    )
  );

-- ─────────────────────────────────────────────────────────────────────────
-- chats / membership / options / votes / comments
-- ─────────────────────────────────────────────────────────────────────────
create table chats (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  event_name text not null default '',
  location text not null default '',
  event_time text not null default '',
  status text not null default 'voting' check (status in ('voting', 'decided')),
  decided_option_id uuid,
  voting_closes_label text not null default 'open',
  created_by uuid not null references profiles (id),
  created_at timestamptz not null default now()
);

create table chat_members (
  chat_id uuid not null references chats (id) on delete cascade,
  user_id uuid not null references profiles (id) on delete cascade,
  primary key (chat_id, user_id)
);

create table chat_options (
  id uuid primary key default gen_random_uuid(),
  chat_id uuid not null references chats (id) on delete cascade,
  label text not null,
  item_ids uuid[] not null default '{}'
);

create table votes (
  chat_id uuid not null references chats (id) on delete cascade,
  user_id uuid not null references profiles (id) on delete cascade,
  option_id uuid not null references chat_options (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (chat_id, user_id)
);

create table chat_comments (
  id uuid primary key default gen_random_uuid(),
  chat_id uuid not null references chats (id) on delete cascade,
  author_id uuid not null references profiles (id),
  text text not null,
  created_at timestamptz not null default now()
);

-- A plain RLS policy on chat_members that queries chat_members again would
-- hit "infinite recursion detected in policy" — routing the membership
-- check through a security-definer function sidesteps that entirely.
create function public.is_chat_member(p_chat_id uuid, p_user_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from chat_members
    where chat_id = p_chat_id and user_id = p_user_id
  );
$$;

alter table chats enable row level security;
alter table chat_members enable row level security;
alter table chat_options enable row level security;
alter table votes enable row level security;
alter table chat_comments enable row level security;

create policy "members can read their chats" on chats
  for select using (public.is_chat_member(id, auth.uid()));
create policy "creator can start a chat" on chats
  for insert with check (created_by = auth.uid());
create policy "members can update their chats" on chats
  for update using (public.is_chat_member(id, auth.uid()));

create policy "members can read the roster" on chat_members
  for select using (public.is_chat_member(chat_id, auth.uid()));
create policy "creator seeds the roster, members can add themselves" on chat_members
  for insert with check (
    user_id = auth.uid()
    or exists (select 1 from chats c where c.id = chat_members.chat_id and c.created_by = auth.uid())
  );

create policy "members can read options" on chat_options
  for select using (public.is_chat_member(chat_id, auth.uid()));
create policy "members can add options" on chat_options
  for insert with check (public.is_chat_member(chat_id, auth.uid()));

create policy "members can read votes" on votes
  for select using (public.is_chat_member(chat_id, auth.uid()));
create policy "members can cast their own vote" on votes
  for insert with check (user_id = auth.uid() and public.is_chat_member(chat_id, auth.uid()));
create policy "members can change their own vote" on votes
  for update using (user_id = auth.uid());

create policy "members can read comments" on chat_comments
  for select using (public.is_chat_member(chat_id, auth.uid()));
create policy "members can post their own comments" on chat_comments
  for insert with check (author_id = auth.uid() and public.is_chat_member(chat_id, auth.uid()));

-- Realtime: broadcast row changes on the tables the Live Vote screen
-- subscribes to (RLS above still applies per-subscriber).
alter publication supabase_realtime add table votes;
alter publication supabase_realtime add table chat_comments;
alter publication supabase_realtime add table chats;
