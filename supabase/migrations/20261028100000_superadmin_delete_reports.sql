-- Superadmins may permanently delete reports. Leaders and normal admins still
-- cannot delete; plans stay cancellable for them instead.

create policy "Superadmin deletes reports" on public.reports
  for delete to authenticated
  using ((select public.is_superadmin()));
