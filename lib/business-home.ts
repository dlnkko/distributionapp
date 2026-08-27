import type { SupabaseClient } from "@supabase/supabase-js";
import { MIN_CREDIT_PURCHASE_USD } from "@/lib/credits";
import type { Database } from "@/lib/database.types";
import type { AuthIntent } from "@/lib/auth";

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
    .select("prepaid_listing_credits")
    .eq("id", userId)
    .maybeSingle();

  if (Number(profile?.prepaid_listing_credits ?? 0) >= MIN_CREDIT_PURCHASE_USD) {
    return "/business/onboard";
  }
  return "/business/subscribe";
}

export function isBusinessAuth(intent: AuthIntent | string | null, nextPath: string) {
  if (intent === "search") return false;
  if (intent === "business") return true;
  return nextPath === "/business" || nextPath.startsWith("/business/");
}
