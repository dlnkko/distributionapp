import { NextResponse } from "next/server";
import {
  AUTH_INTENT_COOKIE,
  AUTH_NEXT_COOKIE,
  authIntentFrom,
  findPathForPain,
  readCookieValue,
  safeNextPath,
} from "@/lib/auth";
import { businessPostAuthPath, isBusinessAuth } from "@/lib/business-home";
import { PRODUCTION_ORIGIN, isLocalHostname } from "@/lib/site-url";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const oauthError = searchParams.get("error");
  const host = new URL(request.url).hostname;

  if (
    code &&
    isLocalHostname(host) &&
    !(request.headers.get("cookie") ?? "").includes("code-verifier")
  ) {
    const dest = new URL("/auth/callback", PRODUCTION_ORIGIN);
    dest.searchParams.set("code", code);
    return NextResponse.redirect(dest);
  }
  const cookieHeader = request.headers.get("cookie") ?? "";
  const cookieNext = readCookieValue(cookieHeader, AUTH_NEXT_COOKIE);
  const cookieIntent = readCookieValue(cookieHeader, AUTH_INTENT_COOKIE);
  const pain = searchParams.get("q")?.trim() ?? "";
  const nextFromQuery = searchParams.get("next");
  const next =
    pain.length >= 8
      ? findPathForPain(pain)
      : safeNextPath(nextFromQuery ?? cookieNext);
  const intent = authIntentFrom(cookieIntent ?? searchParams.get("intent"), next);

  if (oauthError) {
    return clearAuthCookies(
      NextResponse.redirect(new URL("/login?error=auth", origin)),
    );
  }

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      let destination = next;
      if (isBusinessAuth(intent, next)) {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user) destination = await businessPostAuthPath(supabase, user.id);
      }
      return clearAuthCookies(NextResponse.redirect(new URL(destination, origin)));
    }
  }

  return clearAuthCookies(
    NextResponse.redirect(new URL("/login?error=auth", origin)),
  );
}

function clearAuthCookies(response: NextResponse) {
  response.cookies.set(AUTH_NEXT_COOKIE, "", { path: "/", maxAge: 0 });
  response.cookies.set(AUTH_INTENT_COOKIE, "", { path: "/", maxAge: 0 });
  return response;
}
