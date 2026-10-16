-- Append-only activity log for SUPERADMIN feature-use and error insight.
-- App writes only with the secret key; Admins may read.

create table public.activity_log (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  feature text not null,
  action text not null,
  outcome text not null check (outcome in ('success', 'error')),
  actor_id uuid references public.profiles (id),
  actor_role text,
  acting_as_id uuid references public.profiles (id),
  entity_type text,
  entity_id uuid,
  summary text not null,
  error_message text
);

create index activity_log_created_at_idx on public.activity_log (created_at desc);
create index activity_log_feature_created_idx on public.activity_log (feature, created_at desc);
create index activity_log_outcome_created_idx on public.activity_log (outcome, created_at desc)
  where outcome = 'error';

alter table public.activity_log enable row level security;

create policy "Admins read activity log" on public.activity_log
  for select to authenticated
  using ((select public.is_admin()));
