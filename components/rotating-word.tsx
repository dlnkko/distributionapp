"use client";

import { useEffect, useState } from "react";

const WORDS = ["software", "service", "product", "freelancer", "business"];

export function RotatingWord() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => {
      setIndex((current) => (current + 1) % WORDS.length);
    }, 2200);
    return () => window.clearInterval(id);
  }, []);

  return (
    <span className="relative inline-block min-w-[9.5ch] text-ember italic">
      <span key={WORDS[index]} className="word-in inline-block">
        {WORDS[index]}
      </span>
    </span>
  );
}
