"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Save, MapPin, Phone, Mail, MessageCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { Sidebar } from "../_components/Sidebar";

interface RestaurantSettings {
  id: string;
  google_map_iframe_url: string | null;
  phone_reservation: string | null;
  phone_checkout: string | null;
  whatsapp: string | null;
  email: string | null;
  address_ar: string | null;
  address_en: string | null;
  address_fr: string | null;
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<RestaurantSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  const [formData, setFormData] = useState({
    google_map_iframe_url: "",
    phone_reservation: "",
    phone_checkout: "",
    whatsapp: "",
    email: "",
    address_ar: "",
    address_en: "",
    address_fr: "",
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch("/api/restaurant-settings");
      const data = await response.json();
      if (data) {
        setSettings(data);
        setFormData({
          google_map_iframe_url: data.google_map_iframe_url || "",
          phone_reservation: data.phone_reservation || "",
          phone_checkout: data.phone_checkout || "",
          whatsapp: data.whatsapp || "",
          email: data.email || "",
          address_ar: data.address_ar || "",
          address_en: data.address_en || "",
          address_fr: data.address_fr || "",
        });
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const getAuthToken = () => {
    return localStorage.getItem("admin_token");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = getAuthToken();
    if (!token) {
      router.push("/admin/login");
      return;
    }

    setSaving(true);
    try {
      const response = await fetch("/api/restaurant-settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        alert(error.error || "Failed to save settings");
        return;
      }

      alert("Settings saved successfully!");
      fetchSettings();
    } catch (error) {
      console.error("Error saving settings:", error);
      alert("An error occurred");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-navy-900">
        <Sidebar />
        <div className="lg:pl-64 pt-16 lg:pt-0">
          <div className="flex items-center justify-center min-h-screen">
            <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-navy-900">
      <Sidebar />
      <div className="lg:pl-64 pt-16 lg:pt-0">
        <main className="p-4 sm:p-6">
          <div className="max-w-4xl mx-auto">
            <div className="mb-6 sm:mb-8">
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mb-2">
                Restaurant Settings
              </h1>
              <p className="text-slate-600 dark:text-slate-400">
                Manage your restaurant information and contact details
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-navy-800 rounded-2xl shadow-sm border border-slate-200 dark:border-navy-700 p-4 sm:p-6"
              >
                <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white mb-4 sm:mb-6 flex items-center gap-2">
                  <Phone
                    size={20}
                    className="text-purple-600 dark:text-purple-400 sm:w-6 sm:h-6"
                  />
                  Contact Information
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Reservation Phone
                    </label>
                    <input
                      type="tel"
                      value={formData.phone_reservation}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          phone_reservation: e.target.value,
                        })
                      }
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-navy-700 border border-slate-200 dark:border-navy-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Checkout Phone
                    </label>
                    <input
                      type="tel"
                      value={formData.phone_checkout}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          phone_checkout: e.target.value,
                        })
                      }
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-navy-700 border border-slate-200 dark:border-navy-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2">
                      <MessageCircle size={16} />
                      WhatsApp
                    </label>
                    <input
                      type="tel"
                      value={formData.whatsapp}
                      onChange={(e) =>
                        setFormData({ ...formData, whatsapp: e.target.value })
                      }
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-navy-700 border border-slate-200 dark:border-navy-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2">
                      <Mail size={16} />
                      Email
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-navy-700 border border-slate-200 dark:border-navy-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none text-slate-900 dark:text-white"
                    />
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white dark:bg-navy-800 rounded-2xl shadow-sm border border-slate-200 dark:border-navy-700 p-4 sm:p-6"
              >
                <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white mb-4 sm:mb-6 flex items-center gap-2">
                  <MapPin
                    size={20}
                    className="text-purple-600 dark:text-purple-400 sm:w-6 sm:h-6"
                  />
                  Address
                </h2>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Address (Arabic)
                    </label>
                    <input
                      type="text"
                      value={formData.address_ar}
                      onChange={(e) =>
                        setFormData({ ...formData, address_ar: e.target.value })
                      }
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-navy-700 border border-slate-200 dark:border-navy-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Address (English)
                    </label>
                    <input
                      type="text"
                      value={formData.address_en}
                      onChange={(e) =>
                        setFormData({ ...formData, address_en: e.target.value })
                      }
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-navy-700 border border-slate-200 dark:border-navy-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Address (French)
                    </label>
                    <input
                      type="text"
                      value={formData.address_fr}
                      onChange={(e) =>
                        setFormData({ ...formData, address_fr: e.target.value })
                      }
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-navy-700 border border-slate-200 dark:border-navy-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none text-slate-900 dark:text-white"
                    />
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white dark:bg-navy-800 rounded-2xl shadow-sm border border-slate-200 dark:border-navy-700 p-6"
              >
                <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">
                  Google Map
                </h2>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Google Maps Iframe URL
                  </label>
                  <textarea
                    value={formData.google_map_iframe_url}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        google_map_iframe_url: e.target.value,
                      })
                    }
                    rows={4}
                    placeholder="Paste your Google Maps embed iframe code here..."
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-navy-700 border border-slate-200 dark:border-navy-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none text-slate-900 dark:text-white resize-none font-mono text-sm"
                  />
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                    Paste the entire iframe code from Google Maps
                  </p>
                </div>
              </motion.div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center justify-center gap-2 bg-purple-600 text-white px-6 sm:px-8 py-3 rounded-xl hover:bg-purple-700 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
                >
                  <Save size={20} />
                  {saving ? "Saving..." : "Save Settings"}
                </button>
              </div>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
}
