-- Initial schema for groups, people and reports.
-- Enum values match the string unions in data/types.ts.

create type public.group_frequency as enum ('monthly', 'every-2-months');
create type public.group_status as enum ('active', 'closed');
create type public.group_role as enum ('leader', 'asst-leader');
create type public.contact_mode as enum ('call', 'text', 'in-person');
create type public.report_type as enum ('fellowship', 'follow-up', 'next-fellowship');

create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- People: the Admin, leaders and assistant leaders. A profile can exist before
-- the person has a login, and is deactivated rather than deleted so their
-- reports stay linked to their name.
create table public.profiles (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique references auth.users (id) on delete set null,
  name text not null check (length(trim(name)) > 0),
  -- E.164 format, e.g. +919876543210.
  mobile text unique check (mobile ~ '^\+[1-9][0-9]{6,14}$'),
  is_admin boolean not null default false,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.groups (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(trim(name)) > 0),
  category text,
  -- Informational only; the app does not schedule fellowships from it.
  frequency public.group_frequency,
  photo_path text,
  -- Groups are closed instead of deleted so their reports are kept.
  status public.group_status not null default 'active',
  closed_at timestamptz,
  created_by uuid references public.profiles (id),
  updated_by uuid references public.profiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint groups_closed_at_matches_status check ((status = 'closed') = (closed_at is not null))
);

-- Who leads or assists each group. A person may serve more than one group.
create table public.group_leaders (
  group_id uuid not null references public.groups (id) on delete cascade,
  profile_id uuid not null references public.profiles (id) on delete cascade,
  role public.group_role not null,
  created_at timestamptz not null default now(),
  primary key (group_id, profile_id)
);

create index group_leaders_profile_id_idx on public.group_leaders (profile_id);

-- All three report types share one table; the check constraint below keeps
-- each type's columns filled in and the other types' columns empty.
create table public.reports (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups (id) on delete restrict,
  type public.report_type not null,
  filed_by uuid not null references public.profiles (id) on delete restrict,
  updated_by uuid references public.profiles (id),
  -- Fellowship date, follow-up date, or the proposed date of a next-fellowship plan.
  report_date date not null,
  location text,
  comments text,

  -- Fellowship
  attendees integer check (attendees >= 0),
  first_timers integer check (first_timers >= 0),
  summary text,
  expense_amount numeric(12, 2) check (expense_amount >= 0),
  expense_details text,
  photo_paths text[] not null default '{}' check (cardinality(photo_paths) <= 3),

  -- Follow-up
  person_name text,
  contact_mode public.contact_mode,

  -- Next fellowship
  activity text,
  goals text,
  cancelled_at timestamptz,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint reports_fields_match_type check (
    case type
      when 'fellowship' then
        num_nulls(location, attendees, first_timers, summary) = 0
        and num_nonnulls(person_name, contact_mode, activity, goals, cancelled_at) = 0
      when 'follow-up' then
        num_nulls(person_name, contact_mode) = 0
        and num_nonnulls(
          location, attendees, first_timers, summary, expense_amount, expense_details,
          activity, goals, cancelled_at
        ) = 0
        and cardinality(photo_paths) = 0
      when 'next-fellowship' then
        num_nulls(location, activity, goals) = 0
        and num_nonnulls(
          comments, attendees, first_timers, summary, expense_amount, expense_details,
          person_name, contact_mode
        ) = 0
        and cardinality(photo_paths) = 0
    end
  )
);

create index reports_group_id_report_date_idx on public.reports (group_id, report_date desc);
create index reports_type_report_date_idx on public.reports (type, report_date desc);
create index reports_filed_by_idx on public.reports (filed_by);

create trigger profiles_set_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();
create trigger groups_set_updated_at before update on public.groups
  for each row execute function public.set_updated_at();
create trigger reports_set_updated_at before update on public.reports
  for each row execute function public.set_updated_at();

-- Access policies are added with login. Until then, only the server-side
-- secret key (which bypasses RLS) can read or write these tables.
alter table public.profiles enable row level security;
alter table public.groups enable row level security;
alter table public.group_leaders enable row level security;
alter table public.reports enable row level security;
