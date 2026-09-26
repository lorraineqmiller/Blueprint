-- Blueprint — Phase 1 schema (auth, profiles, wardrobe, borrowing)
--
-- Scope: real accounts + a real database for the parts of the app that make
-- sense for a single signed-in user plus arbitrary other signed-up users:
-- profile, wardrobe items, wear history, and borrow requests between real
-- accounts. Group chats / live voting / friend-requests are intentionally
-- NOT part of this migration — see the backend scoping notes for Phase 2.
--
-- Run this once against a fresh Supabase project (SQL editor, or
-- `supabase db push` if you're using the CLI), then set VITE_SUPABASE_URL
-- and VITE_SUPABASE_ANON_KEY in your .env.

create extension if not exists "pgcrypto";

-- ─────────────────────────────────────────────────────────────────────────
-- profiles
-- ─────────────────────────────────────────────────────────────────────────
create table profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null,
  handle text not null unique,
  school text not null default '',
  class_year text not null default '',
  is_public boolean not null default true,
  is_premium boolean not null default false,
  has_completed_onboarding boolean not null default false,
  has_connected_shop boolean not null default false,
  has_connected_gmail boolean not null default false,
  created_at timestamptz not null default now()
);

alter table profiles enable row level security;

-- Anyone signed in can see public profiles (needed to browse lendable
-- closets); a user can always see their own profile even if private.
create policy "profiles are readable" on profiles
  for select using (is_public or id = auth.uid());

create policy "users manage their own profile" on profiles
  for update using (id = auth.uid());

-- New auth.users row -> profile row, seeded from signup metadata
-- (supabase.auth.signUp({ options: { data: { name, handle, school } } })).
create function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, name, handle, school)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'name', 'New User'),
    coalesce(new.raw_user_meta_data ->> 'handle', 'user_' || substr(new.id::text, 1, 8)),
    coalesce(new.raw_user_meta_data ->> 'school', '')
  );
  return new;
end;
$$ language plpgsql security definer set search_path = public;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ─────────────────────────────────────────────────────────────────────────
-- items
-- ─────────────────────────────────────────────────────────────────────────
create table items (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references profiles (id) on delete cascade,
  name text not null,
  brand text not null default '',
  category text not null,
  size text not null default '',
  color text not null default '',
  price_cents integer not null default 0,
  image_url text,
  wear_count integer not null default 0,
  last_worn_at timestamptz,
  lendable boolean not null default false,
  source text not null default 'manual' check (source in ('manual', 'shop', 'gmail')),
  times_lent integer not null default 0,
  always_returned boolean not null default true,
  created_at timestamptz not null default now()
);

alter table items enable row level security;

-- Owner sees everything of their own; everyone else can see it only if
-- it's marked lendable AND the owner's profile is public.
create policy "items readable by owner or as public lendable" on items
  for select using (
    owner_id = auth.uid()
    or (
      lendable
      and exists (select 1 from profiles p where p.id = items.owner_id and p.is_public)
    )
  );

create policy "owner manages their own items" on items
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

-- ─────────────────────────────────────────────────────────────────────────
-- wear_log — one row per item per month, incremented by logWear()
-- ─────────────────────────────────────────────────────────────────────────
create table wear_log (
  item_id uuid not null references items (id) on delete cascade,
  month date not null,
  count integer not null default 0,
  primary key (item_id, month)
);

alter table wear_log enable row level security;

create policy "wear log follows item ownership" on wear_log
  for all using (
    exists (select 1 from items i where i.id = wear_log.item_id and i.owner_id = auth.uid())
  ) with check (
    exists (select 1 from items i where i.id = wear_log.item_id and i.owner_id = auth.uid())
  );

-- ─────────────────────────────────────────────────────────────────────────
-- borrow_requests
-- ─────────────────────────────────────────────────────────────────────────
create table borrow_requests (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references items (id) on delete cascade,
  owner_id uuid not null references profiles (id),
  requester_id uuid not null references profiles (id),
  status text not null default 'waiting' check (status in ('waiting', 'approved', 'declined', 'returned')),
  when_needed text not null,
  note text not null default '',
  created_at timestamptz not null default now()
);

alter table borrow_requests enable row level security;

create policy "requests visible to owner or requester" on borrow_requests
  for select using (owner_id = auth.uid() or requester_id = auth.uid());

create policy "anyone signed in can request to borrow" on borrow_requests
  for insert with check (requester_id = auth.uid());

-- Either side can update their own request (requester cancels, owner
-- approves/declines/marks returned) — tighten this per-column with a
-- Postgres function if you need stricter separation later.
create policy "owner or requester can update a request" on borrow_requests
  for update using (owner_id = auth.uid() or requester_id = auth.uid());
