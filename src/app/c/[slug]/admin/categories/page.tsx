"use client";

import { useEffect, useState } from "react";
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
  GripVertical,
  Loader2,
  X,
  Upload,
  Folder,
  ArrowRight,
} from "lucide-react";

interface Category {
  id: string;
  name_ar: string;
  name_en: string;
  name_fr: string;
  image_url: string | null;
  icon_name: string;
  display_order: number;
  is_active: number;
  item_count: number;
}

function CategoriesPageContent() {
  const { slug, user, fetchWithAuth, features } = useCatalogAdmin();
  const isViewer = user?.role === 'viewer';

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [saving, setSaving] = useState(false);

  const [isMultiLang, setIsMultiLang] = useState(false);
  const [activeLang, setActiveLang] = useState<'en' | 'ar' | 'fr'>('en');
  const [enabledLangs, setEnabledLangs] = useState<string>("en");

  const [formData, setFormData] = useState({
    name_ar: "",
    name_en: "",
    name_fr: "",
    image_url: "",
    icon_name: "Folder",
  });
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const fetchCategories = async () => {
    try {
      const res = await fetchWithAuth(`/api/c/${slug}/admin/categories`);

      if (res.ok) {
        const data = await res.json();
        setCategories(data.categories);
      }
    } catch (error) {
      console.error("Failed to fetch categories:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
    if (features) {
      setIsMultiLang(features.multi_language_enabled);
      setEnabledLangs(features.enabled_languages);
      setActiveLang(features.default_language as any);
    }
  }, [slug, features]);

  const openAddModal = () => {
    if (features && categories.length >= features.max_categories) {
      alert(`Limit reached! Your current plan allows up to ${features.max_categories} categories. Please upgrade in the Billing section to add more.`);
      return;
    }
    setEditingCategory(null);
    setFormData({
      name_ar: "",
      name_en: "",
      name_fr: "",
      image_url: "",
      icon_name: "Folder",
    });
    setUploadError(null);
    setShowModal(true);
    setActiveLang('en');
  };

  const openEditModal = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      name_ar: category.name_ar,
      name_en: category.name_en,
      name_fr: category.name_fr,
      image_url: category.image_url || "",
      icon_name: category.icon_name,
    });
    setUploadError(null);
    setShowModal(true);
    setActiveLang('en');
  };

  const handleSave = async () => {
    if (!formData.name_en) return;

    setSaving(true);
    const body = {
      ...formData,
      name_ar: isMultiLang ? formData.name_ar : formData.name_en,
      name_fr: isMultiLang ? formData.name_fr : formData.name_en,
    };

    try {
      const url = editingCategory
        ? `/api/c/${slug}/admin/categories/${editingCategory.id}`
        : `/api/c/${slug}/admin/categories`;

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
      }
    } catch (error) {
      console.error("Failed to save category:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this category? All items in this category will be deleted too.")) return;

    try {
      const res = await fetchWithAuth(`/api/c/${slug}/admin/categories/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        fetchCategories();
      }
    } catch (error) {
      console.error("Failed to delete category:", error);
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

  return (
    <>
      <CatalogAdminHeader title="Categories">
        <button
          onClick={openAddModal}
          disabled={isViewer}
          className="group relative flex items-center gap-3 px-6 py-3 bg-primary text-white rounded-2xl hover:shadow-[0_0_30px_rgba(124,58,237,0.4)] transition-all duration-500 font-black text-[11px] uppercase tracking-widest overflow-hidden shadow-lg shadow-primary/10 disabled:opacity-50"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
          <Plus className="w-4 h-4" />
          Add Category
        </button>
      </CatalogAdminHeader>

      <CatalogAdminContent>
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="glass rounded-[2rem] p-10 animate-pulse h-48"
              />
            ))}
          </div>
        ) : categories.length === 0 ? (
          <div className="text-center py-32 glass rounded-[3rem] border border-white/5">
            <Folder className="w-16 h-16 text-white/5 mx-auto mb-6" />
            <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em]">No categories found</p>
            <button
              onClick={openAddModal}
              className="mt-8 text-[11px] font-black text-primary uppercase tracking-widest hover:scale-105 transition-transform"
            >
              Create your first category
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {categories.map((category) => (
              <div
                key={category.id}
                className="glass-card group relative overflow-hidden rounded-[2.5rem]"
              >
                <div className="relative h-48 overflow-hidden">
                  {category.image_url ? (
                    <Image
                      src={category.image_url}
                      alt={category.name_en}
                      fill
                      className="object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                  ) : (
                    <div
                      className="absolute inset-0 flex items-center justify-center opacity-20"
                      style={{
                        background: `linear-gradient(135deg, var(--color-primary) 0%, var(--color-secondary) 100%)`,
                      }}
                    >
                      <Folder className="w-16 h-16 text-white" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/20 to-transparent" />

                  {/* Operational Controls */}
                  <div className="absolute top-4 right-4 flex gap-2 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500">
                    <button
                      onClick={() => openEditModal(category)}
                      disabled={isViewer}
                      className="w-8 h-8 bg-white/5 backdrop-blur-md rounded-lg flex items-center justify-center border border-white/10 hover:bg-white/10 transition-all disabled:opacity-50"
                    >
                      <Edit2 className="w-3.5 h-3.5 text-white" />
                    </button>
                    <button
                      onClick={() => handleDelete(category.id)}
                      disabled={isViewer}
                      className="w-8 h-8 bg-purple-500/10 backdrop-blur-md rounded-lg flex items-center justify-center border border-purple-500/20 hover:bg-purple-500/30 transition-all disabled:opacity-50"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-white" />
                    </button>
                  </div>
                </div>

                <div className="p-8">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <h3 className="text-xl font-black text-white tracking-tight group-hover:text-primary transition-colors">
                        {category.name_en}
                      </h3>
                      <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] mt-2">
                        {category.item_count || 0} Products
                      </p>
                    </div>
                    <div className="w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_10px_var(--color-primary)] opacity-40 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CatalogAdminContent>

      {/* Configuration Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 sm:p-8 bg-[#050505]/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="glass-card w-full max-w-xl overflow-hidden animate-in zoom-in-95 duration-500 border-white/10">
            <div className="flex items-center justify-between p-8 border-b border-white/5 bg-white/[0.01]">
              <div>
                <h2 className="text-xl font-black text-white tracking-tighter uppercase whitespace-nowrap">
                  {editingCategory ? "Edit Category" : "Add New Category"}
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
              {/* Visual Node Uplink */}
              <div>
                <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] block mb-4">
                  Category Image
                </label>
                <div className="relative group/upload">
                  {formData.image_url ? (
                    <div className="relative h-48 rounded-[2rem] overflow-hidden border border-white/10">
                      <Image
                        src={formData.image_url}
                        alt="Category"
                        fill
                        className="object-cover"
                      />
                      <button
                        onClick={() =>
                          setFormData((p) => ({ ...p, image_url: "" }))
                        }
                        className="absolute top-4 right-4 w-10 h-10 bg-purple-500 rounded-xl flex items-center justify-center shadow-lg hover:scale-105 transition-transform"
                      >
                        <X className="w-4 h-4 text-white" />
                      </button>
                    </div>
                  ) : uploading ? (
                    <div className="flex flex-col items-center justify-center h-48 rounded-[2rem] border-2 border-dashed border-white/5 bg-white/[0.01] animate-pulse">
                      <Loader2 className="w-8 h-8 text-primary mb-4 animate-spin" />
                      <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em]">
                        Uploading...
                      </span>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center h-48 rounded-[2rem] border-2 border-dashed border-white/5 bg-white/[0.01] cursor-pointer hover:border-primary/40 hover:bg-primary/5 transition-all duration-500 group">
                      <Upload className="w-8 h-8 text-white/10 mb-4 group-hover:text-primary transition-colors" />
                      <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] group-hover:text-white transition-colors">
                        Upload Image
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
                {uploadError && (
                  <p className="text-[10px] font-black text-purple-500 uppercase tracking-widest mt-3 text-center">{uploadError}</p>
                )}
              </div>

              {/* Locale Matrix */}
              {isMultiLang && (
                <div className="flex p-1.5 bg-white/[0.02] border border-white/5 rounded-2xl mb-6">
                  {(['en', 'ar', 'fr'] as const).filter(l => enabledLangs.split(',').includes(l)).map((lang) => (
                    <button
                      key={lang}
                      type="button"
                      onClick={() => setActiveLang(lang)}
                      className={`flex-1 py-3 text-[10px] font-black transition-all rounded-xl uppercase tracking-widest ${activeLang === lang
                        ? "bg-white text-black shadow-lg"
                        : "text-white/30 hover:text-white"
                        }`}
                    >
                      {lang === 'ar' ? 'العربية' : lang.toUpperCase()}
                    </button>
                  ))}
                </div>
              )}

              {/* Data Fields */}
              <div className="space-y-6">
                {isMultiLang ? (
                  <>
                    <div className={activeLang === 'en' ? 'block' : 'hidden'}>
                      <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] block mb-2">
                        Category Name (English)
                      </label>
                      <input
                        type="text"
                        value={formData.name_en}
                        onChange={(e) =>
                          setFormData((p) => ({ ...p, name_en: e.target.value }))
                        }
                        className="w-full px-6 py-4 bg-white/[0.03] border border-white/5 rounded-2xl text-white font-black tracking-tight focus:outline-none focus:border-primary/50 transition-all placeholder:text-white/10"
                        placeholder="e.g. Desserts"
                      />
                    </div>
                    <div className={activeLang === 'ar' ? 'block' : 'hidden'}>
                      <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] block mb-2">
                        اسم الفئة (العربية)
                      </label>
                      <input
                        type="text"
                        value={formData.name_ar}
                        onChange={(e) =>
                          setFormData((p) => ({ ...p, name_ar: e.target.value }))
                        }
                        className="w-full px-6 py-4 bg-white/[0.03] border border-white/5 rounded-2xl text-white font-black tracking-tight focus:outline-none focus:border-primary/50 transition-all text-right placeholder:text-white/10"
                        style={{ direction: "rtl" }}
                        placeholder="مثال: حلويات"
                      />
                    </div>
                    <div className={activeLang === 'fr' ? 'block' : 'hidden'}>
                      <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] block mb-2">
                        Nom de la catégorie (Français)
                      </label>
                      <input
                        type="text"
                        value={formData.name_fr}
                        onChange={(e) =>
                          setFormData((p) => ({ ...p, name_fr: e.target.value }))
                        }
                        className="w-full px-6 py-4 bg-white/[0.03] border border-white/5 rounded-2xl text-white font-black tracking-tight focus:outline-none focus:border-primary/50 transition-all placeholder:text-white/10"
                        placeholder="ex: Desserts"
                      />
                    </div>
                  </>
                ) : (
                  <div>
                    <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] block mb-2">
                      Category Name
                    </label>
                    <input
                      type="text"
                      value={formData.name_en}
                      onChange={(e) =>
                        setFormData((p) => ({ ...p, name_en: e.target.value }))
                      }
                      className="w-full px-6 py-4 bg-white/[0.03] border border-white/5 rounded-2xl text-white font-black tracking-tight focus:outline-none focus:border-primary/50 transition-all placeholder:text-white/10"
                      placeholder="e.g. Desserts"
                    />
                  </div>
                )}
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
                disabled={saving || !formData.name_en || isViewer}
                className="flex-1 px-8 py-4 bg-primary text-white rounded-2xl font-black text-[11px] uppercase tracking-widest disabled:opacity-30 disabled:cursor-not-allowed hover:shadow-[0_0_20px_rgba(124,58,237,0.3)] transition-all flex items-center justify-center gap-3 group/save"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    Save Category
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

export default function CategoriesPage() {
  return (
    <CatalogAdminShell>
      <CategoriesPageContent />
    </CatalogAdminShell>
  );
}
