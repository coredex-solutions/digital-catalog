"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import type { Language, LocalizedString } from "../types";
import { cn } from "../utils/helpers";

interface DynamicHomePageProps {
  lang: Language;
  onReservation: () => void;
  // Dynamic data props
  logoUrl: string;
  name: LocalizedString;
  backgroundImage?: string | null;
  backgroundPattern?: string; // e.g., 'wood-pattern-dense', 'geometric', etc.
  baseUrl?: string; // For navigation (e.g., '/c/slug' or '')
  // CTA labels
  ctaMenuLabel?: LocalizedString;
  ctaBookingLabel?: LocalizedString;
  // Feature flags
  bookingEnabled?: boolean;
  // Theme colors (optional - uses CSS variables if not provided)
  colorPrimary?: string;
  colorSecondary?: string;
}

export function DynamicHomePage({
  lang,
  onReservation,
  logoUrl,
  name,
  backgroundImage,
  backgroundPattern = "wood-pattern-dense",
  baseUrl = "",
  ctaMenuLabel = { ar: "عرض القائمة", en: "View Menu", fr: "Voir le Menu" },
  ctaBookingLabel = { ar: "حجز طاولة", en: "Make Reservation", fr: "Réserver" },
  bookingEnabled = true,
  colorPrimary,
  colorSecondary,
}: DynamicHomePageProps) {
  const router = useRouter();
  const dir = lang === "ar" ? "rtl" : "ltr";
  const font = lang === "ar" ? "font-cairo" : "font-inter";

  // Determine pattern class
  const patternClass =
    backgroundPattern === "wood-pattern-dense"
      ? "bg-wood-pattern-dense"
      : backgroundPattern === "wood-pattern"
      ? "bg-wood-pattern"
      : backgroundPattern === "wood-pattern-light"
      ? "bg-wood-pattern-light"
      : "";

  // Dynamic style for primary/secondary colors
  const buttonPrimaryStyle = colorPrimary
    ? { backgroundColor: colorPrimary }
    : {};
  const buttonSecondaryStyle = colorSecondary
    ? { borderColor: colorSecondary, color: colorSecondary }
    : {};

  return (
    <div
      className={cn(
        "fixed inset-0 bg-white dark:bg-navy-900 text-slate-900 dark:text-white overflow-hidden",
        patternClass,
        font,
        dir === "rtl" ? "rtl" : "ltr"
      )}
      dir={dir}
    >
      {/* Background Image with Overlay */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-white/80 dark:bg-navy-950/80 z-10 backdrop-blur-[2px]" />
        <div
          className={cn(
            "absolute inset-0 z-[5] opacity-20 pointer-events-none mix-blend-multiply dark:mix-blend-overlay",
            patternClass
          )}
        />
        {backgroundImage && (
          <img
            src={backgroundImage}
            alt={name[lang]}
            className="w-full h-full object-cover opacity-20 dark:opacity-10 grayscale"
          />
        )}
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
                src={logoUrl}
                alt={`${name[lang]} Logo`}
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
                {name[lang]}
              </motion.h1>
              <motion.div
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: "100%" }}
                transition={{ delay: 0.4, duration: 0.8 }}
                className="h-1 bg-gradient-to-r from-transparent via-orange-500 to-transparent mx-auto max-w-xs rounded-full"
                style={
                  colorPrimary
                    ? {
                        background: `linear-gradient(to right, transparent, ${colorPrimary}, transparent)`,
                      }
                    : undefined
                }
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
              onClick={() => router.push(`${baseUrl}/categories`)}
              className={cn(
                "px-8 py-4 bg-white/50 dark:bg-navy-800/50 backdrop-blur-md border border-slate-200 dark:border-navy-700 rounded-full text-lg font-bold text-slate-800 dark:text-slate-200",
                "hover:bg-purple-500 hover:text-white hover:border-purple-500 transition-all duration-300",
                "shadow-xl shadow-purple-500/10 min-w-[200px]"
              )}
              style={buttonSecondaryStyle}
            >
              {ctaMenuLabel[lang]}
            </motion.button>

            {bookingEnabled && (
              <motion.button
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={onReservation}
                className={cn(
                  "px-8 py-4 bg-orange-500 text-white rounded-full text-lg font-bold",
                  "hover:bg-orange-600 transition-all duration-300",
                  "shadow-xl shadow-orange-500/30 min-w-[200px]"
                )}
                style={buttonPrimaryStyle}
              >
                {ctaBookingLabel[lang]}
              </motion.button>
            )}
          </motion.div>
        </motion.div>
      </div>

      {/* Decorative Elements */}
      <div
        className="absolute top-20 left-20 w-64 h-64 bg-orange-500/5 rounded-full blur-3xl mix-blend-multiply dark:mix-blend-screen pointer-events-none"
        style={colorPrimary ? { backgroundColor: `${colorPrimary}10` } : {}}
      />
      <div
        className="absolute bottom-20 right-20 w-80 h-80 bg-purple-500/5 rounded-full blur-3xl mix-blend-multiply dark:mix-blend-screen pointer-events-none"
        style={
          colorSecondary ? { backgroundColor: `${colorSecondary}10` } : {}
        }
      />
    </div>
  );
}
