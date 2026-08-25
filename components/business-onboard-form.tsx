"use client";

import { FormEvent, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { CurrencySelect } from "@/components/currency-select";
import {
  defaultCtaLabel,
  emptyPlan,
  formatPeriodLabel,
  parsePlans,
  sanitizePrice,
  type CtaType,
  type PlanBilling,
  type PlanInterval,
  type PricingPlan,
} from "@/lib/cta";
import type { ScrapedListing } from "@/lib/types";

export type ListingDraft = ScrapedListing & {
  websiteUrl: string;
  extraDetails: string;
  scrapedContent: string;
  ctaType: CtaType;
  ctaUrl: string;
  ctaLabel: string;
  plans: PricingPlan[];
  logoUrl: string;
};

const emptyDraft: ListingDraft = {
  websiteUrl: "",
  extraDetails: "",
  scrapedContent: "",
  name: "",
  tagline: "",
  description: "",
  category: "",
  tags: [],
  targetAudience: "",
  offerSummary: "",
  ctaType: "book_call",
  ctaUrl: "",
  ctaLabel: "Book a call",
  plans: [emptyPlan(), emptyPlan(), emptyPlan()],
  logoUrl: "",
};

type Props = {
  initial?: Partial<ListingDraft>;
};

export function BusinessOnboardForm({ initial }: Props) {
  const router = useRouter();
  const [draft, setDraft] = useState<ListingDraft>({
    ...emptyDraft,
    ...initial,
    plans:
      initial?.plans && initial.plans.length > 0
        ? initial.plans
        : emptyDraft.plans,
  });
  const [revealed, setRevealed] = useState(Boolean(initial?.name));
  const [understood, setUnderstood] = useState(false);
  const [scraping, setScraping] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function scrape(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setScraping(true);
    try {
      const response = await fetch("/api/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: draft.websiteUrl }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Scrape failed.");
      const listing = (data.listing ?? {}) as Partial<ScrapedListing>;
      setDraft((current) => ({
        ...current,
        ...listing,
        websiteUrl: data.url,
        scrapedContent: data.scrapedContent,
        logoUrl: data.logoUrl || current.logoUrl,
        ctaUrl: current.ctaUrl || data.url,
        targetAudience: current.targetAudience,
      }));
      setRevealed(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Scrape failed.");
    } finally {
      setScraping(false);
    }
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSaving(true);
    try {
      const response = await fetch("/api/business/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: draft.name,
          websiteUrl: draft.websiteUrl,
          tagline: draft.tagline,
          description: draft.description,
          extraDetails: draft.extraDetails,
          category: draft.category,
          tags: draft.tags,
          targetAudience: draft.targetAudience,
          offerSummary: draft.offerSummary,
          scrapedContent: draft.scrapedContent,
          ctaType: draft.ctaType,
          ctaUrl:
            draft.ctaType === "visit_site"
              ? draft.websiteUrl
              : draft.ctaUrl || draft.websiteUrl,
          ctaLabel: draft.ctaLabel,
          pricingPlans: parsePlans(draft.plans).filter((plan) => plan.name),
          logoUrl: draft.logoUrl,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Could not save.");
      router.push("/business/dashboard");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save.");
    } finally {
      setSaving(false);
    }
  }

  function update<K extends keyof ListingDraft>(key: K, value: ListingDraft[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  function setCtaType(type: CtaType) {
    setDraft((current) => ({
      ...current,
      ctaType: type,
      ctaLabel: defaultCtaLabel(type),
      ctaUrl: type === "visit_site" ? current.websiteUrl : current.ctaUrl,
    }));
  }

  function updatePlan(index: number, patch: Partial<PricingPlan>) {
    setDraft((current) => ({
      ...current,
      plans: current.plans.map((plan, i) => {
        if (i !== index) return plan;
        const next = { ...plan, ...patch };
        next.period = formatPeriodLabel(next.billing, next.interval);
        return next;
      }),
    }));
  }

  function addPlan() {
    if (draft.plans.length >= 4) return;
    update("plans", [...draft.plans, emptyPlan()]);
  }

  function removePlan(index: number) {
    update(
      "plans",
      draft.plans.filter((_, i) => i !== index),
    );
  }

  return (
    <div className="mx-auto w-full max-w-2xl space-y-12">
      <form onSubmit={scrape} className="space-y-4">
        <label className="block">
          <span className="mb-2 block text-xs uppercase tracking-[0.18em] text-paper-dim">
            Website URL
          </span>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex w-full items-end gap-3">
              {draft.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={draft.logoUrl}
                  alt=""
                  width={28}
                  height={28}
                  className="mb-2 size-7 rounded-md bg-paper object-contain"
                />
              ) : null}
              <input
                required
                value={draft.websiteUrl}
                onChange={(event) => update("websiteUrl", event.target.value)}
                placeholder="https://yourproduct.com"
                className="w-full border-b border-paper/25 bg-transparent py-3 text-lg outline-none"
              />
            </div>
            <button
              type="submit"
              disabled={scraping}
              className="shrink-0 rounded-full bg-paper px-5 py-2 text-sm font-medium text-ink disabled:opacity-60"
            >
              {scraping ? "Reading site..." : "Analyze your offer"}
            </button>
          </div>
        </label>
      </form>

      {revealed ? (
        <form onSubmit={save} className="reveal-up space-y-6">
          <Field
            label="Name"
            value={draft.name}
            onChange={(value) => update("name", value)}
          />
          <Field
            label="Tagline"
            value={draft.tagline}
            onChange={(value) => update("tagline", value)}
          />
          <Field
            label="What you offer"
            value={draft.description}
            onChange={(value) => update("description", value)}
            multiline
          />
          <Field
            label="Target audience"
            value={draft.targetAudience}
            onChange={(value) => update("targetAudience", value)}
            multiline
            placeholder="Who you sell to — role, company size, niche, geography. Be specific."
          />
          <p className="-mt-4 text-xs text-paper-dim">
            Required. If someone sits a little outside this but the job still fits you, we
            can still recommend you.
          </p>
          <Field
            label="More details (optional)"
            value={draft.extraDetails}
            onChange={(value) => update("extraDetails", value)}
            multiline
            placeholder="Who you are for, who you refuse, what makes you different from lookalike tools..."
          />
          <Field
            label="Category"
            value={draft.category}
            onChange={(value) => update("category", value)}
          />
          <Field
            label="Tags"
            value={draft.tags.join(", ")}
            onChange={(value) =>
              update(
                "tags",
                value
                  .split(",")
                  .map((tag) => tag.trim())
                  .filter(Boolean),
              )
            }
            placeholder="crm, ecommerce, leads"
          />

          <div className="border-t border-line pt-8">
            <p className="text-xs uppercase tracking-[0.18em] text-paper-dim">
              Call to action
            </p>
            <p className="mt-2 mb-6 text-sm text-paper-dim">
              This is what people see after we recommend you.
            </p>
            <div className="grid gap-3 sm:grid-cols-3">
              <CtaChoice
                selected={draft.ctaType === "visit_site"}
                title="Visit site"
                copy="One button. Sends them to the URL you pasted."
                onClick={() => setCtaType("visit_site")}
              />
              <CtaChoice
                selected={draft.ctaType === "book_call"}
                title="Book a call"
                copy="One button. Best for services, agencies, and custom work."
                onClick={() => setCtaType("book_call")}
              />
              <CtaChoice
                selected={draft.ctaType === "pricing"}
                title="Pricing plans"
                copy="Show 2–4 plans. Every Buy now still goes to your landing."
                onClick={() => setCtaType("pricing")}
              />
            </div>
            {draft.ctaType !== "visit_site" ? (
              <div className="mt-6">
                <Field
                  label="Where every button should go"
                  value={draft.ctaUrl}
                  onChange={(value) => update("ctaUrl", value)}
                  placeholder="https://yourproduct.com/#pricing"
                />
                <p className="mt-2 text-xs text-paper-dim">
                  Use a full URL, a path like /pricing, or a section like #book.
                </p>
              </div>
            ) : null}
            {draft.ctaType === "pricing" ? (
              <div className="mt-8 space-y-4">
                {draft.plans.map((plan, index) => (
                  <PlanEditor
                    key={index}
                    index={index}
                    plan={plan}
                    canRemove={draft.plans.length > 1}
                    onChange={(patch) => updatePlan(index, patch)}
                    onRemove={() => removePlan(index)}
                  />
                ))}
                {draft.plans.length < 4 ? (
                  <button
                    type="button"
                    onClick={addPlan}
                    className="text-sm text-paper underline decoration-paper/30 underline-offset-4"
                  >
                    Add another plan
                  </button>
                ) : null}
              </div>
            ) : (
              <div className="mt-6">
                <Field
                  label="Button label"
                  value={draft.ctaLabel}
                  onChange={(value) => update("ctaLabel", value)}
                  placeholder={defaultCtaLabel(draft.ctaType)}
                />
              </div>
            )}
          </div>

          {error ? <p className="text-sm text-ember">{error}</p> : null}
          <p className="max-w-md text-sm text-paper-dim">
            You cannot edit this listing after you publish. Make sure every field is
            right.
          </p>
          <label className="flex max-w-md cursor-pointer items-start gap-3 text-sm text-paper">
            <input
              type="checkbox"
              checked={understood}
              onChange={(event) => setUnderstood(event.target.checked)}
              className="mt-1 size-4 shrink-0 accent-[#ff4d1c]"
            />
            <span>I understand. Publish it locked.</span>
          </label>
          <button
            type="submit"
            disabled={
              saving ||
              !understood ||
              !draft.name.trim() ||
              draft.targetAudience.trim().length < 8
            }
            className="rounded-full bg-ember px-6 py-3 text-sm font-medium text-ink disabled:opacity-60"
          >
            {saving ? "Saving..." : "Publish listing"}
          </button>
        </form>
      ) : error ? (
        <p className="text-sm text-ember">{error}</p>
      ) : null}
    </div>
  );
}

function PlanEditor({
  index,
  plan,
  canRemove,
  onChange,
  onRemove,
}: {
  index: number;
  plan: PricingPlan;
  canRemove: boolean;
  onChange: (patch: Partial<PricingPlan>) => void;
  onRemove: () => void;
}) {
  return (
    <div className="overflow-visible rounded-2xl border border-line bg-ink-soft/50 p-5">
      <div className="mb-4 flex items-center justify-between">
        <p className="text-xs uppercase tracking-[0.18em] text-paper-dim">
          Plan {index + 1}
        </p>
        {canRemove ? (
          <button
            type="button"
            onClick={onRemove}
            className="text-xs text-paper-dim hover:text-ember"
          >
            Remove
          </button>
        ) : null}
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <Field
          label="Name"
          value={plan.name}
          onChange={(value) => onChange({ name: value })}
          placeholder="Starter"
        />
        <label className="block">
          <span className="mb-2 block text-xs uppercase tracking-[0.18em] text-paper-dim">
            Price
          </span>
          <input
            inputMode="decimal"
            value={plan.price}
            placeholder="49"
            onChange={(event) => onChange({ price: sanitizePrice(event.target.value) })}
            className="w-full border-b border-paper/25 bg-transparent py-3 outline-none"
          />
        </label>
        <CurrencySelect
          value={plan.currency}
          onChange={(currency) => onChange({ currency })}
        />
      </div>
      <div className="mt-5">
        <p className="mb-2 text-xs uppercase tracking-[0.18em] text-paper-dim">
          Period
        </p>
        <div className="flex flex-wrap gap-2">
          {(["one_time", "period"] as PlanBilling[]).map((billing) => (
            <Chip
              key={billing}
              selected={plan.billing === billing}
              onClick={() => onChange({ billing })}
            >
              {billing === "one_time" ? "one time" : "period"}
            </Chip>
          ))}
        </div>
        {plan.billing === "period" ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {(["daily", "weekly", "monthly", "yearly"] as PlanInterval[]).map(
              (interval) => (
                <Chip
                  key={interval}
                  selected={plan.interval === interval}
                  onClick={() => onChange({ interval })}
                >
                  {interval}
                </Chip>
              ),
            )}
          </div>
        ) : null}
      </div>
      <div className="mt-4">
        <Field
          label="Short pitch"
          value={plan.description}
          onChange={(value) => onChange({ description: value })}
          placeholder="For a single store finding its first repeatable channel."
        />
      </div>
      <div className="mt-4">
        <Field
          label="Features"
          value={plan.features.join(", ")}
          onChange={(value) =>
            onChange({
              features: value
                .split(",")
                .map((feature) => feature.trim())
                .filter(Boolean),
            })
          }
          placeholder="1 pipeline, Email sequences, Basic attribution"
        />
      </div>
      <div className="mt-4">
        <Field
          label="Button label"
          value={plan.ctaLabel}
          onChange={(value) => onChange({ ctaLabel: value })}
          placeholder="Buy now"
        />
      </div>
    </div>
  );
}

function Chip({
  selected,
  children,
  onClick,
}: {
  selected: boolean;
  children: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-3 py-1.5 text-sm ${
        selected
          ? "bg-ember text-ink"
          : "border border-line text-paper hover:border-paper/40"
      }`}
    >
      {children}
    </button>
  );
}

function CtaChoice({
  selected,
  title,
  copy,
  onClick,
}: {
  selected: boolean;
  title: string;
  copy: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-2xl border px-4 py-4 text-left transition-colors ${
        selected
          ? "border-ember bg-ink-soft"
          : "border-line bg-transparent hover:border-paper/30"
      }`}
    >
      <span className="block text-base text-paper">{title}</span>
      <span className="mt-1 block text-sm text-paper-dim">{copy}</span>
    </button>
  );
}

function Field({
  label,
  value,
  onChange,
  multiline,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  multiline?: boolean;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs uppercase tracking-[0.18em] text-paper-dim">
        {label}
      </span>
      {multiline ? (
        <textarea
          value={value}
          placeholder={placeholder}
          onChange={(event) => onChange(event.target.value)}
          rows={4}
          className="w-full resize-y border border-line bg-ink-soft/50 px-4 py-3 outline-none"
        />
      ) : (
        <input
          value={value}
          placeholder={placeholder}
          onChange={(event) => onChange(event.target.value)}
          className="w-full border-b border-paper/25 bg-transparent py-3 outline-none"
        />
      )}
    </label>
  );
}
