"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2, ChevronRight, Circle } from "lucide-react";
import { useCatalogAdmin } from "./CatalogAdminShell";
import { useAdminLang, useCopy, useFormat, plural, formatNumber, type AdminLang } from "../_lib/i18n";

interface Step {
  key: string;
  title: string;
  hint: string;
  done: boolean;
  href: string;
  /** dishes / arabic / publish: the number the hint is about */
  count?: number;
  /** currency: "rate" when the owner needs to set an exchange rate */
  variant?: string;
}

/** Set by the QR print page: printing can't be detected on the server */
export const qrPrintedKey = (slug: string) => `qr_print_opened_${slug}`;

// The setup API sends each step's English title and hint, plus its key, count and variant. The
// text is rebuilt here from those, so it can be shown in the dashboard language.
type StepCopy = (step: Step, n: number, lang: AdminLang) => { title: string; hint: string };

const en = {
  title: "Get your menu ready",
  progress: (done: string, total: string) => `${done} of ${total} done`,
  next: (title: string) => ` · Next: ${title.charAt(0).toLowerCase()}${title.slice(1)}`,
  progressLabel: "Setup progress",
  done: " (done)",
  todo: " (to do)",
  steps: {
    details: () => ({ title: "Add your logo and cover photo", hint: "Guests recognise your menu from them." }),
    whatsapp: () => ({ title: "Add your WhatsApp number", hint: "Orders and table bookings are sent to it." }),
    currency: (step) =>
      step.variant === "rate"
        ? { title: "Set your exchange rate", hint: "Pound prices are worked out from the rate you enter." }
        : { title: "Choose how prices are shown", hint: "Dollars, pounds, or both." },
    dishes: (_step, n, lang) => ({
      title: "Add your dishes",
      hint: n > 0 ? `${formatNumber(n, lang)} so far.` : "Start with a few; you can add more any time.",
    }),
    arabic: (_step, n, lang) => ({
      title: "Check the Arabic names",
      hint: n > 0 ? plural(lang, n, { one: "# dish has no Arabic name yet.", other: "# dishes have no Arabic name yet." }) : "Every dish has an Arabic name.",
    }),
    hours: () => ({ title: "Set your opening hours", hint: "So guests see whether you're open now." }),
    publish: (_step, n, lang) => ({
      title: "Preview and publish",
      hint: n > 0 ? plural(lang, n, { one: "# unpublished change.", other: "# unpublished changes." }) : "Guests only see what you publish.",
    }),
    qr: () => ({ title: "Print your QR codes", hint: "Table cards with a short web address under the code." }),
  } as Record<string, StepCopy>,
};
const ar: typeof en = {
  title: "جهّز قائمتك",
  progress: (done, total) => `أنجزت ${done} من ${total}`,
  next: (title) => ` · التالي: ${title}`,
  progressLabel: "تقدّم تجهيز القائمة",
  done: " (تم)",
  todo: " (لم يتم بعد)",
  steps: {
    details: () => ({ title: "أضف شعارك وصورة الغلاف", hint: "يتعرّف الزبائن على قائمتك من خلالهما." }),
    whatsapp: () => ({ title: "أضف رقم واتساب", hint: "تصلك عليه الطلبات وحجوزات الطاولات." }),
    currency: (step) =>
      step.variant === "rate"
        ? { title: "حدّد سعر الصرف", hint: "تُحسب الأسعار بالليرة اللبنانية من سعر الصرف الذي تدخله." }
        : { title: "اختر طريقة عرض الأسعار", hint: "بالدولار أو بالليرة أو بالاثنين معاً." },
    dishes: (_step, n, lang) => ({
      title: "أضف أطباقك",
      hint:
        n > 0
          ? plural(lang, n, {
              one: "أضفت طبقاً واحداً حتى الآن.",
              two: "أضفت طبقين حتى الآن.",
              few: "أضفت # أطباق حتى الآن.",
              many: "أضفت # طبقاً حتى الآن.",
              other: "أضفت # طبق حتى الآن.",
            })
          : "ابدأ ببضعة أطباق، ويمكنك إضافة المزيد في أي وقت.",
    }),
    arabic: (_step, n, lang) => ({
      title: "راجع الأسماء بالعربية",
      hint:
        n > 0
          ? plural(lang, n, {
              one: "طبق واحد بلا اسم بالعربية بعد.",
              two: "طبقان بلا اسم بالعربية بعد.",
              few: "# أطباق بلا اسم بالعربية بعد.",
              many: "# طبقاً بلا اسم بالعربية بعد.",
              other: "# طبق بلا اسم بالعربية بعد.",
            })
          : "لكل طبق اسم بالعربية.",
    }),
    hours: () => ({ title: "حدّد ساعات العمل", hint: "ليعرف الزبائن إن كنت مفتوحاً الآن." }),
    publish: (_step, n, lang) => ({
      title: "عاين قائمتك وانشرها",
      hint:
        n > 0
          ? plural(lang, n, {
              one: "تعديل واحد غير منشور.",
              two: "تعديلان غير منشورين.",
              few: "# تعديلات غير منشورة.",
              many: "# تعديلاً غير منشور.",
              other: "# تعديل غير منشور.",
            })
          : "لا يرى الزبائن إلا ما تنشره.",
    }),
    qr: () => ({ title: "اطبع رموز QR", hint: "بطاقات للطاولات مع رابط قصير تحت الرمز." }),
  },
};

/**
 * "Get your menu ready" on the dashboard. Progress comes from the menu's own data, so it is
 * saved automatically; the card disappears once every step is done.
 */
export function SetupChecklist() {
  const { slug, fetchWithAuth } = useCatalogAdmin();
  const lang = useAdminLang();
  const t = useCopy({ en, ar });
  const f = useFormat();
  const [steps, setSteps] = useState<Step[] | null>(null);

  useEffect(() => {
    let printed = false;
    try {
      printed = localStorage.getItem(qrPrintedKey(slug)) === "1";
    } catch {
      // Storage unavailable: the QR step just stays open
    }
    fetchWithAuth(`/api/c/${slug}/admin/setup/`)
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

  // Unknown step keys keep the API's text
  const shown = steps.map((step) => ({ ...step, ...(t.steps[step.key]?.(step, step.count ?? 0, lang) ?? {}) }));
  const next = shown.find((s) => !s.done);

  return (
    <section aria-labelledby="setup-title" className="mb-6 rounded-panel border border-ui-line bg-ui-surface p-5 sm:p-6">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 id="setup-title" className="text-lg font-semibold">{t.title}</h2>
          <p className="text-sm text-ui-muted">
            {t.progress(f.number(done), f.number(steps.length))}
            {next ? t.next(next.title) : ""}
          </p>
        </div>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-ui-subtle" role="progressbar" aria-valuemin={0} aria-valuemax={steps.length} aria-valuenow={done} aria-label={t.progressLabel}>
        <div className="h-full rounded-full bg-ui-primary transition-[width]" style={{ width: `${(done / steps.length) * 100}%` }} />
      </div>
      <ol className="mt-4 divide-y divide-[var(--ui-line)]">
        {shown.map((step) => (
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
                  <span className="sr-only">{step.done ? t.done : t.todo}</span>
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
