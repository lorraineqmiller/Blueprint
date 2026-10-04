-- Blueprint — school communities, building-level location, and the
-- friends-first privacy model.
--
-- Run after 0001-0006. Wrapped in one transaction: it drops and recreates
-- a lot of policies, and a half-applied version of that would be worse
-- than either the old or the new state.
--
-- What changes:
--   * Sign up with any email. Separately verify a school email (.edu) to
--     join that school's community — the code is emailed by the
--     send-school-verification edge function and checked by
--     verify_school_email() below. Columbia + Barnard only for now.
--   * Location is a building from the `buildings` table (with real
--     coordinates) or a private off-campus address. Floor is gone. Raw
--     coordinates are never readable by anyone else — friends only get a
--     rounded distance from friend_distances().
--   * Profiles: everyone signed in can see name/handle/photo/bio (so you
--     can find and add a private account), but closets, location and
--     borrowing are friends-only for everyone, and items can be private
--     to their owner.
--   * Fit checks: friends-only by default; a public profile can post one
--     publicly, which anyone signed in can view and vote on.

begin;

-- ─────────────────────────────────────────────────────────────────────────
-- helpers
-- ─────────────────────────────────────────────────────────────────────────
create or replace function public.are_friends(a uuid, b uuid)
returns boolean
language sql security definer stable
set search_path = public
as $$
  select exists (
    select 1 from friendships f
    where f.status = 'accepted'
      and ((f.requester_id = a and f.addressee_id = b) or (f.requester_id = b and f.addressee_id = a))
  );
$$;

-- ─────────────────────────────────────────────────────────────────────────
-- communities
-- ─────────────────────────────────────────────────────────────────────────
-- kind = 'city' is reserved for opening up beyond schools later (no email
-- domain, joined some other way).
create table communities (
  id text primary key,
  name text not null,
  kind text not null default 'school' check (kind in ('school', 'city')),
  created_at timestamptz not null default now()
);

-- Subdomains match too (e.g. cumc.columbia.edu -> columbia.edu).
create table community_domains (
  domain text primary key,
  community_id text not null references communities (id) on delete cascade,
  school_name text not null
);

insert into communities (id, name, kind) values ('columbia-barnard', 'Columbia & Barnard', 'school');
insert into community_domains (domain, community_id, school_name) values
  ('columbia.edu', 'columbia-barnard', 'Columbia University'),
  ('barnard.edu', 'columbia-barnard', 'Barnard College');

alter table communities enable row level security;
alter table community_domains enable row level security;
create policy "communities are readable" on communities for select using (true);
create policy "community domains are readable" on community_domains for select using (true);

alter table profiles add column community_id text references communities (id);
alter table profiles add column bio text not null default '';

-- community_id and school only change through verify_school_email() —
-- otherwise anyone could write themselves into a community via a plain
-- profile update. Inside that security-definer function current_user is
-- the function owner, not 'authenticated', so it passes this check.
create or replace function public.guard_profile_columns()
returns trigger
language plpgsql
as $$
begin
  if current_user in ('authenticated', 'anon')
     and (new.community_id is distinct from old.community_id or new.school is distinct from old.school) then
    raise exception 'community and school are set by verifying a school email';
  end if;
  return new;
end;
$$;

create trigger guard_profile_columns
  before update on profiles
  for each row execute procedure public.guard_profile_columns();

-- Signup no longer takes a self-reported school — it comes from
-- verification. Same collision handling as 0003.
create or replace function public.handle_new_user()
returns trigger as $$
declare
  requested_handle text;
begin
  requested_handle := coalesce(new.raw_user_meta_data ->> 'handle', 'user_' || substr(new.id::text, 1, 8));
  begin
    insert into public.profiles (id, name, handle)
    values (new.id, coalesce(new.raw_user_meta_data ->> 'name', 'New User'), requested_handle);
  exception when unique_violation then
    insert into public.profiles (id, name, handle)
    values (new.id, coalesce(new.raw_user_meta_data ->> 'name', 'New User'), requested_handle || '_' || substr(new.id::text, 1, 6));
  end;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

-- ─────────────────────────────────────────────────────────────────────────
-- school email verification
-- ─────────────────────────────────────────────────────────────────────────
-- No client policies at all: code_hash is a sha256 of a 6-digit code, so
-- letting a client read it would make the code trivially brute-forceable
-- offline. The edge function writes with the service role; clients read
-- their own status through my_school_email().
create table school_email_verifications (
  user_id uuid primary key references profiles (id) on delete cascade,
  email text,
  verified_at timestamptz,
  pending_email text,
  code_hash text,
  code_expires_at timestamptz,
  code_sent_at timestamptz,
  attempts integer not null default 0
);

alter table school_email_verifications enable row level security;

