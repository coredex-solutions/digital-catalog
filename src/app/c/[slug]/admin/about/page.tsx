"use client";

import { useEffect, useState } from "react";
import { CatalogAdminShell, useCatalogAdmin } from "../_components/CatalogAdminShell";
import { CatalogAdminHeader, CatalogAdminContent } from "../_components/CatalogAdminSidebar";
import { Save, Loader2, FileText, Search, Globe, Sparkles, CheckCircle2, AlertCircle, RefreshCw, Target, ArrowRight, ArrowLeft, X, Building2 } from "lucide-react";
import { useAdminLang, useCopy, useFormat, type AdminLang } from "../_lib/i18n";
import { ADMIN_NAV_LABELS } from "../_components/adminNav";

type ContentLang = "en" | "ar";

const en = {
  save: "Save",
  saving: "Saving…",
  saved: "Saved.",
  saveFailed: "Couldn't save. Please try again.",
  dismiss: "Dismiss message",
  loading: "Loading…",
  tabs: { about: "About", seo: "Search engines" },
  contentLanguage: "Language of the text",
  langTab: { ar: "العربية", en: "English" } as Record<ContentLang, string>,
  langName: { ar: "Arabic", en: "English" } as Record<ContentLang, string>,
  aboutTitle: (language: string) => `About text in ${language}`,
  aboutHint: "Tell guests about your place.",
  aboutPlaceholder: "Tell guests about your place, what makes it special and why they should come…",
  writeWithAI: "Write with AI",
  improve: "Improve",
  improveTooShort: "Write a few sentences first, or use \"Write with AI\".",
  improving: (language: string) => `Improving the ${language} text…`,
  improved: "Text improved. Review it, then save.",
  improveFailed: "Couldn't improve the text. Please try again.",
  seoTitle: (language: string) => `Search engine details in ${language}`,
  seoIntro: "What Google and other search engines show for your menu.",
  generating: "Writing…",
  seoMenu: "Write for",
  currentOnly: (language: string) => `${language} only`,
  bothLanguages: "Arabic and English",
  orPick: "Or pick one language:",
  needAbout: "Fill in the About text first. The AI uses it to write your search engine details.",
  seoGenerating: "Writing your search engine details…",
  seoGenerated: (languages: string) => `Search engine details written in ${languages}. Review them, then save.`,
  seoFailed: "Couldn't write the search engine details. Please try again.",
  pageTitle: "Page title",
  pageTitlePlaceholder: "The title people see on Google…",
  description: "Description",
  descriptionPlaceholder: "Describe your place in about 150 to 160 characters…",
  keywords: "Keywords",
  keywordsHint: "Separate them with commas. The same keywords are used for both languages.",
  keywordsPlaceholder: "restaurant beirut, lebanese food, manakish…",
  googlePreview: "How it may look on Google",
  previewTitleFallback: "Page title",
  previewDescriptionFallback: "No description yet",
  // AI writing wizard
  wizardTitle: "Write with AI",
  stepOf: (n: number, total: number) => `Step ${n} of ${total}`,
  close: "Close",
  tellUs: "Tell us about your place",
  businessName: "Name",
  businessNamePlaceholder: "e.g. Al Sham Restaurant",
  businessType: "Type of place",
  businessTypePlaceholder: "e.g. Lebanese restaurant",
  city: "City",
  required: "Required",
  cityRequired: "Please enter your city.",
  cityPlaceholder: "e.g. Beirut",
  neighborhood: "Area (optional)",
  neighborhoodPlaceholder: "e.g. Hamra, Achrafieh",
  specialty: "What you're known for (optional)",
  specialtyPlaceholder: "e.g. grills, Italian pizza",
  uniqueFeature: "What makes you different? (optional)",
  uniqueFeaturePlaceholder: "e.g. family recipes, sea view, open late",
  findingKeywords: "Finding keywords for you…",
  pickKeywords: "Pick the words you want to be found for on Google",
  selected: (n: string) => `Selected: ${n}`,
  removeKeyword: (kw: string) => `Remove ${kw}`,
  addKeyword: "Add your own keyword",
  addKeywordPlaceholder: "e.g. halal restaurant hamra",
  add: "Add",
  fallbackKeywords: (type: string, city: string) => [`best ${type} in ${city}`, `${type} near me`],
  writingTitle: "Writing your text",
  writingBody: "Writing in Arabic and English…",
  writeFailed: "Couldn't write the text. Please try again.",
  tryAgain: "Try again",
  doneTitle: "Your text is ready",
  doneBody: "Review the new text and edit it as you like, then save.",
  viewText: "View the text",
  cancel: "Cancel",
  back: "Back",
  next: "Next",
  write: "Write",
};
const ar: typeof en = {
  save: "حفظ",
  saving: "جارٍ الحفظ…",
  saved: "تم الحفظ.",
  saveFailed: "تعذّر الحفظ. يُرجى المحاولة مرة أخرى.",
  dismiss: "إخفاء الرسالة",
  loading: "جارٍ التحميل…",
  tabs: { about: "من نحن", seo: "محركات البحث" },
  contentLanguage: "لغة النص",
  langTab: { ar: "العربية", en: "English" },
  langName: { ar: "العربية", en: "الإنجليزية" },
  aboutTitle: (language) => `نص "من نحن" باللغة ${language}`,
  aboutHint: "عرّف الزبائن على مكانك.",
  aboutPlaceholder: "عرّف الزبائن على مكانك، وما الذي يميّزه، ولماذا يزورونك…",
  writeWithAI: "اكتب بالذكاء الاصطناعي",
  improve: "حسّن النص",
  improveTooShort: "اكتب بضع جمل أولاً، أو استخدم \"اكتب بالذكاء الاصطناعي\".",
  improving: (language) => `جارٍ تحسين النص باللغة ${language}…`,
  improved: "تم تحسين النص. راجعه ثم احفظ.",
  improveFailed: "تعذّر تحسين النص. يُرجى المحاولة مرة أخرى.",
  seoTitle: (language) => `تفاصيل محركات البحث باللغة ${language}`,
  seoIntro: "ما يظهر لقائمتك على Google ومحركات البحث الأخرى.",
  generating: "جارٍ الكتابة…",
  seoMenu: "اكتب باللغة",
  currentOnly: (language) => `${language} فقط`,
  bothLanguages: "العربية والإنجليزية",
  orPick: "أو اختر لغة واحدة:",
  needAbout: "اكتب نص \"من نحن\" أولاً. يعتمد عليه الذكاء الاصطناعي لكتابة تفاصيل محركات البحث.",
  seoGenerating: "جارٍ كتابة تفاصيل محركات البحث…",
  seoGenerated: (languages) => `تمت كتابة تفاصيل محركات البحث (${languages}). راجعها ثم احفظ.`,
  seoFailed: "تعذّرت كتابة تفاصيل محركات البحث. يُرجى المحاولة مرة أخرى.",
  pageTitle: "عنوان الصفحة",
  pageTitlePlaceholder: "العنوان الذي يراه الناس على Google…",
  description: "الوصف",
  descriptionPlaceholder: "صِف مكانك في 150 إلى 160 حرفاً تقريباً…",
  keywords: "الكلمات المفتاحية",
  keywordsHint: "افصل بينها بفواصل. تُستخدم الكلمات نفسها للغتين.",
  keywordsPlaceholder: "مطعم بيروت، أكل لبناني، مناقيش…",
  googlePreview: "كيف قد تظهر على Google",
  previewTitleFallback: "عنوان الصفحة",
  previewDescriptionFallback: "لا يوجد وصف بعد",
  wizardTitle: "اكتب بالذكاء الاصطناعي",
  stepOf: (n, total) => `الخطوة ${n} من ${total}`,
  close: "إغلاق",
  tellUs: "أخبرنا عن مكانك",
  businessName: "الاسم",
  businessNamePlaceholder: "مثال: مطعم الشام",
  businessType: "نوع المكان",
  businessTypePlaceholder: "مثال: مطعم لبناني",
  city: "المدينة",
  required: "مطلوب",
  cityRequired: "يُرجى إدخال مدينتك.",
  cityPlaceholder: "مثال: بيروت",
  neighborhood: "المنطقة (اختياري)",
  neighborhoodPlaceholder: "مثال: الحمرا، الأشرفية",
  specialty: "بماذا تشتهرون؟ (اختياري)",
  specialtyPlaceholder: "مثال: المشاوي، البيتزا الإيطالية",
  uniqueFeature: "ما الذي يميّزكم؟ (اختياري)",
  uniqueFeaturePlaceholder: "مثال: وصفات عائلية، إطلالة على البحر، مفتوح حتى وقت متأخر",
  findingKeywords: "نبحث لك عن كلمات مفتاحية…",
  pickKeywords: "اختر الكلمات التي تريد أن يجدك الناس بها على Google",
  selected: (n) => `المحدد: ${n}`,
  removeKeyword: (kw) => `إزالة ${kw}`,
  addKeyword: "أضف كلمة مفتاحية من عندك",
  addKeywordPlaceholder: "مثال: مطعم حلال الحمرا",
  add: "إضافة",
  fallbackKeywords: (type, city) => [`أفضل ${type} في ${city}`, `${type} قريب مني`],
  writingTitle: "جارٍ كتابة النص",
  writingBody: "نكتب بالعربية والإنجليزية…",
  writeFailed: "تعذّرت كتابة النص. يُرجى المحاولة مرة أخرى.",
  tryAgain: "حاول مجدداً",
  doneTitle: "النص جاهز",
  doneBody: "راجع النص الجديد وعدّله كما تريد، ثم احفظ.",
  viewText: "عرض النص",
  cancel: "إلغاء",
  back: "رجوع",
  next: "التالي",
  write: "اكتب",
};

