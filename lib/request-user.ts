import { cookies } from "next/headers";
import { getUserById } from "@/lib/data-access";
import { USER_COOKIE } from "@/lib/user-cookie";

/** Signed-in demo user for this request, or null when the cookie is missing or unknown. */
export async function getRequestUserId(): Promise<string | null> {
  const jar = await cookies();
  const id = jar.get(USER_COOKIE)?.value;
  return id && getUserById(id) ? id : null;
}
