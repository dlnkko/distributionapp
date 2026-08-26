export const PRODUCTION_ORIGIN = "https://distributionalgo.vercel.app";

export function isLocalHostname(hostname: string) {
  return hostname === "localhost" || hostname === "127.0.0.1";
}
