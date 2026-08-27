"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { parsePartialQuestion } from "@/lib/parse-question";
import { takePrefetch } from "@/lib/prefetch-question";
import { TOTAL_QUESTIONS } from "@/lib/prompts";
import type {
  MatchResult,
  OnboardingAnswer,
  OnboardingQuestion,
} from "@/lib/types";

const WRITE_IN_ID = "write";

type Props = {
  painPoint: string;
};

type Phase = "loading" | "in" | "out" | "matching";

export function QuestionFlow({ painPoint }: Props) {
  const router = useRouter();
  const [answers, setAnswers] = useState<OnboardingAnswer[]>([]);
  const [question, setQuestion] = useState<OnboardingQuestion | null>(null);
  const [ready, setReady] = useState(false);
  const [picked, setPicked] = useState<string | null>(null);
  const [writeIn, setWriteIn] = useState("");
  const [error, setError] = useState("");
  const [phase, setPhase] = useState<Phase>("loading");

  useEffect(() => {
    let cancelled = false;

    async function loadFirst() {
      setPhase("loading");
      setError("");
      try {
        const prefetched = takePrefetch(painPoint);
        const questionData = await readNextQuestion(
          painPoint,
          [],
          (partial) => {
            if (cancelled) return;
            setQuestion(partial);
            setPhase("in");
          },
          prefetched,
        );
        if (!cancelled) {
          setQuestion(questionData);
          setReady(true);
          setPhase("in");
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Something went wrong.");
        }
      }
    }

    void loadFirst();
    return () => {
      cancelled = true;
    };
  }, [painPoint]);

  useEffect(() => {
    setWriteIn("");
    setPicked(null);
  }, [question?.id]);

  async function choose(optionId: string, label: string) {
    if (!question || !ready || phase === "out" || phase === "matching") return;
    const trimmed = label.trim();
    if (!trimmed) return;

    const nextAnswers: OnboardingAnswer[] = [
      ...answers,
      {
        questionId: question.id,
        question: question.question,
        optionId,
        label: trimmed,
      },
    ];
    const previousQuestion = question;
    const previousAnswers = answers;
    setAnswers(nextAnswers);
    setPicked(optionId);
    setError("");
    setPhase("out");
    await wait(340);

    try {
      if (nextAnswers.length >= TOTAL_QUESTIONS) {
        setPhase("matching");
        setQuestion(null);
        setReady(false);
        const response = await fetch("/api/onboarding/match", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ painPoint, answers: nextAnswers }),
        });
        const data = (await response.json()) as MatchResult & { error?: string };
        if (!response.ok) throw new Error(data.error ?? "Could not match.");
        sessionStorage.setItem("distribution-match", JSON.stringify(data));
        router.push(`/match?id=${data.sessionId}`);
        return;
      }

      setQuestion(null);
      setReady(false);
      setPicked(null);
      setPhase("loading");
      const next = await readNextQuestion(painPoint, nextAnswers, (partial) => {
        setQuestion(partial);
        setPhase("in");
      });
      setQuestion(next);
      setReady(true);
      setPhase("in");
    } catch (err) {
      setAnswers(previousAnswers);
      setQuestion(previousQuestion);
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setPicked(null);
      setPhase("in");
      setReady(true);
    }
  }

  function submitWriteIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void choose(WRITE_IN_ID, writeIn);
  }

  const step = Math.min(answers.length + (question ? 1 : 0), TOTAL_QUESTIONS);
  const progress =
    phase === "matching"
      ? 100
      : ((answers.length + (ready ? 0.15 : 0)) / TOTAL_QUESTIONS) * 100;
  const matching = phase === "matching";
  const writing = writeIn.length > 0;
  const canSubmitWrite = writeIn.trim().length >= 2;

  return (
    <section className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-6 pb-20 pt-8">
      <p className="text-xs uppercase tracking-[0.22em] text-paper-dim">
        {matching ? "Matching" : `Question ${Math.max(step, 1)} of ${TOTAL_QUESTIONS}`}
      </p>
      <div className="mt-4 h-px overflow-hidden bg-line">
        <div
          className="h-px bg-ember transition-all duration-700 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
      <p className="mt-6 max-w-xl text-sm leading-6 text-paper-dim">
        “{painPoint}”
      </p>

      {error ? <p className="mt-10 text-ember">{error}</p> : null}

      {matching ? (
        <div className="q-in mt-16">
          <h2 className="font-display text-4xl italic text-paper">
            Finding the one that fits.
          </h2>
          <p className="mt-4 max-w-md text-paper-dim">
            Holding your answers against the live catalog — not the first
            lookalike.
          </p>
          <div className="mt-10 h-px w-40 overflow-hidden bg-line">
            <div className="match-sweep h-px bg-ember" />
          </div>
        </div>
      ) : null}

      {!error && !matching && !question && phase === "loading" ? (
        <QuestionSkeleton />
      ) : null}

      {question && !matching && !error ? (
        <div
          key={question.id}
          className={`mt-10 ${phase === "out" ? "q-out" : "q-in"}`}
        >
          {question.context ? (
            <p className="mb-5 max-w-xl text-sm leading-6 text-ember-soft">
              {question.context}
            </p>
          ) : null}
          <h2 className="font-display text-3xl leading-tight text-paper sm:text-4xl">
            {question.question}
            {!ready ? (
              <span className="placeholder-caret ml-1 align-middle" />
            ) : null}
          </h2>
          <div className="mt-10 flex flex-col gap-3">
            {question.options.map((option, index) => {
              const selected = picked === option.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  disabled={!ready || phase === "out"}
                  style={{ animationDelay: `${80 + index * 70}ms` }}
                  onClick={() => choose(option.id, option.label)}
                  className={`q-opt rounded-2xl border px-5 py-4 text-left transition-[border-color,background-color,transform,opacity] duration-300 ${
                    selected
                      ? "scale-[1.01] border-ember bg-ink-soft"
                      : writing || phase === "out"
                        ? "border-line bg-ink-soft/40 opacity-40"
                        : "border-line bg-ink-soft/70 hover:border-ember/70 hover:bg-ink-soft disabled:opacity-60"
                  }`}
                >
                  <span className="block text-base text-paper">{option.label}</span>
                  {option.hint ? (
                    <span className="mt-1 block text-sm text-paper-dim">
                      {option.hint}
                    </span>
                  ) : null}
                </button>
              );
            })}
            {!ready && question.options.length < 4 ? (
              <QuestionSkeletonOptions missing={4 - question.options.length} />
            ) : null}
            {ready || question.options.length >= 3 ? (
              <form
                onSubmit={submitWriteIn}
                style={{
                  animationDelay: `${80 + question.options.length * 70}ms`,
                }}
                className={`q-opt rounded-2xl border px-5 py-4 text-left transition-[border-color,background-color,opacity] duration-300 ${
                  writing || picked === WRITE_IN_ID
                    ? "border-ember bg-ink-soft"
                    : phase === "out"
                      ? "border-line bg-ink-soft/40 opacity-40"
                      : "border-line bg-ink-soft/70 focus-within:border-ember/70"
                }`}
              >
                <label
                  htmlFor="write-in"
                  className="block text-sm text-paper-dim"
                >
                  Something else
                </label>
                <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end">
                  <input
                    id="write-in"
                    value={writeIn}
                    disabled={!ready || phase === "out"}
                    onChange={(event) => {
                      setWriteIn(event.target.value);
                      setPicked(WRITE_IN_ID);
                    }}
                    onFocus={() => setPicked(WRITE_IN_ID)}
                    placeholder="Write it in your own words"
                    className="w-full bg-transparent text-base text-paper outline-none placeholder:text-paper/35 disabled:opacity-60"
                  />
                  <button
                    type="submit"
                    disabled={!ready || phase === "out" || !canSubmitWrite}
                    className="btn btn-ember shrink-0 self-start px-4 py-1.5 text-sm sm:self-auto"
                  >
                    Continue
                  </button>
                </div>
              </form>
            ) : null}
          </div>
        </div>
      ) : null}
    </section>
  );
}

