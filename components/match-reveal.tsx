"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ListingCta } from "@/components/listing-cta";
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
      <section className="mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center px-6 py-20">
        <h1 className="font-display text-4xl">No match sitting here yet.</h1>
        <Link href="/" className="mt-6 text-sm text-ember">
          Start from a pain point
        </Link>
      </section>
    );
  }

  return (
    <section className="reveal-up mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center px-6 py-20">
      <div className="flex items-baseline justify-between gap-6">
        <p className="text-[11px] uppercase tracking-[0.28em] text-ember">Your match</p>
        <p className="text-[11px] uppercase tracking-[0.2em] text-paper-dim">
          {Math.round(match.score)} / 100
        </p>
      </div>

      <div className="mt-10 flex items-center gap-5">
        {match.logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={match.logoUrl}
            alt=""
            width={72}
            height={72}
            className="size-[4.5rem] shrink-0 rounded-2xl bg-paper object-contain p-1.5"
          />
        ) : null}
        <div className="min-w-0">
          <h1 className="font-display text-5xl leading-[0.95] tracking-tight sm:text-6xl">
            {match.name}
          </h1>
          {match.tagline ? (
            <p className="mt-3 text-lg leading-7 text-paper-dim sm:text-xl">
              {match.tagline}
            </p>
          ) : null}
        </div>
      </div>

      {match.offerSummary ? (
        <p className="mt-10 max-w-xl text-xl leading-8 text-paper">
          {match.offerSummary}
        </p>
      ) : null}

      <p className="mt-6 max-w-xl text-[15px] leading-7 text-paper-dim">
        {match.reason}
      </p>

      <div className="mt-12 flex flex-col items-start gap-5 sm:flex-row sm:items-center">
        <ListingCta
          type={match.ctaType}
          ctaUrl={match.ctaUrl}
          websiteUrl={match.websiteUrl}
          label={match.ctaLabel}
          plans={match.pricingPlans}
          businessId={match.businessId}
        />
        <Link
          href="/"
          className="text-sm text-paper-dim transition-colors hover:text-paper"
        >
          Search another pain
        </Link>
      </div>
    </section>
  );
}
