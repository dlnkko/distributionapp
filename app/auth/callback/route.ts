import { NextResponse } from "next/server";
import { AUTH_NEXT_COOKIE, safeNextPath } from "@/lib/auth";
import { businessPostAuthPath, isBusinessEntryPath } from "@/lib/business-home";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const oauthError = searchParams.get("error");
  const cookieNext = readCookie(request, AUTH_NEXT_COOKIE);
  const next = safeNextPath(searchParams.get("next") ?? cookieNext);

  if (oauthError) {
    return clearAuthNext(NextResponse.redirect(new URL("/login?error=auth", origin)));
  }

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      let destination = next;
      if (isBusinessEntryPath(next)) {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user) destination = await businessPostAuthPath(supabase, user.id);
      }
      return clearAuthNext(NextResponse.redirect(new URL(destination, origin)));
    }
  }

  return clearAuthNext(NextResponse.redirect(new URL("/login?error=auth", origin)));
}

function readCookie(request: Request, name: string) {
  const header = request.headers.get("cookie") ?? "";
  const match = header.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match?.[1] ? decodeURIComponent(match[1]) : null;
}

function clearAuthNext(response: NextResponse) {
  response.cookies.set(AUTH_NEXT_COOKIE, "", { path: "/", maxAge: 0 });
  return response;
}
