import { NextResponse } from "next/server";
import { completeJson } from "@/lib/openai";
import { matchSystem, matchUser } from "@/lib/prompts";
import { createClient } from "@/lib/supabase/server";
import { destinationUrl, faviconUrl, parseCtaType, parsePlans } from "@/lib/cta";
import type { MatchResult, OnboardingAnswer } from "@/lib/types";

type MatchBody = {
  painPoint?: string;
  answers?: OnboardingAnswer[];
};

type ModelMatch = {
  businessId?: string;
  score?: number;
  reason?: string;
};

export async function POST(request: Request) {
  try {
  const body = (await request.json()) as MatchBody;
  const painPoint = body.painPoint?.trim() ?? "";
  const answers = Array.isArray(body.answers) ? body.answers : [];

  if (painPoint.length < 8 || answers.length === 0) {
    return NextResponse.json({ error: "Missing intake answers." }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  }

  const { data: businesses, error } = await supabase
    .from("businesses")
    .select(
      "id, name, tagline, description, extra_details, offer_summary, category, tags, target_audience, website_url, logo_url, cta_type, cta_url, cta_label, pricing_plans",
    )
    .eq("subscription_status", "active");

  if (error || !businesses?.length) {
    return NextResponse.json(
      { error: "No active listings are available yet." },
      { status: 404 },
    );
  }

  const match = await completeJson<ModelMatch>({
    system: matchSystem,
    user: matchUser({
      painPoint,
      answers,
      businesses: businesses.map((item) => ({
        id: item.id,
        name: item.name,
        tagline: item.tagline,
        description: item.description,
        extra_details: item.extra_details,
        offer_summary: item.offer_summary,
        category: item.category,
        tags: item.tags,
        target_audience: item.target_audience,
        cta_type: item.cta_type,
      })),
    }),
  });

  const selected =
    businesses.find((item) => item.id === match.businessId) ?? businesses[0];

  const sessionId = crypto.randomUUID();
  const { error: sessionError } = await supabase.from("search_sessions").insert({
    id: sessionId,
    user_id: user.id,
    pain_point: painPoint,
    answers,
    question_count: answers.length,
    status: "completed",
    matched_business_id: selected.id,
    match_reason: match.reason ?? null,
    match_score: match.score ?? null,
    completed_at: new Date().toISOString(),
  });

  if (sessionError) {
    return NextResponse.json({ error: sessionError.message }, { status: 500 });
  }

  const result: MatchResult = {
    sessionId,
    businessId: selected.id,
    name: selected.name,
    tagline: selected.tagline,
    description: selected.description,
    offerSummary: selected.offer_summary,
    websiteUrl: selected.website_url,
    category: selected.category,
    tags: selected.tags,
    reason: match.reason ?? "This listing is the closest fit in the catalog.",
    score: match.score ?? 70,
    ctaType: parseCtaType(selected.cta_type),
    ctaUrl: destinationUrl(selected.cta_url, selected.website_url),
    ctaLabel: selected.cta_label ?? "Book a call",
    pricingPlans: parsePlans(selected.pricing_plans),
    logoUrl: selected.logo_url || faviconUrl(selected.website_url ?? "") || null,
  };

  return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not match." },
      { status: 500 },
    );
  }
}
