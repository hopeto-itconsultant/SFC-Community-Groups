-- Fellowship and follow-up reports stay editable only until a newer report of
-- the same type is filed for that group. Leaders of a closed group cannot
-- change them. An admin can still correct that latest report after the group
-- is closed. Next-fellowship plans keep the previous rule.

create function public.report_is_latest(p_report_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.reports target
    where target.id = p_report_id
      and not exists (
        select 1
        from public.reports newer
        where newer.group_id = target.group_id
          and newer.type = target.type
          and (newer.created_at, newer.id) > (target.created_at, target.id)
      )
  );
$$;

revoke execute on function public.report_is_latest(uuid) from public, anon;
grant execute on function public.report_is_latest(uuid) to authenticated;

-- True when this row may be updated. Security definer so the latest-report
-- lookup does not recurse through the reports policies.
create function public.can_edit_report(
  p_report_id uuid,
  p_group_id uuid,
  p_type public.report_type
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    case
      when p_type = 'next-fellowship' then
        (select public.is_admin()) or public.is_group_member(p_group_id)
      else
        public.report_is_latest(p_report_id)
        and (
          (select public.is_admin())
          or (
            public.is_group_member(p_group_id)
            and exists (
              select 1
              from public.groups g
              where g.id = p_group_id and g.status = 'active'
            )
          )
        )
    end;
$$;

revoke execute on function public.can_edit_report(uuid, uuid, public.report_type) from public, anon;
grant execute on function public.can_edit_report(uuid, uuid, public.report_type) to authenticated;

drop policy "Edit reports of own groups" on public.reports;

create policy "Edit reports of own groups" on public.reports
  for update to authenticated
  using ((select public.can_edit_report(id, group_id, type)))
  with check ((select public.can_edit_report(id, group_id, type)));

-- The group, type and who filed the report stay as they were. Editing changes
-- the content, not the filing record. created_at is what "latest" is based on.
create function public.protect_report_identity()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.id is distinct from old.id
    or new.group_id is distinct from old.group_id
    or new.type is distinct from old.type
    or new.filed_by is distinct from old.filed_by
    or new.created_at is distinct from old.created_at
  then
    raise exception 'A report''s group, type and filing details cannot be changed';
  end if;
  return new;
end;
$$;

revoke execute on function public.protect_report_identity() from public, anon, authenticated;

create trigger reports_protect_identity
  before update on public.reports
  for each row execute function public.protect_report_identity();
