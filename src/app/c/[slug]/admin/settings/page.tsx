"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { CatalogAdminShell, useCatalogAdmin } from "../_components/CatalogAdminShell";
import {
  CatalogAdminHeader,
  CatalogAdminContent,
} from "../_components/CatalogAdminSidebar";
import { ADMIN_NAV_LABELS } from "../_components/adminNav";
import { useAdminLang, useCopy, useFormat } from "../_lib/i18n";
import { translateApiMessage } from "../_lib/api-errors";
import {
  Save,
  Loader2,
  Palette,
  Phone,
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
  Globe,
  Banknote,
} from "lucide-react";
import {
  compressImage,
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

/** Part of the settings, as sent when one section is saved */
type SettingsUpdate = { [K in keyof Settings]?: Partial<NonNullable<Settings[K]>> };

type SettingsTab = "appearance" | "contact" | "pricing" | "features" | "ai";
/** Each tab saves its own part of the settings */
type SaveSection = "branding" | "contact" | "pricing" | "features" | "ai";
type OrderType = "dine_in" | "takeaway" | "delivery";
type UploadField = "logo_url" | "hero_image_url";

const ORDER_TYPE_IDS: OrderType[] = ["dine_in", "takeaway", "delivery"];

const copyEn = {
  sectionsLabel: "Settings sections",
  tabs: {
    appearance: "Branding",
    contact: "Contact",
    pricing: "Pricing & orders",
    features: "Features",
    ai: "AI waiter",
  } as Record<SettingsTab, string>,
  sectionNames: {
    branding: "Branding",
    contact: "Contact details",
    pricing: "Pricing and orders",
    features: "Features and button labels",
    ai: "AI waiter settings",
  } as Record<SaveSection, string>,
  saved: (section: string) => `${section} saved.`,
  saveFailed: "Couldn't save your changes. Please try again.",
  invalidImage: "Please choose an image file.",
  uploading: "Uploading…",
  uploaded: "Photo uploaded.",
  uploadFailed: "Couldn't upload the photo. Please try again.",
  replace: (label: string) => `Replace ${label.toLowerCase()}`,
  remove: (label: string) => `Remove ${label.toLowerCase()}`,
  dropHere: "Click or drag a photo here",
  colourPicker: (label: string) => `${label}: colour picker`,
  loading: "Loading settings…",

  // Branding
  identity: "Name and description",
  nameEn: "Business name in English",
  nameAr: "Business name in Arabic",
  descEn: "Description in English",
  descAr: "Description in Arabic",
  descPlaceholder: "A short description…",
  logo: "Logo",
  cover: "Cover photo",
  brandColour: "Brand colour",
  brandColourBody:
    "Your menu uses one colour: this one. It fills the selected category, buttons and highlights. We adjust it automatically so text stays readable in light and dark mode.",
  mainBrandColour: "Main brand colour",
  buttonSample: "Button sample",
  saveBranding: "Save branding",
  livePreview: "Live preview",
  previewTheme: "Preview theme",
  light: "Light",
  dark: "Dark",
  previewLanguage: "Preview language",
  previewCaption: "Your name, logo, cover and brand colour, including unsaved changes. Categories and dishes are samples.",

  // Contact
  contactDetails: "Contact details",
  phone: "Phone number",
  whatsapp: "WhatsApp number",
  email: "Email address",
  addressHeading: "Address",
  address: "Address",
  languageNames: { en: "English", ar: "Arabic" } as Record<"en" | "ar", string>,
  addressPlaceholder: { en: "Address in English", ar: "Address in Arabic" } as Record<"en" | "ar", string>,
  mapEmbed: "Google Maps embed link",
  saveContact: "Save contact details",

  // Pricing
  prices: "Prices",
  pricesBody: "Prices show in the currency you entered them in. Add your exchange rate to also show them in the other currency.",
  mainCurrency: "Main currency",
  usdFirst: "US dollar ($) shown first",
  lbpFirst: "Lebanese pound (L.L.) shown first",
  exchangeRate: "Exchange rate (L.L. per $1)",
  notSet: "Not set",
  rounding: "Converted pound prices are rounded to the nearest 1,000 L.L.",
  lastChanged: (date: string) => `Last changed ${date}.`,
  leaveEmpty: "Leave empty to never convert prices.",
  showBoth: "Show both currencies",
  showBothOn: "Turn off to show only the main currency.",
  showBothNeedsRate: "Set an exchange rate first.",
  whatsappOrders: "WhatsApp orders",
  whatsappOrdersBody: "Choose how guests can order. Orders arrive on the WhatsApp number from the Contact tab.",
  orderTypes: {
    dine_in: { label: "Dine-in", hint: "Guests order from their table (they're asked for the table number)" },
    takeaway: { label: "Takeaway", hint: "Guests pick up their order" },
    delivery: { label: "Delivery", hint: "Guests enter an address and area" },
  } as Record<OrderType, { label: string; hint: string }>,
  deliveryNoteEn: "Delivery note in English",
  deliveryNoteAr: "Delivery note in Arabic",
  savePricing: "Save pricing and orders",

  // Features
  features: "Features",
  whatsappOrdering: "WhatsApp orders",
  whatsappOrderingBody: "Let guests send their order on WhatsApp",
  bookings: "Bookings",
  bookingsBody: "Let guests book a table or an appointment",
  aiWaiter: "AI waiter",
  aiWaiterBody: "Let the AI waiter answer guests' questions about the menu",
  buttonLabels: "Button labels",
  menuButton: "Menu button on your About page",
  saveFeatures: "Save features and labels",

  // AI waiter
  aiPersonality: "AI waiter personality",
  aiName: "Name",
  aiNamePlaceholder: "e.g. Sarah",
  aiTone: "Tone and style",
  aiTonePlaceholder: "e.g. You are a charming waiter in a fine restaurant. You are formal and know a lot about wine.",
  status: "Status",
  aiOn: "Your AI waiter is on and answering guests.",
  aiOff: "The AI waiter is off. Turn it on in the Features tab.",
  saveAi: "Save AI waiter",
};
const copyAr: typeof copyEn = {
  sectionsLabel: "أقسام الإعدادات",
  tabs: {
    appearance: "الهوية",
    contact: "التواصل",
    pricing: "الأسعار والطلبات",
    features: "الميزات",
    ai: "النادل الذكي",
  },
  sectionNames: {
    branding: "الهوية",
    contact: "معلومات التواصل",
    pricing: "الأسعار والطلبات",
    features: "الميزات ونصوص الأزرار",
    ai: "إعدادات النادل الذكي",
  },
  saved: (section) => `تم حفظ ${section}.`,
  saveFailed: "تعذّر حفظ التعديلات. يُرجى المحاولة مرة أخرى.",
  invalidImage: "يُرجى اختيار ملف صورة.",
  uploading: "جارٍ الرفع…",
  uploaded: "تم رفع الصورة.",
  uploadFailed: "تعذّر رفع الصورة. يُرجى المحاولة مرة أخرى.",
  replace: (label) => `استبدال ${label}`,
  remove: (label) => `إزالة ${label}`,
  dropHere: "انقر أو اسحب صورة إلى هنا",
  colourPicker: (label) => `${label}: اختيار اللون`,
  loading: "جارٍ تحميل الإعدادات…",

  identity: "الاسم والوصف",
  nameEn: "الاسم بالإنجليزية",
  nameAr: "الاسم بالعربية",
  descEn: "الوصف بالإنجليزية",
  descAr: "الوصف بالعربية",
  descPlaceholder: "وصف مختصر…",
  logo: "الشعار",
  cover: "صورة الغلاف",
  brandColour: "لون الهوية",
  brandColourBody:
    "تستخدم قائمتك لوناً واحداً هو هذا اللون. يظهر في القسم المختار والأزرار والعناصر البارزة. نعدّله تلقائياً ليبقى النص واضحاً في الوضعين الفاتح والداكن.",
  mainBrandColour: "لون الهوية الأساسي",
  buttonSample: "مثال على زر",
  saveBranding: "حفظ الهوية",
  livePreview: "معاينة مباشرة",
  previewTheme: "مظهر المعاينة",
  light: "فاتح",
  dark: "داكن",
  previewLanguage: "لغة المعاينة",
  previewCaption: "اسمك وشعارك وصورة الغلاف ولون الهوية، مع التعديلات غير المحفوظة. الأقسام والأطباق للمعاينة فقط.",

  contactDetails: "معلومات التواصل",
  phone: "رقم الهاتف",
  whatsapp: "رقم واتساب",
  email: "البريد الإلكتروني",
  addressHeading: "العنوان",
  address: "العنوان",
  languageNames: { en: "الإنجليزية", ar: "العربية" },
  addressPlaceholder: { en: "العنوان بالإنجليزية", ar: "العنوان بالعربية" },
  mapEmbed: "رابط تضمين خرائط Google",
  saveContact: "حفظ معلومات التواصل",

  prices: "الأسعار",
  pricesBody: "تظهر الأسعار بالعملة التي أدخلتها بها. أضف سعر الصرف لعرضها بالعملة الأخرى أيضاً.",
  mainCurrency: "العملة الأساسية",
  usdFirst: "الدولار ($) أولاً",
  lbpFirst: "الليرة اللبنانية (ل.ل.) أولاً",
  exchangeRate: "سعر الصرف (ل.ل. مقابل 1$)",
  notSet: "غير محدد",
  rounding: "تُقرَّب الأسعار المحوّلة إلى الليرة إلى أقرب 1,000 ل.ل.",
  lastChanged: (date) => `آخر تعديل: ${date}.`,
  leaveEmpty: "اتركه فارغاً كي لا تُحوَّل الأسعار أبداً.",
  showBoth: "عرض العملتين",
  showBothOn: "أوقفه لعرض العملة الأساسية فقط.",
  showBothNeedsRate: "حدّد سعر الصرف أولاً.",
  whatsappOrders: "الطلبات عبر واتساب",
  whatsappOrdersBody: "اختر كيف يمكن للزبائن الطلب. تصل الطلبات إلى رقم واتساب المذكور في تبويب التواصل.",
  orderTypes: {
    dine_in: { label: "في المطعم", hint: "يطلب الزبائن من طاولتهم (ويُطلب منهم رقم الطاولة)" },
    takeaway: { label: "سفري", hint: "يستلم الزبائن طلبهم بأنفسهم" },
    delivery: { label: "توصيل", hint: "يُدخل الزبائن العنوان والمنطقة" },
  },
  deliveryNoteEn: "ملاحظة التوصيل بالإنجليزية",
  deliveryNoteAr: "ملاحظة التوصيل بالعربية",
  savePricing: "حفظ الأسعار والطلبات",

  features: "الميزات",
  whatsappOrdering: "الطلبات عبر واتساب",
  whatsappOrderingBody: "اسمح للزبائن بإرسال طلبهم عبر واتساب",
  bookings: "الحجوزات",
  bookingsBody: "اسمح للزبائن بحجز طاولة أو موعد",
  aiWaiter: "النادل الذكي",
  aiWaiterBody: "دع النادل الذكي يجيب عن أسئلة الزبائن حول القائمة",
  buttonLabels: "نصوص الأزرار",
  menuButton: "زر القائمة في صفحة من نحن",
  saveFeatures: "حفظ الميزات ونصوص الأزرار",

  aiPersonality: "شخصية النادل الذكي",
  aiName: "الاسم",
  aiNamePlaceholder: "مثال: سارة",
  aiTone: "الأسلوب وطريقة الكلام",
  aiTonePlaceholder: "مثال: أنت نادل لطيف في مطعم راقٍ، تتكلم بلباقة وتعرف الكثير عن النبيذ.",
  status: "الحالة",
  aiOn: "النادل الذكي مفعّل ويجيب على الزبائن.",
  aiOff: "النادل الذكي متوقف. فعّله من تبويب الميزات.",
  saveAi: "حفظ إعدادات النادل الذكي",
};

/** Save button at the bottom of each tab (outside the page so it keeps focus across renders) */
function SectionSaveButton({
  saving,
  disabled,
  label,
  onClick,
}: {
  saving: boolean;
  disabled: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={saving || disabled}
      className="w-full py-4 bg-ui-primary text-ui-primary-fg font-semibold rounded-control active:scale-[0.98] disabled:opacity-50 transition-all flex items-center justify-center gap-3 text-sm shadow-lg"
    >
      {saving ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden /> : <Save className="w-4 h-4" aria-hidden />}
      {label}
    </button>
  );
}

// Outside the page component, so typing or clicking doesn't remount them (which lost focus)
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
}) => {
  const t = useCopy({ en: copyEn, ar: copyAr });
  return (
    <div className="space-y-2">
      <label htmlFor={`${id}-hex`} className="text-xs font-semibold text-ui-muted ms-2">
        {label}
      </label>
      <div className="relative group">
        <div className="relative flex items-center gap-3 p-2 bg-ui-bg border border-ui-line rounded-control">
          <input
            id={`${id}-picker`}
            type="color"
            aria-label={t.colourPicker(label)}
            value={value || "#000000"}
            onChange={(e) => onChange(e.target.value)}
            className="w-12 h-12 rounded-xl cursor-pointer border-0 bg-transparent ring-1 ring-ui-line"
          />
          <input
            id={`${id}-hex`}
            type="text"
            dir="ltr"
            value={value || ""}
            onChange={(e) => onChange(e.target.value)}
            className="flex-1 min-h-11 bg-transparent border-0 text-ui-ink font-mono text-xs focus:ring-0 text-start"
            placeholder="#000000"
          />
        </div>
      </div>
    </div>
  );
};

