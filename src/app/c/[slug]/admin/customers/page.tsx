"use client";

import { useEffect, useMemo, useState } from "react";
import { Contact, Download, Loader2, MessageCircle, Phone, Search } from "lucide-react";
import { CatalogAdminShell, useCatalogAdmin } from "../_components/CatalogAdminShell";
import { CatalogAdminContent, CatalogAdminHeader } from "../_components/CatalogAdminSidebar";
import { adminNavLabels } from "../_components/adminNav";
import { useAdminLang, useCopy, useFormat, plural, type AdminLang } from "../_lib/i18n";
import { useModule } from "../_lib/module";
import { whatsappLink } from "../../_lib/whatsapp";
import { formatMoney } from "@/lib/catalog/price";
import type { Customer } from "@/lib/orders/customers";

type Sort = "recent" | "orders" | "spent";

const en = {
  intro: "Everyone who ordered from your page, by phone number. Cancelled orders aren't counted.",
  search: "Search by name or number",
  sortLabel: "Sort by",
  ordersLabel: "Orders",
  sorts: { recent: "Last order", orders: "Most orders", spent: "Most spent" } as Record<Sort, string>,
  count: (n: number, lang: AdminLang) => plural(lang, n, { one: "1 customer", other: "# customers" }),
  orders: (n: number, lang: AdminLang) => plural(lang, n, { one: "1 order", other: "# orders" }),
  spent: "Spent",
  last: "Last order",
  call: "Call",
  whatsapp: "WhatsApp",
  export: "Download CSV",
  empty: "Customers appear here once they order from your page.",
  noMatch: "No customer matches your search.",
  loading: "Loading…",
  failed: "Couldn't load customers. Check your connection.",
  csvHeader: ["Name", "Phone", "Orders", "Spent (USD)", "First order", "Last order"],
};
const ar: typeof en = {
  intro: "كل من طلب من صفحتك، حسب رقم الهاتف. لا تُحتسب الطلبات الملغاة.",
  search: "ابحث بالاسم أو الرقم",
  sortLabel: "الترتيب حسب",
  ordersLabel: "الطلبات",
  sorts: { recent: "آخر طلب", orders: "الأكثر طلباً", spent: "الأعلى إنفاقاً" },
  count: (n, lang) => plural(lang, n, { one: "زبون واحد", two: "زبونان", few: "# زبائن", many: "# زبوناً", other: "# زبون" }),
  orders: (n, lang) => plural(lang, n, { one: "طلب واحد", two: "طلبان", few: "# طلبات", many: "# طلباً", other: "# طلب" }),
  spent: "الإنفاق",
  last: "آخر طلب",
  call: "اتصال",
  whatsapp: "واتساب",
  export: "تنزيل ملف CSV",
  empty: "يظهر الزبائن هنا بعد أن يطلبوا من صفحتك.",
  noMatch: "لا يوجد زبون يطابق بحثك.",
  loading: "جارٍ التحميل…",
  failed: "تعذّر تحميل الزبائن. تحقق من الاتصال.",
  csvHeader: ["الاسم", "الهاتف", "الطلبات", "الإنفاق (دولار)", "أول طلب", "آخر طلب"],
};

/** SQLite datetime('now') is UTC without a zone */
const utc = (value: string) => (value.includes("T") ? value : `${value.replace(" ", "T")}Z`);

