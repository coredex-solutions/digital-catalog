"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { AlertTriangle, ArrowLeft, Camera, CheckCircle2, Download, FileSpreadsheet, Info, Loader2, Sparkles, Trash2, Upload } from "lucide-react";
import { CatalogAdminShell, useCatalogAdmin } from "../../_components/CatalogAdminShell";
import { CatalogAdminContent, CatalogAdminHeader } from "../../_components/CatalogAdminSidebar";
import { plural, pickName, useAdminLang, useCopy, useFormat, type AdminLang } from "../../_lib/i18n";
import { formatMoney } from "@/lib/catalog/price";
import {
  IMPORT_LIMITS,
  TEMPLATE_CSV,
  categoriesFromExtraction,
  categoriesFromTable,
  parseTable,
  sameName,
  type ImportCategory,
  type ImportCurrency,
  type ImportDish,
} from "@/lib/catalog/import";
import { compressImage } from "@/utils/image-compression";

const en = {
  title: "Import dishes",
  back: "Dishes",
  intro: "Add many dishes at once from a spreadsheet or a photo of your printed menu. You check everything before it is added, and guests only see it after you publish.",
  viewOnly: "Your account has view-only access, so you can't import dishes.",
  // Spreadsheet
  sheetTitle: "From a spreadsheet",
  sheetBody: "Columns for category, name, description and price, in English, Arabic or both. Each row is one dish.",
  template: "Download the template",
  chooseCsv: "Choose a CSV file",
  excelHint: "Excel file? Use File › Save as › CSV UTF-8, or copy the rows and paste them below.",
  pasteLabel: "Or paste rows from Excel or Google Sheets, including the header row",
  usePasted: "Use pasted rows",
  missingColumns: (cols: string) => `We couldn't find a ${cols} column. Check that the first row has the column names, as in the template.`,
  colName: "name",
  colPrice: "price",
  and: " and ",
  emptySheet: "There are no dishes in these rows.",
  readFileFailed: "Couldn't read this file. Save it as CSV UTF-8 and try again.",
  // Photo
  photoTitle: "From a photo of your menu",
  photoBody: "Photos or a PDF of your printed menu. AI copies the dishes and prices as printed. It doesn't translate and can make mistakes, so you check every line.",
  choosePhotos: "Choose photos or a PDF",
  photoLimits: "Up to 5 photos or one PDF, 9 MB in total.",
  remove: (name: string) => `Remove ${name}`,
  read: "Read my menu",
  reading: "Reading your menu… This can take up to a minute.",
  tooLarge: "These files are too large. Use up to 5 photos or one PDF, 9 MB in total.",
  readFailed: "We couldn't read this menu. Try again with a clearer photo, or use a spreadsheet.",
  noCredits: "Reading a menu doesn't use your AI photo credits.",
  // Review
  reviewTitle: "Check before importing",
  aiNote: "Read by AI. Compare every name and price with your printed menu before importing.",
  summary: (dishes: number, groups: number, lang: AdminLang) =>
    `${plural(lang, dishes, { one: "# dish", other: "# dishes" })} in ${plural(lang, groups, { one: "# category", other: "# categories" })}`,
  defaultCurrency: "Prices without a currency sign are in",
  usd: "US dollars",
  lbp: "Lebanese pounds",
  addTo: "Add these dishes to",
  newCategory: "A new category",
  categoryNameEn: "Category name in English",
  categoryNameAr: "Category name in Arabic",
  nameCategory: "Give this category a name, or add its dishes to an existing one.",
  include: (name: string) => `Import ${name}`,
  nameEn: "English name",
  nameAr: "Arabic name",
  price: "Price",
  currency: "Currency",
  noName: "Add a name in Arabic or English.",
  noPrice: "Add a price.",
  printedAs: (text: string) => `Printed as: ${text}`,
  duplicate: "Already on your menu. Tick it to import it again.",
  options: (list: string) => `Options: ${list}`,
  unnamed: "this dish",
  noAllergens: "Allergens and dietary tags are not imported. Add them on each dish after checking with your kitchen.",
  overLimit: (max: number, have: number, adding: number) => `Your plan allows ${max} dishes. You have ${have}, and this would add ${adding}. Untick some dishes or upgrade your plan.`,
  fixFirst: (n: number, lang: AdminLang) => plural(lang, n, { one: "Fix # line to continue.", other: "Fix # lines to continue." }),
  importButton: (n: number, lang: AdminLang) => plural(lang, n, { one: "Import # dish", other: "Import # dishes" }),
  importing: "Importing…",
  startOver: "Start over",
  importFailed: "Could not import. Nothing was added. Please try again.",
  // Done
  doneTitle: "Dishes added",
  doneBody: (dishes: number, categories: number, lang: AdminLang) =>
    `${plural(lang, dishes, { one: "# dish was", other: "# dishes were" })} added${categories ? `, with ${plural(lang, categories, { one: "# new category", other: "# new categories" })}` : ""}.`,
  doneNote: "They are saved as unpublished changes: guests see them after you publish.",
  reviewPublish: "Review & publish",
  goDishes: "Go to dishes",
  importMore: "Import more",
};

