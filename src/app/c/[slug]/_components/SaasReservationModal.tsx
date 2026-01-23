"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Calendar,
  Clock,
  Users,
  User,
  Phone,
  MessageSquare,
  CheckCircle,
  Loader2,
  ChevronDown,
} from "lucide-react";
import { clsx } from "clsx";

interface SaasReservationModalProps {
  lang: "ar" | "en" | "fr";
  onClose: () => void;
  colorPrimary?: string;
}

export function SaasReservationModal({
  lang,
  onClose,
  colorPrimary = "#8b5cf6", // Default primary
}: SaasReservationModalProps) {
  const [step, setStep] = useState<"form" | "success">("form");
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    date: "",
    time: "",
    guests: "2",
    notes: "",
  });

  const dir = lang === "ar" ? "rtl" : "ltr";
  const isAr = lang === "ar";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));

    setLoading(false);
    setStep("success");
  };

  const labels = {
    title: { ar: "حجز طاولة", en: "Book a Table", fr: "Réserver une Table" },
    name: { ar: "الاسم الكامل", en: "Full Name", fr: "Nom Complet" },
    phone: { ar: "رقم الهاتف", en: "Phone Number", fr: "Numéro de Téléphone" },
    date: { ar: "التاريخ", en: "Date", fr: "Date" },
    time: { ar: "الوقت", en: "Time", fr: "Heure" },
    guests: { ar: "عدد الضيوف", en: "Guests", fr: "Invités" },
    notes: { ar: "ملاحظات", en: "Notes", fr: "Notes" },
    confirm: { ar: "تأكيد الحجز", en: "Confirm Booking", fr: "Confirmer" },
    successTitle: {
      ar: "تم استلام طلبك!",
      en: "Request Received!",
      fr: "Demande Reçue!",
    },
    successMsg: {
      ar: "سنقوم بالتواصل معك قريباً لتأكيد الحجز.",
      en: "We will contact you shortly to confirm your reservation.",
      fr: "Nous vous contacterons bientôt pour confirmer votre réservation.",
    },
    close: { ar: "إغلاق", en: "Close", fr: "Fermer" },
  };

  const timeOptions = [
    "12:00 PM",
    "12:30 PM",
    "1:00 PM",
    "1:30 PM",
    "2:00 PM",
    "2:30 PM",
    "3:00 PM",
    "3:30 PM",
    "4:00 PM",
    "4:30 PM",
    "5:00 PM",
    "5:30 PM",
    "6:00 PM",
    "6:30 PM",
    "7:00 PM",
    "7:30 PM",
    "8:00 PM",
    "8:30 PM",
    "9:00 PM",
    "9:30 PM",
    "10:00 PM",
    "10:30 PM",
    "11:00 PM",
  ];

  return (
    <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center pointer-events-none">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm pointer-events-auto"
      />

      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="relative w-full max-w-lg rounded-t-[2.5rem] sm:rounded-[2.5rem] overflow-hidden shadow-2xl pointer-events-auto max-h-[90vh] flex flex-col pointer-events-auto"
        style={{ backgroundColor: 'var(--surface)' }}
        dir={dir}
      >
        <div className="p-6 border-b flex justify-between items-center" style={{ backgroundColor: 'var(--surface)', borderColor: 'rgba(var(--pattern-rgb), 0.08)' }}>
          <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
            {labels.title[lang]}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full transition-colors"
            style={{ backgroundColor: 'rgba(var(--pattern-rgb), 0.05)' }}
          >
            <X size={20} className="text-[var(--text-primary)]" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <AnimatePresence mode="wait">
            {step === "form" ? (
              <motion.form
                key="form"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                onSubmit={handleSubmit}
                className="space-y-6"
              >
                {/* Name & Phone */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
                      {labels.name[lang]} <span className="text-purple-500">*</span>
                    </label>
                    <div className="relative">
                      <User className="absolute top-1/2 -translate-y-1/2 left-3 w-5 h-5 opacity-40" />
                      <input
                        required
                        type="text"
                        value={formData.name}
                        onChange={(e) =>
                          setFormData({ ...formData, name: e.target.value })
                        }
                        className="w-full pl-10 pr-4 py-3 bg-transparent border rounded-xl focus:ring-2 focus:ring-opacity-50 transition-all outline-none"
                        style={{
                          backgroundColor: 'rgba(var(--pattern-rgb), 0.03)',
                          borderColor: 'rgba(var(--pattern-rgb), 0.08)',
                          color: 'var(--text-primary)',
                          // @ts-ignore
                          "--tw-ring-color": colorPrimary,
                        }}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
                      {labels.phone[lang]} <span className="text-purple-500">*</span>
                    </label>
                    <div className="relative">
                      <Phone className="absolute top-1/2 -translate-y-1/2 left-3 w-5 h-5 opacity-40" />
                      <input
                        required
                        type="tel"
                        value={formData.phone}
                        onChange={(e) =>
                          setFormData({ ...formData, phone: e.target.value })
                        }
                        className="w-full pl-10 pr-4 py-3 bg-transparent border rounded-xl focus:ring-2 focus:ring-opacity-50 transition-all outline-none"
                        style={{
                          backgroundColor: 'rgba(var(--pattern-rgb), 0.03)',
                          borderColor: 'rgba(var(--pattern-rgb), 0.08)',
                          color: 'var(--text-primary)',
                          // @ts-ignore
                          "--tw-ring-color": colorPrimary,
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Date & Time */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
                      {labels.date[lang]} <span className="text-purple-500">*</span>
                    </label>
                    <div className="relative">
                      <Calendar className="absolute top-1/2 -translate-y-1/2 left-3 w-5 h-5 opacity-40" />
                      <input
                        required
                        type="date"
                        value={formData.date}
                        min={new Date().toISOString().split("T")[0]}
                        onChange={(e) =>
                          setFormData({ ...formData, date: e.target.value })
                        }
                        className="w-full pl-10 pr-4 py-3 bg-transparent border rounded-xl focus:ring-2 focus:ring-opacity-50 transition-all outline-none [color-scheme:dark]"
                        style={{
                          backgroundColor: 'rgba(var(--pattern-rgb), 0.03)',
                          borderColor: 'rgba(var(--pattern-rgb), 0.08)',
                          color: 'var(--text-primary)',
                          // @ts-ignore
                          "--tw-ring-color": colorPrimary,
                        }}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
                      {labels.time[lang]} <span className="text-purple-500">*</span>
                    </label>
                    <div className="relative">
                      <Clock className="absolute top-1/2 -translate-y-1/2 left-3 w-5 h-5 text-slate-400 dark:text-slate-500" />
                      <select
                        required
                        value={formData.time}
                        onChange={(e) =>
                          setFormData({ ...formData, time: e.target.value })
                        }
                        className="w-full pl-10 pr-8 py-3 bg-transparent border rounded-xl focus:ring-2 focus:ring-opacity-50 transition-all outline-none appearance-none"
                        style={{
                          backgroundColor: 'rgba(0,0,0,0.03)',
                          borderColor: 'rgba(255,255,255,0.08)',
                          color: 'var(--text-primary)',
                          // @ts-ignore
                          "--tw-ring-color": colorPrimary,
                        }}
                      >
                        <option value="" className="dark:bg-slate-900">--:--</option>
                        {timeOptions.map((t) => (
                          <option key={t} value={t} className="dark:bg-slate-900">
                            {t}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="absolute top-1/2 -translate-y-1/2 right-3 w-4 h-4 text-slate-400 pointer-events-none" />
                    </div>
                  </div>
                </div>

                {/* Guests */}
                <div className="space-y-2">
                  <label className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
                    {labels.guests[lang]} <span className="text-purple-500">*</span>
                  </label>
                  <div className="relative">
                    <Users className="absolute top-1/2 -translate-y-1/2 left-3 w-5 h-5 opacity-40" />
                    <select
                      required
                      value={formData.guests}
                      onChange={(e) =>
                        setFormData({ ...formData, guests: e.target.value })
                      }
                      className="w-full pl-10 pr-8 py-3 bg-transparent border rounded-xl focus:ring-2 focus:ring-opacity-50 transition-all outline-none appearance-none"
                      style={{
                        backgroundColor: 'rgba(var(--pattern-rgb), 0.03)',
                        borderColor: 'rgba(var(--pattern-rgb), 0.08)',
                        color: 'var(--text-primary)',
                        // @ts-ignore
                        "--tw-ring-color": colorPrimary,
                      }}
                    >
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, "10+"].map((n) => (
                        <option key={n} value={n} className="bg-[var(--surface)] text-[var(--text-primary)]">
                          {n} {lang === "ar" ? "أشخاص" : "People"}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute top-1/2 -translate-y-1/2 right-3 w-4 h-4 opacity-40 pointer-events-none" />
                  </div>
                </div>

                {/* Notes */}
                <div className="space-y-2">
                  <label className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
                    {labels.notes[lang]}
                  </label>
                  <div className="relative">
                    <MessageSquare className="absolute top-3 left-3 w-5 h-5 opacity-40" />
                    <textarea
                      rows={3}
                      value={formData.notes}
                      onChange={(e) =>
                        setFormData({ ...formData, notes: e.target.value })
                      }
                      className="w-full pl-10 pr-4 py-3 bg-transparent border rounded-xl focus:ring-2 focus:ring-opacity-50 transition-all outline-none resize-none"
                      style={{
                        backgroundColor: 'rgba(var(--pattern-rgb), 0.03)',
                        borderColor: 'rgba(var(--pattern-rgb), 0.08)',
                        color: 'var(--text-primary)',
                        // @ts-ignore
                        "--tw-ring-color": colorPrimary,
                      }}
                    />
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 text-white rounded-xl font-bold text-lg shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                  style={{
                    backgroundColor: colorPrimary,
                    boxShadow: `0 10px 20px -10px ${colorPrimary}`,
                  }}
                >
                  {loading ? (
                    <Loader2 className="w-6 h-6 animate-spin" />
                  ) : (
                    labels.confirm[lang]
                  )}
                </button>
              </motion.form>
            ) : (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center justify-center py-12 text-center"
              >
                <div
                  className="w-20 h-20 rounded-full flex items-center justify-center mb-6"
                  style={{ backgroundColor: `${colorPrimary}20` }}
                >
                  <CheckCircle
                    className="w-10 h-10"
                    style={{ color: colorPrimary }}
                  />
                </div>
                <h3 className="text-2xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
                  {labels.successTitle[lang]}
                </h3>
                <p className="text-sm mb-8 max-w-xs mx-auto" style={{ color: 'var(--text-muted)' }}>
                  {labels.successMsg[lang]}
                </p>
                <button
                  onClick={onClose}
                  className="px-8 py-3 rounded-xl font-bold transition-colors border"
                  style={{ backgroundColor: 'rgba(var(--pattern-rgb), 0.05)', borderColor: 'rgba(var(--pattern-rgb), 0.1)', color: 'var(--text-primary)' }}
                >
                  {labels.close[lang]}
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
