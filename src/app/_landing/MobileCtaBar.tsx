"use client";

import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { useEffect, useState } from "react";

/**
 * Phones only: a bar pinned to the bottom with the trial button and WhatsApp, shown once the
 * hero buttons have scrolled away and hidden again when the closing call to action is on screen
 * (so the same buttons are never shown twice).
 */
export function MobileCtaBar({ start, whatsappLabel, whatsappHref }: { start: string; whatsappLabel: string; whatsappHref: string }) {
  const [heroGone, setHeroGone] = useState(false);
  const [ctaShown, setCtaShown] = useState(false);

  useEffect(() => {
    const hero = document.getElementById("hero-actions");
    const closing = document.getElementById("contact");
    if (!hero || !closing || !("IntersectionObserver" in window)) return;
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        // Past the hero buttons means they left the screen at the top, not that they are still below
        if (entry.target === hero) setHeroGone(!entry.isIntersecting && entry.boundingClientRect.top < 0);
        else setCtaShown(entry.isIntersecting);
      }
    });
    observer.observe(hero);
    observer.observe(closing);
    return () => observer.disconnect();
  }, []);

  const visible = heroGone && !ctaShown;

  return (
    <div
      className={`fixed inset-x-0 bottom-0 z-40 border-t border-ui-line bg-ui-surface/95 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 shadow-[0_-12px_32px_-20px_rgba(23,21,46,0.45)] backdrop-blur transition-transform duration-300 sm:hidden ${
        visible ? "translate-y-0" : "pointer-events-none translate-y-full"
      }`}
      aria-hidden={!visible}
      inert={!visible}
    >
      <div className="flex gap-3">
        <Link
          href="/signup/"
          className="inline-flex min-h-12 flex-1 items-center justify-center rounded-control bg-ui-primary px-4 font-semibold text-ui-primary-fg transition-colors hover:bg-ui-primary-hover"
        >
          {start}
        </Link>
        <a
          href={whatsappHref}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={whatsappLabel}
          className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-control border border-ui-input bg-ui-surface text-ui-ink transition-colors hover:bg-ui-subtle"
        >
          <MessageCircle className="h-5 w-5" aria-hidden />
        </a>
      </div>
    </div>
  );
}
