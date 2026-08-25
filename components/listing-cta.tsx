"use client";

import {
  destinationUrl,
  formatPeriodLabel,
  formatPlanPrice,
  type CtaType,
  type PricingPlan,
} from "@/lib/cta";

const emberButton =
  "inline-flex shrink-0 items-center justify-center rounded-full bg-ember px-8 py-3.5 text-base font-medium text-ink transition-[transform,background-color,box-shadow] duration-200 ease-out hover:scale-[1.045] hover:bg-ember-soft hover:shadow-[0_12px_32px_rgba(255,77,28,0.32)] active:scale-[0.96] active:shadow-[0_4px_12px_rgba(255,77,28,0.2)]";

type Props = {
  type: CtaType | string;
  ctaUrl: string | null;
  websiteUrl: string | null;
  label: string | null;
  plans: PricingPlan[];
  businessId?: string;
  track?: boolean;
};

export function ListingCta({
  type,
  ctaUrl,
  websiteUrl,
  label,
  plans,
  businessId,
  track = true,
}: Props) {
  const dest = destinationUrl(ctaUrl, websiteUrl);
  if (!dest) return null;
  const href = track && businessId ? `/api/go/${businessId}` : dest;
  const external = !(track && businessId);

  if (type === "pricing" && plans.some((plan) => plan.name)) {
    return (
      <div className="grid w-full gap-4 md:grid-cols-3">
        {plans
          .filter((plan) => plan.name)
          .map((plan) => (
            <article
              key={plan.name}
              className="flex flex-col rounded-2xl border border-line bg-ink-soft/70 p-5"
            >
              <p className="text-[11px] uppercase tracking-[0.18em] text-paper-dim">
                {plan.name}
              </p>
              <p className="font-display mt-3 text-4xl">
                {formatPlanPrice(plan)}
                <span className="ml-1 text-base text-paper-dim">
                  {plan.period || formatPeriodLabel(plan.billing, plan.interval)}
                </span>
              </p>
              {plan.description ? (
                <p className="mt-3 text-sm leading-6 text-paper-dim">{plan.description}</p>
              ) : null}
              {plan.features.length > 0 ? (
                <ul className="mt-4 space-y-2 text-sm text-paper">
                  {plan.features.map((feature) => (
                    <li key={feature}>— {feature}</li>
                  ))}
                </ul>
              ) : null}
              <a
                href={href}
                target="_blank"
                rel="noreferrer"
                className={`${emberButton} mt-6 w-full`}
              >
                {plan.ctaLabel || "Buy now"}
              </a>
            </article>
          ))}
      </div>
    );
  }

  return (
    <a
      href={href}
      {...(external ? { target: "_blank", rel: "noreferrer" } : {})}
      className={`${emberButton} w-fit`}
    >
      {label?.trim() || (type === "visit_site" ? "Visit site" : "Book a call")}
    </a>
  );
}
