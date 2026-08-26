import { CLICK_COST_USD } from "@/lib/credits";
import {
  DEFAULT_AUCTION_WEIGHTS,
  type AuctionScoredListing,
  type AuctionWeights,
  type GrokRerankItem,
  type RetrievedCandidate,
} from "@/lib/matching/types";

/**
 * CPC auction over Grok's shortlist.
 *
 * Ad Rank ≈ quality × bid × expected CTR, same idea as Google Ads:
 * - `grok` / `similarity` are quality (does it solve the pain).
 * - `bid` is ability to pay (`log1p(credit_balance)`), floored if they
 *   cannot cover one click.
 * - `conversion` is smoothed historical CTR (clicks / matches).
 *
 * Each component is min-max normalized inside this shortlist so a new
 * catalog of three listings still ranks relative to each other.
 */
export function scoreAuction(input: {
  ranked: GrokRerankItem[];
  candidates: RetrievedCandidate[];
  weights?: AuctionWeights;
}): AuctionScoredListing[] {
  const weights = input.weights ?? DEFAULT_AUCTION_WEIGHTS;
  const byId = new Map(input.candidates.map((item) => [item.businessId, item]));

  const rows = input.ranked.flatMap((item) => {
    const retrieved = byId.get(item.businessId);
    if (!retrieved) return [];
    const impressions = Math.max(0, retrieved.impressionCount);
    const clicks = Math.max(0, retrieved.clickCount);
    const conversionScore = (clicks + 1) / (impressions + 8);
    const rawBid = Math.log1p(Math.max(0, retrieved.creditBalance));
    const bidScore =
      retrieved.creditBalance >= CLICK_COST_USD ? rawBid : rawBid * 0.2;

    return [
      {
        businessId: item.businessId,
        reason: item.reason,
        grokScore: item.grokScore,
        similarity: retrieved.similarity,
        hybridScore: retrieved.hybridScore,
        creditBalance: retrieved.creditBalance,
        clickCount: retrieved.clickCount,
        impressionCount: retrieved.impressionCount,
        bidScore,
        conversionScore,
        auctionScore: 0,
      },
    ];
  });

  const grokN = normalize(rows.map((row) => row.grokScore / 100));
  const simN = normalize(rows.map((row) => row.similarity));
  const bidN = normalize(rows.map((row) => row.bidScore));
  const convN = normalize(rows.map((row) => row.conversionScore));

  return rows
    .map((row, index) => ({
      ...row,
      auctionScore:
        weights.grok * grokN[index] +
        weights.similarity * simN[index] +
        weights.bid * bidN[index] +
        weights.conversion * convN[index],
    }))
    .sort((a, b) => b.auctionScore - a.auctionScore);
}

function normalize(values: number[]): number[] {
  if (!values.length) return [];
  const min = Math.min(...values);
  const max = Math.max(...values);
  if (max - min < 1e-9) return values.map(() => 1);
  return values.map((value) => (value - min) / (max - min));
}
