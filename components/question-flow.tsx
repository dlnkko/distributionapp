"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { TOTAL_QUESTIONS } from "@/lib/prompts";
import type {
  MatchResult,
  OnboardingAnswer,
  OnboardingQuestion,
} from "@/lib/types";

type Props = {
  painPoint: string;
};

export function QuestionFlow({ painPoint }: Props) {
  const router = useRouter();
  const [answers, setAnswers] = useState<OnboardingAnswer[]>([]);
  const [question, setQuestion] = useState<OnboardingQuestion | null>(null);
  const [loading, setLoading] = useState(true);
  const [picked, setPicked] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [matching, setMatching] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadFirst() {
      setLoading(true);
      setError("");
      try {
        const response = await fetch("/api/onboarding/next", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ painPoint, answers: [] }),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error ?? "Could not start.");
        if (!cancelled) setQuestion(data.question);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Something went wrong.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadFirst();
    return () => {
      cancelled = true;
    };
  }, [painPoint]);

  async function choose(optionId: string, label: string) {
    if (!question || matching || loading) return;

    const nextAnswers: OnboardingAnswer[] = [
      ...answers,
      {
        questionId: question.id,
        question: question.question,
        optionId,
        label,
      },
    ];
    setAnswers(nextAnswers);
    setPicked(optionId);
    setLoading(true);
    setError("");

    try {
      if (nextAnswers.length >= TOTAL_QUESTIONS) {
        setMatching(true);
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

      const response = await fetch("/api/onboarding/next", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ painPoint, answers: nextAnswers }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Could not continue.");
      setQuestion(data.question);
      setPicked(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setPicked(null);
    } finally {
      setLoading(false);
    }
  }

  const step = Math.min(answers.length + (question ? 1 : 0), TOTAL_QUESTIONS);
  const progress = (answers.length / TOTAL_QUESTIONS) * 100;
  const holding = Boolean(loading && picked && question && !matching);

  return (
    <section className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-6 pb-20 pt-8">
      <p className="text-xs uppercase tracking-[0.22em] text-paper-dim">
        {matching ? "Matching" : `Question ${Math.max(step, 1)} of ${TOTAL_QUESTIONS}`}
      </p>
      <div className="mt-4 h-px bg-line">
        <div
          className="h-px bg-ember transition-all duration-700 ease-out"
          style={{ width: `${matching ? 100 : progress}%` }}
        />
      </div>
      <p className="mt-6 text-sm text-paper-dim">You said: “{painPoint}”</p>

      {error ? <p className="mt-10 text-ember">{error}</p> : null}

      {matching ? (
        <div className="q-in mt-16">
          <h2 className="font-display text-4xl italic text-paper">Finding the one that fits.</h2>
          <p className="mt-4 max-w-md text-paper-dim">
            Reading your answers against the live catalog.
          </p>
        </div>
      ) : null}

      {!error && !matching && !question && loading ? (
        <div className="mt-16 space-y-4">
          <div className="pulse-line h-9 w-4/5 max-w-md rounded-md bg-paper/8" />
          <div className="pulse-line h-9 w-2/3 max-w-sm rounded-md bg-paper/6" />
          <div className="mt-10 space-y-3">
            <div className="pulse-line h-16 rounded-2xl bg-paper/5" />
            <div className="pulse-line h-16 rounded-2xl bg-paper/5" />
            <div className="pulse-line h-16 rounded-2xl bg-paper/5" />
          </div>
        </div>
      ) : null}

      {question && !matching && !error ? (
        <div key={question.id} className={`mt-10 ${holding ? "q-hold" : "q-in"}`}>
          {question.context ? (
            <p className="mb-4 text-sm text-ember-soft">{question.context}</p>
          ) : null}
          <h2 className="font-display text-3xl leading-tight text-paper sm:text-4xl">
            {question.question}
          </h2>
          <div className="mt-10 flex flex-col gap-3">
            {question.options.map((option) => {
              const selected = picked === option.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  disabled={loading}
                  onClick={() => choose(option.id, option.label)}
                  className={`rounded-2xl border px-5 py-4 text-left transition-[border-color,background-color,transform,opacity] duration-300 ${
                    selected
                      ? "scale-[1.01] border-ember bg-ink-soft"
                      : holding
                        ? "border-line bg-ink-soft/40 opacity-45"
                        : "border-line bg-ink-soft/70 hover:border-ember/70 hover:bg-ink-soft disabled:opacity-60"
                  }`}
                >
                  <span className="block text-base text-paper">{option.label}</span>
                  {option.hint ? (
                    <span className="mt-1 block text-sm text-paper-dim">{option.hint}</span>
                  ) : null}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </section>
  );
}
