"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Edit,
  Trash2,
  X,
  Upload,
  Image as ImageIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Sidebar } from "../_components/Sidebar";
import { SortableList } from "../_components/SortableList";
import {
  compressImage,
  formatBytes,
  isImageFile,
} from "@/utils/image-compression";

interface Category {
  id: string;
  name_ar: string;
  name_en: string;
  name_fr: string;
  image_url: string | null;
  icon_name: string;
  display_order: number;
  is_active: boolean;
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const [formData, setFormData] = useState({
    name_ar: "",
    name_en: "",
    name_fr: "",
    image_url: "",
    icon_name: "Utensils",
    display_order: 0,
    is_active: true,
  });

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const uploadXhrRef = useRef<XMLHttpRequest | null>(null);
  const previewUrlRef = useRef<string | null>(null);

  useEffect(() => {
    fetchCategories();

    // Cleanup function to revoke object URLs and abort uploads
    return () => {
      // Abort any ongoing upload
      if (uploadXhrRef.current) {
        uploadXhrRef.current.abort();
        uploadXhrRef.current = null;
      }

      // Revoke object URL to prevent memory leaks
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
        previewUrlRef.current = null;
      }
    };
  }, []);

  const fetchCategories = async () => {
    try {
      const token = getAuthToken();
      // Fetch all categories including inactive ones for admin
      const response = await fetch("/api/admin/categories", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      setCategories(data);
    } catch (error) {
      console.error("Error fetching categories:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleReorder = async (newItems: Category[]) => {
    // Update local state immediately for better UX
    setCategories(newItems);

    // Update display_order for all items
    const itemsWithOrder = newItems.map((item, index) => ({
      id: item.id,
      display_order: index + 1,
    }));

    try {
      const token = getAuthToken();
      const response = await fetch("/api/categories/reorder", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ items: itemsWithOrder }),
      });

      if (!response.ok) {
        throw new Error("Failed to reorder categories");
      }
    } catch (error) {
      console.error("Error reordering categories:", error);
      // Revert on error
      fetchCategories();
    }
  };

  const getAuthToken = () => {
    return localStorage.getItem("admin_token");
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const processFile = async (file: File) => {
    // Validate file type
    if (!file.type.startsWith("image/")) {
      alert("Please select an image file");
      return;
    }

    // Validate file size (max 10MB before compression)
    if (file.size > 10 * 1024 * 1024) {
      alert("File size must be less than 10MB");
      return;
    }

    // Revoke previous object URL if exists
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
    }

    // Create preview immediately
    const previewURL = URL.createObjectURL(file);
    previewUrlRef.current = previewURL;
    setPreviewUrl(previewURL);
    setSelectedFile(file);

    // Upload image immediately in background
    const token = getAuthToken();
    if (!token) return;

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Compress the image before upload
      const compressionResult = await compressImage(file, {
        maxSizeMB: 2,
        maxWidthOrHeight: 2048,
        quality: 0.85,
      });

      if (compressionResult.wasCompressed) {
        console.log(
          `📦 Compressed: ${formatBytes(
            compressionResult.originalSize
          )} → ${formatBytes(compressionResult.compressedSize)}`
        );
      }

      const uploadFormData = new FormData();
      uploadFormData.append("file", compressionResult.file);
      uploadFormData.append("folder", "categories");

      const xhr = new XMLHttpRequest();
      uploadXhrRef.current = xhr;

      // Track upload progress
      xhr.upload.addEventListener("progress", (e) => {
        if (e.lengthComputable) {
          const percentage = Math.round((e.loaded / e.total) * 100);
          setUploadProgress(percentage);
        }
      });

      // Handle completion
      xhr.addEventListener("load", () => {
        uploadXhrRef.current = null;
        setIsUploading(false);

        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const response = JSON.parse(xhr.responseText);
            setUploadProgress(100);
            // Update form data with uploaded URL immediately
            setFormData((prev) => ({ ...prev, image_url: response.url }));
            // Clear selected file as it's now uploaded
            setSelectedFile(null);
            // Keep preview URL for display
            setTimeout(() => setUploadProgress(0), 1000);
          } catch (error) {
            console.error("Upload response error:", error);
            setUploadProgress(0);
            alert("Upload completed but response was invalid");
          }
        } else {
          setUploadProgress(0);
          alert("Upload failed. Please try again.");
          // Clear preview on failure
          setPreviewUrl(null);
          setSelectedFile(null);
          if (previewUrlRef.current) {
            URL.revokeObjectURL(previewUrlRef.current);
            previewUrlRef.current = null;
          }
        }
      });

      // Handle errors
      xhr.addEventListener("error", () => {
        uploadXhrRef.current = null;
        setIsUploading(false);
        setUploadProgress(0);
        alert("Network error during upload");
        setPreviewUrl(null);
        setSelectedFile(null);
        if (previewUrlRef.current) {
          URL.revokeObjectURL(previewUrlRef.current);
          previewUrlRef.current = null;
        }
      });

      xhr.addEventListener("abort", () => {
        uploadXhrRef.current = null;
        setIsUploading(false);
        setUploadProgress(0);
      });

      // Start upload
      xhr.open("POST", "/api/upload");
      xhr.setRequestHeader("Authorization", `Bearer ${token}`);
      xhr.send(uploadFormData);
    } catch (error) {
      console.error("Upload error:", error);
      setIsUploading(false);
      setUploadProgress(0);
      alert("Failed to upload image");
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleRemoveImage = async () => {
    if (!formData.image_url) return;

    // Clear the image from form data immediately (optimistic update)
    const imageToDelete = formData.image_url;
    setFormData({ ...formData, image_url: "" });
    setPreviewUrl(null);
    setSelectedFile(null);

    // Revoke object URL if exists
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
    }

    // Delete from R2 in background
    if (imageToDelete && imageToDelete.includes("r2.dev")) {
      const token = getAuthToken();
      if (token) {
        fetch(`/api/upload/delete?url=${encodeURIComponent(imageToDelete)}`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }).catch((error) => console.error("Error deleting image:", error));
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Prevent double submission or submission during upload
    if (isSubmitting || isUploading) {
      return;
    }

    // Abort any ongoing upload
    if (uploadXhrRef.current) {
      uploadXhrRef.current.abort();
      uploadXhrRef.current = null;
      setIsUploading(false);
      setUploadProgress(0);
    }

    const token = getAuthToken();
    if (!token) {
      router.push("/admin/login");
      return;
    }

    setIsSubmitting(true);

    // Image is already uploaded from processFile, just use the URL
    const imageUrl = formData.image_url || null;

    // If updating and image_url changed or removed, delete old image from R2 in background
    if (
      editingCategory &&
      editingCategory.image_url &&
      editingCategory.image_url !== imageUrl &&
      editingCategory.image_url.includes("r2.dev")
    ) {
      fetch(
        `/api/upload/delete?url=${encodeURIComponent(
          editingCategory.image_url
        )}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      ).catch((error) => console.error("Error deleting old image:", error));
    }

    const payload = {
      ...formData,
      image_url: imageUrl,
      is_active: formData.is_active ?? true,
    };

    try {
      const url = editingCategory
        ? `/api/categories/${editingCategory.id}`
        : "/api/categories";
      const method = editingCategory ? "PUT" : "POST";

      // Don't send id for new categories - server will generate it

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        alert(error.error || "Failed to save category");
        setIsSubmitting(false);
        return;
      }

      const savedCategory = await response.json();

      // Optimistic UI update - update local state immediately
      if (editingCategory) {
        setCategories((prev) =>
          prev.map((cat) =>
            cat.id === editingCategory.id ? { ...cat, ...payload } : cat
          )
        );
      } else {
        // Add new category to list immediately
        const newCategory = {
          id: savedCategory.id || `temp_${Date.now()}`,
          ...payload,
          display_order: categories.length + 1,
          is_active: payload.is_active ?? true,
        };
        setCategories((prev) => [...prev, newCategory as Category]);
      }

      setShowModal(false);
      resetForm();
      setIsSubmitting(false);

      // Fetch fresh data in background without blocking UI
      fetchCategories();
    } catch (error) {
      console.error("Error saving category:", error);
      alert("An error occurred while saving the category. Please try again.");
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this category?")) return;

    const token = getAuthToken();
    if (!token) {
      router.push("/admin/login");
      return;
    }

    // Find the category to get its image URL
    const category = categories.find((c) => c.id === id);

    // Optimistic UI update - remove from list immediately
    setCategories((prev) => prev.filter((cat) => cat.id !== id));

    // Delete the image from R2 in background
    if (category?.image_url && category.image_url.includes("r2.dev")) {
      fetch(
        `/api/upload/delete?url=${encodeURIComponent(category.image_url)}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      ).catch((error) => console.error("Error deleting image:", error));
    }

    try {
      const response = await fetch(`/api/categories/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        alert("Failed to delete category");
        // Revert optimistic update
        fetchCategories();
        return;
      }

      // Refresh in background
      fetchCategories();
    } catch (error) {
      console.error("Error deleting category:", error);
      alert("An error occurred");
    }
  };

  const handleEdit = (category: Category) => {
    // Revoke previous object URL if exists
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
    }

    setEditingCategory(category);
    setFormData({
      name_ar: category.name_ar,
      name_en: category.name_en,
      name_fr: category.name_fr,
      image_url: category.image_url || "",
      icon_name: category.icon_name,
      display_order: category.display_order,
      is_active: category.is_active,
    });
    // Set preview URL (this is a regular URL, not an object URL, so no need to revoke)
    setPreviewUrl(category.image_url || null);
    setSelectedFile(null);
    setShowModal(true);
  };

  const resetForm = () => {
    // Abort any ongoing upload
    if (uploadXhrRef.current) {
      uploadXhrRef.current.abort();
      uploadXhrRef.current = null;
    }

    // Revoke object URL
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
    }

    setFormData({
      name_ar: "",
      name_en: "",
      name_fr: "",
      image_url: "",
      icon_name: "Utensils",
      display_order: categories.length + 1,
      is_active: true,
    });
    setSelectedFile(null);
    setPreviewUrl(null);
    setEditingCategory(null);
    setIsUploading(false);
    setUploadProgress(0);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-navy-900">
        <Sidebar />
        <div className="lg:pl-64 pt-16 lg:pt-0">
          <div className="flex items-center justify-center min-h-screen">
            <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-navy-900">
      <Sidebar />
      <div className="lg:pl-64 pt-16 lg:pt-0">
        <main className="p-4 sm:p-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8">
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
                Categories
              </h1>
              <button
                onClick={() => {
                  resetForm();
                  setShowModal(true);
                }}
                className="flex items-center justify-center gap-2 bg-purple-600 text-white px-6 py-3 rounded-xl hover:bg-purple-700 transition-colors font-semibold w-full sm:w-auto"
              >
                <Plus size={20} />
                Add Category
              </button>
            </div>

            {categories.length === 0 ? (
              <div className="bg-white dark:bg-navy-800 rounded-2xl p-12 text-center border border-slate-200 dark:border-navy-700">
                <p className="text-slate-500 dark:text-slate-400 mb-4">
                  No categories yet. Add your first category to get started.
                </p>
                <button
                  onClick={() => {
                    resetForm();
                    setShowModal(true);
                  }}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-xl font-semibold"
                >
                  Add Category
                </button>
              </div>
            ) : (
              <div className="bg-white dark:bg-navy-800 rounded-2xl p-4 sm:p-6 border border-slate-200 dark:border-navy-700">
                <SortableList
                  items={categories}
                  onReorder={handleReorder}
                  renderItem={(category) => (
                    <div className="flex items-start gap-3 sm:gap-4">
                      {category.image_url && (
                        <div className="w-16 h-16 sm:w-24 sm:h-24 rounded-xl overflow-hidden bg-slate-100 dark:bg-navy-700 flex-shrink-0 relative">
                          <Image
                            src={category.image_url}
                            alt={category.name_en}
                            fill
                            sizes="96px"
                            className="object-cover"
                          />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <h3 className="font-bold text-base sm:text-lg text-slate-900 dark:text-white truncate">
                            {category.name_en}
                          </h3>
                          {!category.is_active && (
                            <span className="px-2 py-1 text-xs bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg">
                              Inactive
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">
                          {category.name_ar} • {category.name_fr}
                        </p>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 text-xs rounded-full">
                            Order: {category.display_order}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                        <button
                          onClick={() => handleEdit(category)}
                          className="p-2 sm:p-2.5 hover:bg-purple-50 dark:hover:bg-purple-900/20 text-purple-600 dark:text-purple-400 rounded-lg transition-colors"
                          aria-label="Edit category"
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(category.id)}
                          className="p-2 sm:p-2.5 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg transition-colors"
                          aria-label="Delete category"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  )}
                />
              </div>
            )}

            {/* Modal */}
            <AnimatePresence>
              {showModal && (
                <>
                  <div
                    className="fixed inset-0 bg-black/50 z-50"
                    onClick={() => {
                      setShowModal(false);
                      resetForm();
                    }}
                  />
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="fixed inset-0 z-50 flex items-center justify-center p-4"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="bg-white dark:bg-navy-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                      <div className="p-4 sm:p-6 border-b border-slate-200 dark:border-navy-700 flex items-center justify-between">
                        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                          {editingCategory ? "Edit Category" : "Add Category"}
                        </h2>
                        <button
                          onClick={() => {
                            setShowModal(false);
                            resetForm();
                          }}
                          className="p-2 hover:bg-slate-100 dark:hover:bg-navy-700 rounded-lg"
                        >
                          <X
                            size={20}
                            className="text-slate-600 dark:text-slate-400"
                          />
                        </button>
                      </div>

                      <form
                        onSubmit={handleSubmit}
                        className="p-4 sm:p-6 space-y-4 sm:space-y-6"
                      >
                        <div>
                          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                            Name (Arabic) *
                          </label>
                          <input
                            type="text"
                            value={formData.name_ar}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                name_ar: e.target.value,
                              })
                            }
                            required
                            className="w-full px-4 py-3 bg-slate-50 dark:bg-navy-700 border border-slate-200 dark:border-navy-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none text-slate-900 dark:text-white"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                            Name (English) *
                          </label>
                          <input
                            type="text"
                            value={formData.name_en}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                name_en: e.target.value,
                              })
                            }
                            required
                            className="w-full px-4 py-3 bg-slate-50 dark:bg-navy-700 border border-slate-200 dark:border-navy-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none text-slate-900 dark:text-white"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                            Name (French) *
                          </label>
                          <input
                            type="text"
                            value={formData.name_fr}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                name_fr: e.target.value,
                              })
                            }
                            required
                            className="w-full px-4 py-3 bg-slate-50 dark:bg-navy-700 border border-slate-200 dark:border-navy-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none text-slate-900 dark:text-white"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                            Category Image
                          </label>
                          <div className="space-y-4">
                            {previewUrl && (
                              <div className="relative aspect-video rounded-xl overflow-hidden bg-slate-100 dark:bg-navy-700 group">
                                <img
                                  src={previewUrl}
                                  alt="Preview"
                                  className="w-full h-full object-cover"
                                />
                                <button
                                  type="button"
                                  onClick={handleRemoveImage}
                                  className="absolute top-2 right-2 p-2 bg-red-500 hover:bg-red-600 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                                  title="Remove image"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            )}
                            <div
                              onDragOver={handleDragOver}
                              onDragLeave={handleDragLeave}
                              onDrop={handleDrop}
                              className={`flex items-center justify-center gap-2 w-full px-4 py-8 bg-slate-50 dark:bg-navy-700 border-2 border-dashed rounded-xl cursor-pointer transition-all ${
                                isDragging
                                  ? "border-purple-500 bg-purple-50 dark:bg-purple-900/20 scale-105"
                                  : "border-slate-300 dark:border-navy-600 hover:border-purple-500"
                              }`}
                            >
                              <label className="flex flex-col items-center justify-center gap-2 w-full cursor-pointer">
                                <Upload
                                  size={24}
                                  className={`${
                                    isDragging
                                      ? "text-purple-500"
                                      : "text-slate-400"
                                  }`}
                                />
                                <span
                                  className={`text-sm font-medium ${
                                    isDragging
                                      ? "text-purple-600 dark:text-purple-400"
                                      : "text-slate-600 dark:text-slate-400"
                                  }`}
                                >
                                  {isDragging
                                    ? "Drop image here"
                                    : selectedFile
                                    ? selectedFile.name
                                    : "Drag & drop image or click to choose"}
                                </span>
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={handleFileSelect}
                                  className="hidden"
                                />
                              </label>
                            </div>
                            {uploadProgress > 0 && uploadProgress < 100 && (
                              <div className="space-y-2">
                                <div className="w-full bg-slate-200 dark:bg-navy-700 rounded-full h-3 overflow-hidden">
                                  <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${uploadProgress}%` }}
                                    className="bg-gradient-to-r from-purple-500 to-purple-600 h-3 rounded-full transition-all"
                                  />
                                </div>
                                <p className="text-xs text-center text-slate-600 dark:text-slate-400">
                                  Uploading... {uploadProgress}%
                                </p>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 pt-2">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={formData.is_active}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  is_active: e.target.checked,
                                })
                              }
                              className="w-5 h-5 rounded border-slate-300 dark:border-navy-600 text-purple-600 focus:ring-purple-500"
                            />
                            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                              Active
                            </span>
                          </label>
                        </div>

                        <div className="flex gap-4 pt-4">
                          <button
                            type="button"
                            onClick={() => {
                              setShowModal(false);
                              resetForm();
                            }}
                            className="flex-1 px-6 py-3 bg-slate-100 dark:bg-navy-700 text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-200 dark:hover:bg-navy-600 transition-colors font-semibold"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            disabled={isSubmitting || isUploading}
                            className="flex-1 px-6 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {isUploading
                              ? `Uploading... ${uploadProgress}%`
                              : isSubmitting
                              ? editingCategory
                                ? "Updating..."
                                : "Creating..."
                              : editingCategory
                              ? "Update"
                              : "Create"}
                          </button>
                        </div>
                      </form>
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </main>
      </div>
    </div>
  );
}
