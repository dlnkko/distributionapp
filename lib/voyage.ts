import {
  VOYAGE_EMBEDDING_DIMENSIONS,
  VOYAGE_EMBEDDING_MODEL,
  type VoyageEmbeddingRequest,
  type VoyageEmbeddingResponse,
  type VoyageInputType,
} from "@/lib/matching/types";

const VOYAGE_URL = "https://api.voyageai.com/v1/embeddings";

/**
 * Creates a `voyage-4-large` embedding. Use `document` for listings and
 * `query` for the distilled user pain so Voyage can asymmetric-retrieve.
 */
export async function embedText(
  text: string,
  inputType: VoyageInputType,
): Promise<number[]> {
  const trimmed = text.trim();
  if (!trimmed) {
    throw new Error("Cannot embed empty text.");
  }

  const apiKey = process.env.VOYAGE_API_KEY;
  if (!apiKey) {
    throw new Error("Missing VOYAGE_API_KEY");
  }

  const body: VoyageEmbeddingRequest = {
    model: VOYAGE_EMBEDDING_MODEL,
    input: trimmed.slice(0, 24_000),
    input_type: inputType,
    output_dimension: VOYAGE_EMBEDDING_DIMENSIONS,
  };

  const response = await fetch(VOYAGE_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });

  const payload = (await response.json()) as VoyageEmbeddingResponse & {
    detail?: string;
    error?: string;
  };

  if (!response.ok) {
    throw new Error(payload.detail ?? payload.error ?? "Voyage embedding failed.");
  }

  const vector = payload.data?.[0]?.embedding;
  if (!vector || vector.length !== VOYAGE_EMBEDDING_DIMENSIONS) {
    throw new Error("Voyage returned an unexpected embedding size.");
  }

  return vector;
}

/** Formats a vector for pgvector / PostgREST (`'[0.1,0.2,...]'`). */
export function toVectorLiteral(embedding: number[]): string {
  return `[${embedding.join(",")}]`;
}
