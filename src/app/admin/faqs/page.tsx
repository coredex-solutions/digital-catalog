"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Edit, Trash2, X, Save } from "lucide-react";
import { Sidebar } from "../_components/Sidebar";
import { SortableList } from "../_components/SortableList";

interface FAQ {
  id: string;
  question_ar: string;
  question_en: string;
  question_fr: string;
  answer_ar: string;
  answer_en: string;
  answer_fr: string;
  display_order: number;
  is_active: boolean;
}

export default function FAQsPage() {
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingFAQ, setEditingFAQ] = useState<FAQ | null>(null);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    id: "",
    question_ar: "",
    question_en: "",
    question_fr: "",
    answer_ar: "",
    answer_en: "",
    answer_fr: "",
    is_active: true,
  });

  useEffect(() => {
    fetchFAQs();
  }, []);

  const fetchFAQs = async () => {
    try {
      const response = await fetch("/api/faqs");
      const data = await response.json();
      setFaqs(data);
    } catch (error) {
      console.error("Error fetching FAQs:", error);
    } finally {
      setLoading(false);
    }
  };

  const getAuthToken = () => {
    return localStorage.getItem("admin_token");
  };

  const handleReorder = async (newItems: FAQ[]) => {
    // Update local state immediately for better UX
    setFaqs(newItems);

    // Update display_order for all items
    const itemsWithOrder = newItems.map((item, index) => ({
      id: item.id,
      display_order: index + 1,
    }));

    try {
      const token = getAuthToken();
      const response = await fetch("/api/faqs/reorder", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ items: itemsWithOrder }),
      });

      if (!response.ok) {
        throw new Error("Failed to reorder FAQs");
      }
    } catch (error) {
      console.error("Error reordering FAQs:", error);
      // Revert on error
      fetchFAQs();
    }
  };

  const handleOpenModal = (faq?: FAQ) => {
    if (faq) {
      setEditingFAQ(faq);
      setFormData({
        id: faq.id,
        question_ar: faq.question_ar,
        question_en: faq.question_en,
        question_fr: faq.question_fr,
        answer_ar: faq.answer_ar,
        answer_en: faq.answer_en,
        answer_fr: faq.answer_fr,
        is_active: faq.is_active,
      });
    } else {
      setEditingFAQ(null);
      setFormData({
        id: "",
        question_ar: "",
        question_en: "",
        question_fr: "",
        answer_ar: "",
        answer_en: "",
        answer_fr: "",
        is_active: true,
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingFAQ(null);
    setFormData({
      id: "",
      question_ar: "",
      question_en: "",
      question_fr: "",
      answer_ar: "",
      answer_en: "",
      answer_fr: "",
      is_active: true,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const token = getAuthToken();
      const url = editingFAQ ? "/api/faqs" : "/api/faqs";
      const method = editingFAQ ? "PUT" : "POST";

      const payload = editingFAQ
        ? {
            ...formData,
            display_order: editingFAQ.display_order,
          }
        : {
            ...formData,
            id: `faq_${Date.now()}`,
          };

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error("Failed to save FAQ");
      }

      handleCloseModal();
      fetchFAQs();
    } catch (error) {
      console.error("Error saving FAQ:", error);
      alert("Failed to save FAQ. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this FAQ?")) {
      return;
    }

    try {
      const token = getAuthToken();
      const response = await fetch(`/api/faqs?id=${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to delete FAQ");
      }

      fetchFAQs();
    } catch (error) {
      console.error("Error deleting FAQ:", error);
      alert("Failed to delete FAQ. Please try again.");
    }
  };

  const handleToggleActive = async (faq: FAQ) => {
    try {
      const token = getAuthToken();
      const response = await fetch("/api/faqs", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...faq,
          is_active: !faq.is_active,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update FAQ");
      }

      fetchFAQs();
    } catch (error) {
      console.error("Error toggling FAQ:", error);
      alert("Failed to update FAQ. Please try again.");
    }
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
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mb-2">
                  FAQs Management
                </h1>
                <p className="text-slate-600 dark:text-slate-400">
                  Manage frequently asked questions for the chat widget
                </p>
              </div>
              <button
                onClick={() => handleOpenModal()}
                className="flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-xl font-semibold shadow-lg shadow-purple-500/20 transition-all w-full sm:w-auto"
              >
                <Plus size={20} />
                Add FAQ
              </button>
            </div>

            {faqs.length === 0 ? (
              <div className="bg-white dark:bg-navy-800 rounded-2xl p-12 text-center border border-slate-200 dark:border-navy-700">
                <p className="text-slate-500 dark:text-slate-400 mb-4">
                  No FAQs yet. Add your first FAQ to get started.
                </p>
                <button
                  onClick={() => handleOpenModal()}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-xl font-semibold"
                >
                  Add FAQ
                </button>
              </div>
            ) : (
              <div className="bg-white dark:bg-navy-800 rounded-2xl p-4 sm:p-6 border border-slate-200 dark:border-navy-700">
                <SortableList
                  items={faqs}
                  onReorder={handleReorder}
                  renderItem={(faq) => (
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 sm:gap-3 mb-2 flex-wrap">
                          <h3 className="font-semibold text-sm sm:text-base text-slate-900 dark:text-white break-words">
                            {faq.question_en}
                          </h3>
                          {!faq.is_active && (
                            <span className="px-2 py-1 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 text-xs rounded-full">
                              Inactive
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2">
                          {faq.answer_en}
                        </p>
                        <div className="mt-2 hidden sm:flex gap-2 text-xs text-slate-500 dark:text-slate-500">
                          <span>AR: {faq.question_ar.substring(0, 30)}...</span>
                          <span>•</span>
                          <span>FR: {faq.question_fr.substring(0, 30)}...</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                        <button
                          onClick={() => handleToggleActive(faq)}
                          className={`px-2 sm:px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                            faq.is_active
                              ? "bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400"
                              : "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400"
                          }`}
                        >
                          {faq.is_active ? "Active" : "Inactive"}
                        </button>
                        <button
                          onClick={() => handleOpenModal(faq)}
                          className="p-2 sm:p-2.5 hover:bg-purple-50 dark:hover:bg-purple-900/20 text-purple-600 dark:text-purple-400 rounded-lg transition-colors"
                          aria-label="Edit FAQ"
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(faq.id)}
                          className="p-2 sm:p-2.5 hover:bg-purple-50 dark:hover:bg-purple-900/20 text-purple-600 dark:text-purple-400 rounded-lg transition-colors"
                          aria-label="Delete FAQ"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  )}
                />
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50"
              onClick={handleCloseModal}
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative bg-white dark:bg-navy-800 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto z-10"
            >
              <div className="sticky top-0 bg-white dark:bg-navy-800 border-b border-slate-200 dark:border-navy-700 p-4 sm:p-6 flex items-center justify-between">
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                  {editingFAQ ? "Edit FAQ" : "Add FAQ"}
                </h2>
                <button
                  onClick={handleCloseModal}
                  className="p-2 hover:bg-slate-100 dark:hover:bg-navy-700 rounded-lg transition-colors"
                >
                  <X size={20} className="text-slate-600 dark:text-slate-400" />
                </button>
              </div>

              <form
                onSubmit={handleSubmit}
                className="p-4 sm:p-6 space-y-4 sm:space-y-6"
              >
                {/* Questions */}
                <div className="space-y-3 sm:space-y-4">
                  <h3 className="text-base sm:text-lg font-semibold text-slate-900 dark:text-white">
                    Questions
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Arabic Question
                      </label>
                      <textarea
                        value={formData.question_ar}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            question_ar: e.target.value,
                          })
                        }
                        required
                        rows={3}
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-navy-700 border border-slate-200 dark:border-navy-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none text-slate-900 dark:text-white resize-none"
                        placeholder="السؤال بالعربية"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        English Question
                      </label>
                      <textarea
                        value={formData.question_en}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            question_en: e.target.value,
                          })
                        }
                        required
                        rows={3}
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-navy-700 border border-slate-200 dark:border-navy-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none text-slate-900 dark:text-white resize-none"
                        placeholder="Question in English"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        French Question
                      </label>
                      <textarea
                        value={formData.question_fr}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            question_fr: e.target.value,
                          })
                        }
                        required
                        rows={3}
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-navy-700 border border-slate-200 dark:border-navy-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none text-slate-900 dark:text-white resize-none"
                        placeholder="Question en français"
                      />
                    </div>
                  </div>
                </div>

                {/* Answers */}
                <div className="space-y-3 sm:space-y-4">
                  <h3 className="text-base sm:text-lg font-semibold text-slate-900 dark:text-white">
                    Answers
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Arabic Answer
                      </label>
                      <textarea
                        value={formData.answer_ar}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            answer_ar: e.target.value,
                          })
                        }
                        required
                        rows={5}
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-navy-700 border border-slate-200 dark:border-navy-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none text-slate-900 dark:text-white resize-none"
                        placeholder="الإجابة بالعربية"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        English Answer
                      </label>
                      <textarea
                        value={formData.answer_en}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            answer_en: e.target.value,
                          })
                        }
                        required
                        rows={5}
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-navy-700 border border-slate-200 dark:border-navy-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none text-slate-900 dark:text-white resize-none"
                        placeholder="Answer in English"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        French Answer
                      </label>
                      <textarea
                        value={formData.answer_fr}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            answer_fr: e.target.value,
                          })
                        }
                        required
                        rows={5}
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-navy-700 border border-slate-200 dark:border-navy-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none text-slate-900 dark:text-white resize-none"
                        placeholder="Réponse en français"
                      />
                    </div>
                  </div>
                </div>

                {/* Active Toggle */}
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={formData.is_active}
                    onChange={(e) =>
                      setFormData({ ...formData, is_active: e.target.checked })
                    }
                    className="w-5 h-5 rounded border-slate-300 dark:border-navy-600 text-purple-600 focus:ring-purple-500"
                  />
                  <label
                    htmlFor="is_active"
                    className="text-sm font-medium text-slate-700 dark:text-slate-300"
                  >
                    Active (visible in chat widget)
                  </label>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-navy-700">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="px-6 py-3 bg-slate-100 dark:bg-navy-700 hover:bg-slate-200 dark:hover:bg-navy-600 text-slate-700 dark:text-slate-300 rounded-xl font-semibold transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-semibold shadow-lg shadow-purple-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Save size={18} />
                    {saving ? "Saving..." : "Save FAQ"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
