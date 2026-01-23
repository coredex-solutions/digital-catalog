"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { CatalogAdminShell } from "../_components/CatalogAdminShell";
import {
  CatalogAdminHeader,
  CatalogAdminContent,
} from "../_components/CatalogAdminSidebar";
import {
  Save,
  Loader2,
  Plus,
  Trash2,
  MessageCircle,
  GripVertical,
} from "lucide-react";

interface FAQ {
  id: string;
  question_ar: string;
  question_en: string;
  question_fr: string;
  answer_ar: string;
  answer_en: string;
  answer_fr: string;
  display_order: number;
}

export default function FAQsPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  useEffect(() => {
    fetchFaqs();
  }, [slug]);

  const fetchFaqs = async () => {
    const token = localStorage.getItem(`catalog_admin_token_${slug}`);
    if (!token) return;

    try {
      const res = await fetch(`/api/c/${slug}/admin/faqs`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        setFaqs(data.faqs || []);
      }
    } catch (error) {
      console.error("Failed to fetch FAQs:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);

    try {
      const token = localStorage.getItem(`catalog_admin_token_${slug}`);
      const res = await fetch(`/api/c/${slug}/admin/faqs`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ faqs }),
      });

      if (res.ok) {
        setMessage({ type: "success", text: "FAQs saved successfully!" });
      } else {
        throw new Error("Failed to save");
      }
    } catch (error: any) {
      setMessage({ type: "error", text: error.message });
    } finally {
      setSaving(false);
    }
  };

  const addFaq = () => {
    const newFaq: FAQ = {
      id: `temp_${Date.now()}`,
      question_ar: "",
      question_en: "",
      question_fr: "",
      answer_ar: "",
      answer_en: "",
      answer_fr: "",
      display_order: faqs.length,
    };
    setFaqs([...faqs, newFaq]);
  };

  const removeFaq = (id: string) => {
    setFaqs(faqs.filter((f) => f.id !== id));
  };

  const updateFaq = (id: string, field: keyof FAQ, value: string) => {
    setFaqs(faqs.map((f) => (f.id === id ? { ...f, [field]: value } : f)));
  };

  return (
    <CatalogAdminShell>
      <CatalogAdminHeader title="FAQs & Chat">
        <div className="flex items-center gap-3">
          <button
            onClick={addFaq}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-xl font-medium border border-slate-700 hover:bg-slate-700 transition-all"
          >
            <Plus className="w-5 h-5" />
            Add Question
          </button>
          <button
            onClick={handleSave}
            disabled={saving || loading}
            className="flex items-center gap-2 px-4 py-2 text-white rounded-xl font-medium transition-all disabled:opacity-50"
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
              <>
                <Save className="w-5 h-5" />
                Save Changes
              </>
            )}
          </button>
        </div>
      </CatalogAdminHeader>

      <CatalogAdminContent>
        {message && (
          <div
            className={`mb-6 px-4 py-3 rounded-xl ${
              message.type === "success"
                ? "bg-green-500/10 text-green-400 border border-green-500/20"
                : "bg-purple-500/10 text-purple-400 border border-purple-500/20"
            }`}
          >
            {message.text}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-slate-500" />
          </div>
        ) : faqs.length === 0 ? (
          <div className="text-center py-20 bg-slate-800/50 rounded-2xl border border-slate-700/50">
            <MessageCircle className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">No FAQs Yet</h3>
            <p className="text-slate-400 mb-6">
              Add frequently asked questions to help your customers in the live chat.
            </p>
            <button
              onClick={addFaq}
              className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-medium transition-colors"
            >
              Add Your First Question
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {faqs.map((faq, index) => (
              <div
                key={faq.id}
                className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50 group"
              >
                <div className="flex items-start gap-4">
                  <div className="mt-4 cursor-grab active:cursor-grabbing text-slate-600 hover:text-slate-400">
                    <GripVertical className="w-6 h-6" />
                  </div>
                  
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Arabic */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs font-bold px-2 py-0.5 rounded bg-slate-700 text-violet-400">AR</span>
                        <span className="text-sm text-slate-400">العربية</span>
                      </div>
                      <input
                        type="text"
                        placeholder="السؤال"
                        value={faq.question_ar}
                        onChange={(e) => updateFaq(faq.id, "question_ar", e.target.value)}
                        className="w-full px-4 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-white text-right focus:outline-none focus:border-violet-500"
                        dir="rtl"
                      />
                      <textarea
                        rows={2}
                        placeholder="الجواب"
                        value={faq.answer_ar}
                        onChange={(e) => updateFaq(faq.id, "answer_ar", e.target.value)}
                        className="w-full px-4 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-white text-right focus:outline-none focus:border-violet-500 resize-none"
                        dir="rtl"
                      />
                    </div>

                    {/* English */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs font-bold px-2 py-0.5 rounded bg-slate-700 text-violet-400">EN</span>
                        <span className="text-sm text-slate-400">English</span>
                      </div>
                      <input
                        type="text"
                        placeholder="Question"
                        value={faq.question_en}
                        onChange={(e) => updateFaq(faq.id, "question_en", e.target.value)}
                        className="w-full px-4 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-violet-500"
                      />
                      <textarea
                        rows={2}
                        placeholder="Answer"
                        value={faq.answer_en}
                        onChange={(e) => updateFaq(faq.id, "answer_en", e.target.value)}
                        className="w-full px-4 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-violet-500 resize-none"
                      />
                    </div>

                    {/* French */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs font-bold px-2 py-0.5 rounded bg-slate-700 text-purple-400">FR</span>
                        <span className="text-sm text-slate-400">Français</span>
                      </div>
                      <input
                        type="text"
                        placeholder="Question"
                        value={faq.question_fr}
                        onChange={(e) => updateFaq(faq.id, "question_fr", e.target.value)}
                        className="w-full px-4 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-violet-500"
                      />
                      <textarea
                        rows={2}
                        placeholder="Réponse"
                        value={faq.answer_fr}
                        onChange={(e) => updateFaq(faq.id, "answer_fr", e.target.value)}
                        className="w-full px-4 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-violet-500 resize-none"
                      />
                    </div>
                  </div>

                  <button
                    onClick={() => removeFaq(faq.id)}
                    className="mt-4 p-2 text-slate-500 hover:text-purple-400 hover:bg-purple-500/10 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CatalogAdminContent>
    </CatalogAdminShell>
  );
}