const ar: typeof en = {
  title: "استيراد الأطباق",
  back: "الأطباق",
  intro: "أضف أطباقاً كثيرة دفعة واحدة من جدول أو من صورة قائمتك المطبوعة. تراجع كل شيء قبل إضافته، ولا يراه الزبائن إلا بعد النشر.",
  viewOnly: "حسابك للمشاهدة فقط، لذلك لا يمكنك استيراد الأطباق.",
  sheetTitle: "من جدول",
  sheetBody: "أعمدة للقسم والاسم والوصف والسعر، بالإنجليزية أو العربية أو بالاثنتين. كل صف طبق واحد.",
  template: "تنزيل النموذج",
  chooseCsv: "اختر ملف CSV",
  excelHint: "ملف Excel؟ احفظه من «ملف ‹ حفظ باسم ‹ CSV UTF-8»، أو انسخ الصفوف والصقها في الأسفل.",
  pasteLabel: "أو الصق صفوفاً من Excel أو Google Sheets، مع صف عناوين الأعمدة",
  usePasted: "استخدم الصفوف الملصقة",
  missingColumns: (cols) => `لم نجد عمود ${cols}. تأكد أن الصف الأول يحتوي على أسماء الأعمدة كما في النموذج.`,
  colName: "الاسم",
  colPrice: "السعر",
  and: " و",
  emptySheet: "لا توجد أطباق في هذه الصفوف.",
  readFileFailed: "تعذّرت قراءة هذا الملف. احفظه بصيغة CSV UTF-8 ثم حاول مجدداً.",
  photoTitle: "من صورة قائمتك",
  photoBody: "صور أو ملف PDF لقائمتك المطبوعة. ينسخ الذكاء الاصطناعي الأطباق والأسعار كما هي مطبوعة، ولا يترجم، وقد يخطئ، لذلك تراجع كل سطر.",
  choosePhotos: "اختر صوراً أو ملف PDF",
  photoLimits: "حتى 5 صور أو ملف PDF واحد، بحجم 9 ميغابايت كحد أقصى.",
  remove: (name) => `إزالة ${name}`,
  read: "اقرأ قائمتي",
  reading: "جارٍ قراءة قائمتك… قد يستغرق ذلك حتى دقيقة.",
  tooLarge: "الملفات كبيرة جداً. استخدم حتى 5 صور أو ملف PDF واحداً، بحجم 9 ميغابايت كحد أقصى.",
  readFailed: "تعذّرت قراءة هذه القائمة. جرّب صورة أوضح، أو استخدم جدولاً.",
  noCredits: "قراءة القائمة لا تستهلك رصيد صور الذكاء الاصطناعي.",
  reviewTitle: "راجع قبل الاستيراد",
  aiNote: "قرأها الذكاء الاصطناعي. قارن كل اسم وسعر بقائمتك المطبوعة قبل الاستيراد.",
  summary: (dishes, groups, lang) =>
    `${plural(lang, dishes, { one: "طبق واحد", two: "طبقان", few: "# أطباق", many: "# طبقاً", other: "# طبق" })} في ${plural(lang, groups, { one: "قسم واحد", two: "قسمين", few: "# أقسام", many: "# قسماً", other: "# قسم" })}`,
  defaultCurrency: "الأسعار التي لا تحمل رمز عملة هي بـ",
  usd: "الدولار الأميركي",
  lbp: "الليرة اللبنانية",
  addTo: "أضف هذه الأطباق إلى",
  newCategory: "قسم جديد",
  categoryNameEn: "اسم القسم بالإنجليزية",
  categoryNameAr: "اسم القسم بالعربية",
  nameCategory: "أعطِ هذا القسم اسماً، أو أضف أطباقه إلى قسم موجود.",
  include: (name) => `استيراد ${name}`,
  nameEn: "الاسم بالإنجليزية",
  nameAr: "الاسم بالعربية",
  price: "السعر",
  currency: "العملة",
  noName: "أضف اسماً بالعربية أو بالإنجليزية.",
  noPrice: "أضف السعر.",
  printedAs: (text) => `كما هو مطبوع: ${text}`,
  duplicate: "موجود في قائمتك. علّمه لاستيراده مرة أخرى.",
  options: (list) => `الخيارات: ${list}`,
  unnamed: "هذا الطبق",
  noAllergens: "لا تُستورد مسببات الحساسية والوسوم الغذائية. أضفها لكل طبق بعد التحقق مع مطبخك.",
  overLimit: (max, have, adding) => `تسمح باقتك بـ ${max} طبق. لديك ${have}، وهذا الاستيراد يضيف ${adding}. ألغِ تحديد بعض الأطباق أو رقِّ باقتك.`,
  fixFirst: (n, lang) => plural(lang, n, { one: "صحّح سطراً واحداً للمتابعة.", two: "صحّح سطرين للمتابعة.", few: "صحّح # أسطر للمتابعة.", many: "صحّح # سطراً للمتابعة.", other: "صحّح # سطر للمتابعة." }),
  importButton: (n, lang) => plural(lang, n, { one: "استيراد طبق واحد", two: "استيراد طبقين", few: "استيراد # أطباق", many: "استيراد # طبقاً", other: "استيراد # طبق" }),
  importing: "جارٍ الاستيراد…",
  startOver: "البدء من جديد",
  importFailed: "تعذّر الاستيراد، ولم تُضف أي أطباق. حاول مرة أخرى.",
  doneTitle: "تمت إضافة الأطباق",
  doneBody: (dishes, categories, lang) =>
    `أُضيف ${plural(lang, dishes, { one: "طبق واحد", two: "طبقان", few: "# أطباق", many: "# طبقاً", other: "# طبق" })}${categories ? `، مع ${plural(lang, categories, { one: "قسم جديد واحد", two: "قسمين جديدين", few: "# أقسام جديدة", many: "# قسماً جديداً", other: "# قسم جديد" })}` : ""}.`,
  doneNote: "حُفظت كتعديلات غير منشورة: يراها الزبائن بعد النشر.",
  reviewPublish: "مراجعة ونشر",
  goDishes: "الانتقال إلى الأطباق",
  importMore: "استيراد المزيد",
};

