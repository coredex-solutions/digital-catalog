import { createContext, useContext, useState, useEffect, useRef } from "react";
import type { ReactNode } from "react";
import type { Language } from "../types";

// Re-export Language for convenience
export type { Language };

export type CartItem = {
  id: string;
  category_id: string;
  name_ar: string;
  name_en: string;
  name_fr: string;
  description_ar: string;
  description_en: string;
  description_fr: string;
  price: number;
  image: string;
  image_fallback: string;
  rating: string;
  prep_time: string;
  tags: string[];
  modifiers: any[];
  cartId: string;
  quantity: number;
  selectedModifiers: any[];
};

interface AppContextType {
  lang: Language | null;
  setLang: (lang: Language) => void;
  cart: CartItem[];
  addToCart: (item: any, modifiers?: any[], quantity?: number) => void;
  removeFromCart: (cartId: string) => void;
  cartTotal: number;
  isDarkMode: boolean;
  setIsDarkMode: (dark: boolean) => void;
  isThemeLoaded: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Language | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isThemeLoaded, setIsThemeLoaded] = useState(false);
  const hasLoadedFromStorage = useRef(false);

  // Load from localStorage on mount
  useEffect(() => {
    // Load theme
    const savedTheme = localStorage.getItem("app_theme");
    if (savedTheme === "dark") {
      setIsDarkMode(true);
      document.documentElement.classList.add("dark");
    } else {
      setIsDarkMode(false);
      document.documentElement.classList.remove("dark");
    }
    setIsThemeLoaded(true);

    // Load language
    const savedLang = localStorage.getItem("app_lang") as Language;
    if (savedLang) {
      setLang(savedLang);
    }

    // Load cart
    const savedCart = localStorage.getItem("app_cart");
    if (savedCart) {
      try {
        const parsedCart = JSON.parse(savedCart);
        if (Array.isArray(parsedCart) && parsedCart.length > 0) {
          setCart(parsedCart);
        }
      } catch (e) {
        console.error("Failed to parse cart from localStorage", e);
      }
    }

    hasLoadedFromStorage.current = true;
  }, []);

  // Save language to localStorage
  useEffect(() => {
    if (lang) {
      localStorage.setItem("app_lang", lang);
    }
  }, [lang]);

  // Save cart to localStorage
  useEffect(() => {
    if (hasLoadedFromStorage.current) {
      localStorage.setItem("app_cart", JSON.stringify(cart));
    }
  }, [cart]);

  // Save theme to localStorage
  useEffect(() => {
    if (isThemeLoaded) {
      if (isDarkMode) {
        document.documentElement.classList.add("dark");
        localStorage.setItem("app_theme", "dark");
      } else {
        document.documentElement.classList.remove("dark");
        localStorage.setItem("app_theme", "light");
      }
    }
  }, [isDarkMode, isThemeLoaded]);

  const addToCart = (
    item: any,
    modifiers: any[] = [],
    quantity = 1
  ) => {
    const newItem: CartItem = {
      ...item,
      cartId: Math.random().toString(36).substr(2, 9),
      quantity,
      selectedModifiers: modifiers,
    };
    setCart((prev) => [...prev, newItem]);
  };

  const removeFromCart = (cartId: string) => {
    setCart((prev) => prev.filter((i) => i.cartId !== cartId));
  };

  const cartTotal = cart.reduce((sum, item) => {
    const modifiersPrice = item.selectedModifiers.reduce(
      (mSum: number, m: any) => mSum + m.price,
      0
    );
    return sum + (item.price + modifiersPrice) * item.quantity;
  }, 0);

  return (
    <AppContext.Provider
      value={{
        lang,
        setLang,
        cart,
        addToCart,
        removeFromCart,
        cartTotal,
        isDarkMode,
        setIsDarkMode,
        isThemeLoaded,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
}

