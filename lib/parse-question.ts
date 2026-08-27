import type { QuestionOption } from "@/lib/types";

export type PartialQuestion = {
  question?: string;
  context?: string;
  options: QuestionOption[];
};

export function parsePartialQuestion(raw: string): PartialQuestion {
  return {
    question: readJsonString(raw, "question")?.value,
    context: readJsonString(raw, "context")?.value,
    options: readOptionObjects(raw),
  };
}

function readJsonString(
  raw: string,
  key: string,
): { value: string; complete: boolean } | null {
  const keyToken = `"${key}"`;
  const keyIdx = raw.indexOf(keyToken);
  if (keyIdx < 0) return null;
  const colon = raw.indexOf(":", keyIdx + keyToken.length);
  if (colon < 0) return null;
  let i = colon + 1;
  while (i < raw.length && /\s/.test(raw[i])) i += 1;
  if (raw[i] !== '"') return null;
  i += 1;
  let body = "";
  while (i < raw.length) {
    const ch = raw[i];
    if (ch === "\\") {
      body += ch + (raw[i + 1] ?? "");
      i += 2;
      continue;
    }
    if (ch === '"') {
      return { value: decodeJsonString(body), complete: true };
    }
    body += ch;
    i += 1;
  }
  return body ? { value: decodeJsonString(body), complete: false } : null;
}

function readOptionObjects(raw: string): QuestionOption[] {
  const start = raw.search(/"options"\s*:\s*\[/);
  if (start < 0) return [];
  const bracket = raw.indexOf("[", start);
  if (bracket < 0) return [];

  const options: QuestionOption[] = [];
  let i = bracket + 1;
  while (i < raw.length && options.length < 4) {
    const next = raw.indexOf("{", i);
    if (next < 0) break;
    const end = findMatchingBrace(raw, next);
    if (end < 0) break;
    try {
      const parsed = JSON.parse(raw.slice(next, end + 1)) as {
        id?: string;
        label?: string;
        hint?: string;
      };
      if (parsed.label) {
        options.push({
          id: parsed.id || ["a", "b", "c", "d"][options.length],
          label: parsed.label,
          hint: parsed.hint,
        });
      }
    } catch {
      break;
    }
    i = end + 1;
  }
  return options;
}

function findMatchingBrace(raw: string, open: number) {
  let depth = 0;
  let inString = false;
  let escape = false;
  for (let i = open; i < raw.length; i += 1) {
    const ch = raw[i];
    if (inString) {
      if (escape) {
        escape = false;
      } else if (ch === "\\") {
        escape = true;
      } else if (ch === '"') {
        inString = false;
      }
      continue;
    }
    if (ch === '"') {
      inString = true;
      continue;
    }
    if (ch === "{") depth += 1;
    if (ch === "}") {
      depth -= 1;
      if (depth === 0) return i;
    }
  }
  return -1;
}

function decodeJsonString(body: string) {
  try {
    return JSON.parse(`"${body}"`) as string;
  } catch {
    return body;
  }
}
