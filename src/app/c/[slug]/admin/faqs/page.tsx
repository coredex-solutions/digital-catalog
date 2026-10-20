"use client";

import { useEffect, useState } from "react";
import { CatalogAdminShell, useCatalogAdmin } from "../_components/CatalogAdminShell";
import { CatalogAdminHeader, CatalogAdminContent } from "../_components/CatalogAdminSidebar";
import { ADMIN_NAV_LABELS } from "../_components/adminNav";
import { useAdminLang, useCopy, useFormat } from "../_lib/i18n";
import {
  Save,
  Loader2,
  Plus,
  Trash2,
  MessageCircle,
} from "lucide-react";

interface FAQ {
  id: string;
  question_ar: string;
  question_en: string;
  answer_ar: string;
  answer_en: string;
  display_order: number;
}

const en = {
  addQuestion: "Add a question",
  saving: "Saving…",
  save: "Save changes",
  saved: "Questions saved.",
  saveFailed: "Couldn't save the questions. Please try again.",
  emptyTitle: "No questions yet",
  emptyBody: "Add common questions and their answers to help your guests in the chat.",
  addFirst: "Add your first question",
  arabic: "Arabic",
  english: "English",
  questionAr: "Question in Arabic",
  answerAr: "Answer in Arabic",
  questionEn: "Question in English",
  answerEn: "Answer in English",
  questionLabel: (n: string, language: string) => `Question ${n} in ${language}`,
  answerLabel: (n: string, language: string) => `Answer ${n} in ${language}`,
  deleteLabel: (n: string) => `Delete question ${n}`,
};
const ar: typeof en = {
  addQuestion: "أضف سؤالاً",
  saving: "جارٍ الحفظ…",
  save: "حفظ التعديلات",
  saved: "تم حفظ الأسئلة.",
  saveFailed: "تعذّر حفظ الأسئلة. يُرجى المحاولة مرة أخرى.",
  emptyTitle: "لا توجد أسئلة بعد",
  emptyBody: "أضف الأسئلة المتكررة وأجوبتها لمساعدة زبائنك في المحادثة.",
  addFirst: "أضف أول سؤال",
  arabic: "العربية",
  english: "الإنجليزية",
  questionAr: "السؤال بالعربية",
  answerAr: "الجواب بالعربية",
  questionEn: "السؤال بالإنجليزية",
  answerEn: "الجواب بالإنجليزية",
  questionLabel: (n, language) => `السؤال ${n} باللغة ${language}`,
  answerLabel: (n, language) => `الجواب ${n} باللغة ${language}`,
  deleteLabel: (n) => `حذف السؤال ${n}`,
};

