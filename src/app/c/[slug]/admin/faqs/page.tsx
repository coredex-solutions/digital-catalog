"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { CatalogAdminShell, useCatalogAdmin } from "../_components/CatalogAdminShell";
import { CatalogAdminHeader, CatalogAdminContent } from "../_components/CatalogAdminSidebar";
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
  answer_ar: string;
  answer_en: string;
  display_order: number;
}

function FAQsPageContent() {
  const { slug, user, fetchWithAuth } = useCatalogAdmin();
  const isViewer = user?.role === 'viewer';

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
    try {
      const res = await fetchWithAuth(`/api/c/${slug}/admin/faqs`);

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
      const res = await fetchWithAuth(`/api/c/${slug}/admin/faqs`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
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
      answer_ar: "",
      answer_en: "",
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
    <>
      <CatalogAdminHeader title="FAQs & Chat">
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={addFaq}
            disabled={isViewer}
            className="flex items-center gap-2 min-h-11 px-6 py-2.5 bg-ui-subtle text-ui-muted border border-ui-line rounded-xl text-xs font-semibold hover:text-ui-ink hover:border-ui-input transition-all disabled:opacity-30 self-center"
          >
            <Plus className="w-4 h-4" />
            Add Question
          </button>
          <button
            onClick={handleSave}
            disabled={saving || loading || isViewer}
            className="group relative flex items-center gap-2 px-5 sm:px-8 py-3 bg-ui-primary text-ui-primary-fg rounded-control transition-all duration-500 font-semibold text-xs overflow-hidden shadow-lg disabled:opacity-50"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save Changes
              </>
            )}
          </button>
        </div>
      </CatalogAdminHeader>

      <CatalogAdminContent>
        {message && (
          <div
            className={`mb-6 px-4 py-3 rounded-xl ${message.type === "success"
              ? "bg-ui-subtle text-ui-success border border-ui-line"
              : "bg-ui-subtle text-ui-primary border border-ui-line"
              }`}
          >
            {message.text}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-ui-primary" />
          </div>
        ) : faqs.length === 0 ? (
          <div className="text-center py-20 glass rounded-panel border border-ui-line">
            <MessageCircle className="w-16 h-16 text-ui-line mx-auto mb-6" />
            <h3 className="text-xl font-bold text-ui-ink mb-2">No FAQs Yet</h3>
            <p className="text-ui-muted mb-6">
              Add frequently asked questions to help your customers in the live chat.
            </p>
            <button
              onClick={addFaq}
              disabled={isViewer}
              className="px-5 sm:px-8 py-4 bg-ui-primary text-ui-primary-fg rounded-control font-semibold text-xs shadow-lg transition-all disabled:opacity-30"
            >
              Add Your First Question
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {faqs.map((faq, index) => (
              <div
                key={faq.id}
                className="glass rounded-panel p-5 sm:p-8 border border-ui-line hover:border-ui-input transition-all group relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-ui-subtle rounded-full -translate-y-1/2 translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity" />

                <div className="flex items-start gap-3 sm:gap-6 relative z-10">
                  <div className="hidden sm:block mt-4 cursor-grab active:cursor-grabbing text-ui-input group-hover:text-white/30 transition-colors">
                    <GripVertical className="w-5 h-5" />
                  </div>

                  <div className="flex-1 min-w-0 space-y-6 sm:space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
                      {/* Arabic */}
                      <div className="space-y-4">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <label className="text-xs font-semibold text-ui-muted">Arabic Content</label>
                          <span className="text-xs font-semibold px-2 py-0.5 rounded bg-ui-subtle text-ui-primary border border-ui-line">AR</span>
                        </div>
                        <input
                          type="text"
                          placeholder="Question in Arabic"
                          aria-label={`Question ${index + 1} in Arabic`}
                          value={faq.question_ar}
                          onChange={(e) => updateFaq(faq.id, "question_ar", e.target.value)}
                          className="w-full px-5 py-3.5 bg-ui-bg border border-ui-input rounded-xl text-ui-ink font-semibold text-right focus:outline-none focus:border-ui-primary transition-all text-sm"
                          dir="rtl"
                        />
                        <textarea
                          rows={2}
                          placeholder="Answer in Arabic"
                          aria-label={`Answer ${index + 1} in Arabic`}
                          value={faq.answer_ar}
                          onChange={(e) => updateFaq(faq.id, "answer_ar", e.target.value)}
                          className="w-full px-5 py-3.5 bg-ui-bg border border-ui-input rounded-xl text-ui-ink font-medium text-right focus:outline-none focus:border-ui-primary transition-all resize-none text-sm"
                          dir="rtl"
                        />
                      </div>

                      {/* English */}
                      <div className="space-y-4">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <label className="text-xs font-semibold text-ui-muted">English Content</label>
                          <span className="text-xs font-semibold px-2 py-0.5 rounded bg-ui-subtle text-ui-primary border border-ui-line">EN</span>
                        </div>
                        <input
                          type="text"
                          placeholder="Question in English"
                          aria-label={`Question ${index + 1} in English`}
                          value={faq.question_en}
                          onChange={(e) => updateFaq(faq.id, "question_en", e.target.value)}
                          className="w-full px-5 py-3.5 bg-ui-bg border border-ui-input rounded-xl text-ui-ink font-semibold focus:outline-none focus:border-ui-primary transition-all text-sm"
                        />
                        <textarea
                          rows={2}
                          placeholder="Answer in English"
                          aria-label={`Answer ${index + 1} in English`}
                          value={faq.answer_en}
                          onChange={(e) => updateFaq(faq.id, "answer_en", e.target.value)}
                          className="w-full px-5 py-3.5 bg-ui-bg border border-ui-input rounded-xl text-ui-ink font-medium focus:outline-none focus:border-ui-primary transition-all resize-none text-sm"
                        />
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => removeFaq(faq.id)}
                    disabled={isViewer}
                    aria-label={`Delete question ${index + 1}`}
                    className="mt-4 p-2.5 min-w-11 min-h-11 flex items-center justify-center text-ui-input hover:text-ui-danger hover:bg-red-400/10 rounded-xl transition-all disabled:opacity-30"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CatalogAdminContent>
    </>
  );
}

export default function FAQsPage() {
  return (
    <CatalogAdminShell>
      <FAQsPageContent />
    </CatalogAdminShell>
  );
}
