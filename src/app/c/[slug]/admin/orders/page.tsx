"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { clsx } from "clsx";
import { CalendarClock, Check, ChefHat, MapPin, MessageCircle, Phone, Users, X, Inbox, Loader2, RefreshCw } from "lucide-react";
import { CatalogAdminShell, useCatalogAdmin } from "../_components/CatalogAdminShell";
import { CatalogAdminContent, CatalogAdminHeader } from "../_components/CatalogAdminSidebar";
import { adminNavLabels } from "../_components/adminNav";
import { useAdminLang, useCopy, useFormat, plural, type AdminLang } from "../_lib/i18n";
import { useModule } from "../_lib/module";
import { getDictionary } from "../../_lib/i18n";
import { whatsappLink } from "../../_lib/whatsapp";
import { formatPrice, formatTotal, getPriceConfig } from "@/lib/catalog/price";
import { variantName } from "@/lib/catalog/dish-info";
import type { SavedOrder, OrderStatus } from "@/lib/orders/store";

type Tab = "new" | "active" | "done";
type KindFilter = "all" | "order" | "booking";

const en = {
  tabs: { new: "New", active: "In progress", done: "Done" } as Record<Tab, string>,
  filters: { all: "All", order: "Orders", booking: "Table bookings" } as Record<KindFilter, string>,
  filterLabel: "Show",
  status: {
    new: "New",
    confirmed: "Confirmed",
    ready: "Ready",
    completed: "Done",
    cancelled: "Cancelled",
  } as Record<OrderStatus, string>,
  kind: { order: "Order", booking: "Table booking", request: "Request" },
  confirm: "Confirm",
  ready: "Mark ready",
  complete: "Mark done",
  cancel: "Cancel",
  cancelAsk: "Cancel this one?",
  cancelYes: "Yes, cancel",
  keep: "Keep",
  call: "Call",
  whatsapp: "WhatsApp",
  table: "Table",
  guests: (n: number, lang: AdminLang) => plural(lang, n, { one: "1 guest", other: "# guests" }),
  when: "For",
  note: "Note",
  total: "Total",
  emptyNew: "No new orders. New ones appear here by themselves.",
  emptyActive: "Nothing in progress.",
  emptyDone: "Finished and cancelled orders will be listed here.",
  loadMore: "Show older",
  loading: "Loading…",
  refresh: "Refresh",
  failed: "Couldn't load orders. Check your connection.",
  stockBack: "Stock is given back when you cancel.",
};
const ar: typeof en = {
  tabs: { new: "جديدة", active: "قيد التنفيذ", done: "منتهية" },
  filters: { all: "الكل", order: "الطلبات", booking: "حجوزات الطاولات" },
  filterLabel: "عرض",
  status: { new: "جديد", confirmed: "مؤكَّد", ready: "جاهز", completed: "منتهٍ", cancelled: "ملغى" },
  kind: { order: "طلب", booking: "حجز طاولة", request: "طلب موعد" },
  confirm: "تأكيد",
  ready: "جاهز",
  complete: "تم",
  cancel: "إلغاء",
  cancelAsk: "إلغاء هذا الطلب؟",
  cancelYes: "نعم، ألغِه",
  keep: "إبقاء",
  call: "اتصال",
  whatsapp: "واتساب",
  table: "الطاولة",
  guests: (n, lang) => plural(lang, n, { one: "شخص واحد", two: "شخصان", few: "# أشخاص", many: "# شخصاً", other: "# شخص" }),
  when: "الموعد",
  note: "ملاحظة",
  total: "المجموع",
  emptyNew: "لا طلبات جديدة. تظهر الطلبات الجديدة هنا تلقائياً.",
  emptyActive: "لا شيء قيد التنفيذ.",
  emptyDone: "ستظهر هنا الطلبات المنتهية والملغاة.",
  loadMore: "عرض الأقدم",
  loading: "جارٍ التحميل…",
  refresh: "تحديث",
  failed: "تعذّر تحميل الطلبات. تحقق من الاتصال.",
  stockBack: "تُعاد الكمية إلى المخزون عند الإلغاء.",
};

/** SQLite datetime('now') is UTC without a zone */
const utc = (value: string) => (value.includes("T") ? value : `${value.replace(" ", "T")}Z`);

