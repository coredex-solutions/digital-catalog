"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { CatalogAdminShell } from "../_components/CatalogAdminShell";
import { CatalogAdminHeader, CatalogAdminContent } from "../_components/CatalogAdminSidebar";
import { Save, Loader2, FileText, Search, Code, Globe } from "lucide-react";

interface AboutSEOData {
  about: {
    about_content_ar: string;
    about_content_en: string;
    about_content_fr: string;
  };
  seo: {
    seo_title_ar: string;
    seo_title_en: string;
    seo_title_fr: string;
    seo_description_ar: string;
    seo_description_en: string;
    seo_description_fr: string;
    seo_keywords: string;
    json_ld_custom: string;
  };
}

export default function AboutSEOPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [data, setData] = useState<AboutSEOData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<"about" | "seo" | "jsonld">("about");
  const [activeLang, setActiveLang] = useState<"en" | "ar" | "fr">("en");
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem(`catalog_admin_token_${slug}`);
      if (!token) return;

      try {
        const res = await fetch(`/api/c/${slug}/admin/about`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.ok) {
          const result = await res.json();
          setData(result);
        }
      } catch (error) {
        console.error("Failed to fetch about/SEO data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [slug]);

  const handleSave = async () => {
    if (!data) return;

    setSaving(true);
    setMessage(null);

    try {
      const token = localStorage.getItem(`catalog_admin_token_${slug}`);
      const res = await fetch(`/api/c/${slug}/admin/about`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...data.about,
          ...data.seo,
        }),
      });

      if (res.ok) {
        setMessage({ type: "success", text: "Settings saved successfully!" });
      } else {
        const error = await res.json();
        throw new Error(error.error || "Failed to save");
      }
    } catch (error: any) {
      setMessage({ type: "error", text: error.message });
    } finally {
      setSaving(false);
    }
  };

  const updateAbout = (field: keyof AboutSEOData["about"], value: string) => {
    if (!data) return;
    setData({
      ...data,
      about: { ...data.about, [field]: value },
    });
  };

  const updateSEO = (field: keyof AboutSEOData["seo"], value: string) => {
    if (!data) return;
    setData({
      ...data,
      seo: { ...data.seo, [field]: value },
    });
  };

  const langSuffix = `_${activeLang}` as "_en" | "_ar" | "_fr";

  return (
    <CatalogAdminShell>
      <CatalogAdminHeader title="About & SEO">
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
        ) : data ? (
          <div className="space-y-6">
            {/* Tabs */}
            <div className="flex gap-2 border-b border-slate-700/50 pb-4">
              {[
                { id: "about", label: "About Content", icon: FileText },
                { id: "seo", label: "SEO Settings", icon: Search },
                { id: "jsonld", label: "JSON-LD Schema", icon: Code },
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
                          backgroundColor: "color-mix(in srgb, var(--color-primary) 20%, transparent)",
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

            {/* Language Selector (for about and seo tabs) */}
            {(activeTab === "about" || activeTab === "seo") && (
              <div className="flex gap-2">
                <Globe className="w-5 h-5 text-slate-400" />
                {[
                  { id: "en", label: "English" },
                  { id: "ar", label: "العربية" },
                  { id: "fr", label: "Français" },
                ].map((lang) => (
                  <button
                    key={lang.id}
                    onClick={() => setActiveLang(lang.id as any)}
                    className={`px-3 py-1 rounded-lg text-sm font-medium transition-all ${
                      activeLang === lang.id
                        ? "bg-slate-700 text-white"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    {lang.label}
                  </button>
                ))}
              </div>
            )}

            {/* About Content Tab */}
            {activeTab === "about" && (
              <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50">
                <h3 className="font-semibold text-white mb-4">
                  About Page Content ({activeLang.toUpperCase()})
                </h3>
                <p className="text-slate-400 text-sm mb-4">
                  This content appears on the About page and helps with SEO. Use rich descriptions
                  including location, specialties, and keywords customers might search for.
                </p>
                <textarea
                  value={data.about[`about_content${langSuffix}` as keyof typeof data.about] || ""}
                  onChange={(e) =>
                    updateAbout(`about_content${langSuffix}` as keyof typeof data.about, e.target.value)
                  }
                  rows={12}
                  className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 resize-y"
                  style={{ direction: activeLang === "ar" ? "rtl" : "ltr" }}
                  placeholder={`Write about your business here (${activeLang.toUpperCase()})...

Example: "Welcome to [Business Name], the finest [cuisine type] restaurant in [City]. Since [year], we've been serving authentic dishes made with fresh, locally-sourced ingredients. Our specialties include [dish 1], [dish 2], and [dish 3]. Located in the heart of [neighborhood], we offer dine-in, takeaway, and delivery services."`}
                />
              </div>
            )}

            {/* SEO Settings Tab */}
            {activeTab === "seo" && (
              <div className="space-y-6">
                <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50">
                  <h3 className="font-semibold text-white mb-4">
                    Page Title ({activeLang.toUpperCase()})
                  </h3>
                  <input
                    type="text"
                    value={data.seo[`seo_title${langSuffix}` as keyof typeof data.seo] || ""}
                    onChange={(e) =>
                      updateSEO(`seo_title${langSuffix}` as keyof typeof data.seo, e.target.value)
                    }
                    className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2"
                    style={{ direction: activeLang === "ar" ? "rtl" : "ltr" }}
                    placeholder="e.g., Best Pizza in Downtown | Pizza Palace"
                  />
                  <p className="text-slate-500 text-sm mt-2">
                    Appears in browser tab and search results. Keep under 60 characters.
                  </p>
                </div>

                <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50">
                  <h3 className="font-semibold text-white mb-4">
                    Meta Description ({activeLang.toUpperCase()})
                  </h3>
                  <textarea
                    value={data.seo[`seo_description${langSuffix}` as keyof typeof data.seo] || ""}
                    onChange={(e) =>
                      updateSEO(`seo_description${langSuffix}` as keyof typeof data.seo, e.target.value)
                    }
                    rows={3}
                    className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 resize-y"
                    style={{ direction: activeLang === "ar" ? "rtl" : "ltr" }}
                    placeholder="Describe your business in 150-160 characters..."
                  />
                  <p className="text-slate-500 text-sm mt-2">
                    Appears in search results. Keep between 150-160 characters.
                  </p>
                </div>

                <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50">
                  <h3 className="font-semibold text-white mb-4">Keywords</h3>
                  <input
                    type="text"
                    value={data.seo.seo_keywords || ""}
                    onChange={(e) => updateSEO("seo_keywords", e.target.value)}
                    className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2"
                    placeholder="pizza, italian food, downtown, delivery, restaurant"
                  />
                  <p className="text-slate-500 text-sm mt-2">
                    Comma-separated keywords relevant to your business and location.
                  </p>
                </div>
              </div>
            )}

            {/* JSON-LD Tab */}
            {activeTab === "jsonld" && (
              <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50">
                <h3 className="font-semibold text-white mb-4">Custom JSON-LD Schema</h3>
                <p className="text-slate-400 text-sm mb-4">
                  Advanced: Add custom JSON-LD structured data to merge with the auto-generated schema.
                  Leave empty to use defaults.
                </p>
                <textarea
                  value={data.seo.json_ld_custom || ""}
                  onChange={(e) => updateSEO("json_ld_custom", e.target.value)}
                  rows={15}
                  className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600/50 rounded-xl text-white font-mono text-sm placeholder-slate-500 focus:outline-none focus:ring-2 resize-y"
                  placeholder={`{
  "priceRange": "$$",
  "servesCuisine": "Italian",
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.5",
    "reviewCount": "150"
  }
}`}
                />
              </div>
            )}
          </div>
        ) : (
          <div className="text-center text-slate-500 py-12">
            Failed to load data
          </div>
        )}
      </CatalogAdminContent>
    </CatalogAdminShell>
  );
}

