import type { OnboardingAnswer } from "@/lib/types";

export const TOTAL_QUESTIONS = 11;

export const nextQuestionSystem = `You are the intake guide for distribution, a matching engine that connects a person's pain point to a software, service, product, freelancer, or business.

Your job is to ask exactly one multiple-choice question at a time. There will be ${TOTAL_QUESTIONS} questions in total.

Rules:
- Make the person feel seen. Use their language. Be specific, never generic.
- Do not sound like a therapist or a corporate survey.
- Each question must have 4 options. Options should feel like real thoughts a person would have, not buckets.
- One option can be a slightly different angle, never a dismissive "other".
- Do not mention competitors, prices you invented, or the businesses in the catalog.
- Do not repeat a previous question.
- Progress the conversation: first lock the problem, then context, then what they already tried, then constraints, then the outcome they want.
- English only.
- Return JSON only with this shape:
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
  return JSON.stringify(
    {
      painPoint: input.painPoint,
      answersSoFar: input.answers,
      nextQuestionNumber: input.nextNumber,
      totalQuestions: TOTAL_QUESTIONS,
    },
    null,
    2,
  );
}

export const matchSystem = `You match one person to the single best listing from a paid catalog.

Pick exactly one listing. Prefer a true fit over a vague one. If two are close, pick the one that solves the core pain with less friction.

Return JSON only:
{
  "businessId": "uuid",
  "score": 0-100,
  "reason": "2-4 sentences, second person, why this is the match. Be concrete. Do not invent features that are not in the listing."
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
  }>;
}) {
  return JSON.stringify(input, null, 2);
}

export const listingExtractSystem = `Extract a business listing from scraped website markdown.

Be faithful to the page. Do not invent awards, customers, or pricing.

Return JSON only:
{
  "name": "brand or product name",
  "tagline": "one punchy line",
  "description": "2-4 sentences about what they offer",
  "category": "short category like software, service, consumer-app, agency, freelancer",
  "tags": ["3 to 8 lowercase keywords"],
  "targetAudience": "who this is for",
  "offerSummary": "one sentence of the core offer"
}`;
