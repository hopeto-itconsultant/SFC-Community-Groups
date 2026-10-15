-- Optional sign-in id for admins. People who only sign in with a mobile number
-- leave this empty. Stored lowercase, and it starts with a letter so it cannot
-- be mistaken for a phone number. Unique allows many nulls.

alter table public.profiles
  add column username text,
  add constraint profiles_username_format check (
    username is null or username ~ '^[a-z][a-z0-9._]{2,31}$'
  ),
  add constraint profiles_username_key unique (username);
