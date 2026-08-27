import { completeJson } from "@/lib/openai";
import { rerankSystem, rerankUser } from "@/lib/prompts";
import { RERANK_KEEP_COUNT, type GrokRerankItem, type RetrievedCandidate } from "@/lib/matching/types";
import type { OnboardingAnswer } from "@/lib/types";

type RerankModel = {
  ranked?: Array<{
    businessId?: string;
    score?: number;
    reason?: string;
    insight?: string;
    why?: string[];
  }>;
};

/**
 * Luna reranks the 20 retrieved listings. It returns 3–5 with a short
 * reason each. IDs outside the candidate set are dropped.
 */
export async function rerankCandidates(input: {
  painPoint: string;
  answers: OnboardingAnswer[];
  distilledPain: string;
  candidates: RetrievedCandidate[];
}): Promise<GrokRerankItem[]> {
  if (!input.candidates.length) return [];

  const generated = await completeJson<RerankModel>({
    system: rerankSystem,
    user: rerankUser({
      painPoint: input.painPoint,
      distilledPain: input.distilledPain,
      answers: input.answers,
      keep: RERANK_KEEP_COUNT,
      businesses: input.candidates.map((item) => ({
        id: item.businessId,
        name: item.name,
        tagline: item.tagline,
        extra_details: item.extraDetails,
        offer_summary: item.offerSummary,
        category: item.category,
        tags: item.tags,
        target_audience: item.targetAudience,
        cta_type: item.ctaType,
        similarity: Number(item.similarity.toFixed(3)),
      })),
    }),
    reasoningEffort: "low",
    cacheKey: "dt-match-rerank",
    maxTokens: 2200,
    verbosity: "low",
    timeoutMs: 25_000,
  });

  const allowed = new Set(input.candidates.map((item) => item.businessId));
  const ranked = (generated.ranked ?? [])
    .map((item) => {
      const reason =
        item.reason?.trim() ||
        "This listing is a close fit for the job they described.";
      const why = (item.why ?? []).map((entry) => entry.trim()).filter(Boolean);
      return {
        businessId: item.businessId ?? "",
        grokScore: clampScore(item.score),
        reason,
        insight: item.insight?.trim() || null,
        why: why.length ? why.slice(0, 3) : sentencesAsWhy(reason),
      };
    })
    .filter((item) => allowed.has(item.businessId))
    .slice(0, RERANK_KEEP_COUNT);

  if (ranked.length) return ranked;

  return input.candidates.slice(0, RERANK_KEEP_COUNT).map((item, index) => ({
    businessId: item.businessId,
    grokScore: Math.max(40, 80 - index * 8),
    reason: "Closest retrieved listing for this pain point.",
    insight: null,
    why: [],
  }));
}

function sentencesAsWhy(reason: string) {
  return reason
    .split(/[.!?]+/)
    .map((part) => part.trim())
    .filter(Boolean)
    .slice(0, 3);
}

function clampScore(value: number | undefined) {
  if (typeof value !== "number" || Number.isNaN(value)) return 70;
  return Math.min(100, Math.max(0, value));
}
