"use client";

import { useCopy } from "../../_lib/i18n";
import { PAYMENT_METHODS, type PaymentConfig, type PaymentMethod } from "@/lib/orders/payment";

const en = {
  title: "Payment",
  body: "How customers can pay you. Coredex never takes the money: customers pay you directly, and you mark orders as paid on the Orders page.",
  methods: {
    cash: { label: "Cash", hint: "On delivery or at pickup" },
    card: { label: "Card", hint: "With your card machine, on delivery or at pickup" },
    whish: { label: "Whish", hint: "Customers send the total to your Whish number" },
    omt: { label: "OMT", hint: "Customers send the total to you by OMT" },
  } as Record<PaymentMethod, { label: string; hint: string }>,
  whishPhone: "Your Whish number",
  omtName: "Name to send to",
  omtPhone: "Phone number for OMT",
  needsNumber: "Add the number to offer this to customers.",
  atLeastOne: "Cash stays on when nothing else is chosen.",
};
const ar: typeof en = {
  title: "الدفع",
  body: "كيف يمكن للزبائن الدفع لك. لا يستلم Coredex أي مبلغ: يدفع الزبائن لك مباشرة، وتُعلِّم الطلبات كمدفوعة في صفحة الطلبات.",
  methods: {
    cash: { label: "نقداً", hint: "عند التوصيل أو الاستلام" },
    card: { label: "بطاقة", hint: "بجهاز البطاقات لديك، عند التوصيل أو الاستلام" },
    whish: { label: "Whish", hint: "يحوّل الزبائن المجموع إلى رقم Whish الخاص بك" },
    omt: { label: "OMT", hint: "يحوّل الزبائن المجموع إليك عبر OMT" },
  },
  whishPhone: "رقم Whish الخاص بك",
  omtName: "الاسم الذي يُحوَّل إليه",
  omtPhone: "رقم الهاتف لـ OMT",
  needsNumber: "أضف الرقم لتعرض هذه الطريقة على الزبائن.",
  atLeastOne: "يبقى الدفع نقداً مفعّلاً إن لم تختر غيره.",
};

const input =
  "w-full min-h-11 px-4 bg-ui-bg border border-ui-input rounded-control text-ui-ink focus:outline-none focus:border-ui-primary transition-all";
const hasNumber = (value: string) => value.replace(/\D/g, "").length >= 7;

export function PaymentMethodsEditor({ value, onChange }: { value: PaymentConfig; onChange: (next: PaymentConfig) => void }) {
  const t = useCopy({ en, ar });
  const toggle = (method: PaymentMethod, on: boolean) => {
    const methods = on ? [...value.methods, method] : value.methods.filter((m) => m !== method);
    onChange({ ...value, methods: PAYMENT_METHODS.filter((m) => methods.includes(m)) });
  };

  return (
    <section className="space-y-5 border-t border-ui-line pt-8" aria-labelledby="payment-title">
      <div>
        <h4 id="payment-title" className="text-base font-bold text-ui-heading">{t.title}</h4>
        <p className="mt-1 text-sm text-ui-muted">{t.body}</p>
      </div>
      <ul className="space-y-3">
        {PAYMENT_METHODS.map((method) => {
          const on = value.methods.includes(method);
          const missing = on && ((method === "whish" && !hasNumber(value.whish_phone)) || (method === "omt" && !hasNumber(value.omt_phone)));
          return (
            <li key={method} className="rounded-panel border border-ui-line bg-ui-surface p-4">
              <label className="flex cursor-pointer items-start gap-3">
                <input type="checkbox" checked={on} onChange={(e) => toggle(method, e.target.checked)} className="mt-1 h-5 w-5 shrink-0 accent-[var(--ui-primary)]" />
                <span>
                  <span className="block font-semibold text-ui-ink">{t.methods[method].label}</span>
                  <span className="block text-sm text-ui-muted">{t.methods[method].hint}</span>
                </span>
              </label>
              {on && method === "whish" && (
                <div className="mt-3 max-w-xs space-y-1.5 ps-8">
                  <label htmlFor="pay-whish-phone" className="block text-sm font-semibold text-ui-ink">{t.whishPhone}</label>
                  <input id="pay-whish-phone" type="tel" dir="ltr" inputMode="tel" value={value.whish_phone} maxLength={20} placeholder="03 123 456" onChange={(e) => onChange({ ...value, whish_phone: e.target.value })} aria-invalid={missing} className={input} />
                </div>
              )}
              {on && method === "omt" && (
                <div className="mt-3 grid max-w-lg gap-3 ps-8 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <label htmlFor="pay-omt-name" className="block text-sm font-semibold text-ui-ink">{t.omtName}</label>
                    <input id="pay-omt-name" value={value.omt_name} maxLength={60} onChange={(e) => onChange({ ...value, omt_name: e.target.value })} className={input} />
                  </div>
                  <div className="space-y-1.5">
                    <label htmlFor="pay-omt-phone" className="block text-sm font-semibold text-ui-ink">{t.omtPhone}</label>
                    <input id="pay-omt-phone" type="tel" dir="ltr" inputMode="tel" value={value.omt_phone} maxLength={20} placeholder="71 123 456" onChange={(e) => onChange({ ...value, omt_phone: e.target.value })} aria-invalid={missing} className={input} />
                  </div>
                </div>
              )}
              {missing && <p className="mt-2 ps-8 text-sm text-ui-danger">{t.needsNumber}</p>}
            </li>
          );
        })}
      </ul>
      {value.methods.length === 0 && <p className="text-sm text-ui-muted">{t.atLeastOne}</p>}
    </section>
  );
}
