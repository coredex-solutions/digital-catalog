"use client";

import { Plus, Trash2 } from "lucide-react";
import { useCopy } from "../../_lib/i18n";
import { MAX_ZONES } from "@/lib/orders/delivery";

/** As edited: amounts stay text while typing; the server cleans them (lib/orders/delivery.ts) */
export interface DeliveryAreasDraft {
  currency: "USD" | "LBP";
  free_over: number | string | null;
  zones: {
    id?: string;
    name_en: string;
    name_ar: string;
    fee: number | string;
    min_order: number | string | null;
    eta_minutes: number | string | null;
  }[];
}

const en = {
  title: "Delivery areas",
  body: "Add the areas you deliver to, each with its fee. Customers pick their area and the fee is added to their total. With no areas, customers type their area and no fee is added.",
  currency: "Fees in",
  usd: "US dollars ($)",
  lbp: "Lebanese pounds (L.L.)",
  area: (n: number) => `Area ${n}`,
  nameEn: "Name in English",
  nameAr: "Name in Arabic",
  fee: "Delivery fee",
  feeHint: "0 for free",
  minOrder: "Minimum order",
  eta: "Time (minutes)",
  optional: "Optional",
  remove: (name: string) => `Remove ${name}`,
  removeShort: "Remove",
  add: "Add an area",
  max: (n: number) => `Up to ${n} areas.`,
  freeOver: "Free delivery from",
  freeOverHint: "Orders of this amount or more get free delivery. Leave empty to always charge the fee.",
};
const ar: typeof en = {
  title: "مناطق التوصيل",
  body: "أضف المناطق التي توصل إليها، ولكل منطقة رسم توصيل. يختار الزبون منطقته ويُضاف الرسم إلى المجموع. من دون مناطق، يكتب الزبون منطقته ولا يُضاف أي رسم.",
  currency: "الرسوم بـ",
  usd: "الدولار ($)",
  lbp: "الليرة اللبنانية (ل.ل.)",
  area: (n) => `المنطقة ${n}`,
  nameEn: "الاسم بالإنجليزية",
  nameAr: "الاسم بالعربية",
  fee: "رسم التوصيل",
  feeHint: "0 للتوصيل المجاني",
  minOrder: "الحد الأدنى للطلب",
  eta: "المدة (بالدقائق)",
  optional: "اختياري",
  remove: (name) => `إزالة ${name}`,
  removeShort: "إزالة",
  add: "إضافة منطقة",
  max: (n) => `${n} منطقة كحدّ أقصى.`,
  freeOver: "توصيل مجاني ابتداءً من",
  freeOverHint: "الطلبات بهذا المبلغ أو أكثر توصيلها مجاني. اتركه فارغاً لاحتساب الرسم دائماً.",
};

const input =
  "w-full min-h-11 px-4 bg-ui-bg border border-ui-input rounded-control text-ui-ink focus:outline-none focus:border-ui-primary transition-all";

