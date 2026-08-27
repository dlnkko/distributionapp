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

  const why = match.why?.filter(Boolean) ?? [];
  const host = hostFrom(match.websiteUrl);
  const blurb = match.tagline || match.offerSummary;

  return (
    <section className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-6 pb-24 pt-10">
      <p className="reveal-item text-[11px] uppercase tracking-[0.28em] text-ember">
        This one
      </p>

      <article className="reveal-item mt-8 rounded-3xl border border-line bg-ink-soft/60 px-6 py-8 sm:px-10 sm:py-10">
        <div className="flex items-start gap-5">
          {match.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={match.logoUrl}
              alt=""
              width={72}
              height={72}
              className="size-[4.5rem] shrink-0 rounded-2xl bg-paper object-contain p-1.5"
            />
          ) : (
            <div className="flex size-[4.5rem] shrink-0 items-center justify-center rounded-2xl bg-ink text-2xl text-ember">
              {match.name.slice(0, 1).toUpperCase()}
            </div>
          )}
          <div className="min-w-0">
            <h1 className="font-display text-4xl leading-[0.95] tracking-tight sm:text-6xl">
              {match.name}
            </h1>
            {blurb ? (
              <p className="mt-3 text-lg leading-7 text-paper-dim sm:text-xl">
                {blurb}
              </p>
            ) : null}
            {host ? <p className="mt-2 text-sm text-paper-dim">{host}</p> : null}
          </div>
        </div>

        {match.insight ? (
          <blockquote className="font-display mt-10 max-w-2xl text-2xl leading-snug italic text-ember-soft">
            {match.insight}
          </blockquote>
        ) : null}

        {why.length > 0 ? (
          <div className="mt-10">
            <p className="text-xs uppercase tracking-[0.18em] text-paper-dim">
              Why it fits you
            </p>
            <ol className="mt-5 space-y-5">
              {why.map((line, index) => (
                <li key={`${index}-${line.slice(0, 24)}`} className="flex gap-4">
                  <span className="font-display w-6 shrink-0 text-ember">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <p className="text-[15px] leading-7 text-paper">{line}</p>
                </li>
              ))}
            </ol>
          </div>
        ) : (
          <p className="mt-8 max-w-xl text-[15px] leading-7 text-paper-dim">
            {match.reason}
          </p>
        )}

        <div className="mt-10">
          <ListingCta
            type={match.ctaType}
            ctaUrl={match.ctaUrl}
            websiteUrl={match.websiteUrl}
            label={match.ctaLabel}
            plans={match.pricingPlans}
            businessId={match.businessId}
          />
        </div>
      </article>

      <div
        className="reveal-item mt-8 flex items-center justify-between gap-4 text-sm text-paper-dim"
        style={{ animationDelay: "280ms" }}
      >
        <Link href="/" className="transition-colors hover:text-paper">
          Search another pain
        </Link>
        <p className="uppercase tracking-[0.18em] text-[11px]">
          {Math.round(match.score)} / 100
        </p>
      </div>
    </section>
  );
}

function hostFrom(url: string | null) {
  if (!url?.trim()) return null;
  try {
    return new URL(/^https?:\/\//i.test(url) ? url : `https://${url}`).hostname.replace(
      /^www\./,
      "",
    );
  } catch {
    return null;
  }
}
