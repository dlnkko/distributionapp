import type { SupabaseClient } from "@supabase/supabase-js";
import { distillPainQuery } from "@/lib/matching/distill";
import { retrieveCandidates } from "@/lib/matching/retrieve";
import { rerankCandidates } from "@/lib/matching/rerank";
import { scoreAuction } from "@/lib/matching/auction";
import type { AuctionScoredListing, DistilledPainQuery } from "@/lib/matching/types";
import type { Database } from "@/lib/database.types";
import type { OnboardingAnswer } from "@/lib/types";

export type MatchPipelineResult = {
  winner: AuctionScoredListing;
  ranked: AuctionScoredListing[];
  distilled: DistilledPainQuery;
};

/**
 * End-to-end matcher used by `/api/onboarding/match`.
 *
 * 1. Distill the intake into a retrieval query (Grok, low effort).
 * 2. Voyage query embedding + pgvector cosine + FTS hybrid → top 20–30.
 * 3. Grok reranks those candidates to 3–5 with reasons.
 * 4. CPC auction reorders that shortlist; the UI still shows #1.
 */
export async function runMatchPipeline(
  supabase: SupabaseClient<Database>,
  input: { painPoint: string; answers: OnboardingAnswer[] },
): Promise<MatchPipelineResult> {
  const distilled = await distillPainQuery(input);
  const candidates = await retrieveCandidates(supabase, distilled);
  if (!candidates.length) {
    throw new Error("No active listings are available yet.");
  }

  const reranked = await rerankCandidates({
    painPoint: input.painPoint,
    answers: input.answers,
    distilledPain: distilled.painText,
    candidates,
  });

  const ranked = scoreAuction({ ranked: reranked, candidates });
  const winner = ranked[0];
  if (!winner) {
    throw new Error("No active listings are available yet.");
  }

  return { winner, ranked, distilled };
}
