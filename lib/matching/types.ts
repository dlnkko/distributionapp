/**
 * Payloads for the two-stage matcher: Voyage embeddings, hybrid retrieval,
 * Grok rerank, and CPC-style auction scoring.
 */

/** Voyage `voyage-4-large` default width. Must match `listing_embeddings.embedding`. */
export const VOYAGE_EMBEDDING_DIMENSIONS = 1024;

export const VOYAGE_EMBEDDING_MODEL = "voyage-4-large";

/** Candidates retrieved from pgvector + FTS before Grok ever sees a listing. */
export const RETRIEVAL_CANDIDATE_COUNT = 20;

/** How many listings Grok may keep after reasoning. */
export const RERANK_KEEP_COUNT = 5;

export type VoyageInputType = "query" | "document";

export type VoyageEmbeddingRequest = {
  model: typeof VOYAGE_EMBEDDING_MODEL;
  input: string | string[];
  input_type: VoyageInputType;
  output_dimension: typeof VOYAGE_EMBEDDING_DIMENSIONS;
};

export type VoyageEmbeddingResponse = {
  object: "list";
  model: string;
  data: Array<{ object: "embedding"; embedding: number[]; index: number }>;
  usage: { total_tokens: number };
};

export type ListingEmbeddingSource = {
  name: string;
  tagline: string | null;
  description: string | null;
  extraDetails: string | null;
  offerSummary: string | null;
  category: string | null;
  tags: string[];
  targetAudience: string | null;
};

export type ListingEmbeddingRecord = {
  businessId: string;
  documentText: string;
  embedding: number[];
  category: string | null;
  model: typeof VOYAGE_EMBEDDING_MODEL;
};

export type QueryUrgency = "low" | "medium" | "high";

/** Structured query distilled from the 8-question intake. */
export type DistilledPainQuery = {
  /** Clean paragraph used as the Voyage `query` embedding input. */
  painText: string;
  category: string | null;
  location: string | null;
  urgency: QueryUrgency;
  keywords: string[];
};

export type HybridSearchHit = {
  businessId: string;
  /** Cosine similarity in `[0, 1]` (`1 - cosine distance`). */
  similarity: number;
  ftsRank: number;
  /** Reciprocal-rank fusion of vector + keyword ranks, plus a small category boost. */
  hybridScore: number;
  creditBalance: number;
  clickCount: number;
  impressionCount: number;
};

export type RetrievedCandidate = HybridSearchHit & {
  name: string;
  tagline: string | null;
  description: string | null;
  extraDetails: string | null;
  offerSummary: string | null;
  category: string | null;
  tags: string[];
  targetAudience: string | null;
  ctaType: string | null;
};

export type GrokRerankItem = {
  businessId: string;
  /** Fit score 0–100 from Grok, before the CPC auction. */
  grokScore: number;
  reason: string;
  insight: string | null;
  why: string[];
};

export type AuctionWeights = {
  grok: number;
  similarity: number;
  bid: number;
  conversion: number;
};

/** Default mix: semantic quality first, then credits and historical CTR. */
export const DEFAULT_AUCTION_WEIGHTS: AuctionWeights = {
  grok: 0.4,
  similarity: 0.35,
  bid: 0.15,
  conversion: 0.1,
};

export type AuctionScoredListing = {
  businessId: string;
  reason: string;
  insight: string | null;
  why: string[];
  grokScore: number;
  similarity: number;
  hybridScore: number;
  creditBalance: number;
  clickCount: number;
  impressionCount: number;
  bidScore: number;
  conversionScore: number;
  auctionScore: number;
};
