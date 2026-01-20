"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ChevronRight, Moon, Sun, Info } from 'lucide-react';
import type { Language, CatalogSettingsData } from '@/types';
import { DynamicLanguageSelectionPage } from '@/views/DynamicLanguageSelectionPage';
import { cn } from '@/utils/helpers';

interface CategoryData {
  id: string;
  name_ar: string;
  name_en: string;
  name_fr: string;
  image_url: string | null;
  icon_name: string;
}

interface CatalogCategoriesClientProps {
  slug: string;
  catalogName: string;
  logoUrl: string | null;
  categories: CategoryData[];
  settings: CatalogSettingsData | null;
}

// Parse enabled languages
function parseEnabledLanguages(enabledLangs?: string) {
  const defaultLanguages = [
    { code: 'ar' as Language, label: 'العربية', font: 'font-cairo' },
    { code: 'en' as Language, label: 'English', font: 'font-inter' },
    { code: 'fr' as Language, label: 'Français', font: 'font-inter' },
  ];
  if (!enabledLangs) return defaultLanguages;
  const codes = enabledLangs.split(',').map((s) => s.trim().toLowerCase());
  return defaultLanguages.filter((l) => codes.includes(l.code));
}

export function CatalogCategoriesClient({
  slug,
  catalogName,
  logoUrl,
  categories,
  settings,
}: CatalogCategoriesClientProps) {
  const [lang, setLang] = useState<Language | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isThemeLoaded, setIsThemeLoaded] = useState(false);

  const storagePrefix = `catalog_${slug}_`;
  const colorPrimary = settings?.color_primary || '#fead1d';
  const supportedLanguages = parseEnabledLanguages(settings?.enabled_languages);

  // Load from localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem(`${storagePrefix}theme`);
    if (savedTheme === 'dark') {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    setIsThemeLoaded(true);

    const savedLang = localStorage.getItem(`${storagePrefix}lang`) as Language;
    if (savedLang && supportedLanguages.some((l) => l.code === savedLang)) {
      setLang(savedLang);
    }
  }, [storagePrefix, supportedLanguages]);

  // Save language
  useEffect(() => {
    if (lang) {
      localStorage.setItem(`${storagePrefix}lang`, lang);
    }
  }, [lang, storagePrefix]);

  // Save theme
  useEffect(() => {
    if (isThemeLoaded) {
      if (isDarkMode) {
        document.documentElement.classList.add('dark');
        localStorage.setItem(`${storagePrefix}theme`, 'dark');
      } else {
        document.documentElement.classList.remove('dark');
        localStorage.setItem(`${storagePrefix}theme`, 'light');
      }
    }
  }, [isDarkMode, isThemeLoaded, storagePrefix]);

  // Show language selection if not set
  if (!isThemeLoaded) {
    return (
      <div className="fixed inset-0 bg-white dark:bg-navy-900 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-t-transparent rounded-full animate-spin"
          style={{ borderColor: `${colorPrimary} transparent transparent transparent` }} />
      </div>
    );
  }

  if (!lang) {
    return (
      <DynamicLanguageSelectionPage
        onSelect={setLang}
        languages={supportedLanguages}
        catalogName={catalogName}
        colorPrimary={colorPrimary}
      />
    );
  }

  const dir = lang === 'ar' ? 'rtl' : 'ltr';
  const font = lang === 'ar' ? 'font-cairo' : 'font-inter';

  // Get category name based on language
  const getCategoryName = (cat: CategoryData) => {
    switch (lang) {
      case 'ar': return cat.name_ar;
      case 'fr': return cat.name_fr;
      default: return cat.name_en;
    }
  };

  // Labels
  const labels = {
    menu: lang === 'ar' ? 'القائمة' : lang === 'fr' ? 'Menu' : 'Menu',
    categories: lang === 'ar' ? 'الأقسام' : lang === 'fr' ? 'Catégories' : 'Categories',
    viewItems: lang === 'ar' ? 'عرض العناصر' : lang === 'fr' ? 'Voir les articles' : 'View items',
    noCategories: lang === 'ar' ? 'لا توجد أقسام متاحة' : lang === 'fr' ? 'Aucune catégorie disponible' : 'No categories available yet.',
  };

  return (
    <div className={cn("min-h-screen bg-white dark:bg-navy-900 text-slate-900 dark:text-white", font)} dir={dir}>
      {/* Header */}
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="sticky top-0 z-40 backdrop-blur-xl border-b border-slate-200 dark:border-navy-800 bg-white/80 dark:bg-navy-900/80"
      >
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link
            href={`/c/${slug}`}
            className="p-2 rounded-xl transition-colors bg-slate-100 dark:bg-navy-800 hover:bg-slate-200 dark:hover:bg-navy-700"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>

          {logoUrl && (
            <Image
              src={logoUrl}
              alt={catalogName}
              width={40}
              height={40}
              className="rounded-lg"
            />
          )}

          <div className="flex-1">
            <h1 className="font-bold">{catalogName}</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">{labels.menu}</p>
          </div>

          {/* Dark mode toggle */}
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="p-2 rounded-xl bg-slate-100 dark:bg-navy-800 hover:bg-slate-200 dark:hover:bg-navy-700 transition-colors"
          >
            {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
        </div>
      </motion.header>

      {/* Categories Grid */}
      <main className="px-4 py-8 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <motion.h2
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-2xl font-bold mb-6"
          >
            {labels.categories}
          </motion.h2>

          {categories.length === 0 ? (
            <div className="text-center py-12 text-slate-500 dark:text-slate-400">
              <p>{labels.noCategories}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {categories.map((category, index) => (
                <motion.div
                  key={category.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + index * 0.05 }}
                >
                  <Link
                    href={`/c/${slug}/menu/${category.id}`}
                    className="group relative aspect-[4/3] rounded-2xl overflow-hidden block bg-slate-100 dark:bg-navy-800"
                  >
                    {category.image_url ? (
                      <Image
                        src={category.image_url}
                        alt={getCategoryName(category)}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div
                        className="absolute inset-0"
                        style={{
                          background: `linear-gradient(135deg, ${colorPrimary} 0%, ${settings?.color_secondary || colorPrimary} 100%)`,
                          opacity: 0.3,
                        }}
                      />
                    )}

                    {/* Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                    {/* Content */}
                    <div className="absolute inset-0 flex flex-col justify-end p-4">
                      <h3 className="font-semibold text-white text-lg">{getCategoryName(category)}</h3>
                      <div className="flex items-center gap-1 text-white/70 text-sm mt-1">
                        <span>{labels.viewItems}</span>
                        <ChevronRight className="w-4 h-4" />
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
