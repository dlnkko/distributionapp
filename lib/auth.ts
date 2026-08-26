export const AUTH_NEXT_COOKIE = "dt-auth-next";
export const AUTH_INTENT_COOKIE = "dt-auth-intent";
export const PENDING_PAIN_KEY = "dt-pending-pain";

export type AuthIntent = "search" | "business";

export function safeNextPath(next: string | null | undefined, fallback = "/") {
  if (!next) return fallback;
  let value = next.trim();
  try {
    value = decodeURIComponent(value);
  } catch {
    value = next.trim();
  }
  if (!value.startsWith("/") || value.startsWith("//") || value.includes("://")) {
    return fallback;
  }
  return value;
}

export function findPathForPain(pain: string) {
  return `/find?q=${encodeURIComponent(pain.trim())}`;
}

export function authIntentFrom(
  intent: string | null | undefined,
  nextPath: string,
): AuthIntent {
  if (intent === "business" || nextPath === "/business" || nextPath.startsWith("/business/")) {
    return "business";
  }
  return "search";
}

export function readCookieValue(header: string, name: string) {
  const match = header.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  if (!match?.[1]) return null;
  try {
    return decodeURIComponent(match[1]);
  } catch {
    return match[1];
  }
}

export function setClientAuthCookies(nextPath: string, intent: AuthIntent) {
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  const maxAge = "Max-Age=600; Path=/; SameSite=Lax";
  document.cookie = `${AUTH_NEXT_COOKIE}=${encodeURIComponent(nextPath)}; ${maxAge}${secure}`;
  document.cookie = `${AUTH_INTENT_COOKIE}=${encodeURIComponent(intent)}; ${maxAge}${secure}`;
}
