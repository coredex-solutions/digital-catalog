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

  const [activeLang, setActiveLang] = useState<'en' | 'ar'>('en');

  const [formData, setFormData] = useState({
    name_ar: "",
    name_en: "",
    image_url: "",
    icon_name: "Folder",
  });
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const fetchCategories = async () => {
    // Runs after every save too: lets the shell refresh its "unpublished changes" bar
    window.dispatchEvent(new Event("menu-draft-changed"));
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
      setActiveLang(features.default_language === 'ar' ? 'ar' : 'en');
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
      // Never copy English over existing translations; the API falls back to English for empty fields
      name_ar: formData.name_ar,
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
          className="group relative flex items-center gap-3 px-6 py-3 bg-ui-primary text-ui-primary-fg rounded-control transition-all duration-500 font-semibold text-xs overflow-hidden shadow-lg disabled:opacity-50"
        >
          <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
          <Plus className="w-4 h-4" />
          Add Category
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
            <p className="text-xs font-semibold text-ui-muted">No categories found</p>
            <button
              onClick={openAddModal}
              className="mt-8 text-xs font-semibold text-ui-primary transition-transform"
            >
              Create your first category
            </button>
          </div>
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
                      alt={category.name_en}
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

                  {/* Operational Controls */}
                  <div className="absolute top-3 right-3 flex gap-2 transition-all duration-300 lg:translate-y-2 lg:opacity-0 lg:group-hover:translate-y-0 lg:group-hover:opacity-100 lg:group-focus-within:translate-y-0 lg:group-focus-within:opacity-100">
                    <button
                      onClick={() => openEditModal(category)}
                          aria-label={`Edit ${category.name_en}`}
                      disabled={isViewer}
                      className="w-11 h-11 lg:w-9 lg:h-9 bg-ui-surface rounded-lg flex items-center justify-center border border-ui-line hover:bg-ui-subtle transition-all disabled:opacity-50"
                    >
                      <Edit2 className="w-3.5 h-3.5 text-ui-ink" />
                    </button>
                    <button
                      onClick={() => handleDelete(category.id)}
                          aria-label={`Delete ${category.name_en}`}
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
                      <h3 className="text-xl font-semibold text-ui-ink group-hover:text-ui-primary transition-colors">
                        {category.name_en}
                      </h3>
                      <p className="text-xs font-semibold text-ui-muted mt-2">
                        {category.item_count || 0} Products
                      </p>
                    </div>
                    <div className="w-1.5 h-1.5 rounded-full bg-ui-primary opacity-40 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CatalogAdminContent>

      {/* Configuration Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-8 bg-black/40 animate-in fade-in duration-300">
          <div className="glass-card w-full max-w-xl overflow-hidden animate-in zoom-in-95 duration-500 border-ui-line flex flex-col h-[100dvh] sm:h-auto sm:max-h-[90vh] max-sm:!rounded-none max-sm:!border-0">
            <div className="shrink-0 flex items-center justify-between gap-3 px-4 py-4 sm:p-8 border-b border-ui-line bg-ui-bg">
              <div>
                <h2 className="text-xl font-semibold text-ui-ink whitespace-nowrap">
                  {editingCategory ? "Edit Category" : "Add New Category"}
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
              {/* Visual Node Uplink */}
              <div>
                <label className="text-xs font-semibold text-ui-muted block mb-4">
                  Category Image
                </label>
                <div className="relative group/upload">
                  {formData.image_url ? (
                    <div className="relative h-48 rounded-panel overflow-hidden border border-ui-line">
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
                        aria-label="Remove image"
                        className="absolute top-4 right-4 w-10 h-10 bg-ui-primary rounded-xl flex items-center justify-center shadow-lg transition-transform"
                      >
                        <X className="w-4 h-4 text-ui-ink" />
                      </button>
                    </div>
                  ) : uploading ? (
                    <div className="flex flex-col items-center justify-center h-48 rounded-panel border-2 border-dashed border-ui-line bg-ui-bg">
                      <Loader2 className="w-8 h-8 text-ui-primary mb-4 animate-spin" />
                      <span className="text-xs font-semibold text-ui-muted">
                        Uploading...
                      </span>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center h-48 rounded-panel border-2 border-dashed border-ui-line bg-ui-bg cursor-pointer hover:border-ui-primary hover:bg-ui-subtle transition-all duration-500 group">
                      <Upload className="w-8 h-8 text-ui-input mb-4 group-hover:text-ui-primary transition-colors" />
                      <span className="text-xs font-semibold text-ui-muted group-hover:text-ui-ink transition-colors">
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
                  <p className="text-xs font-semibold text-ui-primary mt-3 text-center">{uploadError}</p>
                )}
              </div>

              {/* Every plan edits Arabic and English */}
              <div className="flex p-1.5 bg-ui-bg border border-ui-line rounded-control mb-6">
                  {(['en', 'ar'] as const).map((lang) => (
                    <button
                      key={lang}
                      type="button"
                      onClick={() => setActiveLang(lang)}
                      className={`flex-1 py-3 text-xs font-semibold transition-all rounded-xl ${activeLang === lang
                        ? "bg-ui-primary text-ui-primary-fg shadow-lg"
                        : "text-ui-muted hover:text-ui-ink"
                        }`}
                    >
                      {lang === 'ar' ? 'العربية' : lang.toUpperCase()}
                    </button>
                  ))}
              </div>

              {/* Data Fields */}
              <div className="space-y-6">
                <>
                    <div className={activeLang === 'en' ? 'block' : 'hidden'}>
                      <label className="text-xs font-semibold text-ui-muted block mb-2">
                        Category Name (English)
                      </label>
                      <input
                        type="text"
                        value={formData.name_en}
                        onChange={(e) =>
                          setFormData((p) => ({ ...p, name_en: e.target.value }))
                        }
                        className="w-full px-6 py-4 bg-ui-bg border border-ui-input rounded-control text-ui-ink font-semibold focus:outline-none focus:border-ui-primary transition-all placeholder:text-ui-muted"
                        placeholder="e.g. Desserts"
                      />
                    </div>
                    <div className={activeLang === 'ar' ? 'block' : 'hidden'}>
                      <label className="text-xs font-semibold text-ui-muted block mb-2">
                        اسم الفئة (العربية)
                      </label>
                      <input
                        type="text"
                        value={formData.name_ar}
                        onChange={(e) =>
                          setFormData((p) => ({ ...p, name_ar: e.target.value }))
                        }
                        className="w-full px-6 py-4 bg-ui-bg border border-ui-input rounded-control text-ui-ink font-semibold focus:outline-none focus:border-ui-primary transition-all text-right placeholder:text-ui-muted"
                        style={{ direction: "rtl" }}
                        placeholder="مثال: حلويات"
                      />
                    </div>
                </>
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
                disabled={saving || !formData.name_en || isViewer}
                className="flex-1 px-5 sm:px-8 py-4 bg-ui-primary text-ui-primary-fg rounded-control font-semibold text-xs disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-3 group/save"
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
