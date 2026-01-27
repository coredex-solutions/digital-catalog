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
  Info,
  Save,
  Loader2,
  Palette,
  Phone,
  MapPin,
  Upload,
  X,
  ToggleLeft,
  ToggleRight,
  ImageIcon,
  Bot as BotIcon,
  Sparkles as SparklesIcon,
  Brain,
  Moon,
  Sun,
  Smartphone,
  Layout,
  Home,
  Utensils,
  ChevronRight,
  Globe,
} from "lucide-react";
import {
  compressImage,
  formatBytes,
  isImageFile,
} from "@/utils/image-compression";
import { cn } from "@/utils/helpers";
import { CATALOG_THEMES, THEME_METHODS, generateDynamicTheme, ThemeMethod } from "@/config/themes";

interface Settings {
  catalog: {
    name: string;
    name_ar: string;
    name_en: string;
    name_fr: string;
    description: string;
    description_ar: string;
    description_en: string;
    description_fr: string;
    logo_url: string;
  };
  appearance: {
    hero_image_url: string;
    bg_pattern_enabled: boolean;
    bg_pattern_type: string;
    color_primary: string;
    color_secondary: string;
    color_accent: string;
    color_background: string;
    color_surface: string;
    color_text: string;
    color_text_muted: string;
    // Dark Mode specific colors
    color_primary_dark: string;
    color_secondary_dark: string;
    color_accent_dark: string;
    color_background_dark: string;
    color_surface_dark: string;
    color_text_dark: string;
    color_text_muted_dark: string;
  };
  features: {
    booking_enabled: boolean;
    whatsapp_order_enabled: boolean;
    live_chat_enabled: boolean;
    ai_waiter_enabled: boolean;
    ai_waiter_name: string;
    ai_waiter_persona: string;
  };
  cta: {
    cta_menu_label_en: string;
    cta_menu_label_ar: string;
    cta_menu_label_fr: string;

    cta_booking_label_en: string;
    cta_booking_label_ar: string;
    cta_booking_label_fr: string;

    cta_order_label_en: string;
    cta_order_label_ar: string;
    cta_order_label_fr: string;
  };
  contact: {
    phone_primary: string;
    phone_whatsapp: string;
    email: string;
    address_en: string;
    address_ar: string;
    address_fr: string;
    city_en: string;
    city_ar: string;
    city_fr: string;
    google_map_iframe_url: string;
  };
  subscription?: {
    multi_language_enabled: boolean;
    ai_image_enhancement_limit: number;
  };
  feature_config?: {
    enabled_languages: string;
    default_language: string;
  };
}

