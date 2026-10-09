"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import QRCode from "qrcode";
import { ArrowLeft, Loader2, Printer } from "lucide-react";
import { CatalogAdminShell, useCatalogAdmin } from "../../_components/CatalogAdminShell";
import { CatalogAdminContent, CatalogAdminHeader } from "../../_components/CatalogAdminSidebar";
import { qrPrintedKey } from "../../_components/SetupChecklist";

type Layout = "cards" | "poster";
const MAX_TABLES = 200;

interface Card {
  url: string;
  table: number | null;
  svg: string;
}

/**
 * Print-ready QR sheets (MENUDESIGN.md §8): dark modules on white, a four-module quiet zone,
 * vector output (the browser's "Save as PDF" keeps the SVG as vectors) and a readable short URL.
 * Table cards encode ?table=N so the order form knows the table; the menu link itself never changes.
 */
function QrPrintContent() {
  const { slug, catalog, fetchWithAuth } = useCatalogAdmin();
  const [layout, setLayout] = useState<Layout>("cards");
  const [withTables, setWithTables] = useState(false);
  const [from, setFrom] = useState("1");
  const [to, setTo] = useState("12");
  const [names, setNames] = useState<{ en: string; ar: string }>({ en: "", ar: "" });
  const [cards, setCards] = useState<Card[]>([]);
  const [building, setBuilding] = useState(true);

  const baseUrl = useMemo(() => {
    const configured = process.env.NEXT_PUBLIC_BASE_URL?.replace(/\/+$/, "");
    return configured || (typeof window !== "undefined" ? window.location.origin : "");
  }, []);
  const menuUrl = `${baseUrl}/c/${slug}`;
  const shortUrl = menuUrl.replace(/^https?:\/\//, "");

  // Ticks "Print your QR codes" on the dashboard checklist
  useEffect(() => {
    try {
      localStorage.setItem(qrPrintedKey(slug), "1");
    } catch {
      // Storage unavailable
    }
  }, [slug]);

  // Both names, so Arabic and English guests recognise the card
  useEffect(() => {
    fetchWithAuth(`/api/c/${slug}/admin/settings`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        const c = data?.catalog;
        setNames({ en: c?.name_en || c?.name || catalog?.name || "", ar: c?.name_ar || "" });
      })
      .catch(() => setNames({ en: catalog?.name || "", ar: "" }));
  }, [slug, catalog?.name, fetchWithAuth]);

  const tableRange = useMemo(() => {
    const start = Math.max(1, Math.floor(Number(from)));
    const end = Math.floor(Number(to));
    if (!withTables) return { tables: [null] as (number | null)[], error: "" };
    if (!Number.isFinite(start) || !Number.isFinite(end) || end < start) {
      return { tables: [], error: "Enter a valid range, for example 1 to 12." };
    }
    if (end - start + 1 > MAX_TABLES) return { tables: [], error: `Up to ${MAX_TABLES} tables at a time.` };
    return { tables: Array.from({ length: end - start + 1 }, (_, i) => start + i), error: "" };
  }, [withTables, from, to]);

  useEffect(() => {
    if (!baseUrl) return;
    let cancelled = false;
    setBuilding(true);
    Promise.all(
      tableRange.tables.map(async (table) => {
        const url = table ? `${menuUrl}/?table=${table}` : `${menuUrl}/`;
        const svg = await QRCode.toString(url, {
          type: "svg",
          margin: 4,
          errorCorrectionLevel: "M",
          color: { dark: "#000000", light: "#FFFFFF" },
        });
        return { url, table, svg };
      })
    ).then((result) => {
      if (!cancelled) {
        setCards(result);
        setBuilding(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [tableRange, menuUrl, baseUrl]);

  const perSheet = layout === "cards" ? 4 : 1;
  const sheets: Card[][] = [];
  for (let i = 0; i < cards.length; i += perSheet) sheets.push(cards.slice(i, i + perSheet));

  const renderCard = (card: Card, size: Layout) => (
    <div className={`qr-card qr-card-${size}`}>
      {names.ar && (
        <p className="qr-name" lang="ar" dir="rtl">
          {names.ar}
        </p>
      )}
      {names.en && names.en !== names.ar && <p className="qr-name">{names.en}</p>}
      <div className="qr-code" dangerouslySetInnerHTML={{ __html: card.svg }} />
      <p className="qr-cta">
        <span lang="ar" dir="rtl">امسح الرمز لعرض القائمة</span>
        <span>Scan to see the menu</span>
      </p>
      {card.table && (
        <p className="qr-table">
          <span lang="ar" dir="rtl">طاولة {card.table}</span> · Table {card.table}
        </p>
      )}
      <p className="qr-url" dir="ltr">{shortUrl}</p>
    </div>
  );

  return (
    <>
      <CatalogAdminHeader title="Print QR codes">
        <Link
          href={`/c/${slug}/admin/qr`}
          className="inline-flex min-h-11 items-center gap-2 rounded-control border border-ui-input px-4 text-sm font-semibold hover:bg-ui-subtle"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          QR designer
        </Link>
      </CatalogAdminHeader>

      <CatalogAdminContent>
        <div className="grid gap-6 lg:grid-cols-[minmax(0,22rem)_1fr]">
          {/* Options */}
          <section aria-labelledby="print-options" className="space-y-5 rounded-panel border border-ui-line bg-ui-surface p-5">
            <h2 id="print-options" className="font-semibold">Options</h2>

            <fieldset>
              <legend className="mb-2 text-sm font-semibold text-ui-muted">Layout</legend>
              <div className="grid grid-cols-2 gap-2">
                {([
                  ["cards", "Table cards", "4 per A4 sheet"],
                  ["poster", "Poster", "1 per A4 sheet"],
                ] as const).map(([value, label, hint]) => (
                  <label
                    key={value}
                    className={`flex min-h-11 cursor-pointer flex-col rounded-control border px-3 py-2 ${layout === value ? "border-ui-primary bg-ui-subtle" : "border-ui-input"}`}
                  >
                    <input type="radio" name="layout" value={value} checked={layout === value} onChange={() => setLayout(value)} className="sr-only" />
                    <span className="text-sm font-semibold">{label}</span>
                    <span className="text-xs text-ui-muted">{hint}</span>
                  </label>
                ))}
              </div>
            </fieldset>

            <div>
              <label className="flex min-h-11 cursor-pointer items-center gap-3">
                <input type="checkbox" checked={withTables} onChange={(e) => setWithTables(e.target.checked)} className="h-5 w-5" />
                <span className="text-sm font-semibold">Number the tables</span>
              </label>
              <p className="mt-1 text-xs text-ui-muted">Each card gets its own code, so dine-in orders arrive with the table number.</p>
              {withTables && (
                <div className="mt-3 grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="table-from" className="mb-1 block text-xs font-semibold text-ui-muted">From table</label>
                    <input id="table-from" type="number" min={1} inputMode="numeric" value={from} onChange={(e) => setFrom(e.target.value)} className="min-h-11 w-full rounded-control border border-ui-input bg-ui-bg px-3" />
                  </div>
                  <div>
                    <label htmlFor="table-to" className="mb-1 block text-xs font-semibold text-ui-muted">To table</label>
                    <input id="table-to" type="number" min={1} inputMode="numeric" value={to} onChange={(e) => setTo(e.target.value)} className="min-h-11 w-full rounded-control border border-ui-input bg-ui-bg px-3" />
                  </div>
                  {tableRange.error && <p role="alert" className="col-span-2 text-sm text-ui-danger">{tableRange.error}</p>}
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => window.print()}
              disabled={building || cards.length === 0}
              className="flex min-h-12 w-full items-center justify-center gap-2 rounded-control bg-ui-primary px-4 font-semibold text-ui-primary-fg hover:bg-ui-primary-hover disabled:opacity-50"
            >
              {building ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Printer className="h-4 w-4" aria-hidden />}
              Print or save as PDF
            </button>
            <p className="text-xs text-ui-muted">
              In the print window choose &ldquo;Save as PDF&rdquo; for a file, A4 paper, and scale 100% (&ldquo;Actual size&rdquo;).
              Before printing a batch, test one printed card with an iPhone and an Android phone.
            </p>
            {!process.env.NEXT_PUBLIC_BASE_URL && (
              <p className="rounded-control bg-ui-subtle p-3 text-xs text-ui-muted">
                The codes point to <bdi>{baseUrl}</bdi>. Set NEXT_PUBLIC_BASE_URL on the server so they always use your public domain.
              </p>
            )}
          </section>

          {/* On-screen preview of the first card */}
          <section aria-labelledby="print-preview" className="rounded-panel border border-ui-line bg-ui-surface p-5">
            <h2 id="print-preview" className="font-semibold">
              Preview <span className="text-sm font-normal text-ui-muted">· {cards.length} {cards.length === 1 ? "code" : "codes"}, {sheets.length} {sheets.length === 1 ? "sheet" : "sheets"}</span>
            </h2>
            <div className="mt-4 flex justify-center rounded-control bg-ui-subtle p-4">
              {cards[0] ? <div className="qr-screen">{renderCard(cards[0], layout)}</div> : <Loader2 className="h-6 w-6 animate-spin text-ui-muted" aria-label="Preparing" />}
            </div>
          </section>
        </div>
      </CatalogAdminContent>

      {/* What actually prints */}
      <div className="qr-print" aria-hidden>
        {sheets.map((sheet, i) => (
          <div key={i} className={`qr-sheet qr-sheet-${layout}`}>
            {sheet.map((card) => (
              <div key={card.url} className="qr-cell">
                {renderCard(card, layout)}
              </div>
            ))}
          </div>
        ))}
      </div>

      <style>{`
        .qr-card { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 2.5mm; text-align: center; color: #000; background: #fff; font-family: Inter, "Noto Sans Arabic", Arial, sans-serif; }
        .qr-card-cards { width: 95mm; height: 138mm; padding: 6mm; }
        .qr-card-poster { width: 190mm; height: 277mm; padding: 14mm; gap: 6mm; }
        .qr-name { font-size: 15pt; font-weight: 600; line-height: 1.3; }
        .qr-card-poster .qr-name { font-size: 30pt; }
        .qr-code { width: 62mm; height: 62mm; }
        .qr-card-poster .qr-code { width: 130mm; height: 130mm; }
        .qr-code svg { width: 100%; height: 100%; display: block; }
        .qr-cta { display: flex; flex-direction: column; font-size: 11pt; line-height: 1.4; }
        .qr-card-poster .qr-cta { font-size: 20pt; }
        .qr-table { font-size: 13pt; font-weight: 700; }
        .qr-card-poster .qr-table { font-size: 24pt; }
        .qr-url { font-size: 9pt; letter-spacing: 0.02em; }
        .qr-card-poster .qr-url { font-size: 14pt; }
        .qr-screen { width: 100%; max-width: 360px; aspect-ratio: 95 / 138; overflow: hidden; border: 1px dashed #b8c2bd; background: #fff; display: flex; justify-content: center; }
        .qr-screen .qr-card { width: 100%; height: 100%; padding: 6%; gap: 2%; }
        .qr-screen .qr-card-poster { aspect-ratio: auto; }
        .qr-screen .qr-code { width: 64%; height: auto; aspect-ratio: 1; }
        .qr-screen .qr-name { font-size: 1.05rem; } .qr-screen .qr-cta, .qr-screen .qr-table { font-size: 0.85rem; } .qr-screen .qr-url { font-size: 0.7rem; }
        .qr-print { display: none; }
        @media print {
          @page { size: A4 portrait; margin: 10mm; }
          body * { visibility: hidden !important; }
          .qr-print, .qr-print * { visibility: visible !important; }
          .qr-print { display: block; position: absolute; inset: 0 auto auto 0; }
          .qr-sheet { width: 190mm; height: 277mm; display: grid; break-after: page; page-break-after: always; }
          .qr-sheet:last-child { break-after: auto; page-break-after: auto; }
          .qr-sheet-cards { grid-template-columns: 95mm 95mm; grid-template-rows: 138.5mm 138.5mm; }
          .qr-sheet-cards .qr-cell { border: 0.2mm dashed #999; display: flex; align-items: center; justify-content: center; }
          .qr-sheet-poster .qr-cell { display: flex; align-items: center; justify-content: center; }
        }
      `}</style>
    </>
  );
}

export default function QrPrintPage() {
  return (
    <CatalogAdminShell>
      <QrPrintContent />
    </CatalogAdminShell>
  );
}