type Copy = typeof en;

interface ExistingCategory { id: string; name_en: string; name_ar?: string | null }
interface ExistingDish { name_en: string; name_ar?: string | null; category_id: string }

interface ReviewDish extends ImportDish {
  key: string;
  include: boolean;
  duplicate: boolean;
}
interface ReviewGroup {
  key: string;
  name_en: string;
  name_ar: string;
  /** "new" or an existing category id */
  target: string;
  dishes: ReviewDish[];
}

type Step = "choose" | "review" | "done";
type Source = "spreadsheet" | "photo";

const field = "min-h-11 w-full rounded-control border border-ui-input bg-ui-surface px-3 text-sm";
const primaryButton = "inline-flex min-h-11 items-center justify-center gap-2 rounded-control bg-ui-primary px-5 text-sm font-semibold text-ui-primary-fg hover:bg-ui-primary-hover disabled:opacity-50";
const secondaryButton = "inline-flex min-h-11 items-center justify-center gap-2 rounded-control border border-ui-input bg-ui-surface px-4 text-sm font-semibold text-ui-ink hover:bg-ui-subtle";

let counter = 0;
const nextKey = () => `k${++counter}`;
const newImportKey = () => (typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `imp-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`);

const dishProblem = (dish: ReviewDish): "name" | "price" | null =>
  !dish.name_en.trim() && !dish.name_ar.trim() ? "name" : dish.options.length === 0 && dish.price === null ? "price" : null;

