import Link from "next/link";
import { CLICK_COST_USD, MIN_CREDIT_PURCHASE_USD } from "@/lib/credits";
import { businessPostAuthPath } from "@/lib/business-home";
import { createClient } from "@/lib/supabase/server";

export default async function BusinessLandingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const continueHref = user
    ? await businessPostAuthPath(supabase, user.id)
    : "/login?intent=business&next=/business/subscribe";

  return (
    <section className="mx-auto flex w-full max-w-4xl flex-1 flex-col justify-center px-6 pb-24">
      <p className="text-xs uppercase tracking-[0.24em] text-ember">For businesses</p>
      <h1 className="font-display mt-6 max-w-3xl text-5xl leading-[1.05] sm:text-6xl">
        Show up when someone is already looking for you.
      </h1>
      <p className="mt-6 max-w-2xl text-lg text-paper-dim">
        You only pay when someone whose exact needs match your business clicks
        through.
      </p>
      <p className="mt-3 text-sm text-paper-dim">
        From ${MIN_CREDIT_PURCHASE_USD}. ${CLICK_COST_USD.toFixed(2)} per click
      </p>
      <div className="mt-10">
        <Link
          href={continueHref}
          className="inline-flex rounded-full bg-ember px-6 py-3 text-sm font-medium text-ink transition-[transform,background-color,box-shadow] duration-200 ease-out hover:scale-[1.045] hover:bg-ember-soft hover:shadow-[0_12px_32px_rgba(255,77,28,0.32)] active:scale-[0.96] active:bg-ember active:shadow-[0_4px_12px_rgba(255,77,28,0.2)]"
        >
          {user
            ? continueHref === "/business/dashboard"
              ? "Go to dashboard"
              : "Continue"
            : "Continue with Google"}
        </Link>
      </div>
    </section>
  );
}
