import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  defaultCtaLabel,
  faviconUrl,
  parseCtaType,
  parsePlans,
} from "@/lib/cta";
import { syncListingEmbedding } from "@/lib/matching/embed-listing";
import { MIN_CREDIT_PURCHASE_USD } from "@/lib/credits";

type SaveBody = {
  name?: string;
  websiteUrl?: string;
  tagline?: string;
  description?: string;
  extraDetails?: string;
  category?: string;
  tags?: string[];
  targetAudience?: string;
  offerSummary?: string;
  scrapedContent?: string;
  ctaType?: string;
  ctaUrl?: string;
  ctaLabel?: string;
  pricingPlans?: unknown;
  logoUrl?: string;
};

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 48);
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("subscription_status, prepaid_listing_credits")
    .eq("id", user.id)
    .maybeSingle();

  const prepaid = Number(profile?.prepaid_listing_credits ?? 0);
  if (prepaid < MIN_CREDIT_PURCHASE_USD) {
    return NextResponse.json(
      { error: "Buy credits for this listing first. They start at $20." },
      { status: 402 },
    );
  }

  const body = (await request.json()) as SaveBody;
  const name = body.name?.trim() ?? "";
  if (!name) {
    return NextResponse.json({ error: "Business name is required." }, { status: 400 });
  }

  const targetAudience = body.targetAudience?.trim() ?? "";
  if (targetAudience.length < 8) {
    return NextResponse.json(
      { error: "Say who you sell to. Target audience is required." },
      { status: 400 },
    );
  }

  const ctaType = parseCtaType(body.ctaType);
  const websiteUrl = body.websiteUrl?.trim() || "";
  const ctaUrl =
    ctaType === "visit_site"
      ? websiteUrl
      : body.ctaUrl?.trim() || websiteUrl;
  if (!ctaUrl) {
    return NextResponse.json(
      { error: "Add the page every CTA button should open." },
      { status: 400 },
    );
  }

  const payload = {
    owner_id: user.id,
    name,
    slug: `${slugify(name) || "listing"}-${user.id.slice(0, 6)}-${crypto.randomUUID().slice(0, 8)}`,
    website_url: websiteUrl || null,
    tagline: body.tagline ?? null,
    description: body.description ?? null,
    extra_details: body.extraDetails ?? null,
    scraped_content: body.scrapedContent ?? null,
    category: body.category ?? null,
    tags: body.tags ?? [],
    target_audience: targetAudience,
    offer_summary: body.offerSummary ?? null,
    subscription_status: "active" as const,
    credit_balance: prepaid,
    cta_type: ctaType,
    cta_url: ctaUrl,
    cta_label: body.ctaLabel?.trim() || defaultCtaLabel(ctaType),
    pricing_plans: parsePlans(body.pricingPlans).filter((plan) => plan.name),
    logo_url: body.logoUrl?.trim() || faviconUrl(websiteUrl) || null,
  };

  const { data, error } = await supabase
    .from("businesses")
    .insert(payload)
    .select(
      "id, name, tagline, description, extra_details, offer_summary, category, tags, target_audience",
    )
    .single();
  if (error || !data) {
    return NextResponse.json(
      { error: error?.message ?? "Could not save the listing." },
      { status: 500 },
    );
  }

  const { error: prepaidError } = await supabase
    .from("profiles")
    .update({ prepaid_listing_credits: 0 })
    .eq("id", user.id);

  if (prepaidError) {
    console.error("Could not clear prepaid listing credits", prepaidError);
  }

  try {
    await syncListingEmbedding(supabase, data);
  } catch (embedError) {
    console.error("Listing embedding failed", embedError);
  }

  return NextResponse.json({ id: data.id });
}
