"use client";

import { useCallback, useEffect, useState } from "react";
import { clsx } from "clsx";
import { Loader2, Pencil, Plus, Save, TicketPercent, Trash2 } from "lucide-react";
import { CatalogAdminShell, useCatalogAdmin } from "../_components/CatalogAdminShell";
import { CatalogAdminContent, CatalogAdminHeader } from "../_components/CatalogAdminSidebar";
import { adminNavLabels } from "../_components/adminNav";
import { useAdminLang, useCopy, useFormat, type AdminLang } from "../_lib/i18n";
import { useModule } from "../_lib/module";
import { translateApiMessage } from "../_lib/api-errors";
import { formatMoney } from "@/lib/catalog/price";
import type { Coupon } from "@/lib/orders/coupons";
import type { LoyaltyConfig } from "@/lib/orders/loyalty";

const en = {
  couponsTitle: "Discount codes",
  couponsBody: "Codes customers type at checkout, for example for Instagram followers or a holiday. The discount comes off the items, not the delivery fee.",
  add: "Add a code",
  empty: "No codes yet.",
  code: "Code",
  codeHint: "Letters and numbers, e.g. RAMADAN10",
  kind: "Discount",
  percent: "Percent off",
  amount: "Amount off",
  value: "Value",
  currency: "Currency",
  minOrder: "Minimum order",
  startsOn: "From",
  endsOn: "Until",
  maxUses: "Number of uses",
  optional: "Optional",
  active: "On",
  inactive: "Off",
  save: "Save code",
  cancel: "Cancel",
  edit: (code: string) => `Edit ${code}`,
  remove: (code: string) => `Delete ${code}`,
  removeAsk: (code: string) => `Delete ${code}? Orders that used it keep their discount.`,
  yes: "Delete",
  off: (text: string) => `${text} off`,
  min: (amount: string) => `orders from ${amount}`,
  used: (n: number, max: number | null) => (max === null ? `Used ${n} times` : `${n} of ${max} used`),
  dates: (from: string | null, to: string | null, f: (d: string) => string) =>
    from && to ? `${f(from)} – ${f(to)}` : from ? `From ${f(from)}` : to ? `Until ${f(to)}` : "",
  saved: "Saved.",
  failed: "Couldn't save. Please try again.",
  loading: "Loading…",
  loyaltyTitle: "Loyalty card",
  loyaltyBody: "Every finished order is a stamp for the customer's phone number. On the order that earns the reward, the Orders page shows “Loyalty reward due”, and customers see their stamps on their order page. No app or sign-up.",
  loyaltyOn: "Turn on the loyalty card",
  every: "Reward on every",
  everyOption: (n: number) => `${n}${n % 100 >= 11 && n % 100 <= 13 ? "th" : ({ 1: "st", 2: "nd", 3: "rd" } as Record<number, string>)[n % 10] ?? "th"} order`,
  rewardEn: "Reward in English",
  rewardAr: "Reward in Arabic",
  rewardPlaceholderEn: "e.g. A free coffee",
  rewardPlaceholderAr: "مثلاً: قهوة مجانية",
  saveLoyalty: "Save loyalty card",
  readOnly: "You can view offers. Ask the owner or an editor to change them.",
};
const ar: typeof en = {
  couponsTitle: "رموز الخصم",
  couponsBody: "رموز يكتبها الزبائن عند الطلب، مثلاً لمتابعي إنستغرام أو في مناسبة. يُخصم المبلغ من الأصناف وليس من رسم التوصيل.",
  add: "إضافة رمز",
  empty: "لا رموز بعد.",
  code: "الرمز",
  codeHint: "أحرف وأرقام، مثلاً RAMADAN10",
  kind: "الخصم",
  percent: "نسبة مئوية",
  amount: "مبلغ ثابت",
  value: "القيمة",
  currency: "العملة",
  minOrder: "الحد الأدنى للطلب",
  startsOn: "من",
  endsOn: "حتى",
  maxUses: "عدد الاستخدامات",
  optional: "اختياري",
  active: "مفعّل",
  inactive: "متوقف",
  save: "حفظ الرمز",
  cancel: "إلغاء",
  edit: (code) => `تعديل ${code}`,
  remove: (code) => `حذف ${code}`,
  removeAsk: (code) => `حذف ${code}؟ تحتفظ الطلبات التي استخدمته بخصمها.`,
  yes: "حذف",
  off: (text) => `خصم ${text}`,
  min: (amount) => `للطلبات من ${amount}`,
  used: (n, max) => (max === null ? `استُخدم ${n} مرة` : `استُخدم ${n} من ${max}`),
  dates: (from, to, f) => (from && to ? `${f(from)} – ${f(to)}` : from ? `من ${f(from)}` : to ? `حتى ${f(to)}` : ""),
  saved: "تم الحفظ.",
  failed: "تعذّر الحفظ. حاول مرة أخرى.",
  loading: "جارٍ التحميل…",
  loyaltyTitle: "بطاقة الولاء",
  loyaltyBody: "كل طلب منتهٍ هو ختم لرقم هاتف الزبون. على الطلب الذي يستحق المكافأة تظهر في صفحة الطلبات عبارة «مكافأة الولاء مستحقة»، ويرى الزبائن أختامهم في صفحة طلبهم. بلا تطبيق أو تسجيل.",
  loyaltyOn: "تفعيل بطاقة الولاء",
  every: "المكافأة مع كل",
  everyOption: (n) => `طلب رقم ${n}`,
  rewardEn: "المكافأة بالإنجليزية",
  rewardAr: "المكافأة بالعربية",
  rewardPlaceholderEn: "e.g. A free coffee",
  rewardPlaceholderAr: "مثلاً: قهوة مجانية",
  saveLoyalty: "حفظ بطاقة الولاء",
  readOnly: "يمكنك عرض العروض فقط. اطلب من المالك أو المحرر تعديلها.",
};

