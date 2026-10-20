"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { keepFocusOnRow } from "../_components/keepFocusOnRow";
import Image from "next/image";
import { CatalogAdminShell, useCatalogAdmin } from "../_components/CatalogAdminShell";
import {
  CatalogAdminHeader,
  CatalogAdminContent,
} from "../_components/CatalogAdminSidebar";
import { ADMIN_NAV_LABELS } from "../_components/adminNav";
import { formatNumber, pickName, plural, useAdminLang, useCopy } from "../_lib/i18n";
import {
  Plus,
  Edit2,
  Trash2,
  Loader2,
  X,
  Upload,
  Folder,
  ArrowRight,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  Check,
} from "lucide-react";

interface Category {
  id: string;
  name_ar: string;
  name_en: string;
  image_url: string | null;
  icon_name: string;
  display_order: number;
  is_active: number;
  item_count: number;
}

const en = {
  addCategory: "Add category",
  limitReached: (max: number) =>
    `You've reached your plan's limit of ${plural("en", max, { one: "# category", other: "# categories" })}. Upgrade in Plan & billing to add more.`,
  orderFailed: "Couldn't save the new order. Please try again.",
  deleteConfirm: (name: string) => `Delete “${name}”? All dishes in this category will be deleted too. This can't be undone.`,
  deleteConfirmUnnamed: "Delete this category? All dishes in this category will be deleted too. This can't be undone.",
  uploadFailed: "Couldn't upload the photo. Please try again.",
  deleteFailed: "Couldn't delete this category. Please try again.",
  saveFailed: "Couldn't save this category. Please try again.",
  nameRequired: "Enter the category name in Arabic or English.",
  empty: "You haven't added any categories yet",
  addFirst: "Add your first category",
  orderNote: "Guests see categories in this order.",
  done: "Done",
  changeOrder: "Change order",
  moveUp: (name: string) => `Move ${name} up`,
  moveDown: (name: string) => `Move ${name} down`,
  orderHint: "Saved as you go. Guests see the new order after you publish.",
  edit: (name: string) => `Edit ${name}`,
  delete: (name: string) => `Delete ${name}`,
  dishCount: (n: number) => plural("en", n, { one: "# dish", other: "# dishes" }),
  editCategory: "Edit category",
  newCategory: "Add a category",
  close: "Close",
  photo: "Category photo",
  removePhoto: "Remove photo",
  uploading: "Uploading…",
  uploadPhoto: "Upload a photo",
  contentLanguage: "Language of the text",
  nameEn: "Name in English",
  nameAr: "Name in Arabic",
  placeholderEn: "e.g. Desserts",
  placeholderAr: "e.g. حلويات",
  cancel: "Cancel",
  saving: "Saving…",
  saveCategory: "Save category",
};
const ar: typeof en = {
  addCategory: "إضافة قسم",
  limitReached: (max) => `وصلت إلى الحد الأقصى للأقسام في باقتك (${formatNumber(max, "ar")}). رقِّ باقتك من «الباقة والدفع» لإضافة المزيد.`,
  orderFailed: "تعذّر حفظ الترتيب الجديد. حاول مرة أخرى.",
  deleteConfirm: (name) => `حذف «${name}»؟ ستُحذف معه كل أطباق هذا القسم، ولا يمكن التراجع عن ذلك.`,
  deleteConfirmUnnamed: "حذف هذا القسم؟ ستُحذف معه كل أطباق هذا القسم، ولا يمكن التراجع عن ذلك.",
  uploadFailed: "تعذّر رفع الصورة. حاول مرة أخرى.",
  deleteFailed: "تعذّر حذف هذا القسم. حاول مرة أخرى.",
  saveFailed: "تعذّر حفظ هذا القسم. حاول مرة أخرى.",
  nameRequired: "أدخل اسم القسم بالعربية أو بالإنجليزية.",
  empty: "لم تضف أي قسم بعد",
  addFirst: "أضف قسمك الأول",
  orderNote: "يرى الضيوف الأقسام بهذا الترتيب.",
  done: "تم",
  changeOrder: "تغيير الترتيب",
  moveUp: (name) => `نقل ${name} للأعلى`,
  moveDown: (name) => `نقل ${name} للأسفل`,
  orderHint: "يُحفظ الترتيب تلقائياً، ويظهر للضيوف بعد النشر.",
  edit: (name) => `تعديل ${name}`,
  delete: (name) => `حذف ${name}`,
  dishCount: (n) => plural("ar", n, { zero: "لا أطباق", one: "طبق واحد", two: "طبقان", few: "# أطباق", many: "# طبقاً", other: "# طبق" }),
  editCategory: "تعديل القسم",
  newCategory: "إضافة قسم",
  close: "إغلاق",
  photo: "صورة القسم",
  removePhoto: "إزالة الصورة",
  uploading: "جارٍ الرفع…",
  uploadPhoto: "رفع صورة",
  contentLanguage: "لغة النص",
  nameEn: "الاسم بالإنجليزية",
  nameAr: "الاسم بالعربية",
  placeholderEn: "Desserts",
  placeholderAr: "مثلاً: حلويات",
  cancel: "إلغاء",
  saving: "جارٍ الحفظ…",
  saveCategory: "حفظ القسم",
};

