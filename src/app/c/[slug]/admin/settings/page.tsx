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
        setMessage({ type: "success", text: "Settings saved successfully!" });
      } else {
        throw new Error("Failed to save");
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

    // Check if it's an image
    if (!isImageFile(file)) {
      setMessage({ type: "error", text: "Please select an image file" });
      return;
    }

    setUploadProgress("Compressing image...");

    try {
      // Compress the image before upload
      const result = await compressImage(file, {
        maxSizeMB: 2,
        maxWidthOrHeight: 2048,
        quality: 0.85,
      });

      if (result.wasCompressed) {
        setUploadProgress(
          `Compressed: ${formatBytes(result.originalSize)} → ${formatBytes(
            result.compressedSize
          )} (${Math.round((1 - 1 / result.compressionRatio) * 100)}% smaller)`
        );
      } else {
        setUploadProgress("Uploading...");
      }

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
        setMessage({ type: "success", text: "Image uploaded successfully!" });
      } else {
        throw new Error("Upload failed");
      }
    } catch (error) {
      console.error("Failed to upload image:", error);
      setMessage({ type: "error", text: "Failed to upload image" });
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
    <div>
      <label className="block text-sm font-medium text-slate-300 mb-2">
        {label}
      </label>
      <div className="flex gap-2">
        <input
          type="color"
          value={value || "#000000"}
          onChange={(e) => onChange(e.target.value)}
          className="w-12 h-10 rounded-lg cursor-pointer border-0"
        />
        <input
          type="text"
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 px-4 py-2 bg-slate-900/50 border border-slate-600/50 rounded-xl text-white font-mono text-sm focus:outline-none"
          placeholder="#000000"
        />
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
      className="flex items-center justify-between p-4 bg-slate-800/50 rounded-xl cursor-pointer hover:bg-slate-700/50 transition-colors"
      onClick={() => onChange(!checked)}
    >
      <div>
        <p className="font-medium text-white">{label}</p>
        {description && <p className="text-sm text-slate-400">{description}</p>}
      </div>
      {checked ? (
        <ToggleRight
          className="w-8 h-8"
          style={{ color: "var(--color-primary)" }}
        />
      ) : (
        <ToggleLeft className="w-8 h-8 text-slate-500" />
      )}
    </div>
  );

  return (
    <CatalogAdminShell>
      <CatalogAdminHeader title="Settings">
        <button
          onClick={handleSave}
          disabled={saving || loading}
          className="flex items-center gap-2 px-4 py-2 text-white rounded-xl font-medium transition-all disabled:opacity-50"
          style={{
            background: `linear-gradient(135deg, var(--color-primary) 0%, var(--color-secondary) 100%)`,
          }}
        >
          {saving ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-5 h-5" />
              Save Changes
            </>
          )}
        </button>
      </CatalogAdminHeader>

      <CatalogAdminContent>
        {message && (
          <div
            className={`mb-6 px-4 py-3 rounded-xl ${
              message.type === "success"
                ? "bg-green-500/10 text-green-400 border border-green-500/20"
                : "bg-red-500/10 text-red-400 border border-red-500/20"
            }`}
          >
            {message.text}
          </div>
        )}

        {loading ? (
          <div className="animate-pulse space-y-4">
            <div className="h-10 bg-slate-700 rounded w-1/3" />
            <div className="h-64 bg-slate-700 rounded" />
          </div>
        ) : settings ? (
          <div className="space-y-6">
            {/* Tabs */}
            <div className="flex gap-2 border-b border-slate-700/50 pb-4">
              {[
                { id: "appearance", label: "Appearance", icon: Palette },
                { id: "contact", label: "Contact", icon: Phone },
                { id: "features", label: "Features", icon: ToggleRight },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all ${
                    activeTab === tab.id
                      ? "text-white"
                      : "text-slate-400 hover:text-white hover:bg-slate-700/50"
                  }`}
                  style={
                    activeTab === tab.id
                      ? {
                          backgroundColor:
                            "color-mix(in srgb, var(--color-primary) 20%, transparent)",
                          color: "var(--color-primary)",
                        }
                      : undefined
                  }
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Appearance Tab */}
            {activeTab === "appearance" && (
              <div className="space-y-6">
                {/* Logo & Hero */}
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50">
                    <h3 className="font-semibold text-white mb-4">Logo</h3>
                    {settings.catalog.logo_url ? (
                      <div className="relative w-24 h-24 rounded-xl overflow-hidden">
                        <Image
                          src={settings.catalog.logo_url}
                          alt="Logo"
                          fill
                          className="object-cover"
                        />
                        <button
                          onClick={() =>
                            updateSettings("catalog", "logo_url", "")
                          }
                          className="absolute top-1 right-1 p-1 bg-red-500 rounded-full"
                        >
                          <X className="w-3 h-3 text-white" />
                        </button>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center justify-center w-24 h-24 border-2 border-dashed border-slate-600 rounded-xl cursor-pointer hover:border-slate-500">
                        <Upload className="w-6 h-6 text-slate-400" />
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) =>
                            handleImageUpload(e, "catalog", "logo_url")
                          }
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>

                  <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50">
                    <h3 className="font-semibold text-white mb-4">
                      Hero Image
                    </h3>
                    {settings.appearance.hero_image_url ? (
                      <div className="relative h-32 rounded-xl overflow-hidden">
                        <Image
                          src={settings.appearance.hero_image_url}
                          alt="Hero"
                          fill
                          className="object-cover"
                        />
                        <button
                          onClick={() =>
                            updateSettings("appearance", "hero_image_url", "")
                          }
                          className="absolute top-2 right-2 p-1 bg-red-500 rounded-full"
                        >
                          <X className="w-4 h-4 text-white" />
                        </button>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center justify-center h-32 border-2 border-dashed border-slate-600 rounded-xl cursor-pointer hover:border-slate-500">
                        <Upload className="w-8 h-8 text-slate-400 mb-2" />
                        <span className="text-sm text-slate-400">
                          Upload hero image
                        </span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) =>
                            handleImageUpload(e, "appearance", "hero_image_url")
                          }
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>
                </div>

                {/* Colors */}
                <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50">
                  <h3 className="font-semibold text-white mb-4">
                    Color Palette
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <ColorInput
                      label="Primary"
                      value={settings.appearance.color_primary}
                      onChange={(v) =>
                        updateSettings("appearance", "color_primary", v)
                      }
                    />
                    <ColorInput
                      label="Secondary"
                      value={settings.appearance.color_secondary}
                      onChange={(v) =>
                        updateSettings("appearance", "color_secondary", v)
                      }
                    />
                    <ColorInput
                      label="Accent"
                      value={settings.appearance.color_accent}
                      onChange={(v) =>
                        updateSettings("appearance", "color_accent", v)
                      }
                    />
                    <ColorInput
                      label="Background"
                      value={settings.appearance.color_background}
                      onChange={(v) =>
                        updateSettings("appearance", "color_background", v)
                      }
                    />
                  </div>
                </div>

                {/* Background Pattern */}
                <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50">
                  <ToggleSwitch
                    label="Background Pattern"
                    description="Show decorative pattern on background"
                    checked={settings.appearance.bg_pattern_enabled}
                    onChange={(v) =>
                      updateSettings("appearance", "bg_pattern_enabled", v)
                    }
                  />
                  {settings.appearance.bg_pattern_enabled && (
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Pattern Type
                      </label>
                      <select
                        value={
                          settings.appearance.bg_pattern_type || "geometric"
                        }
                        onChange={(e) =>
                          updateSettings(
                            "appearance",
                            "bg_pattern_type",
                            e.target.value
                          )
                        }
                        className="px-4 py-2 bg-slate-900/50 border border-slate-600/50 rounded-xl text-white focus:outline-none"
                      >
                        <option value="geometric">Geometric</option>
                        <option value="dots">Dots</option>
                        <option value="lines">Lines</option>
                      </select>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Contact Tab */}
            {activeTab === "contact" && (
              <div className="space-y-6">
                <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50 space-y-4">
                  <h3 className="font-semibold text-white mb-2">
                    Phone Numbers
                  </h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Primary Phone
                      </label>
                      <input
                        type="tel"
                        value={settings.contact.phone_primary || ""}
                        onChange={(e) =>
                          updateSettings(
                            "contact",
                            "phone_primary",
                            e.target.value
                          )
                        }
                        className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600/50 rounded-xl text-white focus:outline-none"
                        placeholder="+1 234 567 8900"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        WhatsApp Number
                      </label>
                      <input
                        type="tel"
                        value={settings.contact.phone_whatsapp || ""}
                        onChange={(e) =>
                          updateSettings(
                            "contact",
                            "phone_whatsapp",
                            e.target.value
                          )
                        }
                        className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600/50 rounded-xl text-white focus:outline-none"
                        placeholder="+1234567890 (no spaces)"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      value={settings.contact.email || ""}
                      onChange={(e) =>
                        updateSettings("contact", "email", e.target.value)
                      }
                      className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600/50 rounded-xl text-white focus:outline-none"
                      placeholder="contact@business.com"
                    />
                  </div>
                </div>

                <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50 space-y-4">
                  <h3 className="font-semibold text-white mb-2">Address</h3>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Address
                    </label>
                    <div className="space-y-3">
                      <div className="flex gap-2 items-center">
                        <span className="w-8 text-xs text-slate-500 uppercase">EN</span>
                        <input
                          type="text"
                          value={settings.contact.address_en || ""}
                          onChange={(e) =>
                            updateSettings("contact", "address_en", e.target.value)
                          }
                          className="flex-1 px-4 py-3 bg-slate-900/50 border border-slate-600/50 rounded-xl text-white focus:outline-none"
                          placeholder="Address (English)"
                        />
                      </div>
                      <div className="flex gap-2 items-center">
                        <span className="w-8 text-xs text-slate-500 uppercase">AR</span>
                        <input
                          type="text"
                          value={settings.contact.address_ar || ""}
                          onChange={(e) =>
                            updateSettings("contact", "address_ar", e.target.value)
                          }
                          className="flex-1 px-4 py-3 bg-slate-900/50 border border-slate-600/50 rounded-xl text-white focus:outline-none"
                          placeholder="Address (Arabic)"
                          dir="rtl"
                        />
                      </div>
                      <div className="flex gap-2 items-center">
                        <span className="w-8 text-xs text-slate-500 uppercase">FR</span>
                        <input
                          type="text"
                          value={settings.contact.address_fr || ""}
                          onChange={(e) =>
                            updateSettings("contact", "address_fr", e.target.value)
                          }
                          className="flex-1 px-4 py-3 bg-slate-900/50 border border-slate-600/50 rounded-xl text-white focus:outline-none"
                          placeholder="Address (French)"
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      City
                    </label>
                    <div className="space-y-3">
                      <div className="flex gap-2 items-center">
                        <span className="w-8 text-xs text-slate-500 uppercase">EN</span>
                        <input
                          type="text"
                          value={settings.contact.city_en || ""}
                          onChange={(e) =>
                            updateSettings("contact", "city_en", e.target.value)
                          }
                          className="flex-1 px-4 py-3 bg-slate-900/50 border border-slate-600/50 rounded-xl text-white focus:outline-none"
                          placeholder="City (English)"
                        />
                      </div>
                      <div className="flex gap-2 items-center">
                        <span className="w-8 text-xs text-slate-500 uppercase">AR</span>
                        <input
                          type="text"
                          value={settings.contact.city_ar || ""}
                          onChange={(e) =>
                            updateSettings("contact", "city_ar", e.target.value)
                          }
                          className="flex-1 px-4 py-3 bg-slate-900/50 border border-slate-600/50 rounded-xl text-white focus:outline-none"
                          placeholder="City (Arabic)"
                          dir="rtl"
                        />
                      </div>
                      <div className="flex gap-2 items-center">
                        <span className="w-8 text-xs text-slate-500 uppercase">FR</span>
                        <input
                          type="text"
                          value={settings.contact.city_fr || ""}
                          onChange={(e) =>
                            updateSettings("contact", "city_fr", e.target.value)
                          }
                          className="flex-1 px-4 py-3 bg-slate-900/50 border border-slate-600/50 rounded-xl text-white focus:outline-none"
                          placeholder="City (French)"
                        />
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Google Maps Embed URL
                    </label>
                    <input
                      type="url"
                      value={settings.contact.google_map_iframe_url || ""}
                      onChange={(e) =>
                        updateSettings(
                          "contact",
                          "google_map_iframe_url",
                          e.target.value
                        )
                      }
                      className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600/50 rounded-xl text-white focus:outline-none"
                      placeholder="https://www.google.com/maps/embed?pb=..."
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Features Tab */}
            {activeTab === "features" && (
              <div className="space-y-4">
                <ToggleSwitch
                  label="WhatsApp Ordering"
                  description="Allow customers to order via WhatsApp"
                  checked={settings.features.whatsapp_order_enabled}
                  onChange={(v) =>
                    updateSettings("features", "whatsapp_order_enabled", v)
                  }
                />
                <ToggleSwitch
                  label="Table Booking"
                  description="Show booking/reservation button"
                  checked={settings.features.booking_enabled}
                  onChange={(v) =>
                    updateSettings("features", "booking_enabled", v)
                  }
                />
                <ToggleSwitch
                  label="Live Chat"
                  description="Enable live chat widget"
                  checked={settings.features.live_chat_enabled}
                  onChange={(v) =>
                    updateSettings("features", "live_chat_enabled", v)
                  }
                />

                {/* CTA Labels */}
                <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50 space-y-4 mt-6">
                  <h3 className="font-semibold text-white mb-2">
                    Button Labels
                  </h3>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Menu Button
                    </label>
                    <input
                      type="text"
                      value={settings.cta.cta_menu_label_en || ""}
                      onChange={(e) =>
                        updateSettings(
                          "cta",
                          "cta_menu_label_en",
                          e.target.value
                        )
                      }
                      className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600/50 rounded-xl text-white focus:outline-none"
                      placeholder="View Menu"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Booking Button
                    </label>
                    <input
                      type="text"
                      value={settings.cta.cta_booking_label_en || ""}
                      onChange={(e) =>
                        updateSettings(
                          "cta",
                          "cta_booking_label_en",
                          e.target.value
                        )
                      }
                      className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600/50 rounded-xl text-white focus:outline-none"
                      placeholder="Book a Table"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Order Button
                    </label>
                    <input
                      type="text"
                      value={settings.cta.cta_order_label_en || ""}
                      onChange={(e) =>
                        updateSettings(
                          "cta",
                          "cta_order_label_en",
                          e.target.value
                        )
                      }
                      className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600/50 rounded-xl text-white focus:outline-none"
                      placeholder="Order via WhatsApp"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center text-slate-500 py-12">
            Failed to load settings
          </div>
        )}
      </CatalogAdminContent>
    </CatalogAdminShell>
  );
}
