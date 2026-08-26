import OpenAI from "openai";

export const MATCH_MODEL = process.env.OPENAI_MODEL ?? "gpt-5.6-luna";
export const INTAKE_MODEL = process.env.OPENAI_INTAKE_MODEL ?? MATCH_MODEL;

const RETRY_WAITS_MS = [400, 800, 1600, 3200];

type ReasoningEffort = "none" | "low" | "medium" | "high";

export function getOpenAI() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("Missing OPENAI_API_KEY");
  }
  return new OpenAI({
    apiKey,
    timeout: 45_000,
  });
}

export async function completeJson<T>(params: {
  system: string;
  user: string;
  model?: string;
  reasoningEffort?: ReasoningEffort;
  cacheKey?: string;
  maxTokens?: number;
}): Promise<T> {
  const client = getOpenAI();
  const model = params.model ?? MATCH_MODEL;
  let lastBusy = false;

  for (let attempt = 0; attempt <= RETRY_WAITS_MS.length; attempt += 1) {
    if (attempt > 0) await sleep(RETRY_WAITS_MS[attempt - 1]);

    try {
      const response = await client.chat.completions.create({
        model,
        messages: [
          { role: "system", content: params.system },
          { role: "user", content: params.user },
        ],
        response_format: { type: "json_object" },
        reasoning_effort: params.reasoningEffort ?? "none",
        ...(params.maxTokens
          ? { max_completion_tokens: params.maxTokens }
          : {}),
      });

      const text = response.choices[0]?.message?.content?.trim();
      if (!text) {
        lastBusy = true;
        continue;
      }
      return parseJson<T>(text);
    } catch (error) {
      if (isRetryable(error)) {
        lastBusy = true;
        continue;
      }
      throw error;
    }
  }

  throw new Error(
    lastBusy
      ? "Still working on that. Try again in a moment."
      : "The model returned an empty response",
  );
}

function isRetryable(error: unknown) {
  if (!error || typeof error !== "object") return false;
  const status = "status" in error ? Number(error.status) : 0;
  if (status === 429 || status === 500 || status === 503) return true;
  const message = "message" in error ? String(error.message).toLowerCase() : "";
  return (
    message.includes("rate limit") ||
    message.includes("overloaded") ||
    message.includes("try again")
  );
}

function parseJson<T>(text: string): T {
  const trimmed = text.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  return JSON.parse(fenced?.[1] ?? trimmed) as T;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
