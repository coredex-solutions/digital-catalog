"use client";

import {
  ALLERGEN_CODES,
  ALLERGEN_LABELS,
  DIETARY_CODES,
  DIETARY_LABELS,
  type AllergenCode,
  type DietaryCode,
  type DishVariant,
} from "@/lib/catalog/dish-info";
import { useEffect, useState, use } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import { CatalogAdminShell, useCatalogAdmin } from "../_components/CatalogAdminShell";
import {
  CatalogAdminHeader,
  CatalogAdminContent,
} from "../_components/CatalogAdminSidebar";
import {
  Plus,
  Edit2,
  Trash2,
  Loader2,
  X,
  Upload,
  Package,
  Star,
  Globe,
  ArrowRight,
  Sparkles,
} from "lucide-react";

interface Category {
  id: string;
  name_en: string;
}

interface Item {
  id: string;
  category_id: string;
  category_name: string;
  name_ar: string;
  name_en: string;
  description_ar: string | null;
  description_en: string | null;
  price: number;
  currency: string;
  image_url: string | null;
  is_active: number;
  is_featured: number;
  /** null/undefined before migration 20261008 has run: treated as available */
  is_available?: number | null;
  variants?: DishVariant[];
  dietary?: DietaryCode[];
  /** null = allergens not checked yet */
  allergens?: AllergenCode[] | null;
}

/** An option row being edited (price kept as typed text) */
interface OptionDraft {
  id?: string;
  name_en: string;
  name_ar: string;
  price: string;
}

