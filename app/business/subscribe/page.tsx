import { redirect } from "next/navigation";
import { CreditsPurchase } from "@/components/credits-purchase";
import { CLICK_COST_USD, MIN_CREDIT_PURCHASE_USD } from "@/lib/credits";
import { createClient } from "@/lib/supabase/server";

export default async function SubscribePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?intent=business&next=/business/subscribe");

  const { data: listing } = await supabase
    .from("businesses")
    .select("id")
    .eq("owner_id", user.id)
    .maybeSingle();

  const nextPath = listing ? "/business/dashboard" : "/business/onboard";

  return (
    <section className="mx-auto flex w-full max-w-xl flex-1 flex-col justify-center px-6 pb-24">
      <p className="text-xs uppercase tracking-[0.24em] text-paper-dim">Credits</p>
      <h1 className="font-display mt-5 text-5xl">Pay only for interested clicks</h1>
      <p className="mt-5 text-lg text-paper-dim">
        ${MIN_CREDIT_PURCHASE_USD} to start. Each click from a match costs $
        {CLICK_COST_USD.toFixed(2)}.
      </p>
      <div className="mt-10">
        <CreditsPurchase nextPath={nextPath} />
      </div>
    </section>
  );
}
