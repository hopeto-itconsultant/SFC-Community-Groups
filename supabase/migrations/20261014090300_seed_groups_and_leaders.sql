-- Real roster: group names, leaders, assistant leaders, and who serves which group.
-- Photos and reports are dummy data and are not loaded.
-- Skips when any group already exists so a second apply does not add a copy.

do $$
begin
  if exists (select 1 from public.groups) then
    raise notice 'Groups already exist; skipping roster seed.';
    return;
  end if;

  create temp table seed_groups (
    slug text primary key,
    id uuid not null default gen_random_uuid(),
    name text not null,
    category text,
    frequency public.group_frequency
  ) on commit drop;

  insert into seed_groups (slug, name, category, frequency) values
    ('womens-cg', 'Women''s', 'Women', 'every-2-months'),
    ('mens-cg', 'Men''s', 'Men', 'monthly'),
    ('the-gathering', 'The Gathering', 'Married Couples', 'every-2-months'),
    ('business-cg', 'Business', 'Business', 'every-2-months'),
    ('arts-cg', 'Arts', 'Arts', 'every-2-months'),
    ('sportz-cg', 'Sportz', 'Sports', 'every-2-months'),
    ('foodies-cg', 'Foodies', 'Food / Fellowship', 'every-2-months'),
    ('kings-messengers', 'King''s Messengers', 'Bikers', 'every-2-months'),
    ('the-collective-sound', 'The Collective Sound', 'Music', 'every-2-months'),
    ('connect-and-play', 'Connect & Play', null, 'every-2-months');

  insert into public.groups (id, name, category, frequency)
  select id, name, category, frequency from seed_groups;

  create temp table seed_profiles (
    slug text primary key,
    id uuid not null default gen_random_uuid(),
    name text not null,
    group_slug text not null,
    role public.group_role not null
  ) on commit drop;

  insert into seed_profiles (slug, name, group_slug, role) values
    ('u-loyilo', 'Sis. Loyilo', 'womens-cg', 'leader'),
    ('u-nzano', 'Sis. Nzano Kikon', 'womens-cg', 'asst-leader'),
    ('u-boholi', 'Sis. Boholi', 'womens-cg', 'asst-leader'),
    ('u-robin', 'Bro. Robin', 'mens-cg', 'leader'),
    ('u-beizo', 'Dr. Beizo', 'mens-cg', 'asst-leader'),
    ('u-bishwajit', 'Bro. Bishwajit', 'mens-cg', 'asst-leader'),
    ('u-tuhovi', 'Mr. Tuhovi', 'the-gathering', 'leader'),
    ('u-luxmi', 'Mrs. Luxmi Yepthomi', 'the-gathering', 'leader'),
    ('u-tianoba', 'Bro. Tianoba Amer', 'business-cg', 'leader'),
    ('u-toito', 'Bro. Toito', 'business-cg', 'asst-leader'),
    ('u-nubuzo', 'Bro. Nubuzo', 'business-cg', 'asst-leader'),
    ('u-noken', 'Bro. Noken', 'business-cg', 'asst-leader'),
    ('u-jenti', 'Sis. Jenti', 'business-cg', 'asst-leader'),
    ('u-kaidin', 'Bro. Kaidin', 'business-cg', 'asst-leader'),
    ('u-moa', 'Bro. Moa', 'arts-cg', 'leader'),
    ('u-rebekah', 'Sis. Rebekah', 'arts-cg', 'asst-leader'),
    ('u-naro', 'Sis. Naro', 'arts-cg', 'asst-leader'),
    ('u-niesakho', 'Bro. Niesakho', 'sportz-cg', 'leader'),
    ('u-ivika', 'Dr. Ivika', 'sportz-cg', 'leader'),
    ('u-vir', 'Bro. Vir', 'sportz-cg', 'asst-leader'),
    ('u-pete', 'Sis. Pete', 'sportz-cg', 'asst-leader'),
    ('u-shanti', 'Sis. Shanti', 'foodies-cg', 'leader'),
    ('u-reshmi', 'Sis. Reshmi', 'foodies-cg', 'asst-leader'),
    ('u-nzanbeni', 'Sis. Nzanbeni', 'foodies-cg', 'asst-leader'),
    ('u-arthur', 'Bro. Arthur', 'kings-messengers', 'leader'),
    ('u-ibomcha', 'Bro. Ibomcha', 'kings-messengers', 'asst-leader'),
    ('u-solomon', 'Bro. Solomon', 'the-collective-sound', 'leader'),
    ('u-tipu', 'Bro. Tipu', 'the-collective-sound', 'asst-leader'),
    ('u-samuel', 'Bro. Samuel', 'the-collective-sound', 'asst-leader'),
    ('u-atomi', 'Bro. Atomi', 'connect-and-play', 'leader'),
    ('u-jethro', 'Bro. Jethro', 'connect-and-play', 'asst-leader'),
    ('u-laithoi', 'Bro. Laithoi', 'connect-and-play', 'asst-leader');

  insert into public.profiles (id, name)
  select id, name from seed_profiles;

  insert into public.group_leaders (group_id, profile_id, role)
  select g.id, p.id, p.role
  from seed_profiles p
  join seed_groups g on g.slug = p.group_slug;
end $$;
