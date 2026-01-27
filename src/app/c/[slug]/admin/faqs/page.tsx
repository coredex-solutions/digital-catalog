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
  question_fr: string;
  answer_ar: string;
  answer_en: string;
  answer_fr: string;
  display_order: number;
}

export default function FAQsPage() {
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
            disabled={isViewer}
            className="flex items-center gap-2 px-6 py-2.5 bg-white/5 text-white/50 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest hover:text-white hover:border-white/20 transition-all disabled:opacity-30 self-center"
          >
            <Plus className="w-4 h-4" />
            Add Question
          </button>
          <button
            onClick={handleSave}
            disabled={saving || loading || isViewer}
            className="group relative flex items-center gap-2 px-8 py-3 bg-primary text-white rounded-2xl hover:shadow-[0_0_30px_rgba(124,58,237,0.4)] transition-all duration-500 font-black text-[11px] uppercase tracking-widest overflow-hidden shadow-lg shadow-primary/10 disabled:opacity-50"
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
              ? "bg-green-500/10 text-green-400 border border-green-500/20"
              : "bg-purple-500/10 text-purple-400 border border-purple-500/20"
              }`}
          >
            {message.text}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : faqs.length === 0 ? (
          <div className="text-center py-20 glass rounded-[3rem] border border-white/5">
            <MessageCircle className="w-16 h-16 text-white/5 mx-auto mb-6" />
            <h3 className="text-xl font-bold text-white mb-2">No FAQs Yet</h3>
            <p className="text-slate-400 mb-6">
              Add frequently asked questions to help your customers in the live chat.
            </p>
            <button
              onClick={addFaq}
              disabled={isViewer}
              className="px-8 py-4 bg-primary text-white rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] shadow-lg shadow-primary/20 hover:scale-[1.05] transition-all disabled:opacity-30"
            >
              Add Your First Question
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {faqs.map((faq, index) => (
              <div
                key={faq.id}
                className="glass rounded-[2rem] p-8 border border-white/5 hover:border-white/10 transition-all group relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-[60px] rounded-full -translate-y-1/2 translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity" />

                <div className="flex items-start gap-6 relative z-10">
                  <div className="mt-4 cursor-grab active:cursor-grabbing text-white/10 group-hover:text-white/30 transition-colors">
                    <GripVertical className="w-5 h-5" />
                  </div>

                  <div className="flex-1 space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                      {/* Arabic */}
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">Arabic Content</label>
                          <span className="text-[9px] font-black px-2 py-0.5 rounded bg-white/5 text-primary border border-white/5 uppercase tracking-widest">AR</span>
                        </div>
                        <input
                          type="text"
                          placeholder="Question in Arabic"
                          value={faq.question_ar}
                          onChange={(e) => updateFaq(faq.id, "question_ar", e.target.value)}
                          className="w-full px-5 py-3.5 bg-white/[0.03] border border-white/5 rounded-xl text-white font-black tracking-tight text-right focus:outline-none focus:border-primary/50 transition-all text-sm"
                          dir="rtl"
                        />
                        <textarea
                          rows={2}
                          placeholder="Answer in Arabic"
                          value={faq.answer_ar}
                          onChange={(e) => updateFaq(faq.id, "answer_ar", e.target.value)}
                          className="w-full px-5 py-3.5 bg-white/[0.03] border border-white/5 rounded-xl text-white font-medium text-right focus:outline-none focus:border-primary/50 transition-all resize-none text-sm"
                          dir="rtl"
                        />
                      </div>

                      {/* English */}
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">English Content</label>
                          <span className="text-[9px] font-black px-2 py-0.5 rounded bg-white/5 text-primary border border-white/5 uppercase tracking-widest">EN</span>
                        </div>
                        <input
                          type="text"
                          placeholder="Question in English"
                          value={faq.question_en}
                          onChange={(e) => updateFaq(faq.id, "question_en", e.target.value)}
                          className="w-full px-5 py-3.5 bg-white/[0.03] border border-white/5 rounded-xl text-white font-black tracking-tight focus:outline-none focus:border-primary/50 transition-all text-sm"
                        />
                        <textarea
                          rows={2}
                          placeholder="Answer in English"
                          value={faq.answer_en}
                          onChange={(e) => updateFaq(faq.id, "answer_en", e.target.value)}
                          className="w-full px-5 py-3.5 bg-white/[0.03] border border-white/5 rounded-xl text-white font-medium focus:outline-none focus:border-primary/50 transition-all resize-none text-sm"
                        />
                      </div>

                      {/* French */}
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">French Content</label>
                          <span className="text-[9px] font-black px-2 py-0.5 rounded bg-white/5 text-primary border border-white/5 uppercase tracking-widest">FR</span>
                        </div>
                        <input
                          type="text"
                          placeholder="Question in French"
                          value={faq.question_fr}
                          onChange={(e) => updateFaq(faq.id, "question_fr", e.target.value)}
                          className="w-full px-5 py-3.5 bg-white/[0.03] border border-white/5 rounded-xl text-white font-black tracking-tight focus:outline-none focus:border-primary/50 transition-all text-sm"
                        />
                        <textarea
                          rows={2}
                          placeholder="Answer in French"
                          value={faq.answer_fr}
                          onChange={(e) => updateFaq(faq.id, "answer_fr", e.target.value)}
                          className="w-full px-5 py-3.5 bg-white/[0.03] border border-white/5 rounded-xl text-white font-medium focus:outline-none focus:border-primary/50 transition-all resize-none text-sm"
                        />
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => removeFaq(faq.id)}
                    disabled={isViewer}
                    className="mt-4 p-2.5 text-white/10 hover:text-red-400 hover:bg-red-400/10 rounded-xl transition-all disabled:opacity-30"
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
