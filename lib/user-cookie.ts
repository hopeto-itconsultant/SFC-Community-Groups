/** Demo sign-in. A session cookie so the server can render the right screen on the first response. */
export const USER_COOKIE = "sfc-demo-user";

export function userIdFromCookieHeader(header: string | null | undefined): string | null {
  if (!header) return null;
  for (const part of header.split(";")) {
    const trimmed = part.trim();
    const eq = trimmed.indexOf("=");
    if (eq === -1 || trimmed.slice(0, eq) !== USER_COOKIE) continue;
    try {
      return decodeURIComponent(trimmed.slice(eq + 1)) || null;
    } catch {
      return null;
    }
  }
  return null;
}

export function userCookieAssignment(id: string | null, secure: boolean): string {
  const secureAttr = secure ? "; Secure" : "";
  if (!id) return `${USER_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax${secureAttr}`;
  return `${USER_COOKIE}=${encodeURIComponent(id)}; Path=/; SameSite=Lax${secureAttr}`;
}
