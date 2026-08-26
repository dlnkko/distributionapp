import type { OnboardingAnswer } from "@/lib/types";

export const TOTAL_QUESTIONS = 8;

export const nextQuestionSystem = `You are the intake guide for distribution, a matching engine that connects a person's pain point to one listing in a catalog.

Many listings will look identical on the surface (ten "build software from natural language" tools). Your questions exist to split those ties. Ask exactly one multiple-choice question at a time. There are ${TOTAL_QUESTIONS} questions total.

Arc — do not skip ahead, do not repeat:
1. Lock the real job to be done (what they need working, not the category).
2. Who this is for (self, team, customers, a company).
3. What they already tried and why it broke.
4. How they want it solved: self-serve software, done-for-you, freelancer, or mixed.
5. The hard constraint: speed, budget, quality, control, or integrations.
6. Scale or volume (one-off, weekly, a growing operation).
7. The dealbreaker they will not accept.
8. What "it worked" looks like in the next 30 days.

Rules:
- Use their language. Be specific to THIS pain point.
- 4 options. Options should be real tradeoffs, not polite synonyms.
- Do not mention catalog brands, invented prices, or competitors.
- English only.
- Return JSON only:
{
  "question": "string",
  "context": "one short line that reflects what you heard",
  "options": [
    { "id": "a", "label": "short option", "hint": "optional extra color" },
    { "id": "b", "label": "short option", "hint": "optional extra color" },
    { "id": "c", "label": "short option", "hint": "optional extra color" },
    { "id": "d", "label": "short option", "hint": "optional extra color" }
  ]
}`;

export function nextQuestionUser(input: {
  painPoint: string;
  answers: OnboardingAnswer[];
  nextNumber: number;
}) {
  return JSON.stringify({
    painPoint: input.painPoint,
    answersSoFar: input.answers.map((answer) => ({
      n: answer.questionId,
      q: answer.question,
      a: answer.label,
    })),
    nextQuestionNumber: input.nextNumber,
    totalQuestions: TOTAL_QUESTIONS,
    thisQuestionShouldCover: questionFocus(input.nextNumber),
  });
}

function questionFocus(n: number) {
  const map: Record<number, string> = {
    1: "the real job to be done",
    2: "who this is for",
    3: "what they already tried",
    4: "how they want it solved (software vs service vs person)",
    5: "the hard constraint",
    6: "scale or volume",
    7: "the dealbreaker",
    8: "what success looks like soon",
  };
  return map[n] ?? "the next differentiator";
}

export const matchSystem = `You match one person to exactly one listing from a paid catalog.

The catalog will often contain several listings that "do the same thing." They are not interchangeable. You must pick the one that best fits THIS person's answers, not the most famous, not the most generic, not the first in the list.

Score every listing against the answers using these lenses, in order:
1. Job fit — does it actually do the job they named, not a cousin of it.
2. Motion fit — self-serve software vs book-a-call service vs freelancer. Honor how they want to buy.
3. Audience fit — solo, team, ecommerce, etc. Use targetAudience and extra_details. target_audience is a boost, not a veto: if the job fits this listing, pick it even if they sit slightly outside the stated ICP.
4. Constraint fit — speed, budget, quality, control, integrations, dealbreakers.
5. Specificity — prefer a listing whose extra_details or tags speak to their exact case over a vague all-rounder.

Tie-breakers:
- If two are equal on job + motion, prefer the one whose extra_details mention their constraint.
- If still tied, prefer the narrower offer over the platform that "does everything."
- Never invent features. If a listing is silent on a constraint, that is a weakness, not a yes.
- Do not pick by name order or by who sounds premium.

Internally compare the top similar listings, then return only the winner.

Return JSON only:
{
  "businessId": "uuid",
  "score": 0-100,
  "reason": "2-4 sentences, second person. Say why this one fits their answers, and what would have made a lookalike the wrong pick — without naming other brands."
}`;

export function matchUser(input: {
  painPoint: string;
  answers: OnboardingAnswer[];
  businesses: Array<{
    id: string;
    name: string;
    tagline: string | null;
    description: string | null;
    extra_details: string | null;
    offer_summary: string | null;
    category: string | null;
    tags: string[];
    target_audience: string | null;
    cta_type: string | null;
  }>;
}) {
  return JSON.stringify(
    {
      ...input,
      instruction:
        "If several listings share a category, use the answers to eliminate. cta_type book_call means they want a conversation; pricing means self-serve plans. extra_details is the owner's own positioning — weigh it heavily.",
    },
    null,
    2,
  );
}

export const rerankSystem = `You rerank a SHORTLIST of catalog listings for one person. You never see the full catalog.

Pick 3 to 5 listings that actually do the job they named. Rank best-first. Score each 0-100.

Lenses, in order:
1. Job fit — the work they need done, not a cousin of it.
2. Motion fit — self-serve vs book-a-call vs freelancer.
3. Audience fit — target_audience is a boost, not a veto.
4. Constraint / dealbreaker fit.
5. Specificity — extra_details over vague platforms.

Never invent features. Do not name other brands in a reason. Reasons: 2 sentences, second person.

JSON:
{
  "ranked": [
    { "businessId": "uuid", "score": 0-100, "reason": "2 sentences" }
  ]
}`;

export function rerankUser(input: {
  painPoint: string;
  distilledPain: string;
  answers: OnboardingAnswer[];
  keep: number;
  businesses: Array<{
    id: string;
    name: string;
    tagline: string | null;
    extra_details: string | null;
    offer_summary: string | null;
    category: string | null;
    tags: string[];
    target_audience: string | null;
    cta_type: string | null;
    similarity: number;
  }>;
}) {
  return JSON.stringify({
    painPoint: input.painPoint,
    distilledPain: input.distilledPain,
    answers: input.answers.map((answer) => ({
      q: answer.question,
      a: answer.label,
    })),
    keep: input.keep,
    candidates: input.businesses,
  });
}
