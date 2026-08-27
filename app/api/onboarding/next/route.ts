import { NextResponse } from "next/server";
import {
  INTAKE_MODEL,
  completeJson,
  parseJson,
  streamJsonText,
} from "@/lib/openai";
import { parsePartialQuestion } from "@/lib/parse-question";
import { nextQuestionSystem, nextQuestionUser, TOTAL_QUESTIONS } from "@/lib/prompts";
import { createClient } from "@/lib/supabase/server";
import type { OnboardingAnswer, OnboardingQuestion, QuestionOption } from "@/lib/types";

export const maxDuration = 60;

type NextBody = {
  painPoint?: string;
  answers?: OnboardingAnswer[];
};

type ModelQuestion = {
  question?: string;
  context?: string;
  options?: QuestionOption[];
};

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Sign in first." }, { status: 401 });
    }

    const body = (await request.json()) as NextBody;
    const painPoint = body.painPoint?.trim() ?? "";
    const answers = Array.isArray(body.answers) ? body.answers : [];

    if (painPoint.length < 8) {
      return NextResponse.json(
        { error: "Tell us a bit more about the pain point." },
        { status: 400 },
      );
    }

    if (answers.length >= TOTAL_QUESTIONS) {
      return NextResponse.json({ done: true });
    }

    const nextNumber = answers.length + 1;
    const call = {
      system: nextQuestionSystem,
      user: nextQuestionUser({ painPoint, answers, nextNumber }),
      model: INTAKE_MODEL,
      reasoningEffort: "none" as const,
      cacheKey: "dt-onboard-q",
      maxTokens: 900,
      verbosity: "low" as const,
      timeoutMs: 20_000,
    };

    const stream = request.headers.get("accept")?.includes("text/event-stream");
    if (stream) {
      return streamQuestion(call, nextNumber);
    }

    const generated = await completeJson<ModelQuestion>(call);
    const question = toQuestion(generated, nextNumber);
    if (!question) {
      return NextResponse.json(
        { error: "Could not generate the next question." },
        { status: 502 },
      );
    }

    return NextResponse.json({
      done: false,
      total: TOTAL_QUESTIONS,
      question,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not continue." },
      { status: 500 },
    );
  }
}

function streamQuestion(
  call: Parameters<typeof streamJsonText>[0],
  nextNumber: number,
) {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (payload: unknown) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(payload)}\n\n`));
      };

      try {
        let raw = "";
        try {
          for await (const piece of streamJsonText(call)) {
            raw += piece;
            send({ d: piece });
          }
        } catch {
          const generated = await completeJson<ModelQuestion>(call);
          const question = toQuestion(generated, nextNumber);
          if (!question) throw new Error("Could not generate the next question.");
          send({ done: true, total: TOTAL_QUESTIONS, question });
          controller.close();
          return;
        }

        let generated: ModelQuestion;
        try {
          generated = parseJson<ModelQuestion>(raw);
        } catch {
          generated = parsePartialQuestion(raw);
        }
        const question = toQuestion(generated, nextNumber);
        if (!question) throw new Error("Could not generate the next question.");
        send({ done: true, total: TOTAL_QUESTIONS, question });
      } catch (error) {
        send({
          error:
            error instanceof Error ? error.message : "Could not continue.",
        });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
    },
  });
}

function toQuestion(
  generated: ModelQuestion,
  nextNumber: number,
): OnboardingQuestion | null {
  const options = (generated.options ?? []).slice(0, 4);
  if (!generated.question || options.length < 3) return null;
  return {
    id: nextNumber,
    question: generated.question,
    context: generated.context,
    options,
  };
}