-- One account per school email.
create unique index school_email_verifications_email_key
  on school_email_verifications (lower(email)) where email is not null;

create or replace function public.my_school_email()
returns table (email text, verified_at timestamptz, pending_email text)
language sql security definer stable
set search_path = public
as $$
  select v.email, v.verified_at, v.pending_email from school_email_verifications v where v.user_id = auth.uid();
$$;

-- Returns a status rather than raising, so a wrong guess still commits the
-- attempts counter (a raise would roll it back and allow unlimited tries).
create or replace function public.verify_school_email(p_code text)
returns text
language plpgsql security definer
set search_path = public, extensions
as $$
declare
  v school_email_verifications%rowtype;
  v_domain text;
  v_community text;
  v_school text;
begin
  select * into v from school_email_verifications where user_id = auth.uid() for update;
  if not found or v.pending_email is null then return 'no_pending'; end if;
  if v.code_expires_at < now() then return 'expired'; end if;
  if v.attempts >= 5 then return 'too_many_attempts'; end if;

  if v.code_hash is distinct from encode(digest(trim(p_code) || ':' || auth.uid()::text, 'sha256'), 'hex') then
    update school_email_verifications set attempts = attempts + 1 where user_id = auth.uid();
    return 'incorrect';
  end if;

  if exists (
    select 1 from school_email_verifications
    where lower(email) = lower(v.pending_email) and user_id <> auth.uid()
  ) then
    return 'email_taken';
  end if;

  v_domain := split_part(lower(v.pending_email), '@', 2);
  select d.community_id, d.school_name into v_community, v_school
  from community_domains d
  where v_domain = d.domain or v_domain like '%.' || d.domain
  order by length(d.domain) desc
  limit 1;
  if v_community is null then return 'unsupported_domain'; end if;

  update school_email_verifications
  set email = pending_email, verified_at = now(), pending_email = null,
      code_hash = null, code_expires_at = null, attempts = 0
  where user_id = auth.uid();

  update profiles set community_id = v_community, school = v_school where id = auth.uid();
  return 'verified';
end;
$$;

-- ─────────────────────────────────────────────────────────────────────────
-- buildings + location
-- ─────────────────────────────────────────────────────────────────────────
-- Mirrors src/data/buildings.ts. Coordinates are approximate entrances.
create table buildings (
  id text primary key,
  community_id text not null references communities (id) on delete cascade,
  school text not null,
  name text not null,
  lat double precision not null,
  lng double precision not null
);

alter table buildings enable row level security;
create policy "buildings are readable" on buildings for select using (true);

insert into buildings (id, community_id, school, name, lat, lng) values
  ('carman', 'columbia-barnard', 'Columbia', 'Carman Hall', 40.80656, -73.96416),
  ('john-jay', 'columbia-barnard', 'Columbia', 'John Jay Hall', 40.80614, -73.96222),
  ('furnald', 'columbia-barnard', 'Columbia', 'Furnald Hall', 40.80737, -73.96449),
  ('hartley', 'columbia-barnard', 'Columbia', 'Hartley Hall', 40.80655, -73.96182),
  ('wallach', 'columbia-barnard', 'Columbia', 'Wallach Hall', 40.80688, -73.96154),
  ('east-campus', 'columbia-barnard', 'Columbia', 'East Campus', 40.80747, -73.95943),
  ('wien', 'columbia-barnard', 'Columbia', 'Wien Hall', 40.80574, -73.96004),
  ('broadway', 'columbia-barnard', 'Columbia', 'Broadway Hall', 40.80585, -73.96506),
  ('hogan', 'columbia-barnard', 'Columbia', 'Hogan Hall', 40.80637, -73.96543),
  ('mcbain', 'columbia-barnard', 'Columbia', 'McBain Hall', 40.80557, -73.96582),
  ('schapiro', 'columbia-barnard', 'Columbia', 'Schapiro Hall', 40.80746, -73.96651),
  ('river', 'columbia-barnard', 'Columbia', 'River Hall', 40.80789, -73.96754),
  ('watt', 'columbia-barnard', 'Columbia', 'Watt Hall', 40.80508, -73.96506),
  ('woodbridge', 'columbia-barnard', 'Columbia', 'Woodbridge Hall', 40.80838, -73.96833),
  ('ruggles', 'columbia-barnard', 'Columbia', 'Ruggles Hall', 40.80663, -73.96646),
  ('harmony', 'columbia-barnard', 'Columbia', 'Harmony Hall', 40.80301, -73.96348),
  ('47-claremont', 'columbia-barnard', 'Columbia', '47 Claremont', 40.81013, -73.96351),
  ('sulzberger', 'columbia-barnard', 'Barnard', 'Sulzberger Hall', 40.80834, -73.96405),
  ('brooks', 'columbia-barnard', 'Barnard', 'Brooks Hall', 40.80815, -73.96434),
  ('hewitt', 'columbia-barnard', 'Barnard', 'Hewitt Hall', 40.80826, -73.96458),
  ('reid', 'columbia-barnard', 'Barnard', 'Reid Hall', 40.80802, -73.96411),
  ('elliott', 'columbia-barnard', 'Barnard', 'Elliott Hall', 40.81049, -73.96328),
  ('plimpton', 'columbia-barnard', 'Barnard', 'Plimpton Hall', 40.81061, -73.95883),
  ('600-w-116', 'columbia-barnard', 'Barnard', '600 West 116th', 40.80795, -73.96543),
  ('616-w-116', 'columbia-barnard', 'Barnard', '616 West 116th', 40.80818, -73.96600),
  ('620-w-116', 'columbia-barnard', 'Barnard', '620 West 116th', 40.80829, -73.96628),
  ('cathedral-gardens', 'columbia-barnard', 'Barnard', 'Cathedral Gardens', 40.80143, -73.95812);

