"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { CheckCircle2, Eye, History, Loader2, Rocket, RotateCcw } from "lucide-react";
import { CatalogAdminShell, useCatalogAdmin } from "../_components/CatalogAdminShell";
import { CatalogAdminContent, CatalogAdminHeader } from "../_components/CatalogAdminSidebar";
import { ADMIN_NAV_LABELS } from "../_components/adminNav";
import { useAdminLang, useCopy, useFormat, plural, formatNumber, pickName, type AdminLang } from "../_lib/i18n";

interface Change {
  kind: "added" | "removed" | "changed";
  type: "item" | "category";
  id: string;
  name: string;
  name_en?: string;
  name_ar?: string;
  fields?: { field: string; from: unknown; to: unknown }[];
}

interface Version {
  id: string;
  version: number;
  note: string | null;
  published_by: string | null;
  published_at: string;
  item_count: number;
}

interface Status {
  everPublished: boolean;
  hasUnpublishedChanges: boolean;
  changes: Change[];
  current: { version: number; published_at: string } | null;
  versions: Version[];
}

const en = {
  loading: "Loading…",
  loadError: "Could not load the publishing status. Check your connection and reload.",
  previewError: "Could not open the preview. Please try again.",
  published: (v: number) => `Published. Guests now see version ${v}.`,
  publishError: "Could not publish. Please try again.",
  restored: (from: number, to: number) => `Version ${from} restored and published as version ${to}.`,
  restoreError: "Could not restore this version.",
  liveTitle: "Your menu is live as you edit",
  liveBody:
    "This menu was created before drafts existed, so changes appear immediately. Publish once to switch to drafts: after that, guests only see changes when you publish them.",
  unpublished: (n: number, lang: AdminLang) => plural(lang, n, { one: "# unpublished change", other: "# unpublished changes" }),
  guestsStillSee: (v: number | string) => `Guests still see version ${v}. Preview your changes, then publish.`,
  badge: { added: "New", removed: "Removed", changed: "Edited" } as Record<Change["kind"], string>,
  allPublished: "Everything is published",
  guestsSee: (v: number | string, when: string) => `Guests see version ${v}, published ${when}.`,
  instantNote: "Sold-out switches and the exchange rate change immediately; they don’t need publishing.",
  noteLabel: "Note (optional)",
  notePlaceholder: "e.g. Summer prices",
  preview: "Preview",
  newTab: "(opens in a new tab)",
  publish: "Publish",
  history: "History",
  version: (v: number) => `Version ${v}`,
  // Note the server writes when a version is restored (publishing.ts: "Restored version N")
  restoredNote: (v: string) => `Restored version ${v}`,
  live: "Live",
  dishes: (n: number, lang: AdminLang) => plural(lang, n, { one: "# dish", other: "# dishes" }),
  restore: "Restore",
  restoreTitle: (v: number) => `Restore version ${v}?`,
  restoreBody: (v: number) =>
    `Your dishes and categories go back to how they were in version ${v}, and guests see it right away. Unpublished changes are replaced. Today’s sold-out switches are kept. You can restore the current version again later from History.`,
  cancel: "Cancel",

  // The change list
  noName: "(no name)",
  added: (type: Change["type"], name: ReactNode): ReactNode => <>{type === "category" ? "Category" : "Dish"} added: {name}</>,
  removed: (type: Change["type"], name: ReactNode): ReactNode => <>{type === "category" ? "Category" : "Dish"} removed: {name}</>,
  changed: (name: ReactNode, parts: string[]): ReactNode => <>{name}: {parts.join(", ")}</>,
  price: (from: string, to: string) => `price ${from} → ${to}`,
  shownAgain: "shown again",
  hidden: "hidden",
  recommended: "marked as recommended",
  notRecommended: "no longer recommended",
  movedCategory: "moved to another category",
  fieldChanged: (field: string) => `${field} changed`,
  fields: {
    name_en: "English name",
    name_ar: "Arabic name",
    description_en: "English description",
    description_ar: "Arabic description",
    currency: "currency",
    image_url: "photo",
    display_order: "position",
    variants: "options",
    dietary: "dietary tags",
    allergens: "allergens",
  } as Record<string, string>,
};
const ar: typeof en = {
  loading: "جارٍ التحميل…",
  loadError: "تعذّر تحميل حالة النشر. تحقّق من اتصالك ثم أعد تحميل الصفحة.",
  previewError: "تعذّر فتح المعاينة. حاول مرة أخرى.",
  published: (v) => `تم النشر. يرى الزبائن الآن النسخة ${v}.`,
  publishError: "تعذّر النشر. حاول مرة أخرى.",
  restored: (from, to) => `تمت استعادة النسخة ${from} ونشرها كنسخة ${to}.`,
  restoreError: "تعذّرت استعادة هذه النسخة.",
  liveTitle: "تظهر تعديلاتك للزبائن مباشرةً",
  liveBody:
    "أُنشئت هذه القائمة قبل إضافة المسودات، لذلك تظهر التعديلات فوراً. انشر مرة واحدة للانتقال إلى المسودات: بعدها لا يرى الزبائن التعديلات إلا عندما تنشرها.",
  unpublished: (n, lang) =>
    plural(lang, n, {
      one: "تعديل واحد غير منشور",
      two: "تعديلان غير منشورين",
      few: "# تعديلات غير منشورة",
      many: "# تعديلاً غير منشور",
      other: "# تعديل غير منشور",
    }),
  guestsStillSee: (v) => `لا يزال الزبائن يرون النسخة ${v}. عاين تعديلاتك ثم انشرها.`,
  badge: { added: "جديد", removed: "محذوف", changed: "معدّل" },
  allPublished: "كل التعديلات منشورة",
  guestsSee: (v, when) => `يرى الزبائن النسخة ${v}، المنشورة في ${when}.`,
  instantNote: "حالة «نفدت الكمية» وسعر الصرف يتغيّران فوراً، ولا يحتاجان إلى نشر.",
  noteLabel: "ملاحظة (اختياري)",
  notePlaceholder: "مثلاً: أسعار الصيف",
  preview: "معاينة",
  newTab: "(تُفتح في نافذة جديدة)",
  publish: "نشر",
  history: "سجل النسخ",
  version: (v) => `النسخة ${v}`,
  restoredNote: (v) => `استعادة النسخة ${v}`,
  live: "الحالية",
  dishes: (n, lang) =>
    plural(lang, n, { zero: "لا أطباق", one: "طبق واحد", two: "طبقان", few: "# أطباق", many: "# طبقاً", other: "# طبق" }),
  restore: "استعادة",
  restoreTitle: (v) => `استعادة النسخة ${v}؟`,
  restoreBody: (v) =>
    `تعود أطباقك وأقسامك إلى ما كانت عليه في النسخة ${v}، ويراها الزبائن فوراً. تُستبدل التعديلات غير المنشورة، وتبقى حالات «نفدت الكمية» لليوم كما هي. يمكنك لاحقاً استعادة النسخة الحالية من سجل النسخ.`,
  cancel: "إلغاء",

  noName: "(بلا اسم)",
  added: (type, name) => <>{type === "category" ? "أُضيف قسم" : "أُضيف طبق"}: {name}</>,
  removed: (type, name) => <>{type === "category" ? "حُذف قسم" : "حُذف طبق"}: {name}</>,
  changed: (name, parts) => <>{name}: {parts.join("، ")}</>,
  price: (from, to) => `السعر من ${from} إلى ${to}`,
  shownAgain: "عاد ظاهراً للزبائن",
  hidden: "أصبح مخفياً",
  recommended: "أُضيفت علامة «ننصح به»",
  notRecommended: "أُزيلت علامة «ننصح به»",
  movedCategory: "نُقل إلى قسم آخر",
  fieldChanged: (field) => `تعديل ${field}`,
  fields: {
    name_en: "الاسم بالإنجليزية",
    name_ar: "الاسم بالعربية",
    description_en: "الوصف بالإنجليزية",
    description_ar: "الوصف بالعربية",
    currency: "العملة",
    image_url: "الصورة",
    display_order: "الترتيب",
    variants: "الخيارات",
    dietary: "الوسوم الغذائية",
    allergens: "مسببات الحساسية",
  },
};

