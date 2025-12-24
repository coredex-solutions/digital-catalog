"use client";

import { useEffect, useState, use } from "react";
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
  Loader2,
  X,
  Upload,
  Package,
  Star,
  Globe
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
  description_en: string | null;
  price: number;
  currency: string;
  image_url: string | null;
  is_active: number;
  is_featured: number;
}

export default function ItemsPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [items, setItems] = useState<Item[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [saving, setSaving] = useState(false);
  
  const [filterCategory, setFilterCategory] = useState<string>("");
  const [isMultiLang, setIsMultiLang] = useState(false);
  const [activeLang, setActiveLang] = useState<'en' | 'ar' | 'fr'>('en');

  const [formData, setFormData] = useState({
    category_id: "",
    name_ar: "",
    name_en: "",
    name_fr: "",
    description_en: "",
    price: "",
    currency: "USD",
    image_url: "",
    is_featured: false,
  });
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const fetchData = async () => {
    const token = localStorage.getItem(`catalog_admin_token_${slug}`);
    if (!token) return;

    try {
      const [itemsRes, catsRes] = await Promise.all([
        fetch(`/api/c/${slug}/admin/items`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`/api/c/${slug}/admin/categories`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
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
    setEditingItem(null);
    setFormData({
      category_id: categories[0]?.id || "",
      name_ar: "",
      name_en: "",
      name_fr: "",
      description_en: "",
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
      description_en: item.description_en || "",
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
    const token = localStorage.getItem(`catalog_admin_token_${slug}`);

    // Prepare body with fallbacks if multi-lang is disabled
    const body = {
      ...formData,
      price: parseFloat(formData.price),
      name_ar: isMultiLang ? formData.name_ar : formData.name_en,
      name_fr: isMultiLang ? formData.name_fr : formData.name_en,
    };

    try {
      const url = editingItem
        ? `/api/c/${slug}/admin/items/${editingItem.id}`
        : `/api/c/${slug}/admin/items`;

      const res = await fetch(url, {
        method: editingItem ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
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

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this item?")) return;

    const token = localStorage.getItem(`catalog_admin_token_${slug}`);
    try {
      const res = await fetch(`/api/c/${slug}/admin/items/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
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

  const filteredItems = filterCategory
    ? items.filter((item) => item.category_id === filterCategory)
    : items;

  return (
    <CatalogAdminShell>
      <CatalogAdminHeader title="Products">
        <button
          onClick={openAddModal}
          className="flex items-center gap-2 px-4 py-2 text-white rounded-xl font-medium transition-all"
          style={{
            background: `linear-gradient(135deg, var(--color-primary) 0%, var(--color-secondary) 100%)`,
          }}
        >
          <Plus className="w-5 h-5" />
          Add Product
        </button>
      </CatalogAdminHeader>

      <CatalogAdminContent>
        {/* Filter */}
        <div className="mb-6">
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-4 py-2 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white focus:outline-none"
          >
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name_en}
              </option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="bg-slate-800/50 rounded-2xl p-4 animate-pulse h-40"
              />
            ))}
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-12">
            <Package className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400">No products yet</p>
            <button
              onClick={openAddModal}
              className="mt-4 text-sm font-medium"
              style={{ color: "var(--color-primary)" }}
            >
              Add your first product
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredItems.map((item) => (
              <div
                key={item.id}
                className="bg-slate-800/50 rounded-2xl border border-slate-700/50 overflow-hidden group"
              >
                <div className="flex gap-4 p-4">
                  {/* Image */}
                  <div className="relative w-20 h-20 rounded-xl overflow-hidden flex-shrink-0">
                    {item.image_url ? (
                      <Image
                        src={item.image_url}
                        alt={item.name_en}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div
                        className="w-full h-full flex items-center justify-center"
                        style={{ backgroundColor: "var(--color-surface)" }}
                      >
                        <Package className="w-8 h-8 text-slate-500" />
                      </div>
                    )}
                    {item.is_featured ? (
                      <div className="absolute top-1 left-1 p-1 bg-yellow-500 rounded-full">
                        <Star className="w-3 h-3 text-white" />
                      </div>
                    ) : null}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-white truncate">
                      {item.name_en}
                    </h3>
                    <p className="text-sm text-slate-400 truncate">
                      {item.category_name}
                    </p>
                    <p
                      className="font-bold mt-1"
                      style={{ color: "var(--color-primary)" }}
                    >
                      {item.currency} {item.price.toFixed(2)}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => openEditModal(item)}
                      className="p-2 bg-slate-700/50 rounded-lg hover:bg-slate-600 transition-colors"
                    >
                      <Edit2 className="w-4 h-4 text-white" />
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="p-2 bg-red-500/50 rounded-lg hover:bg-red-500 transition-colors"
                    >
                      <Trash2 className="w-4 h-4 text-white" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CatalogAdminContent>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
          <div className="bg-slate-800 rounded-2xl w-full max-w-lg border border-slate-700/50 my-8">
            <div className="flex items-center justify-between p-6 border-b border-slate-700/50">
              <h2 className="text-xl font-semibold text-white">
                {editingItem ? "Edit Product" : "Add Product"}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Category *
                </label>
                <select
                  value={formData.category_id}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, category_id: e.target.value }))
                  }
                  className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600/50 rounded-xl text-white focus:outline-none"
                >
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name_en}
                    </option>
                  ))}
                </select>
              </div>

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
                        alt="Product"
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
                    <div className="flex flex-col items-center justify-center h-24 border-2 border-dashed border-slate-600 rounded-xl bg-slate-900/30">
                      <Loader2 className="w-6 h-6 text-slate-400 mb-1 animate-spin" />
                      <span className="text-sm text-slate-400">
                        Uploading...
                      </span>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center h-24 border-2 border-dashed border-slate-600 rounded-xl cursor-pointer hover:border-slate-500 transition-colors">
                      <Upload className="w-6 h-6 text-slate-400 mb-1" />
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
                    <label className="block text-sm font-medium text-slate-300 mb-2">Name (English) *</label>
                    <input
                      type="text"
                      value={formData.name_en}
                      onChange={(e) => setFormData({ ...formData, name_en: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                      required
                    />
                  </div>
                  <div className={activeLang === 'ar' ? 'block' : 'hidden'}>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Name (Arabic)</label>
                    <input
                      type="text"
                      value={formData.name_ar}
                      onChange={(e) => setFormData({ ...formData, name_ar: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-right"
                      dir="rtl"
                    />
                  </div>
                  <div className={activeLang === 'fr' ? 'block' : 'hidden'}>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Name (French)</label>
                    <input
                      type="text"
                      value={formData.name_fr}
                      onChange={(e) => setFormData({ ...formData, name_fr: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                    />
                  </div>
                </>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Name *</label>
                  <input
                    type="text"
                    value={formData.name_en}
                    onChange={(e) => {
                       setFormData({ 
                         ...formData, 
                         name_en: e.target.value,
                       })
                    }}
                    className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                    required
                  />
                </div>
              )}

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description_en}
                  onChange={(e) =>
                    setFormData((p) => ({
                      ...p,
                      description_en: e.target.value,
                    }))
                  }
                  rows={2}
                  className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600/50 rounded-xl text-white focus:outline-none resize-none"
                  placeholder="Optional description"
                />
              </div>

              {/* Price */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Price *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) =>
                      setFormData((p) => ({ ...p, price: e.target.value }))
                    }
                    className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600/50 rounded-xl text-white focus:outline-none"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Currency
                  </label>
                  <select
                    value={formData.currency}
                    onChange={(e) =>
                      setFormData((p) => ({ ...p, currency: e.target.value }))
                    }
                    className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600/50 rounded-xl text-white focus:outline-none"
                  >
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                    <option value="GBP">GBP</option>
                    <option value="AED">AED</option>
                    <option value="SAR">SAR</option>
                  </select>
                </div>
              </div>

              {/* Featured */}
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.is_featured}
                  onChange={(e) =>
                    setFormData((p) => ({
                      ...p,
                      is_featured: e.target.checked,
                    }))
                  }
                  className="w-5 h-5 rounded border-slate-600 bg-slate-900/50 text-yellow-500"
                />
                <span className="text-slate-300">Featured product</span>
              </label>
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
                disabled={saving || !formData.name_en || !formData.price}
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