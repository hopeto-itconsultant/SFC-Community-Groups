import { redirect } from "next/navigation";

/** Signed-out visitors are sent to /login by the proxy before this runs. */
export default function RootPage() {
  redirect("/home");
}