-- Which building you live in (or just "off campus") — friends can see this.
create table profile_locations (
  user_id uuid primary key references profiles (id) on delete cascade,
  building_id text references buildings (id),
  off_campus boolean not null default false,
  updated_at timestamptz not null default now(),
  check (not (off_campus and building_id is not null))
);

alter table profile_locations enable row level security;
create policy "location visible to self and friends" on profile_locations
  for select using (user_id = auth.uid() or public.are_friends(user_id, auth.uid()));
create policy "users manage their own location" on profile_locations
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Only you ever read this: phone number (for contact matching later) and
-- the exact off-campus address + its geocoded coordinates.
create table profile_private (
  user_id uuid primary key references profiles (id) on delete cascade,
  phone text not null default '',
  off_campus_address text not null default '',
  off_campus_lat double precision,
  off_campus_lng double precision
);

alter table profile_private enable row level security;
create policy "users manage their own private profile" on profile_private
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Carry over any free-text building that matches a real hall; floor and
-- unmatched text are dropped (people re-pick from the dropdown).
insert into profile_locations (user_id, building_id)
select p.id, b.id
from profiles p
join buildings b on lower(trim(p.building)) = lower(b.name)
on conflict (user_id) do nothing;

alter table profiles drop column building;
alter table profiles drop column floor;

-- Internal: raw coordinates for one user. Execute is revoked below so no
-- client can call it directly — only friend_distances() (which runs as the
-- owner) can.
create or replace function public.user_coords(p_uid uuid, out lat double precision, out lng double precision)
language sql security definer stable
set search_path = public
as $$
  select coalesce(b.lat, pp.off_campus_lat), coalesce(b.lng, pp.off_campus_lng)
  from profile_locations l
  left join buildings b on b.id = l.building_id
  left join profile_private pp on pp.user_id = l.user_id and l.off_campus
  where l.user_id = p_uid;
$$;

revoke execute on function public.user_coords(uuid) from public, anon, authenticated;

-- Walking distance to each accepted friend, rounded to 100 m so an
-- off-campus friend's address can't be pinned down by moving your own
-- location around and triangulating.
create or replace function public.friend_distances()
returns table (friend_id uuid, meters integer)
language sql security definer stable
set search_path = public
as $$
  with me as (select * from public.user_coords(auth.uid())),
  fr as (
    select case when f.requester_id = auth.uid() then f.addressee_id else f.requester_id end as id
    from friendships f
    where f.status = 'accepted' and auth.uid() in (f.requester_id, f.addressee_id)
  )
  select
    fr.id,
    (round(
      2 * 6371000 * asin(sqrt(
        power(sin(radians(c.lat - me.lat) / 2), 2)
        + cos(radians(me.lat)) * cos(radians(c.lat)) * power(sin(radians(c.lng - me.lng) / 2), 2)
      )) / 100
    ) * 100)::integer
  from fr
  cross join me
  cross join lateral public.user_coords(fr.id) c
  where me.lat is not null and c.lat is not null;
$$;

-- ─────────────────────────────────────────────────────────────────────────
-- profiles: readable by anyone signed in
-- ─────────────────────────────────────────────────────────────────────────
-- Name/handle/photo/bio only — closets, location and phone all live
-- behind their own friends-only/self-only policies now. This also fixes
-- friends being unable to load a private friend's profile at all.
drop policy if exists "profiles are readable" on profiles;
create policy "profiles readable when signed in" on profiles
  for select to authenticated using (true);

-- Signup checks availability before there's a session, so it can't read
-- profiles directly any more.
create or replace function public.is_handle_available(p_handle text)
returns boolean
language sql security definer stable
set search_path = public
as $$
  select not exists (select 1 from profiles where lower(handle) = lower(p_handle));