function statusClass(status: OrderStatus) {
  switch (status) {
    case "new":
      return "bg-ui-primary text-ui-primary-fg";
    case "confirmed":
      return "bg-ui-subtle text-ui-heading";
    case "ready":
      return "bg-ui-accent text-ui-accent-fg";
    case "completed":
      return "bg-ui-bg text-ui-success border border-ui-line";
    default:
      return "bg-ui-bg text-ui-muted border border-ui-line";
  }
}

function OrderCard({ order, onStatus, busy }: { order: SavedOrder; onStatus: (status: OrderStatus) => void; busy: boolean }) {
  const t = useCopy({ en, ar });
  const lang = useAdminLang();
  const f = useFormat();
  const { module } = useModule();
  const words = getDictionary(lang, module.id);
  const [askCancel, setAskCancel] = useState(false);

  const config = order.price_config ?? getPriceConfig(null);
  const total = order.lines.length > 0 ? formatTotal(order.lines, config, lang) : null;
  const typeLabel = order.order_type ? (words as unknown as Record<string, string>)[order.order_type] : null;
  const holdsStock = order.lines.some((line) => line.reserved > 0);
  const canReady = order.kind === "order";

  return (
    <article className="rounded-panel border border-ui-line bg-ui-surface p-4 sm:p-5" aria-label={`#${order.number}`}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-lg font-semibold text-ui-heading">
            #{order.number} · <span className="text-base">{t.kind[order.kind]}</span>
            {typeLabel && <span className="text-base font-medium text-ui-muted"> · {typeLabel}</span>}
          </p>
          <p className="text-sm text-ui-muted">{f.dateTime(utc(order.created_at))}</p>
        </div>
        <span className={clsx("rounded-full px-2.5 py-1 text-xs font-semibold", statusClass(order.status))}>{t.status[order.status]}</span>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2">
        <p className="font-semibold text-ui-ink">{order.customer_name}</p>
        <span dir="ltr" className="text-sm text-ui-muted">{order.customer_phone}</span>
        <div className="flex gap-2">
          <a href={`tel:${order.customer_phone}`} className="inline-flex min-h-9 items-center gap-1.5 rounded-control border border-ui-line px-3 text-sm font-medium hover:bg-ui-subtle">
            <Phone className="h-4 w-4" aria-hidden />
            {t.call}
          </a>
          <a
            href={whatsappLink(order.customer_phone)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-9 items-center gap-1.5 rounded-control border border-ui-line px-3 text-sm font-medium hover:bg-ui-subtle"
          >
            <MessageCircle className="h-4 w-4" aria-hidden />
            {t.whatsapp}
          </a>
        </div>
      </div>

      <ul className="mt-3 space-y-1 text-sm">
        {order.table_label && (
          <li className="flex items-center gap-2">
            <ChefHat className="h-4 w-4 text-ui-muted" aria-hidden />
            {t.table}: <strong>{order.table_label}</strong>
          </li>
        )}
        {order.address && (
          <li className="flex items-start gap-2">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-ui-muted" aria-hidden />
            <span>
              {order.address}
              {order.area ? `${lang === "ar" ? "، " : ", "}${order.area}` : ""}
            </span>
          </li>
        )}
        {order.requested_for && (
          <li className="flex items-center gap-2">
            <CalendarClock className="h-4 w-4 text-ui-muted" aria-hidden />
            {t.when}: <strong dir="ltr">{order.requested_for}</strong>
          </li>
        )}
        {order.party_size != null && (
          <li className="flex items-center gap-2">
            <Users className="h-4 w-4 text-ui-muted" aria-hidden />
            {t.guests(order.party_size, lang)}
          </li>
        )}
      </ul>

      {order.lines.length > 0 && (
        <div className="mt-3 rounded-control bg-ui-bg p-3">
          <ul className="space-y-2 text-sm">
            {order.lines.map((line, index) => (
              <li key={index}>
                <div className="flex justify-between gap-3">
                  <span>
                    <strong className="tabular-nums">{line.quantity} ×</strong>{" "}
                    {(lang === "ar" ? line.name_ar || line.name_en : line.name_en || line.name_ar) || "—"}
                    {line.variant_id && ` (${variantName({ name_en: line.variant_en ?? "", name_ar: line.variant_ar ?? "" }, lang)})`}
                  </span>
                  <span className="shrink-0 tabular-nums">{formatPrice(line.price * line.quantity, line.currency, config, lang).primary}</span>
                </div>
                {line.note && <p className="text-ui-muted">{t.note}: {line.note}</p>}
              </li>
            ))}
          </ul>
          {total && (
            <p className="mt-2 flex justify-between border-t border-ui-line pt-2 font-semibold">
              <span>{t.total}</span>
              <span className="tabular-nums">
                {total.primary}
                {total.secondary && <span className="ms-2 font-normal text-ui-muted">{total.secondary}</span>}
              </span>
            </p>
          )}
        </div>
      )}

      {order.note && (
        <p className="mt-3 rounded-control border border-ui-line px-3 py-2 text-sm">
          <strong>{t.note}:</strong> {order.note}
        </p>
      )}

      {order.status !== "completed" && order.status !== "cancelled" && (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          {askCancel ? (
            <>
              <span className="text-sm font-semibold">{t.cancelAsk}</span>
              {holdsStock && <span className="w-full text-xs text-ui-muted sm:w-auto">{t.stockBack}</span>}
              <button
                type="button"
                disabled={busy}
                onClick={() => onStatus("cancelled")}
                className="min-h-11 rounded-control bg-ui-danger px-4 text-sm font-semibold text-white disabled:opacity-60"
              >
                {t.cancelYes}
              </button>
              <button type="button" onClick={() => setAskCancel(false)} className="min-h-11 rounded-control border border-ui-line px-4 text-sm font-semibold">
                {t.keep}
              </button>
            </>
          ) : (
            <>
              {order.status === "new" && (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => onStatus("confirmed")}
                  className="inline-flex min-h-11 items-center gap-2 rounded-control bg-ui-primary px-4 text-sm font-semibold text-ui-primary-fg hover:bg-ui-primary-hover disabled:opacity-60"
                >
                  <Check className="h-4 w-4" aria-hidden />
                  {t.confirm}
                </button>
              )}
              {canReady && order.status === "confirmed" && (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => onStatus("ready")}
                  className="min-h-11 rounded-control bg-ui-primary px-4 text-sm font-semibold text-ui-primary-fg hover:bg-ui-primary-hover disabled:opacity-60"
                >
                  {t.ready}
                </button>
              )}
              {order.status !== "new" && (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => onStatus("completed")}
                  className={clsx(
                    "min-h-11 rounded-control px-4 text-sm font-semibold disabled:opacity-60",
                    order.status === "ready" || !canReady ? "bg-ui-primary text-ui-primary-fg hover:bg-ui-primary-hover" : "border border-ui-line"
                  )}
                >
                  {t.complete}
                </button>
              )}
              <button
                type="button"
                disabled={busy}
                onClick={() => setAskCancel(true)}
                className="inline-flex min-h-11 items-center gap-1.5 rounded-control px-3 text-sm font-semibold text-ui-danger hover:bg-ui-subtle disabled:opacity-60"
              >
                <X className="h-4 w-4" aria-hidden />
                {t.cancel}
              </button>
            </>
          )}
        </div>
      )}
    </article>
  );
}

