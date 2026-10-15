-- A leader may update personal details on their own profile, and on the
-- assistant leaders of a group they lead. Phone, login, role and active
-- status stay with the Admin. Assistant leaders cannot edit these details.

-- True when the caller is an active leader of some group, and the profile is
-- their own or an assistant leader of a group they lead. Admins are excluded
-- here; they already have their own update policy.
create function public.can_edit_leader_details(target_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.group_leaders mine
    join public.profiles me on me.id = mine.profile_id
    where me.auth_user_id = auth.uid()
      and me.active
      and not me.is_admin
      and mine.role = 'leader'
      and (
        target_id = me.id
        or exists (
          select 1
          from public.group_leaders theirs
          join public.profiles target on target.id = theirs.profile_id
          where theirs.group_id = mine.group_id
            and theirs.profile_id = target_id
            and theirs.role = 'asst-leader'
            and not target.is_admin
        )
      )
  );
$$;

revoke execute on function public.can_edit_leader_details(uuid) from public, anon;
grant execute on function public.can_edit_leader_details(uuid) to authenticated;

create policy "Leaders edit own and assistant details" on public.profiles
  for update to authenticated
  using ((select public.can_edit_leader_details(id)))
  with check ((select public.can_edit_leader_details(id)));

-- Row rules say which profile a leader may update. This keeps the update to
-- name, date of birth, email and the date they started serving.
create function public.protect_profile_account_fields()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  -- Signed-in Admins, and the service role used after an Admin check, may
  -- change any column. Everyone else is limited to personal details.
  if current_user is distinct from 'authenticated' or (select public.is_admin()) then
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

revoke execute on function public.protect_profile_account_fields() from public, anon, authenticated;

create trigger profiles_protect_account_fields
  before update on public.profiles
  for each row execute function public.protect_profile_account_fields();
