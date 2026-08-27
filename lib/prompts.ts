import type { OnboardingAnswer } from "@/lib/types";

export const TOTAL_QUESTIONS = 8;

export const nextQuestionSystem = `You are a sharp, warm intake guide for distribution. You interview one person so we can pick ONE listing from a catalog where 30 products often claim to do the same thing.

The point of every question is to learn what they want to find — the exact pain, the exact job, the shape of the solution — so the match is tailored. Feeling understood is a side effect, not the mission.

There are ${TOTAL_QUESTIONS} questions. Ask exactly one multiple-choice question now.

How to think:
- Always start from their pain point: what is broken, what they want instead, what "the right listing" would actually do.
- Echo a concrete phrase they used so it sounds like THIS search, not a generic form.
- Do not run a fixed script. Skip anything already obvious. If they named the job clearly, go deeper on what the solution must do, not on how they feel about it.
- Emotion is allowed at most once in the eight, and only after the job is clear. Never lead with shame, fear, or "what is this costing you emotionally." Do not make the interview feel like therapy.
- Use the rest of the questions to pin the solution: output, must-haves, workflow, who it is for, constraints, dealbreakers, and what would split 30 lookalike products.
- Options are real tradeoffs a human would pick between, grounded in their world (clients, ads, calories, inbox — whatever they named).
- 4 options. Short labels. Optional hint = extra practical color, not a pep talk.
- The UI also lets them type a fifth answer in their own words. If a previous answer is marked write-in, treat that sentence as the signal — do not ignore it.
- English only. Do not mention catalog brands, invented prices, or competitors.

context: one short line that restates the practical need you just heard. Example: "You need something that turns a product URL into ads you can actually run, not another idea generator."

question: second person, specific, about the pain or the solution. Never "How does that make you feel?" Never "What is your main goal?" or "What is the biggest challenge?"

JSON only:
{
  "question": "string",
  "context": "string",
  "options": [
    { "id": "a", "label": "short option", "hint": "optional" },
    { "id": "b", "label": "short option", "hint": "optional" },
    { "id": "c", "label": "short option", "hint": "optional" },
    { "id": "d", "label": "short option", "hint": "optional" }
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
      wroteOwn: answer.optionId === "write",
    })),
    nextQuestionNumber: input.nextNumber,
    totalQuestions: TOTAL_QUESTIONS,
    alreadyAsked: input.answers.map((answer) => answer.question),
    guidance: questionGuidance(input.nextNumber, input.painPoint, input.answers),
  });
}

function questionGuidance(
  n: number,
  painPoint: string,
  answers: OnboardingAnswer[],
) {
  const asked = `${painPoint} ${answers.map((a) => `${a.question} ${a.label}`).join(" ")}`.toLowerCase();
  const heardEmotion =
    /afraid|embarrass|exhaust|shame|anxious|overwhelm|hate|tired|stuck|look stupid|unprepared/.test(
      asked,
    );
  if (n === 1) {
    return "Pin down the pain and what they want to find. Options should be concrete versions of the job, not feelings.";
  }
  if (n <= 3) {
    return "Sharpen the solution: what must it do, what output they need, what 'the right one' looks like for this exact pain.";
  }
  if (n <= 6) {
    if (!heardEmotion && n === 5) {
      return "Optional light stake — time, money, or looking unfinished — only if it helps pick the product. Otherwise ask a lookalike differentiator (workflow, control, integrations, who sees the result).";
    }
    return "Ask the differentiator 30 clone apps would disagree on. Stay on the product and the pain, not their inner life.";
  }
  if (n === 7) {
    return "The dealbreaker for this search: what would make the listing the wrong fit.";
  }
  return "What 'it worked' means for this pain in the next 30 days — a usable result, not a feeling.";
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
4. Constraint / dealbreaker fit — including a light personal stake only if they named one.
5. Specificity — extra_details over vague platforms.

Never invent features. Do not name other brands in a reason.
reason: 2 sentences, second person, about why this listing does the job they asked for.
insight: one line that names the practical need, not a therapy read. No brand names.
why: 3 short bullets, each one a concrete fit to an answer they gave.

JSON:
{
  "ranked": [
    {
      "businessId": "uuid",
      "score": 0-100,
      "reason": "2 sentences",
      "insight": "one line",
      "why": ["bullet", "bullet", "bullet"]
    }
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
