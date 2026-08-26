export const AUTH_NEXT_COOKIE = "dt-auth-next";

export function safeNextPath(next: string | null | undefined, fallback = "/") {
  if (!next) return fallback;
  const decoded = decodeURIComponent(next);
  if (!decoded.startsWith("/") || decoded.startsWith("//")) return fallback;
  return decoded;
}
