"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Edit, Trash2, X, Search, Filter } from "lucide-react";
import { useRouter } from "next/navigation";
import { Sidebar } from "../_components/Sidebar";
import { SortableList } from "../_components/SortableList";

interface MenuItem {
  id: string;
  category_id: string;
  name_ar: string;
  name_en: string;
  name_fr: string;
  description_ar: string | null;
  description_en: string | null;
  description_fr: string | null;
  price: number;
  display_order: number;
  is_active: boolean;
}

interface Category {
  id: string;
  name_en: string;
}

export default function MenuItemsPage() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const router = useRouter();

  const [formData, setFormData] = useState({
    category_id: "",
    name_ar: "",
    name_en: "",
    name_fr: "",
    description_ar: "",
    description_en: "",
    description_fr: "",
    price: 0,
    is_active: true,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const token = getAuthToken();
      const [itemsRes, categoriesRes] = await Promise.all([
        fetch("/api/admin/menu-items", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }),
        fetch("/api/admin/categories", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }),
      ]);
      const items = await itemsRes.json();
      const cats = await categoriesRes.json();
      setMenuItems(items);
      setCategories(cats);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getAuthToken = () => {
    return localStorage.getItem("admin_token");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = getAuthToken();
    if (!token) {
      router.push("/admin/login");
      return;
    }

    try {
      const url = editingItem
        ? `/api/menu-items/${editingItem.id}`
        : "/api/menu-items";
      const method = editingItem ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...formData,
          price: Number(formData.price),
          display_order: 0, // Will be set by drag-and-drop ordering
          is_active: formData.is_active ?? true,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        alert(error.error || "Failed to save menu item");
        return;
      }

      setShowModal(false);
      resetForm();
      fetchData();
    } catch (error) {
      console.error("Error saving menu item:", error);
      alert("An error occurred");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this menu item?")) return;

    const token = getAuthToken();
    if (!token) {
      router.push("/admin/login");
      return;
    }

    try {
      const response = await fetch(`/api/menu-items/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        alert("Failed to delete menu item");
        return;
      }

      fetchData();
    } catch (error) {
      console.error("Error deleting menu item:", error);
      alert("An error occurred");
    }
  };

  const handleEdit = (item: MenuItem) => {
    setEditingItem(item);
    setFormData({
      category_id: item.category_id,
      name_ar: item.name_ar,
      name_en: item.name_en,
      name_fr: item.name_fr,
      description_ar: item.description_ar || "",
      description_en: item.description_en || "",
      description_fr: item.description_fr || "",
      price: item.price,
      is_active: item.is_active,
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({
      category_id: "",
      name_ar: "",
      name_en: "",
      name_fr: "",
      description_ar: "",
      description_en: "",
      description_fr: "",
      price: 0,
      is_active: true,
    });
    setEditingItem(null);
  };

  const handleReorder = async (newItems: MenuItem[]) => {
    // Update local state immediately for better UX
    setMenuItems(newItems);

    // Update display_order for all items
    const itemsWithOrder = newItems.map((item, index) => ({
      id: item.id,
      display_order: index + 1,
    }));

    try {
      const token = getAuthToken();
      const response = await fetch("/api/menu-items/reorder", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ items: itemsWithOrder }),
      });

      if (!response.ok) {
        throw new Error("Failed to reorder menu items");
      }
    } catch (error) {
      console.error("Error reordering menu items:", error);
      // Revert on error
      fetchData();
    }
  };

  const filteredItems = menuItems.filter((item) => {
    const matchesSearch =
      item.name_en.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.name_ar.includes(searchQuery) ||
      item.name_fr.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      filterCategory === "all" || item.category_id === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const getCategoryName = (categoryId: string) => {
    return categories.find((c) => c.id === categoryId)?.name_en || categoryId;
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
        <div className="p-4 sm:p-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8">
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
                Menu Items
              </h1>
              <button
                onClick={() => {
                  resetForm();
                  setShowModal(true);
                }}
                className="flex items-center justify-center gap-2 bg-purple-600 text-white px-6 py-3 rounded-xl hover:bg-purple-700 transition-colors font-semibold w-full sm:w-auto"
              >
                <Plus size={20} />
                Add Menu Item
              </button>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search
                  size={20}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="text"
                  placeholder="Search menu items..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-white dark:bg-navy-800 border border-slate-200 dark:border-navy-700 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none text-slate-900 dark:text-white"
                />
              </div>
              <div className="relative sm:w-64">
                <Filter
                  size={20}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-white dark:bg-navy-800 border border-slate-200 dark:border-navy-700 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none text-slate-900 dark:text-white appearance-none"
                >
                  <option value="all">All Categories</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name_en}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Menu Items List with Drag-and-Drop */}
            {filteredItems.length === 0 ? (
              <div className="bg-white dark:bg-navy-800 rounded-2xl p-12 text-center border border-slate-200 dark:border-navy-700">
                <p className="text-slate-500 dark:text-slate-400">
                  {searchQuery || filterCategory !== "all"
                    ? "No menu items found"
                    : "No menu items yet. Create your first one!"}
                </p>
              </div>
            ) : (
              <div className="bg-white dark:bg-navy-800 rounded-2xl p-4 sm:p-6 border border-slate-200 dark:border-navy-700">
                <SortableList
                  items={filteredItems}
                  onReorder={handleReorder}
                  renderItem={(item) => (
                    <div className="flex items-start gap-3 sm:gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-base sm:text-lg text-slate-900 dark:text-white mb-1 break-words">
                              {item.name_en}
                            </h3>
                            <p className="text-xs text-purple-600 dark:text-purple-400 font-medium mb-1">
                              {getCategoryName(item.category_id)}
                            </p>
                            {item.description_en && (
                              <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-1">
                                {item.description_en}
                              </p>
                            )}
                          </div>
                          {!item.is_active && (
                            <span className="px-2 py-1 text-xs bg-purple-100 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 rounded-lg ml-2">
                              Inactive
                            </span>
                          )}
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xl font-bold text-purple-600 dark:text-purple-400">
                            ${(item.price / 100).toFixed(2)}
                          </span>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleEdit(item)}
                              className="flex items-center justify-center gap-2 bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 px-3 py-2 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/40 transition-colors"
                            >
                              <Edit size={16} />
                              <span className="hidden sm:inline">Edit</span>
                            </button>
                            <button
                              onClick={() => handleDelete(item.id)}
                              className="flex items-center justify-center gap-2 bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 px-3 py-2 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/40 transition-colors"
                            >
                              <Trash2 size={16} />
                              <span className="hidden sm:inline">Delete</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                />
              </div>
            )}
          </div>

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
                  <div className="bg-white dark:bg-navy-800 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                    <div className="sticky top-0 bg-white dark:bg-navy-800 border-b border-slate-200 dark:border-navy-700 p-4 sm:p-6 flex items-center justify-between z-10">
                      <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                        {editingItem ? "Edit Menu Item" : "Add Menu Item"}
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
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                            Category *
                          </label>
                          <select
                            value={formData.category_id}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                category_id: e.target.value,
                              })
                            }
                            required
                            className="w-full px-4 py-3 bg-slate-50 dark:bg-navy-700 border border-slate-200 dark:border-navy-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none text-slate-900 dark:text-white"
                          >
                            <option value="">Select category</option>
                            {categories.map((cat) => (
                              <option key={cat.id} value={cat.id}>
                                {cat.name_en}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                            Description (Arabic)
                          </label>
                          <textarea
                            value={formData.description_ar}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                description_ar: e.target.value,
                              })
                            }
                            rows={3}
                            className="w-full px-4 py-3 bg-slate-50 dark:bg-navy-700 border border-slate-200 dark:border-navy-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none text-slate-900 dark:text-white resize-none"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                            Description (English)
                          </label>
                          <textarea
                            value={formData.description_en}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                description_en: e.target.value,
                              })
                            }
                            rows={3}
                            className="w-full px-4 py-3 bg-slate-50 dark:bg-navy-700 border border-slate-200 dark:border-navy-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none text-slate-900 dark:text-white resize-none"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                            Description (French)
                          </label>
                          <textarea
                            value={formData.description_fr}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                description_fr: e.target.value,
                              })
                            }
                            rows={3}
                            className="w-full px-4 py-3 bg-slate-50 dark:bg-navy-700 border border-slate-200 dark:border-navy-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none text-slate-900 dark:text-white resize-none"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                            Price (cents) *
                          </label>
                          <input
                            type="number"
                            value={formData.price}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                price: parseInt(e.target.value) || 0,
                              })
                            }
                            required
                            min="0"
                            step="1"
                            className="w-full px-4 py-3 bg-slate-50 dark:bg-navy-700 border border-slate-200 dark:border-navy-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none text-slate-900 dark:text-white"
                          />
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                            ${((formData.price || 0) / 100).toFixed(2)}
                          </p>
                        </div>
                        <div className="flex items-center">
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
                      </div>

                      <div className="flex gap-4 pt-4 border-t border-slate-200 dark:border-navy-700">
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
                          className="flex-1 px-6 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors font-semibold"
                        >
                          {editingItem ? "Update" : "Create"}
                        </button>
                      </div>
                    </form>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
