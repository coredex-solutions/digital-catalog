"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import { CatalogAdminShell } from "../_components/CatalogAdminShell";
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
  ToggleLeft,
  ToggleRight,
  ImageIcon,
} from "lucide-react";
import {
  compressImage,
  formatBytes,
  isImageFile,
} from "@/utils/image-compression";

interface Settings {
  catalog: {
    name: string;
    description: string;
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
  };
  features: {
    booking_enabled: boolean;
    whatsapp_order_enabled: boolean;
    live_chat_enabled: boolean;
    ai_waiter_enabled: boolean;
  };
  cta: {
    cta_menu_label_en: string;
    cta_booking_label_en: string;
    cta_order_label_en: string;
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
}

export default function SettingsPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "appearance" | "contact" | "features"
  >("appearance");
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      const token = localStorage.getItem(`catalog_admin_token_${slug}`);
      if (!token) return;

      try {
        const res = await fetch(`/api/c/${slug}/admin/settings`, {
          headers: { Authorization: `Bearer ${token}` },
        });

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

    fetchSettings();
  }, [slug]);

  const handleSave = async () => {
    if (!settings) return;

    setSaving(true);
    setMessage(null);

    try {
      const token = localStorage.getItem(`catalog_admin_token_${slug}`);
      const res = await fetch(`/api/c/${slug}/admin/settings`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(settings),
      });

      if (res.ok) {
        setMessage({ type: "success", text: "Settings saved successfully" });
      } else {
        throw new Error("Failed to save settings");
      }
    } catch (error: any) {
      setMessage({ type: "error", text: error.message });
    } finally {
      setSaving(false);
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
    e: React.ChangeEvent<HTMLInputElement>,
    section: keyof Settings,
    field: string
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!isImageFile(file)) {
      setMessage({ type: "error", text: "Invalid file: Image required" });
      return;
    }

    setUploadProgress("Processing Image...");

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
      <CatalogAdminHeader title="Settings">
        <button
          onClick={handleSave}
          disabled={saving || loading}
          className="group relative flex items-center gap-3 px-8 py-3 bg-primary text-white rounded-2xl hover:shadow-[0_0_30px_rgba(124,58,237,0.4)] transition-all duration-500 font-black text-[11px] uppercase tracking-widest overflow-hidden shadow-lg shadow-primary/10"
        >
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Saving Changes...
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              Save Settings
            </>
          )}
        </button>
      </CatalogAdminHeader>

      <CatalogAdminContent>
        {message && (
          <div
            className={`mb-8 px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest border animate-in slide-in-from-top-4 duration-500 ${
              message.type === "success"
                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                : "bg-red-500/10 text-red-400 border-red-500/20"
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
            <div className="flex gap-4 p-2 bg-white/[0.02] border border-white/5 rounded-[2.5rem] w-fit">
              {[
                { id: "appearance", label: "Appearance", icon: Palette },
                { id: "contact", label: "Contact Info", icon: Phone },
                { id: "features", label: "Features", icon: ToggleRight },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-3 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${
                    activeTab === tab.id
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
                <div className="space-y-8">
                  <div className="grid md:grid-cols-2 gap-8">
                    <div className="glass-card p-10">
                      <h3 className="text-[11px] font-black text-white uppercase tracking-[0.3em] mb-8 opacity-50">Catalog Logo</h3>
                      <div className="relative group/logo">
                        {settings.catalog.logo_url ? (
                          <div className="relative w-40 h-40 mx-auto rounded-[2.5rem] overflow-hidden border border-white/10 shadow-2xl transition-transform duration-500 group-hover/logo:scale-105">
                            <Image
                              src={settings.catalog.logo_url}
                              alt="Logo"
                              fill
                              className="object-cover"
                            />
                            <button
                              onClick={() => updateSettings("catalog", "logo_url", "")}
                              className="absolute top-2 right-2 w-10 h-10 bg-red-500 rounded-2xl flex items-center justify-center opacity-0 group-hover/logo:opacity-100 transition-opacity"
                            >
                              <X className="w-4 h-4 text-white" />
                            </button>
                          </div>
                        ) : (
                          <label className="flex flex-col items-center justify-center w-40 h-40 mx-auto border-2 border-dashed border-white/5 rounded-[2.5rem] cursor-pointer hover:border-primary/40 hover:bg-primary/5 transition-all duration-500 group">
                            <Upload className="w-8 h-8 text-white/10 transition-colors group-hover:text-primary" />
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => handleImageUpload(e, "catalog", "logo_url")}
                              className="hidden"
                            />
                          </label>
                        )}
                      </div>
                    </div>

                    <div className="glass-card p-10">
                      <h3 className="text-[11px] font-black text-white uppercase tracking-[0.3em] mb-8 opacity-50">Hero Image</h3>
                      <div className="relative group/hero">
                        {settings.appearance.hero_image_url ? (
                          <div className="relative h-40 rounded-[2.5rem] overflow-hidden border border-white/10 shadow-2xl">
                            <Image
                              src={settings.appearance.hero_image_url}
                              alt="Hero"
                              fill
                              className="object-cover"
                            />
                            <button
                              onClick={() => updateSettings("appearance", "hero_image_url", "")}
                              className="absolute top-4 right-4 w-10 h-10 bg-red-500 rounded-2xl flex items-center justify-center opacity-0 group-hover/hero:opacity-100 transition-opacity"
                            >
                              <X className="w-4 h-4 text-white" />
                            </button>
                          </div>
                        ) : (
                          <label className="flex flex-col items-center justify-center h-40 border-2 border-dashed border-white/5 rounded-[2.5rem] cursor-pointer hover:border-primary/40 hover:bg-primary/5 transition-all duration-500 group">
                            <Upload className="w-8 h-8 text-white/10 mb-2 group-hover:text-primary" />
                            <span className="text-[9px] font-black text-white/20 uppercase tracking-[0.2em]">Upload Hero Image</span>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => handleImageUpload(e, "appearance", "hero_image_url")}
                              className="hidden"
                            />
                          </label>
                        )}
                      </div>
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
                              className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border ${
                                settings.appearance.bg_pattern_type === type 
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
                                placeholder="Enter address..."
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
                    <h3 className="text-[11px] font-black text-white uppercase tracking-[0.3em] mb-10 opacity-50">Button Labels</h3>
                    <div className="grid md:grid-cols-3 gap-8">
                       {[
                         { id: 'cta_menu_label_en', label: 'View Menu Label' },
                         { id: 'cta_booking_label_en', label: 'Book Now Label' },
                         { id: 'cta_order_label_en', label: 'Order Now Label' }
                       ].map(cta => (
                        <div key={cta.id} className="space-y-4">
                          <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] ml-2 block">{cta.label}</label>
                          <input
                            type="text"
                            value={settings.cta[cta.id as keyof Settings['cta']] || ""}
                            onChange={(e) => updateSettings("cta", cta.id, e.target.value)}
                            className="w-full px-6 py-4 bg-white/[0.03] border border-white/5 rounded-2xl text-white font-black tracking-tight focus:outline-none focus:border-primary/50 transition-all uppercase text-xs tracking-widest"
                            placeholder="e.g. View Menu"
                          />
                        </div>
                       ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center py-32 glass rounded-[3rem] border border-white/5">
               <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto mb-6" />
               <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em]">Loading settings...</p>
          </div>
        )}
      </CatalogAdminContent>
    </CatalogAdminShell>
  );
}
