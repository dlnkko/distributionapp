import OpenAI from "openai";

const MODEL = process.env.OPENAI_MODEL ?? process.env.XAI_MODEL ?? "grok-4.6";
const XAI_BASE_URL = "https://api.x.ai/v1";

export function getOpenAI() {
  const apiKey = process.env.XAI_API_KEY ?? process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("Missing XAI_API_KEY");
  }
  return new OpenAI({
    apiKey,
    baseURL: XAI_BASE_URL,
  });
}

export async function completeJson<T>(params: {
  system: string;
  user: string;
}): Promise<T> {
  const client = getOpenAI();

  const response = await client.chat.completions.create({
    model: MODEL,
    messages: [
      { role: "system", content: params.system },
      { role: "user", content: params.user },
    ],
    response_format: { type: "json_object" },
  });

  const text = response.choices[0]?.message?.content;
  if (!text) {
    throw new Error("The model returned an empty response");
  }

  return parseJson<T>(text);
}

function parseJson<T>(text: string): T {
  const trimmed = text.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  return JSON.parse(fenced?.[1] ?? trimmed) as T;
}
