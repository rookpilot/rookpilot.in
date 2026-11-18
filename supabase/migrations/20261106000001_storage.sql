-- File storage. Two private buckets; who can reach a file depends on the folders in its path,
-- using the same membership rules as the tables:
--   contact-photos/<owner id>/<contact id>/<file>
--   attachments/<building id>/<attachment id>/<file name>

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('contact-photos', 'contact-photos', false, 5242880, array['image/jpeg', 'image/png', 'image/webp']),
  ('attachments', 'attachments', false, 26214400, array['image/*', 'application/pdf']);

-- A folder name as an id, or null when it isn't one, so a bad path is refused instead of erroring.
create function private.try_uuid(value text)
returns uuid
language plpgsql
immutable
set search_path = ''
as $$
begin
  return value::uuid;
exception when invalid_text_representation then
  return null;
end;
$$;

grant execute on function private.try_uuid(text) to authenticated;

-- Contact photos: you manage photos in your own folder. Members of a shared building
-- also see photos of contacts tagged there.
create policy "People upload photos to their own folder"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'contact-photos' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "People see their contacts' photos and ones tagged in their buildings"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'contact-photos'
    and (
      (storage.foldername(name))[1] = (select auth.uid())::text
      or private.can_see_contact(private.try_uuid((storage.foldername(name))[2]))
    )
  );

create policy "People replace photos in their own folder"
  on storage.objects for update to authenticated
  using (bucket_id = 'contact-photos' and (storage.foldername(name))[1] = (select auth.uid())::text)
  with check (bucket_id = 'contact-photos' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "People delete photos in their own folder"
  on storage.objects for delete to authenticated
  using (bucket_id = 'contact-photos' and (storage.foldername(name))[1] = (select auth.uid())::text);

-- Attachments: members of the building in the first folder can do everything.
create policy "Members manage their buildings' files"
  on storage.objects for all to authenticated
  using (bucket_id = 'attachments' and private.is_building_member(private.try_uuid((storage.foldername(name))[1])))
  with check (bucket_id = 'attachments' and private.is_building_member(private.try_uuid((storage.foldername(name))[1])));
