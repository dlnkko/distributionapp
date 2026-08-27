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
      <p className="font-display mt-8 max-w-2xl text-2xl leading-snug text-paper/90 sm:text-3xl">
        You only pay when someone whose exact needs match your business clicks
        through.
      </p>
      <div className="mt-10 flex items-end gap-10">
        <div>
          <p className="font-display text-4xl tracking-tight text-paper">
            ${MIN_CREDIT_PURCHASE_USD}
          </p>
          <p className="mt-2 text-[11px] uppercase tracking-[0.2em] text-paper-dim">
            to start
          </p>
        </div>
        <div className="mb-2 h-10 w-px bg-line" />
        <div>
          <p className="font-display text-4xl tracking-tight text-paper">
            ${CLICK_COST_USD.toFixed(2)}
          </p>
          <p className="mt-2 text-[11px] uppercase tracking-[0.2em] text-paper-dim">
            per click
          </p>
        </div>
      </div>
      <div className="mt-12">
        <Link
          href={continueHref}
          className="btn btn-ember shrink-0 px-6 py-3 text-sm"
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
