-- Photo upload for wardrobe items (items.image_url already existed, unused
-- until now) and profile pictures (new avatar_url column). One shared
-- public-read bucket, split by a per-user folder so RLS can scope writes:
-- <user id>/items/<item id>.<ext> and <user id>/avatar.<ext>.
alter table profiles add column avatar_url text;

insert into storage.buckets (id, name, public)
values ('public-media', 'public-media', true)
on conflict (id) do nothing;

drop policy if exists "public-media is publicly readable" on storage.objects;
create policy "public-media is publicly readable" on storage.objects
  for select using (bucket_id = 'public-media');

drop policy if exists "users upload into their own public-media folder" on storage.objects;
create policy "users upload into their own public-media folder" on storage.objects
  for insert with check (
    bucket_id = 'public-media' and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "users update their own public-media files" on storage.objects;
create policy "users update their own public-media files" on storage.objects
  for update using (
    bucket_id = 'public-media' and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "users delete their own public-media files" on storage.objects;
create policy "users delete their own public-media files" on storage.objects
  for delete using (
    bucket_id = 'public-media' and (storage.foldername(name))[1] = auth.uid()::text
  );
