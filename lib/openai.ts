import OpenAI from "openai";

const MODEL = process.env.OPENAI_MODEL ?? "gpt-5.6";

export function getOpenAI() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("Missing OPENAI_API_KEY");
  }
  return new OpenAI({ apiKey });
}

export async function completeJson<T>(params: {
  system: string;
  user: string;
}): Promise<T> {
  const openai = getOpenAI();

  const response = await openai.responses.create({
    model: MODEL,
    input: [
      { role: "system", content: params.system },
      { role: "user", content: params.user },
    ],
    text: { format: { type: "json_object" } },
    store: false,
  });

  const text = response.output_text;
  if (!text) {
    throw new Error("The model returned an empty response");
  }

  return JSON.parse(text) as T;
}