function QuestionSkeleton() {
  return (
    <div className="mt-16 space-y-4">
      <div className="pulse-line h-5 w-2/3 max-w-md rounded-md bg-ember/15" />
      <div className="pulse-line h-9 w-4/5 max-w-lg rounded-md bg-paper/8" />
      <div className="pulse-line h-9 w-1/2 max-w-sm rounded-md bg-paper/6" />
      <div className="mt-10 space-y-3">
        <div className="pulse-line h-16 rounded-2xl bg-paper/5" />
        <div className="pulse-line h-16 rounded-2xl bg-paper/5" />
        <div className="pulse-line h-16 rounded-2xl bg-paper/5" />
        <div className="pulse-line h-16 rounded-2xl bg-paper/5" />
      </div>
    </div>
  );
}

function QuestionSkeletonOptions({ missing }: { missing: number }) {
  return (
    <>
      {Array.from({ length: missing }).map((_, index) => (
        <div key={index} className="pulse-line h-16 rounded-2xl bg-paper/5" />
      ))}
    </>
  );
}

async function readNextQuestion(
  painPoint: string,
  answers: OnboardingAnswer[],
  onPartial: (question: OnboardingQuestion) => void,
  prefetched?: Promise<Response> | null,
) {
  const response = await (prefetched ??
    fetch("/api/onboarding/next", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "text/event-stream",
      },
      body: JSON.stringify({ painPoint, answers }),
    }));

  if (!response.ok) {
    const data = (await response.json().catch(() => ({}))) as { error?: string };
    throw new Error(data.error ?? "Could not continue.");
  }

  const nextNumber = answers.length + 1;
  if (
    !response.body ||
    !response.headers.get("content-type")?.includes("text/event-stream")
  ) {
    const data = (await response.json()) as {
      question?: OnboardingQuestion;
      error?: string;
    };
    if (!data.question) throw new Error(data.error ?? "Could not continue.");
    return data.question;
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let raw = "";
  let finalQuestion: OnboardingQuestion | null = null;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const frames = buffer.split("\n\n");
    buffer = frames.pop() ?? "";
    for (const frame of frames) {
      const line = frame.split("\n").find((entry) => entry.startsWith("data: "));
      if (!line) continue;
      const payload = JSON.parse(line.slice(6)) as {
        d?: string;
        done?: boolean;
        question?: OnboardingQuestion;
        error?: string;
      };
      if (payload.error) throw new Error(payload.error);
      if (payload.d) {
        raw += payload.d;
        const partial = parsePartialQuestion(raw);
        if (partial.question) {
          onPartial({
            id: nextNumber,
            question: partial.question,
            context: partial.context,
            options: partial.options,
          });
        }
      }
      if (payload.done && payload.question) {
        finalQuestion = payload.question;
      }
    }
  }

  if (finalQuestion) return finalQuestion;
  const fallback = parsePartialQuestion(raw);
  if (!fallback.question || fallback.options.length < 3) {
    throw new Error("Could not continue.");
  }
  return {
    id: nextNumber,
    question: fallback.question,
    context: fallback.context,
    options: fallback.options,
  };
}

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