function ItemsPageContent() {
  const { slug, user, fetchWithAuth, features } = useCatalogAdmin();
  const isViewer = user?.role === 'viewer';

  const [items, setItems] = useState<Item[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [saving, setSaving] = useState(false);

  const [filterCategory, setFilterCategory] = useState<string>("");
  const [activeLang, setActiveLang] = useState<'en' | 'ar'>('en');

  const [formData, setFormData] = useState({
    category_id: "",
    name_ar: "",
    name_en: "",
    description_ar: "",
    description_en: "",
    price: "",
    currency: "USD",
    image_url: "",
    is_featured: false,
  });
  const [options, setOptions] = useState<OptionDraft[]>([]);
  const [dietary, setDietary] = useState<DietaryCode[]>([]);
  // Allergens are only saved once the owner confirms they checked them; otherwise unknown (null)
  const [allergensChecked, setAllergensChecked] = useState(false);
  const [allergens, setAllergens] = useState<AllergenCode[]>([]);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const [enhancing, setEnhancing] = useState(false);
  const [enhanceLimit, setEnhanceLimit] = useState({ remaining: 10, limit: 10 });
  const [aiStyle, setAiStyle] = useState<"professional" | "vibrant" | "clean">("professional");
  const [aiProductType, setAiProductType] = useState<"food" | "product">("food");

  const fetchData = async () => {
    // Runs after every save too: lets the shell refresh its "unpublished changes" bar
    window.dispatchEvent(new Event("menu-draft-changed"));
    const token = localStorage.getItem(`catalog_admin_token_${slug}`);
    if (!token) return;

    try {
      const [itemsRes, catsRes] = await Promise.all([
        fetchWithAuth(`/api/c/${slug}/admin/items`),
        fetchWithAuth(`/api/c/${slug}/admin/categories`),
      ]);

      if (itemsRes.ok) {
        const data = await itemsRes.json();
        setItems(data.items);
      }
      if (catsRes.ok) {
        const data = await catsRes.json();
        setCategories(data.categories);
      }
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    if (features) {
      setActiveLang(features.default_language === 'ar' ? 'ar' : 'en');
      setEnhanceLimit({
        remaining: features.ai_image_enhancement_limit - features.ai_image_enhancement_used,
        limit: features.ai_image_enhancement_limit
      });
    }
  }, [slug, features]);

  const openAddModal = () => {
    if (features && items.length >= features.max_items) {
      alert(`Limit reached! Your current plan allows up to ${features.max_items} products. Please upgrade in the Billing section to add more scale.`);
      return;
    }
    setEditingItem(null);
    setFormData({
      category_id: categories[0]?.id || "",
      name_ar: "",
      name_en: "",
      description_ar: "",
      description_en: "",
      price: "",
      currency: "USD",
      image_url: "",
      is_featured: false,
    });
    setOptions([]);
    setDietary([]);
    setAllergensChecked(false);
    setAllergens([]);
    setSaveError(null);
    setUploadError(null);
    setShowModal(true);
    setActiveLang('en');
  };

  const openEditModal = (item: Item) => {
    setEditingItem(item);
    setFormData({
      category_id: item.category_id,
      name_ar: item.name_ar,
      name_en: item.name_en,
      description_ar: item.description_ar || "",
      description_en: item.description_en || "",
      price: String(Number(item.price) || 0),
      currency: item.currency,
      image_url: item.image_url || "",
      is_featured: Boolean(item.is_featured),
    });
    setOptions((item.variants || []).map((v) => ({ id: v.id, name_en: v.name_en, name_ar: v.name_ar, price: String(v.price) })));
    setDietary(item.dietary || []);
    setAllergensChecked(item.allergens != null);
    setAllergens(item.allergens || []);
    setSaveError(null);
    setUploadError(null);
    setShowModal(true);
    setActiveLang('en');
  };

  const handleSave = async () => {
    const hasOptions = options.length > 0;
    if (!formData.name_en || !formData.category_id || (!hasOptions && !formData.price)) return;

    setSaving(true);
    setSaveError(null);

    const body = {
      ...formData,
      // With options, the API sets the dish price to the cheapest option
      price: hasOptions ? undefined : parseFloat(formData.price),
      // Never copy English over existing translations; the API falls back to English for empty fields
      name_ar: formData.name_ar,
      description_ar: formData.description_ar,
      variants: options.map((o) => ({ id: o.id, name_en: o.name_en.trim(), name_ar: o.name_ar.trim(), price: o.price })),
      dietary,
      allergens: allergensChecked ? allergens : null,
    };

    try {
      const url = editingItem
        ? `/api/c/${slug}/admin/items/${editingItem.id}`
        : `/api/c/${slug}/admin/items`;

      const res = await fetchWithAuth(url, {
        method: editingItem ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        setShowModal(false);
        fetchData();
      } else {
        const data = await res.json().catch(() => null);
        setSaveError(data?.error || "Could not save this product. Please try again.");
      }
    } catch (error) {
      console.error("Failed to save item:", error);
      setSaveError("Could not reach the server. Check your connection and try again.");
    } finally {
      setSaving(false);
    }
  };

  // One-tap "sold out" switch, so owners don't have to open the full edit form
  const toggleAvailability = async (item: Item) => {
    const available = item.is_available !== 0;
    const setAvailable = (value: number) =>
      setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, is_available: value } : i)));
    setAvailable(available ? 0 : 1);
    try {
      const res = await fetchWithAuth(`/api/c/${slug}/admin/items/${item.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_available: !available }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
    } catch (error) {
      console.error("Failed to update availability:", error);
      setAvailable(available ? 1 : 0);
      alert("Couldn't update availability. Please try again.");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this item?")) return;

    try {
      const res = await fetchWithAuth(`/api/c/${slug}/admin/items/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        fetchData();
      }
    } catch (error) {
      console.error("Failed to delete item:", error);
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
      const res = await fetchWithAuth(`/api/c/${slug}/admin/upload`, {
        method: "POST",
        body: formDataUpload,
      });

      const data = await res.json();

      if (res.ok) {
        setFormData((prev) => ({ ...prev, image_url: data.url }));
      } else {
        setUploadError(data.error || "Failed to upload image");
      }
    } catch (error) {
      setUploadError("Failed to upload image. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const handleAIEnhance = async () => {
    if (!formData.image_url || enhancing) return;

    setEnhancing(true);
    setUploadError(null);

    try {
      const res = await fetchWithAuth("/api/ai/enhance-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageUrl: formData.image_url,
          style: aiStyle,
          productType: aiProductType,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        const enhancedBlob = await fetch(`data:${data.enhancedImage.mimeType};base64,${data.enhancedImage.base64}`).then(r => r.blob());
        const enhancedFile = new File([enhancedBlob], "enhanced-image.jpg", { type: data.enhancedImage.mimeType });

        const uploadForm = new FormData();
        uploadForm.append("file", enhancedFile);

        const uploadRes = await fetchWithAuth(`/api/c/${slug}/admin/upload`, {
          method: "POST",
          body: uploadForm,
        });

        const uploadData = await uploadRes.json();

        if (uploadRes.ok) {
          setFormData((prev) => ({ ...prev, image_url: uploadData.url }));
          setEnhanceLimit({ remaining: data.remaining, limit: data.limit });
        } else {
          setUploadError(uploadData.error || "فشل رفع الصورة المحسنة");
        }
      } else {
        setUploadError(data.error || "فشل تحسين الصورة");
        if (data.remaining !== undefined) {
          setEnhanceLimit({ remaining: data.remaining, limit: data.limit });
        }
      }
    } catch (error: any) {
      console.error("AI enhance error:", error);
      setUploadError("فشل تحسين الصورة. حاول مرة أخرى.");
    } finally {
      setEnhancing(false);
    }
  };

  const filteredItems = filterCategory
    ? items.filter((item) => item.category_id === filterCategory)
    : items;

  return (
    <>
      <CatalogAdminHeader title="Product Manager">
        <button
          onClick={openAddModal}
          disabled={isViewer}
          className="group relative flex items-center gap-3 px-6 py-3 bg-ui-primary text-ui-primary-fg rounded-control transition-all duration-500 font-semibold text-xs overflow-hidden shadow-lg disabled:opacity-50"
        >
          <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
          <Plus className="w-4 h-4" />
          Add Product
        </button>
      </CatalogAdminHeader>

      <CatalogAdminContent>
        <div className="mb-6 sm:mb-10 flex flex-wrap items-center gap-3 sm:gap-6">
          <div className="relative group">
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              aria-label="Filter by category"
              className="relative min-h-11 px-4 sm:px-6 py-3 sm:py-4 bg-ui-bg border border-ui-input rounded-control text-xs font-semibold text-ui-muted focus:outline-none focus:border-ui-primary transition-all appearance-none pr-12 cursor-pointer"
            >
              <option value="">All Categories</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id} className="bg-ui-surface">
                  {cat.name_en.toUpperCase()}
                </option>
              ))}
            </select>
          </div>
          <p className="text-sm text-ui-muted">
            Status: {filteredItems.length} Products Found
          </p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-8">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="glass rounded-panel p-5 sm:p-8 h-40" />
            ))}
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-32 glass rounded-panel border border-ui-line">
            <Package className="w-16 h-16 text-ui-line mx-auto mb-6" />
            <p className="text-xs font-semibold text-ui-muted">Your product list is currently empty</p>
            <button
              onClick={openAddModal}
              className="mt-8 text-xs font-semibold text-ui-primary transition-transform"
            >
              Add your first product
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-8">
            {filteredItems.map((item) => (
              <div
                key={item.id}
                className="glass-card group relative overflow-hidden flex flex-col transition-all duration-500 hover:-translate-y-1"
              >
                <div className="flex gap-4 sm:gap-6 p-4 sm:p-6">
                  <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-panel overflow-hidden flex-shrink-0 transition-all">
                    {item.image_url ? (
                      <Image src={item.image_url} alt={item.name_en} fill className="object-cover transition-transform duration-700" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-ui-bg">
                        <Package className="w-8 h-8 text-ui-input" />
                      </div>
                    )}
                    <div className="absolute inset-0" />
                    {item.is_featured ? (
                      <div className="absolute top-2 left-2 p-1.5 bg-ui-primary rounded-xl">
                        <Star className="w-3 h-3 text-ui-ink fill-current" />
                      </div>
                    ) : null}
                  </div>

                  <div className="flex-1 min-w-0 py-2">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <h3 className="text-lg font-semibold text-ui-ink truncate group-hover:text-ui-primary transition-colors">
                          {item.name_en}
                        </h3>
                        <p className="text-xs font-semibold text-ui-muted mt-1 truncate">
                          {item.category_name}
                        </p>
                      </div>
                      <div className="flex flex-col gap-2 transition-all duration-300 lg:translate-x-4 lg:opacity-0 lg:group-hover:translate-x-0 lg:group-hover:opacity-100 lg:group-focus-within:translate-x-0 lg:group-focus-within:opacity-100">
                        <button
                          onClick={() => openEditModal(item)}
                          aria-label={`Edit ${item.name_en}`}
                          disabled={isViewer}
                          className="w-11 h-11 lg:w-9 lg:h-9 bg-ui-surface rounded-lg flex items-center justify-center border border-ui-line hover:bg-ui-subtle transition-all disabled:opacity-50"
                        >
                          <Edit2 className="w-3.5 h-3.5 text-ui-ink" />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          aria-label={`Delete ${item.name_en}`}
                          disabled={isViewer}
                          className="w-11 h-11 lg:w-9 lg:h-9 bg-ui-surface rounded-lg flex items-center justify-center border border-ui-line hover:bg-ui-subtle transition-all disabled:opacity-50"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-ui-ink" />
                        </button>
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
                      <p className="text-xl font-semibold text-ui-ink tabular-nums">
                        <span className="text-xs text-ui-primary mr-1">{item.currency}</span>
                        {(Number(item.price) || 0).toFixed(2)}
                      </p>
                      <button
                        type="button"
                        onClick={() => toggleAvailability(item)}
                        disabled={isViewer}
                        aria-pressed={item.is_available === 0}
                        className={`min-h-9 rounded-[10px] border px-3 text-xs font-semibold transition-colors disabled:opacity-50 ${
                          item.is_available === 0
                            ? "border-ui-warning bg-ui-subtle text-ui-warning"
                            : "border-ui-line bg-ui-subtle text-ui-ink hover:bg-ui-subtle"
                        }`}
                      >
                        {item.is_available === 0 ? "Sold out · Restore" : "Mark sold out"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CatalogAdminContent>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-8 bg-black/40 animate-in fade-in duration-300 sm:overflow-y-auto custom-scrollbar">
          <div className="glass-card w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-500 border-ui-line my-auto flex flex-col h-[100dvh] sm:h-auto sm:max-h-[90vh] max-sm:!rounded-none max-sm:!border-0">
            <div className="shrink-0 flex items-center justify-between gap-3 px-4 py-4 sm:p-8 border-b border-ui-line bg-ui-bg">
              <div>
                <h2 className="text-xl font-semibold text-ui-ink">
                  {editingItem ? "Edit Product" : "Add New Product"}
                </h2>
                <div className="h-0.5 w-8 bg-ui-primary mt-2 rounded-full opacity-50" />
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="w-11 h-11 shrink-0 bg-ui-subtle rounded-xl flex items-center justify-center text-ui-muted hover:text-ui-ink hover:bg-ui-subtle transition-all"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 sm:p-8 space-y-8 flex-1 min-h-0 sm:max-h-[70vh] overflow-y-auto custom-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <label className="text-xs font-semibold text-ui-muted block mb-4">
                    Product Image & AI Engine
                  </label>

                  {enhanceLimit.limit > 0 && (
                    <div className="flex gap-2 mb-4 p-2 bg-ui-subtle rounded-control border border-ui-line">
                      <select
                        value={aiProductType}
                        onChange={(e) => setAiProductType(e.target.value as any)}
                        className="flex-1 bg-transparent text-xs font-semibold text-ui-muted focus:outline-none cursor-pointer px-2"
                      >
                        <option value="food" className="bg-ui-surface">Food Mode</option>
                        <option value="product" className="bg-ui-surface">Retail Mode</option>
                      </select>
                      <div className="w-[1px] bg-ui-subtle" />
                      <select
                        value={aiStyle}
                        onChange={(e) => setAiStyle(e.target.value as any)}
                        className="flex-1 bg-transparent text-xs font-semibold text-ui-muted focus:outline-none cursor-pointer px-2"
                      >
                        <option value="professional" className="bg-ui-surface">Pro Style</option>
                        <option value="vibrant" className="bg-ui-surface">Vibrant</option>
                        <option value="clean" className="bg-ui-surface">Clean</option>
                      </select>
                    </div>
                  )}

                  <div className="relative group/upload">
                    {formData.image_url ? (
                      <div className="relative h-64 rounded-panel overflow-hidden border border-ui-line">
                        <Image src={formData.image_url} alt="Entity" fill className="object-cover" />
                        <div className="absolute top-4 right-4 flex gap-2">
                          {enhanceLimit.limit > 0 && (
                            <button
                              onClick={handleAIEnhance}
                              disabled={enhancing || enhanceLimit.remaining <= 0}
                              className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
                              title={`AI Enhancement (${enhanceLimit.remaining}/${enhanceLimit.limit})`}
                              aria-label={`Enhance photo with AI (${enhanceLimit.remaining} of ${enhanceLimit.limit} left)`}
                            >
                              {enhancing ? <Loader2 className="w-4 h-4 text-ui-ink animate-spin" /> : <Sparkles className="w-4 h-4 text-ui-ink" />}
                            </button>
                          )}
                          <button
                            onClick={() => setFormData((p) => ({ ...p, image_url: "" }))}
                            aria-label="Remove image"
                            className="w-10 h-10 bg-ui-primary rounded-xl flex items-center justify-center shadow-lg transition-transform"
                          >
                            <X className="w-4 h-4 text-ui-ink" />
                          </button>
                        </div>
                        {enhancing && (
                          <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center">
                            <Loader2 className="w-10 h-10 text-ui-primary animate-spin mb-3" />
                            <span className="text-xs font-bold text-ui-ink">جاري التحسين بالذكاء الاصطناعي...</span>
                          </div>
                        )}
                        <div className="absolute bottom-4 left-4 px-3 py-1.5 bg-black/60 rounded-lg">
                          <span className="text-xs font-bold text-ui-ink">✨ {enhanceLimit.remaining}/{enhanceLimit.limit}</span>
                        </div>
                      </div>
                    ) : uploading ? (
                      <div className="flex flex-col items-center justify-center h-64 rounded-panel border-2 border-dashed border-ui-line bg-ui-bg">
                        <Loader2 className="w-8 h-8 text-ui-primary mb-4 animate-spin" />
                        <span className="text-xs font-semibold text-ui-muted">Uploading...</span>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center justify-center h-64 rounded-panel border-2 border-dashed border-ui-line bg-ui-bg cursor-pointer hover:border-ui-primary hover:bg-ui-subtle transition-all duration-500">
                        <Upload className="w-8 h-8 text-ui-input mb-4" />
                        <span className="text-xs font-semibold text-ui-muted">Upload Image</span>
                        <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                      </label>
                    )}
                  </div>
                </div>

                <div className="space-y-6">
                  {/* Every plan edits Arabic and English */}
                  <div className="flex p-1.5 bg-ui-bg border border-ui-line rounded-control">
                      {(['en', 'ar'] as const).map((lang) => (
                        <button
                          key={lang}
                          type="button"
                          onClick={() => setActiveLang(lang)}
                          className={`flex-1 py-3 text-xs font-semibold transition-all rounded-xl ${activeLang === lang ? "bg-ui-primary text-ui-primary-fg shadow-lg" : "text-ui-muted hover:text-ui-ink"}`}
                        >
                          {lang === 'ar' ? 'العربية' : lang.toUpperCase()}
                        </button>
                      ))}
                  </div>

                  <div className="space-y-4">
                    {activeLang === 'en' ? (
                      <>
                        <div>
                          <label className="text-xs font-semibold text-ui-muted block mb-2">Product Name (EN)</label>
                          <input type="text" value={formData.name_en} onChange={(e) => setFormData({ ...formData, name_en: e.target.value })} className="w-full px-6 py-4 bg-ui-bg border border-ui-input rounded-control text-ui-ink font-semibold focus:outline-none focus:border-ui-primary transition-all" required />
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-ui-muted block mb-2">Product Description (EN)</label>
                          <textarea value={formData.description_en} onChange={(e) => setFormData({ ...formData, description_en: e.target.value })} rows={3} className="w-full px-6 py-4 bg-ui-bg border border-ui-input rounded-control text-ui-ink font-semibold focus:outline-none focus:border-ui-primary transition-all resize-none" />
                        </div>
                      </>
                    ) : (
                      <>
                        <div>
                          <label className="text-xs font-semibold text-ui-muted block mb-2 text-right">اسم المنتج (AR)</label>
                          <input type="text" value={formData.name_ar} onChange={(e) => setFormData({ ...formData, name_ar: e.target.value })} className="w-full px-6 py-4 bg-ui-bg border border-ui-input rounded-control text-ui-ink font-semibold focus:outline-none focus:border-ui-primary transition-all text-right" dir="rtl" />
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-ui-muted block mb-2 text-right">وصف المنتج (AR)</label>
                          <textarea value={formData.description_ar} onChange={(e) => setFormData({ ...formData, description_ar: e.target.value })} rows={3} className="w-full px-6 py-4 bg-ui-bg border border-ui-input rounded-control text-ui-ink font-semibold focus:outline-none focus:border-ui-primary transition-all text-right resize-none" dir="rtl" />
                        </div>
                      </>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-ui-muted block mb-2">Price</label>
                      <input type="number" step="0.01" value={formData.price} onChange={(e) => setFormData((p) => ({ ...p, price: e.target.value }))} className="w-full px-6 py-4 bg-ui-bg border border-ui-input rounded-control text-ui-ink font-semibold focus:outline-none focus:border-ui-primary shadow-inner" placeholder="0.00" required />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-ui-muted block mb-2">Currency</label>
                      <select value={formData.currency} onChange={(e) => setFormData((p) => ({ ...p, currency: e.target.value }))} className="w-full px-6 py-4 bg-ui-bg border border-ui-input rounded-control text-ui-ink font-semibold focus:outline-none focus:border-ui-primary transition-all appearance-none text-xs">
                        {['USD', 'LBP'].map(cur => (
                          <option key={cur} value={cur} className="bg-ui-surface">{cur}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="text-xs font-semibold text-ui-muted block mb-2">Product Category</label>
                      <select value={formData.category_id} onChange={(e) => setFormData((p) => ({ ...p, category_id: e.target.value }))} className="w-full px-6 py-4 bg-ui-bg border border-ui-input rounded-control text-ui-ink font-semibold focus:outline-none focus:border-ui-primary transition-all appearance-none text-xs">
                        {categories.map((cat) => (
                          <option key={cat.id} value={cat.id} className="bg-ui-surface">{cat.name_en}</option>
                        ))}
                      </select>
                    </div>

                    <label className="flex items-center gap-4 cursor-pointer group/flag">
                      <div className={`w-6 h-6 rounded-lg border border-ui-line flex items-center justify-center transition-all ${formData.is_featured ? 'bg-ui-primary border-ui-primary' : 'bg-ui-subtle group-hover:bg-white/10'}`}>
                        {formData.is_featured && <Star className="w-3.5 h-3.5 text-ui-ink fill-current" />}
                      </div>
                      <input type="checkbox" checked={formData.is_featured} onChange={(e) => setFormData((p) => ({ ...p, is_featured: e.target.checked }))} className="sr-only" />
                      <span className="text-xs font-semibold text-ui-muted group-hover:text-ui-ink transition-colors">Featured Product</span>
                    </label>
                  </div>

                  {/* Options: sizes or choices with their own price */}
                  <fieldset className="space-y-3 rounded-panel border border-ui-line p-4">
                    <legend className="px-1 text-sm font-semibold">Options</legend>
                    <p className="text-xs text-ui-muted">For sizes or choices with their own price, e.g. Regular $6 and Large $8. Guests must pick one.</p>
                    {options.map((option, index) => (
                      <div key={option.id || `new-${index}`} className="grid grid-cols-2 gap-2 sm:grid-cols-[1fr_1fr_6rem_auto] sm:items-end">
                        <div>
                          <label htmlFor={`option-${index}-en`} className="mb-1 block text-xs font-semibold text-ui-muted">Option {index + 1} (EN)</label>
                          <input id={`option-${index}-en`} type="text" maxLength={60} value={option.name_en} placeholder="Large" onChange={(e) => setOptions((prev) => prev.map((o, i) => (i === index ? { ...o, name_en: e.target.value } : o)))} className="min-h-11 w-full rounded-control border border-ui-input bg-ui-bg px-3" />
                        </div>
                        <div>
                          <label htmlFor={`option-${index}-ar`} className="mb-1 block text-xs font-semibold text-ui-muted">الخيار {index + 1}</label>
                          <input id={`option-${index}-ar`} type="text" dir="rtl" maxLength={60} value={option.name_ar} placeholder="كبير" onChange={(e) => setOptions((prev) => prev.map((o, i) => (i === index ? { ...o, name_ar: e.target.value } : o)))} className="min-h-11 w-full rounded-control border border-ui-input bg-ui-bg px-3 text-right" />
                        </div>
                        <div>
                          <label htmlFor={`option-${index}-price`} className="mb-1 block text-xs font-semibold text-ui-muted">Price</label>
                          <input id={`option-${index}-price`} type="number" min={0} step="0.01" inputMode="decimal" value={option.price} onChange={(e) => setOptions((prev) => prev.map((o, i) => (i === index ? { ...o, price: e.target.value } : o)))} className="min-h-11 w-full rounded-control border border-ui-input bg-ui-bg px-3" />
                        </div>
                        <button type="button" onClick={() => setOptions((prev) => prev.filter((_, i) => i !== index))} aria-label={`Remove option ${index + 1}`} className="flex min-h-11 items-center justify-center rounded-control border border-ui-input px-3 text-sm font-semibold text-ui-danger hover:bg-ui-subtle">
                          Remove
                        </button>
                      </div>
                    ))}
                    {options.length < 20 && (
                      <button type="button" onClick={() => setOptions((prev) => [...prev, { name_en: "", name_ar: "", price: "" }])} className="min-h-11 rounded-control border border-dashed border-ui-input px-4 text-sm font-semibold text-ui-primary hover:bg-ui-subtle">
                        + Add option
                      </button>
                    )}
                    {options.length > 0 && <p className="text-xs text-ui-muted">The dish shows &ldquo;from&rdquo; the cheapest option; the price field above is not used.</p>}
                  </fieldset>

                  {/* Dietary tags: the restaurant's own claim */}
                  <fieldset className="rounded-panel border border-ui-line p-4">
                    <legend className="px-1 text-sm font-semibold">Dietary</legend>
                    <div className="grid grid-cols-2 gap-2">
                      {DIETARY_CODES.map((code) => (
                        <label key={code} className="flex min-h-11 cursor-pointer items-center gap-3">
                          <input type="checkbox" checked={dietary.includes(code)} onChange={(e) => setDietary((prev) => (e.target.checked ? [...prev, code] : prev.filter((c) => c !== code)))} className="h-5 w-5" />
                          <span className="text-sm">{DIETARY_LABELS[code].en} · <span lang="ar">{DIETARY_LABELS[code].ar}</span></span>
                        </label>
                      ))}
                    </div>
                  </fieldset>

                  {/* Allergens: never guessed; unknown until the owner confirms */}
                  <fieldset className="rounded-panel border border-ui-line p-4">
                    <legend className="px-1 text-sm font-semibold">Allergens</legend>
                    <label className="flex min-h-11 cursor-pointer items-center gap-3">
                      <input type="checkbox" checked={allergensChecked} onChange={(e) => setAllergensChecked(e.target.checked)} className="h-5 w-5" />
                      <span className="text-sm font-semibold">I have checked this dish&rsquo;s allergens</span>
                    </label>
                    <p className="mt-1 text-xs text-ui-muted">Leave unchecked if you&rsquo;re not sure. Guests will be told to ask staff.</p>
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      {ALLERGEN_CODES.map((code) => (
                        <label key={code} className={`flex min-h-11 items-center gap-3 ${allergensChecked ? "cursor-pointer" : "opacity-50"}`}>
                          <input type="checkbox" disabled={!allergensChecked} checked={allergensChecked && allergens.includes(code)} onChange={(e) => setAllergens((prev) => (e.target.checked ? [...prev, code] : prev.filter((c) => c !== code)))} className="h-5 w-5" />
                          <span className="text-sm">{ALLERGEN_LABELS[code].en}</span>
                        </label>
                      ))}
                    </div>
                    {allergensChecked && allergens.length === 0 && (
                      <p className="mt-2 text-xs text-ui-muted">Guests will see: no listed allergens, as checked by the restaurant.</p>
                    )}
                  </fieldset>

                  {saveError && (
                    <p role="alert" className="rounded-control border border-ui-danger bg-ui-subtle px-4 py-3 text-sm text-ui-danger">{saveError}</p>
                  )}
                </div>
              </div>
            </div>

            <div className="shrink-0 flex gap-3 sm:gap-4 px-4 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:p-8 border-t border-ui-line bg-ui-bg">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 px-5 sm:px-8 py-4 bg-ui-subtle text-ui-muted rounded-control hover:text-ui-ink hover:bg-ui-subtle transition-all text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !formData.name_en || (options.length === 0 && !formData.price) || isViewer}
                className="flex-1 px-5 sm:px-8 py-4 bg-ui-primary text-ui-primary-fg rounded-control font-semibold text-xs disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-3 group/save"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    Save Product
                    <ArrowRight className="w-4 h-4 transition-transform group-hover/save:translate-x-1" />
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

export default function ItemsPage() {
  return (
    <CatalogAdminShell>
      <ItemsPageContent />
    </CatalogAdminShell>
  );
}
