-- Fixes "Database error saving new user" on sign-up: profiles.handle is
-- UNIQUE, but the signup trigger just used whatever handle Join.tsx derived
-- from the name (e.g. "Anna Yang" -> "@annayang") with no collision
-- handling, so a repeat name (very likely during testing, but also a real
-- production case for e.g. two "John Smith"s) made the trigger's INSERT
-- fail — and a failing trigger fails the whole auth.users insert, which
-- Supabase reports as this generic error rather than anything mentioning
-- "handle".
--
-- Falls back to appending part of the new user's id when the requested
-- handle is already taken, so sign-up can never fail on this account.
create or replace function public.handle_new_user()
returns trigger as $$
declare
  requested_handle text;
begin
  requested_handle := coalesce(new.raw_user_meta_data ->> 'handle', 'user_' || substr(new.id::text, 1, 8));

  begin
    insert into public.profiles (id, name, handle, school)
    values (
      new.id,
      coalesce(new.raw_user_meta_data ->> 'name', 'New User'),
      requested_handle,
      coalesce(new.raw_user_meta_data ->> 'school', '')
    );
  exception when unique_violation then
    insert into public.profiles (id, name, handle, school)
    values (
      new.id,
      coalesce(new.raw_user_meta_data ->> 'name', 'New User'),
      requested_handle || '_' || substr(new.id::text, 1, 6),
      coalesce(new.raw_user_meta_data ->> 'school', '')
    );
  end;

  return new;
end;
$$ language plpgsql security definer set search_path = public;
