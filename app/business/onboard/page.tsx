import { redirect } from "next/navigation";
import { BusinessOnboardForm } from "@/components/business-onboard-form";
import { MIN_CREDIT_PURCHASE_USD } from "@/lib/credits";
import { createClient } from "@/lib/supabase/server";

export default async function BusinessOnboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?intent=business&next=/business/onboard");

  const [{ data: profile }, { data: listings }] = await Promise.all([
    supabase
      .from("profiles")
      .select("prepaid_listing_credits")
      .eq("id", user.id)
      .maybeSingle(),
    supabase.from("businesses").select("id").eq("owner_id", user.id),
  ]);

  const prepaid = Number(profile?.prepaid_listing_credits ?? 0);
  if (prepaid < MIN_CREDIT_PURCHASE_USD) {
    redirect("/business/subscribe?purpose=new");
  }

  const addingAnother = (listings?.length ?? 0) > 0;

  return (
    <section className="mx-auto w-full max-w-3xl px-6 pb-24 pt-8">
      <h1 className="font-display text-5xl">
        {addingAnother ? "Add another listing." : "Tell us what you sell."}
      </h1>
      <p className="mt-4 mb-12 max-w-xl text-paper-dim">
        Paste the URL. We scrape it, draft the listing, and you pick the call to
        action people see when we recommend you. Credits you just bought stay on
        this listing. After you publish, it stays as is.
      </p>
      <BusinessOnboardForm />
    </section>
  );
}
