-- Access rules for signed-in users (the `authenticated` role).
-- The Admin reads and writes everything. Leaders and assistant leaders have the
-- same rights: they see only the groups they serve, and file and edit reports
-- for those groups. Deactivated profiles get no access at all. Nobody deletes
-- groups or reports; groups are closed instead.
-- The server-side secret key bypasses these rules and is used for account
-- management after the app has checked that the caller is the Admin.

-- Helpers. They are security definer so policies can look up the caller's
-- profile and groups without triggering the policies on those tables again.

-- The caller's profile id, or null when signed out, unknown or deactivated.
create function public.current_profile_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select p.id
  from public.profiles p
  where p.auth_user_id = auth.uid() and p.active;
$$;

-- True when the caller is an active Admin.
create function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles p
    where p.auth_user_id = auth.uid() and p.active and p.is_admin
  );
$$;

-- True when the caller is an active leader or assistant leader of the group.
create function public.is_group_member(group_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.group_leaders gl
    join public.profiles p on p.id = gl.profile_id
    where gl.group_id = is_group_member.group_id and p.auth_user_id = auth.uid() and p.active
  );
$$;

revoke execute on function public.current_profile_id() from public, anon;
revoke execute on function public.is_admin() from public, anon;
revoke execute on function public.is_group_member(uuid) from public, anon;
grant execute on function public.current_profile_id() to authenticated;
grant execute on function public.is_admin() to authenticated;
grant execute on function public.is_group_member(uuid) to authenticated;

-- Profiles: everyone sees their own profile and the people in their groups,
-- that is co-leaders and whoever filed reports for the group, so names can be
-- shown. Only the Admin adds or edits people; profiles are never deleted.
create policy "Read own, group and admin-visible profiles" on public.profiles
  for select to authenticated
  using (
    (select public.is_admin())
    or id = (select public.current_profile_id())
    or exists (
      select 1 from public.group_leaders gl
      where gl.profile_id = profiles.id and public.is_group_member(gl.group_id)
    )
    or exists (
      select 1 from public.reports r
      where r.filed_by = profiles.id and public.is_group_member(r.group_id)
    )
  );

create policy "Admin adds profiles" on public.profiles
  for insert to authenticated
  with check ((select public.is_admin()));

create policy "Admin edits profiles" on public.profiles
  for update to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

-- Groups: leaders see and edit (name, photo, ...) only their own groups. Only
-- the Admin creates groups. No delete policy: groups are closed instead.
create policy "Read own groups" on public.groups
  for select to authenticated
  using ((select public.is_admin()) or public.is_group_member(id));

create policy "Admin creates groups" on public.groups
  for insert to authenticated
  with check ((select public.is_admin()));

create policy "Edit own groups" on public.groups
  for update to authenticated
  using ((select public.is_admin()) or public.is_group_member(id))
  with check ((select public.is_admin()) or public.is_group_member(id));

-- Group leaders: leaders see who serves their groups. Only the Admin assigns
-- or removes leaders.
create policy "Read leaders of own groups" on public.group_leaders
  for select to authenticated
  using ((select public.is_admin()) or public.is_group_member(group_id));

create policy "Admin assigns leaders" on public.group_leaders
  for insert to authenticated
  with check ((select public.is_admin()));

create policy "Admin changes leader roles" on public.group_leaders
  for update to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

create policy "Admin removes leaders" on public.group_leaders
  for delete to authenticated
  using ((select public.is_admin()));

-- Reports: leaders see, file and edit reports of their own groups. A report is
-- always filed in the caller's own name; the Admin may file for any group.
-- No delete policy: reports are kept (plans are cancelled instead).
create policy "Read reports of own groups" on public.reports
  for select to authenticated
  using ((select public.is_admin()) or public.is_group_member(group_id));

create policy "File reports for own groups" on public.reports
  for insert to authenticated
  with check (
    filed_by = (select public.current_profile_id())
    and ((select public.is_admin()) or public.is_group_member(group_id))
  );

create policy "Edit reports of own groups" on public.reports
  for update to authenticated
  using ((select public.is_admin()) or public.is_group_member(group_id))
  with check ((select public.is_admin()) or public.is_group_member(group_id));
