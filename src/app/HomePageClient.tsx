"use client";

import { useApp } from "../providers/AppProvider";
import { LanguageSelectionPage } from "../views/LanguageSelectionPage";
import { HomePage } from "../views/HomePage";
import { motion } from "framer-motion";
import { AnimatePresence } from "framer-motion";
import { InfoModal } from "../App";

interface HomePageClientProps {
  settings: any;
  operatingHours: any[];
  socialMedia: any[];
}

export function HomePageClient({
  settings,
  operatingHours,
  socialMedia,
}: HomePageClientProps) {
  const {
    lang,
    setLang,
    setIsReservationOpen,
    areImagesLoading,
    isThemeLoaded,
    isInfoOpen,
    setIsInfoOpen,
  } = useApp();

  // Show loading screen while images and theme are loading
  if (!isThemeLoaded || areImagesLoading) {
    return (
      <div className="fixed inset-0 bg-white dark:bg-navy-900 flex items-center justify-center z-50">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-600 dark:text-slate-400 font-medium">
            Loading...
          </p>
        </motion.div>
      </div>
    );
  }

  // Show language selection if no language is selected
  if (!lang) {
    return <LanguageSelectionPage onSelect={setLang} />;
  }

  return (
    <>
      <HomePage lang={lang} onReservation={() => setIsReservationOpen(true)} />
      <AnimatePresence>
        {isInfoOpen && (
          <InfoModal
            lang={lang}
            onClose={() => setIsInfoOpen(false)}
            settings={settings}
            operatingHours={operatingHours}
            socialMedia={socialMedia}
          />
        )}
      </AnimatePresence>
    </>
  );
}

