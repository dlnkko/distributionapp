"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export function PainSearch() {
  const router = useRouter();
  const [value, setValue] = useState("");

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const pain = value.trim();
    if (pain.length < 8) return;
    router.push(`/find?q=${encodeURIComponent(pain)}`);
  }

  return (
    <form onSubmit={onSubmit} className="w-full">
      <label className="sr-only" htmlFor="pain">
        Your pain point
      </label>
      <div className="flex flex-col gap-4 border-b border-paper/25 pb-3 sm:flex-row sm:items-end">
        <input
          id="pain"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder="I need an app to track my calories"
          className="w-full bg-transparent text-xl text-paper outline-none placeholder:text-paper/30 sm:text-2xl"
        />
        <button
          type="submit"
          className="shrink-0 rounded-full bg-ember px-5 py-2 text-sm font-medium text-ink transition-colors hover:bg-ember-soft"
        >
          Find it
        </button>
      </div>
      <p className="mt-3 text-sm text-paper-dim">
        Try “I want to create AI videos” or “I need more ecom leads for my business”.
      </p>
    </form>
  );
}
