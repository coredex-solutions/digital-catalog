"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Loader2, Printer } from "lucide-react";
import { CatalogAdminShell, useCatalogAdmin } from "../../../_components/CatalogAdminShell";
import { CatalogAdminContent, CatalogAdminHeader } from "../../../_components/CatalogAdminSidebar";
import { useAdminLang, useCopy, useFormat } from "../../../_lib/i18n";
import { useModule } from "../../../_lib/module";
import { getDictionary } from "../../../../_lib/i18n";
import { formatPrice, formatTotal, getPriceConfig } from "@/lib/catalog/price";
import { variantName } from "@/lib/catalog/dish-info";
import { feeLine } from "@/lib/orders/delivery";
import { discountLine } from "@/lib/orders/coupons";
import type { SavedOrder } from "@/lib/orders/store";

const en = {
  title: (n: number) => `Print order #${n}`,
  titlePlain: "Print order",
  back: "Orders",
  print: "Print ticket",
  help: "Made for 80 mm receipt printers. On a normal printer it prints at the top of the page. In the print window, set margins to “None” if the ticket is cut off.",
  loading: "Loading…",
  failed: "Couldn't load this order.",
  table: "Table",
  when: "For",
  guests: "Guests",
  checkIn: "Check-in",
  checkOut: "Check-out",
  note: "Note",
  delivery: "Delivery",
  discount: "Discount",
  free: "Free",
  total: "Total",
  payment: "Payment",
  paid: "PAID",
  notPaid: "Not paid",
  payMethods: { cash: "Cash", card: "Card", whish: "Whish", omt: "OMT" } as Record<string, string>,
};
const ar: typeof en = {
  title: (n) => `طباعة الطلب #${n}`,
  titlePlain: "طباعة الطلب",
  back: "الطلبات",
  print: "طباعة الإيصال",
  help: "مخصّص لطابعات الإيصالات بعرض 80 مم. على الطابعة العادية يُطبع أعلى الصفحة. في نافذة الطباعة اجعل الهوامش “بلا” إن قُصّ الإيصال.",
  loading: "جارٍ التحميل…",
  failed: "تعذّر تحميل هذا الطلب.",
  table: "الطاولة",
  when: "الموعد",
  guests: "عدد الأشخاص",
  checkIn: "الوصول",
  checkOut: "المغادرة",
  note: "ملاحظة",
  delivery: "التوصيل",
  discount: "الخصم",
  free: "مجاني",
  total: "المجموع",
  payment: "الدفع",
  paid: "مدفوع",
  notPaid: "غير مدفوع",
  payMethods: { cash: "نقداً", card: "بطاقة", whish: "Whish", omt: "OMT" },
};

/** SQLite datetime('now') is UTC without a zone */
const utc = (value: string) => (value.includes("T") ? value : `${value.replace(" ", "T")}Z`);

function Ticket({ order, businessName }: { order: SavedOrder; businessName: string }) {
  const t = useCopy({ en, ar });
  const lang = useAdminLang();
  const f = useFormat();
  const { module } = useModule();
  const words = getDictionary(lang, module.id) as unknown as Record<string, string>;
  const config = order.price_config ?? getPriceConfig(null);
  const total = order.lines.length > 0 ? formatTotal([...order.lines, ...feeLine(order.delivery_fee, order.delivery_currency), ...discountLine(order.discount, order.discount_currency)], config, lang) : null;
  const name = (line: SavedOrder["lines"][number]) => (lang === "ar" ? line.name_ar || line.name_en : line.name_en || line.name_ar) || "—";

  return (
    <div className="order-ticket" dir={lang === "ar" ? "rtl" : "ltr"}>
      <p className="tk-center tk-small">{businessName}</p>
      <p className="tk-center tk-big">#{order.number}</p>
      <p className="tk-center tk-strong">{order.order_type ? words[order.order_type] ?? order.order_type : ""}</p>
      <p className="tk-center tk-small">{f.dateTime(utc(order.created_at))}</p>
      <hr />
      <p className="tk-strong">{order.customer_name}</p>
      <p dir="ltr" className="tk-small" style={{ textAlign: lang === "ar" ? "right" : "left" }}>{order.customer_phone}</p>
      {order.table_label && <p className="tk-strong">{t.table}: {order.table_label}</p>}
      {order.address && <p>{order.address}{order.area ? ` · ${order.area}` : ""}</p>}
      {order.requested_for && order.check_out && (
        <>
          <p className="tk-strong">{t.checkIn}: <span dir="ltr">{order.requested_for}</span></p>
          <p className="tk-strong">{t.checkOut}: <span dir="ltr">{order.check_out}</span></p>
        </>
      )}
      {order.requested_for && !order.check_out && <p className="tk-strong">{t.when}: <span dir="ltr">{order.requested_for}</span></p>}
      {order.party_size != null && <p>{t.guests}: {order.party_size}</p>}
      {order.lines.length > 0 && (
        <>
          <hr />
          {order.lines.map((line, index) => (
            <div key={index} className="tk-line">
              <div className="tk-row">
                <span className="tk-strong">
                  {line.quantity} × {name(line)}
                  {line.variant_id && ` (${variantName({ name_en: line.variant_en ?? "", name_ar: line.variant_ar ?? "" }, lang)})`}
                </span>
                <span>{formatPrice(line.price * line.quantity, line.currency, config, lang).primary}</span>
              </div>
              {line.note && <p className="tk-note">» {line.note}</p>}
            </div>
          ))}
          {order.discount != null && order.discount > 0 && (
            <div className="tk-row">
              <span>{t.discount}{order.coupon_code ? ` (${order.coupon_code})` : ""}</span>
              <span>−{formatPrice(order.discount, order.discount_currency, config, lang).primary}</span>
            </div>
          )}
          {order.order_type === "delivery" && order.delivery_fee != null && (
            <div className="tk-row">
              <span>{t.delivery}</span>
              <span>{order.delivery_fee > 0 ? formatPrice(order.delivery_fee, order.delivery_currency, config, lang).primary : t.free}</span>
            </div>
          )}
        </>
      )}
      {total && (
        <>
          <hr />
          <div className="tk-row tk-strong tk-total">
            <span>{t.total}</span>
            <span>{total.primary}</span>
          </div>
          {total.secondary && <p className="tk-small" style={{ textAlign: lang === "ar" ? "left" : "right" }}>{total.secondary}</p>}
        </>
      )}
      {order.payment_method && (
        <p className="tk-strong">
          {t.payment}: {t.payMethods[order.payment_method] ?? order.payment_method} · {order.paid_at ? t.paid : t.notPaid}
        </p>
      )}
      {order.note && (
        <>
          <hr />
          <p className="tk-note">{t.note}: {order.note}</p>
        </>
      )}
    </div>
  );
}

