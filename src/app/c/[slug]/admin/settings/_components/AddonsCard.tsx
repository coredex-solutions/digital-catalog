"use client";

import { useState } from "react";
import { Check, Loader2 } from "lucide-react";
import { ADDON_LABELS, type AddonId } from "@/lib/modules/registry";
import { useCatalogAdmin } from "../../_components/CatalogAdminShell";
import { useAdminLang, useCopy } from "../../_lib/i18n";
import { useModule } from "../../_lib/module";

const en = {
  title: "Add-ons",
  body: (module: string) => `Extra features for your ${module} page. Switch on only what you use.`,
  save: "Save add-ons",
  saved: "Add-ons saved",
  failed: "Couldn't save the add-ons. Please try again.",
};
const ar: typeof en = {
  title: "الإضافات",
  body: (module) => `ميزات إضافية لصفحة ${module}. فعّل ما تستخدمه فقط.`,
  save: "حفظ الإضافات",
  saved: "حُفظت الإضافات",
  failed: "تعذّر حفظ الإضافات. حاول مرة أخرى.",
};

/** The add-ons the catalog's module allows, each with an on/off switch */
export function AddonsCard() {
  const { slug, fetchWithAuth, updateCatalog, user } = useCatalogAdmin();
  const { module, addons } = useModule();
  const lang = useAdminLang();
  const t = useCopy({ en, ar });
  const [selected, setSelected] = useState<AddonId[]>(addons);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<"saved" | "failed" | null>(null);
  const readOnly = user?.role === "viewer";

  const changed = selected.length !== addons.length || selected.some((id) => !addons.includes(id));

  const save = async () => {
    setSaving(true);
    setStatus(null);
    try {
      const res = await fetchWithAuth(`/api/c/${slug}/admin/addons/`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ addons: selected }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      updateCatalog({ addons: data.addons });
      setSelected(data.addons);
      setStatus("saved");
    } catch {
      setStatus("failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="glass-card p-5 sm:p-8 lg:p-10">
      <h3 className="text-lg font-bold text-ui-heading">{t.title}</h3>
      <p className="mt-1 text-sm text-ui-muted">{t.body(module.label[lang])}</p>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {module.allowedAddons.map((id) => {
          const on = selected.includes(id);
          return (
            <label
              key={id}
              className={`flex min-h-16 cursor-pointer items-start gap-3 rounded-panel border p-4 transition-colors ${on ? "border-ui-primary bg-ui-subtle" : "border-ui-line bg-ui-surface hover:bg-ui-bg"}`}
            >
              <input
                type="checkbox"
                checked={on}
                disabled={readOnly}
                onChange={(e) => setSelected((prev) => (e.target.checked ? [...prev, id] : prev.filter((x) => x !== id)))}
                className="mt-0.5 h-5 w-5 shrink-0"
              />
              <span>
                <span className="block text-sm font-semibold text-ui-ink">{ADDON_LABELS[id].label[lang]}</span>
                <span className="mt-0.5 block text-xs text-ui-muted">{ADDON_LABELS[id].hint[lang]}</span>
              </span>
            </label>
          );
        })}
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={save}
          disabled={saving || !changed || readOnly}
          className="inline-flex min-h-11 items-center gap-2 rounded-control bg-ui-primary px-5 text-sm font-semibold text-ui-primary-fg hover:bg-ui-primary-hover disabled:opacity-50"
        >
          {saving && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
          {t.save}
        </button>
        {status === "saved" && !changed && (
          <span role="status" className="inline-flex items-center gap-1.5 text-sm font-semibold text-ui-success">
            <Check className="h-4 w-4" aria-hidden />
            {t.saved}
          </span>
        )}
        {status === "failed" && (
          <span role="alert" className="text-sm font-semibold text-ui-danger">
            {t.failed}
          </span>
        )}
      </div>
    </div>
  );
}
