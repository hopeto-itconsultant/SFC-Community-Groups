-- Date and start time live in one column. Existing dates become midnight,
-- which the app shows as a date with no time. Follow-ups stay at midnight.
-- Calendar checks use the date, so a meeting later today still counts as today.

alter table public.reports
  alter column report_date type timestamp without time zone using report_date::timestamp;

comment on column public.reports.report_date is
  'Start of a fellowship or next-fellowship plan, or a follow-up date at midnight.';

create or replace function public.report_type_summaries(p_group_id uuid default null)
returns jsonb
language sql
stable
security invoker
set search_path = ''
as $$
  with bounds as (
    select
      today,
      date_trunc('month', today)::date as month_start,
      (date_trunc('month', today) + interval '1 month')::date as next_month_start,
      -- Coming Sunday, or today if it is Sunday.
      today + ((7 - extract(dow from today)::int) % 7) as end_of_week
    from (select (now() at time zone 'Asia/Kolkata')::date as today) as t
  ),
  r as (
    select
      reports.*,
      reports.report_date::date as report_day,
      (reports.created_at at time zone 'Asia/Kolkata')::date >= b.month_start
        and (reports.created_at at time zone 'Asia/Kolkata')::date < b.next_month_start as filed_this_month
    from public.reports
    cross join bounds as b
    where p_group_id is null or reports.group_id = p_group_id
  ),
  upcoming as (
    select r.report_day
    from r
    cross join bounds as b
    where r.type = 'next-fellowship' and r.cancelled_at is null and r.report_day >= b.today
  )
  select jsonb_strip_nulls(jsonb_build_object(
    'fellowship', (
      select jsonb_build_object(
        'total', count(*),
        'thisMonth', count(*) filter (where filed_this_month),
        'lastDate', max(report_day) filter (where report_day <= b.today),
        'avgAttendance', coalesce(round(avg(attendees)), 0),
        'totalFirstTimers', coalesce(sum(first_timers), 0)
      )
      from r
      where type = 'fellowship'
    ),
    'followUp', (
      select jsonb_build_object(
        'total', count(*),
        'thisMonth', count(*) filter (where filed_this_month),
        'lastDate', max(report_day) filter (where report_day <= b.today),
        'byMode', jsonb_build_object(
          'call', count(*) filter (where contact_mode = 'call'),
          'text', count(*) filter (where contact_mode = 'text'),
          'in-person', count(*) filter (where contact_mode = 'in-person')
        )
      )
      from r
      where type = 'follow-up'
    ),
    'nextFellowship', (
      select jsonb_build_object(
        'upcomingCount', count(*),
        'nextDate', min(report_day),
        'nextDateCount', count(*) filter (where report_day = (select min(report_day) from upcoming)),
        'thisWeekCount', count(*) filter (where report_day <= b.end_of_week),
        'thisMonthCount', count(*) filter (
          where report_day >= b.month_start and report_day < b.next_month_start
        )
      )
      from upcoming
    ),
    'expenditure', (
      select jsonb_build_object(
        'count', count(*) filter (where expense_amount > 0),
        'totalAmount', coalesce(sum(expense_amount) filter (where expense_amount > 0), 0),
        'thisMonthAmount', coalesce(sum(expense_amount) filter (where filed_this_month), 0),
        'avgAmount', coalesce(round(avg(expense_amount) filter (where expense_amount > 0)), 0),
        'lastDate', max(report_day) filter (where expense_amount > 0 and report_day <= b.today)
      )
      from r
      where type = 'fellowship'
    )
  ))
  from bounds as b;
$$;