function OrderPrintContent() {
  const t = useCopy({ en, ar });
  const params = useParams();
  const id = String(params.id ?? "");
  const { slug, catalog, fetchWithAuth } = useCatalogAdmin();
  const [order, setOrder] = useState<SavedOrder | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetchWithAuth(`/api/c/${slug}/admin/orders/${id}/`)
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data) => !cancelled && setOrder(data.order))
      .catch(() => !cancelled && setFailed(true));
    return () => {
      cancelled = true;
    };
  }, [fetchWithAuth, slug, id]);

  return (
    <>
      <CatalogAdminHeader title={order ? t.title(order.number) : t.titlePlain}>
        <Link
          href={`/c/${slug}/admin/orders/`}
          className="inline-flex min-h-11 items-center gap-2 rounded-control border border-ui-line bg-ui-surface px-4 text-sm font-semibold hover:bg-ui-subtle"
        >
          <ArrowLeft className="h-4 w-4 rtl:-scale-x-100" aria-hidden />
          {t.back}
        </Link>
      </CatalogAdminHeader>
      <CatalogAdminContent>
        <div className="mx-auto max-w-md space-y-4">
          {failed ? (
            <p className="rounded-panel border border-ui-line bg-ui-surface p-6 text-center text-ui-danger" role="alert">{t.failed}</p>
          ) : !order ? (
            <p className="flex items-center justify-center gap-2 py-16 text-ui-muted" role="status">
              <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
              {t.loading}
            </p>
          ) : (
            <>
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-control bg-ui-primary px-4 font-semibold text-ui-primary-fg hover:bg-ui-primary-hover"
              >
                <Printer className="h-5 w-5" aria-hidden />
                {t.print}
              </button>
              <p className="text-xs text-ui-muted">{t.help}</p>
              {/* The same ticket on screen and on paper */}
              <div className="ticket-screen flex justify-center rounded-panel border border-dashed border-ui-line bg-white p-4 text-black">
                <Ticket order={order} businessName={catalog?.name || slug} />
              </div>
            </>
          )}
        </div>
      </CatalogAdminContent>

      <style>{`
        .order-ticket { width: 72mm; max-width: 100%; font-family: ui-sans-serif, system-ui, "Segoe UI", Tahoma, sans-serif; font-size: 11pt; line-height: 1.35; color: #000; }
        .order-ticket p { margin: 0 0 1mm; }
        .order-ticket hr { border: 0; border-top: 0.4mm dashed #000; margin: 2mm 0; }
        .order-ticket .tk-center { text-align: center; }
        .order-ticket .tk-big { font-size: 26pt; font-weight: 800; line-height: 1.1; }
        .order-ticket .tk-strong { font-weight: 700; }
        .order-ticket .tk-small { font-size: 9pt; }
        .order-ticket .tk-row { display: flex; justify-content: space-between; gap: 3mm; }
        .order-ticket .tk-row span:last-child { white-space: nowrap; font-variant-numeric: tabular-nums; }
        .order-ticket .tk-line { margin-bottom: 1.5mm; font-size: 12pt; }
        .order-ticket .tk-note { font-size: 10pt; font-style: italic; }
        .order-ticket .tk-total { font-size: 14pt; }
        @media print {
          @page { size: 80mm auto; margin: 4mm; }
          body * { visibility: hidden !important; }
          .ticket-screen, .ticket-screen * { visibility: visible !important; }
          .ticket-screen { position: absolute; inset: 0 auto auto 0; border: 0 !important; padding: 0 !important; display: block !important; }
        }
      `}</style>
    </>
  );
}

export default function OrderPrintPage() {
  return (
    <CatalogAdminShell>
      <OrderPrintContent />
    </CatalogAdminShell>
  );
}
