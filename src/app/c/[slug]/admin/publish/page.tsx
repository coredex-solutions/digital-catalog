"use client";

import { useCallback, useEffect, useState } from "react";
import { CheckCircle2, Eye, History, Loader2, Rocket, RotateCcw } from "lucide-react";
import { CatalogAdminShell, useCatalogAdmin } from "../_components/CatalogAdminShell";
import { CatalogAdminContent, CatalogAdminHeader } from "../_components/CatalogAdminSidebar";

interface Change {
  kind: "added" | "removed" | "changed";
  type: "item" | "category";
  id: string;
  name: string;
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

const FIELD_LABELS: Record<string, string> = {
  name_en: "English name",
  name_ar: "Arabic name",
  description_en: "English description",
  description_ar: "Arabic description",
  price: "price",
  currency: "currency",
  image_url: "photo",
  category_id: "category",
  display_order: "position",
  is_active: "visibility",
  is_featured: "recommended",
  variants: "options",
  dietary: "dietary tags",
  allergens: "allergens",
};

/** "2026-10-10 09:15:00" (UTC, from SQLite) → a Beirut date and time */
function formatWhen(value: string) {
  const date = new Date(value.includes("T") ? value : value.replace(" ", "T") + "Z");
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Beirut", dateStyle: "medium", timeStyle: "short" }).format(date);
}

function describe(change: Change): string {
  const what = change.type === "category" ? "Category" : "Dish";
  const name = change.name || "(no name)";
  if (change.kind === "added") return `${what} added: ${name}`;
  if (change.kind === "removed") return `${what} removed: ${name}`;
  const parts = (change.fields || []).map(({ field, from, to }) => {
    const label = FIELD_LABELS[field] || field;
    if (field === "price") return `price ${Number(from)} → ${Number(to)}`;
    if (field === "is_active") return Number(to) === 1 ? "shown again" : "hidden";
    return `${label} changed`;
  });
  return `${name}: ${parts.join(", ")}`;
}

function PublishPageContent() {
  const { slug, fetchWithAuth, user } = useCatalogAdmin();
  const [status, setStatus] = useState<Status | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState<"publish" | "preview" | string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [confirmRestore, setConfirmRestore] = useState<Version | null>(null);
  const isViewer = user?.role === "viewer";

  const load = useCallback(async () => {
    try {
      const res = await fetchWithAuth(`/api/c/${slug}/admin/publish`);
      if (!res.ok) throw new Error();
      setStatus(await res.json());
      setError(null);
    } catch {
      setError("Could not load the publishing status. Check your connection and reload.");
    } finally {
      setLoading(false);
    }
  }, [slug, fetchWithAuth]);

  useEffect(() => {
    load();
  }, [load]);

  const notifyShell = () => window.dispatchEvent(new Event("menu-draft-changed"));

  const preview = async () => {
    setBusy("preview");
    // Open the tab first (synchronously) so pop-up blockers allow it
    const tab = window.open("about:blank", "_blank");
    try {
      const res = await fetchWithAuth(`/api/c/${slug}/admin/publish/preview-token`);
      const data = await res.json();
      if (!res.ok || !data.url) throw new Error();
      if (tab) tab.location.href = data.url;
      else window.location.href = data.url;
    } catch {
      tab?.close();
      setMessage("Could not open the preview. Please try again.");
    } finally {
      setBusy(null);
    }
  };

  const publish = async () => {
    setBusy("publish");
    setMessage(null);
    try {
      const res = await fetchWithAuth(`/api/c/${slug}/admin/publish`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error);
      setNote("");
      setMessage(`Published. Guests now see version ${data.version}.`);
      notifyShell();
      await load();
    } catch (e) {
      setMessage(e instanceof Error && e.message ? e.message : "Could not publish. Please try again.");
    } finally {
      setBusy(null);
    }
  };

  const restore = async (version: Version) => {
    setConfirmRestore(null);
    setBusy(version.id);
    setMessage(null);
    try {
      const res = await fetchWithAuth(`/api/c/${slug}/admin/publish/restore`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ versionId: version.id }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error);
      setMessage(`Version ${version.version} restored and published as version ${data.version}.`);
      notifyShell();
      await load();
    } catch (e) {
      setMessage(e instanceof Error && e.message ? e.message : "Could not restore this version.");
    } finally {
      setBusy(null);
    }
  };

