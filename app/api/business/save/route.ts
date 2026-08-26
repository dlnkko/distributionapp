import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  defaultCtaLabel,
  faviconUrl,
  parseCtaType,
  parsePlans,
} from "@/lib/cta";
import { syncListingEmbedding } from "@/lib/matching/embed-listing";

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
    .select("subscription_status")
    .eq("id", user.id)
    .single();

  if (profile?.subscription_status !== "active") {
    return NextResponse.json(
      { error: "Buy credits first. They start at $20." },
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
    slug: `${slugify(name) || "listing"}-${user.id.slice(0, 6)}`,
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
    cta_type: ctaType,
    cta_url: ctaUrl,
    cta_label: body.ctaLabel?.trim() || defaultCtaLabel(ctaType),
    pricing_plans: parsePlans(body.pricingPlans).filter((plan) => plan.name),
    logo_url: body.logoUrl?.trim() || faviconUrl(websiteUrl) || null,
  };

  const { data: existing } = await supabase
    .from("businesses")
    .select("id")
    .eq("owner_id", user.id)
    .maybeSingle();

  if (existing) {
    return NextResponse.json(
      { error: "This listing is locked. You cannot edit it after publishing." },
      { status: 409 },
    );
  }

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

  try {
    await syncListingEmbedding(supabase, data);
  } catch (embedError) {
    console.error("Listing embedding failed", embedError);
  }

  return NextResponse.json({ id: data.id });
}
