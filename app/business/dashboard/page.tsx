import Link from "next/link";
import { redirect } from "next/navigation";
import {
  CLICK_COST_USD,
  clicksRemaining,
  formatClickTime,
  formatUsd,
} from "@/lib/credits";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?intent=business&next=/business/dashboard");

  const { data: listing } = await supabase
    .from("businesses")
    .select("id, name")
    .eq("owner_id", user.id)
    .maybeSingle();

  if (!listing) {
    redirect("/business/onboard");
  }

  const [{ data: profile }, clicksResult] = await Promise.all([
    supabase
      .from("profiles")
      .select("credit_balance")
      .eq("id", user.id)
      .maybeSingle(),
    supabase
      .from("listing_clicks")
      .select("id, created_at, charged_usd, visitor_email", { count: "exact" })
      .eq("business_id", listing.id)
      .order("created_at", { ascending: false })
      .limit(50),
  ]);

  const balance = Number(profile?.credit_balance ?? 0);
  const clickRows = clicksResult.data ?? [];
  const clickCount = clicksResult.count ?? clickRows.length;
  const remaining = clicksRemaining(balance);
  const low = balance < CLICK_COST_USD;

  return (
    <section className="mx-auto w-full max-w-3xl px-6 pb-24 pt-8">
      <p className="text-xs uppercase tracking-[0.22em] text-ember">Dashboard</p>
      <h1 className="font-display mt-4 text-5xl">{listing.name}</h1>
      <p className="mt-3 text-paper-dim">Clicks, credits, and the emails behind them.</p>

      <div className="mt-10 grid gap-4 sm:grid-cols-3">
        <Stat label="Credits left" value={formatUsd(balance)} />
        <Stat label="Clicks" value={String(clickCount)} />
        <Stat label="Clicks left" value={String(remaining)} />
      </div>

      {low ? (
        <p className="mt-6 text-sm text-ember">
          Credits are too low to charge the next click. Add at least{" "}
          {formatUsd(CLICK_COST_USD)} to keep paying for visits.
        </p>
      ) : (
        <p className="mt-6 text-sm text-paper-dim">
          Each click to your website costs {formatUsd(CLICK_COST_USD)}.
        </p>
      )}

      <div className="mt-8">
        <Link
          href="/business/subscribe"
          className="inline-flex rounded-full bg-ember px-5 py-2 text-sm font-medium text-ink"
        >
          Add credits
        </Link>
      </div>

      <div className="mt-14">
        <p className="text-xs uppercase tracking-[0.18em] text-paper-dim">
          Recent clicks
        </p>
        {clickRows.length === 0 ? (
          <p className="mt-4 text-paper-dim">
            No clicks yet. When someone we matched opens your site, their email
            lands here.
          </p>
        ) : (
          <ul className="mt-5 divide-y divide-line border-t border-line">
            {clickRows.map((click) => (
              <li
                key={click.id}
                className="flex flex-col gap-1 py-4 sm:flex-row sm:items-baseline sm:justify-between"
              >
                <p className="text-paper">{click.visitor_email || "Unknown"}</p>
                <p className="text-sm text-paper-dim">
                  {formatClickTime(click.created_at)}
                  {Number(click.charged_usd) > 0
                    ? ` · −${formatUsd(Number(click.charged_usd))}`
                    : ""}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-line bg-ink-soft/70 px-5 py-5">
      <p className="text-xs uppercase tracking-[0.18em] text-paper-dim">{label}</p>
      <p className="font-display mt-3 text-3xl">{value}</p>
    </div>
  );
}
