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
    if (!question || matching) return;

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
    setQuestion(null);
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
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  const step = Math.min(answers.length + (question ? 1 : 0), TOTAL_QUESTIONS);
  const progress = (answers.length / TOTAL_QUESTIONS) * 100;

  return (
    <section className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-6 pb-20 pt-8">
      <p className="text-xs uppercase tracking-[0.22em] text-paper-dim">
        {matching ? "Matching" : `Question ${step} of ${TOTAL_QUESTIONS}`}
      </p>
      <div className="mt-4 h-px bg-line">
        <div
          className="h-px bg-ember transition-all duration-500"
          style={{ width: `${matching ? 100 : progress}%` }}
        />
      </div>
      <p className="mt-6 text-sm text-paper-dim">You said: “{painPoint}”</p>

      {error ? (
        <p className="mt-10 text-ember">{error}</p>
      ) : loading || matching || !question ? (
        <div className="mt-16">
          <h2 className="font-display text-4xl italic text-paper">
            {matching ? "Finding the one that fits." : "Listening..."}
          </h2>
          <p className="mt-4 max-w-md text-paper-dim">
            {matching
              ? "We are reading your answers against the live catalog."
              : "The next question is being written for this exact problem."}
          </p>
        </div>
      ) : (
        <div key={question.id} className="rise mt-10">
          {question.context ? (
            <p className="mb-4 text-sm text-ember-soft">{question.context}</p>
          ) : null}
          <h2 className="font-display text-3xl leading-tight text-paper sm:text-4xl">
            {question.question}
          </h2>
          <div className="mt-10 flex flex-col gap-3">
            {question.options.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => choose(option.id, option.label)}
                className="group rounded-2xl border border-line bg-ink-soft/70 px-5 py-4 text-left transition-colors hover:border-ember/70 hover:bg-ink-soft"
              >
                <span className="block text-base text-paper">{option.label}</span>
                {option.hint ? (
                  <span className="mt-1 block text-sm text-paper-dim group-hover:text-paper/70">
                    {option.hint}
                  </span>
                ) : null}
              </button>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