interface AboutSEOData {
  catalog: {
    name: string;
    business_type: string;
  };
  about: {
    about_content_ar: string;
    about_content_en: string;
  };
  seo: {
    seo_title_ar: string;
    seo_title_en: string;
    seo_description_ar: string;
    seo_description_en: string;
    seo_keywords: string;
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

const CONTENT_LANGS: ContentLang[] = ["ar", "en"];
const dirOf = (l: ContentLang) => (l === "ar" ? "rtl" : "ltr");

function AboutSEOPageContent() {
  const { slug, user, fetchWithAuth } = useCatalogAdmin();
  const isViewer = user?.role === 'viewer';
  const t = useCopy({ en, ar });
  const uiLang: AdminLang = useAdminLang();
  const f = useFormat();

  const [data, setData] = useState<AboutSEOData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<"about" | "seo">("about");
  // Start on the text in the dashboard language
  const [activeLang, setActiveLang] = useState<ContentLang>(uiLang);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // AI Wizard State
  const [showWizard, setShowWizard] = useState(false);
  const [wizardStep, setWizardStep] = useState<1 | 2 | 3>(1);
  // Step 3 shows this instead of "Your text is ready" when writing failed
  const [wizardError, setWizardError] = useState<string | null>(null);
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

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetchWithAuth(`/api/c/${slug}/admin/about/`);

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

  const handleSave = async () => {
    if (!data) return;

    setSaving(true);
    setMessage(null);

    try {
      const res = await fetchWithAuth(`/api/c/${slug}/admin/about/`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...data.about,
          ...data.seo,
        }),
      });

      if (res.ok) {
        setMessage({ type: "success", text: t.saved });
      } else {
        const error = await res.json();
        throw new Error(error.error || t.saveFailed);
      }
    } catch (error: any) {
      setMessage({ type: "error", text: error.message || t.saveFailed });
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

  const langSuffix = `_${activeLang}` as "_en" | "_ar";

  // Open wizard and start fresh
  const openAIWizard = () => {
    setWizardStep(1);
    setSuggestedKeywords([]);
    setSelectedKeywords([]);
    setBusinessDetails(prev => ({
      ...prev,
      name: data?.catalog.name || prev.name,
      type: data?.catalog.business_type || prev.type,
    }));
    setShowWizard(true);
  };

  // Step 1 -> Step 2: Get keyword suggestions
  const goToStep2 = async () => {
    if (!businessDetails.city) {
      setMessage({ type: "error", text: t.cityRequired });
      return;
    }

    setAiLoading(true);
    setWizardStep(2);

    try {
      const res = await fetchWithAuth("/api/ai/generate/", {
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
      // Use fallback keywords, in the dashboard language
      const [best, nearMe] = t.fallbackKeywords(businessDetails.type, businessDetails.city);
      setSuggestedKeywords([
        { keyword: best, category: "local" },
        { keyword: nearMe, category: "local" },
        { keyword: `${businessDetails.name}`, category: "brand" },
      ]);
    } finally {
      setAiLoading(false);
    }
  };

  // Step 2 -> Step 3: Generate content
  const goToStep3 = async () => {
    setAiLoading(true);
    setWizardError(null);
    setWizardStep(3);

    try {
      const res = await fetchWithAuth("/api/ai/generate/", {
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
        if (!result.content) throw new Error(t.writeFailed);
        {
          setData(prev => prev ? {
            ...prev,
            about: {
              about_content_en: result.content.en || prev.about.about_content_en,
              about_content_ar: result.content.ar || prev.about.about_content_ar,
            },
            seo: {
              ...prev.seo,
              seo_keywords: selectedKeywords.join(", ")
            }
          } : prev);
        }
      } else {
        const err = await res.json();
        throw new Error(err.error || t.writeFailed);
      }
    } catch (error: any) {
      console.error("AI generation error:", error);
      // A network failure has a browser message in English
      setWizardError(error instanceof TypeError ? t.writeFailed : error.message || t.writeFailed);
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
      setMessage({ type: "error", text: t.improveTooShort });
      return;
    }

    setAiLoading(true);
    setMessage({ type: "success", text: t.improving(t.langName[activeLang]) });

    try {
      const res = await fetchWithAuth("/api/ai/generate/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "enhance_content",
          business: {
            name: data.catalog.name,
            type: data.catalog.business_type,
            city: businessDetails.city,
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
          setMessage({ type: "success", text: t.improved });
        }
      } else {
        throw new Error("Enhancement failed");
      }
    } catch (error) {
      console.error("AI enhance error:", error);
      setMessage({ type: "error", text: t.improveFailed });
    } finally {
      setAiLoading(false);
    }
  };

  // Auto-generate SEO using AI (requires About content)
  const generateSEO = async (languages: ContentLang[]) => {
    if (!data) return;

    // Check if any About content exists for selected languages
    const hasAboutContent = languages.some(lang =>
      data.about[`about_content_${lang}` as keyof typeof data.about]?.trim()
    );

    if (!hasAboutContent) {
      setMessage({ type: "error", text: t.needAbout });
      setShowSeoDropdown(false);
      return;
    }

    setAiLoading(true);
    setShowSeoDropdown(false);
    setMessage({ type: "success", text: t.seoGenerating });

    try {
      const res = await fetchWithAuth("/api/ai/generate/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "generate_seo",
          business: {
            name: data.catalog.name,
            type: data.catalog.business_type,
            city: businessDetails.city,
          },
          aboutContent: {
            en: data.about.about_content_en,
            ar: data.about.about_content_ar,
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

          const langText = languages.length === 2 ? t.bothLanguages : t.langName[languages[0]];
          setMessage({ type: "success", text: t.seoGenerated(langText) });
        }
      } else {
        const error = await res.json();
        throw new Error(error.error || t.seoFailed);
      }
    } catch (error: any) {
      console.error("SEO generation error:", error);
      setMessage({ type: "error", text: error.message || t.seoFailed });
    } finally {
      setAiLoading(false);
    }
  };

  // Google Preview
  const GooglePreview = () => {
    const title = data?.seo[`seo_title${langSuffix}` as keyof typeof data.seo] || data?.catalog.name || t.previewTitleFallback;
    const description = data?.seo[`seo_description${langSuffix}` as keyof typeof data.seo] || t.previewDescriptionFallback;

    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Search className="w-3.5 h-3.5 text-ui-muted" aria-hidden />
          <span className="text-xs font-bold text-ui-muted">{t.googlePreview}</span>
        </div>
        <div className="bg-white rounded-xl p-4" dir={dirOf(activeLang)} lang={activeLang}>
          <p className="text-xs text-ui-muted truncate mb-0.5" dir="ltr">example.com/c/{slug}</p>
          <h3 className="text-lg text-ui-primary hover:underline cursor-pointer truncate" style={{ fontFamily: "arial" }}>
            {String(title).slice(0, 60)}
          </h3>
          <p className="text-sm text-ui-muted line-clamp-2 mt-1" style={{ fontFamily: "arial" }}>
            {String(description).slice(0, 160)}
          </p>
        </div>
      </div>
    );
  };

  const inputClass = "w-full px-4 py-2.5 bg-ui-subtle border border-ui-input rounded-lg text-ui-ink text-sm focus:outline-none focus:border-ui-primary text-start";

  return (
    <>
      <CatalogAdminHeader title={ADMIN_NAV_LABELS[uiLang].about}>
        <button
          onClick={handleSave}
          disabled={saving || isViewer}
          className="group relative flex items-center gap-2 px-6 py-2.5 bg-ui-primary text-ui-primary-fg rounded-xl text-xs font-semibold hover:shadow-lg transition-all disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden /> : <Save className="w-4 h-4" aria-hidden />}
          {saving ? t.saving : t.save}
        </button>
      </CatalogAdminHeader>

      <CatalogAdminContent>
        {data ? (
          <div className="space-y-6">
            {/* Message */}
            {message && (
              <div
                role={message.type === "error" ? "alert" : "status"}
                className={`p-4 rounded-xl flex items-center gap-3 animate-in slide-in-from-top ${message.type === "success" ? "bg-ui-subtle text-ui-primary" : "bg-ui-subtle text-ui-primary"
                }`}
              >
                {message.type === "error" ? <AlertCircle className="w-5 h-5 shrink-0" aria-hidden /> : <CheckCircle2 className="w-5 h-5 shrink-0" aria-hidden />}
                <span className="text-sm font-medium">{message.text}</span>
                <button onClick={() => setMessage(null)} aria-label={t.dismiss} className="ms-auto opacity-50 hover:opacity-100">
                  <X className="w-4 h-4" aria-hidden />
                </button>
              </div>
            )}

            {/* Tabs */}
            <div className="flex gap-1 p-1 bg-ui-subtle rounded-xl w-fit">
              {[
                { id: "about", label: t.tabs.about, icon: FileText },
                { id: "seo", label: t.tabs.seo, icon: Search },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as typeof activeTab)}
                  aria-pressed={activeTab === tab.id}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === tab.id ? "bg-ui-primary text-ui-primary-fg" : "text-ui-muted hover:text-ui-ink"
                    }`}
                >
                  <tab.icon className="w-4 h-4" aria-hidden />
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Language Selector */}
            <div className="flex items-center gap-2" role="group" aria-label={t.contentLanguage}>
              <Globe className="w-4 h-4 text-ui-muted" aria-hidden />
              <div className="flex gap-1 p-0.5 bg-ui-subtle rounded-lg">
                {CONTENT_LANGS.map((l) => (
                  <button
                    key={l}
                    onClick={() => setActiveLang(l)}
                    aria-pressed={activeLang === l}
                    lang={l}
                    className={`min-h-11 min-w-11 sm:min-h-0 sm:min-w-0 px-3 py-1 rounded text-xs font-bold ${activeLang === l ? "bg-ui-primary text-ui-primary-fg" : "text-ui-muted hover:text-ui-ink"
                      }`}
                  >
                    {t.langTab[l]}
                  </button>
                ))}
              </div>
            </div>

            {/* About Tab */}
            {activeTab === "about" && (
              <div className="glass-card p-6 space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-bold text-ui-heading">{t.aboutTitle(t.langName[activeLang])}</h3>
                    <p className="text-xs text-ui-muted mt-0.5">{t.aboutHint}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={openAIWizard}
                      disabled={aiLoading || isViewer}
                      className="flex items-center gap-2 px-4 py-2 text-ui-primary border border-ui-line rounded-lg text-xs font-bold hover:border-ui-primary transition-all disabled:opacity-50"
                    >
                      <Sparkles className="w-3.5 h-3.5" aria-hidden />
                      {t.writeWithAI}
                    </button>
                    <button
                      onClick={enhanceWithAI}
                      disabled={aiLoading || isViewer}
                      className="flex items-center gap-2 px-3 py-2 bg-ui-subtle text-ui-muted border border-ui-line rounded-lg text-xs font-bold hover:text-ui-ink hover:border-ui-input transition-all disabled:opacity-50"
                    >
                      {aiLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden /> : <RefreshCw className="w-3.5 h-3.5" aria-hidden />}
                      {t.improve}
                    </button>
                  </div>
                </div>

                <textarea
                  value={data.about[`about_content${langSuffix}` as keyof typeof data.about] || ""}
                  onChange={(e) => updateAbout(`about_content${langSuffix}` as keyof typeof data.about, e.target.value)}
                  rows={10}
                  aria-label={t.aboutTitle(t.langName[activeLang])}
                  dir={dirOf(activeLang)}
                  lang={activeLang}
                  className="w-full px-5 py-4 bg-ui-bg border border-ui-input rounded-xl text-ui-ink focus:outline-none focus:border-ui-primary resize-y placeholder:text-ui-muted"
                  placeholder={t.aboutPlaceholder}
                />
              </div>
            )}

            {/* SEO Tab */}
            {activeTab === "seo" && (
              <div className="space-y-6">
                <div className="glass-card p-6 space-y-6">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-bold text-ui-heading">{t.seoTitle(t.langName[activeLang])}</h3>
                      <p className="text-xs text-ui-muted mt-0.5">{t.seoIntro}</p>
                    </div>

                    {/* AI writing menu */}
                    <div className="relative">
                      <button
                        onClick={() => !aiLoading && setShowSeoDropdown(!showSeoDropdown)}
                        disabled={aiLoading}
                        aria-haspopup="menu"
                        aria-expanded={showSeoDropdown}
                        className="flex items-center gap-2 px-4 py-2 text-ui-primary border border-ui-line rounded-lg text-xs font-bold hover:border-ui-primary transition-all disabled:opacity-50"
                      >
                        {aiLoading ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden />
                            {t.generating}
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-3.5 h-3.5" aria-hidden />
                            {t.writeWithAI}
                            <svg className={`w-3 h-3 transition-transform ${showSeoDropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </>
                        )}
                      </button>

                      {showSeoDropdown && (
                        <>
                          <div className="fixed inset-0 z-40" onClick={() => setShowSeoDropdown(false)} />
                          <div className="absolute end-0 top-full mt-2 w-56 bg-ui-surface border border-ui-line rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                            <div className="p-2 border-b border-ui-line">
                              <p className="text-xs text-ui-muted px-2">{t.seoMenu}</p>
                            </div>
                            <div className="p-1">
                              <button
                                onClick={() => generateSEO([activeLang])}
                                className="w-full flex items-center gap-3 px-3 py-2.5 text-start text-sm text-ui-ink hover:text-ui-ink hover:bg-ui-subtle rounded-lg transition-colors"
                              >
                                <div className="w-6 h-6 rounded bg-ui-subtle flex items-center justify-center text-ui-primary text-xs font-bold" aria-hidden>
                                  {activeLang === "ar" ? "ع" : "EN"}
                                </div>
                                <span>{t.currentOnly(t.langName[activeLang])}</span>
                              </button>
                              <button
                                onClick={() => generateSEO(["ar", "en"])}
                                className="w-full flex items-center gap-3 px-3 py-2.5 text-start text-sm text-ui-ink hover:text-ui-ink hover:bg-ui-subtle rounded-lg transition-colors"
                              >
                                <div className="w-6 h-6 rounded flex items-center justify-center">
                                  <Globe className="w-3.5 h-3.5 text-ui-primary" aria-hidden />
                                </div>
                                <span>{t.bothLanguages}</span>
                              </button>
                            </div>
                            <div className="p-1 border-t border-ui-line">
                              <p className="text-xs text-ui-muted px-2 py-1">{t.orPick}</p>
                              <div className="flex gap-1 px-2 pb-2">
                                {CONTENT_LANGS.map((l) => (
                                  <button
                                    key={l}
                                    onClick={() => generateSEO([l])}
                                    lang={l}
                                    className="flex-1 py-1.5 text-xs font-bold text-ui-muted hover:text-ui-ink bg-ui-subtle hover:bg-ui-subtle rounded transition-colors"
                                  >
                                    {t.langTab[l]}
                                  </button>
                                ))}
                              </div>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label htmlFor="seo-title" className="text-xs font-bold text-ui-muted mb-2 block">{t.pageTitle}</label>
                      <input
                        id="seo-title"
                        type="text"
                        value={data.seo[`seo_title${langSuffix}` as keyof typeof data.seo] || ""}
                        onChange={(e) => updateSEO(`seo_title${langSuffix}` as keyof typeof data.seo, e.target.value)}
                        dir={dirOf(activeLang)}
                        lang={activeLang}
                        className="w-full px-4 py-3 bg-ui-bg border border-ui-input rounded-lg text-ui-ink focus:outline-none focus:border-ui-primary"
                        placeholder={t.pageTitlePlaceholder}
                      />
                    </div>

                    <div>
                      <label htmlFor="seo-description" className="text-xs font-bold text-ui-muted mb-2 block">{t.description}</label>
                      <textarea
                        id="seo-description"
                        value={data.seo[`seo_description${langSuffix}` as keyof typeof data.seo] || ""}
                        onChange={(e) => updateSEO(`seo_description${langSuffix}` as keyof typeof data.seo, e.target.value)}
                        rows={3}
                        dir={dirOf(activeLang)}
                        lang={activeLang}
                        className="w-full px-4 py-3 bg-ui-bg border border-ui-input rounded-lg text-ui-ink focus:outline-none focus:border-ui-primary resize-none"
                        placeholder={t.descriptionPlaceholder}
                      />
                    </div>

                    <div>
                      <label htmlFor="seo-keywords" className="text-xs font-bold text-ui-muted mb-2 block">{t.keywords}</label>
                      <input
                        id="seo-keywords"
                        type="text"
                        value={data.seo.seo_keywords || ""}
                        onChange={(e) => updateSEO("seo_keywords", e.target.value)}
                        dir="auto"
                        aria-describedby="seo-keywords-hint"
                        className="w-full px-4 py-3 bg-ui-bg border border-ui-input rounded-lg text-ui-ink focus:outline-none focus:border-ui-primary"
                        placeholder={t.keywordsPlaceholder}
                      />
                      <p id="seo-keywords-hint" className="text-xs text-ui-muted mt-1.5">{t.keywordsHint}</p>
                    </div>
                  </div>
                </div>

                <div className="glass-card p-6">
                  <GooglePreview />
                </div>
              </div>
            )}

            {/* AI writing wizard */}
            {showWizard && (
              <div className="fixed inset-0 w-screen h-screen z-[100] flex items-center justify-center p-4">
                <div className="absolute inset-0 w-full h-full bg-black/40" onClick={closeWizard} />
                <div
                  role="dialog"
                  aria-modal="true"
                  aria-labelledby="ai-wizard-title"
                  className="glass w-full max-w-2xl rounded-control border border-ui-line relative z-10 shadow-2xl overflow-hidden animate-in zoom-in-95"
                >
                  {/* Header */}
                  <div className="p-5 border-b border-ui-line">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-ui-subtle rounded-lg">
                          <Sparkles className="w-5 h-5 text-ui-primary" aria-hidden />
                        </div>
                        <div>
                          <h3 id="ai-wizard-title" className="text-base font-bold text-ui-heading">{t.wizardTitle}</h3>
                          <p className="text-xs text-ui-muted">{t.stepOf(wizardStep, 3)}</p>
                        </div>
                      </div>
                      <button onClick={closeWizard} aria-label={t.close} className="p-2 hover:bg-ui-subtle rounded-lg text-ui-muted hover:text-ui-ink">
                        <X className="w-5 h-5" aria-hidden />
                      </button>
                    </div>
                    {/* Progress */}
                    <div className="flex gap-2 mt-4" aria-hidden>
                      {[1, 2, 3].map((s) => (
                        <div key={s} className={`flex-1 h-1 rounded-full ${s <= wizardStep ? "bg-ui-primary" : "bg-ui-subtle"}`} />
                      ))}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-4 sm:p-6 max-h-[60vh] overflow-y-auto">
                    {/* Step 1: Business Details */}
                    {wizardStep === 1 && (
                      <div className="space-y-5">
                        <div className="flex items-center gap-2 text-ui-muted mb-4">
                          <Building2 className="w-4 h-4" aria-hidden />
                          <span className="text-sm font-medium">{t.tellUs}</span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label htmlFor="wiz-name" className="text-xs text-ui-muted mb-1.5 block">{t.businessName}</label>
                            <input id="wiz-name" type="text" dir="auto" value={businessDetails.name} onChange={(e) => setBusinessDetails({ ...businessDetails, name: e.target.value })} className={inputClass} placeholder={t.businessNamePlaceholder} />
                          </div>
                          <div>
                            <label htmlFor="wiz-type" className="text-xs text-ui-muted mb-1.5 block">{t.businessType}</label>
                            <input id="wiz-type" type="text" dir="auto" value={businessDetails.type} onChange={(e) => setBusinessDetails({ ...businessDetails, type: e.target.value })} className={inputClass} placeholder={t.businessTypePlaceholder} />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label htmlFor="wiz-city" className="text-xs text-ui-muted mb-1.5 block">
                              {t.city} <span className="text-ui-primary" aria-hidden>*</span>
                              <span className="sr-only">({t.required})</span>
                            </label>
                            <input id="wiz-city" type="text" dir="auto" required value={businessDetails.city} onChange={(e) => setBusinessDetails({ ...businessDetails, city: e.target.value })} className={inputClass} placeholder={t.cityPlaceholder} />
                          </div>
                          <div>
                            <label htmlFor="wiz-area" className="text-xs text-ui-muted mb-1.5 block">{t.neighborhood}</label>
                            <input id="wiz-area" type="text" dir="auto" value={businessDetails.neighborhood} onChange={(e) => setBusinessDetails({ ...businessDetails, neighborhood: e.target.value })} className={inputClass} placeholder={t.neighborhoodPlaceholder} />
                          </div>
                        </div>

                        <div>
                          <label htmlFor="wiz-specialty" className="text-xs text-ui-muted mb-1.5 block">{t.specialty}</label>
                          <input id="wiz-specialty" type="text" dir="auto" value={businessDetails.specialty} onChange={(e) => setBusinessDetails({ ...businessDetails, specialty: e.target.value })} className={inputClass} placeholder={t.specialtyPlaceholder} />
                        </div>

                        <div>
                          <label htmlFor="wiz-unique" className="text-xs text-ui-muted mb-1.5 block">{t.uniqueFeature}</label>
                          <input id="wiz-unique" type="text" dir="auto" value={businessDetails.uniqueFeature} onChange={(e) => setBusinessDetails({ ...businessDetails, uniqueFeature: e.target.value })} className={inputClass} placeholder={t.uniqueFeaturePlaceholder} />
                        </div>
                      </div>
                    )}

                    {/* Step 2: Keywords */}
                    {wizardStep === 2 && (
                      <div className="space-y-5">
                        {aiLoading ? (
                          <div className="text-center py-12" role="status">
                            <Loader2 className="w-8 h-8 text-ui-primary animate-spin mx-auto mb-3" aria-hidden />
                            <p className="text-sm text-ui-muted">{t.findingKeywords}</p>
                          </div>
                        ) : (
                          <>
                            <div className="flex items-center gap-2 text-ui-muted mb-4">
                              <Target className="w-4 h-4" aria-hidden />
                              <span className="text-sm font-medium">{t.pickKeywords}</span>
                            </div>

                            <div className="flex flex-wrap gap-2">
                              {suggestedKeywords.map((kw, i) => (
                                <button
                                  key={i}
                                  onClick={() => toggleKeyword(kw.keyword)}
                                  aria-pressed={selectedKeywords.includes(kw.keyword)}
                                  dir="auto"
                                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${selectedKeywords.includes(kw.keyword)
                                    ? "bg-ui-primary text-ui-primary-fg"
                                    : "bg-ui-subtle text-ui-muted hover:bg-ui-subtle"
                                    }`}
                                >
                                  {kw.keyword}
                                </button>
                              ))}
                            </div>

                            {selectedKeywords.length > 0 && (
                              <div className="pt-4 border-t border-ui-line">
                                <p className="text-xs text-ui-muted mb-2">{t.selected(f.number(selectedKeywords.length))}</p>
                                <div className="flex flex-wrap gap-2">
                                  {selectedKeywords.map((kw, i) => (
                                    <span key={i} className="px-2 py-1 bg-ui-subtle text-ui-primary rounded text-xs flex items-center gap-1">
                                      <bdi>{kw}</bdi>
                                      <button onClick={() => toggleKeyword(kw)} aria-label={t.removeKeyword(kw)}>×</button>
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}

                            <div className="pt-4">
                              <label htmlFor="wiz-custom-keyword" className="text-xs text-ui-muted mb-1.5 block">{t.addKeyword}</label>
                              <div className="flex gap-2">
                                <input
                                  id="wiz-custom-keyword"
                                  type="text"
                                  dir="auto"
                                  value={customKeyword}
                                  onChange={(e) => setCustomKeyword(e.target.value)}
                                  onKeyDown={(e) => e.key === "Enter" && addCustomKeyword()}
                                  className="flex-1 px-4 py-2.5 bg-ui-subtle border border-ui-input rounded-lg text-ui-ink text-sm focus:outline-none focus:border-ui-primary text-start"
                                  placeholder={t.addKeywordPlaceholder}
                                />
                                <button onClick={addCustomKeyword} className="px-4 py-2.5 bg-ui-subtle text-ui-ink rounded-lg text-sm font-medium hover:bg-ui-subtle">{t.add}</button>
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
                          <div role="status">
                            <Loader2 className="w-10 h-10 text-ui-primary animate-spin mx-auto mb-4" aria-hidden />
                            <h4 className="text-lg font-bold text-ui-ink mb-2">{t.writingTitle}</h4>
                            <p className="text-sm text-ui-muted">{t.writingBody}</p>
                          </div>
                        ) : wizardError ? (
                          <div role="alert">
                            <AlertCircle className="w-12 h-12 text-ui-danger mx-auto mb-4" aria-hidden />
                            <p className="text-sm text-ui-ink mb-6">{wizardError}</p>
                            <div className="flex flex-wrap justify-center gap-3">
                              <button onClick={() => setWizardStep(2)} className="min-h-11 px-5 rounded-lg border border-ui-input font-medium hover:bg-ui-subtle">
                                {t.back}
                              </button>
                              <button onClick={goToStep3} className="min-h-11 px-5 bg-ui-primary text-ui-primary-fg rounded-lg font-medium">
                                {t.tryAgain}
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <CheckCircle2 className="w-12 h-12 text-ui-primary mx-auto mb-4" aria-hidden />
                            <h4 className="text-lg font-bold text-ui-ink mb-2">{t.doneTitle}</h4>
                            <p className="text-sm text-ui-muted mb-6">{t.doneBody}</p>
                            <button onClick={closeWizard} className="px-6 py-2.5 bg-ui-primary text-ui-primary-fg rounded-lg font-medium hover:shadow-lg">
                              {t.viewText}
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Footer */}
                  {wizardStep !== 3 && (
                    <div className="p-4 border-t border-ui-line bg-ui-bg flex items-center justify-between">
                      <button
                        onClick={() => wizardStep === 1 ? closeWizard() : setWizardStep((wizardStep - 1) as 1 | 2)}
                        className="flex items-center gap-2 px-4 py-2 text-ui-muted hover:text-ui-ink text-sm"
                      >
                        <ArrowLeft className="w-4 h-4 rtl:-scale-x-100" aria-hidden />
                        {wizardStep === 1 ? t.cancel : t.back}
                      </button>
                      <button
                        onClick={() => wizardStep === 1 ? goToStep2() : goToStep3()}
                        disabled={aiLoading || (wizardStep === 1 && !businessDetails.city)}
                        className="flex items-center gap-2 px-5 py-2.5 bg-ui-primary text-ui-primary-fg rounded-lg text-sm font-medium disabled:opacity-50 hover:bg-ui-primary"
                      >
                        {wizardStep === 1 ? t.next : t.write}
                        <ArrowRight className="w-4 h-4 rtl:-scale-x-100" aria-hidden />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-20" role="status">
            <Loader2 className="w-8 h-8 text-ui-primary animate-spin mx-auto" aria-hidden />
            <span className="sr-only">{t.loading}</span>
          </div>
        )}
      </CatalogAdminContent>
    </>
  );
}

export default function AboutSEOPage() {
  return (
    <CatalogAdminShell>
      <AboutSEOPageContent />
    </CatalogAdminShell>
  );
}
