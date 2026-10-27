-- Internal logins use @login.sfc.invalid and never receive a confirmation email.
-- Hosted projects keep "Confirm email" on, so a login created without a
-- confirmed address cannot sign in until someone resets the password.
-- Mark every existing internal login confirmed. Passwords are left as they are.

update auth.users
set
  email_confirmed_at = coalesce(email_confirmed_at, now()),
  confirmation_token = '',
  raw_user_meta_data = jsonb_set(
    coalesce(raw_user_meta_data, '{}'::jsonb),
    '{email_verified}',
    'true'::jsonb,
    true
  )
where email like '%@login.sfc.invalid'
  and (
    email_confirmed_at is null
    or coalesce(raw_user_meta_data->>'email_verified', 'false') is distinct from 'true'
  );

update auth.identities
set identity_data = jsonb_set(
  coalesce(identity_data, '{}'::jsonb),
  '{email_verified}',
  'true'::jsonb,
  true
)
where provider = 'email'
  and coalesce(identity_data->>'email', '') like '%@login.sfc.invalid'
  and coalesce(identity_data->>'email_verified', 'false') is distinct from 'true';
