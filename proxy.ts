import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { REMEMBER_COOKIE, applyRememberMe, remembersSession } from "@/lib/supabase/remember";

const PUBLIC_PATHS = ["/login", "/updates", "/manifest.webmanifest", "/sw.js"];

/**
 * Refreshes the Supabase session cookie on every request and sends signed-out
 * visitors to the login page. Pages and Server Actions still check the user
 * themselves; this only keeps the session fresh and avoids a wasted render.
 */
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const remember = remembersSession(request.cookies.get(REMEMBER_COOKIE)?.value);

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet, headers) {
          const toSet = applyRememberMe(cookiesToSet, remember);
          for (const { name, value } of toSet) request.cookies.set(name, value);
          response = NextResponse.next({ request });
          for (const { name, value, options } of toSet) response.cookies.set(name, value, options);
          for (const [key, value] of Object.entries(headers)) response.headers.set(key, value);
        },
      },
    },
  );

  const { data } = await supabase.auth.getClaims();
  const { pathname } = request.nextUrl;

  if (!data?.claims && !PUBLIC_PATHS.includes(pathname)) {
    const redirect = NextResponse.redirect(new URL("/login", request.url));
    for (const cookie of response.cookies.getAll()) redirect.cookies.set(cookie);
    return redirect;
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|sw\\.js|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|mp4)$).*)"],
};
