import { redirect } from "next/navigation";
import { getRequestUserId } from "@/lib/request-user";
import { LoginForm } from "./LoginForm";

export default async function LoginPage() {
  if (await getRequestUserId()) redirect("/home");
  return <LoginForm />;
}
