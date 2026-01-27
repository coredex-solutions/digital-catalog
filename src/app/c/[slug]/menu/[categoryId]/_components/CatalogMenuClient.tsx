"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { ArrowLeft, MessageCircle, Star, Moon, Sun } from 'lucide-react';
import type { Language, CatalogSettingsData, CatalogContactData } from '@/types';
import { DynamicLanguageSelectionPage } from '@/views/DynamicLanguageSelectionPage';
import { cn } from '@/utils/helpers';

interface CategoryData {
  id: string;
  name_ar: string;
  name_en: string;
  name_fr: string;
  image_url: string | null;
}

interface MenuItemData {
  id: string;
  name_ar: string;
  name_en: string;
  name_fr: string;
  description_ar: string | null;
  description_en: string | null;
  description_fr: string | null;
  price: number;
  currency: string;
  image_url: string | null;
  is_featured: boolean;
}

interface CatalogMenuClientProps {
  slug: string;
  catalogName: string;
  logoUrl: string | null;
  category: CategoryData;
  items: MenuItemData[];
  settings: CatalogSettingsData | null;
  contact: CatalogContactData | null;
}

// Format price with currency
function formatPrice(price: number, currency: string = 'USD', lang: Language = 'en'): string {
  const locale = lang === 'ar' ? 'ar-IQ' : lang === 'fr' ? 'fr-FR' : 'en-US';
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(price);
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

export function CatalogMenuClient({
  slug,
  catalogName,
  logoUrl,
  category,
  items,
  settings,
  contact,
}: CatalogMenuClientProps) {
  const [lang, setLang] = useState<Language | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isThemeLoaded, setIsThemeLoaded] = useState(false);

  const storagePrefix = `catalog_${slug}_`;
  const colorPrimary = settings?.color_primary || '#8b5cf6';
  const colorAccent = settings?.color_accent || '#c084fc';
  const supportedLanguages = parseEnabledLanguages(settings?.enabled_languages);
  const whatsappEnabled = settings?.whatsapp_order_enabled ?? true;
  const whatsappNumber = contact?.phone_whatsapp;

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

  // Loading state
  if (!isThemeLoaded) {
    return (
      <div className="fixed inset-0 bg-white dark:bg-navy-900 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-t-transparent rounded-full animate-spin"
          style={{ borderColor: `${colorPrimary} transparent transparent transparent` }} />
      </div>
    );
  }

  // Language selection
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

  // Get localized text
  const getCategoryName = () => {
    switch (lang) {
      case 'ar': return category.name_ar;
      case 'fr': return category.name_fr;
      default: return category.name_en;
    }
  };

  const getItemName = (item: MenuItemData) => {
    switch (lang) {
      case 'ar': return item.name_ar;
      case 'fr': return item.name_fr;
      default: return item.name_en;
    }
  };

  const getItemDescription = (item: MenuItemData) => {
    switch (lang) {
      case 'ar': return item.description_ar;
      case 'fr': return item.description_fr;
      default: return item.description_en;
    }
  };

  // Labels
  const labels = {
    items: lang === 'ar' ? 'عناصر' : lang === 'fr' ? 'articles' : 'items',
    order: lang === 'ar' ? 'اطلب' : lang === 'fr' ? 'Commander' : 'Order',
    orderViaWhatsApp: lang === 'ar' ? 'اطلب عبر واتساب' : lang === 'fr' ? 'Commander via WhatsApp' : 'Order via WhatsApp',
    noItems: lang === 'ar' ? 'لا توجد عناصر في هذا القسم' : lang === 'fr' ? 'Aucun article dans cette catégorie' : 'No items available in this category yet.',
    featured: lang === 'ar' ? 'مميز' : lang === 'fr' ? 'Vedette' : 'Featured',
  };

  // WhatsApp URL generator
  const getWhatsAppUrl = (itemName?: string) => {
    if (!whatsappNumber) return '';
    const message = itemName
      ? `Hi! I'd like to order: ${itemName}`
      : `Hi! I'd like to order from ${catalogName}`;
    return `https://wa.me/${whatsappNumber.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
  };

  return (
    <div
      className={cn("min-h-screen transition-colors duration-300", font)}
      style={{
        backgroundColor: 'var(--background-hex)',
        color: 'var(--text-primary)'
      }}
      dir={dir}
    >
      {/* Header */}
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="sticky top-0 z-40 backdrop-blur-xl border-b transition-colors duration-300"
        style={{
          backgroundColor: 'var(--navbar-bg)',
          borderColor: 'var(--border-color)'
        }}
      >
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link
            href={`/c/${slug}/categories`}
            className="p-2 rounded-xl transition-all border"
            style={{
              backgroundColor: 'var(--surface)',
              borderColor: 'var(--border-color)',
              color: 'var(--text-primary)'
            }}
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>

          <div className="flex-1">
            <h1 className="font-bold">{getCategoryName()}</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">{items.length} {labels.items}</p>
          </div>

          {whatsappEnabled && whatsappNumber && (
            <a
              href={getWhatsAppUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 rounded-xl font-medium bg-green-600 text-white hover:bg-green-700 transition-all text-sm"
            >
              <MessageCircle className="w-4 h-4" />
              {labels.order}
            </a>
          )}

          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="p-2 rounded-xl transition-all border"
            style={{
              backgroundColor: 'var(--surface)',
              borderColor: 'var(--border-color)',
              color: colorPrimary
            }}
          >
            {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
        </div>
      </motion.header>

      {/* Category Hero */}
      {category.image_url && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="relative h-48 sm:h-64"
        >
          <Image
            src={category.image_url}
            alt={getCategoryName()}
            fill
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[var(--background-hex)]" />
        </motion.div>
      )}

      {/* Menu Items */}
      <main className="px-4 py-8 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {items.length === 0 ? (
            <div className="text-center py-12 text-slate-500 dark:text-slate-400">
              <p>{labels.noItems}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {items.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex gap-4 p-4 rounded-2xl border transition-all"
                  style={{
                    backgroundColor: 'var(--surface)',
                    borderColor: 'var(--border-color)'
                  }}
                >
                  {/* Item Image */}
                  {item.image_url && (
                    <div className="relative w-24 h-24 sm:w-32 sm:h-32 rounded-xl overflow-hidden flex-shrink-0">
                      <Image
                        src={item.image_url}
                        alt={getItemName(item)}
                        fill
                        className="object-cover"
                      />
                    </div>
                  )}

                  {/* Item Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-semibold">{getItemName(item)}</h3>
                        {item.is_featured && (
                          <span
                            className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full mt-1"
                            style={{ backgroundColor: colorAccent, color: 'black' }}
                          >
                            <Star className="w-3 h-3" />
                            {labels.featured}
                          </span>
                        )}
                      </div>
                      <span
                        className="font-bold text-lg flex-shrink-0"
                        style={{ color: colorPrimary }}
                      >
                        {formatPrice(item.price, item.currency, lang)}
                      </span>
                    </div>

                    {getItemDescription(item) && (
                      <p className="text-sm mt-2 line-clamp-2 text-slate-600 dark:text-slate-400">
                        {getItemDescription(item)}
                      </p>
                    )}

                    {/* WhatsApp order button for each item */}
                    {whatsappEnabled && whatsappNumber && (
                      <a
                        href={getWhatsAppUrl(getItemName(item))}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 mt-3 text-sm font-medium text-green-600 hover:text-green-700"
                      >
                        <MessageCircle className="w-4 h-4" />
                        {labels.order}
                      </a>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Floating WhatsApp Order Button */}
      {whatsappEnabled && whatsappNumber && (
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="fixed bottom-6 right-6 z-50"
        >
          <a
            href={getWhatsAppUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-6 py-3 rounded-full font-semibold bg-green-600 text-white hover:bg-green-700 transition-all shadow-2xl"
          >
            <MessageCircle className="w-5 h-5" />
            {labels.orderViaWhatsApp}
          </a>
        </motion.div>
      )}
    </div>
  );
}
