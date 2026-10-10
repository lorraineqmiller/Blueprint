-- Where you live is only settable once you've verified a school email, and
-- a building has to belong to your own community. Mirrors the locked
-- LocationPicker in the app. Clearing your location (no building, not off
-- campus) is always allowed.

drop policy "users manage their own location" on profile_locations;

create policy "users clear their own location" on profile_locations
  for delete using (user_id = auth.uid());

create policy "users set their own location within their community" on profile_locations
  for insert with check (
    user_id = auth.uid()
    and (
      (building_id is null and not off_campus)
      or exists (
        select 1 from profiles p
        where p.id = auth.uid()
          and p.community_id is not null
          and (
            building_id is null
            or building_id in (select b.id from buildings b where b.community_id = p.community_id)
          )
      )
    )
  );

create policy "users update their own location within their community" on profile_locations
  for update using (user_id = auth.uid()) with check (
    user_id = auth.uid()
    and (
      (building_id is null and not off_campus)
      or exists (
        select 1 from profiles p
        where p.id = auth.uid()
          and p.community_id is not null
          and (
            building_id is null
            or building_id in (select b.id from buildings b where b.community_id = p.community_id)
          )
      )
    )
  );
