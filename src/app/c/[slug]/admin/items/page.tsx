"use client";

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
  name_fr: string;
  description_ar: string | null;
  description_en: string | null;
  description_fr: string | null;
  price: number;
  currency: string;
  image_url: string | null;
  is_active: number;
  is_featured: number;
  /** null/undefined before migration 20261008 has run: treated as available */
  is_available?: number | null;
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
  const [isMultiLang, setIsMultiLang] = useState(true);
  const [activeLang, setActiveLang] = useState<'en' | 'ar' | 'fr'>('en');
  const [enabledLangs, setEnabledLangs] = useState<string>("en");

  const [formData, setFormData] = useState({
    category_id: "",
    name_ar: "",
    name_en: "",
    name_fr: "",
    description_ar: "",
    description_en: "",
    description_fr: "",
    price: "",
    currency: "USD",
    image_url: "",
    is_featured: false,
  });
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const [enhancing, setEnhancing] = useState(false);
  const [enhanceLimit, setEnhanceLimit] = useState({ remaining: 10, limit: 10 });
  const [aiStyle, setAiStyle] = useState<"professional" | "vibrant" | "clean">("professional");
  const [aiProductType, setAiProductType] = useState<"food" | "product">("food");

  const fetchData = async () => {
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
      setIsMultiLang(features.multi_language_enabled);
      setEnabledLangs(features.enabled_languages);
      setActiveLang(features.default_language as any);
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
      name_fr: "",
      description_ar: "",
      description_en: "",
      description_fr: "",
      price: "",
      currency: "USD",
      image_url: "",
      is_featured: false,
    });
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
      name_fr: item.name_fr,
      description_ar: item.description_ar || "",
      description_en: item.description_en || "",
      description_fr: item.description_fr || "",
      price: item.price.toString(),
      currency: item.currency,
      image_url: item.image_url || "",
      is_featured: Boolean(item.is_featured),
    });
    setUploadError(null);
    setShowModal(true);
    setActiveLang('en');
  };

  const handleSave = async () => {
    if (!formData.name_en || !formData.category_id || !formData.price) return;

    setSaving(true);

    const body = {
      ...formData,
      price: parseFloat(formData.price),
      name_ar: isMultiLang ? formData.name_ar : formData.name_en,
      name_fr: isMultiLang ? formData.name_fr : formData.name_en,
      description_ar: isMultiLang ? formData.description_ar : formData.description_en,
      description_fr: isMultiLang ? formData.description_fr : formData.description_en,
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
      }
    } catch (error) {
      console.error("Failed to save item:", error);
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
          className="group relative flex items-center gap-3 px-6 py-3 bg-primary text-white rounded-2xl hover:shadow-[0_0_30px_rgba(124,58,237,0.4)] transition-all duration-500 font-black text-[11px] uppercase tracking-widest overflow-hidden shadow-lg shadow-primary/10 disabled:opacity-50"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
          <Plus className="w-4 h-4" />
          Add Product
        </button>
      </CatalogAdminHeader>

      <CatalogAdminContent>
        <div className="mb-10 flex flex-wrap items-center gap-6">
          <div className="relative group">
            <div className="absolute inset-0 bg-primary/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="relative px-6 py-4 bg-white/[0.03] border border-white/5 rounded-2xl text-[10px] font-black uppercase tracking-widest text-white/60 focus:outline-none focus:border-primary/50 transition-all appearance-none pr-12 cursor-pointer"
            >
              <option value="">All Categories</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id} className="bg-[#0a0a0a]">
                  {cat.name_en.toUpperCase()}
                </option>
              ))}
            </select>
          </div>
          <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] font-mono">
            Status: {filteredItems.length} Products Found
          </p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="glass rounded-[2.5rem] p-8 animate-pulse h-40" />
            ))}
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-32 glass rounded-[3rem] border border-white/5">
            <Package className="w-16 h-16 text-white/5 mx-auto mb-6" />
            <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em]">Your product list is currently empty</p>
            <button
              onClick={openAddModal}
              className="mt-8 text-[11px] font-black text-primary uppercase tracking-widest hover:scale-105 transition-transform"
            >
              Add your first product
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredItems.map((item) => (
              <div
                key={item.id}
                className="glass-card group relative overflow-hidden flex flex-col transition-all duration-500 hover:-translate-y-1"
              >
                <div className="flex gap-6 p-6">
                  <div className="relative w-24 h-24 rounded-[2rem] overflow-hidden flex-shrink-0 group-hover:shadow-[0_0_30px_rgba(255,255,255,0.05)] transition-all">
                    {item.image_url ? (
                      <Image src={item.image_url} alt={item.name_en} fill className="object-cover transition-transform duration-700 group-hover:scale-110" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-white/[0.02]">
                        <Package className="w-8 h-8 text-white/10" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#050505]/40 to-transparent" />
                    {item.is_featured ? (
                      <div className="absolute top-2 left-2 p-1.5 bg-primary rounded-xl shadow-[0_0_15px_var(--color-primary)]">
                        <Star className="w-3 h-3 text-white fill-white" />
                      </div>
                    ) : null}
                  </div>

                  <div className="flex-1 min-w-0 py-2">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <h3 className="text-lg font-black text-white tracking-tighter truncate group-hover:text-primary transition-colors">
                          {item.name_en}
                        </h3>
                        <p className="text-[9px] font-black text-white/30 uppercase tracking-widest mt-1 truncate">
                          {item.category_name}
                        </p>
                      </div>
                      <div className="flex flex-col gap-2 translate-x-4 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all duration-500">
                        <button
                          onClick={() => openEditModal(item)}
                          disabled={isViewer}
                          className="w-8 h-8 bg-white/5 backdrop-blur-md rounded-lg flex items-center justify-center border border-white/10 hover:bg-white/10 transition-all disabled:opacity-50"
                        >
                          <Edit2 className="w-3.5 h-3.5 text-white" />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          disabled={isViewer}
                          className="w-8 h-8 bg-purple-500/10 backdrop-blur-md rounded-lg flex items-center justify-center border border-purple-500/20 hover:bg-purple-500/30 transition-all disabled:opacity-50"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-white" />
                        </button>
                      </div>
                    </div>

                    <div className="mt-4 flex items-center justify-between">
                      <p className="text-xl font-black text-white/90 tracking-tighter tabular-nums">
                        <span className="text-[10px] text-primary mr-1">{item.currency}</span>
                        {item.price.toFixed(2)}
                      </p>
                      <button
                        type="button"
                        onClick={() => toggleAvailability(item)}
                        disabled={isViewer}
                        aria-pressed={item.is_available === 0}
                        className={`min-h-9 rounded-[10px] border px-3 text-xs font-semibold transition-colors disabled:opacity-50 ${
                          item.is_available === 0
                            ? "border-amber-400/40 bg-amber-400/10 text-amber-200"
                            : "border-white/10 bg-white/5 text-white/70 hover:bg-white/10"
                        }`}
                      >
                        {item.is_available === 0 ? "Sold out · tap to restore" : "Available · mark sold out"}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 sm:p-8 bg-[#050505]/60 backdrop-blur-md animate-in fade-in duration-300 overflow-y-auto custom-scrollbar">
          <div className="glass-card w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-500 border-white/10 my-auto">
            <div className="flex items-center justify-between p-8 border-b border-white/5 bg-white/[0.01]">
              <div>
                <h2 className="text-xl font-black text-white tracking-tighter uppercase">
                  {editingItem ? "Edit Product" : "Add New Product"}
                </h2>
                <div className="h-0.5 w-8 bg-primary mt-2 rounded-full opacity-50" />
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-8 space-y-8 max-h-[70vh] overflow-y-auto custom-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] block mb-4">
                    Product Image & AI Engine
                  </label>

                  {enhanceLimit.limit > 0 && (
                    <div className="flex gap-2 mb-4 p-2 bg-white/5 rounded-2xl border border-white/10">
                      <select
                        value={aiProductType}
                        onChange={(e) => setAiProductType(e.target.value as any)}
                        className="flex-1 bg-transparent text-[10px] font-black uppercase text-white/60 focus:outline-none cursor-pointer px-2"
                      >
                        <option value="food" className="bg-[#0a0a0a]">Food Mode</option>
                        <option value="product" className="bg-[#0a0a0a]">Retail Mode</option>
                      </select>
                      <div className="w-[1px] bg-white/10" />
                      <select
                        value={aiStyle}
                        onChange={(e) => setAiStyle(e.target.value as any)}
                        className="flex-1 bg-transparent text-[10px] font-black uppercase text-white/60 focus:outline-none cursor-pointer px-2"
                      >
                        <option value="professional" className="bg-[#0a0a0a]">Pro Style</option>
                        <option value="vibrant" className="bg-[#0a0a0a]">Vibrant</option>
                        <option value="clean" className="bg-[#0a0a0a]">Clean</option>
                      </select>
                    </div>
                  )}

                  <div className="relative group/upload">
                    {formData.image_url ? (
                      <div className="relative h-64 rounded-[2.5rem] overflow-hidden border border-white/10">
                        <Image src={formData.image_url} alt="Entity" fill className="object-cover" />
                        <div className="absolute top-4 right-4 flex gap-2">
                          {enhanceLimit.limit > 0 && (
                            <button
                              onClick={handleAIEnhance}
                              disabled={enhancing || enhanceLimit.remaining <= 0}
                              className="w-10 h-10 bg-gradient-to-r from-purple-500 to-purple-500 rounded-xl flex items-center justify-center shadow-lg hover:scale-105 transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
                              title={`AI Enhancement (${enhanceLimit.remaining}/${enhanceLimit.limit})`}
                            >
                              {enhancing ? <Loader2 className="w-4 h-4 text-white animate-spin" /> : <Sparkles className="w-4 h-4 text-white" />}
                            </button>
                          )}
                          <button
                            onClick={() => setFormData((p) => ({ ...p, image_url: "" }))}
                            className="w-10 h-10 bg-purple-500 rounded-xl flex items-center justify-center shadow-lg hover:scale-105 transition-transform"
                          >
                            <X className="w-4 h-4 text-white" />
                          </button>
                        </div>
                        {enhancing && (
                          <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center backdrop-blur-sm">
                            <Loader2 className="w-10 h-10 text-purple-400 animate-spin mb-3" />
                            <span className="text-xs font-bold text-white">جاري التحسين بالذكاء الاصطناعي...</span>
                          </div>
                        )}
                        <div className="absolute bottom-4 left-4 px-3 py-1.5 bg-black/60 rounded-lg backdrop-blur-sm">
                          <span className="text-[10px] font-bold text-white/70">✨ {enhanceLimit.remaining}/{enhanceLimit.limit}</span>
                        </div>
                      </div>
                    ) : uploading ? (
                      <div className="flex flex-col items-center justify-center h-64 rounded-[2.5rem] border-2 border-dashed border-white/5 bg-white/[0.01] animate-pulse">
                        <Loader2 className="w-8 h-8 text-primary mb-4 animate-spin" />
                        <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em]">Uploading...</span>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center justify-center h-64 rounded-[2.5rem] border-2 border-dashed border-white/5 bg-white/[0.01] cursor-pointer hover:border-primary/40 hover:bg-primary/5 transition-all duration-500">
                        <Upload className="w-8 h-8 text-white/10 mb-4" />
                        <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em]">Upload Image</span>
                        <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                      </label>
                    )}
                  </div>
                </div>

                <div className="space-y-6">
                  {isMultiLang && (
                    <div className="flex p-1.5 bg-white/[0.02] border border-white/5 rounded-2xl">
                      {(['en', 'ar', 'fr'] as const).filter(l => enabledLangs.split(',').includes(l)).map((lang) => (
                        <button
                          key={lang}
                          type="button"
                          onClick={() => setActiveLang(lang)}
                          className={`flex-1 py-3 text-[10px] font-black transition-all rounded-xl uppercase tracking-widest ${activeLang === lang ? "bg-white text-black shadow-lg" : "text-white/30 hover:text-white"}`}
                        >
                          {lang === 'ar' ? 'العربية' : lang.toUpperCase()}
                        </button>
                      ))}
                    </div>
                  )}

                  <div className="space-y-4">
                    {activeLang === 'en' ? (
                      <>
                        <div>
                          <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] block mb-2">Product Name (EN)</label>
                          <input type="text" value={formData.name_en} onChange={(e) => setFormData({ ...formData, name_en: e.target.value })} className="w-full px-6 py-4 bg-white/[0.03] border border-white/5 rounded-2xl text-white font-black tracking-tight focus:outline-none focus:border-primary/50 transition-all" required />
                        </div>
                        <div>
                          <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] block mb-2">Product Description (EN)</label>
                          <textarea value={formData.description_en} onChange={(e) => setFormData({ ...formData, description_en: e.target.value })} rows={3} className="w-full px-6 py-4 bg-white/[0.03] border border-white/5 rounded-2xl text-white font-black tracking-tight focus:outline-none focus:border-primary/50 transition-all resize-none" />
                        </div>
                      </>
                    ) : activeLang === 'ar' ? (
                      <>
                        <div>
                          <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] block mb-2 text-right">اسم المنتج (AR)</label>
                          <input type="text" value={formData.name_ar} onChange={(e) => setFormData({ ...formData, name_ar: e.target.value })} className="w-full px-6 py-4 bg-white/[0.03] border border-white/5 rounded-2xl text-white font-black tracking-tight focus:outline-none focus:border-primary/50 transition-all text-right" dir="rtl" />
                        </div>
                        <div>
                          <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] block mb-2 text-right">وصف المنتج (AR)</label>
                          <textarea value={formData.description_ar} onChange={(e) => setFormData({ ...formData, description_ar: e.target.value })} rows={3} className="w-full px-6 py-4 bg-white/[0.03] border border-white/5 rounded-2xl text-white font-black tracking-tight focus:outline-none focus:border-primary/50 transition-all text-right resize-none" dir="rtl" />
                        </div>
                      </>
                    ) : (
                      <>
                        <div>
                          <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] block mb-2">Nom du produit (FR)</label>
                          <input type="text" value={formData.name_fr} onChange={(e) => setFormData({ ...formData, name_fr: e.target.value })} className="w-full px-6 py-4 bg-white/[0.03] border border-white/5 rounded-2xl text-white font-black tracking-tight focus:outline-none focus:border-primary/50 transition-all" />
                        </div>
                        <div>
                          <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] block mb-2">Description du produit (FR)</label>
                          <textarea value={formData.description_fr} onChange={(e) => setFormData({ ...formData, description_fr: e.target.value })} rows={3} className="w-full px-6 py-4 bg-white/[0.03] border border-white/5 rounded-2xl text-white font-black tracking-tight focus:outline-none focus:border-primary/50 transition-all resize-none" />
                        </div>
                      </>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] block mb-2">Price</label>
                      <input type="number" step="0.01" value={formData.price} onChange={(e) => setFormData((p) => ({ ...p, price: e.target.value }))} className="w-full px-6 py-4 bg-white/[0.03] border border-white/5 rounded-2xl text-white font-black tracking-tight focus:outline-none focus:border-primary/50 shadow-inner" placeholder="0.00" required />
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] block mb-2">Currency</label>
                      <select value={formData.currency} onChange={(e) => setFormData((p) => ({ ...p, currency: e.target.value }))} className="w-full px-6 py-4 bg-white/[0.03] border border-white/5 rounded-2xl text-white font-black tracking-tight focus:outline-none focus:border-primary/50 transition-all appearance-none uppercase text-xs">
                        {['USD', 'EUR', 'GBP', 'AED', 'SAR', 'LBP'].map(cur => (
                          <option key={cur} value={cur} className="bg-[#0a0a0a]">{cur}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] block mb-2">Product Category</label>
                      <select value={formData.category_id} onChange={(e) => setFormData((p) => ({ ...p, category_id: e.target.value }))} className="w-full px-6 py-4 bg-white/[0.03] border border-white/5 rounded-2xl text-white font-black tracking-tight focus:outline-none focus:border-primary/50 transition-all appearance-none uppercase text-xs">
                        {categories.map((cat) => (
                          <option key={cat.id} value={cat.id} className="bg-[#0a0a0a]">{cat.name_en}</option>
                        ))}
                      </select>
                    </div>

                    <label className="flex items-center gap-4 cursor-pointer group/flag">
                      <div className={`w-6 h-6 rounded-lg border border-white/10 flex items-center justify-center transition-all ${formData.is_featured ? 'bg-primary border-primary shadow-[0_0_15px_var(--color-primary)]' : 'bg-white/5 group-hover:bg-white/10'}`}>
                        {formData.is_featured && <Star className="w-3.5 h-3.5 text-white fill-white" />}
                      </div>
                      <input type="checkbox" checked={formData.is_featured} onChange={(e) => setFormData((p) => ({ ...p, is_featured: e.target.checked }))} className="hidden" />
                      <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] group-hover:text-white transition-colors">Featured Product</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-4 p-8 border-t border-white/5 bg-white/[0.01]">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 px-8 py-4 bg-white/5 text-white/40 rounded-2xl hover:text-white hover:bg-white/10 transition-all text-[11px] font-black uppercase tracking-widest"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !formData.name_en || !formData.price || isViewer}
                className="flex-1 px-8 py-4 bg-primary text-white rounded-2xl font-black text-[11px] uppercase tracking-widest disabled:opacity-30 disabled:cursor-not-allowed hover:shadow-[0_0_20px_rgba(124,58,237,0.3)] transition-all flex items-center justify-center gap-3 group/save"
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