function FAQsPageContent() {
  const { slug, user, fetchWithAuth } = useCatalogAdmin();
  const isViewer = user?.role === 'viewer';
  const lang = useAdminLang();
  const t = useCopy({ en, ar });
  const f = useFormat();

  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  useEffect(() => {
    const fetchFaqs = async () => {
      try {
        const res = await fetchWithAuth(`/api/c/${slug}/admin/faqs/`);

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

    fetchFaqs();
  }, [slug, fetchWithAuth]);

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);

    try {
      const res = await fetchWithAuth(`/api/c/${slug}/admin/faqs/`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ faqs }),
      });

      if (res.ok) {
        setMessage({ type: "success", text: t.saved });
      } else {
        // e.g. "Question 3 needs a question and an answer…" (already in the dashboard language)
        const data = await res.json().catch(() => null);
        setMessage({ type: "error", text: data?.error || t.saveFailed });
      }
    } catch {
      setMessage({ type: "error", text: t.saveFailed });
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
      <CatalogAdminHeader title={ADMIN_NAV_LABELS[lang].faqs}>
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={addFaq}
            disabled={isViewer}
            className="flex items-center gap-2 min-h-11 px-6 py-2.5 bg-ui-subtle text-ui-muted border border-ui-line rounded-xl text-xs font-semibold hover:text-ui-ink hover:border-ui-input transition-all disabled:opacity-30 self-center"
          >
            <Plus className="w-4 h-4" aria-hidden />
            {t.addQuestion}
          </button>
          <button
            onClick={handleSave}
            disabled={saving || loading || isViewer}
            className="group relative flex items-center gap-2 px-5 sm:px-8 py-3 bg-ui-primary text-ui-primary-fg rounded-control transition-all duration-500 font-semibold text-xs overflow-hidden shadow-lg disabled:opacity-50"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" aria-hidden />
                {t.saving}
              </>
            ) : (
              <>
                <Save className="w-4 h-4" aria-hidden />
                {t.save}
              </>
            )}
          </button>
        </div>
      </CatalogAdminHeader>

      <CatalogAdminContent>
        {message && (
          <div
            role={message.type === "error" ? "alert" : "status"}
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
            <Loader2 className="w-8 h-8 animate-spin text-ui-primary" aria-hidden />
          </div>
        ) : faqs.length === 0 ? (
          <div className="text-center py-20 glass rounded-panel border border-ui-line">
            <MessageCircle className="w-16 h-16 text-ui-line mx-auto mb-6" aria-hidden />
            <h3 className="text-xl font-bold text-ui-heading mb-2">{t.emptyTitle}</h3>
            <p className="text-ui-muted mb-6">
              {t.emptyBody}
            </p>
            <button
              onClick={addFaq}
              disabled={isViewer}
              className="px-5 sm:px-8 py-4 bg-ui-primary text-ui-primary-fg rounded-control font-semibold text-xs shadow-lg transition-all disabled:opacity-30"
            >
              {t.addFirst}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {faqs.map((faq, index) => {
              const n = f.number(index + 1);
              return (
              <div
                key={faq.id}
                className="glass rounded-panel p-5 sm:p-8 border border-ui-line hover:border-ui-input transition-all group relative overflow-hidden"
              >
                <div className="absolute top-0 end-0 w-32 h-32 bg-ui-subtle rounded-full -translate-y-1/2 translate-x-1/2 rtl:-translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity" aria-hidden />

                <div className="flex items-start gap-3 sm:gap-6 relative z-10">

                  <div className="flex-1 min-w-0 space-y-6 sm:space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
                      {/* Arabic */}
                      <div className="space-y-4">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <span className="text-xs font-semibold text-ui-muted">{t.arabic}</span>
                          <span className="text-xs font-semibold px-2 py-0.5 rounded bg-ui-subtle text-ui-primary border border-ui-line" aria-hidden>AR</span>
                        </div>
                        <input
                          type="text"
                          placeholder={t.questionAr}
                          aria-label={t.questionLabel(n, t.arabic)}
                          value={faq.question_ar}
                          onChange={(e) => updateFaq(faq.id, "question_ar", e.target.value)}
                          className="w-full px-5 py-3.5 bg-ui-bg border border-ui-input rounded-xl text-ui-ink font-semibold text-start focus:outline-none focus:border-ui-primary transition-all text-sm"
                          dir="rtl"
                          lang="ar"
                        />
                        <textarea
                          rows={2}
                          placeholder={t.answerAr}
                          aria-label={t.answerLabel(n, t.arabic)}
                          value={faq.answer_ar}
                          onChange={(e) => updateFaq(faq.id, "answer_ar", e.target.value)}
                          className="w-full px-5 py-3.5 bg-ui-bg border border-ui-input rounded-xl text-ui-ink font-medium text-start focus:outline-none focus:border-ui-primary transition-all resize-none text-sm"
                          dir="rtl"
                          lang="ar"
                        />
                      </div>

                      {/* English */}
                      <div className="space-y-4">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <span className="text-xs font-semibold text-ui-muted">{t.english}</span>
                          <span className="text-xs font-semibold px-2 py-0.5 rounded bg-ui-subtle text-ui-primary border border-ui-line" aria-hidden>EN</span>
                        </div>
                        <input
                          type="text"
                          placeholder={t.questionEn}
                          aria-label={t.questionLabel(n, t.english)}
                          value={faq.question_en}
                          onChange={(e) => updateFaq(faq.id, "question_en", e.target.value)}
                          className="w-full px-5 py-3.5 bg-ui-bg border border-ui-input rounded-xl text-ui-ink font-semibold text-start focus:outline-none focus:border-ui-primary transition-all text-sm"
                          dir="ltr"
                          lang="en"
                        />
                        <textarea
                          rows={2}
                          placeholder={t.answerEn}
                          aria-label={t.answerLabel(n, t.english)}
                          value={faq.answer_en}
                          onChange={(e) => updateFaq(faq.id, "answer_en", e.target.value)}
                          className="w-full px-5 py-3.5 bg-ui-bg border border-ui-input rounded-xl text-ui-ink font-medium text-start focus:outline-none focus:border-ui-primary transition-all resize-none text-sm"
                          dir="ltr"
                          lang="en"
                        />
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => removeFaq(faq.id)}
                    disabled={isViewer}
                    aria-label={t.deleteLabel(n)}
                    className="mt-4 p-2.5 min-w-11 min-h-11 flex items-center justify-center text-ui-input hover:text-ui-danger hover:bg-red-400/10 rounded-xl transition-all disabled:opacity-30"
                  >
                    <Trash2 className="w-5 h-5" aria-hidden />
                  </button>
                </div>
              </div>
              );
            })}
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
