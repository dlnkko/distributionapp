import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

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
      { error: "An active $49/month listing is required first." },
      { status: 402 },
    );
  }

  const body = (await request.json()) as SaveBody;
  const name = body.name?.trim() ?? "";
  if (!name) {
    return NextResponse.json({ error: "Business name is required." }, { status: 400 });
  }

  const payload = {
    owner_id: user.id,
    name,
    slug: `${slugify(name) || "listing"}-${user.id.slice(0, 6)}`,
    website_url: body.websiteUrl ?? null,
    tagline: body.tagline ?? null,
    description: body.description ?? null,
    extra_details: body.extraDetails ?? null,
    scraped_content: body.scrapedContent ?? null,
    category: body.category ?? null,
    tags: body.tags ?? [],
    target_audience: body.targetAudience ?? null,
    offer_summary: body.offerSummary ?? null,
    subscription_status: "active" as const,
  };

  const { data: existing } = await supabase
    .from("businesses")
    .select("id")
    .eq("owner_id", user.id)
    .maybeSingle();

  const query = existing
    ? supabase.from("businesses").update(payload).eq("id", existing.id).select("id").single()
    : supabase.from("businesses").insert(payload).select("id").single();

  const { data, error } = await query;
  if (error || !data) {
    return NextResponse.json(
      { error: error?.message ?? "Could not save the listing." },
      { status: 500 },
    );
  }

  return NextResponse.json({ id: data.id });
}
