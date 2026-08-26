import type { SupabaseClient } from "@supabase/supabase-js";
import { queryEmbeddingDocument } from "@/lib/matching/document";
import {
  RETRIEVAL_CANDIDATE_COUNT,
  type DistilledPainQuery,
  type HybridSearchHit,
  type RetrievedCandidate,
} from "@/lib/matching/types";
import { embedText, toVectorLiteral } from "@/lib/voyage";
import type { Database } from "@/lib/database.types";

type RpcHit = {
  business_id: string;
  similarity: number | string;
  fts_rank: number | string;
  hybrid_score: number | string;
  credit_balance: number | string;
  click_count: number | string;
  impression_count: number | string;
};

/**
 * Embeds the distilled query and runs hybrid search (cosine + Postgres FTS
 * fused with reciprocal rank). Never loads the full catalog into the LLM.
 */
export async function retrieveCandidates(
  supabase: SupabaseClient<Database>,
  query: DistilledPainQuery,
): Promise<RetrievedCandidate[]> {
  const queryText = queryEmbeddingDocument(query);
  const embedding = await embedText(queryText, "query");

  const { data, error } = await supabase.rpc("hybrid_search_listings", {
    query_embedding: toVectorLiteral(embedding),
    query_text: [query.painText, ...query.keywords].join(" "),
    filter_category: query.category,
    match_count: RETRIEVAL_CANDIDATE_COUNT,
  });

  if (error) {
    throw new Error(error.message);
  }

  const hits = ((data ?? []) as RpcHit[]).map(mapHit);
  if (!hits.length) {
    return fallbackActiveListings(supabase);
  }

  return hydrateHits(supabase, hits);
}

function mapHit(row: RpcHit): HybridSearchHit {
  return {
    businessId: row.business_id,
    similarity: Number(row.similarity) || 0,
    ftsRank: Number(row.fts_rank) || 0,
    hybridScore: Number(row.hybrid_score) || 0,
    creditBalance: Number(row.credit_balance) || 0,
    clickCount: Number(row.click_count) || 0,
    impressionCount: Number(row.impression_count) || 0,
  };
}

async function hydrateHits(
  supabase: SupabaseClient<Database>,
  hits: HybridSearchHit[],
): Promise<RetrievedCandidate[]> {
  const ids = hits.map((hit) => hit.businessId);
  const { data, error } = await supabase
    .from("businesses")
    .select(
      "id, name, tagline, description, extra_details, offer_summary, category, tags, target_audience, cta_type",
    )
    .in("id", ids)
    .eq("subscription_status", "active");

  if (error || !data?.length) {
    return [];
  }

  const byId = new Map(data.map((row) => [row.id, row]));
  return hits.flatMap((hit) => {
    const listing = byId.get(hit.businessId);
    if (!listing) return [];
    return [
      {
        ...hit,
        name: listing.name,
        tagline: listing.tagline,
        description: listing.description,
        extraDetails: listing.extra_details,
        offerSummary: listing.offer_summary,
        category: listing.category,
        tags: listing.tags ?? [],
        targetAudience: listing.target_audience,
        ctaType: listing.cta_type,
      },
    ];
  });
}

/** First-match bootstrap when no embeddings exist yet. */
async function fallbackActiveListings(
  supabase: SupabaseClient<Database>,
): Promise<RetrievedCandidate[]> {
  const { data } = await supabase
    .from("businesses")
    .select(
      "id, name, tagline, description, extra_details, offer_summary, category, tags, target_audience, cta_type, credit_balance",
    )
    .eq("subscription_status", "active")
    .order("created_at", { ascending: false })
    .limit(RETRIEVAL_CANDIDATE_COUNT);

  return (data ?? []).map((listing) => ({
    businessId: listing.id,
    similarity: 0,
    ftsRank: 0,
    hybridScore: 0,
    creditBalance: Number(listing.credit_balance) || 0,
    clickCount: 0,
    impressionCount: 0,
    name: listing.name,
    tagline: listing.tagline,
    description: listing.description,
    extraDetails: listing.extra_details,
    offerSummary: listing.offer_summary,
    category: listing.category,
    tags: listing.tags ?? [],
    targetAudience: listing.target_audience,
    ctaType: listing.cta_type,
  }));
}
