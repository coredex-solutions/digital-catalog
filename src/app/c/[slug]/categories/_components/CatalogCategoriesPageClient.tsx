"use client";

import { motion, AnimatePresence } from 'framer-motion';
import { useCatalog } from '../../_providers/CatalogProvider';
import { DynamicLanguageSelectionPage } from '@/views/DynamicLanguageSelectionPage';
import { SaasNavbar } from '../../_components/SaasNavbar';
import { SaasFooter } from '../../_components/SaasFooter';
import { SaasCategoryGrid } from '../../_components/SaasCategoryGrid';
import { SaasInfoModal } from '../../_components/SaasInfoModal';
import { SaasChatWidget } from '../../_components/SaasChatWidget';
import { SaasCartDrawer } from '../../_components/SaasCartDrawer';
import { SaasCheckoutForm } from '../../_components/SaasCheckoutForm';
import { ShoppingCart } from 'lucide-react';
import { cn } from '@/utils/helpers';

interface CategoryData {
  id: string;
  name_ar: string;
  name_en: string;
  name_fr: string;
  image_url: string | null;
  icon_name?: string;
}

interface CatalogCategoriesPageClientProps {
  categories: CategoryData[];
}

export function CatalogCategoriesPageClient({ categories }: CatalogCategoriesPageClientProps) {
  const {
    catalog,
    settings,
    contact,
    operatingHours,
    socialMedia,
    supportedLanguages,
    colorPrimary,
    colorSecondary,
    lang,
    setLang,
    isDarkMode,
    setIsDarkMode,
    isInfoOpen,
    setIsInfoOpen,
    isThemeLoaded,
    subscriptionType,
    cart,
    removeFromCart,
    updateQuantity,
    clearCart,
    cartTotal,
    cartItemCount,
    isCartOpen,
    setIsCartOpen,
    isCheckoutOpen,
    setIsCheckoutOpen,
  } = useCatalog();

  // Loading state
  if (!isThemeLoaded) {
    return (
      <div className="fixed inset-0 flex items-center justify-center" style={{ backgroundColor: 'var(--background-hex)' }}>
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

  // Labels
  const labels = {
    categories: lang === 'ar' ? 'الأقسام' : lang === 'fr' ? 'Catégories' : 'Categories',
    noCategories: lang === 'ar' ? 'لا توجد أقسام متاحة' : lang === 'fr' ? 'Aucune catégorie disponible' : 'No categories available',
  };

  return (
    <div
      className={cn(
        'min-h-screen bg-[var(--background-hex)] text-[var(--text-primary)] transition-colors duration-300 relative bg-wood-pattern',
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
        logoUrl={catalog.logo_url || null}
        catalogSlug={catalog.slug}
        supportedLanguages={supportedLanguages}
        showHomeButton={true}
        homeUrl={`/c/${catalog.slug}`}
        colorPrimary={colorPrimary}
      />

      <main className="pt-20 pb-24 px-4 max-w-md mx-auto md:max-w-2xl lg:max-w-4xl relative z-10">
        <h1 className="text-2xl font-bold mb-6">{labels.categories}</h1>

        {categories.length === 0 ? (
          <div className="text-center py-12" style={{ color: 'var(--text-muted)' }}>
            {labels.noCategories}
          </div>
        ) : (
          <SaasCategoryGrid
            categories={categories}
            lang={lang}
            catalogSlug={catalog.slug}
            colorPrimary={colorPrimary}
            colorSecondary={colorSecondary}
          />
        )}
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
            <span
              className="absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center text-[10px] font-bold rounded-full text-white"
              style={{ backgroundColor: colorSecondary || colorPrimary }}
            >
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
        catalogName={catalog[`name_${lang}` as keyof typeof catalog] as string || catalog.name}
        colorPrimary={colorPrimary}
        subscriptionType={subscriptionType}
      />

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
