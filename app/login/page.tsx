import Image from "next/image";
import { redirect } from "next/navigation";
import { Card } from "@/components/ui";
import { getCurrentUser } from "@/lib/auth";
import { APP_NAME, LOGO_SRC } from "@/lib/brand";
import { LoginForm } from "./LoginForm";

export default async function LoginPage() {
  if (await getCurrentUser()) redirect("/home");

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center px-5 py-10">
      <div className="mb-8 flex flex-col items-center text-center">
        <Image src={LOGO_SRC} alt="" width={80} height={80} priority className="rounded-2xl shadow-sm" />
        <h1 className="mt-4 text-2xl font-bold">{APP_NAME}</h1>
        <p className="mt-1 text-slate-500">Management &amp; Reporting</p>
      </div>

      <Card className="p-5">
        <LoginForm />
      </Card>

      <p className="mt-6 text-center text-xs text-slate-400">
        Forgot your password? Ask the Admin to reset it.
      </p>
    </div>
  );
}
