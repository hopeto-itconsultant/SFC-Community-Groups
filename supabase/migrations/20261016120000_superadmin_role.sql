-- Superadmin role: profiles.is_superadmin (with is_admin), hidden from other
-- authenticated users, uniquely unlocks activity log reads and (in app) login-as.

alter table public.profiles
  add column is_superadmin boolean not null default false;

alter table public.profiles
  add constraint profiles_superadmin_implies_admin
  check (is_superadmin = false or is_admin = true);

-- True when the caller is an active superadmin.
create function public.is_superadmin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles p
    where p.auth_user_id = auth.uid() and p.active and p.is_superadmin
  );
$$;

revoke execute on function public.is_superadmin() from public, anon;
grant execute on function public.is_superadmin() to authenticated;

-- Superadmin profile rows are visible only to themselves or another superadmin.
drop policy "Read own, group and admin-visible profiles" on public.profiles;
create policy "Read own, group and admin-visible profiles" on public.profiles
  for select to authenticated
  using (
    (
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
    )
    and (
      not is_superadmin
      or id = (select public.current_profile_id())
      or (select public.is_superadmin())
    )
  );

-- Activity log: only superadmins may read (writes stay service-role only).
drop policy "Admins read activity log" on public.activity_log;
create policy "Superadmins read activity log" on public.activity_log
  for select to authenticated
  using ((select public.is_superadmin()));

-- Protect is_superadmin: authenticated users (including normal admins) cannot
-- change it. Only the service role (non-authenticated DB role) may flip it.
create or replace function public.protect_profile_account_fields()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  -- Service role (and other non-JWT roles) may change any column.
  if current_user is distinct from 'authenticated' then
    return new;
  end if;

  -- No authenticated caller may promote or demote superadmin.
  if new.is_superadmin is distinct from old.is_superadmin then
    raise exception 'Only the service role can change superadmin';
  end if;

  -- Signed-in Admins may change other account fields.
  if (select public.is_admin()) then
    return new;
  end if;

  if new.id is distinct from old.id
    or new.auth_user_id is distinct from old.auth_user_id
    or new.mobile is distinct from old.mobile
    or new.is_admin is distinct from old.is_admin
    or new.active is distinct from old.active
    or new.username is distinct from old.username
    or new.created_at is distinct from old.created_at
  then
    raise exception 'Only an Admin can change account fields';
  end if;
  return new;
end;
$$;
