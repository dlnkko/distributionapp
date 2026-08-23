"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { MatchResult } from "@/lib/types";

export function MatchReveal() {
  const [match, setMatch] = useState<MatchResult | null>(null);

  useEffect(() => {
    const raw = sessionStorage.getItem("distribution-match");
    if (!raw) return;
    setMatch(JSON.parse(raw) as MatchResult);
  }, []);

  if (!match) {
    return (
      <section className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center px-6 py-20">
        <h1 className="font-display text-4xl">No match sitting here yet.</h1>
        <Link href="/" className="mt-6 text-ember">
          Start from a pain point
        </Link>
      </section>
    );
  }

  return (
    <section className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center px-6 py-16">
      <p className="text-xs uppercase tracking-[0.22em] text-ember">
        Best match · {Math.round(match.score)} / 100
      </p>
      <h1 className="font-display mt-6 text-5xl leading-none sm:text-7xl">
        {match.name}
      </h1>
      {match.tagline ? (
        <p className="mt-5 text-xl text-paper-dim">{match.tagline}</p>
      ) : null}
      <p className="mt-8 max-w-2xl text-lg leading-8 text-paper">{match.reason}</p>
      {match.offerSummary ? (
        <p className="mt-6 max-w-2xl text-paper-dim">{match.offerSummary}</p>
      ) : null}
      <div className="mt-10 flex flex-wrap gap-3">
        {match.websiteUrl ? (
          <a
            href={match.websiteUrl}
            target="_blank"
            rel="noreferrer"
            className="rounded-full bg-ember px-6 py-3 text-sm font-medium text-ink"
          >
            Open their site
          </a>
        ) : null}
        <Link
          href="/"
          className="rounded-full border border-line px-6 py-3 text-sm text-paper"
        >
          Search another pain
        </Link>
      </div>
    </section>
  );
}