function OrdersView() {
  const t = useCopy({ en, ar });
  const lang = useAdminLang();
  const { slug, fetchWithAuth, refreshNewOrders, newOrders } = useCatalogAdmin();
  const { module } = useModule();
  const [tab, setTab] = useState<Tab>("new");
  const [kind, setKind] = useState<KindFilter>("all");
  const [orders, setOrders] = useState<SavedOrder[]>([]);
  const [counts, setCounts] = useState({ new: 0, active: 0 });
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const request = useRef(0);

  const load = useCallback(
    async (options: { before?: string; quiet?: boolean } = {}) => {
      const id = ++request.current;
      if (!options.quiet) setLoading(true);
      const params = new URLSearchParams({ tab });
      if (kind !== "all") params.set("kind", kind);
      if (options.before) params.set("before", options.before);
      try {
        const res = await fetchWithAuth(`/api/c/${slug}/admin/orders/?${params}`);
        if (!res.ok) throw new Error();
        const data = await res.json();
        if (id !== request.current) return;
        setOrders((prev) => (options.before ? [...prev, ...data.orders] : data.orders));
        setCounts(data.counts);
        setHasMore(tab === "done" && data.orders.length === 50);
        setFailed(false);
      } catch {
        if (id === request.current && !options.quiet) setFailed(true);
      } finally {
        if (id === request.current) setLoading(false);
      }
    },
    [fetchWithAuth, slug, tab, kind]
  );

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- loading the list for the chosen tab
    load();
  }, [load]);

  // The shell polls the new-orders count; when it changes, refresh the open list quietly
  const lastCount = useRef(newOrders);
  useEffect(() => {
    if (newOrders !== lastCount.current) {
      lastCount.current = newOrders;
      // eslint-disable-next-line react-hooks/set-state-in-effect -- the count comes from the shell's polling; the list follows it
      if (tab !== "done") load({ quiet: true });
    }
  }, [newOrders, tab, load]);

  const changeStatus = async (order: SavedOrder, status: OrderStatus) => {
    setBusyId(order.id);
    try {
      const res = await fetchWithAuth(`/api/c/${slug}/admin/orders/${order.id}/`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        await load({ quiet: true });
        refreshNewOrders();
      } else {
        const data = await res.json().catch(() => ({}));
        alert(data.error || t.failed);
        await load({ quiet: true });
      }
    } finally {
      setBusyId(null);
    }
  };

  const tabs: Tab[] = ["new", "active", "done"];
  const empty = tab === "new" ? t.emptyNew : tab === "active" ? t.emptyActive : t.emptyDone;

  return (
    <>
      <CatalogAdminHeader title={adminNavLabels(lang, module).orders}>
        <button
          type="button"
          onClick={() => load()}
          className="inline-flex min-h-11 items-center gap-2 rounded-control border border-ui-line bg-ui-surface px-4 text-sm font-semibold hover:bg-ui-subtle"
        >
          <RefreshCw className="h-4 w-4" aria-hidden />
          {t.refresh}
        </button>
      </CatalogAdminHeader>
      <CatalogAdminContent>
        <div className="mx-auto max-w-3xl">
          <div role="tablist" className="grid grid-cols-3 gap-1 rounded-panel bg-ui-subtle p-1">
            {tabs.map((key) => {
              const count = key === "new" ? counts.new : key === "active" ? counts.active : 0;
              return (
                <button
                  key={key}
                  type="button"
                  role="tab"
                  aria-selected={tab === key}
                  onClick={() => setTab(key)}
                  className={clsx(
                    "flex min-h-11 items-center justify-center gap-2 rounded-control text-sm font-semibold transition-colors",
                    tab === key ? "bg-ui-surface text-ui-ink shadow-sm" : "text-ui-muted hover:text-ui-ink"
                  )}
                >
                  {t.tabs[key]}
                  {count > 0 && (
                    <span className="rounded-full bg-ui-primary px-1.5 py-0.5 text-[11px] leading-none text-white tabular-nums">{count}</span>
                  )}
                </button>
              );
            })}
          </div>

          {module.tableBooking && (
            <div className="mt-3 flex flex-wrap items-center gap-2" role="group" aria-label={t.filterLabel}>
              {(["all", "order", "booking"] as KindFilter[]).map((key) => (
                <button
                  key={key}
                  type="button"
                  aria-pressed={kind === key}
                  onClick={() => setKind(key)}
                  className={clsx(
                    "min-h-9 rounded-full border px-3 text-sm font-medium",
                    kind === key ? "border-ui-primary bg-ui-subtle text-ui-heading" : "border-ui-line text-ui-muted hover:text-ui-ink"
                  )}
                >
                  {t.filters[key]}
                </button>
              ))}
            </div>
          )}

          <div className="mt-4 space-y-3" role="tabpanel" aria-busy={loading}>
            {loading && orders.length === 0 ? (
              <p className="flex items-center justify-center gap-2 py-16 text-ui-muted" role="status">
                <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
                {t.loading}
              </p>
            ) : failed ? (
              <p className="rounded-panel border border-ui-line bg-ui-surface p-6 text-center text-ui-danger" role="alert">
                {t.failed}
              </p>
            ) : orders.length === 0 ? (
              <div className="rounded-panel border border-dashed border-ui-line bg-ui-surface p-10 text-center">
                <Inbox className="mx-auto h-10 w-10 text-ui-line" aria-hidden />
                <p className="mt-3 text-ui-muted">{empty}</p>
              </div>
            ) : (
              orders.map((order) => (
                <OrderCard key={order.id} order={order} busy={busyId === order.id} onStatus={(status) => changeStatus(order, status)} />
              ))
            )}
            {hasMore && (
              <button
                type="button"
                onClick={() => load({ before: orders[orders.length - 1]?.created_at, quiet: true })}
                className="min-h-11 w-full rounded-control border border-ui-line bg-ui-surface text-sm font-semibold hover:bg-ui-subtle"
              >
                {t.loadMore}
              </button>
            )}
          </div>
        </div>
      </CatalogAdminContent>
    </>
  );
}

export default function OrdersPage() {
  return (
    <CatalogAdminShell>
      <OrdersView />
    </CatalogAdminShell>
  );
}
