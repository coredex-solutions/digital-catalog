"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { CatalogAdminShell } from "../_components/CatalogAdminShell";
import { CatalogAdminHeader, CatalogAdminContent } from "../_components/CatalogAdminSidebar";
import { Save, Loader2, FileText, Search, Code, Globe, Sparkles, MapPin, Phone, Wand2, Eye, CheckCircle2, RefreshCw, Zap, Target, ArrowRight, ArrowLeft, X, Building2, Utensils, Star } from "lucide-react";

interface AboutSEOData {
  catalog: {
    name: string;
    business_type: string;
  };
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

interface BusinessDetails {
  name: string;
  type: string;
  city: string;
  neighborhood: string;
  specialty: string;
  uniqueFeature: string;
  targetAudience: string;
}

interface SuggestedKeyword {
  keyword: string;
  category: "local" | "service" | "product" | "brand";
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
  
  // AI Wizard State
  const [showWizard, setShowWizard] = useState(false);
  const [wizardStep, setWizardStep] = useState<1 | 2 | 3>(1);
  const [aiLoading, setAiLoading] = useState(false);
  const [businessDetails, setBusinessDetails] = useState<BusinessDetails>({
    name: "",
    type: "",
    city: "",
    neighborhood: "",
    specialty: "",
    uniqueFeature: "",
    targetAudience: ""
  });
  const [suggestedKeywords, setSuggestedKeywords] = useState<SuggestedKeyword[]>([]);
  const [selectedKeywords, setSelectedKeywords] = useState<string[]>([]);
  const [customKeyword, setCustomKeyword] = useState("");
  const [showSeoDropdown, setShowSeoDropdown] = useState(false);

  
  // Schema Wizard State
  const [schemaMode, setSchemaMode] = useState<"wizard" | "code">("wizard");
  const [schemaData, setSchemaData] = useState({
    street: "",
    city: "",
    country: "",
    phone: "",
    priceRange: "$$",
    openingHours: "Mo-Su 09:00-22:00"
  });

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
          // Initialize business details from catalog data
          setBusinessDetails(prev => ({
            ...prev,
            name: result.catalog.name || "",
            type: result.catalog.business_type || ""
          }));
        }
      } catch (error) {
        console.error("Failed to fetch about/SEO data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [slug]);

  // Sync schema data
  useEffect(() => {
    if (data?.seo.json_ld_custom) {
      try {
        const parsed = JSON.parse(data.seo.json_ld_custom);
        setSchemaData({
          street: parsed.address?.streetAddress || "",
          city: parsed.address?.addressLocality || "",
          country: parsed.address?.addressCountry || "",
          phone: parsed.telephone || "",
          priceRange: parsed.priceRange || "$$",
          openingHours: parsed.openingHours || "Mo-Su 09:00-22:00"
        });
        // Also update business details city if available
        if (parsed.address?.addressLocality) {
          setBusinessDetails(prev => ({ ...prev, city: prev.city || parsed.address.addressLocality }));
        }
      } catch {
        // Keep existing state
      }
    }
  }, [data?.seo.json_ld_custom]);

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
        setMessage({ type: "success", text: "Changes saved successfully!" });
      } else {
        const error = await res.json();
        throw new Error(error.error || "Save failed");
      }
    } catch (error: any) {
      setMessage({ type: "error", text: error.message });
    } finally {
      setSaving(false);
    }
  };

  const updateAbout = (field: keyof AboutSEOData["about"], value: string) => {
    if (!data) return;
    setData({ ...data, about: { ...data.about, [field]: value } });
  };

  const updateSEO = (field: keyof AboutSEOData["seo"], value: string) => {
    if (!data) return;
    setData({ ...data, seo: { ...data.seo, [field]: value } });
  };

  const langSuffix = `_${activeLang}` as "_en" | "_ar" | "_fr";

  // Open wizard and start fresh
  const openAIWizard = () => {
    setWizardStep(1);
    setSuggestedKeywords([]);
    setSelectedKeywords([]);
    setBusinessDetails(prev => ({
      ...prev,
      name: data?.catalog.name || prev.name,
      type: data?.catalog.business_type || prev.type,
      city: schemaData.city || prev.city
    }));
    setShowWizard(true);
  };

  // Step 1 -> Step 2: Get keyword suggestions
  const goToStep2 = async () => {
    if (!businessDetails.city) {
      setMessage({ type: "error", text: "Please enter your city" });
      return;
    }

    setAiLoading(true);
    setWizardStep(2);
    
    try {
      const res = await fetch("/api/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "suggest_keywords",
          business: businessDetails,
        }),
      });

      if (res.ok) {
        const result = await res.json();
        setSuggestedKeywords(result.keywords || []);
      } else {
        throw new Error("Failed to get suggestions");
      }
    } catch (error) {
      console.error("Keyword suggestion error:", error);
      // Use fallback keywords
      setSuggestedKeywords([
        { keyword: `best ${businessDetails.type} in ${businessDetails.city}`, category: "local" },
        { keyword: `${businessDetails.type} near me`, category: "local" },
        { keyword: `${businessDetails.name}`, category: "brand" },
      ]);
    } finally {
      setAiLoading(false);
    }
  };

  // Step 2 -> Step 3: Generate content
  const goToStep3 = async () => {
    setAiLoading(true);
    setWizardStep(3);
    
    try {
      const res = await fetch("/api/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "generate_content",
          business: businessDetails,
          keywords: selectedKeywords.length > 0 ? selectedKeywords : undefined,
        }),
      });

      if (res.ok) {
        const result = await res.json();
        if (result.content) {
          setData(prev => prev ? {
            ...prev,
            about: {
              about_content_en: result.content.en || prev.about.about_content_en,
              about_content_ar: result.content.ar || prev.about.about_content_ar,
              about_content_fr: result.content.fr || prev.about.about_content_fr,
            },
            seo: {
              ...prev.seo,
              seo_keywords: selectedKeywords.join(", ")
            }
          } : prev);
        }
      } else {
        const err = await res.json();
        throw new Error(err.error || "Generation failed");
      }
    } catch (error: any) {
      console.error("AI generation error:", error);
      setMessage({ type: "error", text: error.message || "AI generation failed. Please try again." });
    } finally {
      setAiLoading(false);
    }
  };

  const closeWizard = () => {
    setShowWizard(false);
    setWizardStep(1);
  };

  const toggleKeyword = (keyword: string) => {
    setSelectedKeywords(prev => 
      prev.includes(keyword) 
        ? prev.filter(k => k !== keyword)
        : [...prev, keyword]
    );
  };

  const addCustomKeyword = () => {
    if (customKeyword.trim() && !selectedKeywords.includes(customKeyword.trim())) {
      setSelectedKeywords(prev => [...prev, customKeyword.trim()]);
      setCustomKeyword("");
    }
  };

  // Enhance current content
  const enhanceWithAI = async () => {
    if (!data) return;
    
    const currentContent = data.about[`about_content_${activeLang}` as keyof typeof data.about];
    if (!currentContent || currentContent.length < 20) {
      setMessage({ type: "error", text: "Write some content first or generate with AI." });
      return;
    }
    
    setAiLoading(true);
    setMessage({ type: "success", text: `Enhancing ${activeLang.toUpperCase()} content...` });
    
    try {
      const res = await fetch("/api/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "enhance_content",
          business: {
            name: data.catalog.name,
            type: data.catalog.business_type,
            city: schemaData.city || businessDetails.city,
          },
          currentContent: { [activeLang]: currentContent },
          language: activeLang,
          keywords: data.seo.seo_keywords ? data.seo.seo_keywords.split(",").map(k => k.trim()) : undefined,
        }),
      });

      if (res.ok) {
        const result = await res.json();
        if (result.content?.[activeLang]) {
          setData({
            ...data,
            about: {
              ...data.about,
              [`about_content_${activeLang}`]: result.content[activeLang],
            }
          });
          setMessage({ type: "success", text: "Content enhanced! Review and save." });
        }
      } else {
        throw new Error("Enhancement failed");
      }
    } catch (error) {
      console.error("AI enhance error:", error);
      setMessage({ type: "error", text: "Enhancement failed. Please try again." });
    } finally {
      setAiLoading(false);
    }
  };

  // Update schema JSON
  const updateSchema = (field: keyof typeof schemaData, value: string) => {
    const newData = { ...schemaData, [field]: value };
    setSchemaData(newData);
    
    if (!data) return;

    const typeMap: Record<string, string> = {
      restaurant: "Restaurant",
      cafe: "CafeOrCoffeeShop",
      supermarket: "Supermarket",
      retail: "Store",
      salon: "BeautySalon",
      bakery: "Bakery",
      gym: "HealthClub",
      medical: "MedicalClinic"
    };

    const schema = {
      "@context": "https://schema.org",
      "@type": typeMap[data.catalog.business_type] || "LocalBusiness",
      "name": data.catalog.name,
      "url": typeof window !== "undefined" ? window.location.origin + `/c/${slug}` : "",
      "telephone": newData.phone,
      "priceRange": newData.priceRange,
      "openingHours": newData.openingHours,
      "address": {
        "@type": "PostalAddress",
        "streetAddress": newData.street,
        "addressLocality": newData.city,
        "addressCountry": newData.country
      }
    };

    setData({ ...data, seo: { ...data.seo, json_ld_custom: JSON.stringify(schema, null, 2) } });
  };

  // Auto-generate SEO using AI (requires About content)
  const generateSEO = async (languages: ("en" | "ar" | "fr")[]) => {
    if (!data) return;

    // Check if any About content exists for selected languages
    const hasAboutContent = languages.some(lang => 
      data.about[`about_content_${lang}` as keyof typeof data.about]?.trim()
    );

    if (!hasAboutContent) {
      setMessage({ 
        type: "error", 
        text: "Please fill in the About tab first! AI needs your content to generate optimized SEO." 
      });
      setShowSeoDropdown(false);
      return;
    }

    setAiLoading(true);
    setShowSeoDropdown(false);
    setMessage({ type: "success", text: "AI is generating your SEO..." });

    try {
      const res = await fetch("/api/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "generate_seo",
          business: {
            name: data.catalog.name,
            type: data.catalog.business_type,
            city: schemaData.city || businessDetails.city,
          },
          aboutContent: {
            en: data.about.about_content_en,
            ar: data.about.about_content_ar,
            fr: data.about.about_content_fr,
          },
          languages,
        }),
      });

      if (res.ok) {
        const result = await res.json();
        if (result.seo) {
          const updates: Partial<typeof data.seo> = {};
          
          languages.forEach(lang => {
            if (result.seo[lang]) {
              updates[`seo_title_${lang}` as keyof typeof data.seo] = result.seo[lang].title || "";
              updates[`seo_description_${lang}` as keyof typeof data.seo] = result.seo[lang].description || "";
            }
          });

          setData({
            ...data,
            seo: { ...data.seo, ...updates }
          });

          const langText = languages.length === 3 ? "all languages" : languages.map(l => l.toUpperCase()).join(", ");
          setMessage({ type: "success", text: `SEO generated for ${langText}!` });
        }
      } else {
        const error = await res.json();
        throw new Error(error.error || "Failed to generate SEO");
      }
    } catch (error: any) {
      console.error("SEO generation error:", error);
      setMessage({ type: "error", text: error.message || "SEO generation failed. Please try again." });
    } finally {
      setAiLoading(false);
    }
  };

  // Google Preview
  const GooglePreview = () => {
    const title = data?.seo[`seo_title${langSuffix}` as keyof typeof data.seo] || data?.catalog.name || "Page Title";
    const description = data?.seo[`seo_description${langSuffix}` as keyof typeof data.seo] || "No description set";

    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Search className="w-3.5 h-3.5 text-white/30" />
          <span className="text-xs font-bold text-white/30 uppercase tracking-wide">Google Preview</span>
        </div>
        <div className="bg-white rounded-xl p-4">
          <p className="text-xs text-gray-500 truncate mb-0.5">example.com/c/{slug}</p>
          <h3 className="text-lg text-violet-700 hover:underline cursor-pointer truncate" style={{ fontFamily: "arial" }}>
            {String(title).slice(0, 60)}
          </h3>
          <p className="text-sm text-gray-600 line-clamp-2 mt-1" style={{ fontFamily: "arial" }}>
            {String(description).slice(0, 160)}
          </p>
        </div>
      </div>
    );
  };

  return (
    <CatalogAdminShell>
      <CatalogAdminHeader title="About & SEO">
        <button
          onClick={handleSave}
          disabled={saving || !data}
          className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl text-sm font-bold hover:shadow-lg hover:shadow-primary/30 transition-all disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save
        </button>
      </CatalogAdminHeader>

      <CatalogAdminContent>
        {data ? (
          <div className="space-y-6">
            {/* Message */}
            {message && (
              <div className={`p-4 rounded-xl flex items-center gap-3 animate-in slide-in-from-top ${
                message.type === "success" ? "bg-violet-500/10 text-violet-400" : "bg-purple-500/10 text-purple-400"
              }`}>
                <CheckCircle2 className="w-5 h-5" />
                <span className="text-sm font-medium">{message.text}</span>
                <button onClick={() => setMessage(null)} className="ml-auto opacity-50 hover:opacity-100">
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Tabs */}
            <div className="flex gap-1 p-1 bg-white/5 rounded-xl w-fit">
              {[
                { id: "about", label: "About", icon: FileText },
                { id: "seo", label: "SEO", icon: Search },
                { id: "jsonld", label: "Schema", icon: Code },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as typeof activeTab)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    activeTab === tab.id ? "bg-primary text-white" : "text-white/40 hover:text-white"
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Language Selector */}
            {(activeTab === "about" || activeTab === "seo") && (
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-white/20" />
                <div className="flex gap-1 p-0.5 bg-white/5 rounded-lg">
                  {(["en", "ar", "fr"] as const).map((lang) => (
                    <button
                      key={lang}
                      onClick={() => setActiveLang(lang)}
                      className={`px-3 py-1 rounded text-xs font-bold uppercase ${
                        activeLang === lang ? "bg-white text-black" : "text-white/30 hover:text-white"
                      }`}
                    >
                      {lang}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* About Tab */}
            {activeTab === "about" && (
              <div className="glass-card p-6 space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-white">About Content ({activeLang.toUpperCase()})</h3>
                    <p className="text-xs text-white/30 mt-0.5">Tell customers about your business</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={openAIWizard}
                      disabled={aiLoading}
                      className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500/20 to-purple-500/20 text-purple-400 border border-purple-500/30 rounded-lg text-xs font-bold hover:border-purple-400 transition-all"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      Generate with AI
                    </button>
                    <button
                      onClick={enhanceWithAI}
                      disabled={aiLoading}
                      className="flex items-center gap-2 px-3 py-2 bg-white/5 text-white/50 border border-white/10 rounded-lg text-xs font-bold hover:text-white hover:border-white/20 transition-all"
                    >
                      {aiLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                      Enhance
                    </button>
                  </div>
                </div>

                <textarea
                  value={data.about[`about_content${langSuffix}` as keyof typeof data.about] || ""}
                  onChange={(e) => updateAbout(`about_content${langSuffix}` as keyof typeof data.about, e.target.value)}
                  rows={10}
                  className="w-full px-5 py-4 bg-white/[0.02] border border-white/5 rounded-xl text-white focus:outline-none focus:border-primary/50 resize-y placeholder:text-white/10"
                  style={{ direction: activeLang === "ar" ? "rtl" : "ltr" }}
                  placeholder="Tell your customers about your business, what makes you special, and why they should choose you..."
                />
              </div>
            )}

            {/* SEO Tab */}
            {activeTab === "seo" && (
              <div className="space-y-6">
                <div className="glass-card p-6 space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-white">SEO Settings ({activeLang.toUpperCase()})</h3>
                    
                    {/* Pro AI Auto-Generate Dropdown */}
                    <div className="relative">
                      <button 
                        onClick={() => !aiLoading && setShowSeoDropdown(!showSeoDropdown)}
                        disabled={aiLoading}
                        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500/10 to-purple-500/10 text-purple-400 border border-purple-500/20 rounded-lg text-xs font-bold hover:border-purple-400 transition-all disabled:opacity-50"
                      >
                        {aiLoading ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            Generating...
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-3.5 h-3.5" />
                            AI Generate
                            <svg className={`w-3 h-3 transition-transform ${showSeoDropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </>
                        )}
                      </button>
                      
                      {showSeoDropdown && (
                        <>
                          <div className="fixed inset-0 z-40" onClick={() => setShowSeoDropdown(false)} />
                          <div className="absolute right-0 top-full mt-2 w-56 bg-[#1a1a1a] border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                            <div className="p-2 border-b border-white/5">
                              <p className="text-[10px] text-white/30 uppercase tracking-wide px-2">Generate for</p>
                            </div>
                            <div className="p-1">
                              <button
                                onClick={() => generateSEO([activeLang])}
                                className="w-full flex items-center gap-3 px-3 py-2.5 text-left text-sm text-white/70 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                              >
                                <div className="w-6 h-6 rounded bg-purple-500/20 flex items-center justify-center text-purple-400 text-xs font-bold">
                                  {activeLang.toUpperCase()}
                                </div>
                                <span>Current language only</span>
                              </button>
                              <button
                                onClick={() => generateSEO(["en", "ar", "fr"])}
                                className="w-full flex items-center gap-3 px-3 py-2.5 text-left text-sm text-white/70 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                              >
                                <div className="w-6 h-6 rounded bg-gradient-to-r from-purple-500/20 to-purple-500/20 flex items-center justify-center">
                                  <Globe className="w-3.5 h-3.5 text-purple-400" />
                                </div>
                                <span>All 3 languages</span>
                                <span className="ml-auto text-[10px] text-violet-400 bg-violet-500/10 px-1.5 py-0.5 rounded">PRO</span>
                              </button>
                            </div>
                            <div className="p-1 border-t border-white/5">
                              <p className="text-[10px] text-white/20 px-2 py-1">Or pick specific:</p>
                              <div className="flex gap-1 px-2 pb-2">
                                <button
                                  onClick={() => generateSEO(["en"])}
                                  className="flex-1 py-1.5 text-[10px] font-bold text-white/40 hover:text-white bg-white/5 hover:bg-white/10 rounded transition-colors"
                                >
                                  EN
                                </button>
                                <button
                                  onClick={() => generateSEO(["ar"])}
                                  className="flex-1 py-1.5 text-[10px] font-bold text-white/40 hover:text-white bg-white/5 hover:bg-white/10 rounded transition-colors"
                                >
                                  AR
                                </button>
                                <button
                                  onClick={() => generateSEO(["fr"])}
                                  className="flex-1 py-1.5 text-[10px] font-bold text-white/40 hover:text-white bg-white/5 hover:bg-white/10 rounded transition-colors"
                                >
                                  FR
                                </button>
                              </div>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="text-xs font-bold text-white/40 uppercase tracking-wide mb-2 block">Page Title</label>
                      <input
                        type="text"
                        value={data.seo[`seo_title${langSuffix}` as keyof typeof data.seo] || ""}
                        onChange={(e) => updateSEO(`seo_title${langSuffix}` as keyof typeof data.seo, e.target.value)}
                        className="w-full px-4 py-3 bg-white/[0.02] border border-white/5 rounded-lg text-white focus:outline-none focus:border-primary/50"
                        style={{ direction: activeLang === "ar" ? "rtl" : "ltr" }}
                        placeholder="Your page title for Google..."
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-white/40 uppercase tracking-wide mb-2 block">Meta Description</label>
                      <textarea
                        value={data.seo[`seo_description${langSuffix}` as keyof typeof data.seo] || ""}
                        onChange={(e) => updateSEO(`seo_description${langSuffix}` as keyof typeof data.seo, e.target.value)}
                        rows={3}
                        className="w-full px-4 py-3 bg-white/[0.02] border border-white/5 rounded-lg text-white focus:outline-none focus:border-primary/50 resize-none"
                        style={{ direction: activeLang === "ar" ? "rtl" : "ltr" }}
                        placeholder="Describe your business in 150-160 characters..."
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-white/40 uppercase tracking-wide mb-2 block">Keywords</label>
                      <input
                        type="text"
                        value={data.seo.seo_keywords || ""}
                        onChange={(e) => updateSEO("seo_keywords", e.target.value)}
                        className="w-full px-4 py-3 bg-white/[0.02] border border-white/5 rounded-lg text-white focus:outline-none focus:border-primary/50"
                        placeholder="restaurant dubai, italian food, best pizza..."
                      />
                    </div>
                  </div>
                </div>

                <div className="glass-card p-6">
                  <GooglePreview />
                </div>
              </div>
            )}

            {/* Schema Tab */}
            {activeTab === "jsonld" && (
              <div className="glass-card p-6 space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-white">Business Schema</h3>
                    <p className="text-xs text-white/30 mt-0.5">Help Google show rich results</p>
                  </div>
                  <div className="flex gap-1 p-0.5 bg-white/5 rounded-lg">
                    <button onClick={() => setSchemaMode("wizard")} className={`px-3 py-1 rounded text-xs font-bold ${schemaMode === "wizard" ? "bg-white text-black" : "text-white/40"}`}>Form</button>
                    <button onClick={() => setSchemaMode("code")} className={`px-3 py-1 rounded text-xs font-bold ${schemaMode === "code" ? "bg-white text-black" : "text-white/40"}`}>JSON</button>
                  </div>
                </div>

                {schemaMode === "wizard" ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 text-primary text-xs font-bold uppercase"><MapPin className="w-4 h-4" /> Location</div>
                      <input type="text" value={schemaData.street} onChange={(e) => updateSchema("street", e.target.value)} className="w-full px-4 py-2.5 bg-white/[0.02] border border-white/5 rounded-lg text-white text-sm focus:outline-none focus:border-primary/50" placeholder="Street Address" />
                      <div className="grid grid-cols-2 gap-3">
                        <input type="text" value={schemaData.city} onChange={(e) => updateSchema("city", e.target.value)} className="w-full px-4 py-2.5 bg-white/[0.02] border border-white/5 rounded-lg text-white text-sm focus:outline-none focus:border-primary/50" placeholder="City" />
                        <input type="text" value={schemaData.country} onChange={(e) => updateSchema("country", e.target.value)} className="w-full px-4 py-2.5 bg-white/[0.02] border border-white/5 rounded-lg text-white text-sm focus:outline-none focus:border-primary/50" placeholder="Country" />
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 text-violet-400 text-xs font-bold uppercase"><Phone className="w-4 h-4" /> Contact</div>
                      <input type="text" value={schemaData.phone} onChange={(e) => updateSchema("phone", e.target.value)} className="w-full px-4 py-2.5 bg-white/[0.02] border border-white/5 rounded-lg text-white text-sm focus:outline-none focus:border-primary/50" placeholder="Phone Number" />
                      <div className="grid grid-cols-2 gap-3">
                        <select value={schemaData.priceRange} onChange={(e) => updateSchema("priceRange", e.target.value)} className="w-full px-4 py-2.5 bg-white/[0.02] border border-white/5 rounded-lg text-white text-sm focus:outline-none">
                          <option value="$">$ Budget</option>
                          <option value="$$">$$ Moderate</option>
                          <option value="$$$">$$$ Premium</option>
                          <option value="$$$$">$$$$ Luxury</option>
                        </select>
                        <input type="text" value={schemaData.openingHours} onChange={(e) => updateSchema("openingHours", e.target.value)} className="w-full px-4 py-2.5 bg-white/[0.02] border border-white/5 rounded-lg text-white text-sm focus:outline-none focus:border-primary/50" placeholder="Mo-Su 09:00-22:00" />
                      </div>
                    </div>
                  </div>
                ) : (
                  <textarea
                    value={data.seo.json_ld_custom || ""}
                    onChange={(e) => updateSEO("json_ld_custom", e.target.value)}
                    rows={12}
                    className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-lg text-violet-500 font-mono text-xs focus:outline-none resize-none"
                    placeholder='{"@context": "https://schema.org", ...}'
                  />
                )}
              </div>
            )}

            {/* AI Wizard Modal - Arabic */}
            {showWizard && (
              <div className="fixed top-0 left-0 right-0 bottom-0 w-screen h-screen z-[100] flex items-center justify-center p-4">
                <div className="absolute top-0 left-0 right-0 bottom-0 w-full h-full bg-black/90 backdrop-blur-sm" onClick={closeWizard} />
                <div className="glass w-full max-w-2xl rounded-2xl border border-white/10 relative z-10 shadow-2xl overflow-hidden animate-in zoom-in-95" dir="rtl">
                  {/* Header */}
                  <div className="p-5 border-b border-white/5 bg-gradient-to-r from-purple-500/10 to-purple-500/10">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-500/20 rounded-lg">
                          <Sparkles className="w-5 h-5 text-purple-400" />
                        </div>
                        <div>
                          <h3 className="text-base font-bold text-white">مُنشئ المحتوى بالذكاء الاصطناعي</h3>
                          <p className="text-xs text-white/40">الخطوة {wizardStep} من 3</p>
                        </div>
                      </div>
                      <button onClick={closeWizard} className="p-2 hover:bg-white/10 rounded-lg text-white/40 hover:text-white">
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                    {/* Progress */}
                    <div className="flex gap-2 mt-4">
                      {[1, 2, 3].map((s) => (
                        <div key={s} className={`flex-1 h-1 rounded-full ${s <= wizardStep ? "bg-purple-500" : "bg-white/10"}`} />
                      ))}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-6 max-h-[60vh] overflow-y-auto">
                    {/* Step 1: Business Details */}
                    {wizardStep === 1 && (
                      <div className="space-y-5">
                        <div className="flex items-center gap-2 text-white/60 mb-4">
                          <Building2 className="w-4 h-4" />
                          <span className="text-sm font-medium">أخبرنا عن نشاطك التجاري</span>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="text-xs text-white/40 mb-1.5 block">اسم النشاط التجاري</label>
                            <input type="text" value={businessDetails.name} onChange={(e) => setBusinessDetails({ ...businessDetails, name: e.target.value })} className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-purple-500/50 text-right" placeholder="مثال: مطعم الشام" />
                          </div>
                          <div>
                            <label className="text-xs text-white/40 mb-1.5 block">نوع النشاط</label>
                            <input type="text" value={businessDetails.type} onChange={(e) => setBusinessDetails({ ...businessDetails, type: e.target.value })} className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-purple-500/50 text-right" placeholder="مثال: مطعم سوري" />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="text-xs text-white/40 mb-1.5 block">المدينة <span className="text-purple-400">*</span></label>
                            <input type="text" value={businessDetails.city} onChange={(e) => setBusinessDetails({ ...businessDetails, city: e.target.value })} className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-purple-500/50 text-right" placeholder="مثال: دبي" />
                          </div>
                          <div>
                            <label className="text-xs text-white/40 mb-1.5 block">الحي (اختياري)</label>
                            <input type="text" value={businessDetails.neighborhood} onChange={(e) => setBusinessDetails({ ...businessDetails, neighborhood: e.target.value })} className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-purple-500/50 text-right" placeholder="مثال: داون تاون، مارينا" />
                          </div>
                        </div>

                        <div>
                          <label className="text-xs text-white/40 mb-1.5 block">التخصص الرئيسي (اختياري)</label>
                          <input type="text" value={businessDetails.specialty} onChange={(e) => setBusinessDetails({ ...businessDetails, specialty: e.target.value })} className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-purple-500/50 text-right" placeholder="مثال: المشاوي، البيتزا الإيطالية" />
                        </div>

                        <div>
                          <label className="text-xs text-white/40 mb-1.5 block">ما الذي يميزكم؟ (اختياري)</label>
                          <input type="text" value={businessDetails.uniqueFeature} onChange={(e) => setBusinessDetails({ ...businessDetails, uniqueFeature: e.target.value })} className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-purple-500/50 text-right" placeholder="مثال: وصفات عائلية، إطلالة على البحر، خدمة 24 ساعة" />
                        </div>
                      </div>
                    )}

                    {/* Step 2: Keywords */}
                    {wizardStep === 2 && (
                      <div className="space-y-5">
                        {aiLoading ? (
                          <div className="text-center py-12">
                            <Loader2 className="w-8 h-8 text-purple-500 animate-spin mx-auto mb-3" />
                            <p className="text-sm text-white/40">جاري البحث عن أفضل الكلمات المفتاحية...</p>
                          </div>
                        ) : (
                          <>
                            <div className="flex items-center gap-2 text-white/60 mb-4">
                              <Target className="w-4 h-4" />
                              <span className="text-sm font-medium">اختر الكلمات التي تريد الظهور بها على جوجل</span>
                            </div>

                            <div className="flex flex-wrap gap-2">
                              {suggestedKeywords.map((kw, i) => (
                                <button
                                  key={i}
                                  onClick={() => toggleKeyword(kw.keyword)}
                                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                                    selectedKeywords.includes(kw.keyword)
                                      ? "bg-purple-500 text-white"
                                      : "bg-white/5 text-white/60 hover:bg-white/10"
                                  }`}
                                >
                                  {kw.keyword}
                                </button>
                              ))}
                            </div>

                            {selectedKeywords.length > 0 && (
                              <div className="pt-4 border-t border-white/5">
                                <p className="text-xs text-white/40 mb-2">المحدد: {selectedKeywords.length}</p>
                                <div className="flex flex-wrap gap-2">
                                  {selectedKeywords.map((kw, i) => (
                                    <span key={i} className="px-2 py-1 bg-violet-500/20 text-violet-400 rounded text-xs flex items-center gap-1">
                                      {kw}
                                      <button onClick={() => toggleKeyword(kw)}>×</button>
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}

                            <div className="pt-4">
                              <label className="text-xs text-white/40 mb-1.5 block">أضف كلمة مفتاحية خاصة</label>
                              <div className="flex gap-2">
                                <input
                                  type="text"
                                  value={customKeyword}
                                  onChange={(e) => setCustomKeyword(e.target.value)}
                                  onKeyDown={(e) => e.key === "Enter" && addCustomKeyword()}
                                  className="flex-1 px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-purple-500/50 text-right"
                                  placeholder="مثال: مطعم حلال مارينا"
                                />
                                <button onClick={addCustomKeyword} className="px-4 py-2.5 bg-white/10 text-white rounded-lg text-sm font-medium hover:bg-white/20">إضافة</button>
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    )}

                    {/* Step 3: Generating / Done */}
                    {wizardStep === 3 && (
                      <div className="text-center py-12">
                        {aiLoading ? (
                          <>
                            <Loader2 className="w-10 h-10 text-purple-500 animate-spin mx-auto mb-4" />
                            <h4 className="text-lg font-bold text-white mb-2">جاري إنشاء المحتوى</h4>
                            <p className="text-sm text-white/40">إنشاء محتوى فريد بالعربية والإنجليزية والفرنسية...</p>
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="w-12 h-12 text-violet-500 mx-auto mb-4" />
                            <h4 className="text-lg font-bold text-white mb-2">تم إنشاء المحتوى!</h4>
                            <p className="text-sm text-white/40 mb-6">راجع المحتوى الجديد وعدّله حسب الحاجة.</p>
                            <button onClick={closeWizard} className="px-6 py-2.5 bg-primary text-white rounded-lg font-medium hover:shadow-lg">
                              عرض المحتوى
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Footer */}
                  {wizardStep !== 3 && (
                    <div className="p-4 border-t border-white/5 bg-white/[0.02] flex items-center justify-between">
                      <button
                        onClick={() => wizardStep === 1 ? closeWizard() : setWizardStep((wizardStep - 1) as 1 | 2)}
                        className="flex items-center gap-2 px-4 py-2 text-white/40 hover:text-white text-sm"
                      >
                        <ArrowRight className="w-4 h-4" />
                        {wizardStep === 1 ? "إلغاء" : "رجوع"}
                      </button>
                      <button
                        onClick={() => wizardStep === 1 ? goToStep2() : goToStep3()}
                        disabled={aiLoading || (wizardStep === 1 && !businessDetails.city)}
                        className="flex items-center gap-2 px-5 py-2.5 bg-purple-500 text-white rounded-lg text-sm font-medium disabled:opacity-50 hover:bg-purple-600"
                      >
                        {wizardStep === 1 ? "التالي" : "إنشاء"}
                        <ArrowLeft className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-20">
            <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto" />
          </div>
        )}
      </CatalogAdminContent>
    </CatalogAdminShell>
  );
}
