import { NextResponse } from "next/server";
import { runMatchPipeline } from "@/lib/matching";
import { createClient } from "@/lib/supabase/server";
import { destinationUrl, faviconUrl, parseCtaType, parsePlans } from "@/lib/cta";
import type { MatchResult, OnboardingAnswer } from "@/lib/types";

export const maxDuration = 120;

type MatchBody = {
  painPoint?: string;
  answers?: OnboardingAnswer[];
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

    const pipeline = await runMatchPipeline(supabase, { painPoint, answers });
    const { data: selected, error } = await supabase
      .from("businesses")
      .select(
        "id, name, tagline, description, extra_details, offer_summary, category, tags, website_url, logo_url, cta_type, cta_url, cta_label, pricing_plans",
      )
      .eq("id", pipeline.winner.businessId)
      .maybeSingle();

    if (error || !selected) {
      return NextResponse.json(
        { error: "No active listings are available yet." },
        { status: 404 },
      );
    }

    const sessionId = crypto.randomUUID();
    const { error: sessionError } = await supabase.from("search_sessions").insert({
      id: sessionId,
      user_id: user.id,
      pain_point: painPoint,
      answers,
      question_count: answers.length,
      status: "completed",
      matched_business_id: selected.id,
      match_reason: pipeline.winner.reason,
      match_score: pipeline.winner.grokScore,
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
      reason: pipeline.winner.reason,
      score: Math.round(pipeline.winner.grokScore),
      insight: pipeline.winner.insight,
      why: pipeline.winner.why ?? [],
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
