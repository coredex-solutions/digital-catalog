'use client';

import { useState, useEffect, useRef, useMemo, createContext, useContext, ReactNode } from 'react';
import type { Language } from '../types';
import { useImagePreloader } from '../hooks/useImagePreloader';
import { RESTAURANT_CONFIG } from '../config/restaurant';

type CartItem = {
  cartId: string;
  quantity: number;
  selectedModifiers: any[];
  [key: string]: any;
};

interface Category {
  id: string;
  name_ar: string;
  name_en: string;
  name_fr: string;
  icon_name: string;
}

interface AppContextType {
  lang: Language | null;
  setLang: (lang: Language | null) => void;
  cart: CartItem[];
  setCart: (cart: CartItem[] | ((prev: CartItem[]) => CartItem[])) => void;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  isCheckoutOpen: boolean;
  setIsCheckoutOpen: (open: boolean) => void;
  isReservationOpen: boolean;
  setIsReservationOpen: (open: boolean) => void;
  isInfoOpen: boolean;
  setIsInfoOpen: (open: boolean) => void;
  selectedItem: any | null;
  setSelectedItem: (item: any | null) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  isDarkMode: boolean;
  setIsDarkMode: (dark: boolean) => void;
  isThemeLoaded: boolean;
  isFirstLoad: boolean;
  addToCart: (item: any, modifiers?: any[], quantity?: number) => void;
  removeFromCart: (cartId: string) => void;
  areImagesLoading: boolean;
  categories: Category[];
  categoriesLoading: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Language | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isReservationOpen, setIsReservationOpen] = useState(false);
  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isThemeLoaded, setIsThemeLoaded] = useState(false);
  const [isFirstLoad, setIsFirstLoad] = useState(true);
  // Initialize categories from localStorage synchronously (client-side only)
  const [categories, setCategories] = useState<Category[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('app_categories');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed;
          }
        }
      } catch (e) {
        console.error('Failed to parse categories from localStorage on init', e);
      }
    }
    return [];
  });
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const hasLoadedFromStorage = useRef(false);
  const categoriesFetched = useRef(false);

  // Preload all logo images - memoize to prevent infinite re-renders
  const logoImages = useMemo(
    () => [
      RESTAURANT_CONFIG.logo,
      RESTAURANT_CONFIG.logoEn,
      RESTAURANT_CONFIG.logoAr,
    ],
    [] // Empty deps since RESTAURANT_CONFIG is a constant
  );
  const { isLoading: areImagesLoading } = useImagePreloader(logoImages);

  // Load theme, language, and categories from localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem('app_theme');
    if (savedTheme === 'dark') {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
    } else {
      setIsDarkMode(false);
      document.documentElement.classList.remove('dark');
    }
    setIsThemeLoaded(true);

    const savedLang = localStorage.getItem('app_lang') as Language;
    if (savedLang) {
      setLang(savedLang);
    }

    const savedCart = localStorage.getItem('app_cart');
    if (savedCart) {
      try {
        const parsedCart = JSON.parse(savedCart);
        if (Array.isArray(parsedCart) && parsedCart.length > 0) {
          setCart(parsedCart);
        }
      } catch (e) {
        console.error('Failed to parse cart from localStorage', e);
      }
    }

    // Categories are already loaded synchronously in useState initializer
    // This effect just ensures we have the latest data

    hasLoadedFromStorage.current = true;
  }, []);

  // Fetch categories from API (only once, and update localStorage)
  useEffect(() => {
    if (categoriesFetched.current) return;
    
    const fetchCategories = async () => {
      setCategoriesLoading(true);
      try {
        const response = await fetch('/api/categories');
        const data = await response.json();
        if (Array.isArray(data) && data.length > 0) {
          setCategories(data);
          // Cache in localStorage
          localStorage.setItem('app_categories', JSON.stringify(data));
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
      } finally {
        setCategoriesLoading(false);
        categoriesFetched.current = true;
      }
    };

    // Only fetch if we don't have categories from localStorage
    if (categories.length === 0) {
      fetchCategories();
    } else {
      categoriesFetched.current = true;
    }
  }, [categories.length]);

  // Save language to localStorage
  useEffect(() => {
    if (lang) {
      localStorage.setItem('app_lang', lang);
    }
  }, [lang]);

  // Save cart to localStorage
  useEffect(() => {
    if (hasLoadedFromStorage.current) {
      localStorage.setItem('app_cart', JSON.stringify(cart));
    }
  }, [cart]);

  // Update theme
  useEffect(() => {
    if (isThemeLoaded) {
      if (isDarkMode) {
        document.documentElement.classList.add('dark');
        localStorage.setItem('app_theme', 'dark');
      } else {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('app_theme', 'light');
      }
    }
  }, [isDarkMode, isThemeLoaded]);

  // Set first load to false after theme and lang are loaded
  useEffect(() => {
    if (isThemeLoaded && lang) {
      const timer = setTimeout(() => {
        setIsFirstLoad(false);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isThemeLoaded, lang]);

  const addToCart = (item: any, modifiers: any[] = [], quantity = 1) => {
    const newItem: CartItem = {
      ...item,
      cartId: Math.random().toString(36).substr(2, 9),
      quantity,
      selectedModifiers: modifiers,
    };
    setCart((prev) => [...prev, newItem]);
    setSelectedItem(null);
  };

  const removeFromCart = (cartId: string) => {
    setCart((prev) => prev.filter((i) => i.cartId !== cartId));
  };

  return (
    <AppContext.Provider
      value={{
        lang,
        setLang,
        cart,
        setCart,
        isCartOpen,
        setIsCartOpen,
        isCheckoutOpen,
        setIsCheckoutOpen,
        isReservationOpen,
        setIsReservationOpen,
        isInfoOpen,
        setIsInfoOpen,
        selectedItem,
        setSelectedItem,
        searchQuery,
        setSearchQuery,
        isDarkMode,
        setIsDarkMode,
        isThemeLoaded,
        isFirstLoad,
        addToCart,
        removeFromCart,
        areImagesLoading,
        categories,
        categoriesLoading,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

