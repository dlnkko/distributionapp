import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?intent=business&next=/business/dashboard");

  const { data: listing } = await supabase
    .from("businesses")
    .select("name, tagline, description, website_url, category, tags, extra_details")
    .eq("owner_id", user.id)
    .maybeSingle();

  if (!listing) {
    redirect("/business/onboard");
  }

  return (
    <section className="mx-auto w-full max-w-3xl px-6 pb-24 pt-8">
      <p className="text-xs uppercase tracking-[0.22em] text-ember">Live listing</p>
      <h1 className="font-display mt-4 text-5xl">{listing.name}</h1>
      {listing.tagline ? (
        <p className="mt-4 text-xl text-paper-dim">{listing.tagline}</p>
      ) : null}
      <p className="mt-8 max-w-2xl leading-8 text-paper">{listing.description}</p>
      {listing.extra_details ? (
        <p className="mt-6 max-w-2xl text-paper-dim">{listing.extra_details}</p>
      ) : null}
      <p className="mt-8 text-sm text-paper-dim">
        {listing.category}
        {listing.tags.length ? ` · ${listing.tags.join(" · ")}` : ""}
      </p>
      <div className="mt-10 flex gap-4">
        <Link
          href="/business/onboard"
          className="rounded-full bg-paper px-5 py-2 text-sm font-medium text-ink"
        >
          Edit listing
        </Link>
        {listing.website_url ? (
          <a
            href={listing.website_url}
            className="rounded-full border border-line px-5 py-2 text-sm"
          >
            Website
          </a>
        ) : null}
      </div>
    </section>
  );
}