function CategoriesPageContent() {
  const { slug, user, fetchWithAuth, features } = useCatalogAdmin();
  const isViewer = user?.role === 'viewer';
  const t = useCopy({ en, ar });
  const lang = useAdminLang();

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [saving, setSaving] = useState(false);

  // Start on the menu's default language (features are loaded before the page renders)
  const [activeLang, setActiveLang] = useState<'en' | 'ar'>(() => features?.default_language === 'ar' ? 'ar' : 'en');

  const [formData, setFormData] = useState({
    name_ar: "",
    name_en: "",
    image_url: "",
    icon_name: "Folder",
  });
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [ordering, setOrdering] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);
  const orderQueue = useRef<Promise<void>>(Promise.resolve());

  // State is only set once the request settles
  const fetchCategories = useCallback(() => {
    // Runs after every save too: lets the shell refresh its "unpublished changes" bar
    window.dispatchEvent(new Event("menu-draft-changed"));
    return fetchWithAuth(`/api/c/${slug}/admin/categories/`)
      .then(async (res) => {
        if (res.ok) {
          const data = await res.json();
          setCategories(data.categories);
        }
      })
      .catch((error) => {
        console.error("Failed to fetch categories:", error);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [fetchWithAuth, slug]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // Move a category one place up or down. Shown at once; saved in order of the clicks.
  const moveCategory = (id: string, delta: -1 | 1) => {
    const from = categories.findIndex((c) => c.id === id);
    const to = from + delta;
    if (from < 0 || to < 0 || to >= categories.length) return;
    const reordered = [...categories];
    [reordered[from], reordered[to]] = [reordered[to], reordered[from]];
    setCategories(reordered);
    keepFocusOnRow(id, to, categories.length, delta);
    setOrderError(null);
    const order = reordered.map((c) => c.id);
    orderQueue.current = orderQueue.current.then(async () => {
      try {
        const res = await fetchWithAuth(`/api/c/${slug}/admin/categories/`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ order }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => null);
          throw new Error(data?.error || t.orderFailed);
        }
        window.dispatchEvent(new Event("menu-draft-changed"));
      } catch (error) {
        // A network failure (TypeError) has a browser message in English: show our own text
        setOrderError(error instanceof Error && !(error instanceof TypeError) ? error.message : t.orderFailed);
        fetchCategories();
      }
    });
  };


  const openAddModal = () => {
    if (features && categories.length >= features.max_categories) {
      alert(t.limitReached(features.max_categories));
      return;
    }
    setEditingCategory(null);
    setFormData({
      name_ar: "",
      name_en: "",
      image_url: "",
      icon_name: "Folder",
    });
    setUploadError(null);
    setSaveError(null);
    setShowModal(true);
    setActiveLang(lang);
  };

  const openEditModal = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      name_ar: category.name_ar,
      name_en: category.name_en,
      image_url: category.image_url || "",
      icon_name: category.icon_name,
    });
    setUploadError(null);
    setSaveError(null);
    setShowModal(true);
    setActiveLang(lang);
  };

  const handleSave = async () => {
    if (!formData.name_en.trim() && !formData.name_ar.trim()) {
      setSaveError(t.nameRequired);
      return;
    }

    setSaving(true);
    setSaveError(null);
    const body = {
      ...formData,
      // Never copy English over existing translations; the API falls back to English for empty fields
      name_ar: formData.name_ar,
    };

    try {
      const url = editingCategory
        ? `/api/c/${slug}/admin/categories/${editingCategory.id}/`
        : `/api/c/${slug}/admin/categories/`;

      const res = await fetchWithAuth(url, {
        method: editingCategory ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        setShowModal(false);
        fetchCategories();
      } else {
        const data = await res.json().catch(() => null);
        setSaveError(data?.error || t.saveFailed);
      }
    } catch {
      setSaveError(t.saveFailed);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    const target = categories.find((c) => c.id === id);
    const targetName = pickName(target, lang);
    if (!confirm(targetName ? t.deleteConfirm(targetName) : t.deleteConfirmUnnamed)) return;

    try {
      const res = await fetchWithAuth(`/api/c/${slug}/admin/categories/${id}/`, {
        method: "DELETE",
      });

      if (res.ok) {
        fetchCategories();
      } else {
        const data = await res.json().catch(() => null);
        alert(data?.error || t.deleteFailed);
      }
    } catch {
      alert(t.deleteFailed);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadError(null);

    const formDataUpload = new FormData();
    formDataUpload.append("file", file);

    try {
      const res = await fetchWithAuth(`/api/c/${slug}/admin/upload/`, {
        method: "POST",
        body: formDataUpload,
      });

      const data = await res.json();

      if (res.ok) {
        setFormData((prev) => ({ ...prev, image_url: data.url }));
      } else {
        setUploadError(data.error || t.uploadFailed);
      }
    } catch {
      setUploadError(t.uploadFailed);
    } finally {
      setUploading(false);
    }
  };

  return (
    <>
      <CatalogAdminHeader title={ADMIN_NAV_LABELS[lang].categories}>
        <button
          onClick={openAddModal}
          disabled={isViewer}
          className="group relative flex items-center gap-3 px-6 py-3 bg-ui-primary text-ui-primary-fg rounded-control transition-all duration-500 font-semibold text-xs overflow-hidden shadow-lg disabled:opacity-50"
        >
          <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full rtl:translate-x-full rtl:group-hover:-translate-x-full transition-transform duration-1000" />
          <Plus className="w-4 h-4" />
          {t.addCategory}
        </button>
      </CatalogAdminHeader>

      <CatalogAdminContent>
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-8">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="glass rounded-panel p-5 sm:p-8 lg:p-10 h-48"
              />
            ))}
          </div>
        ) : categories.length === 0 ? (
          <div className="text-center py-32 glass rounded-panel border border-ui-line">
            <Folder className="w-16 h-16 text-ui-line mx-auto mb-6" />
            <p className="text-xs font-semibold text-ui-muted">{t.empty}</p>
            <button
              onClick={openAddModal}
              className="mt-8 text-xs font-semibold text-ui-primary transition-transform"
            >
              {t.addFirst}
            </button>
          </div>
        ) : (
          <>
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-ui-muted">{t.orderNote}</p>
            {!isViewer && categories.length > 1 && (
              <button
                type="button"
                onClick={() => setOrdering((on) => !on)}
                aria-pressed={ordering}
                className={`inline-flex min-h-11 items-center gap-2 rounded-control border px-4 text-sm font-medium transition-colors ${
                  ordering ? "border-ui-primary bg-ui-primary text-ui-primary-fg" : "border-ui-input text-ui-ink hover:bg-ui-subtle"
                }`}
              >
                {ordering ? <Check className="h-4 w-4" aria-hidden /> : <ArrowUpDown className="h-4 w-4" aria-hidden />}
                {ordering ? t.done : t.changeOrder}
              </button>
            )}
          </div>
          {orderError && (
            <p role="alert" className="mb-6 rounded-control border border-[#F3C7C7] bg-[#FEF2F2] px-4 py-3 text-sm font-medium text-ui-danger">
              {orderError}
            </p>
          )}
          {ordering ? (
            <>
              <ol className="divide-y divide-ui-line rounded-panel border border-ui-line bg-ui-surface">
                {categories.map((category, index) => {
                  const name = pickName(category, lang);
                  return (
                    <li key={category.id} className="flex items-center gap-3 px-3 py-2 sm:px-4">
                      <span className="w-6 text-center text-sm tabular-nums text-ui-muted">{index + 1}</span>
                      <span className="min-w-0 flex-1 truncate font-medium text-ui-ink">
                        <bdi>{name}</bdi> <span className="font-normal text-ui-muted">· {formatNumber(category.item_count || 0, lang)}</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => moveCategory(category.id, -1)}
                        disabled={index === 0}
                        data-move={category.id}
                        data-dir="up"
                        aria-label={t.moveUp(name)}
                        className="flex h-11 w-11 items-center justify-center rounded-control border border-ui-line text-ui-ink hover:bg-ui-subtle disabled:opacity-30"
                      >
                        <ArrowUp className="h-5 w-5" aria-hidden />
                      </button>
                      <button
                        type="button"
                        onClick={() => moveCategory(category.id, 1)}
                        disabled={index === categories.length - 1}
                        data-move={category.id}
                        data-dir="down"
                        aria-label={t.moveDown(name)}
                        className="flex h-11 w-11 items-center justify-center rounded-control border border-ui-line text-ui-ink hover:bg-ui-subtle disabled:opacity-30"
                      >
                        <ArrowDown className="h-5 w-5" aria-hidden />
                      </button>
                    </li>
                  );
                })}
              </ol>
              <p className="mt-3 text-sm text-ui-muted">{t.orderHint}</p>
            </>
          ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-8">
            {categories.map((category) => (
              <div
                key={category.id}
                className="glass-card group relative overflow-hidden rounded-panel"
              >
                <div className="relative h-36 sm:h-48 overflow-hidden">
                  {category.image_url ? (
                    <Image
                      src={category.image_url}
                      alt={pickName(category, lang)}
                      fill
                      className="object-cover transition-transform duration-700"
                    />
                  ) : (
                    <div
                      className="absolute inset-0 flex items-center justify-center opacity-20"
                      style={{
                        background: `linear-gradient(135deg, var(--color-primary) 0%, var(--color-secondary) 100%)`,
                      }}
                    >
                      <Folder className="w-16 h-16 text-ui-ink" />
                    </div>
                  )}
                  <div className="absolute inset-0" />

                  {/* Edit and delete */}
                  <div className="absolute top-3 end-3 flex gap-2 transition-all duration-300 lg:translate-y-2 lg:opacity-0 lg:group-hover:translate-y-0 lg:group-hover:opacity-100 lg:group-focus-within:translate-y-0 lg:group-focus-within:opacity-100">
                    <button
                      onClick={() => openEditModal(category)}
                      aria-label={t.edit(pickName(category, lang))}
                      disabled={isViewer}
                      className="w-11 h-11 lg:w-9 lg:h-9 bg-ui-surface rounded-lg flex items-center justify-center border border-ui-line hover:bg-ui-subtle transition-all disabled:opacity-50"
                    >
                      <Edit2 className="w-3.5 h-3.5 text-ui-ink" />
                    </button>
                    <button
                      onClick={() => handleDelete(category.id)}
                      aria-label={t.delete(pickName(category, lang))}
                      disabled={isViewer}
                      className="w-11 h-11 lg:w-9 lg:h-9 bg-ui-surface rounded-lg flex items-center justify-center border border-ui-line hover:bg-ui-subtle transition-all disabled:opacity-50"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-ui-ink" />
                    </button>
                  </div>
                </div>

                <div className="p-5 sm:p-8">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <h3 className="text-xl font-semibold text-ui-heading group-hover:text-ui-primary transition-colors">
                        <bdi>{pickName(category, lang)}</bdi>
                      </h3>
                      <p className="text-xs font-semibold text-ui-muted mt-2">
                        {t.dishCount(category.item_count || 0)}
                      </p>
                    </div>
                    <div className="w-1.5 h-1.5 rounded-full bg-ui-primary opacity-40 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>
              </div>
            ))}
          </div>
          )}
          </>
        )}
      </CatalogAdminContent>

      {/* Configuration Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-8 bg-black/40 animate-in fade-in duration-300">
          <div className="glass-card w-full max-w-xl overflow-hidden animate-in zoom-in-95 duration-500 border-ui-line flex flex-col h-[100dvh] sm:h-auto sm:max-h-[90vh] max-sm:!rounded-none max-sm:!border-0">
            <div className="shrink-0 flex items-center justify-between gap-3 px-4 py-4 sm:p-8 border-b border-ui-line bg-ui-bg">
              <div>
                <h2 className="text-xl font-semibold text-ui-heading whitespace-nowrap">
                  {editingCategory ? t.editCategory : t.newCategory}
                </h2>
                <div className="h-0.5 w-8 bg-ui-primary mt-2 rounded-full opacity-50" />
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="w-11 h-11 shrink-0 bg-ui-subtle rounded-xl flex items-center justify-center text-ui-muted hover:text-ui-ink hover:bg-ui-subtle transition-all"
                aria-label={t.close}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 sm:p-8 space-y-8 flex-1 min-h-0 sm:max-h-[70vh] overflow-y-auto custom-scrollbar">
              {/* Category photo */}
              <div>
                <p className="text-xs font-semibold text-ui-muted block mb-4">
                  {t.photo}
                </p>
                <div className="relative group/upload">
                  {formData.image_url ? (
                    <div className="relative h-48 rounded-panel overflow-hidden border border-ui-line">
                      <Image
                        src={formData.image_url}
                        alt={t.photo}
                        fill
                        className="object-cover"
                      />
                      <button
                        onClick={() =>
                          setFormData((p) => ({ ...p, image_url: "" }))
                        }
                        aria-label={t.removePhoto}
                        className="absolute top-4 end-4 w-10 h-10 bg-ui-primary rounded-xl flex items-center justify-center shadow-lg transition-transform"
                      >
                        <X className="w-4 h-4 text-ui-ink" />
                      </button>
                    </div>
                  ) : uploading ? (
                    <div className="flex flex-col items-center justify-center h-48 rounded-panel border-2 border-dashed border-ui-line bg-ui-bg" role="status">
                      <Loader2 className="w-8 h-8 text-ui-primary mb-4 animate-spin" aria-hidden />
                      <span className="text-xs font-semibold text-ui-muted">
                        {t.uploading}
                      </span>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center h-48 rounded-panel border-2 border-dashed border-ui-line bg-ui-bg cursor-pointer hover:border-ui-primary hover:bg-ui-subtle transition-all duration-500 group">
                      <Upload className="w-8 h-8 text-ui-input mb-4 group-hover:text-ui-primary transition-colors" />
                      <span className="text-xs font-semibold text-ui-muted group-hover:text-ui-ink transition-colors">
                        {t.uploadPhoto}
                      </span>
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/gif"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
                {uploadError && (
                  <p role="alert" className="text-xs font-semibold text-ui-danger mt-3 text-center">{uploadError}</p>
                )}
              </div>

              {/* Every plan edits Arabic and English */}
              <div role="group" aria-label={t.contentLanguage} className="flex p-1.5 bg-ui-bg border border-ui-line rounded-control mb-6">
                  {(['en', 'ar'] as const).map((code) => (
                    <button
                      key={code}
                      type="button"
                      lang={code}
                      onClick={() => setActiveLang(code)}
                      aria-pressed={activeLang === code}
                      className={`flex-1 py-3 text-xs font-semibold transition-all rounded-xl ${activeLang === code
                        ? "bg-ui-primary text-ui-primary-fg shadow-lg"
                        : "text-ui-muted hover:text-ui-ink"
                        }`}
                    >
                      {code === 'ar' ? 'العربية' : 'English'}
                    </button>
                  ))}
              </div>

              {/* Names */}
              <div className="space-y-6">
                <>
                    <div className={activeLang === 'en' ? 'block' : 'hidden'}>
                      <label htmlFor="category-name-en" className="text-xs font-semibold text-ui-muted block mb-2">
                        {t.nameEn}
                      </label>
                      <input
                        id="category-name-en"
                        type="text"
                        dir="ltr"
                        value={formData.name_en}
                        onChange={(e) =>
                          setFormData((p) => ({ ...p, name_en: e.target.value }))
                        }
                        className="w-full px-6 py-4 bg-ui-bg border border-ui-input rounded-control text-ui-ink font-semibold focus:outline-none focus:border-ui-primary transition-all placeholder:text-ui-muted"
                        placeholder={t.placeholderEn}
                      />
                    </div>
                    <div className={activeLang === 'ar' ? 'block' : 'hidden'}>
                      <label htmlFor="category-name-ar" className="text-xs font-semibold text-ui-muted block mb-2">
                        {t.nameAr}
                      </label>
                      <input
                        id="category-name-ar"
                        type="text"
                        dir="rtl"
                        value={formData.name_ar}
                        onChange={(e) =>
                          setFormData((p) => ({ ...p, name_ar: e.target.value }))
                        }
                        className="w-full px-6 py-4 bg-ui-bg border border-ui-input rounded-control text-ui-ink font-semibold focus:outline-none focus:border-ui-primary transition-all placeholder:text-ui-muted"
                        placeholder={t.placeholderAr}
                      />
                    </div>
                </>
              </div>
              {saveError && (
                <p role="alert" className="mt-4 rounded-control border border-ui-danger bg-ui-subtle px-4 py-3 text-sm text-ui-danger">
                  {saveError}
                </p>
              )}
            </div>

            <div className="shrink-0 flex gap-3 sm:gap-4 px-4 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:p-8 border-t border-ui-line bg-ui-bg">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 px-5 sm:px-8 py-4 bg-ui-subtle text-ui-muted rounded-control hover:text-ui-ink hover:bg-ui-subtle transition-all text-xs font-semibold"
              >
                {t.cancel}
              </button>
              <button
                onClick={handleSave}
                disabled={saving || isViewer}
                className="flex-1 px-5 sm:px-8 py-4 bg-ui-primary text-ui-primary-fg rounded-control font-semibold text-xs disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-3 group/save"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {t.saving}
                  </>
                ) : (
                  <>
                    {t.saveCategory}
                    <ArrowRight className="w-4 h-4 transition-transform rtl:-scale-x-100 group-hover/save:translate-x-1 rtl:group-hover/save:-translate-x-1" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default function CategoriesPage() {
  return (
    <CatalogAdminShell>
      <CategoriesPageContent />
    </CatalogAdminShell>
  );
}