  return (
    <>
      <CatalogAdminHeader title="Preview & Publish" />
      <CatalogAdminContent>
        <div className="mx-auto max-w-3xl space-y-6">
          {loading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-ui-muted" aria-label="Loading" />
            </div>
          ) : error ? (
            <p role="alert" className="rounded-panel border border-ui-line bg-ui-surface p-5 text-ui-danger">{error}</p>
          ) : status && (
            <>
              {/* Status and actions */}
              <section aria-labelledby="draft-status" className="rounded-panel border border-ui-line bg-ui-surface p-5">
                {!status.everPublished ? (
                  <>
                    <h2 id="draft-status" className="text-lg font-semibold">Your menu is live as you edit</h2>
                    <p className="mt-1 text-ui-muted">
                      This menu was created before drafts existed, so changes appear immediately. Publish once to switch
                      to drafts: after that, guests only see changes when you publish them.
                    </p>
                  </>
                ) : status.hasUnpublishedChanges ? (
                  <>
                    <h2 id="draft-status" className="text-lg font-semibold">
                      {status.changes.length} unpublished {status.changes.length === 1 ? "change" : "changes"}
                    </h2>
                    <p className="mt-1 text-ui-muted">Guests still see version {status.current?.version}. Preview your changes, then publish.</p>
                    <ul className="mt-4 max-h-72 space-y-1.5 overflow-y-auto text-sm">
                      {status.changes.map((change) => (
                        <li key={`${change.type}-${change.kind}-${change.id}`} className="flex gap-2">
                          <span
                            className={`mt-0.5 shrink-0 rounded px-1.5 text-xs font-semibold ${change.kind === "added" ? "bg-ui-subtle text-ui-success" : change.kind === "removed" ? "bg-ui-subtle text-ui-danger" : "bg-ui-subtle text-ui-ink"}`}
                          >
                            {change.kind === "added" ? "New" : change.kind === "removed" ? "Removed" : "Edited"}
                          </span>
                          <span>{describe(change)}</span>
                        </li>
                      ))}
                    </ul>
                  </>
                ) : (
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="mt-0.5 h-6 w-6 shrink-0 text-ui-success" aria-hidden />
                    <div>
                      <h2 id="draft-status" className="text-lg font-semibold">Everything is published</h2>
                      <p className="mt-1 text-ui-muted">
                        Guests see version {status.current?.version}, published {status.current ? formatWhen(status.current.published_at) : ""}.
                      </p>
                    </div>
                  </div>
                )}
                <p className="mt-4 text-xs text-ui-muted">Sold-out switches and the exchange rate change immediately; they don&rsquo;t need publishing.</p>

                <div className="mt-5 space-y-3">
                  <div>
                    <label htmlFor="publish-note" className="mb-1 block text-sm font-semibold">Note (optional)</label>
                    <input
                      id="publish-note"
                      type="text"
                      maxLength={200}
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder="e.g. Summer prices"
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
                      Preview
                    </button>
                    <button
                      type="button"
                      onClick={publish}
                      disabled={busy !== null || isViewer || (status.everPublished && !status.hasUnpublishedChanges)}
                      className="flex min-h-12 flex-1 items-center justify-center gap-2 rounded-control bg-ui-primary px-4 font-semibold text-ui-primary-fg hover:bg-ui-primary-hover disabled:opacity-50"
                    >
                      {busy === "publish" ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Rocket className="h-4 w-4" aria-hidden />}
                      Publish
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
                    History
                  </h2>
                  <ul className="mt-3 divide-y divide-[var(--ui-line)]">
                    {status.versions.map((version) => {
                      const isCurrent = version.version === status.current?.version;
                      return (
                        <li key={version.id} className="flex flex-wrap items-center gap-3 py-3">
                          <div className="min-w-0 flex-1">
                            <p className="font-semibold">
                              Version {version.version}
                              {isCurrent && <span className="ms-2 rounded bg-ui-subtle px-1.5 text-xs font-semibold text-ui-success">Live</span>}
                            </p>
                            <p className="text-sm text-ui-muted">
                              {formatWhen(version.published_at)} · {version.item_count} {version.item_count === 1 ? "dish" : "dishes"}
                              {version.published_by ? ` · ${version.published_by}` : ""}
                            </p>
                            {version.note && <p className="text-sm">{version.note}</p>}
                          </div>
                          {!isCurrent && !isViewer && (
                            <button
                              type="button"
                              onClick={() => setConfirmRestore(version)}
                              disabled={busy !== null}
                              className="flex min-h-11 items-center gap-2 rounded-control border border-ui-input px-3 text-sm font-semibold hover:bg-ui-subtle disabled:opacity-50"
                            >
                              {busy === version.id ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <RotateCcw className="h-4 w-4" aria-hidden />}
                              Restore
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
              <h2 id="restore-title" className="text-lg font-semibold">Restore version {confirmRestore.version}?</h2>
              <p id="restore-desc" className="mt-2 text-ui-muted">
                Your dishes and categories go back to how they were in version {confirmRestore.version}, and guests see it
                right away. Unpublished changes are replaced. Today&rsquo;s sold-out switches are kept. You can restore
                the current version again later from History.
              </p>
              <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                <button type="button" autoFocus onClick={() => setConfirmRestore(null)} className="min-h-12 flex-1 rounded-control border border-ui-input px-4 font-semibold hover:bg-ui-subtle">
                  Cancel
                </button>
                <button type="button" onClick={() => restore(confirmRestore)} className="min-h-12 flex-1 rounded-control bg-ui-primary px-4 font-semibold text-ui-primary-fg hover:bg-ui-primary-hover">
                  Restore
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
