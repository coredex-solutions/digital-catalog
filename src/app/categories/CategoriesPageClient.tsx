"use client";

import { useApp } from "../../providers/AppProvider";
import { Suspense, lazy } from "react";
import {
  Navbar,
  CategoryGrid,
  Footer,
  InfoModal,
  FloatingReservationButton,
  ReservationModal,
} from "../../App";
import { cn } from "../../utils/helpers";
import { useNextRouter } from "../../hooks/useNextRouter";
import { AnimatePresence } from "framer-motion";
import { Utensils, Coffee } from "lucide-react";
import { motion } from "framer-motion";

// Lazy load components
const ChatComponent = lazy(() =>
  import("../../components/LiveChat").then((module) => ({
    default: module.LiveChat,
  }))
);

interface Category {
  id: string;
  name_ar: string;
  name_en: string;
  name_fr: string;
  image_url: string | null;
  icon_name: string;
  display_order: number;
}

interface CategoriesPageClientProps {
  categories: Category[];
  operatingHours?: Array<{
    day_name: string;
    open_hour: number;
    close_hour: number;
    is_closed: boolean;
  }>;
  socialMedia?: Array<{
    id: string;
    platform: string;
    url: string;
  }>;
  settings?: any;
  faqs?: Array<{
    id: string;
    question_ar: string;
    question_en: string;
    question_fr: string;
    answer_ar: string;
    answer_en: string;
    answer_fr: string;
  }>;
}

// Map icon names to components
const iconMap: Record<string, any> = {
  Utensils,
  Coffee,
};

export function CategoriesPageClient({
  categories,
  operatingHours = [],
  socialMedia = [],
  settings = null,
  faqs = [],
}: CategoriesPageClientProps) {
  const {
    lang,
    setSearchQuery,
    setLang,
    isDarkMode,
    setIsDarkMode,
    setIsInfoOpen,
    isInfoOpen,
    isFirstLoad,
    isReservationOpen,
    setIsReservationOpen,
  } = useApp();
  const { navigate } = useNextRouter();

  if (!lang) {
    return null;
  }

  const dir = lang === "ar" ? "rtl" : "ltr";
  const font = lang === "ar" ? "font-cairo" : "font-inter";

  // Transform categories to match expected format
  const transformedCategories = categories.map((cat) => ({
    id: cat.id,
    ar: cat.name_ar,
    en: cat.name_en,
    fr: cat.name_fr,
    icon: iconMap[cat.icon_name] || Utensils,
    image_url: cat.image_url,
  }));

  return (
    <div
      className={cn(
        "min-h-screen bg-white dark:bg-navy-900 text-slate-900 dark:text-slate-100 transition-colors duration-300 relative bg-wood-pattern",
        font,
        dir === "rtl" ? "rtl" : "ltr"
      )}
      dir={dir}
    >
      <Navbar
        lang={lang}
        onSearch={setSearchQuery}
        onLanguageChange={setLang}
        onOpenInfo={() => setIsInfoOpen(true)}
        isDark={isDarkMode}
        toggleTheme={() => setIsDarkMode(!isDarkMode)}
        showHomeButton={true}
        onNavigateHome={() => navigate("/")}
      />
      <main className="pt-20 pb-24 px-4 max-w-md mx-auto md:max-w-2xl lg:max-w-4xl relative z-10">
        <CategoryGrid
          categories={transformedCategories}
          lang={lang}
          isFirstLoad={isFirstLoad}
          onSelect={(id: string) => {
            navigate(`/menu/${id}`);
          }}
        />
      </main>
      <Footer
        lang={lang}
        settings={settings}
        operatingHours={operatingHours}
        socialMedia={socialMedia}
      />
      <FloatingReservationButton
        lang={lang}
        onReservation={() => setIsReservationOpen(true)}
        isCartOpen={false}
        isCheckoutOpen={false}
      />
      <Suspense fallback={null}>
        <ChatComponent lang={lang} settings={settings} faqs={faqs} />
      </Suspense>
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
      {isReservationOpen && (
        <ReservationModal
          lang={lang}
          onClose={() => setIsReservationOpen(false)}
          settings={settings}
        />
      )}
    </div>
  );
}
