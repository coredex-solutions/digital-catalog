"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, X, Send, ChevronRight, ChevronLeft } from "lucide-react";
import { clsx } from "clsx";

interface FAQ {
  id: string;
  question_ar: string;
  question_en: string;
  question_fr: string;
  answer_ar: string;
  answer_en: string;
  answer_fr: string;
}

interface SaasChatWidgetProps {
  catalogSlug: string;
  lang: "ar" | "en" | "fr";
  colorPrimary?: string;
  colorSecondary?: string;
  whatsappNumber?: string;
}

export function SaasChatWidget({
  catalogSlug,
  lang,
  colorPrimary = "#f97316",
  colorSecondary = "#1e293b",
  whatsappNumber,
}: SaasChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [view, setView] = useState<"list" | "detail">("list");
  const [selectedFaq, setSelectedFaq] = useState<FAQ | null>(null);
  const [loading, setLoading] = useState(false);

  const dir = lang === "ar" ? "rtl" : "ltr";
  const isAr = lang === "ar";

  useEffect(() => {
    if (isOpen && faqs.length === 0) {
      fetchFaqs();
    }
  }, [isOpen]);

  const fetchFaqs = async () => {
    setLoading(true);
    try {
      // Fetch public FAQs (endpoints needs to be open or we use a public route)
      // Since default admin route is protected, we might need a public one.
      // For now, assuming we have a public read endpoint or utilizing server action in real app.
      // Simulating fetch or assuming we made the previous route public (checked: it used requireCatalogAdmin)
      // We need a PUBLIC route for fetching FAQs.
      // Let's create a public one or use server prop passing.
      // For MVP, we'll try fetching from a new public route we'll create: /api/c/[slug]/faqs

      const res = await fetch(`/api/c/${catalogSlug}/faqs`);
      if (res.ok) {
        const data = await res.json();
        setFaqs(data.faqs || []);
      }
    } catch (error) {
      console.error("Failed to fetch FAQs", error);
    } finally {
      setLoading(false);
    }
  };

  const labels = {
    title: { ar: "كيف يمكننا مساعدتك؟", en: "How can we help?", fr: "Comment pouvons-nous aider?" },
    chatUs: { ar: "تحدث معنا", en: "Chat with us", fr: "Discutez avec nous" },
    faqs: { ar: "الأسئلة الشائعة", en: "FAQs", fr: "FAQ" },
    back: { ar: "الرجوع", en: "Back", fr: "Retour" },
    startChat: { ar: "ابدأ المحادثة", en: "Start Chat", fr: "Commencer" },
  };

  const handleWhatsappClick = () => {
    if (!whatsappNumber) return;
    const msg = {
      ar: "مرحبا، لدي استفسار",
      en: "Hello, I have a question",
      fr: "Bonjour, j'ai une question",
    };
    window.open(
      `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(msg[lang])}`,
      "_blank"
    );
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end pointer-events-none">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="pointer-events-auto rounded-3xl shadow-2xl mb-4 w-80 sm:w-96 overflow-hidden border"
            style={{ backgroundColor: 'var(--surface)', borderColor: 'rgba(var(--pattern-rgb), 0.08)' }}
            dir={dir}
          >
            {/* Header */}
            <div
              className="p-6 text-white"
              style={{
                background: `linear-gradient(135deg, ${colorPrimary} 0%, ${colorSecondary} 100%)`,
              }}
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-xl mb-1">{labels.title[lang]}</h3>
                  <p className="text-white/80 text-sm">
                    {labels.chatUs[lang]}
                  </p>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 bg-white/20 rounded-full hover:bg-white/30 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="h-96 overflow-y-auto" style={{ backgroundColor: 'rgba(var(--pattern-rgb), 0.03)' }}>
              {view === "list" ? (
                <div className="p-4 space-y-4">
                  {/* WhatsApp Button */}
                  {whatsappNumber && (
                    <button
                      onClick={handleWhatsappClick}
                      className="w-full p-4 rounded-xl shadow-sm border flex items-center gap-4 hover:shadow-md transition-all group"
                      style={{ backgroundColor: 'var(--surface)', borderColor: 'rgba(var(--pattern-rgb), 0.08)' }}
                    >
                      <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center text-green-500 group-hover:bg-green-500 group-hover:text-white transition-colors">
                        <MessageCircle size={20} />
                      </div>
                      <div className="flex-1 text-left rtl:text-right">
                        <h4 className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>WhatsApp</h4>
                        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{labels.startChat[lang]}</p>
                      </div>
                      {isAr ? <ChevronLeft size={16} style={{ color: 'var(--text-muted)' }} /> : <ChevronRight size={16} style={{ color: 'var(--text-muted)' }} />}
                    </button>
                  )}

                  {/* FAQs List */}
                  <div>
                    <h4 className="text-xs font-bold uppercase mb-3 px-2 tracking-wider" style={{ color: 'var(--text-muted)' }}>
                      {labels.faqs[lang]}
                    </h4>

                    {loading ? (
                      <div className="space-y-2 p-2">
                        <div className="h-10 opacity-20 bg-current rounded animate-pulse" />
                        <div className="h-10 opacity-20 bg-current rounded animate-pulse" />
                      </div>
                    ) : faqs.length === 0 ? (
                      <p className="text-center opacity-40 text-sm py-4">
                        No questions available
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {faqs.map((faq) => (
                          <button
                            key={faq.id}
                            //@ts-ignore
                            onClick={() => { setSelectedFaq(faq); setView("detail"); }}
                            className="w-full p-3 rounded-xl border flex items-center justify-between hover:bg-black/5 transition-colors text-left rtl:text-right"
                            style={{ backgroundColor: 'var(--surface)', borderColor: 'rgba(var(--pattern-rgb), 0.08)' }}
                          >
                            <span className="text-sm font-medium line-clamp-1" style={{ color: 'var(--text-primary)' }}>
                              {/* @ts-ignore */}
                              {faq[`question_${lang}`] || faq.question_en}
                            </span>
                            {isAr ? <ChevronLeft size={16} className="flex-shrink-0" style={{ color: 'var(--text-muted)' }} /> : <ChevronRight size={16} className="flex-shrink-0" style={{ color: 'var(--text-muted)' }} />}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col h-full">
                  <div className="p-4 border-b sticky top-0" style={{ backgroundColor: 'var(--surface)', borderColor: 'rgba(var(--pattern-rgb), 0.08)' }}>
                    <button
                      onClick={() => setView("list")}
                      className="text-sm flex items-center gap-1 font-medium transition-colors"
                      style={{ color: 'var(--text-muted)' }}
                      onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text-primary)'}
                      onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
                    >
                      {isAr ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
                      {labels.back[lang]}
                    </button>
                  </div>
                  <div className="p-6">
                    <h4 className="font-bold text-lg mb-4" style={{ color: 'var(--text-primary)' }}>
                      {/* @ts-ignore */}
                      {selectedFaq?.[`question_${lang}`] || selectedFaq?.question_en}
                    </h4>
                    <div className="prose prose-sm dark:prose-invert" style={{ color: 'var(--text-muted)' }}>
                      {/* @ts-ignore */}
                      {selectedFaq?.[`answer_${lang}`] || selectedFaq?.answer_en}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={() => setIsOpen(!isOpen)}
        className="pointer-events-auto w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-110 active:scale-95 z-50"
        style={{
          background: colorPrimary,
          boxShadow: `0 4px 14px 0 ${colorPrimary}60`,
        }}
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
            >
              <X className="text-white w-6 h-6" />
            </motion.div>
          ) : (
            <motion.div
              key="open"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
            >
              <MessageCircle className="text-white w-7 h-7" />
            </motion.div>
          )}
        </AnimatePresence>
      </button>
    </div>
  );
}
