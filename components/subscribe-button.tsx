"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function SubscribeButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function subscribe() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/business/subscribe", { method: "POST" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Could not subscribe.");
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl as string;
        return;
      }
      router.push("/business/onboard");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not subscribe.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => void subscribe()}
        disabled={loading}
        className="rounded-full bg-ember px-8 py-3 text-sm font-medium text-ink disabled:opacity-60"
      >
        {loading ? "Opening..." : "Subscribe — $49 / month"}
      </button>
      {error ? <p className="mt-3 text-sm text-ember">{error}</p> : null}
    </div>
  );
}
