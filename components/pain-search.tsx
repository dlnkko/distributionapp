"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PENDING_PAIN_KEY, findPathForPain } from "@/lib/auth";
import { prefetchFirstQuestion } from "@/lib/prefetch-question";

type Props = {
  signedIn?: boolean;
};

const PHRASES = [
  "I want to create AI videos",
  "I need more ecom leads for my business",
  "I need a CRM",
  "I need a calorie tracking app for a calorie deficit program",
];

export function PainSearch({ signedIn = false }: Props) {
  const router = useRouter();
  const [value, setValue] = useState("");
  const [typed, setTyped] = useState("");

  useEffect(() => {
    const pending = sessionStorage.getItem(PENDING_PAIN_KEY)?.trim() ?? "";
    if (pending.length < 8) return;
    if (!signedIn) return;
    sessionStorage.removeItem(PENDING_PAIN_KEY);
    prefetchFirstQuestion(pending);
    router.replace(findPathForPain(pending));
  }, [signedIn, router]);

  useEffect(() => {
    if (value) return;

    let cancelled = false;
    let phraseIndex = 0;
    let charIndex = 0;
    let mode: "type" | "hold" | "delete" = "type";
    let timer = 0;

    function schedule(fn: () => void, ms: number) {
      timer = window.setTimeout(fn, ms);
    }

    function tick() {
      if (cancelled) return;
      const phrase = PHRASES[phraseIndex];

      if (mode === "type") {
        charIndex += 1;
        setTyped(phrase.slice(0, charIndex));
        if (charIndex >= phrase.length) {
          mode = "hold";
          schedule(tick, 3000);
          return;
        }
        schedule(tick, 36 + Math.round(Math.random() * 28));
        return;
      }

      if (mode === "hold") {
        mode = "delete";
        schedule(tick, 28);
        return;
      }

      charIndex -= 1;
      setTyped(phrase.slice(0, Math.max(charIndex, 0)));
      if (charIndex <= 0) {
        phraseIndex = (phraseIndex + 1) % PHRASES.length;
        mode = "type";
        schedule(tick, 320);
        return;
      }
      schedule(tick, 18 + Math.round(Math.random() * 14));
    }

    schedule(tick, 280);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [value]);

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const pain = value.trim();
    if (pain.length < 8) return;
    sessionStorage.setItem(PENDING_PAIN_KEY, pain);
    const dest = findPathForPain(pain);
    if (!signedIn) {
      router.push(
        `/login?intent=search&next=/find&q=${encodeURIComponent(pain)}`,
      );
      return;
    }
    sessionStorage.removeItem(PENDING_PAIN_KEY);
    prefetchFirstQuestion(pain);
    router.push(dest);
  }

  return (
    <form onSubmit={onSubmit} className="w-full">
      <label className="sr-only" htmlFor="pain">
        Your pain point
      </label>
      <div className="flex flex-col gap-4 border-b border-paper/25 pb-3 sm:flex-row sm:items-end">
        <div className="relative w-full">
          {value ? null : (
            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 flex items-center text-xl text-paper/30 sm:text-2xl"
            >
              <span className="truncate">{typed}</span>
              <span className="placeholder-caret" />
            </span>
          )}
          <input
            id="pain"
            value={value}
            onChange={(event) => setValue(event.target.value)}
            className="relative w-full bg-transparent text-xl text-paper outline-none sm:text-2xl"
          />
        </div>
        <button
          type="submit"
          className="btn btn-ember shrink-0 px-5 py-2 text-sm"
        >
          Find it
        </button>
      </div>
    </form>
  );
}
