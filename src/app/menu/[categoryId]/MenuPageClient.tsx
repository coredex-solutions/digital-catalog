"use client";

import { useApp } from "../../../providers/AppProvider";
import { Suspense, lazy } from "react";
import {
  Navbar,
  MenuFeed,
  Footer,
  FloatingReservationButton,
  ItemModal,
  CartDrawer,
  CheckoutForm,
  InfoModal,
  ReservationModal,
} from "../../../App";
import { cn } from "../../../utils/helpers";
import { useNextRouter } from "../../../hooks/useNextRouter";
import { Utensils, Coffee, ShoppingCart } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// Lazy load components
const ChatComponent = lazy(() =>
  import("../../../components/LiveChat").then((module) => ({
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
}

interface MenuItem {
  id: string;
  category_id: string;
  name_ar: string;
  name_en: string;
  name_fr: string;
  description_ar: string | null;
  description_en: string | null;
  description_fr: string | null;
  price: number;
  display_order: number;
}

interface MenuPageClientProps {
  category: Category | null;
  menuItems: MenuItem[];
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

export default function MenuPageClient({
  category,
  menuItems,
  categories,
  operatingHours = [],
  socialMedia = [],
  settings = null,
  faqs = [],
}: MenuPageClientProps) {
  const {
    lang,
    searchQuery,
    setSearchQuery,
    setLang,
    isDarkMode,
    setIsDarkMode,
    setIsInfoOpen,
    isInfoOpen,
    setSelectedItem,
    selectedItem,
    addToCart,
    cart,
    setIsCartOpen,
    isCartOpen,
    isCheckoutOpen,
    setIsCheckoutOpen,
    isReservationOpen,
    setIsReservationOpen,
    removeFromCart,
  } = useApp();
  const { navigate } = useNextRouter();

  if (!lang) {
    return null;
  }

  const dir = lang === "ar" ? "rtl" : "ltr";
  const font = lang === "ar" ? "font-cairo" : "font-inter";

  // Transform menu items to match expected format
  const transformedItems = menuItems.map((item) => ({
    id: item.id,
    category_id: item.category_id,
    cat: item.category_id,
    name_ar: item.name_ar,
    name_en: item.name_en,
    name_fr: item.name_fr,
    desc_ar: item.description_ar || "",
    desc_en: item.description_en || "",
    desc_fr: item.description_fr || "",
    price: item.price,
    display_order: item.display_order,
    modifiers: [], // Removed modifiers feature
  }));

  // Transform categories for navigation
  const transformedCategories = categories.map((cat) => ({
    id: cat.id,
    ar: cat.name_ar,
    en: cat.name_en,
    fr: cat.name_fr,
    icon: iconMap[cat.icon_name] || Utensils,
  }));

  // Calculate cart total
  const cartTotal = cart.reduce((sum: number, item: any) => {
    const modifiersPrice =
      item.selectedModifiers?.reduce(
        (mSum: number, m: any) => mSum + (m.price || 0),
        0
      ) || 0;
    return sum + (item.price + modifiersPrice) * (item.quantity || 1);
  }, 0);

  return (
    <>
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
          <MenuFeed
            items={transformedItems}
            activeCategory={category?.id || null}
            searchQuery={searchQuery}
            lang={lang}
            onAddClick={(item: any) => setSelectedItem(item)}
          />
        </main>
        <Footer
          lang={lang}
          settings={settings}
          operatingHours={operatingHours}
          socialMedia={socialMedia}
        />
        {!isCartOpen && !isCheckoutOpen && (
          <div className="fixed bottom-8 left-6 z-[60]">
            <motion.button
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsCartOpen(true)}
              className="relative w-14 h-14 bg-slate-900/95 dark:bg-purple-500/95 backdrop-blur-lg text-white rounded-full shadow-xl shadow-slate-900/30 dark:shadow-purple-500/30 flex items-center justify-center border border-white/10 transition-all group"
            >
              <ShoppingCart size={22} strokeWidth={2} />
              {cart.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-purple-500 text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full font-bold border-2 border-white dark:border-navy-900">
                  {cart.length}
                </span>
              )}
            </motion.button>
          </div>
        )}
        <FloatingReservationButton
          lang={lang}
          onReservation={() => setIsReservationOpen(true)}
          isCartOpen={isCartOpen}
          isCheckoutOpen={isCheckoutOpen}
        />
        <Suspense fallback={null}>
          <ChatComponent lang={lang} settings={settings} faqs={faqs} />
        </Suspense>
        <AnimatePresence>
          {selectedItem && lang && (
            <ItemModal
              item={selectedItem}
              lang={lang}
              onClose={() => setSelectedItem(null)}
              onConfirm={(item: any, modifiers: any[] = [], quantity = 1) => {
                addToCart(item, modifiers, quantity);
              }}
            />
          )}
        </AnimatePresence>
        {isCartOpen && (
          <CartDrawer
            cart={cart}
            total={cartTotal}
            lang={lang}
            onClose={() => setIsCartOpen(false)}
            onRemove={removeFromCart}
            onCheckout={() => {
              setIsCartOpen(false);
              setIsCheckoutOpen(true);
            }}
          />
        )}
        {isCheckoutOpen && (
          <CheckoutForm
            cart={cart}
            total={cartTotal}
            lang={lang}
            onClose={() => setIsCheckoutOpen(false)}
            settings={settings}
          />
        )}
        <AnimatePresence>
          {isInfoOpen && lang && (
            <InfoModal
              lang={lang}
              onClose={() => setIsInfoOpen(false)}
              settings={settings}
              operatingHours={operatingHours}
              socialMedia={socialMedia}
            />
          )}
        </AnimatePresence>
        {isReservationOpen && lang && (
          <ReservationModal
            lang={lang}
            onClose={() => setIsReservationOpen(false)}
            settings={settings}
          />
        )}
      </div>
    </>
  );
}