export default function SettingsPage() {
  const { slug, user, fetchWithAuth } = useCatalogAdmin();
  const isViewer = user?.role === 'viewer';

  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "appearance" | "contact" | "features" | "ai"
  >("appearance");
  const [previewMode, setPreviewMode] = useState<"light" | "dark">("dark");
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

  // Live Preview Theme Injection
  useEffect(() => {
    if (!settings) return;
    const root = document.documentElement;
    const isDark = previewMode === "dark";

    root.style.setProperty("--primary", settings.appearance.color_primary);
    root.style.setProperty("--secondary", settings.appearance.color_secondary);
    root.style.setProperty("--accent", settings.appearance.color_accent);

    if (isDark) {
      root.style.setProperty("--background-hex", settings.appearance.color_background_dark || "#0a0a0c");
      root.style.setProperty("--surface", settings.appearance.color_surface_dark || "#121215");
      root.style.setProperty("--text-primary", settings.appearance.color_text_dark || "#ffffff");
      root.style.setProperty("--text-muted", settings.appearance.color_text_muted_dark || "rgba(255,255,255,0.4)");
      root.classList.add("dark");
    } else {
      root.style.setProperty("--background-hex", settings.appearance.color_background || "#ffffff");
      root.style.setProperty("--surface", settings.appearance.color_surface || "#f8fafc");
      root.style.setProperty("--text-primary", settings.appearance.color_text || "#0f172a");
      root.style.setProperty("--text-muted", settings.appearance.color_text_muted || "#64748b");
      root.classList.remove("dark");
    }
  }, [settings, previewMode]);


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
    label,
    value,
    onChange,
  }: {
    label: string;
    value: string;
    onChange: (v: string) => void;
  }) => (
    <div className="space-y-2">
      <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] ml-2">
        {label}
      </label>
      <div className="relative group">
        <div className="absolute inset-0 bg-white/5 blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
        <div className="relative flex items-center gap-3 p-2 bg-white/[0.03] border border-white/5 rounded-2xl">
          <input
            type="color"
            value={value || "#000000"}
            onChange={(e) => onChange(e.target.value)}
            className="w-12 h-12 rounded-xl cursor-pointer border-0 bg-transparent ring-1 ring-white/10"
          />
          <input
            type="text"
            value={value || ""}
            onChange={(e) => onChange(e.target.value)}
            className="flex-1 bg-transparent border-0 text-white font-mono text-xs focus:ring-0 uppercase tracking-widest"
            placeholder="#000000"
          />
        </div>
      </div>
    </div>
  );

  const applyTheme = (themeId: string) => {
    if (!settings) return;
    const theme = CATALOG_THEMES.find(t => t.id === themeId);
    if (!theme) return;

    setSettings({
      ...settings,
      appearance: {
        ...settings.appearance,
        color_primary: theme.light.primary,
        color_secondary: theme.light.secondary,
        color_accent: theme.light.accent,
        color_background: theme.light.background,
        color_surface: theme.light.surface,
        color_text: theme.light.text,
        color_text_muted: theme.light.textMuted,
        color_primary_dark: theme.dark.primary,
        color_secondary_dark: theme.dark.secondary,
        color_accent_dark: theme.dark.accent,
        color_background_dark: theme.dark.background,
        color_surface_dark: theme.dark.surface,
        color_text_dark: theme.dark.text,
        color_text_muted_dark: theme.dark.textMuted,
      }
    });
    setMessage({ type: "success", text: `Theme "${theme.name}" applied. Don't forget to save!` });
  };

  const applyDynamicMethod = (method: ThemeMethod) => {
    if (!settings) return;
    const theme = generateDynamicTheme(settings.appearance.color_primary, method);

    setSettings({
      ...settings,
      appearance: {
        ...settings.appearance,
        color_secondary: theme.light.secondary,
        color_accent: theme.light.accent,
        color_background: theme.light.background,
        color_surface: theme.light.surface,
        color_text: theme.light.text,
        color_text_muted: theme.light.textMuted,
        color_primary_dark: theme.dark.primary,
        color_secondary_dark: theme.dark.secondary,
        color_accent_dark: theme.dark.accent,
        color_background_dark: theme.dark.background,
        color_surface_dark: theme.dark.surface,
        color_text_dark: theme.dark.text,
        color_text_muted_dark: theme.dark.textMuted,
      }
    });
    setMessage({ type: "success", text: `Method "${method}" applied to your brand color.` });
  };

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
      <div className="glass-card p-10 flex flex-col h-full bg-white/[0.02] border border-white/5 rounded-[2.5rem] transition-all duration-500 hover:bg-white/[0.04] group/card">
        <div className="flex items-center justify-between mb-8">
          <h3 className="text-[11px] font-black text-white uppercase tracking-[0.3em] opacity-50">{label}</h3>
          {hint && <span className="text-[9px] font-black text-white/20 uppercase tracking-widest">{hint}</span>}
        </div>

        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => { e.preventDefault(); setDragging(false); if (e.dataTransfer.files[0]) onUpload(e.dataTransfer.files[0]); }}
          className={cn(
            "relative flex-1 min-h-[200px] rounded-[2rem] overflow-hidden border-2 border-dashed transition-all duration-500",
            dragging ? "border-primary bg-primary/10 scale-[1.02]" : url ? "border-white/10" : "border-white/5 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04]"
          )}
        >
          {url ? (
            <div className="relative w-full h-full group">
              <Image src={url} alt={label} fill className="object-cover transition-transform duration-700 group-hover:scale-110" />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4 backdrop-blur-sm">
                <label className="w-14 h-14 bg-white text-black rounded-2xl flex items-center justify-center cursor-pointer hover:scale-110 active:scale-95 transition-all shadow-xl">
                  <Upload className="w-6 h-6" />
                  <input type="file" accept="image/*" onChange={onUpload} className="hidden" />
                </label>
                <button
                  onClick={onRemove}
                  className="w-14 h-14 bg-purple-500 text-white rounded-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all shadow-xl"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>
          ) : (
            <label className="absolute inset-0 flex flex-col items-center justify-center cursor-pointer group/label">
              <div className="w-16 h-16 bg-white/[0.03] border border-white/5 rounded-3xl flex items-center justify-center mb-4 group-hover/label:scale-110 group-hover/label:bg-primary/20 group-hover/label:border-primary/30 transition-all duration-500">
                <Upload className="w-6 h-6 text-white/30 group-hover/label:text-primary" />
              </div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20 group-hover/label:text-white/40 transition-colors">Click or Drag Image</p>
              <input type="file" accept="image/*" onChange={onUpload} className="hidden" />
            </label>
          )}

          {uploadProgress && uploadProgress.toLowerCase().includes(label.toLowerCase().split(' ')[0]) && (
            <div className="absolute inset-0 bg-black/80 backdrop-blur-xl flex flex-col items-center justify-center z-50 animate-in fade-in">
              <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
              <p className="text-[10px] font-black text-white uppercase tracking-[0.4em] animate-pulse">{uploadProgress}</p>
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
    <div
      className="flex items-center justify-between p-6 bg-white/[0.02] border border-white/5 rounded-[2rem] cursor-pointer hover:bg-white/[0.04] transition-all group"
      onClick={() => onChange(!checked)}
    >
      <div>
        <p className="text-[11px] font-black text-white uppercase tracking-widest">{label}</p>
        {description && <p className="text-[9px] font-black text-white/20 uppercase tracking-widest mt-1">{description}</p>}
      </div>
      <div className={`w-14 h-8 rounded-full transition-all duration-500 relative flex items-center p-1 ${checked ? 'bg-primary' : 'bg-white/10'}`}>
        <div className={`w-6 h-6 rounded-full bg-white shadow-lg transition-all duration-500 ${checked ? 'translate-x-6' : 'translate-x-0'}`} />
        {checked && <div className="absolute inset-0 bg-primary blur-lg opacity-40 animate-pulse" />}
      </div>
    </div>
  );

  return (
    <CatalogAdminShell>
      <CatalogAdminHeader title="Settings" />

      <CatalogAdminContent>
        {message && (
          <div
            className={`mb-8 px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest border animate-in slide-in-from-top-4 duration-500 ${message.type === "success"
              ? "bg-violet-500/10 text-violet-400 border-violet-500/20"
              : "bg-purple-500/10 text-purple-400 border-purple-500/20"
              }`}
          >
            {message.text}
          </div>
        )}

        {loading ? (
          <div className="space-y-8">
            <div className="h-12 bg-white/5 rounded-2xl w-1/3 animate-pulse" />
            <div className="h-96 glass rounded-[3rem] animate-pulse" />
          </div>
        ) : settings ? (
          <div className="space-y-10">
            {/* Context Selectors (Tabs) */}
            <div className="flex flex-wrap gap-4 p-2 bg-white/[0.02] border border-white/5 rounded-[2.5rem] w-full md:w-fit">
              {[
                { id: "appearance", label: "Branding", icon: Palette },
                { id: "contact", label: "Contact", icon: Phone },
                { id: "features", label: "Features", icon: ToggleRight },
                { id: "ai", label: "AI Waiter", icon: Brain },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-3 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab.id
                    ? "bg-white text-black shadow-xl scale-[1.05]"
                    : "text-white/30 hover:text-white hover:bg-white/5"
                    }`}
                >
                  <tab.icon className="w-3.5 h-3.5" />
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Matrix Layers */}
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
              {/* Appearance Array */}
              {activeTab === "appearance" && (
                <div className="grid lg:grid-cols-12 gap-12 items-start">
                  <div className="lg:col-span-8 space-y-8">
                    {/* Identity Section */}
                    <div className="glass-card p-10">
                      <div className="flex items-center gap-3 mb-8">
                        <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                          <Layout className="w-4 h-4 text-primary" />
                        </div>
                        <h3 className="text-[11px] font-black text-white uppercase tracking-[0.3em] opacity-50">Business Identity</h3>
                      </div>

                      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {/* English Name */}
                        <div className="space-y-4">
                          <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] ml-2">Business Name (English)</label>
                          <input
                            type="text"
                            value={settings.catalog.name_en || settings.catalog.name || ""}
                            onChange={(e) => updateSettings("catalog", "name_en", e.target.value)}
                            className="w-full px-6 py-4 bg-white/[0.03] border border-white/5 rounded-2xl text-white font-bold text-sm focus:outline-none focus:border-primary/50"
                            placeholder="e.g. Mtabal Restaurant"
                          />
                        </div>
                        {/* Arabic Name */}
                        <div className="space-y-4">
                          <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] ml-2">Business Name (Arabic)</label>
                          <input
                            type="text"
                            value={settings.catalog.name_ar || ""}
                            onChange={(e) => updateSettings("catalog", "name_ar", e.target.value)}
                            className="w-full px-6 py-4 bg-white/[0.03] border border-white/5 rounded-2xl text-white font-bold text-sm focus:outline-none focus:border-primary/50 text-right"
                            placeholder="مثال: مطعم متبل"
                            dir="rtl"
                          />
                        </div>
                        {/* French Name */}
                        <div className="space-y-4">
                          <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] ml-2">Business Name (French)</label>
                          <input
                            type="text"
                            value={settings.catalog.name_fr || ""}
                            onChange={(e) => updateSettings("catalog", "name_fr", e.target.value)}
                            className="w-full px-6 py-4 bg-white/[0.03] border border-white/5 rounded-2xl text-white font-bold text-sm focus:outline-none focus:border-primary/50"
                            placeholder="e.g. Restaurant Mtabal"
                          />
                        </div>
                      </div>

                      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mt-8">
                        {/* English Desc */}
                        <div className="space-y-4">
                          <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] ml-2">Description (English)</label>
                          <textarea
                            value={settings.catalog.description_en || settings.catalog.description || ""}
                            onChange={(e) => updateSettings("catalog", "description_en", e.target.value)}
                            className="w-full px-6 py-4 bg-white/[0.03] border border-white/5 rounded-2xl text-white font-medium text-xs h-24 focus:outline-none focus:border-primary/50"
                            placeholder="Brief description..."
                          />
                        </div>
                        {/* Arabic Desc */}
                        <div className="space-y-4">
                          <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] ml-2">Description (Arabic)</label>
                          <textarea
                            value={settings.catalog.description_ar || ""}
                            onChange={(e) => updateSettings("catalog", "description_ar", e.target.value)}
                            className="w-full px-6 py-4 bg-white/[0.03] border border-white/5 rounded-2xl text-white font-medium text-xs h-24 focus:outline-none focus:border-primary/50 text-right"
                            placeholder="وصف مختصر..."
                            dir="rtl"
                          />
                        </div>
                        {/* French Desc */}
                        <div className="space-y-4">
                          <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] ml-2">Description (French)</label>
                          <textarea
                            value={settings.catalog.description_fr || ""}
                            onChange={(e) => updateSettings("catalog", "description_fr", e.target.value)}
                            className="w-full px-6 py-4 bg-white/[0.03] border border-white/5 rounded-2xl text-white font-medium text-xs h-24 focus:outline-none focus:border-primary/50"
                            placeholder="Brève description..."
                          />
                        </div>
                      </div>
                    </div>
                    {/* Theme Preview Switcher */}
                    <div className="flex items-center justify-between p-8 bg-white/[0.03] border border-white/10 rounded-[2.5rem] mb-12">
                      <div className="flex items-center gap-6">
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500 scale-110 shadow-2xl ${previewMode === 'dark' ? 'bg-violet-500 text-white shadow-violet-500/20' : 'bg-primary text-white shadow-primary/20'}`}>
                          {previewMode === 'dark' ? <Moon className="w-6 h-6" /> : <Sun className="w-6 h-6" />}
                        </div>
                        <div>
                          <h4 className="text-[12px] font-black text-white uppercase tracking-[0.3em]">Theme Preview</h4>
                          <p className="text-white/30 text-[10px] font-medium uppercase tracking-widest mt-1">Currently viewing: {previewMode} mode</p>
                        </div>
                      </div>
                      <div className="flex p-2 bg-black/20 rounded-2xl border border-white/5">
                        <button
                          onClick={() => setPreviewMode("light")}
                          className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${previewMode === 'light' ? 'bg-white text-black shadow-xl' : 'text-white/40 hover:text-white'}`}
                        >
                          Light
                        </button>
                        <button
                          onClick={() => setPreviewMode("dark")}
                          className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${previewMode === 'dark' ? 'bg-white text-black shadow-xl' : 'text-white/40 hover:text-white'}`}
                        >
                          Dark
                        </button>
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

                    <div className="glass-card p-10">
                      <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                            <Palette className="w-4 h-4 text-primary" />
                          </div>
                          <h3 className="text-[11px] font-black text-white uppercase tracking-[0.3em] opacity-50">Dynamic Branding</h3>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
                        <div>
                          <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-4">1. Pick your brand color</p>
                          <ColorInput
                            label="Main Brand Color"
                            value={settings.appearance.color_primary}
                            onChange={(v) => updateSettings("appearance", "color_primary", v)}
                          />
                        </div>
                        <div className="space-y-4">
                          <p className="text-[10px] font-black text-white/40 uppercase tracking-widest ">2. Choose its behavior</p>
                          <div className="grid grid-cols-1 gap-3">
                            {THEME_METHODS.map((method) => (
                              <button
                                key={method.id}
                                onClick={() => applyDynamicMethod(method.id)}
                                className="p-4 rounded-2xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/10 transition-all text-left flex items-center justify-between group"
                              >
                                <div>
                                  <span className="text-[10px] font-black uppercase tracking-widest text-white/80 block">{method.name}</span>
                                  <span className="text-[9px] text-white/30 uppercase font-medium">{method.description}</span>
                                </div>
                                <div className="w-6 h-6 rounded-full border border-black/20" style={{ backgroundColor: settings.appearance.color_primary }} />
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="glass-card p-10">
                      <div className="flex items-center gap-3 mb-8">
                        <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                          <SparklesIcon className="w-4 h-4 text-primary" />
                        </div>
                        <h3 className="text-[11px] font-black text-white uppercase tracking-[0.3em] opacity-50">Theme Presets</h3>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-6">
                        {CATALOG_THEMES.map((theme) => (
                          <button
                            key={theme.id}
                            onClick={() => applyTheme(theme.id)}
                            className="p-6 rounded-[2rem] border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/10 transition-all text-left group"
                          >
                            <div className="flex items-center justify-between mb-4">
                              <span className="text-[10px] font-black uppercase tracking-widest text-white/60 group-hover:text-white transition-colors">
                                {theme.name}
                              </span>
                              <ChevronRight className="w-4 h-4 text-white/10 group-hover:translate-x-1 transition-all" />
                            </div>
                            <div className="flex gap-2">
                              <div className="w-6 h-6 rounded-full border border-black/20" style={{ backgroundColor: theme.light.primary }} />
                              <div className="w-6 h-6 rounded-full border border-black/20" style={{ backgroundColor: theme.light.background }} />
                              <div className="w-6 h-6 rounded-full border border-black/20 transition-transform group-hover:scale-110" style={{ backgroundColor: theme.dark.background }} />
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="glass-card p-10">
                      <h3 className="text-[11px] font-black text-white uppercase tracking-[0.3em] mb-10 opacity-50">Brand Colors</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                        <ColorInput
                          label="Primary Color"
                          value={settings.appearance.color_primary}
                          onChange={(v) => updateSettings("appearance", "color_primary", v)}
                        />
                        <ColorInput
                          label="Secondary Color"
                          value={settings.appearance.color_secondary}
                          onChange={(v) => updateSettings("appearance", "color_secondary", v)}
                        />
                        <ColorInput
                          label="Accent Color"
                          value={settings.appearance.color_accent}
                          onChange={(v) => updateSettings("appearance", "color_accent", v)}
                        />
                        <ColorInput
                          label="Background Color"
                          value={settings.appearance.color_background}
                          onChange={(v) => updateSettings("appearance", "color_background", v)}
                        />
                      </div>
                    </div>

                    <div className="glass-card p-10">
                      <h3 className="text-[11px] font-black text-white uppercase tracking-[0.3em] mb-10 opacity-50">Typography & Interface Colors</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                        <ColorInput
                          label="Surface (Cards/Modals)"
                          value={settings.appearance.color_surface}
                          onChange={(v) => updateSettings("appearance", "color_surface", v)}
                        />
                        <ColorInput
                          label="Primary Text"
                          value={settings.appearance.color_text}
                          onChange={(v) => updateSettings("appearance", "color_text", v)}
                        />
                        <ColorInput
                          label="Muted Text"
                          value={settings.appearance.color_text_muted}
                          onChange={(v) => updateSettings("appearance", "color_text_muted", v)}
                        />
                      </div>
                    </div>

                    <div className="glass-card p-10 border-violet-500/20 bg-violet-500/[0.02]">
                      <div className="flex items-center gap-3 mb-10">
                        <div className="w-8 h-8 rounded-lg bg-violet-500/20 flex items-center justify-center">
                          <Moon className="w-4 h-4 text-violet-400" />
                        </div>
                        <h3 className="text-[11px] font-black text-white uppercase tracking-[0.3em] opacity-50">Dark Mode Specific Colors</h3>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                        <ColorInput
                          label="Dark Background"
                          value={settings.appearance.color_background_dark}
                          onChange={(v) => updateSettings("appearance", "color_background_dark", v)}
                        />
                        <ColorInput
                          label="Dark Surface"
                          value={settings.appearance.color_surface_dark}
                          onChange={(v) => updateSettings("appearance", "color_surface_dark", v)}
                        />
                        <ColorInput
                          label="Dark Primary Color"
                          value={settings.appearance.color_primary_dark}
                          onChange={(v) => updateSettings("appearance", "color_primary_dark", v)}
                        />
                        <ColorInput
                          label="Dark Secondary Color"
                          value={settings.appearance.color_secondary_dark}
                          onChange={(v) => updateSettings("appearance", "color_secondary_dark", v)}
                        />
                        <ColorInput
                          label="Dark Accent Color"
                          value={settings.appearance.color_accent_dark}
                          onChange={(v) => updateSettings("appearance", "color_accent_dark", v)}
                        />
                        <ColorInput
                          label="Dark Primary Text"
                          value={settings.appearance.color_text_dark}
                          onChange={(v) => updateSettings("appearance", "color_text_dark", v)}
                        />
                        <ColorInput
                          label="Dark Muted Text"
                          value={settings.appearance.color_text_muted_dark}
                          onChange={(v) => updateSettings("appearance", "color_text_muted_dark", v)}
                        />
                      </div>
                    </div>


                    <div className="glass-card p-10">
                      <h3 className="text-[11px] font-black text-white uppercase tracking-[0.3em] mb-8 opacity-50">Background Pattern</h3>
                      <ToggleSwitch
                        label="Enable Pattern"
                        description="Display a subtle geometric pattern on the background"
                        checked={settings.appearance.bg_pattern_enabled}
                        onChange={(v) => updateSettings("appearance", "bg_pattern_enabled", v)}
                      />
                      {settings.appearance.bg_pattern_enabled && (
                        <div className="mt-8 animate-in slide-in-from-top-4">
                          <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] block mb-4 ml-2">Pattern Style</label>
                          <div className="flex gap-4">
                            {['geometric', 'dots', 'lines'].map(type => (
                              <button
                                key={type}
                                onClick={() => updateSettings("appearance", "bg_pattern_type", type)}
                                className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border ${settings.appearance.bg_pattern_type === type
                                  ? 'bg-primary border-primary text-white'
                                  : 'bg-white/5 border-white/5 text-white/30 hover:border-white/20'
                                  }`}
                              >
                                {type}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="mt-8 pt-8 border-t border-white/5">
                      <button
                        onClick={() => handleSaveSection("Branding & Appearance", { appearance: settings.appearance })}
                        disabled={savingSection === "Branding & Appearance" || isViewer}
                        className="w-full py-4 bg-primary text-white font-black rounded-[1.5rem] hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 transition-all flex items-center justify-center gap-3 text-[11px] uppercase tracking-widest shadow-lg shadow-primary/20"
                      >
                        {savingSection === "Branding & Appearance" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        Save Appearance
                      </button>
                    </div>
                  </div>

                  {/* RIGHT COLUMN: Mobile Preview Mockup */}
                  <div className="lg:col-span-4 sticky top-12 z-20 hidden lg:block">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-8 h-8 rounded-lg bg-violet-500/20 flex items-center justify-center">
                        <Smartphone className="w-4 h-4 text-violet-400" />
                      </div>
                      <h3 className="text-[10px] font-black text-white uppercase tracking-[0.4em] opacity-50">Real-time Preview</h3>
                    </div>

                    <div className="relative mx-auto w-full max-w-[320px] aspect-[9/19.5] rounded-[3.5rem] border-[10px] border-black shadow-2xl overflow-hidden ring-1 ring-white/10 bg-black">
                      {/* Notch */}
                      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-7 bg-black rounded-b-2xl z-50 shadow-xl" />

                      {/* Mockup Screen Content */}
                      <div
                        className={cn(
                          "absolute inset-0 transition-colors duration-700 overflow-y-auto hide-scrollbar relative",
                          settings.appearance.bg_pattern_enabled && "bg-wood-pattern"
                        )}
                        style={{ backgroundColor: previewMode === 'dark' ? settings.appearance.color_background_dark : settings.appearance.color_background }}
                      >
                        {/* Navbar Mockup - High Fidelity RTL */}
                        <div
                          className="sticky top-0 z-40 p-4 flex items-center justify-between backdrop-blur-md border-b"
                          dir="rtl"
                          style={{
                            backgroundColor: previewMode === 'dark' ? `${settings.appearance.color_background_dark}F2` : `${settings.appearance.color_background}F2`,
                            borderColor: 'rgba(255,255,255,0.05)'
                          }}
                        >
                          <div className="flex items-center gap-2">
                            <div className="h-8 px-2 rounded-full border flex items-center justify-center gap-1" style={{ backgroundColor: 'var(--surface)', borderColor: 'rgba(255,255,255,0.05)' }}>
                              <Globe size={10} className="text-white/40" />
                              <span className="text-[8px] font-black text-white/40">AR</span>
                            </div>
                            <div className="w-8 h-8 rounded-full border flex items-center justify-center" style={{ backgroundColor: 'var(--surface)', borderColor: 'rgba(255,255,255,0.05)' }}>
                              {previewMode === 'dark' ? <Sun size={12} style={{ color: settings.appearance.color_primary }} /> : <Moon size={12} style={{ color: settings.appearance.color_primary }} />}
                            </div>
                          </div>

                          <div className="h-10 w-auto">
                            {settings.catalog.logo_url ? (
                              <img src={settings.catalog.logo_url} className="h-full w-auto object-contain" style={{ filter: `drop-shadow(0 0 5px ${settings.appearance.color_primary}80)` }} />
                            ) : (
                              <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: settings.appearance.color_primary }}>
                                <Info size={14} className="text-white" />
                              </div>
                            )}
                          </div>

                          <div className="w-8 h-8 rounded-full border flex items-center justify-center" style={{ backgroundColor: 'var(--surface)', borderColor: 'rgba(255,255,255,0.05)' }}>
                            <Home size={14} style={{ color: settings.appearance.color_primary }} />
                          </div>
                        </div>

                        {/* Content Mockup - Category Grid Fidelity */}
                        <div className="p-6 space-y-6" dir="rtl">
                          <h1 className="text-2xl font-black text-right pr-2" style={{ color: previewMode === 'dark' ? settings.appearance.color_text_dark : settings.appearance.color_text }}>الأقسام</h1>

                          <div className="grid grid-cols-2 gap-4">
                            {[
                              { name: 'الأطباق الرئيسية' },
                              { name: 'المقبلات' },
                              { name: 'الحلويات' },
                              { name: 'المشروبات' }
                            ].map((cat, i) => (
                              <div
                                key={i}
                                className="p-8 rounded-[2rem] flex flex-col items-center gap-5 border transition-all shadow-sm group"
                                style={{
                                  backgroundColor: previewMode === 'dark' ? settings.appearance.color_surface_dark : settings.appearance.color_surface,
                                  borderColor: 'rgba(255,255,255,0.05)'
                                }}
                              >
                                <div
                                  className="w-12 h-12 rounded-full flex items-center justify-center transition-all shadow-md"
                                  style={{
                                    backgroundColor: `${settings.appearance.color_primary}15`,
                                    color: settings.appearance.color_primary,
                                  }}
                                >
                                  <Utensils size={22} strokeWidth={1.5} />
                                </div>
                                <span
                                  className="font-black text-[11px] text-center tracking-tight"
                                  style={{ color: previewMode === 'dark' ? settings.appearance.color_text_dark : settings.appearance.color_text }}
                                >
                                  {cat.name}
                                </span>
                              </div>
                            ))}
                          </div>

                          {/* Footer Simulation */}
                          <div
                            className="mt-12 p-8 rounded-[3rem] border text-center space-y-5"
                            style={{
                              backgroundColor: previewMode === 'dark' ? settings.appearance.color_surface_dark : settings.appearance.color_surface,
                              borderColor: 'rgba(255,255,255,0.05)'
                            }}
                          >
                            <div className="w-3/4 h-2.5 rounded-full opacity-20 mx-auto" style={{ backgroundColor: previewMode === 'dark' ? settings.appearance.color_text_dark : settings.appearance.color_text }} />
                            <div className="w-1/2 h-2.5 rounded-full opacity-10 mx-auto" style={{ backgroundColor: previewMode === 'dark' ? settings.appearance.color_text_dark : settings.appearance.color_text }} />
                            <div className="pt-4 flex justify-center gap-4">
                              {[1, 2, 3].map(i => (
                                <div key={i} className="w-10 h-10 rounded-full border shadow-sm flex items-center justify-center" style={{ backgroundColor: 'var(--surface)', borderColor: 'rgba(255,255,255,0.05)' }}>
                                  <div className="w-5 h-5 rounded-full bg-white/5" />
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-8 p-6 bg-white/[0.03] border border-white/10 rounded-3xl">
                      <p className="text-[9px] font-black text-white/30 uppercase tracking-widest leading-relaxed text-center">
                        This is a simulated preview. Actual rendering may vary slightly per device but will strictly follow your brand colors.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Contact Array */}
              {activeTab === "contact" && (
                <div className="space-y-8">
                  <div className="glass-card p-10 space-y-10">
                    <h3 className="text-[11px] font-black text-white uppercase tracking-[0.3em] opacity-50">Contact Information</h3>
                    <div className="grid md:grid-cols-2 gap-8">
                      <div className="space-y-4">
                        <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] ml-2 block">Primary Phone</label>
                        <input
                          type="tel"
                          value={settings.contact.phone_primary || ""}
                          onChange={(e) => updateSettings("contact", "phone_primary", e.target.value)}
                          className="w-full px-6 py-4 bg-white/[0.03] border border-white/5 rounded-2xl text-white font-black tracking-tight focus:outline-none focus:border-primary/50 transition-all"
                          placeholder="+000 00 000 000"
                        />
                      </div>
                      <div className="space-y-4">
                        <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] ml-2 block">WhatsApp Number</label>
                        <input
                          type="tel"
                          value={settings.contact.phone_whatsapp || ""}
                          onChange={(e) => updateSettings("contact", "phone_whatsapp", e.target.value)}
                          className="w-full px-6 py-4 bg-white/[0.03] border border-white/5 rounded-2xl text-white font-black tracking-tight focus:outline-none focus:border-primary/50 transition-all font-mono"
                          placeholder="e.g. +96170123456"
                        />
                      </div>
                    </div>

                    <div className="space-y-4 pt-4">
                      <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] ml-2 block">Email Address</label>
                      <input
                        type="email"
                        value={settings.contact.email || ""}
                        onChange={(e) => updateSettings("contact", "email", e.target.value)}
                        className="w-full px-6 py-4 bg-white/[0.03] border border-white/5 rounded-2xl text-white font-black tracking-tight focus:outline-none focus:border-primary/50 transition-all"
                        placeholder="email@example.com"
                      />
                    </div>
                  </div>

                  <div className="glass-card p-10 space-y-10">
                    <h3 className="text-[11px] font-black text-white uppercase tracking-[0.3em] opacity-50">Business Address</h3>

                    <div className="space-y-8">
                      {/* Address Matrix */}
                      <div className="space-y-4">
                        <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] ml-2">Physical Address</label>
                        <div className="grid gap-4">
                          {[
                            { id: 'en', label: 'English', field: 'address_en' },
                            { id: 'ar', label: 'Arabic', field: 'address_ar', rtl: true },
                            { id: 'fr', label: 'French', field: 'address_fr' }
                          ].map(locale => (
                            <div key={locale.id} className="relative flex items-center bg-white/[0.02] border border-white/5 rounded-2xl px-6 py-4 group focus-within:border-primary/40 transition-all">
                              <span className="text-[9px] font-black text-white/20 uppercase tracking-widest w-24 flex-shrink-0">{locale.label}</span>
                              <input
                                type="text"
                                value={settings.contact[locale.field as keyof Settings['contact']] || ""}
                                onChange={(e) => updateSettings("contact", locale.field, e.target.value)}
                                className={`flex-1 bg-transparent border-0 text-white font-black tracking-tight focus:ring-0 text-sm ${locale.rtl ? 'text-right' : ''}`}
                                dir={locale.rtl ? 'rtl' : 'ltr'}
                                placeholder={`Enter address in ${locale.label}...`}
                              />
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Map Matrix */}
                      <div className="space-y-4 pt-6">
                        <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] ml-2 block">Google Maps Embed URL</label>
                        <input
                          type="url"
                          value={settings.contact.google_map_iframe_url || ""}
                          onChange={(e) => updateSettings("contact", "google_map_iframe_url", e.target.value)}
                          className="w-full px-6 py-4 bg-white/[0.03] border border-white/5 rounded-2xl text-white font-black tracking-tight focus:outline-none focus:border-primary/50 transition-all font-mono text-xs"
                          placeholder="https://www.google.com/maps/embed?pb=..."
                        />
                      </div>
                    </div>

                    <div className="mt-8 pt-8 border-t border-white/5">
                      <button
                        onClick={() => handleSaveSection("Contact Information", { contact: settings.contact })}
                        disabled={savingSection === "Contact Information" || isViewer}
                        className="w-full py-4 bg-primary text-white font-black rounded-[1.5rem] hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 transition-all flex items-center justify-center gap-3 text-[11px] uppercase tracking-widest shadow-lg shadow-primary/20"
                      >
                        {savingSection === "Contact Information" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        Save Contact Details
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Features Array */}
              {activeTab === "features" && (
                <div className="space-y-8">
                  <div className="glass-card p-10 space-y-6">
                    <h3 className="text-[11px] font-black text-white uppercase tracking-[0.3em] mb-10 opacity-50">Feature Toggles</h3>
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
                      label="Live Chat Support"
                      description="Display a live chat widget on your catalog"
                      checked={settings.features.live_chat_enabled}
                      onChange={(v) => updateSettings("features", "live_chat_enabled", v)}
                    />
                    <ToggleSwitch
                      label="AI Waiter Assistant"
                      description="Enable the AI Waiter to help customers with menu questions"
                      checked={settings.features.ai_waiter_enabled}
                      onChange={(v) => updateSettings("features", "ai_waiter_enabled", v)}
                    />
                  </div>

                  <div className="glass-card p-10">
                    <h3 className="text-[11px] font-black text-white uppercase tracking-[0.3em] mb-10 opacity-50">Button Labels (Localization)</h3>
                    <div className="space-y-12">
                      {[
                        { id: 'cta_menu_label', title: 'Menu Button Label' },
                        { id: 'cta_booking_label', title: 'Reservation Button Label' },
                        { id: 'cta_order_label', title: 'Order Button Label' }
                      ].map(section => (
                        <div key={section.id} className="space-y-6">
                          <h4 className="text-[9px] font-black text-white/20 uppercase tracking-[0.2em] border-b border-white/5 pb-2">{section.title}</h4>
                          <div className="grid md:grid-cols-3 gap-6">
                            {['en', 'ar', 'fr'].map(lang => (
                              <div key={lang} className="space-y-2">
                                <label className="text-[8px] font-black text-white/40 uppercase tracking-widest ml-1">{lang}</label>
                                <input
                                  type="text"
                                  value={settings.cta[`${section.id}_${lang}` as keyof Settings['cta']] || ""}
                                  onChange={(e) => updateSettings("cta", `${section.id}_${lang}`, e.target.value)}
                                  className="w-full px-4 py-3 bg-white/[0.03] border border-white/5 rounded-xl text-white font-black tracking-tight focus:outline-none focus:border-primary/50 transition-all text-xs"
                                  dir={lang === 'ar' ? 'rtl' : 'ltr'}
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="mt-8 pt-8 border-t border-white/5">
                      <button
                        onClick={() => handleSaveSection("Features & Labels", { features: settings.features, cta: settings.cta })}
                        disabled={savingSection === "Features & Labels" || isViewer}
                        className="w-full py-4 bg-primary text-white font-black rounded-[1.5rem] hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 transition-all flex items-center justify-center gap-3 text-[11px] uppercase tracking-widest shadow-lg shadow-primary/20"
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
                  <div className="glass-card p-10 space-y-10">
                    <h3 className="text-[11px] font-black text-white uppercase tracking-[0.3em] opacity-50">AI Waiter Persona</h3>
                    <div className="grid md:grid-cols-2 gap-8">
                      <div className="space-y-4">
                        <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] ml-2">AI Identity (Name)</label>
                        <div className="relative">
                          <BotIcon className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-primary" />
                          <input
                            type="text"
                            value={settings.features.ai_waiter_name || ""}
                            onChange={(e) => updateSettings("features", "ai_waiter_name", e.target.value)}
                            className="w-full pl-14 pr-6 py-5 bg-white/[0.03] border border-white/5 rounded-2xl text-white font-black tracking-tight focus:outline-none focus:border-primary/50"
                            placeholder="e.g. Sarah"
                          />
                        </div>
                      </div>
                      <div className="space-y-4">
                        <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] ml-2">Tone & Behavior (Persona)</label>
                        <textarea
                          value={settings.features.ai_waiter_persona || ""}
                          onChange={(e) => updateSettings("features", "ai_waiter_persona", e.target.value)}
                          className="w-full px-6 py-4 bg-white/[0.03] border border-white/5 rounded-2xl text-white font-medium text-sm h-24 focus:outline-none focus:border-primary/50"
                          placeholder="e.g. You are a charming, luxury restaurant waiter who is very formal and knowledgeable about wine."
                        />
                      </div>
                    </div>
                    <div className="p-8 bg-violet-500/5 border border-violet-500/10 rounded-3xl flex items-center gap-6">
                      <div className="w-12 h-12 bg-violet-500 rounded-2xl flex items-center justify-center text-white">
                        <SparklesIcon className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-violet-400 uppercase tracking-widest">AI Status</p>
                        <p className="text-white/40 text-[10px] font-medium leading-relaxed mt-1">
                          {settings.features.ai_waiter_enabled
                            ? "Your AI assistant is currently active and helping customers."
                            : "AI Assistant is currently disabled. Toggle it on in the Features tab."}
                        </p>
                      </div>
                    </div>

                    <div className="mt-8 pt-8 border-t border-white/5">
                      <button
                        onClick={() => handleSaveSection("AI Persona", { features: settings.features })}
                        disabled={savingSection === "AI Persona" || isViewer}
                        className="w-full py-4 bg-primary text-white font-black rounded-[1.5rem] hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 transition-all flex items-center justify-center gap-3 text-[11px] uppercase tracking-widest shadow-lg shadow-primary/20"
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
          <div className="text-center py-32 glass rounded-[3rem] border border-white/5">
            <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto mb-6" />
            <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em]">
              Loading settings...
            </p>
          </div>
        )}
      </CatalogAdminContent>
    </CatalogAdminShell>
  );
}
