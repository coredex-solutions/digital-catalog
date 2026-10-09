"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import { CatalogAdminShell, useCatalogAdmin } from "../_components/CatalogAdminShell";
import {
  CatalogAdminHeader,
  CatalogAdminContent,
} from "../_components/CatalogAdminSidebar";
import {
  Save,
  Loader2,
  Palette,
  Phone,
  MapPin,
  Upload,
  X,
  ToggleRight,
  Bot as BotIcon,
  Sparkles as SparklesIcon,
  Brain,
  Moon,
  Sun,
  Smartphone,
  Layout,
  ChevronRight,
  Globe,
  Banknote,
} from "lucide-react";
import {
  compressImage,
  formatBytes,
  isImageFile,
} from "@/utils/image-compression";
import { cn } from "@/utils/helpers";
import { MenuBrandPreview, type PreviewLang } from "../_components/MenuBrandPreview";
import { buildMenuTheme } from "../../_lib/theme";

interface Settings {
  catalog: {
    name: string;
    name_ar: string;
    name_en: string;
    description: string;
    description_ar: string;
    description_en: string;
    logo_url: string;
  };
  // The menu only reads the brand colour and cover from appearance
  appearance: {
    hero_image_url: string;
    color_primary: string;
  };
  features: {
    booking_enabled: boolean;
    whatsapp_order_enabled: boolean;
    ai_waiter_enabled: boolean;
    ai_waiter_name: string;
    ai_waiter_persona: string;
  };
  // Only the menu button label is shown to guests (on the About page)
  cta: {
    cta_menu_label_en: string;
    cta_menu_label_ar: string;
  };
  contact: {
    phone_primary: string;
    phone_whatsapp: string;
    email: string;
    address_en: string;
    address_ar: string;
    city_en: string;
    city_ar: string;
    google_map_iframe_url: string;
  };
  subscription?: {
    ai_image_enhancement_limit: number;
  };
  feature_config?: {
    enabled_languages: string;
    default_language: string;
  };
  pricing: {
    currency_primary: "USD" | "LBP";
    lbp_exchange_rate: number | string | null;
    lbp_rate_updated_at?: string | null;
    show_dual_currency: boolean;
  };
  ordering: {
    order_types: string;
    delivery_note_ar: string;
    delivery_note_en: string;
  };
}

const ORDER_TYPE_OPTIONS = [
  { id: "dine_in", label: "Dine-in", hint: "Guests order from their table (they're asked for the table number)" },
  { id: "takeaway", label: "Takeaway", hint: "Guests pick up their order" },
  { id: "delivery", label: "Delivery", hint: "Guests enter an address and area" },
];

