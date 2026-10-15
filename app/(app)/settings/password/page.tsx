import { PageHeader } from "@/components/PageHeader";
import { ChangePasswordForm } from "./ChangePasswordForm";

export default function ChangePasswordPage() {
  return (
    <>
      <PageHeader title="Change password" backHref="/settings" />
      <ChangePasswordForm />
    </>
  );
}
