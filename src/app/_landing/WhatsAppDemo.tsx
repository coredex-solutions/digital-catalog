"use client";

import { Fragment, useEffect, useRef, useState } from "react";
import { CheckCheck, Store } from "lucide-react";
import { buildOrderMessage } from "../c/[slug]/_lib/whatsapp";
import type { SiteCopy, SiteLang } from "./copy";

const SAMPLE_LINES = [
  { name_en: "Hummus", name_ar: "حمص", price: 4, currency: "USD", quantity: 2 },
  { name_en: "Fattoush", name_ar: "فتوش", price: 5, currency: "USD", quantity: 1, note: "" },
  { name_en: "Mixed grill", name_ar: "مشاوي مشكّلة", price: 14, currency: "USD", quantity: 1 },
];

/** WhatsApp's *bold* markup, rendered as it appears in the chat */
export function Formatted({ text }: { text: string }) {
  return (
    <>
      {text.split("\n").map((line, i) => (
        <Fragment key={i}>
          {i > 0 && <br />}
          {line.split(/(\*[^*]+\*)/g).map((part, j) =>
            part.startsWith("*") && part.endsWith("*") ? <strong key={j}>{part.slice(1, -1)}</strong> : <Fragment key={j}>{part}</Fragment>
          )}
        </Fragment>
      ))}
    </>
  );
}

/**
 * A chat mock-up showing the order message exactly as the real menu builds it
 * (same buildOrderMessage, sample dishes, $1 = 89,500 L.L.). Types, then "arrives".
 */
export function WhatsAppDemo({ t, lang }: { t: SiteCopy["whatsappDemo"]; lang: SiteLang }) {
  const ref = useRef<HTMLDivElement>(null);
  const [stage, setStage] = useState<"idle" | "typing" | "sent">("idle");

  const message = buildOrderMessage(
    SAMPLE_LINES,
    { restaurantName: t.restaurant, orderType: "dine_in", table: "7", name: t.sampleName, phone: t.samplePhone },
    { primary: "USD", lbpRate: 89500, rateUpdatedAt: null, showDual: true },
    lang
  );

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window)) {
      setStage("sent");
      return;
    }
    let timer = 0;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        observer.disconnect();
        setStage("typing");
        timer = window.setTimeout(() => setStage("sent"), 1400);
      },
      { rootMargin: "0px 0px -20% 0px" }
    );
    observer.observe(el);
    return () => {
      observer.disconnect();
      window.clearTimeout(timer);
    };
  }, []);

  return (
    <div ref={ref} className="overflow-hidden rounded-panel border border-ui-line bg-ui-surface shadow-[0_24px_48px_-32px_rgba(23,43,38,0.4)]">
      {/* Chat header */}
      <div className="flex items-center gap-3 bg-ui-primary px-4 py-3 text-ui-primary-fg">
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15" aria-hidden>
          <Store className="h-5 w-5" />
        </span>
        <span className="font-semibold">{t.chatName}</span>
      </div>

      {/* Conversation */}
      <div className="min-h-[300px] bg-[#EFEAE2] sm:min-h-[420px] p-4" aria-live="polite">
        {stage === "typing" && (
          <div className="site-pop ms-auto flex w-16 items-center justify-center gap-1 rounded-panel bg-[#D9FDD3] px-3 py-3" aria-hidden>
            {[0, 1, 2].map((i) => (
              <span key={i} className="site-dot h-1.5 w-1.5 rounded-full bg-[#3b4a54]" style={{ animationDelay: `${i * 150}ms` }} />
            ))}
          </div>
        )}
        {stage === "sent" && (
          <div className="site-pop ms-auto max-w-[92%] rounded-panel rounded-se-[4px] bg-[#D9FDD3] px-3.5 py-2.5 text-[0.9375rem] leading-relaxed text-[#111B21] shadow-sm" dir={lang === "ar" ? "rtl" : "ltr"}>
            <Formatted text={message} />
            <span className="mt-1 flex items-center justify-end gap-1 text-xs text-[#54656F]">
              <bdi>12:41</bdi>
              <CheckCheck className="h-4 w-4 text-[#53BDEB]" aria-hidden />
            </span>
          </div>
        )}
      </div>
      <p className="border-t border-ui-line px-4 py-3 text-sm text-ui-muted">{t.note}</p>
    </div>
  );
}
