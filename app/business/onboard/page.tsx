import { redirect } from "next/navigation";
import { BusinessOnboardForm } from "@/components/business-onboard-form";
import { createClient } from "@/lib/supabase/server";

export default async function BusinessOnboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?intent=business&next=/business/onboard");

  const { data: profile } = await supabase
    .from("profiles")
    .select("subscription_status")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.subscription_status !== "active") {
    redirect("/business/subscribe");
  }

  const { data: listing } = await supabase
    .from("businesses")
    .select("id")
    .eq("owner_id", user.id)
    .maybeSingle();

  if (listing) {
    redirect("/business/dashboard");
  }

  return (
    <section className="mx-auto w-full max-w-3xl px-6 pb-24 pt-8">
      <h1 className="font-display text-5xl">Tell us what you sell.</h1>
      <p className="mt-4 mb-12 max-w-xl text-paper-dim">
        Paste the URL. We scrape it, draft the listing, and you pick the call to
        action people see when we recommend you. After you publish, it stays as is.
      </p>
      <BusinessOnboardForm />
    </section>
  );
}
