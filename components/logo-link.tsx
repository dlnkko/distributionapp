"use client";

import Link from "next/link";
import { PENDING_PAIN_KEY } from "@/lib/auth";

export function LogoLink() {
  return (
    <Link
      href="/"
      onClick={() => {
        sessionStorage.removeItem(PENDING_PAIN_KEY);
      }}
      className="font-display text-xl tracking-tight text-paper transition-colors hover:text-ember"
    >
      distribute
      <span className="text-ember">.</span>
      to
    </Link>
  );
}
