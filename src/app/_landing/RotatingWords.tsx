"use client";

import { useEffect, useState } from "react";

/** Cycles through a few words in place. Screen readers get the full sentence elsewhere. */
export function RotatingWords({ words, className }: { words: string[]; className?: string }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = window.setInterval(() => setIndex((i) => (i + 1) % words.length), 2400);
    return () => window.clearInterval(timer);
  }, [words.length]);

  const word = words[index];
  return (
    <span aria-hidden className={className}>
      <span key={word} className="site-word inline-block">
        {word}
      </span>
    </span>
  );
}
