import { redirect } from "next/navigation";
import { SubscribeButton } from "@/components/subscribe-button";
import { createClient } from "@/lib/supabase/server";

export default async function SubscribePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?intent=business&next=/business/subscribe");

  const { data: profile } = await supabase
    .from("profiles")
    .select("subscription_status")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.subscription_status === "active") {
    redirect("/business/onboard");
  }

  return (
    <section className="mx-auto flex w-full max-w-xl flex-1 flex-col justify-center px-6 pb-24">
      <p className="text-xs uppercase tracking-[0.24em] text-paper-dim">Listing plan</p>
      <h1 className="font-display mt-5 text-5xl">$49 / month</h1>
      <p className="mt-5 text-lg text-paper-dim">
        One listing in the live catalog. Your site gets read, your extra details
        stay in the match context, and people arrive already qualified.
      </p>
      <ul className="mt-8 space-y-3 text-paper">
        <li>— Firecrawl read of your website</li>
        <li>— Editable profile for the matching engine</li>
        <li>— Shown when the interview points to you</li>
      </ul>
      <div className="mt-10">
        <SubscribeButton />
      </div>
      <p className="mt-4 text-xs text-paper-dim">
        Checkout link is a placeholder. Set NEXT_PUBLIC_CHECKOUT_URL when you have
        Stripe or Polar ready.
      </p>
    </section>
  );
}