const ProImageUpload = ({
  label,
  url,
  onUpload,
  onRemove,
  uploading,
  hint
}: {
  label: string,
  url?: string,
  onUpload: (e: React.ChangeEvent<HTMLInputElement> | File) => void,
  onRemove: () => void,
  uploading?: boolean,
  aspect?: "square" | "video",
  hint?: string
}) => {
  const t = useCopy({ en: copyEn, ar: copyAr });
  const [dragging, setDragging] = useState(false);

  return (
    <div className="glass-card p-5 sm:p-8 lg:p-10 flex flex-col h-full bg-ui-bg border border-ui-line rounded-panel transition-all duration-500 hover:bg-ui-subtle group/card">
      <div className="flex items-center justify-between gap-3 mb-8">
        <h3 className="text-xs font-semibold text-ui-muted">{label}</h3>
        {hint && <span className="text-xs font-semibold text-ui-muted" dir="ltr">{hint}</span>}
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
                <span className="sr-only">{t.replace(label)}</span>
                <input type="file" accept="image/*" onChange={onUpload} className="sr-only" />
              </label>
              <button
                type="button"
                onClick={onRemove}
                aria-label={t.remove(label)}
                className="w-11 h-11 lg:w-14 lg:h-14 bg-ui-surface text-ui-danger border border-ui-line rounded-control flex items-center justify-center active:scale-95 transition-all shadow-xl"
              >
                <X className="w-5 h-5 lg:w-6 lg:h-6" aria-hidden />
              </button>
            </div>
          </div>
        ) : (
          <label className="absolute inset-0 flex flex-col items-center justify-center cursor-pointer group/label">
            <div className="w-16 h-16 bg-ui-bg border border-ui-line rounded-panel flex items-center justify-center mb-4 group-hover/label:scale-110 group-hover/label:bg-primary/20 group-hover/label:border-primary/30 transition-all duration-500">
              <Upload className="w-6 h-6 text-ui-muted group-hover/label:text-primary" aria-hidden />
            </div>
            <p className="text-xs font-semibold text-ui-muted group-hover/label:text-white/40 transition-colors">{t.dropHere}</p>
            <span className="sr-only">{label}</span>
            <input type="file" accept="image/*" onChange={onUpload} className="hidden" />
          </label>
        )}

        {uploading && (
          <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center z-50 animate-in fade-in" role="status">
            <Loader2 className="w-10 h-10 text-ui-primary animate-spin mb-4" aria-hidden />
            <p className="text-xs font-semibold text-ui-ink">{t.uploading}</p>
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
      <span className="block text-sm font-semibold text-ui-ink">{label}</span>
      {description && <span className="block text-xs font-medium text-ui-muted mt-1">{description}</span>}
    </span>
    <span aria-hidden className={`shrink-0 w-14 h-8 rounded-full transition-all duration-500 relative flex items-center p-1 ${checked ? 'bg-ui-primary' : 'bg-ui-subtle'}`}>
      <span className={`w-6 h-6 rounded-full bg-white shadow-lg transition-all duration-500 ${checked ? 'translate-x-6 rtl:-translate-x-6' : 'translate-x-0'}`} />
    </span>
  </button>
);

function SettingsPageContent() {
  const { slug, user, fetchWithAuth } = useCatalogAdmin();
  const isViewer = user?.role === 'viewer';
  const lang = useAdminLang();
  const t = useCopy({ en: copyEn, ar: copyAr });
  const f = useFormat();

  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<SettingsTab>("appearance");
  const [previewMode, setPreviewMode] = useState<"light" | "dark">("light");
  // The sample menu starts in the dashboard language; the owner can switch it
  const [previewLang, setPreviewLang] = useState<PreviewLang>(lang);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [savingSection, setSavingSection] = useState<SaveSection | null>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      const token = localStorage.getItem(`catalog_admin_token_${slug}`);
      if (!token) return;

      try {
        const res = await fetchWithAuth(`/api/c/${slug}/admin/settings/`);

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
  }, [slug, fetchWithAuth]);

  const handleSaveSection = async (section: SaveSection, dataToSave: SettingsUpdate | null = settings) => {
    if (!settings) return;
    setSavingSection(section);
    setMessage(null);

    try {
      const res = await fetchWithAuth(`/api/c/${slug}/admin/settings/`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(dataToSave),
      });

      if (res.ok) {
        setMessage({ type: "success", text: t.saved(t.sectionNames[section]) });
        setTimeout(() => setMessage(null), 3000);
      } else {
        const err = await res.json().catch(() => null);
        throw new Error(err?.error || t.saveFailed);
      }
    } catch (error) {
      setMessage({ type: "error", text: (error instanceof Error && error.message) || t.saveFailed });
    } finally {
      setSavingSection(null);
    }
  };

  const [uploadingField, setUploadingField] = useState<UploadField | null>(null);

  const updateSettings = (
    section: keyof Settings,
    field: string,
    value: string | boolean
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
    field: UploadField
  ) => {
    const file = e instanceof File ? e : e.target.files?.[0];
    if (!file) return;

    if (!isImageFile(file)) {
      setMessage({ type: "error", text: t.invalidImage });
      return;
    }

    setUploadingField(field);

    try {
      const result = await compressImage(file, {
        maxSizeMB: 2,
        maxWidthOrHeight: 2048,
        quality: 0.85,
      });

      const token = localStorage.getItem(`catalog_admin_token_${slug}`);
      const formData = new FormData();
      formData.append("file", result.file);

      const res = await fetch(`/api/c/${slug}/admin/upload/`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        updateSettings(section, field, data.url);
        setUploadingField(null);
        setMessage({ type: "success", text: t.uploaded });
      } else {
        // e.g. "File too large", in the dashboard language
        const data = await res.json().catch(() => null);
        setMessage({ type: "error", text: typeof data?.error === "string" ? translateApiMessage(data.error, lang) : t.uploadFailed });
        setUploadingField(null);
      }
    } catch {
      setMessage({ type: "error", text: t.uploadFailed });
      setUploadingField(null);
    }
  };


  const saveProps = (section: SaveSection) => ({ saving: savingSection === section, disabled: isViewer });

  const tabs: { id: SettingsTab; icon: typeof Palette }[] = [
    { id: "appearance", icon: Palette },
    { id: "contact", icon: Phone },
    { id: "pricing", icon: Banknote },
    { id: "features", icon: ToggleRight },
    { id: "ai", icon: Brain },
  ];

  const parseRateDate = (value: string) => new Date(value.replace(" ", "T") + "Z");

  return (
    <>
      <CatalogAdminHeader title={ADMIN_NAV_LABELS[lang].settings} />

      <CatalogAdminContent>
        {message && (
          <div
            role={message.type === "error" ? "alert" : "status"}
            className={`mb-8 px-6 py-4 rounded-control text-sm font-semibold border animate-in slide-in-from-top-4 duration-500 ${message.type === "success"
              ? "bg-ui-subtle text-ui-primary border-ui-line"
              : "bg-ui-subtle text-ui-primary border-ui-line"
              }`}
          >
            {message.text}
          </div>
        )}

        {loading ? (
          <div className="space-y-8" role="status">
            <span className="sr-only">{t.loading}</span>
            <div className="h-12 bg-ui-subtle rounded-control w-1/3" />
            <div className="h-96 glass rounded-panel" />
          </div>
        ) : settings ? (
          <div className="space-y-10">
            {/* Tabs */}
            <div className="-mx-4 px-4 sm:mx-0 sm:px-0 overflow-x-auto scrollbar-hide">
            <div role="group" aria-label={t.sectionsLabel} className="flex gap-2 p-1.5 bg-ui-surface border border-ui-line rounded-panel w-max">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  aria-pressed={activeTab === tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex shrink-0 items-center gap-2 min-h-11 px-4 sm:px-5 rounded-control text-sm whitespace-nowrap transition-colors ${activeTab === tab.id
                    ? "bg-ui-primary text-ui-primary-fg font-semibold"
                    : "text-ui-muted font-medium hover:text-ui-ink hover:bg-ui-subtle"
                    }`}
                >
                  <tab.icon className="w-4 h-4" aria-hidden />
                  {t.tabs[tab.id]}
                </button>
              ))}
            </div>
            </div>

            <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
              {/* Branding */}
              {activeTab === "appearance" && (
                <div className="grid lg:grid-cols-12 gap-8 lg:gap-12 items-start">
                  <div className="lg:col-span-8 space-y-8">
                    {/* Name and description */}
                    <div className="glass-card p-5 sm:p-8 lg:p-10">
                      <div className="flex items-center gap-3 mb-8">
                        <div className="w-8 h-8 rounded-lg bg-ui-subtle flex items-center justify-center">
                          <Layout className="w-4 h-4 text-ui-primary" aria-hidden />
                        </div>
                        <h3 className="text-sm font-semibold text-ui-heading">{t.identity}</h3>
                      </div>

                      <div className="grid md:grid-cols-2 gap-8">
                        {/* English Name */}
                        <div className="space-y-4">
                          <label htmlFor="business-name-en" className="text-xs font-semibold text-ui-muted ms-2">{t.nameEn}</label>
                          <input
                            id="business-name-en"
                            type="text"
                            dir="ltr"
                            lang="en"
                            value={settings.catalog.name_en || settings.catalog.name || ""}
                            onChange={(e) => updateSettings("catalog", "name_en", e.target.value)}
                            className="w-full px-6 py-4 bg-ui-bg border border-ui-input rounded-control text-ui-ink font-bold text-sm focus:outline-none focus:border-ui-primary text-start"
                            placeholder="e.g. Sofra"
                          />
                        </div>
                        {/* Arabic Name */}
                        <div className="space-y-4">
                          <label htmlFor="business-name-ar" className="text-xs font-semibold text-ui-muted ms-2">{t.nameAr}</label>
                          <input
                            id="business-name-ar"
                            type="text"
                            dir="rtl"
                            lang="ar"
                            value={settings.catalog.name_ar || ""}
                            onChange={(e) => updateSettings("catalog", "name_ar", e.target.value)}
                            className="w-full px-6 py-4 bg-ui-bg border border-ui-input rounded-control text-ui-ink font-bold text-sm focus:outline-none focus:border-ui-primary text-start"
                            placeholder="مثال: مطعم متبل"
                          />
                        </div>
                      </div>

                      <div className="grid md:grid-cols-2 gap-8 mt-8">
                        {/* English Desc */}
                        <div className="space-y-4">
                          <label htmlFor="business-description-en" className="text-xs font-semibold text-ui-muted ms-2">{t.descEn}</label>
                          <textarea
                            id="business-description-en"
                            dir="ltr"
                            lang="en"
                            value={settings.catalog.description_en || settings.catalog.description || ""}
                            onChange={(e) => updateSettings("catalog", "description_en", e.target.value)}
                            className="w-full px-6 py-4 bg-ui-bg border border-ui-input rounded-control text-ui-ink font-medium text-xs h-24 focus:outline-none focus:border-ui-primary text-start"
                            placeholder={t.descPlaceholder}
                          />
                        </div>
                        {/* Arabic Desc */}
                        <div className="space-y-4">
                          <label htmlFor="business-description-ar" className="text-xs font-semibold text-ui-muted ms-2">{t.descAr}</label>
                          <textarea
                            id="business-description-ar"
                            dir="rtl"
                            lang="ar"
                            value={settings.catalog.description_ar || ""}
                            onChange={(e) => updateSettings("catalog", "description_ar", e.target.value)}
                            className="w-full px-6 py-4 bg-ui-bg border border-ui-input rounded-control text-ui-ink font-medium text-xs h-24 focus:outline-none focus:border-ui-primary text-start"
                            placeholder={t.descPlaceholder}
                          />
                        </div>
                      </div>
                    </div>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                      <div className="lg:col-span-1">
                        <ProImageUpload
                          label={t.logo}
                          url={settings.catalog.logo_url}
                          onUpload={(e) => handleImageUpload(e, "catalog", "logo_url")}
                          onRemove={() => updateSettings("catalog", "logo_url", "")}
                          uploading={uploadingField === "logo_url"}
                          hint="SVG / PNG"
                        />
                      </div>
                      <div className="lg:col-span-2">
                        <ProImageUpload
                          label={t.cover}
                          url={settings.appearance.hero_image_url}
                          onUpload={(e) => handleImageUpload(e, "appearance", "hero_image_url")}
                          onRemove={() => updateSettings("appearance", "hero_image_url", "")}
                          uploading={uploadingField === "hero_image_url"}
                          aspect="video"
                          hint="2048 × 1024 px"
                        />
                      </div>
                    </div>

                    <section className="glass-card p-5 sm:p-8 lg:p-10" aria-labelledby="brand-colour-heading">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-8 h-8 rounded-lg bg-ui-subtle flex items-center justify-center">
                          <Palette className="w-4 h-4 text-ui-primary" aria-hidden />
                        </div>
                        <h3 id="brand-colour-heading" className="text-base font-semibold text-ui-heading">{t.brandColour}</h3>
                      </div>
                      <p className="text-sm text-ui-muted mb-6 max-w-prose">
                        {t.brandColourBody}
                      </p>
                      <div className="flex flex-wrap items-end gap-4">
                        <div className="w-full sm:w-72">
                          <ColorInput
                            id="brand-colour"
                            label={t.mainBrandColour}
                            value={settings.appearance.color_primary}
                            onChange={(v) => updateSettings("appearance", "color_primary", v)}
                          />
                        </div>
                        <span
                          aria-hidden
                          className="mb-2 inline-flex h-11 items-center rounded-control px-4 text-sm font-semibold"
                          style={{ ...buildMenuTheme(settings.appearance.color_primary), backgroundColor: "var(--brand)", color: "var(--brand-fg)" }}
                        >
                          {t.buttonSample}
                        </span>
                      </div>
                    </section>

                    <div className="mt-8 pt-8 border-t border-ui-line">
                      <SectionSaveButton
                        {...saveProps("branding")}
                        label={t.saveBranding}
                        onClick={() =>
                          handleSaveSection("branding", {
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
                      />
                    </div>
                  </div>

                  {/* Side column: live miniature of the diner menu */}
                  <div className="lg:col-span-4 lg:sticky lg:top-6 z-10">
                    <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-ui-subtle flex items-center justify-center">
                          <Smartphone className="w-4 h-4 text-ui-primary" aria-hidden />
                        </div>
                        <h3 className="text-sm font-semibold text-ui-heading">{t.livePreview}</h3>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <div role="group" aria-label={t.previewTheme} className="flex p-1 bg-ui-surface border border-ui-line rounded-control">
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
                              {mode === "light" ? t.light : t.dark}
                            </button>
                          ))}
                        </div>
                        <div role="group" aria-label={t.previewLanguage} className="flex p-1 bg-ui-surface border border-ui-line rounded-control">
                          {([["en", "English"], ["ar", "العربية"]] as const).map(([code, label]) => (
                            <button
                              key={code}
                              type="button"
                              lang={code}
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
                        {t.previewCaption}
                      </figcaption>
                    </figure>
                  </div>
                </div>
              )}

              {/* Contact */}
              {activeTab === "contact" && (
                <div className="space-y-8">
                  <div className="glass-card p-5 sm:p-8 lg:p-10 space-y-10">
                    <h3 className="text-sm font-semibold text-ui-heading">{t.contactDetails}</h3>
                    <div className="grid md:grid-cols-2 gap-8">
                      <div className="space-y-4">
                        <label htmlFor="contact-phone_primary" className="text-xs font-semibold text-ui-muted ms-2 block">{t.phone}</label>
                        <input
                          id="contact-phone_primary"
                          type="tel"
                          dir="ltr"
                          value={settings.contact.phone_primary || ""}
                          onChange={(e) => updateSettings("contact", "phone_primary", e.target.value)}
                          className="w-full px-6 py-4 bg-ui-bg border border-ui-input rounded-control text-ui-ink font-semibold focus:outline-none focus:border-ui-primary transition-all text-start"
                          placeholder="+000 00 000 000"
                        />
                      </div>
                      <div className="space-y-4">
                        <label htmlFor="contact-phone_whatsapp" className="text-xs font-semibold text-ui-muted ms-2 block">{t.whatsapp}</label>
                        <input
                          id="contact-phone_whatsapp"
                          type="tel"
                          dir="ltr"
                          value={settings.contact.phone_whatsapp || ""}
                          onChange={(e) => updateSettings("contact", "phone_whatsapp", e.target.value)}
                          className="w-full px-6 py-4 bg-ui-bg border border-ui-input rounded-control text-ui-ink font-semibold focus:outline-none focus:border-ui-primary transition-all font-mono text-start"
                          placeholder="+96170123456"
                        />
                      </div>
                    </div>

                    <div className="space-y-4 pt-4">
                      <label htmlFor="contact-email" className="text-xs font-semibold text-ui-muted ms-2 block">{t.email}</label>
                      <input
                        id="contact-email"
                        type="email"
                        dir="ltr"
                        value={settings.contact.email || ""}
                        onChange={(e) => updateSettings("contact", "email", e.target.value)}
                        className="w-full px-6 py-4 bg-ui-bg border border-ui-input rounded-control text-ui-ink font-semibold focus:outline-none focus:border-ui-primary transition-all text-start"
                        placeholder="email@example.com"
                      />
                    </div>
                  </div>

                  <div className="glass-card p-5 sm:p-8 lg:p-10 space-y-10">
                    <h3 className="text-sm font-semibold text-ui-heading">{t.addressHeading}</h3>

                    <div className="space-y-8">
                      {/* Address in both languages */}
                      <div className="space-y-4">
                        <div className="grid gap-4">
                          {([
                            { id: 'en', field: 'address_en' },
                            { id: 'ar', field: 'address_ar' },
                          ] as const).map(locale => (
                            <div key={locale.id} className="relative flex items-center gap-3 bg-ui-bg border border-ui-line rounded-control px-6 py-4 group focus-within:border-primary/40 transition-all">
                              <label htmlFor={`contact-address-${locale.id}`} className="text-xs font-semibold text-ui-muted w-24 flex-shrink-0">{t.languageNames[locale.id]}</label>
                              <input
                                id={`contact-address-${locale.id}`}
                                type="text"
                                lang={locale.id}
                                value={settings.contact[locale.field] || ""}
                                onChange={(e) => updateSettings("contact", locale.field, e.target.value)}
                                className="flex-1 min-w-0 bg-transparent border-0 text-ui-ink font-semibold focus:ring-0 text-sm text-start"
                                dir={locale.id === 'ar' ? 'rtl' : 'ltr'}
                                placeholder={t.addressPlaceholder[locale.id]}
                              />
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Map */}
                      <div className="space-y-4 pt-6">
                        <label htmlFor="contact-map-url" className="text-xs font-semibold text-ui-muted ms-2 block">{t.mapEmbed}</label>
                        <input
                          id="contact-map-url"
                          type="url"
                          dir="ltr"
                          value={settings.contact.google_map_iframe_url || ""}
                          onChange={(e) => updateSettings("contact", "google_map_iframe_url", e.target.value)}
                          className="w-full px-6 py-4 bg-ui-bg border border-ui-input rounded-control text-ui-ink font-semibold focus:outline-none focus:border-ui-primary transition-all font-mono text-xs text-start"
                          placeholder="https://www.google.com/maps/embed?pb=..."
                        />
                      </div>
                    </div>

                    <div className="mt-8 pt-8 border-t border-ui-line">
                      <SectionSaveButton
                        {...saveProps("contact")}
                        label={t.saveContact}
                        onClick={() => handleSaveSection("contact", { contact: settings.contact })}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Pricing & ordering (dual USD/LBP and WhatsApp order types) */}
              {activeTab === "pricing" && settings.pricing && settings.ordering && (
                <div className="space-y-8">
                  <div className="glass-card p-5 sm:p-8 lg:p-10 space-y-8">
                    <div>
                      <h3 className="text-lg font-bold text-ui-heading">{t.prices}</h3>
                      <p className="mt-1 text-sm text-ui-muted">{t.pricesBody}</p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-8">
                      <div className="space-y-3">
                        <label htmlFor="currency-primary" className="text-sm font-semibold text-ui-ink block">{t.mainCurrency}</label>
                        <select
                          id="currency-primary"
                          value={settings.pricing.currency_primary}
                          onChange={(e) => updateSettings("pricing", "currency_primary", e.target.value)}
                          className="w-full px-6 py-4 bg-ui-bg border border-ui-input rounded-control text-ui-ink focus:outline-none focus:border-ui-primary transition-all"
                        >
                          <option value="USD">{t.usdFirst}</option>
                          <option value="LBP">{t.lbpFirst}</option>
                        </select>
                      </div>
                      <div className="space-y-3">
                        <label htmlFor="lbp-rate" className="text-sm font-semibold text-ui-ink block">{t.exchangeRate}</label>
                        {/* The owner's own rate: never pre-filled or suggested */}
                        <input
                          id="lbp-rate"
                          type="number"
                          inputMode="numeric"
                          dir="ltr"
                          min={1}
                          step={500}
                          value={settings.pricing.lbp_exchange_rate ?? ""}
                          placeholder={t.notSet}
                          onChange={(e) => updateSettings("pricing", "lbp_exchange_rate", e.target.value)}
                          className="w-full px-6 py-4 bg-ui-bg border border-ui-input rounded-control text-ui-ink focus:outline-none focus:border-ui-primary transition-all text-start"
                        />
                        <p className="text-xs text-ui-muted">
                          {t.rounding}{" "}
                          {settings.pricing.lbp_rate_updated_at
                            ? t.lastChanged(f.dateTime(parseRateDate(settings.pricing.lbp_rate_updated_at)))
                            : t.leaveEmpty}
                        </p>
                      </div>
                    </div>

                    <ToggleSwitch
                      label={t.showBoth}
                      description={settings.pricing.lbp_exchange_rate ? t.showBothOn : t.showBothNeedsRate}
                      checked={settings.pricing.show_dual_currency && !!settings.pricing.lbp_exchange_rate}
                      onChange={(value) => updateSettings("pricing", "show_dual_currency", value)}
                    />
                  </div>

                  <div className="glass-card p-5 sm:p-8 lg:p-10 space-y-8">
                    <div>
                      <h3 className="text-lg font-bold text-ui-heading">{t.whatsappOrders}</h3>
                      <p className="mt-1 text-sm text-ui-muted">{t.whatsappOrdersBody}</p>
                    </div>

                    <div className="space-y-4">
                      {ORDER_TYPE_IDS.map((id) => {
                        const enabled = settings.ordering.order_types.split(",").includes(id);
                        return (
                          <ToggleSwitch
                            key={id}
                            label={t.orderTypes[id].label}
                            description={t.orderTypes[id].hint}
                            checked={enabled}
                            onChange={(value) => {
                              const current = settings.ordering.order_types.split(",").filter(Boolean);
                              const next = value ? [...current, id] : current.filter((type) => type !== id);
                              updateSettings(
                                "ordering",
                                "order_types",
                                ORDER_TYPE_IDS.filter((type) => next.includes(type)).join(",")
                              );
                            }}
                          />
                        );
                      })}
                    </div>

                    {settings.ordering.order_types.split(",").includes("delivery") && (
                      <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-3">
                          <label htmlFor="delivery-note-en" className="text-sm font-semibold text-ui-ink block">{t.deliveryNoteEn}</label>
                          <textarea
                            id="delivery-note-en"
                            dir="ltr"
                            lang="en"
                            rows={3}
                            value={settings.ordering.delivery_note_en}
                            onChange={(e) => updateSettings("ordering", "delivery_note_en", e.target.value)}
                            placeholder="e.g. Free delivery in Hamra and Verdun"
                            className="w-full px-6 py-4 bg-ui-bg border border-ui-input rounded-control text-ui-ink focus:outline-none focus:border-ui-primary transition-all resize-none text-start"
                          />
                        </div>
                        <div className="space-y-3">
                          <label htmlFor="delivery-note-ar" className="text-sm font-semibold text-ui-ink block">{t.deliveryNoteAr}</label>
                          <textarea
                            id="delivery-note-ar"
                            dir="rtl"
                            lang="ar"
                            rows={3}
                            value={settings.ordering.delivery_note_ar}
                            onChange={(e) => updateSettings("ordering", "delivery_note_ar", e.target.value)}
                            placeholder="مثلاً: توصيل مجاني في الحمرا وفردان"
                            className="w-full px-6 py-4 bg-ui-bg border border-ui-input rounded-control text-ui-ink focus:outline-none focus:border-ui-primary transition-all resize-none text-start"
                          />
                        </div>
                      </div>
                    )}

                    <div className="pt-8 border-t border-ui-line">
                      <SectionSaveButton
                        {...saveProps("pricing")}
                        label={t.savePricing}
                        onClick={() => handleSaveSection("pricing", { pricing: settings.pricing, ordering: settings.ordering })}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Features */}
              {activeTab === "features" && (
                <div className="space-y-8">
                  <div className="glass-card p-5 sm:p-8 lg:p-10 space-y-6">
                    <h3 className="text-sm font-semibold text-ui-heading mb-10">{t.features}</h3>
                    <ToggleSwitch
                      label={t.whatsappOrdering}
                      description={t.whatsappOrderingBody}
                      checked={settings.features.whatsapp_order_enabled}
                      onChange={(v) => updateSettings("features", "whatsapp_order_enabled", v)}
                    />
                    <ToggleSwitch
                      label={t.bookings}
                      description={t.bookingsBody}
                      checked={settings.features.booking_enabled}
                      onChange={(v) => updateSettings("features", "booking_enabled", v)}
                    />
                    <ToggleSwitch
                      label={t.aiWaiter}
                      description={t.aiWaiterBody}
                      checked={settings.features.ai_waiter_enabled}
                      onChange={(v) => updateSettings("features", "ai_waiter_enabled", v)}
                    />
                  </div>

                  <div className="glass-card p-5 sm:p-8 lg:p-10">
                    <h3 className="text-sm font-semibold text-ui-heading mb-10">{t.buttonLabels}</h3>
                    <div className="space-y-12">
                      {[
                        { id: 'cta_menu_label', title: t.menuButton },
                      ].map(section => (
                        <div key={section.id} className="space-y-6">
                          <h4 className="text-xs font-semibold text-ui-muted border-b border-ui-line pb-2">{section.title}</h4>
                          <div className="grid md:grid-cols-2 gap-6">
                            {(["en", "ar"] as const).map((fieldLang) => (
                              <div key={fieldLang} className="space-y-2">
                                <label htmlFor={`${section.id}_${fieldLang}`} className="text-xs font-semibold text-ui-muted ms-1">{t.languageNames[fieldLang]}</label>
                                <input
                                  id={`${section.id}_${fieldLang}`}
                                  type="text"
                                  lang={fieldLang}
                                  value={settings.cta[`${section.id}_${fieldLang}` as keyof Settings['cta']] || ""}
                                  onChange={(e) => updateSettings("cta", `${section.id}_${fieldLang}`, e.target.value)}
                                  className="w-full px-4 py-3 bg-ui-bg border border-ui-input rounded-xl text-ui-ink font-semibold focus:outline-none focus:border-ui-primary transition-all text-xs text-start"
                                  dir={fieldLang === 'ar' ? 'rtl' : 'ltr'}
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="mt-8 pt-8 border-t border-ui-line">
                      <SectionSaveButton
                        {...saveProps("features")}
                        label={t.saveFeatures}
                        onClick={() =>
                          handleSaveSection("features", {
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
                      />
                    </div>
                  </div>
                </div>
              )}


              {/* AI waiter */}
              {activeTab === "ai" && (
                <div className="space-y-8">
                  <div className="glass-card p-5 sm:p-8 lg:p-10 space-y-10">
                    <h3 className="text-sm font-semibold text-ui-heading">{t.aiPersonality}</h3>
                    <div className="grid md:grid-cols-2 gap-8">
                      <div className="space-y-4">
                        <label htmlFor="ai-waiter-name" className="text-xs font-semibold text-ui-muted ms-2">{t.aiName}</label>
                        <div className="relative">
                          <BotIcon className="absolute start-6 top-1/2 -translate-y-1/2 w-5 h-5 text-ui-primary" aria-hidden />
                          <input
                            id="ai-waiter-name"
                            type="text"
                            value={settings.features.ai_waiter_name || ""}
                            onChange={(e) => updateSettings("features", "ai_waiter_name", e.target.value)}
                            className="w-full ps-14 pe-6 py-5 bg-ui-bg border border-ui-input rounded-control text-ui-ink font-semibold focus:outline-none focus:border-ui-primary"
                            placeholder={t.aiNamePlaceholder}
                          />
                        </div>
                      </div>
                      <div className="space-y-4">
                        <label htmlFor="ai-waiter-persona" className="text-xs font-semibold text-ui-muted ms-2">{t.aiTone}</label>
                        <textarea
                          id="ai-waiter-persona"
                          dir="auto"
                          value={settings.features.ai_waiter_persona || ""}
                          onChange={(e) => updateSettings("features", "ai_waiter_persona", e.target.value)}
                          className="w-full px-6 py-4 bg-ui-bg border border-ui-input rounded-control text-ui-ink font-medium text-sm h-24 focus:outline-none focus:border-ui-primary"
                          placeholder={t.aiTonePlaceholder}
                        />
                      </div>
                    </div>
                    <div className="p-5 sm:p-8 bg-ui-subtle border border-ui-line rounded-panel flex items-center gap-6">
                      <div className="w-12 h-12 shrink-0 bg-ui-primary rounded-control flex items-center justify-center text-ui-primary-fg">
                        <SparklesIcon className="w-6 h-6" aria-hidden />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-ui-primary">{t.status}</p>
                        <p className="text-ui-muted text-xs font-medium leading-relaxed mt-1">
                          {settings.features.ai_waiter_enabled ? t.aiOn : t.aiOff}
                        </p>
                      </div>
                    </div>

                    <div className="mt-8 pt-8 border-t border-ui-line">
                      <SectionSaveButton
                        {...saveProps("ai")}
                        label={t.saveAi}
                        onClick={() =>
                          handleSaveSection("ai", {
                            features: {
                              ai_waiter_name: settings.features.ai_waiter_name,
                              ai_waiter_persona: settings.features.ai_waiter_persona,
                            },
                          })
                        }
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center py-32 glass rounded-panel border border-ui-line" role="status">
            <Loader2 className="w-12 h-12 text-ui-primary animate-spin mx-auto mb-6" aria-hidden />
            <p className="text-sm font-semibold text-ui-muted">
              {t.loading}
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
