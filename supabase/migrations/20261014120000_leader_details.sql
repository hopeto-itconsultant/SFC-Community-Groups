-- Optional personal details for leaders and assistant leaders. A person can
-- serve more than one group, so these belong on the profile. Blank means the
-- Admin has not entered them yet. Dates in the future and malformed emails are
-- rejected in the app, which uses the church's time zone for "today".

alter table public.profiles
  add column date_of_birth date,
  add column email text,
  add column serving_since date;
