import { redirect } from "next/navigation";
import { CreditsPurchase } from "@/components/credits-purchase";
import { CLICK_COST_USD, MIN_CREDIT_PURCHASE_USD } from "@/lib/credits";
import { createClient } from "@/lib/supabase/server";

type Props = {
  searchParams: Promise<{ listing?: string; purpose?: string }>;
};

export default async function SubscribePage({ searchParams }: Props) {
  const params = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?intent=business&next=/business/subscribe");

  const listingId = params.listing?.trim() || "";
  const fundingNew = params.purpose === "new" || !listingId;

  const [{ data: profile }, { data: existing }] = await Promise.all([
    supabase
      .from("profiles")
      .select("prepaid_listing_credits")
      .eq("id", user.id)
      .maybeSingle(),
    listingId
      ? supabase
          .from("businesses")
          .select("id, name")
          .eq("id", listingId)
          .eq("owner_id", user.id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  const prepaid = Number(profile?.prepaid_listing_credits ?? 0);
  if (fundingNew && !listingId && prepaid >= MIN_CREDIT_PURCHASE_USD) {
    redirect("/business/onboard");
  }

  if (listingId && !existing) {
    redirect("/business/dashboard");
  }

  const forListing = Boolean(existing);
  const nextPath = forListing ? "/business/dashboard" : "/business/onboard";
  const title = forListing
    ? `Credits for ${existing?.name}.`
    : "Credits for this listing.";
  const copy = forListing
    ? `These stay on ${existing?.name}. Other listings cannot spend them. $${MIN_CREDIT_PURCHASE_USD} minimum. $${CLICK_COST_USD.toFixed(2)} per click.`
    : `A new page needs its own wallet. $${MIN_CREDIT_PURCHASE_USD} to start, then $${CLICK_COST_USD.toFixed(2)} each time someone we matched clicks through.`;

  return (
    <section className="mx-auto flex w-full max-w-xl flex-1 flex-col justify-center px-6 pb-24">
      <p className="text-xs uppercase tracking-[0.24em] text-paper-dim">Credits</p>
      <h1 className="font-display mt-5 text-5xl">{title}</h1>
      <p className="mt-5 text-lg text-paper-dim">{copy}</p>
      <div className="mt-10">
        <CreditsPurchase nextPath={nextPath} listingId={existing?.id} />
      </div>
    </section>
  );
}
