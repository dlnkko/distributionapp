"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import type { ScrapedListing } from "@/lib/types";

type Draft = ScrapedListing & {
  websiteUrl: string;
  extraDetails: string;
  scrapedContent: string;
};

const emptyDraft: Draft = {
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
};

export function BusinessOnboardForm() {
  const router = useRouter();
  const [draft, setDraft] = useState<Draft>(emptyDraft);
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
      setDraft((current) => ({
        ...current,
        websiteUrl: data.url,
        scrapedContent: data.scrapedContent,
        ...data.listing,
      }));
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

  function update<K extends keyof Draft>(key: K, value: Draft[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  return (
    <div className="mx-auto w-full max-w-2xl space-y-12">
      <form onSubmit={scrape} className="space-y-4">
        <label className="block">
          <span className="mb-2 block text-xs uppercase tracking-[0.18em] text-paper-dim">
            Website URL
          </span>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <input
              required
              value={draft.websiteUrl}
              onChange={(event) => update("websiteUrl", event.target.value)}
              placeholder="https://yourproduct.com"
              className="w-full border-b border-paper/25 bg-transparent py-3 text-lg outline-none"
            />
            <button
              type="submit"
              disabled={scraping}
              className="shrink-0 rounded-full bg-paper px-5 py-2 text-sm font-medium text-ink disabled:opacity-60"
            >
              {scraping ? "Reading site..." : "Scrape & understand"}
            </button>
          </div>
        </label>
        <p className="text-sm text-paper-dim">
          We use Firecrawl to read the page, then GPT-5.6 writes the listing draft.
        </p>
      </form>

      <form onSubmit={save} className="space-y-6">
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
          label="More details (optional)"
          value={draft.extraDetails}
          onChange={(value) => update("extraDetails", value)}
          multiline
          placeholder="Pricing notes, who you refuse, what makes you the right match..."
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
        {error ? <p className="text-sm text-ember">{error}</p> : null}
        <button
          type="submit"
          disabled={saving || !draft.name}
          className="rounded-full bg-ember px-6 py-3 text-sm font-medium text-ink disabled:opacity-60"
        >
          {saving ? "Saving..." : "Publish listing"}
        </button>
      </form>
    </div>
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
