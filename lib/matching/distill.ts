import type { DistilledPainQuery, QueryUrgency } from "@/lib/matching/types";
import type { OnboardingAnswer } from "@/lib/types";

const STOP = new Set([
  "the",
  "and",
  "for",
  "with",
  "from",
  "that",
  "this",
  "your",
  "you",
  "are",
  "can",
  "all",
  "one",
  "into",
  "need",
  "want",
  "just",
  "like",
  "have",
  "been",
]);

/**
 * Turns intake into a Voyage query without a Grok call. The raw pain plus
 * chosen labels are a better retrieval string than a paraphrased paragraph,
 * and this removes a full flagship request from every match.
 */
export function distillPainQuery(input: {
  painPoint: string;
  answers: OnboardingAnswer[];
}): DistilledPainQuery {
  const labels = input.answers.map((answer) => answer.label).filter(Boolean);
  const haystack = `${input.painPoint}\n${labels.join(" ")}`.toLowerCase();
  const painText = [
    input.painPoint.trim(),
    ...input.answers.map((answer) => `${answer.question}: ${answer.label}`),
  ]
    .filter(Boolean)
    .join("\n");

  return {
    painText,
    category: guessCategory(haystack),
    location: null,
    urgency: guessUrgency(haystack),
    keywords: keywordsFrom(labels, input.painPoint),
  };
}

function guessCategory(text: string): DistilledPainQuery["category"] {
  if (/\bfreelanc|hire someone|done[- ]for[- ]you|agency\b/.test(text)) {
    return "freelancer";
  }
  if (/\bconsult|done for me|book a call|service\b/.test(text)) return "service";
  if (/\b(saas|software|app|platform|self[- ]serve)\b/.test(text)) return "software";
  return null;
}

function guessUrgency(text: string): QueryUrgency {
  if (/\b(today|this week|asap|urgent|right now)\b/.test(text)) return "high";
  if (/\b(explor|later|someday|no rush)\b/.test(text)) return "low";
  return "medium";
}

function keywordsFrom(labels: string[], painPoint: string) {
  return `${painPoint} ${labels.join(" ")}`
    .toLowerCase()
    .split(/[^a-z0-9/+]+/)
    .map((word) => word.trim())
    .filter((word) => word.length > 3 && word.length < 24 && !STOP.has(word))
    .filter((word, index, all) => all.indexOf(word) === index)
    .slice(0, 10);
}
