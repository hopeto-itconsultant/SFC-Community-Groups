-- Private photo buckets. Files are only reachable through signed URLs or the
-- signed-in user's session, never by public link.
--
-- Object path convention, for both buckets: `<group_id>/<file name>`, e.g.
-- `0f8b.../cover.webp` in group-photos or `0f8b.../<report id>-1.jpg` in
-- report-photos. The first folder decides which group the file belongs to.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('group-photos', 'group-photos', false, 5242880, array['image/jpeg', 'image/png', 'image/webp']),
  ('report-photos', 'report-photos', false, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

-- The group an object belongs to, from the first folder of its path. Null when
-- that folder is missing or not a uuid, so such paths match no group.
create function public.storage_group_id(object_name text)
returns uuid
language sql
stable
set search_path = ''
as $$
  select case
    when (storage.foldername(object_name))[1]
      ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    then (storage.foldername(object_name))[1]::uuid
  end;
$$;

revoke execute on function public.storage_group_id(text) from public, anon;
grant execute on function public.storage_group_id(text) to authenticated;

-- Group photos: the Admin manages all of them, leaders those of their groups.
create policy "Read group photos" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'group-photos'
    and ((select public.is_admin()) or public.is_group_member(public.storage_group_id(name)))
  );

create policy "Upload group photos" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'group-photos'
    and ((select public.is_admin()) or public.is_group_member(public.storage_group_id(name)))
  );

create policy "Replace group photos" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'group-photos'
    and ((select public.is_admin()) or public.is_group_member(public.storage_group_id(name)))
  )
  with check (
    bucket_id = 'group-photos'
    and ((select public.is_admin()) or public.is_group_member(public.storage_group_id(name)))
  );

create policy "Delete group photos" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'group-photos'
    and ((select public.is_admin()) or public.is_group_member(public.storage_group_id(name)))
  );

-- Report photos: same rules, keyed on the report's group.
create policy "Read report photos" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'report-photos'
    and ((select public.is_admin()) or public.is_group_member(public.storage_group_id(name)))
  );

create policy "Upload report photos" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'report-photos'
    and ((select public.is_admin()) or public.is_group_member(public.storage_group_id(name)))
  );

create policy "Replace report photos" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'report-photos'
    and ((select public.is_admin()) or public.is_group_member(public.storage_group_id(name)))
  )
  with check (
    bucket_id = 'report-photos'
    and ((select public.is_admin()) or public.is_group_member(public.storage_group_id(name)))
  );

create policy "Delete report photos" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'report-photos'
    and ((select public.is_admin()) or public.is_group_member(public.storage_group_id(name)))
  );
