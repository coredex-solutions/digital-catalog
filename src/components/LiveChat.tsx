import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, X, ChevronRight, MessageSquare } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { RESTAURANT_CONFIG } from "../config/restaurant";

// Utility function for className merging
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type Language = "ar" | "en" | "fr";

interface Message {
  id: string;
  text: string;
  sender: "user" | "bot";
  timestamp: Date;
}

interface FAQ {
  id: string;
  question_ar: string;
  question_en: string;
  question_fr: string;
  answer_ar: string;
  answer_en: string;
  answer_fr: string;
}

const FAQS: FAQ[] = [
  {
    id: "hours",
    question_ar: "ما هي ساعات العمل؟",
    question_en: "What are your opening hours?",
    question_fr: "Quelles sont vos heures d'ouverture?",
    answer_ar: "نحن نعمل يومياً من الساعة 10:00 صباحاً حتى 11:00 مساءً.",
    answer_en: "We are open daily from 10:00 AM to 11:00 PM.",
    answer_fr: "Nous sommes ouverts tous les jours de 10h00 à 23h00.",
  },
  {
    id: "location",
    question_ar: "أين يقع المطعم؟",
    question_en: "Where is the restaurant located?",
    question_fr: "Où se trouve le restaurant?",
    answer_ar:
      "الفرع الرئيسي: بغداد -زيونة -شارع الخدمي. لدينا فروع أخرى أيضاً.",
    answer_en:
      "Main Branch: Baghdad - Zayouna - Service Street. We have other branches too.",
    answer_fr:
      "Branche principale : Bagdad - Zayouna - Rue Service. Nous avons d'autres branches aussi.",
  },
  {
    id: "reservation",
    question_ar: "كيف يمكنني الحجز؟",
    question_en: "How can I book a table?",
    question_fr: "Comment puis-je réserver?",
    answer_ar: 'يمكنك الحجز مباشرة من خلال زر "حجز طاولة" في الصفحة الرئيسية.',
    answer_en:
      'You can book directly through the "Book a Table" button on the home page.',
    answer_fr:
      'Vous pouvez réserver directement via le bouton "Réserver" sur la page d\'accueil.',
  },
  {
    id: "delivery",
    question_ar: "هل لديكم توصيل؟",
    question_en: "Do you have delivery?",
    question_fr: "Avez-vous la livraison?",
    answer_ar:
      "نعم، نقوم بالتوصيل! يمكنك تصفح القائمة وإضافة العناصر إلى السلة.",
    answer_en:
      "Yes, we deliver! You can browse the menu and add items to your cart.",
    answer_fr:
      "Oui, nous livrons ! Vous pouvez parcourir le menu et ajouter des articles à votre panier.",
  },
];

