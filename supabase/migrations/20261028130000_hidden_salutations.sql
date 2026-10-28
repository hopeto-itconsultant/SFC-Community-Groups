-- One shared list of titles (Bro., Pastor, …) that the app hides when a person
-- turns titles off. A superadmin edits the comma-separated list. Everyone who
-- is signed in can read it, so names format the same on every screen.

create table public.app_settings (
  id integer primary key default 1 check (id = 1),
  hidden_salutations text not null check (length(hidden_salutations) <= 1000)
);

insert into public.app_settings (hidden_salutations)
values ('Bro., Sis., Dr., Mr., Mrs., Ms., Miss, Pr., Ps., Rev., Pastor, Elder');

alter table public.app_settings enable row level security;

revoke all on table public.app_settings from public, anon, authenticated;
grant select on table public.app_settings to authenticated;

create policy "Signed-in users read app settings"
  on public.app_settings
  for select
  to authenticated
  using (true);

-- Writes stay inside this function so only a superadmin can change the list.
create function public.set_hidden_salutations(list text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not (select public.is_superadmin()) then
    raise exception 'Only a superadmin can change hidden titles';
  end if;
  if list is null or length(list) > 1000 then
    raise exception 'That list is too long';
  end if;
  insert into public.app_settings (id, hidden_salutations)
  values (1, list)
  on conflict (id) do update set hidden_salutations = excluded.hidden_salutations;
end;
$$;

revoke execute on function public.set_hidden_salutations(text) from public, anon;
grant execute on function public.set_hidden_salutations(text) to authenticated;
