"use client";

import { useEffect, useState } from "react";
import { SuperAdminShell } from "../_components/SuperAdminShell";
import { SuperAdminHeader, SuperAdminContent } from "../_components/SuperAdminSidebar";
import {
  Settings,
  Save,
  Loader2,
  Globe,
  Mail,
  Shield,
  Palette,
  Database,
  Bell,
  Key,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";

interface PlatformSettings {
  platform_name: string;
  platform_email: string;
  support_email: string;
  default_language: string;
  maintenance_mode: boolean;
  registration_enabled: boolean;
  trial_days: number;
  max_categories_free: number;
  max_items_free: number;
  smtp_host: string;
  smtp_port: number;
  smtp_user: string;
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<PlatformSettings>({
    platform_name: "Digital Menu Platform",
    platform_email: "admin@platform.com",
    support_email: "support@platform.com",
    default_language: "en",
    maintenance_mode: false,
    registration_enabled: true,
    trial_days: 14,
    max_categories_free: 3,
    max_items_free: 15,
    smtp_host: "",
    smtp_port: 587,
    smtp_user: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const token = localStorage.getItem("superadmin_token");
      const res = await fetch("/api/superadmin/settings", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.settings) {
          setSettings(data.settings);
        }
      }
    } catch (error) {
      console.error("Failed to fetch settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);

    try {
      const token = localStorage.getItem("superadmin_token");
      const res = await fetch("/api/superadmin/settings", {
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
        throw new Error("Failed to save settings");
      }
    } catch (error: any) {
      setMessage({ type: "error", text: error.message });
    } finally {
      setSaving(false);
    }
  };

  const updateSetting = (key: keyof PlatformSettings, value: any) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
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
    <div className="flex items-center justify-between py-3">
      <div>
        <p className="font-medium text-white">{label}</p>
        {description && (
          <p className="text-sm text-slate-400">{description}</p>
        )}
      </div>
      <button onClick={() => onChange(!checked)}>
        {checked ? (
          <ToggleRight className="w-10 h-10 text-emerald-500" />
        ) : (
          <ToggleLeft className="w-10 h-10 text-slate-500" />
        )}
      </button>
    </div>
  );

  const InputField = ({
    label,
    value,
    onChange,
    type = "text",
    placeholder,
  }: {
    label: string;
    value: string | number;
    onChange: (v: string) => void;
    type?: string;
    placeholder?: string;
  }) => (
    <div>
      <label className="block text-sm font-medium text-slate-400 mb-2">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/50"
      />
    </div>
  );

  return (
    <SuperAdminShell>
      <SuperAdminHeader title="Platform Settings">
        <button
          onClick={handleSave}
          disabled={saving || loading}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl font-medium transition-all hover:shadow-lg hover:shadow-emerald-500/20 disabled:opacity-50"
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
      </SuperAdminHeader>

      <SuperAdminContent>
        {message && (
          <div
            className={`mb-6 px-4 py-3 rounded-xl ${
              message.type === "success"
                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                : "bg-red-500/10 text-red-400 border border-red-500/20"
            }`}
          >
            {message.text}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-6">
            {/* General Settings */}
            <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50">
              <h3 className="font-semibold text-white mb-6 flex items-center gap-2">
                <Globe className="w-5 h-5 text-emerald-500" />
                General
              </h3>
              <div className="space-y-4">
                <InputField
                  label="Platform Name"
                  value={settings.platform_name}
                  onChange={(v) => updateSetting("platform_name", v)}
                />
                <InputField
                  label="Admin Email"
                  value={settings.platform_email}
                  onChange={(v) => updateSetting("platform_email", v)}
                  type="email"
                />
                <InputField
                  label="Support Email"
                  value={settings.support_email}
                  onChange={(v) => updateSetting("support_email", v)}
                  type="email"
                />
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">
                    Default Language
                  </label>
                  <select
                    value={settings.default_language}
                    onChange={(e) =>
                      updateSetting("default_language", e.target.value)
                    }
                    className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-emerald-500/50"
                  >
                    <option value="en">English</option>
                    <option value="ar">العربية</option>
                    <option value="fr">Français</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Access & Security */}
            <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50">
              <h3 className="font-semibold text-white mb-6 flex items-center gap-2">
                <Shield className="w-5 h-5 text-emerald-500" />
                Access & Security
              </h3>
              <div className="space-y-2">
                <ToggleSwitch
                  label="Maintenance Mode"
                  description="Disable public access to all catalogs"
                  checked={settings.maintenance_mode}
                  onChange={(v) => updateSetting("maintenance_mode", v)}
                />
                <ToggleSwitch
                  label="New Registrations"
                  description="Allow new catalog registrations"
                  checked={settings.registration_enabled}
                  onChange={(v) => updateSetting("registration_enabled", v)}
                />
              </div>
            </div>

          </div>
        )}
      </SuperAdminContent>
    </SuperAdminShell>
  );
}
