import Link from "next/link";
import { redirect } from "next/navigation";
import {
  CLICK_COST_USD,
  clicksRemaining,
  formatClickTime,
  formatRelativeTime,
  formatUsd,
  listingHost,
  MIN_CREDIT_PURCHASE_USD,
} from "@/lib/credits";
import { businessPostAuthPath } from "@/lib/business-home";
import { createClient } from "@/lib/supabase/server";

type ClickRow = {
  id: string;
  business_id: string;
  created_at: string;
  charged_usd: number;
  visitor_email: string | null;
};

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?intent=business&next=/business/dashboard");

  const { data: listings } = await supabase
    .from("businesses")
    .select("id, name, website_url, logo_url, credit_balance, created_at")
    .eq("owner_id", user.id);

  if (!listings?.length) {
    redirect(await businessPostAuthPath(supabase, user.id));
  }

  const listingIds = listings.map((item) => item.id);
  const { data: clickRows } = await supabase
    .from("listing_clicks")
    .select("id, business_id, created_at, charged_usd, visitor_email")
    .in("business_id", listingIds)
    .order("created_at", { ascending: false });

  const clicks = (clickRows ?? []) as ClickRow[];
  const clicksByListing = new Map<string, ClickRow[]>();
  for (const click of clicks) {
    const bucket = clicksByListing.get(click.business_id) ?? [];
    bucket.push(click);
    clicksByListing.set(click.business_id, bucket);
  }

  const ordered = [...listings].sort((a, b) => {
    const lastA = clicksByListing.get(a.id)?.[0]?.created_at;
    const lastB = clicksByListing.get(b.id)?.[0]?.created_at;
    if (lastA && lastB) {
      return new Date(lastB).getTime() - new Date(lastA).getTime();
    }
    if (lastA) return -1;
    if (lastB) return 1;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  return (
    <section className="mx-auto w-full max-w-4xl px-6 pb-24 pt-8">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-ember">Dashboard</p>
          <h1 className="font-display mt-4 text-5xl">Your listings</h1>
          <p className="mt-3 max-w-lg text-paper-dim">
            Results stay on the page that earned them. Credits do not move
            between listings — a new page starts at {formatUsd(MIN_CREDIT_PURCHASE_USD)}.
          </p>
        </div>
        <Link
          href="/business/subscribe?purpose=new"
          className="inline-flex shrink-0 rounded-full bg-ember px-5 py-2.5 text-sm font-medium text-ink transition-[transform,background-color,box-shadow] duration-200 ease-out hover:scale-[1.045] hover:bg-ember-soft hover:shadow-[0_12px_32px_rgba(255,77,28,0.32)] active:scale-[0.96]"
        >
          Add new listing
        </Link>
      </div>

      <div className="mt-12 space-y-6">
        {ordered.map((listing) => {
          const listingClicks = clicksByListing.get(listing.id) ?? [];
          const balance = Number(listing.credit_balance ?? 0);
          const remaining = clicksRemaining(balance);
          const low = balance < CLICK_COST_USD;
          const host = listingHost(listing.website_url);
          const emails = new Set(
            listingClicks
              .map((click) => click.visitor_email?.trim().toLowerCase())
              .filter((email): email is string => Boolean(email)),
          );
          const lastClick = listingClicks[0]?.created_at;
          const recent = listingClicks.slice(0, 6);
          const initial = listing.name.trim().slice(0, 1).toUpperCase() || "L";

          return (
            <article
              key={listing.id}
              className={`rounded-3xl border bg-ink-soft/60 px-6 py-7 sm:px-8 ${
                low ? "border-ember/50" : "border-line"
              }`}
            >
              <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex min-w-0 items-start gap-4">
                  {listing.logo_url ? (
                    // Favicons and scraped logos are arbitrary hosts.
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={listing.logo_url}
                      alt=""
                      className="h-12 w-12 shrink-0 rounded-2xl bg-ink object-cover"
                    />
                  ) : (
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-ink text-lg text-ember">
                      {initial}
                    </div>
                  )}
                  <div className="min-w-0">
                    <h2 className="font-display text-3xl leading-tight">
                      {listing.name}
                    </h2>
                    <p className="mt-2 text-sm text-paper-dim">
                      {host ? host : "No site yet"}
                      {lastClick
                        ? ` · Last click ${formatRelativeTime(lastClick)}`
                        : " · No clicks yet"}
                    </p>
                  </div>
                </div>
                <Link
                  href={`/business/subscribe?listing=${listing.id}`}
                  className="inline-flex shrink-0 self-start rounded-full border border-line px-4 py-2 text-sm text-paper transition-colors hover:border-ember/70 hover:text-ember"
                >
                  Add credits
                </Link>
              </div>

              <div className="mt-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
                <Stat label="Credits" value={formatUsd(balance)} warn={low} />
                <Stat label="Clicks" value={String(listingClicks.length)} />
                <Stat label="Emails" value={String(emails.size)} />
                <Stat label="Clicks left" value={String(remaining)} warn={low} />
              </div>

              {low ? (
                <p className="mt-5 text-sm text-ember">
                  This listing cannot pay for the next click. Add at least{" "}
                  {formatUsd(CLICK_COST_USD)} — only this page can spend it.
                </p>
              ) : (
                <p className="mt-5 text-sm text-paper-dim">
                  {formatUsd(CLICK_COST_USD)} per click, billed from this listing
                  only.
                </p>
              )}

              <div className="mt-8">
                <p className="text-xs uppercase tracking-[0.18em] text-paper-dim">
                  Results
                </p>
                {recent.length === 0 ? (
                  <p className="mt-4 text-sm text-paper-dim">
                    No clicks yet. Emails land here when someone we matched
                    opens this page.
                  </p>
                ) : (
                  <ul className="mt-4 divide-y divide-line border-t border-line">
                    {recent.map((click) => (
                      <li
                        key={click.id}
                        className="flex flex-col gap-1 py-3.5 sm:flex-row sm:items-baseline sm:justify-between"
                      >
                        <p className="truncate text-paper">
                          {click.visitor_email || "Unknown"}
                        </p>
                        <p className="shrink-0 text-sm text-paper-dim">
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
            </article>
          );
        })}
      </div>
    </section>
  );
}

function Stat({
  label,
  value,
  warn = false,
}: {
  label: string;
  value: string;
  warn?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-line bg-ink/40 px-4 py-4 sm:px-5 sm:py-5">
      <p className="text-xs uppercase tracking-[0.18em] text-paper-dim">{label}</p>
      <p
        className={`font-display mt-3 text-2xl sm:text-3xl ${warn ? "text-ember" : ""}`}
      >
        {value}
      </p>
    </div>
  );
}
