import { redirect } from "next/navigation";
import { getRequestUserId } from "@/lib/request-user";

export default async function RootPage() {
  redirect((await getRequestUserId()) ? "/home" : "/login");
}
