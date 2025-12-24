"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import { CatalogAdminShell } from "../_components/CatalogAdminShell";
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

export default function CategoriesPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [saving, setSaving] = useState(false);
  
  const [isMultiLang, setIsMultiLang] = useState(false);
  const [activeLang, setActiveLang] = useState<'en' | 'ar' | 'fr'>('en');

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
    const token = localStorage.getItem(`catalog_admin_token_${slug}`);
    if (!token) return;

    try {
      const res = await fetch(`/api/c/${slug}/admin/categories`, {
        headers: { Authorization: `Bearer ${token}` },
      });

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
    const checkFeatures = async () => {
      try {
        const token = localStorage.getItem(`catalog_admin_token_${slug}`);
        const res = await fetch(`/api/c/${slug}/admin/settings`, {
           headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
           const data = await res.json();
           if (data.features?.multi_language_enabled || data.settings?.multi_language_enabled) {
             setIsMultiLang(true);
           }
        }
      } catch (err) {
        console.error(err);
      }
    };
    checkFeatures();
  }, [slug]);

  const openAddModal = () => {
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
    const token = localStorage.getItem(`catalog_admin_token_${slug}`);

    // Fallback logic
    const body = {
      ...formData,
      name_ar: isMultiLang ? formData.name_ar : formData.name_en,
      name_fr: isMultiLang ? formData.name_fr : formData.name_en,
    };

    try {
      const url = editingCategory
        ? `/api/c/${slug}/admin/categories/${editingCategory.id}`
        : `/api/c/${slug}/admin/categories`;

      const res = await fetch(url, {
        method: editingCategory ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
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
    if (!confirm("Are you sure you want to delete this category?")) return;

    const token = localStorage.getItem(`catalog_admin_token_${slug}`);
    try {
      const res = await fetch(`/api/c/${slug}/admin/categories/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
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

    const token = localStorage.getItem(`catalog_admin_token_${slug}`);
    const formDataUpload = new FormData();
    formDataUpload.append("file", file);

    try {
      const res = await fetch(`/api/c/${slug}/admin/upload`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formDataUpload,
      });

      const data = await res.json();

      if (res.ok) {
        setFormData((prev) => ({ ...prev, image_url: data.url }));
      } else {
        setUploadError(data.error || "Failed to upload image");
        console.error("Upload error:", data);
      }
    } catch (error) {
      setUploadError("Failed to upload image. Please try again.");
      console.error("Failed to upload image:", error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <CatalogAdminShell>
      <CatalogAdminHeader title="Categories">
        <button
          onClick={openAddModal}
          className="flex items-center gap-2 px-4 py-2 text-white rounded-xl font-medium transition-all"
          style={{
            background: `linear-gradient(135deg, var(--color-primary) 0%, var(--color-secondary) 100%)`,
          }}
        >
          <Plus className="w-5 h-5" />
          Add Category
        </button>
      </CatalogAdminHeader>

      <CatalogAdminContent>
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="bg-slate-800/50 rounded-2xl p-4 animate-pulse h-32"
              />
            ))}
          </div>
        ) : categories.length === 0 ? (
          <div className="text-center py-12">
            <Folder className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400">No categories yet</p>
            <button
              onClick={openAddModal}
              className="mt-4 text-sm font-medium"
              style={{ color: "var(--color-primary)" }}
            >
              Add your first category
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map((category) => (
              <div
                key={category.id}
                className="bg-slate-800/50 rounded-2xl border border-slate-700/50 overflow-hidden group"
              >
                <div className="relative h-32">
                  {category.image_url ? (
                    <Image
                      src={category.image_url}
                      alt={category.name_en}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div
                      className="absolute inset-0 flex items-center justify-center"
                      style={{
                        background: `linear-gradient(135deg, var(--color-primary) 0%, var(--color-secondary) 100%)`,
                        opacity: 0.3,
                      }}
                    >
                      <Folder className="w-12 h-12 text-white/50" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent" />

                  {/* Actions */}
                  <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => openEditModal(category)}
                      className="p-2 bg-slate-900/80 rounded-lg hover:bg-slate-800 transition-colors"
                    >
                      <Edit2 className="w-4 h-4 text-white" />
                    </button>
                    <button
                      onClick={() => handleDelete(category.id)}
                      className="p-2 bg-red-500/80 rounded-lg hover:bg-red-600 transition-colors"
                    >
                      <Trash2 className="w-4 h-4 text-white" />
                    </button>
                  </div>
                </div>

                <div className="p-4">
                  <h3 className="font-semibold text-white">
                    {category.name_en}
                  </h3>
                  <p className="text-sm text-slate-400">
                    {category.item_count || 0} items
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CatalogAdminContent>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-slate-800 rounded-2xl w-full max-w-md border border-slate-700/50">
            <div className="flex items-center justify-between p-6 border-b border-slate-700/50">
              <h2 className="text-xl font-semibold text-white">
                {editingCategory ? "Edit Category" : "Add Category"}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Image Upload */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Image
                </label>
                <div className="relative">
                  {formData.image_url ? (
                    <div className="relative h-32 rounded-xl overflow-hidden">
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
                        className="absolute top-2 right-2 p-1 bg-red-500 rounded-full"
                      >
                        <X className="w-4 h-4 text-white" />
                      </button>
                    </div>
                  ) : uploading ? (
                    <div className="flex flex-col items-center justify-center h-32 border-2 border-dashed border-slate-600 rounded-xl bg-slate-900/30">
                      <Loader2 className="w-8 h-8 text-slate-400 mb-2 animate-spin" />
                      <span className="text-sm text-slate-400">
                        Uploading...
                      </span>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center h-32 border-2 border-dashed border-slate-600 rounded-xl cursor-pointer hover:border-slate-500 transition-colors">
                      <Upload className="w-8 h-8 text-slate-400 mb-2" />
                      <span className="text-sm text-slate-400">
                        Upload image
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
                  <p className="text-sm text-red-400 mt-2">{uploadError}</p>
                )}
              </div>

              {/* Language Tabs */}
              {isMultiLang && (
                <div className="flex p-1 bg-slate-900/50 rounded-xl mb-4">
                  {(['en', 'ar', 'fr'] as const).map((lang) => (
                    <button
                      key={lang}
                      type="button"
                      onClick={() => setActiveLang(lang)}
                      className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
                        activeLang === lang
                          ? "bg-slate-700 text-white shadow-sm"
                          : "text-slate-400 hover:text-white"
                      }`}
                    >
                      {lang.toUpperCase()}
                    </button>
                  ))}
                </div>
              )}

              {/* Name Fields */}
              {isMultiLang ? (
                <>
                   <div className={activeLang === 'en' ? 'block' : 'hidden'}>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Name (English) *
                    </label>
                    <input
                      type="text"
                      value={formData.name_en}
                      onChange={(e) =>
                        setFormData((p) => ({ ...p, name_en: e.target.value }))
                      }
                      className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600/50 rounded-xl text-white focus:outline-none focus:ring-2"
                      placeholder="Category name"
                    />
                  </div>
                  <div className={activeLang === 'ar' ? 'block' : 'hidden'}>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Name (Arabic)
                    </label>
                    <input
                      type="text"
                      value={formData.name_ar}
                      onChange={(e) =>
                        setFormData((p) => ({ ...p, name_ar: e.target.value }))
                      }
                      className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600/50 rounded-xl text-white focus:outline-none focus:ring-2"
                      style={{ direction: "rtl" }}
                      placeholder="اسم الفئة"
                    />
                  </div>
                  <div className={activeLang === 'fr' ? 'block' : 'hidden'}>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Name (French)
                    </label>
                    <input
                      type="text"
                      value={formData.name_fr}
                      onChange={(e) =>
                        setFormData((p) => ({ ...p, name_fr: e.target.value }))
                      }
                      className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600/50 rounded-xl text-white focus:outline-none focus:ring-2"
                      placeholder="Nom de la catégorie"
                    />
                  </div>
                </>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name_en}
                    onChange={(e) =>
                      setFormData((p) => ({ ...p, name_en: e.target.value }))
                    }
                    className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600/50 rounded-xl text-white focus:outline-none focus:ring-2"
                    placeholder="Category name"
                  />
                </div>
              )}
            </div>

            <div className="flex gap-3 p-6 border-t border-slate-700/50">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 px-4 py-3 bg-slate-700 text-white rounded-xl hover:bg-slate-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !formData.name_en}
                className="flex-1 px-4 py-3 text-white rounded-xl font-medium disabled:opacity-50 flex items-center justify-center gap-2"
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
                  "Save"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </CatalogAdminShell>
  );
}