type Copy = typeof en;

/** One line of the change list, e.g. "Hummus: price 4 → 5, photo changed" */
function describe(change: Change, t: Copy, lang: AdminLang): ReactNode {
  const name = <bdi>{pickName(change, lang) || change.name || t.noName}</bdi>;
  if (change.kind === "added") return t.added(change.type, name);
  if (change.kind === "removed") return t.removed(change.type, name);
  const parts = (change.fields || []).map(({ field, from, to }) => {
    if (field === "price") return t.price(formatNumber(Number(from), lang), formatNumber(Number(to), lang));
    if (field === "is_active") return Number(to) === 1 ? t.shownAgain : t.hidden;
    if (field === "is_featured") return Number(to) === 1 ? t.recommended : t.notRecommended;
    if (field === "category_id") return t.movedCategory;
    return t.fieldChanged(t.fields[field] || field);
  });
  return t.changed(name, parts);
}

/** "2026-10-10 09:15:00" (UTC, from SQLite) → a Date */
function parseWhen(value: string) {
  return new Date(value.includes("T") ? value : value.replace(" ", "T") + "Z");
}

function PublishPageContent() {
  const { slug, fetchWithAuth, user } = useCatalogAdmin();
  const lang = useAdminLang();
  const t = useCopy({ en, ar });
  const f = useFormat();
  const [status, setStatus] = useState<Status | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState<"publish" | "preview" | string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [confirmRestore, setConfirmRestore] = useState<Version | null>(null);
  const isViewer = user?.role === "viewer";

  /** A Beirut date and time, or the raw value if it can't be read */
  const formatWhen = (value: string) => f.dateTime(parseWhen(value)) || value;

  const loadError = t.loadError;
  // State is only set in the promise callbacks, once the request has answered
  const load = useCallback(
    () =>
      fetchWithAuth(`/api/c/${slug}/admin/publish/`)
        .then(async (res) => {
          if (!res.ok) throw new Error();
          setStatus(await res.json());
          setError(null);
        })
        .catch(() => setError(loadError))
        .finally(() => setLoading(false)),
    [slug, fetchWithAuth, loadError]
  );

  useEffect(() => {
    load();
  }, [load]);

  const notifyShell = () => window.dispatchEvent(new Event("menu-draft-changed"));

  const preview = async () => {
    setBusy("preview");
    // Open the tab first (synchronously) so pop-up blockers allow it
    const tab = window.open("about:blank", "_blank");
    try {
      const res = await fetchWithAuth(`/api/c/${slug}/admin/publish/preview-token/`);
      const data = await res.json();
      if (!res.ok || !data.url) throw new Error();
      if (tab) tab.location.href = data.url;
      else window.location.href = data.url;
    } catch {
      tab?.close();
      setMessage(t.previewError);
    } finally {
      setBusy(null);
    }
  };

  const publish = async () => {
    setBusy("publish");
    setMessage(null);
    try {
      const res = await fetchWithAuth(`/api/c/${slug}/admin/publish/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error);
      setNote("");
      setMessage(t.published(data.version));
      notifyShell();
      await load();
    } catch (e) {
      setMessage(e instanceof Error && e.message ? e.message : t.publishError);
    } finally {
      setBusy(null);
    }
  };

  const restore = async (version: Version) => {
    setConfirmRestore(null);
    setBusy(version.id);
    setMessage(null);
    try {
      const res = await fetchWithAuth(`/api/c/${slug}/admin/publish/restore/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ versionId: version.id }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error);
      setMessage(t.restored(version.version, data.version));
      notifyShell();
      await load();
    } catch (e) {
      setMessage(e instanceof Error && e.message ? e.message : t.restoreError);
    } finally {
      setBusy(null);
    }
  };

  return (
    <>
      <CatalogAdminHeader title={ADMIN_NAV_LABELS[lang].publish} />
      <CatalogAdminContent>
        <div className="mx-auto max-w-3xl space-y-6">
          {loading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-ui-muted" aria-label={t.loading} />
            </div>
          ) : error ? (
            <p role="alert" className="rounded-panel border border-ui-line bg-ui-surface p-5 text-ui-danger">{error}</p>
          ) : status && (
            <>
              {/* Status and actions */}
              <section aria-labelledby="draft-status" className="rounded-panel border border-ui-line bg-ui-surface p-5">
                {!status.everPublished ? (
                  <>
                    <h2 id="draft-status" className="text-lg font-semibold">{t.liveTitle}</h2>
                    <p className="mt-1 text-ui-muted">{t.liveBody}</p>
                  </>
                ) : status.hasUnpublishedChanges ? (
                  <>
                    <h2 id="draft-status" className="text-lg font-semibold">
                      {t.unpublished(status.changes.length, lang)}
                    </h2>
                    <p className="mt-1 text-ui-muted">{t.guestsStillSee(status.current?.version ?? "–")}</p>
                    <ul className="mt-4 max-h-72 space-y-1.5 overflow-y-auto text-sm">
                      {status.changes.map((change) => (
                        <li key={`${change.type}-${change.kind}-${change.id}`} className="flex gap-2">
                          <span
                            className={`mt-0.5 shrink-0 rounded px-1.5 text-xs font-semibold ${change.kind === "added" ? "bg-ui-subtle text-ui-success" : change.kind === "removed" ? "bg-ui-subtle text-ui-danger" : "bg-ui-subtle text-ui-ink"}`}
                          >
                            {t.badge[change.kind]}
                          </span>
                          <span>{describe(change, t, lang)}</span>
                        </li>
                      ))}
                    </ul>
                  </>
                ) : (
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="mt-0.5 h-6 w-6 shrink-0 text-ui-success" aria-hidden />
                    <div>
                      <h2 id="draft-status" className="text-lg font-semibold">{t.allPublished}</h2>
                      <p className="mt-1 text-ui-muted">
                        {t.guestsSee(status.current?.version ?? "–", status.current ? formatWhen(status.current.published_at) : "")}
                      </p>
                    </div>
                  </div>
                )}
                <p className="mt-4 text-xs text-ui-muted">{t.instantNote}</p>

                <div className="mt-5 space-y-3">
                  <div>
                    <label htmlFor="publish-note" className="mb-1 block text-sm font-semibold">{t.noteLabel}</label>
                    <input
                      id="publish-note"
                      type="text"
                      dir="auto"
                      maxLength={200}
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder={t.notePlaceholder}
                      className="min-h-11 w-full rounded-control border border-ui-input bg-ui-bg px-3"
                    />
                  </div>
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <button
                      type="button"
                      onClick={preview}
                      disabled={busy !== null}
                      className="flex min-h-12 flex-1 items-center justify-center gap-2 rounded-control border border-ui-input bg-ui-surface px-4 font-semibold hover:bg-ui-subtle disabled:opacity-50"
                    >
                      {busy === "preview" ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Eye className="h-4 w-4" aria-hidden />}
                      {t.preview}
                      <span className="sr-only">{t.newTab}</span>
                    </button>
                    <button
                      type="button"
                      onClick={publish}
                      disabled={busy !== null || isViewer || (status.everPublished && !status.hasUnpublishedChanges)}
                      className="flex min-h-12 flex-1 items-center justify-center gap-2 rounded-control bg-ui-primary px-4 font-semibold text-ui-primary-fg hover:bg-ui-primary-hover disabled:opacity-50"
                    >
                      {busy === "publish" ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Rocket className="h-4 w-4" aria-hidden />}
                      {t.publish}
                    </button>
                  </div>
                  {message && <p role="status" className="text-sm font-medium">{message}</p>}
                </div>
              </section>

              {/* History */}
              {status.versions.length > 0 && (
                <section aria-labelledby="history" className="rounded-panel border border-ui-line bg-ui-surface p-5">
                  <h2 id="history" className="flex items-center gap-2 text-lg font-semibold">
                    <History className="h-5 w-5" aria-hidden />
                    {t.history}
                  </h2>
                  <ul className="mt-3 divide-y divide-[var(--ui-line)]">
                    {status.versions.map((version) => {
                      const isCurrent = version.version === status.current?.version;
                      return (
                        <li key={version.id} className="flex flex-wrap items-center gap-3 py-3">
                          <div className="min-w-0 flex-1">
                            <p className="font-semibold">
                              {t.version(version.version)}
                              {isCurrent && <span className="ms-2 rounded bg-ui-subtle px-1.5 text-xs font-semibold text-ui-success">{t.live}</span>}
                            </p>
                            <p className="text-sm text-ui-muted">
                              {formatWhen(version.published_at)} · {t.dishes(version.item_count, lang)}
                              {version.published_by ? <> · <bdi>{version.published_by}</bdi></> : null}
                            </p>
                            {version.note && (
                              <p className="text-sm" dir="auto">
                                {version.note.replace(/^Restored version (\d+)$/, (_, n) => t.restoredNote(n))}
                              </p>
                            )}
                          </div>
                          {!isCurrent && !isViewer && (
                            <button
                              type="button"
                              onClick={() => setConfirmRestore(version)}
                              disabled={busy !== null}
                              className="flex min-h-11 items-center gap-2 rounded-control border border-ui-input px-3 text-sm font-semibold hover:bg-ui-subtle disabled:opacity-50"
                            >
                              {busy === version.id ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <RotateCcw className="h-4 w-4" aria-hidden />}
                              {t.restore}
                            </button>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </section>
              )}
            </>
          )}
        </div>

        {/* Restore confirmation */}
        {confirmRestore && (
          <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center" onClick={() => setConfirmRestore(null)}>
            <div
              role="alertdialog"
              aria-modal="true"
              aria-labelledby="restore-title"
              aria-describedby="restore-desc"
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md rounded-panel bg-ui-surface p-5"
            >
              <h2 id="restore-title" className="text-lg font-semibold">{t.restoreTitle(confirmRestore.version)}</h2>
              <p id="restore-desc" className="mt-2 text-ui-muted">{t.restoreBody(confirmRestore.version)}</p>
              <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                <button type="button" autoFocus onClick={() => setConfirmRestore(null)} className="min-h-12 flex-1 rounded-control border border-ui-input px-4 font-semibold hover:bg-ui-subtle">
                  {t.cancel}
                </button>
                <button type="button" onClick={() => restore(confirmRestore)} className="min-h-12 flex-1 rounded-control bg-ui-primary px-4 font-semibold text-ui-primary-fg hover:bg-ui-primary-hover">
                  {t.restore}
                </button>
              </div>
            </div>
          </div>
        )}
      </CatalogAdminContent>
    </>
  );
}

export default function PublishPage() {
  return (
    <CatalogAdminShell>
      <PublishPageContent />
    </CatalogAdminShell>
  );
}
