import type { PricingPlan } from "@/lib/cta";

export type QuestionOption = {
  id: string;
  label: string;
  hint?: string;
};

export type OnboardingQuestion = {
  id: number;
  question: string;
  context?: string;
  options: QuestionOption[];
};

export type OnboardingAnswer = {
  questionId: number;
  question: string;
  optionId: string;
  label: string;
};

export type ScrapedListing = {
  name: string;
  tagline: string;
  description: string;
  category: string;
  tags: string[];
  targetAudience: string;
  offerSummary: string;
};

export type MatchResult = {
  sessionId: string;
  businessId: string;
  name: string;
  tagline: string | null;
  description: string | null;
  offerSummary: string | null;
  websiteUrl: string | null;
  category: string | null;
  tags: string[];
  reason: string;
  score: number;
  ctaType: "book_call" | "pricing" | "visit_site";
  ctaUrl: string;
  ctaLabel: string;
  pricingPlans: PricingPlan[];
  logoUrl: string | null;
};
