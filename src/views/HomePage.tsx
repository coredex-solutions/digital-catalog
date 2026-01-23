"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import type { Language } from "../types";
import { RESTAURANT_CONFIG } from "../config/restaurant";
import { cn } from "../utils/helpers";

interface HomePageProps {
  lang: Language;
  onReservation: () => void;
}

export function HomePage({ lang, onReservation }: HomePageProps) {
  const router = useRouter();
  const dir = lang === "ar" ? "rtl" : "ltr";
  const font = lang === "ar" ? "font-cairo" : "font-inter";

  return (
    <div
      className={cn(
        "fixed inset-0 bg-white dark:bg-navy-900 text-slate-900 dark:text-white overflow-hidden bg-wood-pattern-dense",
        font,
        dir === "rtl" ? "rtl" : "ltr"
      )}
      dir={dir}
    >
      {/* Background Image with Overlay */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-white/80 dark:bg-navy-950/80 z-10 backdrop-blur-[2px]" />
        <div className="absolute inset-0 z-[5] opacity-20 pointer-events-none bg-wood-pattern-dense mix-blend-multiply dark:mix-blend-overlay" />
        <img
          src={RESTAURANT_CONFIG.image}
          alt={RESTAURANT_CONFIG.name[lang]}
          className="w-full h-full object-cover opacity-20 dark:opacity-10 grayscale"
        />
      </div>

      {/* Content */}
      <div className="relative z-20 h-full flex flex-col items-center justify-center px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="text-center max-w-2xl w-full space-y-12"
        >
          {/* Restaurant Logo & Name */}
          <div className="space-y-6 flex flex-col items-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8 }}
              className="w-48 h-48 md:w-64 md:h-64 relative"
            >
              <img
                src={RESTAURANT_CONFIG.logo}
                alt="Mtabal Logo"
                className="w-full h-full object-contain drop-shadow-[0_0_15px_rgba(254,173,29,0.8)]"
              />
            </motion.div>

            <div className="space-y-4">
              <motion.h1
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2, duration: 0.6 }}
                className={cn(
                  "text-5xl md:text-6xl lg:text-7xl font-bold tracking-wide text-slate-900 dark:text-white",
                  lang === "ar" &&
                    "font-handwriting text-6xl md:text-7xl lg:text-8xl"
                )}
              >
                {RESTAURANT_CONFIG.name[lang]}
              </motion.h1>
              <motion.div
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: "100%" }}
                transition={{ delay: 0.4, duration: 0.8 }}
                className="h-1 bg-gradient-to-r from-transparent via-purple-500 to-transparent mx-auto max-w-xs rounded-full"
              />
            </div>
          </div>

          {/* Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.6 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
          >
            <motion.button
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => router.push("/categories")}
              className={cn(
                "px-8 py-4 bg-white/50 dark:bg-navy-800/50 backdrop-blur-md border border-slate-200 dark:border-navy-700 rounded-full text-lg font-bold text-slate-800 dark:text-slate-200",
                "hover:bg-purple-500 hover:text-white hover:border-purple-500 transition-all duration-300",
                "shadow-xl shadow-purple-500/10 min-w-[200px]"
              )}
            >
              {lang === "ar"
                ? "عرض القائمة"
                : lang === "fr"
                ? "Voir le Menu"
                : "View Menu"}
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              onClick={onReservation}
              className={cn(
                "px-8 py-4 bg-purple-500 text-white rounded-full text-lg font-bold",
                "hover:bg-purple-600 transition-all duration-300",
                "shadow-xl shadow-purple-500/30 min-w-[200px]"
              )}
            >
              {lang === "ar"
                ? "حجز طاولة"
                : lang === "fr"
                ? "Réserver"
                : "Make Reservation"}
            </motion.button>
          </motion.div>
        </motion.div>
      </div>

      {/* Decorative Elements */}
      <div className="absolute top-20 left-20 w-64 h-64 bg-purple-500/5 rounded-full blur-3xl mix-blend-multiply dark:mix-blend-screen pointer-events-none" />
      <div className="absolute bottom-20 right-20 w-80 h-80 bg-purple-500/5 rounded-full blur-3xl mix-blend-multiply dark:mix-blend-screen pointer-events-none" />
    </div>
  );
}
