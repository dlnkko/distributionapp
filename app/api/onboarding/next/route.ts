import { NextResponse } from "next/server";
import { completeJson } from "@/lib/openai";
import { nextQuestionSystem, nextQuestionUser, TOTAL_QUESTIONS } from "@/lib/prompts";
import type { OnboardingAnswer, OnboardingQuestion, QuestionOption } from "@/lib/types";

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
    const generated = await completeJson<ModelQuestion>({
      system: nextQuestionSystem,
      user: nextQuestionUser({ painPoint, answers, nextNumber }),
    });

    const options = (generated.options ?? []).slice(0, 4);
    if (!generated.question || options.length < 3) {
      return NextResponse.json(
        { error: "Could not generate the next question." },
        { status: 502 },
      );
    }

    const question: OnboardingQuestion = {
      id: nextNumber,
      question: generated.question,
      context: generated.context,
      options,
    };

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
