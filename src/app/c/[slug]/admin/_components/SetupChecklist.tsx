"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2, ChevronRight, Circle } from "lucide-react";
import { useCatalogAdmin } from "./CatalogAdminShell";

interface Step {
  key: string;
  title: string;
  hint: string;
  done: boolean;
  href: string;
}

/** Set by the QR print page: printing can't be detected on the server */
export const qrPrintedKey = (slug: string) => `qr_print_opened_${slug}`;

/**
 * "Get your menu ready" on the dashboard. Progress comes from the menu's own data, so it is
 * saved automatically; the card disappears once every step is done.
 */
export function SetupChecklist() {
  const { slug, fetchWithAuth } = useCatalogAdmin();
  const [steps, setSteps] = useState<Step[] | null>(null);

  useEffect(() => {
    let printed = false;
    try {
      printed = localStorage.getItem(qrPrintedKey(slug)) === "1";
    } catch {
      // Storage unavailable: the QR step just stays open
    }
    fetchWithAuth(`/api/c/${slug}/admin/setup`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!data?.steps) return;
        setSteps((data.steps as Step[]).map((s) => (s.key === "qr" ? { ...s, done: printed } : s)));
      })
      .catch(() => {});
  }, [slug, fetchWithAuth]);

  if (!steps) return null;
  const done = steps.filter((s) => s.done).length;
  if (done === steps.length) return null;
  const next = steps.find((s) => !s.done);

  return (
    <section aria-labelledby="setup-title" className="mb-6 rounded-panel border border-ui-line bg-ui-surface p-5 sm:p-6">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 id="setup-title" className="text-lg font-semibold">Get your menu ready</h2>
          <p className="text-sm text-ui-muted">
            {done} of {steps.length} done{next ? ` · Next: ${next.title.toLowerCase()}` : ""}
          </p>
        </div>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-ui-subtle" role="progressbar" aria-valuemin={0} aria-valuemax={steps.length} aria-valuenow={done} aria-label="Setup progress">
        <div className="h-full rounded-full bg-ui-primary transition-[width]" style={{ width: `${(done / steps.length) * 100}%` }} />
      </div>
      <ol className="mt-4 divide-y divide-[var(--ui-line)]">
        {steps.map((step) => (
          <li key={step.key}>
            <Link href={step.href} className="flex min-h-14 items-center gap-3 py-2.5 hover:text-ui-primary">
              {step.done ? (
                <CheckCircle2 className="h-5 w-5 shrink-0 text-ui-success" aria-hidden />
              ) : (
                <Circle className="h-5 w-5 shrink-0 text-ui-muted" aria-hidden />
              )}
              <span className="min-w-0 flex-1">
                <span className={`block font-semibold ${step.done ? "text-ui-muted line-through decoration-1" : ""}`}>
                  {step.title}
                  <span className="sr-only">{step.done ? " (done)" : " (to do)"}</span>
                </span>
                <span className="block text-sm text-ui-muted">{step.hint}</span>
              </span>
              <ChevronRight className="h-4 w-4 shrink-0 text-ui-muted rtl:-scale-x-100" aria-hidden />
            </Link>
          </li>
        ))}
      </ol>
    </section>
  );
}
