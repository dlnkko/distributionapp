import type { ListingEmbeddingSource } from "@/lib/matching/types";

/**
 * Builds the document Voyage embeds for a listing. Order is stable so
 * re-embeds stay comparable: pain it solves, offer, ICP, category, keywords.
 */
export function listingEmbeddingDocument(source: ListingEmbeddingSource): string {
  const tags = source.tags.filter(Boolean).join(", ");
  const lines = [
    `Service: ${source.name}`,
    source.tagline ? `Tagline: ${source.tagline}` : null,
    source.offerSummary ? `Offer: ${source.offerSummary}` : null,
    source.description ? `Description: ${source.description}` : null,
    source.extraDetails ? `Pain points solved: ${source.extraDetails}` : null,
    source.category ? `Category: ${source.category}` : null,
    source.targetAudience ? `ICP: ${source.targetAudience}` : null,
    tags ? `Keywords: ${tags}` : null,
  ];
  return lines.filter(Boolean).join("\n");
}

/**
 * Builds the query Voyage embeds after Grok distills the intake.
 * Filters (category, location, urgency) are inlined so retrieval can use them
 * even when they are not hard SQL gates.
 */
export function queryEmbeddingDocument(input: {
  painText: string;
  category: string | null;
  location: string | null;
  urgency: string;
  keywords: string[];
}): string {
  const keywords = input.keywords.filter(Boolean).join(", ");
  const lines = [
    `Pain: ${input.painText.trim()}`,
    input.category ? `Category: ${input.category}` : null,
    input.location ? `Location: ${input.location}` : null,
    `Urgency: ${input.urgency}`,
    keywords ? `Keywords: ${keywords}` : null,
  ];
  return lines.filter(Boolean).join("\n");
}
