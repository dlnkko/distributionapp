"use client";

import { useEffect, useRef, useState } from "react";
import { currenciesByRegion, currencyByCode } from "@/lib/cta";

type Props = {
  value: string;
  onChange: (code: string) => void;
};

export function CurrencySelect({ value, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const selected = currencyByCode(value);

  useEffect(() => {
    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  return (
    <div ref={rootRef} className="relative">
      <span className="mb-2 block text-xs uppercase tracking-[0.18em] text-paper-dim">
        Currency
      </span>
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        className="flex w-full items-center justify-between gap-3 border-b border-paper/25 bg-transparent py-3 text-left outline-none"
      >
        <span className="min-w-0">
          <span className="block truncate text-paper">
            {selected.symbol} {selected.code}
          </span>
          <span className="block truncate text-xs text-paper-dim">{selected.name}</span>
        </span>
        <span className="text-xs text-paper-dim">{open ? "▴" : "▾"}</span>
      </button>
      {open ? (
        <div
          role="listbox"
          className="currency-list absolute right-0 z-30 mt-3 w-[min(22rem,calc(100vw-2.5rem))] overflow-y-auto rounded-2xl border border-line bg-ink py-3 shadow-[0_18px_50px_rgba(0,0,0,0.45)]"
        >
          {currenciesByRegion().map((group) => (
            <div key={group.label} className="px-2">
              <p className="px-3 pb-1 pt-3 text-[10px] uppercase tracking-[0.2em] text-paper-dim first:pt-0">
                {group.label}
              </p>
              {group.currencies.map((currency) => {
                const active = currency.code === selected.code;
                return (
                  <button
                    key={currency.code}
                    type="button"
                    role="option"
                    aria-selected={active}
                    onClick={() => {
                      onChange(currency.code);
                      setOpen(false);
                    }}
                    className={`grid w-full grid-cols-[2.5rem_3.25rem_1fr] items-center rounded-xl px-3 py-2 text-left ${
                      active ? "bg-ink-soft" : "hover:bg-ink-soft/70"
                    }`}
                  >
                    <span className="text-sm text-paper-dim">{currency.symbol}</span>
                    <span className={`text-sm ${active ? "text-ember" : "text-paper"}`}>
                      {currency.code}
                    </span>
                    <span className="text-sm text-paper-dim">{currency.name}</span>
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
