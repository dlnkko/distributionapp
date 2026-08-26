"use client";

import { useEffect } from "react";
import { PRODUCTION_ORIGIN, isLocalHostname } from "@/lib/site-url";

/**
 * If Supabase Site URL is still localhost, Google sends the auth `code`
 * to http://localhost:3000/. Forward it to production, where the PKCE
 * cookie and the pending pain path still live.
 */
export function RescueOAuthCode() {
  useEffect(() => {
    if (!isLocalHostname(window.location.hostname)) return;
    if (window.location.pathname !== "/") return;
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    if (!code) return;
    const dest = new URL("/auth/callback", PRODUCTION_ORIGIN);
    dest.searchParams.set("code", code);
    window.location.replace(dest.toString());
  }, []);
  return null;
}
