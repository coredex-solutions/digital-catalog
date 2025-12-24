"use client";

import { useRef, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart, ChevronLeft } from 'lucide-react';
import { useCatalog, MenuItem } from '../../../_providers/CatalogProvider';
import { DynamicLanguageSelectionPage } from '@/views/DynamicLanguageSelectionPage';
import { SaasNavbar } from '../../../_components/SaasNavbar';
import { SaasFooter } from '../../../_components/SaasFooter';
import { SaasMenuFeed } from '../../../_components/SaasMenuFeed';
import { SaasInfoModal } from '../../../_components/SaasInfoModal';
import { SaasItemModal } from '../../../_components/SaasItemModal';
import { SaasCartDrawer } from '../../../_components/SaasCartDrawer';
import { SaasCheckoutForm } from '../../../_components/SaasCheckoutForm';
import { SaasChatWidget } from '../../../_components/SaasChatWidget';
import { cn } from '@/utils/helpers';

interface CategoryData {
  id: string;
  name_ar: string;
  name_en: string;
  name_fr: string;
  image_url: string | null;
}

interface CatalogMenuPageClientProps {
  currentCategory: CategoryData;
  menuItems: MenuItem[];
  allCategories: CategoryData[];
}

export function CatalogMenuPageClient({
  currentCategory,
  menuItems,
  allCategories,
}: CatalogMenuPageClientProps) {
  const {
    catalog,
    contact,
    operatingHours,
    socialMedia,
    supportedLanguages,
    colorPrimary,
    colorSecondary,
    colorAccent,
    lang,
    setLang,
    isDarkMode,
    setIsDarkMode,
    isInfoOpen,
    setIsInfoOpen,
    searchQuery,
    setSearchQuery,
    cart,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    cartTotal,
    cartItemCount,
    isCartOpen,
    setIsCartOpen,
    isCheckoutOpen,
    setIsCheckoutOpen,
    selectedItem,
    setSelectedItem,
    isThemeLoaded,
  } = useCatalog();

  const categoryTabsRef = useRef<HTMLDivElement>(null);

  // Scroll active category tab into view
  useEffect(() => {
    if (categoryTabsRef.current && lang) {
      const activeTab = categoryTabsRef.current.querySelector('[data-active="true"]');
      if (activeTab) {
        activeTab.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    }
  }, [currentCategory.id, lang]);

  // Loading state
  if (!isThemeLoaded) {
    return (
      <div className="fixed inset-0 bg-white dark:bg-navy-900 flex items-center justify-center">
        <div
          className="w-12 h-12 border-4 border-t-transparent rounded-full animate-spin"
          style={{ borderColor: `${colorPrimary} transparent transparent transparent` }}
        />
      </div>
    );
  }

  // Language selection
  if (!lang) {
    return (
      <DynamicLanguageSelectionPage
        onSelect={setLang}
        languages={supportedLanguages}
        catalogName={catalog.name}
        colorPrimary={colorPrimary}
      />
    );
  }

  const dir = lang === 'ar' ? 'rtl' : 'ltr';
  const font = lang === 'ar' ? 'font-cairo' : 'font-inter';

  // Get category name by language
  const getCategoryName = (cat: CategoryData) => {
    switch (lang) {
      case 'ar': return cat.name_ar;
      case 'fr': return cat.name_fr;
      default: return cat.name_en;
    }
  };

  return (
    <div
      className={cn(
        'min-h-screen bg-white dark:bg-navy-900 text-slate-900 dark:text-white transition-colors duration-300 relative bg-wood-pattern',
        font,
        dir === 'rtl' ? 'rtl' : 'ltr'
      )}
      dir={dir}
    >
      <SaasNavbar
        lang={lang}
        onLanguageChange={setLang}
        onOpenInfo={() => setIsInfoOpen(true)}
        isDarkMode={isDarkMode}
        onToggleTheme={() => setIsDarkMode(!isDarkMode)}
        onSearch={setSearchQuery}
        logoUrl={catalog.logo_url || null}
        catalogSlug={catalog.slug}
        supportedLanguages={supportedLanguages}
        showHomeButton={true}
        homeUrl={`/c/${catalog.slug}`}
        colorPrimary={colorPrimary}
      />

      {/* Sticky Category Tabs (Legacy Style) */}
      <div className="fixed top-[64px] left-0 right-0 z-30 bg-white/95 dark:bg-navy-900/95 backdrop-blur-lg border-b border-slate-100 dark:border-navy-800 shadow-sm transition-all duration-300">
        <div className="max-w-4xl mx-auto flex items-center">
          {/* Back Button */}
          <Link
            href={`/c/${catalog.slug}/categories`}
            className="flex-shrink-0 w-12 h-12 flex items-center justify-center text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white border-e border-slate-100 dark:border-navy-800 bg-white dark:bg-navy-900 z-10"
            style={{ [dir === "rtl" ? "borderLeft" : "borderRight"]: "1px solid rgba(0,0,0,0.05)" }}
          >
            <ChevronLeft size={24} className={dir === "rtl" ? "rotate-180" : ""} />
          </Link>

          {/* Scrollable Categories */}
          <div
            ref={categoryTabsRef}
            className="flex-1 flex gap-2 overflow-x-auto scrollbar-hide px-4 py-3 items-center"
          >
            {allCategories.map((cat) => {
              const isActive = cat.id === currentCategory.id;
              return (
                <Link
                  key={cat.id}
                  href={`/c/${catalog.slug}/menu/${cat.id}`}
                  data-active={isActive}
                  className={cn(
                    'flex-shrink-0 px-5 py-2 rounded-full text-sm font-bold transition-all whitespace-nowrap border',
                    isActive
                      ? 'text-white border-transparent shadow-md transform scale-105'
                      : 'bg-white dark:bg-navy-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-navy-700 hover:border-slate-300 dark:hover:border-navy-600 hover:bg-slate-50 dark:hover:bg-navy-700'
                  )}
                  style={isActive ? { backgroundColor: colorPrimary } : {}}
                >
                  {getCategoryName(cat)}
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      <main className="pt-32 pb-32 px-4 max-w-md mx-auto md:max-w-2xl lg:max-w-4xl relative z-10">
        <h1 className="text-2xl font-bold mb-6">{getCategoryName(currentCategory)}</h1>
        
        <SaasMenuFeed
          items={menuItems}
          lang={lang}
          searchQuery={searchQuery}
          onItemClick={setSelectedItem}
          colorPrimary={colorPrimary}
          colorAccent={colorAccent}
        />
      </main>

      {/* Cart Floating Button */}
      {!isCartOpen && !isCheckoutOpen && (
        <motion.button
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsCartOpen(true)}
          className="fixed bottom-8 left-6 z-[60] w-14 h-14 rounded-full shadow-xl flex items-center justify-center text-white"
          style={{ backgroundColor: colorPrimary }}
        >
          <ShoppingCart size={22} />
          {cartItemCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center text-[10px] font-bold bg-red-500 text-white rounded-full">
              {cartItemCount}
            </span>
          )}
        </motion.button>
      )}

      <SaasFooter
        lang={lang}
        operatingHours={operatingHours}
        socialMedia={socialMedia}
        contact={contact}
        logoUrl={catalog.logo_url}
        catalogName={catalog.name}
        colorPrimary={colorPrimary}
      />

      {/* Modals */}
      <AnimatePresence>
        {isInfoOpen && (
          <SaasInfoModal
            lang={lang}
            onClose={() => setIsInfoOpen(false)}
            operatingHours={operatingHours}
            socialMedia={socialMedia}
            contact={contact}
            colorPrimary={colorPrimary}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedItem && (
          <SaasItemModal
            item={selectedItem}
            lang={lang}
            onClose={() => setSelectedItem(null)}
            onAddToCart={(item, quantity) => {
              addToCart(item, quantity);
              setSelectedItem(null);
            }}
            colorPrimary={colorPrimary}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isCartOpen && (
          <SaasCartDrawer
            cart={cart}
            lang={lang}
            onClose={() => setIsCartOpen(false)}
            onRemove={removeFromCart}
            onUpdateQuantity={updateQuantity}
            onCheckout={() => {
              setIsCartOpen(false);
              setIsCheckoutOpen(true);
            }}
            cartTotal={cartTotal}
            colorPrimary={colorPrimary}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isCheckoutOpen && (
          <SaasCheckoutForm
            cart={cart}
            lang={lang}
            onClose={() => setIsCheckoutOpen(false)}
            onSuccess={() => {
              clearCart();
              setIsCheckoutOpen(false);
            }}
            cartTotal={cartTotal}
            catalogName={catalog.name}
            contact={contact}
            colorPrimary={colorPrimary}
          />
        )}
      </AnimatePresence>

      <SaasChatWidget
        catalogSlug={catalog.slug}
        lang={lang}
        colorPrimary={colorPrimary}
        colorSecondary={colorSecondary}
        whatsappNumber={contact?.phone_whatsapp || undefined}
      />
    </div>
  );
}