$$;
grant execute on function public.is_handle_available(text) to anon, authenticated;

-- ─────────────────────────────────────────────────────────────────────────
-- fit checks: friends-only or public
-- ─────────────────────────────────────────────────────────────────────────
alter table chats add column audience text not null default 'friends' check (audience in ('friends', 'public'));

-- Public fit checks stop being public the moment the creator's profile
-- goes private — no need to rewrite their old rows.
create or replace function public.can_view_chat(p_chat_id uuid, p_uid uuid)
returns boolean
language sql security definer stable
set search_path = public
as $$
  select public.is_chat_member(p_chat_id, p_uid)
    or (
      p_uid is not null
      and exists (
        select 1 from chats c join profiles p on p.id = c.created_by
        where c.id = p_chat_id and c.audience = 'public' and p.is_public
      )
    );
$$;

drop policy if exists "members can read their chats" on chats;
drop policy if exists "creator can start a chat" on chats;
create policy "chat visible to members, or anyone if public" on chats
  for select using (public.can_view_chat(id, auth.uid()));
create policy "creator can start a chat; public only from a public profile" on chats
  for insert with check (
    created_by = auth.uid()
    and (audience = 'friends' or exists (select 1 from profiles p where p.id = auth.uid() and p.is_public))
  );

-- The roster is the creator plus their friends — no adding strangers.
drop policy if exists "members can read the roster" on chat_members;
drop policy if exists "creator seeds the roster, members can add themselves" on chat_members;
create policy "roster visible to anyone who can see the chat" on chat_members
  for select using (public.can_view_chat(chat_id, auth.uid()));
create policy "creator adds themselves and their friends" on chat_members
  for insert with check (
    exists (select 1 from chats c where c.id = chat_members.chat_id and c.created_by = auth.uid())
    and (user_id = auth.uid() or public.are_friends(user_id, auth.uid()))
  );

drop policy if exists "members can read options" on chat_options;
create policy "options visible to anyone who can see the chat" on chat_options
  for select using (public.can_view_chat(chat_id, auth.uid()));

drop policy if exists "members can read votes" on votes;
drop policy if exists "members can cast their own vote" on votes;
drop policy if exists "members can change their own vote" on votes;
create policy "votes visible to anyone who can see the chat" on votes
  for select using (public.can_view_chat(chat_id, auth.uid()));
create policy "anyone who can see the chat can vote" on votes
  for insert with check (user_id = auth.uid() and public.can_view_chat(chat_id, auth.uid()));
create policy "voters can change their own vote" on votes
  for update using (user_id = auth.uid()) with check (public.can_view_chat(chat_id, auth.uid()));

-- Comments stay members-only (i.e. the creator's friends) even on public
-- fit checks — strangers can vote, not post.
drop policy if exists "members can read comments" on chat_comments;
create policy "comments visible to anyone who can see the chat" on chat_comments
  for select using (public.can_view_chat(chat_id, auth.uid()));

create index chat_options_item_ids_idx on chat_options using gin (item_ids);

-- ─────────────────────────────────────────────────────────────────────────
-- items: friends browse your closet; private items are owner-only
-- ─────────────────────────────────────────────────────────────────────────
alter table items add column is_private boolean not null default false;

-- A private item can't be lendable — nobody else could ever see it.
update items set lendable = false where is_private;
alter table items add constraint items_private_not_lendable check (not (is_private and lendable));

-- Items you deliberately put in a fit check are visible to whoever can see
-- that fit check, even if they're not your friend (public fit checks).
create or replace function public.item_in_visible_chat(p_item_id uuid, p_uid uuid)
returns boolean
language sql security definer stable
set search_path = public
as $$
  select exists (
    select 1 from chat_options o
    where p_item_id = any (o.item_ids) and public.can_view_chat(o.chat_id, p_uid)
  );
$$;

drop policy if exists "items readable by owner or accepted friend when lendable" on items;
create policy "items readable by owner, friends, or via a visible fit check" on items
  for select using (
    owner_id = auth.uid()
    or (not is_private and public.are_friends(owner_id, auth.uid()))
    or public.item_in_visible_chat(id, auth.uid())
  );

-- Borrowing: friends only, and only items the owner has opened to lending.
drop policy if exists "anyone signed in can request to borrow" on borrow_requests;
create policy "friends can request lendable items" on borrow_requests
  for insert with check (
    requester_id = auth.uid()
    and public.are_friends(owner_id, auth.uid())
    and exists (
      select 1 from items i
      where i.id = borrow_requests.item_id
        and i.owner_id = borrow_requests.owner_id
        and i.lendable
        and not i.is_private
    )
  );

commit;