function ImportContent() {
  const { slug, user, fetchWithAuth, features } = useCatalogAdmin();
  const lang = useAdminLang();
  const t = useCopy({ en, ar });
  const f = useFormat();
  const isViewer = user?.role === "viewer";

  const [step, setStep] = useState<Step>("choose");
  const [source, setSource] = useState<Source>("spreadsheet");
  const [existingCategories, setExistingCategories] = useState<ExistingCategory[]>([]);
  const [existingDishes, setExistingDishes] = useState<ExistingDish[]>([]);
  const [fallback, setFallback] = useState<ImportCurrency>("USD");
  const [groups, setGroups] = useState<ReviewGroup[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [pasted, setPasted] = useState("");
  const [photos, setPhotos] = useState<File[]>([]);
  const [reading, setReading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{ dishes: number; categories: number } | null>(null);
  const importKey = useRef(newImportKey());
  const reviewHeading = useRef<HTMLHeadingElement>(null);

  // What is already on the menu (for matching categories and spotting duplicates) and the
  // menu's main currency (for prices written without a sign)
  useEffect(() => {
    Promise.all([
      fetchWithAuth(`/api/c/${slug}/admin/categories/`).then((r) => (r.ok ? r.json() : null)),
      fetchWithAuth(`/api/c/${slug}/admin/items/`).then((r) => (r.ok ? r.json() : null)),
      fetchWithAuth(`/api/c/${slug}/admin/settings/`).then((r) => (r.ok ? r.json() : null)),
    ])
      .then(([cats, items, settings]) => {
        setExistingCategories(cats?.categories || []);
        setExistingDishes(items?.items || []);
        if (settings?.pricing?.currency_primary === "LBP") setFallback("LBP");
      })
      .catch(() => {});
  }, [slug, fetchWithAuth]);

  useEffect(() => {
    if (step === "review") reviewHeading.current?.focus();
  }, [step]);

  /** Read categories into review groups, matched against the current menu */
  const review = (categories: ImportCategory[], from: Source) => {
    const next = categories.map((category) => {
      const match = existingCategories.find((c) => sameName(c, category));
      return {
        key: nextKey(),
        name_en: category.name_en,
        name_ar: category.name_ar,
        target: match ? match.id : "new",
        dishes: category.dishes.map((dish) => {
          const duplicate = existingDishes.some((d) => (!match || d.category_id === match.id) && sameName(d, dish));
          return { ...dish, key: nextKey(), include: !duplicate, duplicate };
        }),
      };
    });
    setGroups(next);
    setSource(from);
    setError(null);
    importKey.current = newImportKey();
    setStep("review");
  };

  // ---- Spreadsheet ----
  const fromTableText = (text: string) => {
    const table = categoriesFromTable(parseTable(text), fallback);
    if (table.missingColumns.length) {
      const names = table.missingColumns.map((c) => (c === "name" ? t.colName : t.colPrice)).join(t.and);
      setError(t.missingColumns(names));
      return;
    }
    if (table.categories.length === 0) {
      setError(t.emptySheet);
      return;
    }
    review(table.categories, "spreadsheet");
  };

  const onCsv = async (file: File | undefined) => {
    if (!file) return;
    try {
      fromTableText(await file.text());
    } catch {
      setError(t.readFileFailed);
    }
  };

  const downloadTemplate = () => {
    const url = URL.createObjectURL(new Blob([TEMPLATE_CSV], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "coredex-menu-template.csv";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  // ---- Photo / PDF ----
  const addPhotos = (list: FileList | null) => {
    if (!list) return;
    setError(null);
    setPhotos((prev) => [...prev, ...Array.from(list)].slice(0, IMPORT_LIMITS.files));
  };

  const readMenu = async () => {
    if (photos.length === 0) return;
    setReading(true);
    setError(null);
    try {
      // Photos are shrunk first (text stays readable at 2400px); PDFs are sent as they are
      const prepared = await Promise.all(
        photos.map(async (file) =>
          /^image\/(jpeg|png|webp)$/.test(file.type)
            ? (await compressImage(file, { maxSizeMB: 1.5, maxWidthOrHeight: 2400, quality: 0.85 })).file
            : file
        )
      );
      if (prepared.reduce((sum, file) => sum + file.size, 0) > IMPORT_LIMITS.totalBytes) {
        setError(t.tooLarge);
        return;
      }
      const form = new FormData();
      prepared.forEach((file) => form.append("files", file));
      const res = await fetchWithAuth(`/api/c/${slug}/admin/import/read/`, { method: "POST", body: form });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(data?.error || t.readFailed);
        return;
      }
      const categories = categoriesFromExtraction(data?.menu, fallback);
      if (categories.length === 0) {
        setError(t.readFailed);
        return;
      }
      review(categories, "photo");
    } catch {
      setError(t.readFailed);
    } finally {
      setReading(false);
    }
  };

  // ---- Review ----
  const updateGroup = (key: string, patch: Partial<ReviewGroup>) => setGroups((prev) => prev.map((g) => (g.key === key ? { ...g, ...patch } : g)));
  const updateDish = (groupKey: string, dishKey: string, patch: Partial<ReviewDish>) =>
    setGroups((prev) => prev.map((g) => (g.key === groupKey ? { ...g, dishes: g.dishes.map((d) => (d.key === dishKey ? { ...d, ...patch } : d)) } : g)));

  const changeFallback = (currency: ImportCurrency) => {
    setFallback(currency);
    // Only prices that had no currency of their own follow the default
    setGroups((prev) => prev.map((g) => ({ ...g, dishes: g.dishes.map((d) => (d.currencyExplicit ? d : { ...d, currency })) })));
  };

  const included = useMemo(() => groups.flatMap((g) => g.dishes.filter((d) => d.include)), [groups]);
  const usedGroups = groups.filter((g) => g.dishes.some((d) => d.include));
  const unnamedGroups = usedGroups.filter((g) => g.target === "new" && !g.name_en.trim() && !g.name_ar.trim());
  const problems = included.filter((d) => dishProblem(d) !== null).length + unnamedGroups.length;
  const maxItems = features?.max_items ?? Infinity;
  const overLimit = existingDishes.length + included.length > maxItems;

  const runImport = async () => {
    if (included.length === 0 || problems > 0 || overLimit) return;
    setImporting(true);
    setError(null);
    try {
      const res = await fetchWithAuth(`/api/c/${slug}/admin/import/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          importKey: importKey.current,
          source,
          categories: usedGroups.map((g) => ({
            existingId: g.target === "new" ? null : g.target,
            name_en: g.name_en,
            name_ar: g.name_ar,
            dishes: g.dishes
              .filter((d) => d.include)
              .map((d) => ({
                name_en: d.name_en,
                name_ar: d.name_ar,
                description_en: d.description_en,
                description_ar: d.description_ar,
                price: d.price,
                currency: d.currency,
                options: d.options.map((o) => ({ name_en: o.name_en, name_ar: o.name_ar, price: o.price })),
              })),
          })),
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(data?.error || t.importFailed);
        return;
      }
      window.dispatchEvent(new Event("menu-draft-changed"));
      setResult({ dishes: Number(data.dishes) || included.length, categories: Number(data.categories) || 0 });
      setStep("done");
    } catch {
      setError(t.importFailed);
    } finally {
      setImporting(false);
    }
  };

  const startOver = () => {
    setGroups([]);
    setPhotos([]);
    setPasted("");
    setError(null);
    setResult(null);
    setStep("choose");
  };

  const errorBox = error && (
    <p role="alert" className="flex items-start gap-2 rounded-control border border-ui-danger bg-ui-subtle px-4 py-3 text-sm text-ui-danger">
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
      {error}
    </p>
  );

  return (
    <>
      <CatalogAdminHeader title={t.title}>
        <Link href={`/c/${slug}/admin/items/`} className={secondaryButton}>
          <ArrowLeft className="h-4 w-4 rtl:-scale-x-100" aria-hidden />
          {t.back}
        </Link>
      </CatalogAdminHeader>

      <CatalogAdminContent>
        <div className="mx-auto max-w-4xl space-y-6">
          {isViewer ? (
            <p className="rounded-panel border border-ui-line bg-ui-surface p-5 text-sm text-ui-muted">{t.viewOnly}</p>
          ) : step === "choose" ? (
            <>
              <p className="text-ui-muted">{t.intro}</p>
              {errorBox}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <section aria-labelledby="sheet-title" className="flex flex-col gap-4 rounded-panel border border-ui-line bg-ui-surface p-5">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-control bg-ui-subtle text-ui-primary">
                      <FileSpreadsheet className="h-5 w-5" aria-hidden />
                    </span>
                    <h2 id="sheet-title" className="text-lg font-semibold">{t.sheetTitle}</h2>
                  </div>
                  <p className="text-sm text-ui-muted">{t.sheetBody}</p>
                  <div className="flex flex-wrap gap-2">
                    <button type="button" onClick={downloadTemplate} className={secondaryButton}>
                      <Download className="h-4 w-4" aria-hidden />
                      {t.template}
                    </button>
                    <label className={`${primaryButton} cursor-pointer focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-ui-focus`}>
                      <Upload className="h-4 w-4" aria-hidden />
                      {t.chooseCsv}
                      <input type="file" accept=".csv,.tsv,.txt,text/csv,text/tab-separated-values,text/plain" className="sr-only" onChange={(e) => { onCsv(e.target.files?.[0]); e.target.value = ""; }} />
                    </label>
                  </div>
                  <p className="text-xs text-ui-muted">{t.excelHint}</p>
                  <div>
                    <label htmlFor="paste-rows" className="mb-1.5 block text-sm font-medium">{t.pasteLabel}</label>
                    <textarea id="paste-rows" dir="auto" rows={5} value={pasted} onChange={(e) => setPasted(e.target.value)} className="w-full rounded-control border border-ui-input bg-ui-bg p-3 font-mono text-xs" />
                    <button type="button" disabled={!pasted.trim()} onClick={() => fromTableText(pasted)} className={`${secondaryButton} mt-2 disabled:opacity-50`}>
                      {t.usePasted}
                    </button>
                  </div>
                </section>

                <section aria-labelledby="photo-title" className="flex flex-col gap-4 rounded-panel border border-ui-line bg-ui-surface p-5">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-control bg-ui-subtle text-ui-ai">
                      <Camera className="h-5 w-5" aria-hidden />
                    </span>
                    <h2 id="photo-title" className="text-lg font-semibold">{t.photoTitle}</h2>
                    <span lang="en" className="ms-auto inline-flex items-center gap-1 rounded-full bg-ui-ai px-2 py-0.5 text-xs font-semibold text-ui-ai-fg">
                      <Sparkles className="h-3 w-3" aria-hidden />
                      AI
                    </span>
                  </div>
                  <p className="text-sm text-ui-muted">{t.photoBody}</p>
                  <div>
                    <label className={`${secondaryButton} cursor-pointer focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-ui-focus`}>
                      <Upload className="h-4 w-4" aria-hidden />
                      {t.choosePhotos}
                      <input type="file" multiple accept="image/jpeg,image/png,image/webp,image/heic,image/heif,application/pdf" className="sr-only" disabled={reading} onChange={(e) => { addPhotos(e.target.files); e.target.value = ""; }} />
                    </label>
                    <p className="mt-1.5 text-xs text-ui-muted">{t.photoLimits}</p>
                  </div>
                  {photos.length > 0 && (
                    <ul className="space-y-1">
                      {photos.map((file, i) => (
                        <li key={`${file.name}-${i}`} className="flex items-center gap-2 rounded-control bg-ui-bg ps-3 text-sm">
                          <bdi className="min-w-0 flex-1 truncate" dir="ltr">{file.name}</bdi>
                          <span className="shrink-0 text-xs text-ui-muted" dir="ltr">{f.number(Math.round(file.size / 1024))} KB</span>
                          <button type="button" onClick={() => setPhotos((prev) => prev.filter((_, j) => j !== i))} disabled={reading} aria-label={t.remove(file.name)} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-control text-ui-muted hover:text-ui-danger">
                            <Trash2 className="h-4 w-4" aria-hidden />
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                  <div className="mt-auto space-y-2">
                    <button type="button" disabled={photos.length === 0 || reading} onClick={readMenu} className={primaryButton}>
                      {reading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Sparkles className="h-4 w-4" aria-hidden />}
                      {t.read}
                    </button>
                    {reading && <p role="status" className="text-sm text-ui-muted">{t.reading}</p>}
                    <p className="text-xs text-ui-muted">{t.noCredits}</p>
                  </div>
                </section>
              </div>
            </>
          ) : step === "review" ? (
            <ReviewStep
              t={t}
              lang={lang}
              headingRef={reviewHeading}
              source={source}
              groups={groups}
              existingCategories={existingCategories}
              fallback={fallback}
              onFallback={changeFallback}
              onGroup={updateGroup}
              onDish={updateDish}
            />
          ) : (
            result && (
              <section role="status" className="rounded-panel border border-ui-line bg-ui-surface p-6 text-center">
                <CheckCircle2 className="mx-auto h-10 w-10 text-ui-success" aria-hidden />
                <h2 className="mt-3 text-xl font-semibold">{t.doneTitle}</h2>
                <p className="mt-2">{t.doneBody(result.dishes, result.categories, lang)}</p>
                <p className="mt-1 text-sm text-ui-muted">{t.doneNote}</p>
                <div className="mt-5 flex flex-wrap justify-center gap-2">
                  <Link href={`/c/${slug}/admin/publish/`} className={primaryButton}>{t.reviewPublish}</Link>
                  <Link href={`/c/${slug}/admin/items/`} className={secondaryButton}>{t.goDishes}</Link>
                  <button type="button" onClick={startOver} className={secondaryButton}>{t.importMore}</button>
                </div>
              </section>
            )
          )}

          {step === "review" && !isViewer && (
            // Above the phone tab bar, at the bottom of the screen while scrolling the list
            <div className="sticky bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-20 space-y-2 rounded-panel border border-ui-line bg-ui-surface p-4 shadow-[0_-8px_24px_-16px_rgba(23,21,46,0.35)] lg:bottom-4">
              {errorBox}
              {overLimit && <p role="alert" className="text-sm text-ui-danger">{t.overLimit(maxItems, existingDishes.length, included.length)}</p>}
              {problems > 0 && <p className="text-sm text-ui-warning">{t.fixFirst(problems, lang)}</p>}
              <div className="flex flex-wrap items-center gap-2">
                <button type="button" onClick={runImport} disabled={importing || included.length === 0 || problems > 0 || overLimit} className={primaryButton}>
                  {importing && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
                  {importing ? t.importing : t.importButton(included.length, lang)}
                </button>
                <button type="button" onClick={startOver} disabled={importing} className={secondaryButton}>{t.startOver}</button>
              </div>
            </div>
          )}
        </div>
      </CatalogAdminContent>
    </>
  );
}

function ReviewStep({
  t,
  lang,
  headingRef,
  source,
  groups,
  existingCategories,
  fallback,
  onFallback,
  onGroup,
  onDish,
}: {
  t: Copy;
  lang: AdminLang;
  headingRef: React.RefObject<HTMLHeadingElement | null>;
  source: Source;
  groups: ReviewGroup[];
  existingCategories: ExistingCategory[];
  fallback: ImportCurrency;
  onFallback: (c: ImportCurrency) => void;
  onGroup: (key: string, patch: Partial<ReviewGroup>) => void;
  onDish: (groupKey: string, dishKey: string, patch: Partial<ReviewDish>) => void;
}) {
  const dishCount = groups.reduce((n, g) => n + g.dishes.length, 0);
  const money = (amount: number, currency: ImportCurrency) => formatMoney(amount, currency, lang);

  return (
    <>
      <div className="space-y-3">
        <h2 ref={headingRef} tabIndex={-1} className="text-xl font-semibold outline-none">{t.reviewTitle}</h2>
        <p className="text-ui-muted">{t.summary(dishCount, groups.length, lang)}</p>
        {source === "photo" && (
          <p className="flex items-start gap-2 rounded-control bg-ui-subtle px-4 py-3 text-sm">
            <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-ui-ai" aria-hidden />
            {t.aiNote}
          </p>
        )}
        <p className="flex items-start gap-2 text-sm text-ui-muted">
          <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          {t.noAllergens}
        </p>
        <label className="flex flex-wrap items-center gap-2 text-sm">
          {t.defaultCurrency}
          <select value={fallback} onChange={(e) => onFallback(e.target.value as ImportCurrency)} className="min-h-11 rounded-control border border-ui-input bg-ui-surface px-3">
            <option value="USD">{t.usd}</option>
            <option value="LBP">{t.lbp}</option>
          </select>
        </label>
      </div>

      {groups.map((group, gi) => {
        const unnamed = group.target === "new" && !group.name_en.trim() && !group.name_ar.trim() && group.dishes.some((d) => d.include);
        const groupName = pickName(group, lang) || pickName(existingCategories.find((c) => c.id === group.target), lang);
        return (
          <section key={group.key} aria-labelledby={`group-${group.key}`} className="rounded-panel border border-ui-line bg-ui-surface">
            <div className="space-y-3 border-b border-ui-line p-4">
              <h3 id={`group-${group.key}`} className="font-semibold">
                <bdi>{groupName || `${gi + 1}`}</bdi>
              </h3>
              <label className="block text-sm">
                <span className="mb-1 block font-medium">{t.addTo}</span>
                <select value={group.target} onChange={(e) => onGroup(group.key, { target: e.target.value })} className={field}>
                  <option value="new">{t.newCategory}</option>
                  {existingCategories.map((c) => (
                    <option key={c.id} value={c.id}>{pickName(c, lang)}</option>
                  ))}
                </select>
              </label>
              {group.target === "new" && (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <input aria-label={t.categoryNameEn} placeholder={t.categoryNameEn} dir="ltr" lang="en" value={group.name_en} onChange={(e) => onGroup(group.key, { name_en: e.target.value })} className={field} />
                  <input aria-label={t.categoryNameAr} placeholder={t.categoryNameAr} dir="rtl" lang="ar" value={group.name_ar} onChange={(e) => onGroup(group.key, { name_ar: e.target.value })} className={field} />
                </div>
              )}
              {unnamed && <p className="text-sm text-ui-danger">{t.nameCategory}</p>}
            </div>

            <ul className="divide-y divide-[var(--ui-line)]">
              {group.dishes.map((dish) => {
                const problem = dish.include ? dishProblem(dish) : null;
                const label = pickName(dish, lang) || t.unnamed;
                return (
                  <li key={dish.key} className="flex gap-3 p-4">
                    <input
                      type="checkbox"
                      checked={dish.include}
                      onChange={(e) => onDish(group.key, dish.key, { include: e.target.checked })}
                      aria-label={t.include(label)}
                      className="mt-3 h-5 w-5 shrink-0 accent-[var(--ui-primary)]"
                    />
                    {!dish.include ? (
                      // Skipped: one line, so a long list stays easy to scan
                      <div className="min-w-0 flex-1 pt-2.5 text-sm">
                        <p className="font-medium">
                          <bdi>{label}</bdi>
                          {dish.price !== null && <span className="ms-2 text-ui-muted" dir="ltr">{money(dish.price, dish.currency)}</span>}
                        </p>
                        {dish.duplicate && <p className="text-ui-warning">{t.duplicate}</p>}
                      </div>
                    ) : (
                    <div className="min-w-0 flex-1 space-y-2">
                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                        <input aria-label={`${t.nameEn}: ${label}`} placeholder={t.nameEn} dir="ltr" lang="en" value={dish.name_en} onChange={(e) => onDish(group.key, dish.key, { name_en: e.target.value })} className={field} />
                        <input aria-label={`${t.nameAr}: ${label}`} placeholder={t.nameAr} dir="rtl" lang="ar" value={dish.name_ar} onChange={(e) => onDish(group.key, dish.key, { name_ar: e.target.value })} className={field} />
                      </div>
                      {dish.options.length > 0 ? (
                        <p className="text-sm text-ui-muted">
                          {t.options(dish.options.map((o) => `${pickName(o, lang)} ${o.price !== null ? money(o.price, dish.currency) : ""}`).join(" · "))}
                        </p>
                      ) : (
                        <div className="flex gap-2">
                          <input
                            type="number"
                            inputMode="decimal"
                            min={0}
                            step="any"
                            dir="ltr"
                            aria-label={`${t.price}: ${label}`}
                            placeholder={t.price}
                            value={dish.price ?? ""}
                            onChange={(e) => onDish(group.key, dish.key, { price: e.target.value === "" ? null : Math.max(0, Number(e.target.value)) })}
                            className="min-h-11 min-w-0 flex-1 rounded-control border border-ui-input bg-ui-surface px-3 text-sm sm:max-w-40"
                          />
                          <select
                            aria-label={`${t.currency}: ${label}`}
                            value={dish.currency}
                            onChange={(e) => onDish(group.key, dish.key, { currency: e.target.value as ImportCurrency, currencyExplicit: true })}
                            className="min-h-11 shrink-0 rounded-control border border-ui-input bg-ui-surface px-3 text-sm"
                          >
                            <option value="USD">{t.usd}</option>
                            <option value="LBP">{t.lbp}</option>
                          </select>
                        </div>
                      )}
                      {(dish.description_en || dish.description_ar) && (
                        <p className="line-clamp-2 text-sm text-ui-muted" dir="auto">
                          {lang === "ar" ? dish.description_ar || dish.description_en : dish.description_en || dish.description_ar}
                        </p>
                      )}
                      {source === "photo" && dish.priceText && <p className="text-xs text-ui-muted" dir="auto">{t.printedAs(dish.priceText)}</p>}
                      {problem && <p className="text-sm font-medium text-ui-danger">{problem === "name" ? t.noName : t.noPrice}</p>}
                      {dish.duplicate && <p className="text-sm text-ui-warning">{t.duplicate}</p>}
                    </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}
    </>
  );
}

export default function ImportPage() {
  return (
    <CatalogAdminShell>
      <ImportContent />
    </CatalogAdminShell>
  );
}