/** One CSV cell; quotes as needed, and a leading ' stops spreadsheets running formulas */
function csvCell(value: string | number | null): string {
  let text = value == null ? "" : String(value);
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function CustomersView() {
  const t = useCopy({ en, ar });
  const lang = useAdminLang();
  const f = useFormat();
  const { module } = useModule();
  const { slug, fetchWithAuth } = useCatalogAdmin();
  const [customers, setCustomers] = useState<Customer[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<Sort>("recent");

  useEffect(() => {
    let cancelled = false;
    fetchWithAuth(`/api/c/${slug}/admin/customers/`)
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data) => !cancelled && setCustomers(data.customers))
      .catch(() => !cancelled && setFailed(true));
    return () => {
      cancelled = true;
    };
  }, [fetchWithAuth, slug]);

  const shown = useMemo(() => {
    if (!customers) return [];
    const q = query.trim().toLowerCase();
    const digits = q.replace(/\D/g, "");
    const list = customers.filter(
      (c) => !q || c.name.toLowerCase().includes(q) || (digits.length >= 2 && c.phone.replace(/\D/g, "").includes(digits))
    );
    if (sort === "orders") return [...list].sort((a, b) => b.orders - a.orders || (a.lastAt < b.lastAt ? 1 : -1));
    if (sort === "spent") return [...list].sort((a, b) => (b.spentUsd ?? 0) - (a.spentUsd ?? 0) || b.orders - a.orders);
    return list;
  }, [customers, query, sort]);

  const download = () => {
    const rows = [t.csvHeader, ...shown.map((c) => [c.name, c.phone, c.orders, c.spentUsd ?? "", c.firstAt.slice(0, 10), c.lastAt.slice(0, 10)])];
    // The byte-order mark lets Excel read Arabic names correctly
    const csv = "﻿" + rows.map((row) => row.map(csvCell).join(",")).join("\r\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `${slug}-customers.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <CatalogAdminHeader title={adminNavLabels(lang, module).customers}>
        {customers && customers.length > 0 && (
          <button
            type="button"
            onClick={download}
            className="inline-flex min-h-11 items-center gap-2 rounded-control border border-ui-line bg-ui-surface px-4 text-sm font-semibold hover:bg-ui-subtle"
          >
            <Download className="h-4 w-4" aria-hidden />
            {t.export}
          </button>
        )}
      </CatalogAdminHeader>
      <CatalogAdminContent>
        <div className="mx-auto max-w-3xl">
          <p className="text-sm text-ui-muted">{t.intro}</p>

          {failed ? (
            <p className="mt-4 rounded-panel border border-ui-line bg-ui-surface p-6 text-center text-ui-danger" role="alert">{t.failed}</p>
          ) : !customers ? (
            <p className="flex items-center justify-center gap-2 py-16 text-ui-muted" role="status">
              <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
              {t.loading}
            </p>
          ) : customers.length === 0 ? (
            <div className="mt-4 rounded-panel border border-dashed border-ui-line bg-ui-surface p-10 text-center">
              <Contact className="mx-auto h-10 w-10 text-ui-line" aria-hidden />
              <p className="mt-3 text-ui-muted">{t.empty}</p>
            </div>
          ) : (
            <>
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <div className="relative min-w-[14rem] flex-1">
                  <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ui-muted" aria-hidden />
                  <input
                    type="search"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder={t.search}
                    aria-label={t.search}
                    className="min-h-11 w-full rounded-control border border-ui-input bg-ui-surface ps-9 pe-3 text-ui-ink focus:border-ui-primary focus:outline-none"
                  />
                </div>
                <label className="flex items-center gap-2 text-sm">
                  <span className="text-ui-muted">{t.sortLabel}</span>
                  <select
                    value={sort}
                    onChange={(e) => setSort(e.target.value as Sort)}
                    className="min-h-11 rounded-control border border-ui-input bg-ui-surface px-3 text-ui-ink focus:border-ui-primary focus:outline-none"
                  >
                    {(Object.keys(t.sorts) as Sort[]).map((key) => (
                      <option key={key} value={key}>
                        {t.sorts[key]}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <p className="mt-3 text-sm text-ui-muted" role="status">{t.count(shown.length, lang)}</p>

              {shown.length === 0 ? (
                <p className="mt-4 rounded-panel border border-ui-line bg-ui-surface p-6 text-center text-ui-muted">{t.noMatch}</p>
              ) : (
                <ul className="mt-3 divide-y divide-ui-line rounded-panel border border-ui-line bg-ui-surface">
                  {shown.map((customer) => (
                    <li key={customer.key} className="flex flex-wrap items-center gap-x-4 gap-y-2 p-4">
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold text-ui-ink">{customer.name || "—"}</p>
                        <p dir="ltr" className="text-sm text-ui-muted" style={{ textAlign: lang === "ar" ? "right" : "left" }}>
                          {customer.phone}
                        </p>
                      </div>
                      <dl className="grid grid-cols-3 gap-x-4 text-sm sm:flex sm:gap-x-6">
                        <div>
                          <dt className="sr-only">{t.ordersLabel}</dt>
                          <dd className="font-semibold tabular-nums">{t.orders(customer.orders, lang)}</dd>
                        </div>
                        <div>
                          <dt className="text-xs text-ui-muted">{t.spent}</dt>
                          <dd className="tabular-nums">{customer.spentUsd != null ? formatMoney(customer.spentUsd, "USD", lang) : "—"}</dd>
                        </div>
                        <div>
                          <dt className="text-xs text-ui-muted">{t.last}</dt>
                          <dd className="tabular-nums">{f.date(utc(customer.lastAt))}</dd>
                        </div>
                      </dl>
                      <div className="flex gap-2">
                        <a
                          href={`tel:${customer.phone}`}
                          className="inline-flex min-h-9 items-center gap-1.5 rounded-control border border-ui-line px-3 text-sm font-medium hover:bg-ui-subtle"
                        >
                          <Phone className="h-4 w-4" aria-hidden />
                          {t.call}
                        </a>
                        <a
                          href={whatsappLink(customer.phone)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex min-h-9 items-center gap-1.5 rounded-control border border-ui-line px-3 text-sm font-medium hover:bg-ui-subtle"
                        >
                          <MessageCircle className="h-4 w-4" aria-hidden />
                          {t.whatsapp}
                        </a>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </div>
      </CatalogAdminContent>
    </>
  );
}

export default function CustomersPage() {
  return (
    <CatalogAdminShell>
      <CustomersView />
    </CatalogAdminShell>
  );
}