export function DeliveryAreasEditor({ value, onChange }: { value: DeliveryAreasDraft; onChange: (next: DeliveryAreasDraft) => void }) {
  const t = useCopy({ en, ar });
  const symbol = value.currency === "LBP" ? "L.L." : "$";
  const setZone = (index: number, field: keyof DeliveryAreasDraft["zones"][number], fieldValue: string) =>
    onChange({ ...value, zones: value.zones.map((zone, i) => (i === index ? { ...zone, [field]: fieldValue } : zone)) });

  return (
    <section className="space-y-5 border-t border-ui-line pt-8" aria-labelledby="delivery-areas-title">
      <div>
        <h4 id="delivery-areas-title" className="text-base font-bold text-ui-heading">{t.title}</h4>
        <p className="mt-1 text-sm text-ui-muted">{t.body}</p>
      </div>

      <div className="max-w-xs space-y-2">
        <label htmlFor="delivery-currency" className="block text-sm font-semibold text-ui-ink">{t.currency}</label>
        <select
          id="delivery-currency"
          value={value.currency}
          onChange={(e) => onChange({ ...value, currency: e.target.value === "LBP" ? "LBP" : "USD" })}
          className={input}
        >
          <option value="USD">{t.usd}</option>
          <option value="LBP">{t.lbp}</option>
        </select>
      </div>

      <ol className="space-y-3">
        {value.zones.map((zone, index) => {
          const label = zone.name_en || zone.name_ar || t.area(index + 1);
          const id = (field: string) => `zone-${index}-${field}`;
          return (
            <li key={zone.id || `new-${index}`} className="rounded-panel border border-ui-line bg-ui-surface p-4" aria-label={label}>
              <div className="mb-3 flex items-center justify-between gap-3">
                <p className="min-w-0 truncate text-sm font-semibold text-ui-heading">{label}</p>
                <button
                  type="button"
                  onClick={() => onChange({ ...value, zones: value.zones.filter((_, i) => i !== index) })}
                  aria-label={t.remove(label)}
                  className="inline-flex min-h-9 shrink-0 items-center gap-1.5 rounded-control px-2 text-sm font-semibold text-ui-danger hover:bg-ui-subtle"
                >
                  <Trash2 className="h-4 w-4" aria-hidden />
                  {t.removeShort}
                </button>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label htmlFor={id("en")} className="block text-sm font-semibold text-ui-ink">{t.nameEn}</label>
                  <input id={id("en")} dir="ltr" lang="en" value={zone.name_en} maxLength={60} placeholder="Hamra" onChange={(e) => setZone(index, "name_en", e.target.value)} className={input} />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor={id("ar")} className="block text-sm font-semibold text-ui-ink">{t.nameAr}</label>
                  <input id={id("ar")} dir="rtl" lang="ar" value={zone.name_ar} maxLength={60} placeholder="الحمرا" onChange={(e) => setZone(index, "name_ar", e.target.value)} className={input} />
                </div>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:items-end">
                <div className="space-y-1.5">
                  <label htmlFor={id("fee")} className="block text-sm font-semibold text-ui-ink">
                    {t.fee} <span className="font-normal text-ui-muted">({symbol})</span>
                  </label>
                  <input id={id("fee")} type="number" inputMode="decimal" dir="ltr" min={0} step="any" value={zone.fee ?? ""} placeholder={t.feeHint} onChange={(e) => setZone(index, "fee", e.target.value)} className={input} />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor={id("min")} className="block text-sm font-semibold text-ui-ink">
                    {t.minOrder} <span className="font-normal text-ui-muted">({symbol})</span>
                  </label>
                  <input id={id("min")} type="number" inputMode="decimal" dir="ltr" min={0} step="any" value={zone.min_order ?? ""} placeholder={t.optional} onChange={(e) => setZone(index, "min_order", e.target.value)} className={input} />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor={id("eta")} className="block text-sm font-semibold text-ui-ink">{t.eta}</label>
                  <input id={id("eta")} type="number" inputMode="numeric" dir="ltr" min={1} max={1440} step={5} value={zone.eta_minutes ?? ""} placeholder={t.optional} onChange={(e) => setZone(index, "eta_minutes", e.target.value)} className={input} />
                </div>
              </div>
            </li>
          );
        })}
      </ol>

      {value.zones.length < MAX_ZONES ? (
        <button
          type="button"
          onClick={() => onChange({ ...value, zones: [...value.zones, { name_en: "", name_ar: "", fee: "", min_order: null, eta_minutes: null }] })}
          className="inline-flex min-h-11 items-center gap-2 rounded-control border border-dashed border-ui-input px-4 text-sm font-semibold text-ui-heading hover:bg-ui-subtle"
        >
          <Plus className="h-4 w-4" aria-hidden />
          {t.add}
        </button>
      ) : (
        <p className="text-sm text-ui-muted">{t.max(MAX_ZONES)}</p>
      )}

      {value.zones.length > 0 && (
        <div className="max-w-xs space-y-2">
          <label htmlFor="delivery-free-over" className="block text-sm font-semibold text-ui-ink">
            {t.freeOver} <span className="font-normal text-ui-muted">({symbol})</span>
          </label>
          <input
            id="delivery-free-over"
            type="number"
            inputMode="decimal"
            dir="ltr"
            min={0}
            step="any"
            value={value.free_over ?? ""}
            placeholder={t.optional}
            onChange={(e) => onChange({ ...value, free_over: e.target.value })}
            aria-describedby="delivery-free-over-hint"
            className={input}
          />
          <p id="delivery-free-over-hint" className="text-xs text-ui-muted">{t.freeOverHint}</p>
        </div>
      )}
    </section>
  );
}
