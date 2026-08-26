import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";

/**
 * Where a business-side Google login should land.
 * Existing listings skip credits and go to the dashboard.
 */
export async function businessPostAuthPath(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<string> {
  const { count } = await supabase
    .from("businesses")
    .select("id", { count: "exact", head: true })
    .eq("owner_id", userId);

  if ((count ?? 0) > 0) return "/business/dashboard";

  const { data: profile } = await supabase
    .from("profiles")
    .select("subscription_status")
    .eq("id", userId)
    .maybeSingle();

  if (profile?.subscription_status === "active") return "/business/onboard";
  return "/business/subscribe";
}

export function isBusinessEntryPath(path: string) {
  return (
    path === "/" ||
    path === "/business" ||
    path === "/business/subscribe" ||
    path.startsWith("/login")
  );
}