export function LiveChat({
  lang,
  settings,
  faqs,
}: {
  lang: Language;
  settings?: any;
  faqs?: FAQ[];
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const dir = lang === "ar" ? "rtl" : "ltr";
  const font = lang === "ar" ? "font-cairo" : "font-inter";
  const whatsappNumber = settings?.whatsapp || RESTAURANT_CONFIG.whatsapp;

  // Use dynamic FAQs if available, otherwise fallback to static FAQs
  const displayFaqs = faqs && faqs.length > 0 ? faqs : FAQS;

  // Initial greeting
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const greeting = {
        ar: "مرحباً بك في مطعم متبل! كيف يمكنني مساعدتك اليوم؟",
        en: "Welcome to Mtabal! How can I help you today?",
        fr: "Bienvenue chez Mtabal! Comment puis-je vous aider aujourd'hui?",
      };

      setIsTyping(true);
      setTimeout(() => {
        setMessages([
          {
            id: "init",
            text: greeting[lang],
            sender: "bot",
            timestamp: new Date(),
          },
        ]);
        setIsTyping(false);
      }, 1000);
    }
  }, [isOpen, lang]);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const handleFAQClick = (faq: FAQ) => {
    // Add user message
    const userMsg: Message = {
      id: Date.now().toString(),
      text: faq[`question_${lang}`],
      sender: "user",
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);

    // Simulate typing
    setIsTyping(true);
    setTimeout(() => {
      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        text: faq[`answer_${lang}`],
        sender: "bot",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, botMsg]);
      setIsTyping(false);
    }, 1500);
  };

  return (
    <>
      {/* Floating Trigger Button */}
      <div className="fixed bottom-8 right-6 z-[60]">
        <AnimatePresence>
          {!isOpen && (
            <motion.button
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsOpen(true)}
              className="w-14 h-14 bg-gradient-to-tr from-purple-600 to-purple-400 hover:from-purple-500 hover:to-purple-300 text-white rounded-full shadow-xl shadow-purple-500/30 flex items-center justify-center transition-all group"
            >
              <MessageCircle size={24} strokeWidth={2} />
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.9 }}
            className={cn(
              "fixed bottom-4 right-4 z-[70] w-[calc(100vw-2rem)] sm:w-[380px] max-h-[600px] h-[80vh] sm:h-[600px] bg-white dark:bg-navy-900 rounded-[2rem] shadow-2xl shadow-purple-900/20 border border-slate-100 dark:border-navy-700 flex flex-col overflow-hidden",
              font,
              dir === "rtl" ? "rtl" : "ltr"
            )}
            dir={dir}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-600 to-purple-500 p-4 flex items-center justify-between shrink-0 relative overflow-hidden">
              {/* Decorative Circles */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-10 -mt-10 blur-2xl" />
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full -ml-8 -mb-8 blur-xl" />

              <div className="flex items-center gap-3 relative z-10">
                <div className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white">
                  <MessageSquare
                    size={20}
                    fill="currentColor"
                    className="text-white"
                  />
                </div>
                <div>
                  <h3 className="font-bold text-white text-lg">
                    {lang === "ar" ? "خدمة العملاء" : "Customer Support"}
                  </h3>
                  <p className="text-purple-100 text-xs flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                    {lang === "ar" ? "متصل الآن" : "Online now"}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors relative z-10"
              >
                <X size={20} />
              </button>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50 dark:bg-navy-950/50 scroll-smooth">
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  className={cn(
                    "max-w-[85%] p-3.5 rounded-2xl text-sm leading-relaxed shadow-sm",
                    msg.sender === "user"
                      ? "bg-purple-500 text-white ml-auto rounded-br-none"
                      : "bg-white dark:bg-navy-800 text-slate-700 dark:text-slate-200 mr-auto rounded-bl-none border border-slate-100 dark:border-navy-700"
                  )}
                  style={{
                    alignSelf:
                      msg.sender === "user" ? "flex-end" : "flex-start",
                    marginRight:
                      msg.sender === "user" && dir === "ltr" ? 0 : "auto",
                    marginLeft:
                      msg.sender === "user" && dir === "rtl" ? 0 : "auto",
                    // Fix alignment for RTL/LTR mixed content
                  }}
                >
                  {msg.text}
                </motion.div>
              ))}

              {/* Typing Indicator */}
              {isTyping && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="bg-white dark:bg-navy-800 w-fit p-3 rounded-2xl rounded-bl-none border border-slate-100 dark:border-navy-700 flex gap-1"
                >
                  <span
                    className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"
                    style={{ animationDelay: "0ms" }}
                  />
                  <span
                    className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"
                    style={{ animationDelay: "150ms" }}
                  />
                  <span
                    className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"
                    style={{ animationDelay: "300ms" }}
                  />
                </motion.div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Actions Area (FAQs & WhatsApp) */}
            <div className="p-4 bg-white dark:bg-navy-900 border-t border-slate-100 dark:border-navy-800 shrink-0">
              {/* FAQ Chips */}
              <div className="flex gap-2 overflow-x-auto pb-4 no-scrollbar mask-linear-fade">
                {displayFaqs.map((faq) => (
                  <button
                    key={faq.id}
                    onClick={() => handleFAQClick(faq)}
                    className="whitespace-nowrap px-4 py-2 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 text-xs font-bold rounded-full border border-purple-100 dark:border-purple-900/50 hover:bg-purple-100 dark:hover:bg-purple-900/40 transition-colors flex-shrink-0"
                  >
                    {faq[`question_${lang}`]}
                  </button>
                ))}
              </div>

              {/* Custom Inquiry Button */}
              <a
                href={`https://wa.me/${whatsappNumber}`}
                target="_blank"
                className="w-full py-3.5 bg-[#25D366] hover:bg-[#128C7E] text-white rounded-xl font-bold shadow-lg shadow-green-500/20 transition-all flex items-center justify-center gap-2 group"
              >
                <MessageCircle
                  size={20}
                  className="group-hover:scale-110 transition-transform"
                />
                <span>
                  {lang === "ar"
                    ? "تحدث عبر واتساب"
                    : lang === "fr"
                    ? "Discuter sur WhatsApp"
                    : "Chat on WhatsApp"}
                </span>
                {dir === "rtl" ? (
                  <ChevronRight size={16} className="opacity-60" />
                ) : (
                  <ChevronRight size={16} className="rotate-180 opacity-60" />
                )}
              </a>

              <p className="text-center text-[10px] text-slate-400 mt-3">
                {lang === "ar"
                  ? "نرد عادة خلال دقائق"
                  : "Typically replies in minutes"}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
