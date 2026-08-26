import type { SupabaseClient } from "@supabase/supabase-js";
import { listingEmbeddingDocument } from "@/lib/matching/document";
import {
  VOYAGE_EMBEDDING_MODEL,
  type ListingEmbeddingSource,
} from "@/lib/matching/types";
import { embedText, toVectorLiteral } from "@/lib/voyage";
import type { Database } from "@/lib/database.types";

type ListingRow = {
  id: string;
  name: string;
  tagline: string | null;
  description: string | null;
  extra_details: string | null;
  offer_summary: string | null;
  category: string | null;
  tags: string[] | null;
  target_audience: string | null;
};

/**
 * Embeds a listing with Voyage and upserts `listing_embeddings`.
 * Safe to call after publish; failures should not block the listing insert.
 */
export async function syncListingEmbedding(
  supabase: SupabaseClient<Database>,
  listing: ListingRow,
): Promise<void> {
  const source: ListingEmbeddingSource = {
    name: listing.name,
    tagline: listing.tagline,
    description: listing.description,
    extraDetails: listing.extra_details,
    offerSummary: listing.offer_summary,
    category: listing.category,
    tags: listing.tags ?? [],
    targetAudience: listing.target_audience,
  };
  const documentText = listingEmbeddingDocument(source);
  const embedding = await embedText(documentText, "document");

  const { error } = await supabase.from("listing_embeddings").upsert({
    business_id: listing.id,
    embedding: toVectorLiteral(embedding),
    document_text: documentText,
    category: listing.category,
    model: VOYAGE_EMBEDDING_MODEL,
    updated_at: new Date().toISOString(),
  });

  if (error) {
    throw new Error(error.message);
  }
}
