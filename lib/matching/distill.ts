import { completeJson } from "@/lib/openai";
import { distillSystem, distillUser } from "@/lib/prompts";
import type { DistilledPainQuery, QueryUrgency } from "@/lib/matching/types";
import type { OnboardingAnswer } from "@/lib/types";

type DistillModel = {
  painText?: string;
  category?: string | null;
  location?: string | null;
  urgency?: QueryUrgency;
  keywords?: string[];
};

const URGENCY: QueryUrgency[] = ["low", "medium", "high"];

/**
 * Asks Grok to compress the 8-question intake into a retrieval query:
 * one pain paragraph plus category / location / urgency filters.
 */
export async function distillPainQuery(input: {
  painPoint: string;
  answers: OnboardingAnswer[];
}): Promise<DistilledPainQuery> {
  const generated = await completeJson<DistillModel>({
    system: distillSystem,
    user: distillUser(input),
    reasoningEffort: "low",
    cacheKey: "dt-match-distill",
  });

  const painText = generated.painText?.trim() || input.painPoint.trim();
  const urgency = URGENCY.includes(generated.urgency as QueryUrgency)
    ? (generated.urgency as QueryUrgency)
    : "medium";

  return {
    painText,
    category: generated.category?.trim() || null,
    location: generated.location?.trim() || null,
    urgency,
    keywords: (generated.keywords ?? []).map((item) => item.trim()).filter(Boolean).slice(0, 12),
  };
}
