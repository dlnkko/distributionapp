import OpenAI from "openai";

export const MATCH_MODEL = process.env.OPENAI_MODEL ?? "gpt-5.6-luna";
export const INTAKE_MODEL = process.env.OPENAI_INTAKE_MODEL ?? MATCH_MODEL;

const RETRY_WAITS_MS = [200, 500];

type ReasoningEffort = "none" | "minimal" | "low" | "medium" | "high";

type JsonCall = {
  system: string;
  user: string;
  model?: string;
  reasoningEffort?: ReasoningEffort;
  cacheKey?: string;
  maxTokens?: number;
  verbosity?: "low" | "medium" | "high";
  timeoutMs?: number;
};

export function getOpenAI(timeoutMs = 20_000) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("Missing OPENAI_API_KEY");
  }
  return new OpenAI({
    apiKey,
    timeout: timeoutMs,
  });
}

function completionBody(params: JsonCall) {
  const model = params.model ?? MATCH_MODEL;
  return {
    model,
    messages: [
      { role: "system" as const, content: params.system },
      { role: "user" as const, content: params.user },
    ],
    response_format: { type: "json_object" as const },
    reasoning_effort: params.reasoningEffort ?? "none",
    verbosity: params.verbosity ?? "low",
    ...(params.maxTokens ? { max_completion_tokens: params.maxTokens } : {}),
    ...(params.cacheKey ? { prompt_cache_key: params.cacheKey } : {}),
  };
}

export async function completeJson<T>(params: JsonCall): Promise<T> {
  const client = getOpenAI(params.timeoutMs ?? 20_000);
  let lastBusy = false;
  let tokenBudget = params.maxTokens;

  for (let attempt = 0; attempt <= RETRY_WAITS_MS.length; attempt += 1) {
    if (attempt > 0) await sleep(RETRY_WAITS_MS[attempt - 1]);

    try {
      const response = await client.chat.completions.create({
        ...completionBody({ ...params, maxTokens: tokenBudget }),
      });

      const choice = response.choices[0];
      const text = choice?.message?.content?.trim();
      if (!text) {
        if (choice?.finish_reason === "length" && tokenBudget) {
          tokenBudget = Math.min(tokenBudget * 2, 4000);
        }
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

export async function* streamJsonText(
  params: JsonCall,
): AsyncGenerator<string> {
  const client = getOpenAI(params.timeoutMs ?? 20_000);
  const stream = await client.chat.completions.create({
    ...completionBody(params),
    stream: true,
  });

  for await (const chunk of stream) {
    const piece = chunk.choices[0]?.delta?.content;
    if (piece) yield piece;
  }
}

export function parseJson<T>(text: string): T {
  const trimmed = text.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  return JSON.parse(fenced?.[1] ?? trimmed) as T;
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

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