type Draft = {
  id?: string;
  code: string;
  kind: "percent" | "amount";
  value: string;
  currency: "USD" | "LBP";
  min_order: string;
  starts_on: string;
  ends_on: string;
  max_uses: string;
  is_active: boolean;
};

const EMPTY: Draft = { code: "", kind: "percent", value: "", currency: "USD", min_order: "", starts_on: "", ends_on: "", max_uses: "", is_active: true };
const input = "w-full min-h-11 px-4 bg-ui-bg border border-ui-input rounded-control text-ui-ink focus:outline-none focus:border-ui-primary";

const toDraft = (c: Coupon): Draft => ({
  id: c.id,
  code: c.code,
  kind: c.kind,
  value: String(c.value),
  currency: c.currency,
  min_order: c.min_order == null ? "" : String(c.min_order),
  starts_on: c.starts_on ?? "",
  ends_on: c.ends_on ?? "",
  max_uses: c.max_uses == null ? "" : String(c.max_uses),
  is_active: c.is_active,
});

function CouponForm({ draft, onChange, onSave, onCancel, saving, error }: { draft: Draft; onChange: (d: Draft) => void; onSave: () => void; onCancel: () => void; saving: boolean; error: string | null }) {
  const t = useCopy({ en, ar });
  const set = (key: keyof Draft, value: string | boolean) => onChange({ ...draft, [key]: value });
  const field = (id: string, label: string, el: React.ReactNode, hint?: string) => (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-semibold text-ui-ink">{label}</label>
      {el}
      {hint && <p className="text-xs text-ui-muted">{hint}</p>}
    </div>
  );
  return (
    <form
      className="space-y-4 rounded-panel border border-ui-primary bg-ui-surface p-4"
      onSubmit={(e) => {
        e.preventDefault();
        onSave();
      }}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        {field("coupon-code", t.code, <input id="coupon-code" dir="ltr" value={draft.code} maxLength={20} onChange={(e) => set("code", e.target.value.toUpperCase())} className={clsx(input, "uppercase")} />, t.codeHint)}
        {field(
          "coupon-kind",
          t.kind,
          <select id="coupon-kind" value={draft.kind} onChange={(e) => set("kind", e.target.value)} className={input}>
            <option value="percent">{t.percent}</option>
            <option value="amount">{t.amount}</option>
          </select>
        )}
        {field(
          "coupon-value",
          draft.kind === "percent" ? `${t.value} (%)` : t.value,
          <input id="coupon-value" type="number" inputMode="decimal" dir="ltr" min={0} step="any" value={draft.value} onChange={(e) => set("value", e.target.value)} className={input} />
        )}
        {field(
          "coupon-currency",
          t.currency,
          <select id="coupon-currency" value={draft.currency} onChange={(e) => set("currency", e.target.value)} className={input}>
            <option value="USD">$</option>
            <option value="LBP">L.L.</option>
          </select>
        )}
        {field("coupon-min", t.minOrder, <input id="coupon-min" type="number" inputMode="decimal" dir="ltr" min={0} step="any" value={draft.min_order} placeholder={t.optional} onChange={(e) => set("min_order", e.target.value)} className={input} />)}
        {field("coupon-uses", t.maxUses, <input id="coupon-uses" type="number" inputMode="numeric" dir="ltr" min={1} value={draft.max_uses} placeholder={t.optional} onChange={(e) => set("max_uses", e.target.value)} className={input} />)}
        {field("coupon-from", t.startsOn, <input id="coupon-from" type="date" value={draft.starts_on} onChange={(e) => set("starts_on", e.target.value)} className={input} />)}
        {field("coupon-to", t.endsOn, <input id="coupon-to" type="date" value={draft.ends_on} onChange={(e) => set("ends_on", e.target.value)} className={input} />)}
      </div>
      {error && <p className="text-sm text-ui-danger" role="alert">{error}</p>}
      <div className="flex flex-wrap gap-2">
        <button type="submit" disabled={saving} className="inline-flex min-h-11 items-center gap-2 rounded-control bg-ui-primary px-4 text-sm font-semibold text-ui-primary-fg hover:bg-ui-primary-hover disabled:opacity-60">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Save className="h-4 w-4" aria-hidden />}
          {t.save}
        </button>
        <button type="button" onClick={onCancel} className="min-h-11 rounded-control border border-ui-line px-4 text-sm font-semibold">{t.cancel}</button>
      </div>
    </form>
  );
}

