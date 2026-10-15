-- Each person chooses whether titles such as "Bro." show before names on their
-- own screens. Null means they have not chosen, so the app default applies.
alter table public.profiles add column show_salutations boolean;

-- Everyone may change this for their own profile only; other profile edits stay admin/leader-only.
create function public.set_show_salutations(show boolean)
returns void
language sql
security definer
set search_path = ''
as $$
  update public.profiles set show_salutations = show where id = public.current_profile_id();
$$;

revoke execute on function public.set_show_salutations(boolean) from public, anon;
grant execute on function public.set_show_salutations(boolean) to authenticated;
