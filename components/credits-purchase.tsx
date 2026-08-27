"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import {
  MAX_CREDIT_PURCHASE_USD,
  MIN_CREDIT_PURCHASE_USD,
} from "@/lib/credits";

const PRESETS = [20, 50, 100, 250];

type Props = {
  nextPath?: string;
  listingId?: string;
};

function sanitizeAmount(value: string) {
  const digits = value.replace(/\D/g, "").replace(/^0+(?=\d)/, "");
  if (digits === "") return "";
  const next = Number(digits);
  if (!Number.isFinite(next)) return "";
  if (next > MAX_CREDIT_PURCHASE_USD) return String(MAX_CREDIT_PURCHASE_USD);
  return digits;
}

export function CreditsPurchase({
  nextPath = "/business/dashboard",
  listingId,
}: Props) {
  const router = useRouter();
  const [raw, setRaw] = useState(String(MIN_CREDIT_PURCHASE_USD));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const amount = raw === "" ? NaN : Number(raw);
  const valid =
    Number.isFinite(amount) &&
    amount >= MIN_CREDIT_PURCHASE_USD &&
    amount <= MAX_CREDIT_PURCHASE_USD;

  async function buy(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!valid) {
      setError(`Credits start at $${MIN_CREDIT_PURCHASE_USD}.`);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/business/credits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount, listingId: listingId || undefined }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Could not add credits.");
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl as string;
        return;
      }
      router.push(nextPath);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not add credits.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={buy} className="space-y-6">
      <div className="flex flex-wrap gap-2">
        {PRESETS.map((preset) => (
          <button
            key={preset}
            type="button"
            onClick={() => {
              setRaw(String(preset));
              setError("");
            }}
            className={`rounded-full px-4 py-2 text-sm transition-[transform,background-color,border-color] duration-200 ease-out hover:scale-[1.05] active:scale-[0.96] ${
              amount === preset
                ? "bg-ember text-ink"
                : "border border-line text-paper hover:border-paper/40"
            }`}
          >
            ${preset}
          </button>
        ))}
      </div>
      <label className="block">
        <span className="mb-2 block text-xs uppercase tracking-[0.18em] text-paper-dim">
          Amount in USD
        </span>
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          autoComplete="off"
          value={raw}
          onChange={(event) => {
            setRaw(sanitizeAmount(event.target.value));
            setError("");
          }}
          className="w-full border-b border-paper/25 bg-transparent py-3 text-2xl outline-none"
        />
      </label>
      {error ? <p className="text-sm text-ember">{error}</p> : null}
      <button
        type="submit"
        disabled={loading || !valid}
        className="btn btn-ember px-8 py-3 text-sm"
      >
        {loading
          ? "Adding..."
          : listingId
            ? `Add $${valid ? amount : MIN_CREDIT_PURCHASE_USD} to this listing`
            : `Pay $${valid ? amount : MIN_CREDIT_PURCHASE_USD} for this listing`}
      </button>
    </form>
  );
}