function OffersView() {
  const t = useCopy({ en, ar });
  const lang = useAdminLang();
  const f = useFormat();
  const { module } = useModule();
  const { slug, fetchWithAuth, user } = useCatalogAdmin();
  const readOnly = user?.role === "viewer";
  const [coupons, setCoupons] = useState<Coupon[] | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [askDelete, setAskDelete] = useState<string | null>(null);
  const [loyalty, setLoyalty] = useState<LoyaltyConfig | null>(null);
  const [loyaltyStatus, setLoyaltyStatus] = useState<{ ok: boolean; text: string } | null>(null);

  const load = useCallback(async () => {
    const [c, l] = await Promise.all([fetchWithAuth(`/api/c/${slug}/admin/coupons/`), fetchWithAuth(`/api/c/${slug}/admin/loyalty/`)]);
    if (c.ok) setCoupons((await c.json()).coupons);
    if (l.ok) setLoyalty((await l.json()).loyalty);
  }, [fetchWithAuth, slug]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- first load of the page's data
    load().catch(() => setCoupons([]));
  }, [load]);

  const message = async (res: Response) => {
    const data = await res.json().catch(() => ({}));
    return data.error ? translateApiMessage(data.error, lang as AdminLang) : t.failed;
  };

  const saveCoupon = async () => {
    if (!draft) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetchWithAuth(draft.id ? `/api/c/${slug}/admin/coupons/${draft.id}/` : `/api/c/${slug}/admin/coupons/`, {
        method: draft.id ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft),
      });
      if (!res.ok) {
        setError(await message(res));
        return;
      }
      setDraft(null);
      await load();
    } catch {
      setError(t.failed);
    } finally {
      setSaving(false);
    }
  };

  const toggle = async (coupon: Coupon) => {
    const res = await fetchWithAuth(`/api/c/${slug}/admin/coupons/${coupon.id}/`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...toDraft(coupon), is_active: !coupon.is_active }),
    });
    if (res.ok) await load();
  };

  const remove = async (coupon: Coupon) => {
    const res = await fetchWithAuth(`/api/c/${slug}/admin/coupons/${coupon.id}/`, { method: "DELETE" });
    setAskDelete(null);
    if (res.ok) await load();
  };

  const saveLoyalty = async () => {
    if (!loyalty) return;
    setLoyaltyStatus(null);
    const res = await fetchWithAuth(`/api/c/${slug}/admin/loyalty/`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(loyalty) });
    if (res.ok) {
      setLoyalty((await res.json()).loyalty);
      setLoyaltyStatus({ ok: true, text: t.saved });
    } else setLoyaltyStatus({ ok: false, text: await message(res) });
  };

  const describe = (c: Coupon) => {
    const off = c.kind === "percent" ? `${c.value}%` : formatMoney(c.value, c.currency, lang);
    const parts = [t.off(off)];
    if (c.min_order) parts.push(t.min(formatMoney(c.min_order, c.currency, lang)));
    const dates = t.dates(c.starts_on, c.ends_on, (d) => f.date(`${d}T12:00:00Z`, { day: "numeric", month: "short", timeZone: "UTC" }));
    if (dates) parts.push(dates);
    return parts.join(" · ");
  };

  return (
    <>
      <CatalogAdminHeader title={adminNavLabels(lang, module).offers} />
      <CatalogAdminContent>
        <div className="mx-auto max-w-3xl space-y-8">
          {readOnly && <p className="rounded-panel border border-ui-line bg-ui-surface p-4 text-sm text-ui-muted">{t.readOnly}</p>}

          <section aria-labelledby="coupons-title" className="space-y-4">
            <div>
              <h2 id="coupons-title" className="text-lg font-bold text-ui-heading">{t.couponsTitle}</h2>
              <p className="mt-1 text-sm text-ui-muted">{t.couponsBody}</p>
            </div>
            {coupons === null ? (
              <p className="flex items-center gap-2 text-ui-muted" role="status">
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                {t.loading}
              </p>
            ) : (
              <>
                {coupons.length === 0 && !draft && (
                  <div className="rounded-panel border border-dashed border-ui-line bg-ui-surface p-8 text-center">
                    <TicketPercent className="mx-auto h-9 w-9 text-ui-line" aria-hidden />
                    <p className="mt-2 text-ui-muted">{t.empty}</p>
                  </div>
                )}
                <ul className="space-y-3">
                  {coupons.map((coupon) =>
                    draft?.id === coupon.id ? (
                      <li key={coupon.id}>
                        <CouponForm draft={draft} onChange={setDraft} onSave={saveCoupon} onCancel={() => setDraft(null)} saving={saving} error={error} />
                      </li>
                    ) : (
                      <li key={coupon.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-panel border border-ui-line bg-ui-surface p-4" aria-label={coupon.code}>
                        <div className="min-w-0 flex-1">
                          <p className="font-mono text-base font-bold tracking-wide text-ui-heading" dir="ltr" style={{ textAlign: lang === "ar" ? "right" : "left" }}>
                            {coupon.code}
                          </p>
                          <p className="text-sm text-ui-ink">{describe(coupon)}</p>
                          <p className="text-xs text-ui-muted">{t.used(coupon.used_count, coupon.max_uses)}</p>
                        </div>
                        {askDelete === coupon.id ? (
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-sm">{t.removeAsk(coupon.code)}</span>
                            <button type="button" onClick={() => remove(coupon)} className="min-h-11 rounded-control bg-ui-danger px-4 text-sm font-semibold text-white">{t.yes}</button>
                            <button type="button" onClick={() => setAskDelete(null)} className="min-h-11 rounded-control border border-ui-line px-4 text-sm font-semibold">{t.cancel}</button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              role="switch"
                              aria-checked={coupon.is_active}
                              disabled={readOnly}
                              onClick={() => toggle(coupon)}
                              className={clsx(
                                "min-h-9 rounded-full border px-3 text-sm font-semibold disabled:opacity-60",
                                coupon.is_active ? "border-ui-primary bg-ui-subtle text-ui-heading" : "border-ui-line text-ui-muted"
                              )}
                            >
                              {coupon.is_active ? t.active : t.inactive}
                            </button>
                            {!readOnly && (
                              <>
                                <button type="button" onClick={() => { setError(null); setDraft(toDraft(coupon)); }} aria-label={t.edit(coupon.code)} className="flex h-9 w-9 items-center justify-center rounded-control border border-ui-line hover:bg-ui-subtle">
                                  <Pencil className="h-4 w-4" aria-hidden />
                                </button>
                                <button type="button" onClick={() => setAskDelete(coupon.id)} aria-label={t.remove(coupon.code)} className="flex h-9 w-9 items-center justify-center rounded-control border border-ui-line text-ui-danger hover:bg-ui-subtle">
                                  <Trash2 className="h-4 w-4" aria-hidden />
                                </button>
                              </>
                            )}
                          </div>
                        )}
                      </li>
                    )
                  )}
                </ul>
                {draft && !draft.id && <CouponForm draft={draft} onChange={setDraft} onSave={saveCoupon} onCancel={() => setDraft(null)} saving={saving} error={error} />}
                {!draft && !readOnly && (
                  <button
                    type="button"
                    onClick={() => { setError(null); setDraft({ ...EMPTY }); }}
                    className="inline-flex min-h-11 items-center gap-2 rounded-control border border-dashed border-ui-input px-4 text-sm font-semibold text-ui-heading hover:bg-ui-subtle"
                  >
                    <Plus className="h-4 w-4" aria-hidden />
                    {t.add}
                  </button>
                )}
              </>
            )}
          </section>

          {loyalty && (
            <section aria-labelledby="loyalty-title" className="space-y-4 rounded-panel border border-ui-line bg-ui-surface p-5">
              <div>
                <h2 id="loyalty-title" className="text-lg font-bold text-ui-heading">{t.loyaltyTitle}</h2>
                <p className="mt-1 text-sm text-ui-muted">{t.loyaltyBody}</p>
              </div>
              <label className="flex cursor-pointer items-center gap-3">
                <input type="checkbox" checked={loyalty.enabled} disabled={readOnly} onChange={(e) => setLoyalty({ ...loyalty, enabled: e.target.checked })} className="h-5 w-5 accent-[var(--ui-primary)]" />
                <span className="font-semibold text-ui-ink">{t.loyaltyOn}</span>
              </label>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-1.5">
                  <label htmlFor="loyalty-every" className="block text-sm font-semibold text-ui-ink">{t.every}</label>
                  <select id="loyalty-every" value={loyalty.every} disabled={readOnly} onChange={(e) => setLoyalty({ ...loyalty, every: Number(e.target.value) })} className={input}>
                    {[...new Set([3, 4, 5, 6, 8, 10, 12, loyalty.every])].sort((a, b) => a - b).map((n) => (
                      <option key={n} value={n}>{t.everyOption(n)}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="loyalty-en" className="block text-sm font-semibold text-ui-ink">{t.rewardEn}</label>
                  <input id="loyalty-en" dir="ltr" lang="en" value={loyalty.reward_en} maxLength={80} disabled={readOnly} placeholder={t.rewardPlaceholderEn} onChange={(e) => setLoyalty({ ...loyalty, reward_en: e.target.value })} className={input} />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="loyalty-ar" className="block text-sm font-semibold text-ui-ink">{t.rewardAr}</label>
                  <input id="loyalty-ar" dir="rtl" lang="ar" value={loyalty.reward_ar} maxLength={80} disabled={readOnly} placeholder={t.rewardPlaceholderAr} onChange={(e) => setLoyalty({ ...loyalty, reward_ar: e.target.value })} className={input} />
                </div>
              </div>
              {loyaltyStatus && (
                <p role="status" className={clsx("text-sm", loyaltyStatus.ok ? "text-ui-success" : "text-ui-danger")}>{loyaltyStatus.text}</p>
              )}
              {!readOnly && (
                <button type="button" onClick={saveLoyalty} className="inline-flex min-h-11 items-center gap-2 rounded-control bg-ui-primary px-4 text-sm font-semibold text-ui-primary-fg hover:bg-ui-primary-hover">
                  <Save className="h-4 w-4" aria-hidden />
                  {t.saveLoyalty}
                </button>
              )}
            </section>
          )}
        </div>
      </CatalogAdminContent>
    </>
  );
}

export default function OffersPage() {
  return (
    <CatalogAdminShell>
      <OffersView />
    </CatalogAdminShell>
  );
}