function SettingsPageContent() {
  const { slug, user, fetchWithAuth } = useCatalogAdmin();
  const isViewer = user?.role === 'viewer';

  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "appearance" | "contact" | "pricing" | "features" | "ai"
  >("appearance");
  const [previewMode, setPreviewMode] = useState<"light" | "dark">("light");
  const [previewLang, setPreviewLang] = useState<PreviewLang>("en");
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [savingSection, setSavingSection] = useState<string | null>(null);

  const fetchSettings = async () => {
    const token = localStorage.getItem(`catalog_admin_token_${slug}`);
    if (!token) return;

    try {
      const res = await fetchWithAuth(`/api/c/${slug}/admin/settings`);

      if (res.ok) {
        const data = await res.json();
        setSettings(data);
      }
    } catch (error) {
      console.error("Failed to fetch settings:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, [slug]);

  const handleSaveSection = async (sectionName: string, dataToSave: any = settings) => {
    if (!settings) return;
    setSavingSection(sectionName);
    setMessage(null);

    try {
      const res = await fetchWithAuth(`/api/c/${slug}/admin/settings`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(dataToSave),
      });

      if (res.ok) {
        setMessage({ type: "success", text: `${sectionName} saved successfully!` });
        setTimeout(() => setMessage(null), 3000);
      } else {
        const err = await res.json();
        throw new Error(err.error || `Failed to save ${sectionName}`);
      }
    } catch (error: any) {
      setMessage({ type: "error", text: error.message });
    } finally {
      setSavingSection(null);
    }
  };

  const [uploadProgress, setUploadProgress] = useState<string | null>(null);

  const updateSettings = (
    section: keyof Settings,
    field: string,
    value: any
  ) => {
    if (!settings) return;
    setSettings({
      ...settings,
      [section]: { ...settings[section], [field]: value },
    });
  };

  const handleImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement> | File,
    section: keyof Settings,
    field: string
  ) => {
    const file = e instanceof File ? e : e.target.files?.[0];
    if (!file) return;

    if (!isImageFile(file)) {
      setMessage({ type: "error", text: "Invalid file: Image required" });
      return;
    }

    setUploadProgress(`Uploading ${field.replace('_url', '').replace('_', ' ')}...`);

    try {
      const result = await compressImage(file, {
        maxSizeMB: 2,
        maxWidthOrHeight: 2048,
        quality: 0.85,
      });

      const token = localStorage.getItem(`catalog_admin_token_${slug}`);
      const formData = new FormData();
      formData.append("file", result.file);

      const res = await fetch(`/api/c/${slug}/admin/upload`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        updateSettings(section, field, data.url);
        setUploadProgress(null);
        setMessage({ type: "success", text: "Image uploaded successfully" });
      } else {
        throw new Error("Upload Failed");
      }
    } catch (error) {
      setMessage({ type: "error", text: "Upload Error" });
      setUploadProgress(null);
    }
  };

  const ColorInput = ({
    id,
    label,
    value,
    onChange,
  }: {
    id: string;
    label: string;
    value: string;
    onChange: (v: string) => void;
  }) => (
    <div className="space-y-2">
      <label htmlFor={`${id}-hex`} className="text-xs font-semibold text-ui-muted ml-2">
        {label}
      </label>
      <div className="relative group">
        <div className="relative flex items-center gap-3 p-2 bg-ui-bg border border-ui-line rounded-control">
          <input
            id={`${id}-picker`}
            type="color"
            aria-label={`${label} picker`}
            value={value || "#000000"}
            onChange={(e) => onChange(e.target.value)}
            className="w-12 h-12 rounded-xl cursor-pointer border-0 bg-transparent ring-1 ring-ui-line"
          />
          <input
            id={`${id}-hex`}
            type="text"
            value={value || ""}
            onChange={(e) => onChange(e.target.value)}
            className="flex-1 min-h-11 bg-transparent border-0 text-ui-ink font-mono text-xs focus:ring-0"
            placeholder="#000000"
          />
        </div>
      </div>
    </div>
  );

  const ProImageUpload = ({
    label,
    url,
    onUpload,
    onRemove,
    hint
  }: {
    label: string,
    url?: string,
    onUpload: (e: React.ChangeEvent<HTMLInputElement> | File) => void,
    onRemove: () => void,
    aspect?: "square" | "video",
    hint?: string
  }) => {
    const [dragging, setDragging] = useState(false);

    return (
      <div className="glass-card p-5 sm:p-8 lg:p-10 flex flex-col h-full bg-ui-bg border border-ui-line rounded-panel transition-all duration-500 hover:bg-ui-subtle group/card">
        <div className="flex items-center justify-between mb-8">
          <h3 className="text-xs font-semibold text-ui-ink opacity-50">{label}</h3>
          {hint && <span className="text-xs font-semibold text-ui-muted">{hint}</span>}
        </div>

        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => { e.preventDefault(); setDragging(false); if (e.dataTransfer.files[0]) onUpload(e.dataTransfer.files[0]); }}
          className={cn(
            "relative flex-1 min-h-[200px] rounded-panel overflow-hidden border-2 border-dashed transition-all duration-500",
            dragging ? "border-ui-primary bg-ui-subtle scale-[1.02]" : url ? "border-ui-line" : "border-ui-line bg-ui-bg hover:border-ui-input hover:bg-ui-subtle"
          )}
        >
          {url ? (
            <div className="relative w-full h-full group">
              <Image src={url} alt={label} fill className="object-cover transition-transform duration-700" />
              <div className="absolute inset-0 flex items-end justify-end gap-2 p-3 transition-opacity lg:items-center lg:justify-center lg:gap-4 lg:bg-black/40 lg:opacity-0 lg:group-hover:opacity-100 lg:group-focus-within:opacity-100">
                <label className="w-11 h-11 lg:w-14 lg:h-14 bg-ui-primary text-ui-primary-fg rounded-control flex items-center justify-center cursor-pointer active:scale-95 transition-all shadow-xl focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-ui-primary">
                  <Upload className="w-5 h-5 lg:w-6 lg:h-6" aria-hidden />
                  <span className="sr-only">Replace {label}</span>
                  <input type="file" accept="image/*" onChange={onUpload} className="sr-only" />
                </label>
                <button
                  type="button"
                  onClick={onRemove}
                  aria-label={`Remove ${label}`}
                  className="w-11 h-11 lg:w-14 lg:h-14 bg-ui-surface text-ui-danger border border-ui-line rounded-control flex items-center justify-center active:scale-95 transition-all shadow-xl"
                >
                  <X className="w-5 h-5 lg:w-6 lg:h-6" aria-hidden />
                </button>
              </div>
            </div>
          ) : (
            <label className="absolute inset-0 flex flex-col items-center justify-center cursor-pointer group/label">
              <div className="w-16 h-16 bg-ui-bg border border-ui-line rounded-panel flex items-center justify-center mb-4 group-hover/label:scale-110 group-hover/label:bg-primary/20 group-hover/label:border-primary/30 transition-all duration-500">
                <Upload className="w-6 h-6 text-ui-muted group-hover/label:text-primary" />
              </div>
              <p className="text-xs font-semibold text-ui-muted group-hover/label:text-white/40 transition-colors">Click or Drag Image</p>
              <input type="file" accept="image/*" onChange={onUpload} className="hidden" />
            </label>
          )}

          {uploadProgress && uploadProgress.toLowerCase().includes(label.toLowerCase().split(' ')[0]) && (
            <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center z-50 animate-in fade-in">
              <Loader2 className="w-10 h-10 text-ui-primary animate-spin mb-4" />
              <p className="text-xs font-semibold text-ui-ink">{uploadProgress}</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  const ToggleSwitch = ({
    label,
    description,
    checked,
    onChange,
  }: {
    label: string;
    description?: string;
    checked: boolean;
    onChange: (v: boolean) => void;
  }) => (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      className="w-full flex items-center justify-between gap-4 p-6 text-start bg-ui-bg border border-ui-line rounded-panel cursor-pointer hover:bg-ui-subtle transition-all group"
      onClick={() => onChange(!checked)}
    >
      <span>
        <span className="block text-xs font-semibold text-ui-ink">{label}</span>
        {description && <span className="block text-xs font-semibold text-ui-muted mt-1">{description}</span>}
      </span>
      <span aria-hidden className={`shrink-0 w-14 h-8 rounded-full transition-all duration-500 relative flex items-center p-1 ${checked ? 'bg-ui-primary' : 'bg-ui-subtle'}`}>
        <span className={`w-6 h-6 rounded-full bg-white shadow-lg transition-all duration-500 ${checked ? 'translate-x-6' : 'translate-x-0'}`} />
      </span>
    </button>
  );

  return (
    <>
      <CatalogAdminHeader title="Settings" />

      <CatalogAdminContent>
        {message && (
          <div
            className={`mb-8 px-6 py-4 rounded-control text-xs font-semibold border animate-in slide-in-from-top-4 duration-500 ${message.type === "success"
              ? "bg-ui-subtle text-ui-primary border-ui-line"
              : "bg-ui-subtle text-ui-primary border-ui-line"
              }`}
          >
            {message.text}
          </div>
        )}

        {loading ? (
          <div className="space-y-8">
            <div className="h-12 bg-ui-subtle rounded-control w-1/3" />
            <div className="h-96 glass rounded-panel" />
          </div>
        ) : settings ? (
          <div className="space-y-10">
            {/* Context Selectors (Tabs) */}
            <div className="-mx-4 px-4 sm:mx-0 sm:px-0 overflow-x-auto scrollbar-hide">
            <div role="group" aria-label="Settings sections" className="flex gap-2 p-1.5 bg-ui-surface border border-ui-line rounded-panel w-max">
              {[
                { id: "appearance", label: "Branding", icon: Palette },
                { id: "contact", label: "Contact", icon: Phone },
                { id: "pricing", label: "Pricing & orders", icon: Banknote },
                { id: "features", label: "Features", icon: ToggleRight },
                { id: "ai", label: "AI Waiter", icon: Brain },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  aria-pressed={activeTab === tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex shrink-0 items-center gap-2 min-h-11 px-4 sm:px-5 rounded-control text-sm whitespace-nowrap transition-colors ${activeTab === tab.id
                    ? "bg-ui-primary text-ui-primary-fg font-semibold"
                    : "text-ui-muted font-medium hover:text-ui-ink hover:bg-ui-subtle"
                    }`}
                >
                  <tab.icon className="w-4 h-4" aria-hidden />
                  {tab.label}
                </button>
              ))}
            </div>
            </div>

            {/* Matrix Layers */}
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
              {/* Appearance Array */}
              {activeTab === "appearance" && (
                <div className="grid lg:grid-cols-12 gap-8 lg:gap-12 items-start">
                  <div className="lg:col-span-8 space-y-8">
                    {/* Identity Section */}
                    <div className="glass-card p-5 sm:p-8 lg:p-10">
                      <div className="flex items-center gap-3 mb-8">
                        <div className="w-8 h-8 rounded-lg bg-ui-subtle flex items-center justify-center">
                          <Layout className="w-4 h-4 text-ui-primary" />
                        </div>
                        <h3 className="text-xs font-semibold text-ui-ink opacity-50">Business Identity</h3>
                      </div>

                      <div className="grid md:grid-cols-2 gap-8">
                        {/* English Name */}
                        <div className="space-y-4">
                          <label htmlFor="business-name-en" className="text-xs font-semibold text-ui-muted ml-2">Business Name (English)</label>
                          <input
                            id="business-name-en"
                            type="text"
                            value={settings.catalog.name_en || settings.catalog.name || ""}
                            onChange={(e) => updateSettings("catalog", "name_en", e.target.value)}
                            className="w-full px-6 py-4 bg-ui-bg border border-ui-input rounded-control text-ui-ink font-bold text-sm focus:outline-none focus:border-ui-primary"
                            placeholder="e.g. Sofra"
                          />
                        </div>
                        {/* Arabic Name */}
                        <div className="space-y-4">
                          <label htmlFor="business-name-ar" className="text-xs font-semibold text-ui-muted ml-2">Business Name (Arabic)</label>
                          <input
                            id="business-name-ar"
                            type="text"
                            value={settings.catalog.name_ar || ""}
                            onChange={(e) => updateSettings("catalog", "name_ar", e.target.value)}
                            className="w-full px-6 py-4 bg-ui-bg border border-ui-input rounded-control text-ui-ink font-bold text-sm focus:outline-none focus:border-ui-primary text-right"
                            placeholder="مثال: مطعم متبل"
                            dir="rtl"
                          />
                        </div>
                      </div>

                      <div className="grid md:grid-cols-2 gap-8 mt-8">
                        {/* English Desc */}
                        <div className="space-y-4">
                          <label htmlFor="business-description-en" className="text-xs font-semibold text-ui-muted ml-2">Description (English)</label>
                          <textarea
                            id="business-description-en"
                            value={settings.catalog.description_en || settings.catalog.description || ""}
                            onChange={(e) => updateSettings("catalog", "description_en", e.target.value)}
                            className="w-full px-6 py-4 bg-ui-bg border border-ui-input rounded-control text-ui-ink font-medium text-xs h-24 focus:outline-none focus:border-ui-primary"
                            placeholder="Brief description..."
                          />
                        </div>
                        {/* Arabic Desc */}
                        <div className="space-y-4">
                          <label htmlFor="business-description-ar" className="text-xs font-semibold text-ui-muted ml-2">Description (Arabic)</label>
                          <textarea
                            id="business-description-ar"
                            value={settings.catalog.description_ar || ""}
                            onChange={(e) => updateSettings("catalog", "description_ar", e.target.value)}
                            className="w-full px-6 py-4 bg-ui-bg border border-ui-input rounded-control text-ui-ink font-medium text-xs h-24 focus:outline-none focus:border-ui-primary text-right"
                            placeholder="وصف مختصر..."
                            dir="rtl"
                          />
                        </div>
                      </div>
                    </div>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                      <div className="lg:col-span-1">
                        <ProImageUpload
                          label="Catalog Logo"
                          url={settings.catalog.logo_url}
                          onUpload={(e) => handleImageUpload(e, "catalog", "logo_url")}
                          onRemove={() => updateSettings("catalog", "logo_url", "")}
                          hint="SVG / PNG"
                        />
                      </div>
                      <div className="lg:col-span-2">
                        <ProImageUpload
                          label="Hero Cover"
                          url={settings.appearance.hero_image_url}
                          onUpload={(e) => handleImageUpload(e, "appearance", "hero_image_url")}
                          onRemove={() => updateSettings("appearance", "hero_image_url", "")}
                          aspect="video"
                          hint="2048 x 1024 PX"
                        />
                      </div>
                    </div>

                    <section className="glass-card p-5 sm:p-8 lg:p-10" aria-labelledby="brand-colour-heading">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-8 h-8 rounded-lg bg-ui-subtle flex items-center justify-center">
                          <Palette className="w-4 h-4 text-ui-primary" aria-hidden />
                        </div>
                        <h3 id="brand-colour-heading" className="text-base font-semibold text-ui-ink">Brand colour</h3>
                      </div>
                      <p className="text-sm text-ui-muted mb-6 max-w-prose">
                        Your menu uses one colour: this one. It fills the selected category, buttons and highlights. We adjust it automatically so text stays readable in light and dark mode.
                      </p>
                      <div className="flex flex-wrap items-end gap-4">
                        <div className="w-full sm:w-72">
                          <ColorInput
                            id="brand-colour"
                            label="Main brand colour"
                            value={settings.appearance.color_primary}
                            onChange={(v) => updateSettings("appearance", "color_primary", v)}
                          />
                        </div>
                        <span
                          aria-hidden
                          className="mb-2 inline-flex h-11 items-center rounded-control px-4 text-sm font-semibold"
                          style={{ ...buildMenuTheme(settings.appearance.color_primary), backgroundColor: "var(--brand)", color: "var(--brand-fg)" }}
                        >
                          Button sample
                        </span>
                      </div>
                    </section>

                    <div className="mt-8 pt-8 border-t border-ui-line">
                      <button
                        onClick={() =>
                          handleSaveSection("Branding & Appearance", {
                            catalog: {
                              name_en: settings.catalog.name_en,
                              name_ar: settings.catalog.name_ar,
                              description_en: settings.catalog.description_en,
                              description_ar: settings.catalog.description_ar,
                              logo_url: settings.catalog.logo_url,
                            },
                            appearance: {
                              hero_image_url: settings.appearance.hero_image_url,
                              color_primary: settings.appearance.color_primary,
                            },
                          })
                        }
                        disabled={savingSection === "Branding & Appearance" || isViewer}
                        className="w-full py-4 bg-ui-primary text-ui-primary-fg font-semibold rounded-control active:scale-[0.98] disabled:opacity-50 transition-all flex items-center justify-center gap-3 text-xs shadow-lg"
                      >
                        {savingSection === "Branding & Appearance" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        Save Appearance
                      </button>
                    </div>
                  </div>

                  {/* RIGHT COLUMN: live miniature of the diner menu */}
                  <div className="lg:col-span-4 lg:sticky lg:top-6 z-10">
                    <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-ui-subtle flex items-center justify-center">
                          <Smartphone className="w-4 h-4 text-ui-primary" aria-hidden />
                        </div>
                        <h3 className="text-sm font-semibold text-ui-ink">Live preview</h3>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <div role="group" aria-label="Preview theme" className="flex p-1 bg-ui-surface border border-ui-line rounded-control">
                          {(["light", "dark"] as const).map((mode) => (
                            <button
                              key={mode}
                              type="button"
                              onClick={() => setPreviewMode(mode)}
                              aria-pressed={previewMode === mode}
                              className={cn(
                                "inline-flex min-h-10 items-center gap-1.5 px-3 rounded-lg text-xs transition-colors",
                                previewMode === mode ? "bg-ui-primary text-ui-primary-fg font-semibold" : "text-ui-muted font-medium hover:text-ui-ink"
                              )}
                            >
                              {mode === "light" ? <Sun className="w-3.5 h-3.5" aria-hidden /> : <Moon className="w-3.5 h-3.5" aria-hidden />}
                              {mode === "light" ? "Light" : "Dark"}
                            </button>
                          ))}
                        </div>
                        <div role="group" aria-label="Preview language" className="flex p-1 bg-ui-surface border border-ui-line rounded-control">
                          {([["en", "EN"], ["ar", "عربي"]] as const).map(([code, label]) => (
                            <button
                              key={code}
                              type="button"
                              onClick={() => setPreviewLang(code)}
                              aria-pressed={previewLang === code}
                              className={cn(
                                "inline-flex min-h-10 items-center px-3 rounded-lg text-xs transition-colors",
                                previewLang === code ? "bg-ui-primary text-ui-primary-fg font-semibold" : "text-ui-muted font-medium hover:text-ui-ink"
                              )}
                            >
                              <Globe className="w-3.5 h-3.5 me-1" aria-hidden />
                              {label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    <figure>
                      <div className="relative mx-auto w-full max-w-[300px] h-[560px] rounded-[28px] border-[8px] border-[#1c2622] shadow-xl overflow-hidden bg-ui-bg">
                        <MenuBrandPreview
                          brandColor={settings.appearance.color_primary}
                          theme={previewMode}
                          lang={previewLang}
                          names={settings.catalog}
                          logoUrl={settings.catalog.logo_url}
                          coverUrl={settings.appearance.hero_image_url}
                          hasPhone={!!settings.contact?.phone_primary}
                          hasWhatsapp={!!settings.contact?.phone_whatsapp}
                          currency={settings.pricing?.currency_primary === "LBP" ? "LBP" : "USD"}
                        />
                      </div>
                      <figcaption className="mt-4 text-xs text-ui-muted leading-relaxed text-center max-w-[300px] mx-auto">
                        Your name, logo, cover and brand colour, including unsaved changes. Categories and dishes are samples.
                      </figcaption>
                    </figure>
                  </div>
                </div>
              )}

              {/* Contact Array */}
              {activeTab === "contact" && (
                <div className="space-y-8">
                  <div className="glass-card p-5 sm:p-8 lg:p-10 space-y-10">
                    <h3 className="text-xs font-semibold text-ui-ink opacity-50">Contact Information</h3>
                    <div className="grid md:grid-cols-2 gap-8">
                      <div className="space-y-4">
                        <label htmlFor="contact-phone_primary" className="text-xs font-semibold text-ui-muted ml-2 block">Primary Phone</label>
                        <input
                          id="contact-phone_primary"
                          type="tel"
                          value={settings.contact.phone_primary || ""}
                          onChange={(e) => updateSettings("contact", "phone_primary", e.target.value)}
                          className="w-full px-6 py-4 bg-ui-bg border border-ui-input rounded-control text-ui-ink font-semibold focus:outline-none focus:border-ui-primary transition-all"
                          placeholder="+000 00 000 000"
                        />
                      </div>
                      <div className="space-y-4">
                        <label htmlFor="contact-phone_whatsapp" className="text-xs font-semibold text-ui-muted ml-2 block">WhatsApp Number</label>
                        <input
                          id="contact-phone_whatsapp"
                          type="tel"
                          value={settings.contact.phone_whatsapp || ""}
                          onChange={(e) => updateSettings("contact", "phone_whatsapp", e.target.value)}
                          className="w-full px-6 py-4 bg-ui-bg border border-ui-input rounded-control text-ui-ink font-semibold focus:outline-none focus:border-ui-primary transition-all font-mono"
                          placeholder="e.g. +96170123456"
                        />
                      </div>
                    </div>

                    <div className="space-y-4 pt-4">
                      <label htmlFor="contact-email" className="text-xs font-semibold text-ui-muted ml-2 block">Email Address</label>
                      <input
                        id="contact-email"
                        type="email"
                        value={settings.contact.email || ""}
                        onChange={(e) => updateSettings("contact", "email", e.target.value)}
                        className="w-full px-6 py-4 bg-ui-bg border border-ui-input rounded-control text-ui-ink font-semibold focus:outline-none focus:border-ui-primary transition-all"
                        placeholder="email@example.com"
                      />
                    </div>
                  </div>

                  <div className="glass-card p-5 sm:p-8 lg:p-10 space-y-10">
                    <h3 className="text-xs font-semibold text-ui-ink opacity-50">Business Address</h3>

                    <div className="space-y-8">
                      {/* Address Matrix */}
                      <div className="space-y-4">
                        <label className="text-xs font-semibold text-ui-muted ml-2">Physical Address</label>
                        <div className="grid gap-4">
                          {[
                            { id: 'en', label: 'English', field: 'address_en' },
                            { id: 'ar', label: 'Arabic', field: 'address_ar', rtl: true },
                          ].map(locale => (
                            <div key={locale.id} className="relative flex items-center bg-ui-bg border border-ui-line rounded-control px-6 py-4 group focus-within:border-primary/40 transition-all">
                              <label htmlFor={`contact-address-${locale.id}`} className="text-xs font-semibold text-ui-muted w-24 flex-shrink-0">{locale.label}</label>
                              <input
                                id={`contact-address-${locale.id}`}
                                type="text"
                                value={settings.contact[locale.field as keyof Settings['contact']] || ""}
                                onChange={(e) => updateSettings("contact", locale.field, e.target.value)}
                                className={`flex-1 bg-transparent border-0 text-ui-ink font-semibold focus:ring-0 text-sm ${locale.rtl ? 'text-right' : ''}`}
                                dir={locale.rtl ? 'rtl' : 'ltr'}
                                placeholder={`Enter address in ${locale.label}...`}
                              />
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Map Matrix */}
                      <div className="space-y-4 pt-6">
                        <label htmlFor="contact-map-url" className="text-xs font-semibold text-ui-muted ml-2 block">Google Maps Embed URL</label>
                        <input
                          id="contact-map-url"
                          type="url"
                          value={settings.contact.google_map_iframe_url || ""}
                          onChange={(e) => updateSettings("contact", "google_map_iframe_url", e.target.value)}
                          className="w-full px-6 py-4 bg-ui-bg border border-ui-input rounded-control text-ui-ink font-semibold focus:outline-none focus:border-ui-primary transition-all font-mono text-xs"
                          placeholder="https://www.google.com/maps/embed?pb=..."
                        />
                      </div>
                    </div>

                    <div className="mt-8 pt-8 border-t border-ui-line">
                      <button
                        onClick={() => handleSaveSection("Contact Information", { contact: settings.contact })}
                        disabled={savingSection === "Contact Information" || isViewer}
                        className="w-full py-4 bg-ui-primary text-ui-primary-fg font-semibold rounded-control active:scale-[0.98] disabled:opacity-50 transition-all flex items-center justify-center gap-3 text-xs shadow-lg"
                      >
                        {savingSection === "Contact Information" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        Save Contact Details
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Pricing & ordering (dual USD/LBP and WhatsApp order types) */}
              {activeTab === "pricing" && settings.pricing && settings.ordering && (
                <div className="space-y-8">
                  <div className="glass-card p-5 sm:p-8 lg:p-10 space-y-8">
                    <div>
                      <h3 className="text-lg font-bold text-ui-ink">Prices</h3>
                      <p className="mt-1 text-sm text-ui-muted">Prices show in the currency you entered them in. Add your exchange rate to also show them in the other currency.</p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-8">
                      <div className="space-y-3">
                        <label htmlFor="currency-primary" className="text-sm font-semibold text-ui-ink block">Main currency</label>
                        <select
                          id="currency-primary"
                          value={settings.pricing.currency_primary}
                          onChange={(e) => updateSettings("pricing", "currency_primary", e.target.value)}
                          className="w-full px-6 py-4 bg-ui-bg border border-ui-input rounded-control text-ui-ink focus:outline-none focus:border-ui-primary transition-all"
                        >
                          <option value="USD">US dollar ($) shown first</option>
                          <option value="LBP">Lebanese pound (L.L.) shown first</option>
                        </select>
                      </div>
                      <div className="space-y-3">
                        <label htmlFor="lbp-rate" className="text-sm font-semibold text-ui-ink block">Exchange rate (L.L. per $1)</label>
                        <input
                          id="lbp-rate"
                          type="number"
                          inputMode="numeric"
                          min={1}
                          step={500}
                          value={settings.pricing.lbp_exchange_rate ?? ""}
                          placeholder="Not set"
                          onChange={(e) => updateSettings("pricing", "lbp_exchange_rate", e.target.value)}
                          className="w-full px-6 py-4 bg-ui-bg border border-ui-input rounded-control text-ui-ink focus:outline-none focus:border-ui-primary transition-all"
                        />
                        <p className="text-xs text-ui-muted">
                          Converted pound prices are rounded to the nearest 1,000 L.L.
                          {settings.pricing.lbp_rate_updated_at
                            ? ` Last changed ${new Date(settings.pricing.lbp_rate_updated_at.replace(" ", "T") + "Z").toLocaleString()}.`
                            : " Leave empty to never convert prices."}
                        </p>
                      </div>
                    </div>

                    <ToggleSwitch
                      label="Show both currencies"
                      description={settings.pricing.lbp_exchange_rate ? "Turn off to show only the main currency." : "Set an exchange rate first."}
                      checked={settings.pricing.show_dual_currency && !!settings.pricing.lbp_exchange_rate}
                      onChange={(value) => updateSettings("pricing", "show_dual_currency", value)}
                    />
                  </div>

                  <div className="glass-card p-5 sm:p-8 lg:p-10 space-y-8">
                    <div>
                      <h3 className="text-lg font-bold text-ui-ink">WhatsApp orders</h3>
                      <p className="mt-1 text-sm text-ui-muted">Choose how guests can order. Orders arrive on the WhatsApp number from the Contact tab.</p>
                    </div>

                    <div className="space-y-4">
                      {ORDER_TYPE_OPTIONS.map((option) => {
                        const enabled = settings.ordering.order_types.split(",").includes(option.id);
                        return (
                          <ToggleSwitch
                            key={option.id}
                            label={option.label}
                            description={option.hint}
                            checked={enabled}
                            onChange={(value) => {
                              const current = settings.ordering.order_types.split(",").filter(Boolean);
                              const next = value ? [...current, option.id] : current.filter((t) => t !== option.id);
                              updateSettings(
                                "ordering",
                                "order_types",
                                ORDER_TYPE_OPTIONS.map((o) => o.id).filter((id) => next.includes(id)).join(",")
                              );
                            }}
                          />
                        );
                      })}
                    </div>

                    {settings.ordering.order_types.split(",").includes("delivery") && (
                      <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-3">
                          <label htmlFor="delivery-note-en" className="text-sm font-semibold text-ui-ink block">Delivery note (English)</label>
                          <textarea
                            id="delivery-note-en"
                            rows={3}
                            value={settings.ordering.delivery_note_en}
                            onChange={(e) => updateSettings("ordering", "delivery_note_en", e.target.value)}
                            placeholder="e.g. Free delivery in Hamra and Verdun"
                            className="w-full px-6 py-4 bg-ui-bg border border-ui-input rounded-control text-ui-ink focus:outline-none focus:border-ui-primary transition-all resize-none"
                          />
                        </div>
                        <div className="space-y-3">
                          <label htmlFor="delivery-note-ar" className="text-sm font-semibold text-ui-ink block">Delivery note (Arabic)</label>
                          <textarea
                            id="delivery-note-ar"
                            dir="rtl"
                            rows={3}
                            value={settings.ordering.delivery_note_ar}
                            onChange={(e) => updateSettings("ordering", "delivery_note_ar", e.target.value)}
                            placeholder="مثلاً: توصيل مجاني في الحمرا وفردان"
                            className="w-full px-6 py-4 bg-ui-bg border border-ui-input rounded-control text-ui-ink focus:outline-none focus:border-ui-primary transition-all resize-none"
                          />
                        </div>
                      </div>
                    )}

                    <div className="pt-8 border-t border-ui-line">
                      <button
                        onClick={() => handleSaveSection("Pricing & orders", { pricing: settings.pricing, ordering: settings.ordering })}
                        disabled={savingSection === "Pricing & orders" || isViewer}
                        className="w-full py-4 bg-ui-primary text-ui-primary-fg font-bold rounded-control active:scale-[0.98] disabled:opacity-50 transition-all flex items-center justify-center gap-3 text-sm shadow-lg"
                      >
                        {savingSection === "Pricing & orders" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        Save pricing & orders
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Features Array */}
              {activeTab === "features" && (
                <div className="space-y-8">
                  <div className="glass-card p-5 sm:p-8 lg:p-10 space-y-6">
                    <h3 className="text-xs font-semibold text-ui-ink mb-10 opacity-50">Feature Toggles</h3>
                    <ToggleSwitch
                      label="WhatsApp Ordering"
                      description="Allow customers to send orders via WhatsApp"
                      checked={settings.features.whatsapp_order_enabled}
                      onChange={(v) => updateSettings("features", "whatsapp_order_enabled", v)}
                    />
                    <ToggleSwitch
                      label="Booking System"
                      description="Enable appointment or table reservations"
                      checked={settings.features.booking_enabled}
                      onChange={(v) => updateSettings("features", "booking_enabled", v)}
                    />
                    <ToggleSwitch
                      label="AI Waiter Assistant"
                      description="Enable the AI Waiter to help customers with menu questions"
                      checked={settings.features.ai_waiter_enabled}
                      onChange={(v) => updateSettings("features", "ai_waiter_enabled", v)}
                    />
                  </div>

                  <div className="glass-card p-5 sm:p-8 lg:p-10">
                    <h3 className="text-xs font-semibold text-ui-ink mb-10 opacity-50">Button Labels (Localization)</h3>
                    <div className="space-y-12">
                      {[
                        { id: 'cta_menu_label', title: 'Menu button on your About page' },
                      ].map(section => (
                        <div key={section.id} className="space-y-6">
                          <h4 className="text-xs font-semibold text-ui-muted border-b border-ui-line pb-2">{section.title}</h4>
                          <div className="grid md:grid-cols-2 gap-6">
                            {[['en', 'English'], ['ar', 'Arabic']].map(([lang, langLabel]) => (
                              <div key={lang} className="space-y-2">
                                <label htmlFor={`${section.id}_${lang}`} className="text-xs font-semibold text-ui-muted ml-1">{langLabel}</label>
                                <input
                                  id={`${section.id}_${lang}`}
                                  type="text"
                                  value={settings.cta[`${section.id}_${lang}` as keyof Settings['cta']] || ""}
                                  onChange={(e) => updateSettings("cta", `${section.id}_${lang}`, e.target.value)}
                                  className="w-full px-4 py-3 bg-ui-bg border border-ui-input rounded-xl text-ui-ink font-semibold focus:outline-none focus:border-ui-primary transition-all text-xs"
                                  dir={lang === 'ar' ? 'rtl' : 'ltr'}
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="mt-8 pt-8 border-t border-ui-line">
                      <button
                        onClick={() =>
                          handleSaveSection("Features & Labels", {
                            features: {
                              booking_enabled: settings.features.booking_enabled,
                              whatsapp_order_enabled: settings.features.whatsapp_order_enabled,
                              ai_waiter_enabled: settings.features.ai_waiter_enabled,
                            },
                            cta: {
                              cta_menu_label_en: settings.cta.cta_menu_label_en,
                              cta_menu_label_ar: settings.cta.cta_menu_label_ar,
                            },
                          })
                        }
                        disabled={savingSection === "Features & Labels" || isViewer}
                        className="w-full py-4 bg-ui-primary text-ui-primary-fg font-semibold rounded-control active:scale-[0.98] disabled:opacity-50 transition-all flex items-center justify-center gap-3 text-xs shadow-lg"
                      >
                        {savingSection === "Features & Labels" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        Save Features & Labels
                      </button>
                    </div>
                  </div>
                </div>
              )}


              {/* AI Array */}
              {activeTab === "ai" && (
                <div className="space-y-8">
                  <div className="glass-card p-5 sm:p-8 lg:p-10 space-y-10">
                    <h3 className="text-xs font-semibold text-ui-ink opacity-50">AI Waiter Persona</h3>
                    <div className="grid md:grid-cols-2 gap-8">
                      <div className="space-y-4">
                        <label htmlFor="ai-waiter-name" className="text-xs font-semibold text-ui-muted ml-2">AI Identity (Name)</label>
                        <div className="relative">
                          <BotIcon className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-ui-primary" />
                          <input
                            id="ai-waiter-name"
                            type="text"
                            value={settings.features.ai_waiter_name || ""}
                            onChange={(e) => updateSettings("features", "ai_waiter_name", e.target.value)}
                            className="w-full pl-14 pr-6 py-5 bg-ui-bg border border-ui-input rounded-control text-ui-ink font-semibold focus:outline-none focus:border-ui-primary"
                            placeholder="e.g. Sarah"
                          />
                        </div>
                      </div>
                      <div className="space-y-4">
                        <label htmlFor="ai-waiter-persona" className="text-xs font-semibold text-ui-muted ml-2">Tone & Behavior (Persona)</label>
                        <textarea
                          id="ai-waiter-persona"
                          value={settings.features.ai_waiter_persona || ""}
                          onChange={(e) => updateSettings("features", "ai_waiter_persona", e.target.value)}
                          className="w-full px-6 py-4 bg-ui-bg border border-ui-input rounded-control text-ui-ink font-medium text-sm h-24 focus:outline-none focus:border-ui-primary"
                          placeholder="e.g. You are a charming, luxury restaurant waiter who is very formal and knowledgeable about wine."
                        />
                      </div>
                    </div>
                    <div className="p-5 sm:p-8 bg-ui-subtle border border-ui-line rounded-panel flex items-center gap-6">
                      <div className="w-12 h-12 bg-ui-primary rounded-control flex items-center justify-center text-ui-primary-fg">
                        <SparklesIcon className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-ui-primary">AI Status</p>
                        <p className="text-ui-muted text-xs font-medium leading-relaxed mt-1">
                          {settings.features.ai_waiter_enabled
                            ? "Your AI assistant is currently active and helping customers."
                            : "AI Assistant is currently disabled. Toggle it on in the Features tab."}
                        </p>
                      </div>
                    </div>

                    <div className="mt-8 pt-8 border-t border-ui-line">
                      <button
                        onClick={() =>
                          handleSaveSection("AI Persona", {
                            features: {
                              ai_waiter_name: settings.features.ai_waiter_name,
                              ai_waiter_persona: settings.features.ai_waiter_persona,
                            },
                          })
                        }
                        disabled={savingSection === "AI Persona" || isViewer}
                        className="w-full py-4 bg-ui-primary text-ui-primary-fg font-semibold rounded-control active:scale-[0.98] disabled:opacity-50 transition-all flex items-center justify-center gap-3 text-xs shadow-lg"
                      >
                        {savingSection === "AI Persona" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        Save AI Persona
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center py-32 glass rounded-panel border border-ui-line">
            <Loader2 className="w-12 h-12 text-ui-primary animate-spin mx-auto mb-6" />
            <p className="text-xs font-semibold text-ui-muted">
              Loading settings...
            </p>
          </div>
        )}
      </CatalogAdminContent>
    </>
  );
}

export default function SettingsPage() {
  return (
    <CatalogAdminShell>
      <SettingsPageContent />
    </CatalogAdminShell>
  );
}
