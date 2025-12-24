"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useMemo,
  useCallback,
} from "react";
import type {
  Language,
  LanguageOption,
  CatalogUIData,
  OperatingHoursData,
  SocialMediaLink,
  CatalogContactData,
  CatalogSettingsData,
} from "@/types";

// Cart item interface
export interface CartItem {
  id: string;
  name_ar: string;
  name_en: string;
  name_fr: string;
  description_ar?: string | null;
  description_en?: string | null;
  description_fr?: string | null;
  price: number;
  currency?: string;
  quantity: number;
  image_url?: string | null;
}

// Menu item interface
export interface MenuItem {
  id: string;
  name_ar: string;
  name_en: string;
  name_fr: string;
  description_ar?: string | null;
  description_en?: string | null;
  description_fr?: string | null;
  price: number;
  currency?: string;
  image_url?: string | null;
  is_featured?: boolean;
}

interface CatalogContextType {
  // Catalog data (readonly, from server)
  catalog: CatalogUIData["catalog"];
  settings: CatalogSettingsData | null;
  contact: CatalogContactData | null;
  operatingHours: OperatingHoursData[];
  socialMedia: SocialMediaLink[];

  // Derived data
  supportedLanguages: LanguageOption[];
  colorPrimary: string;
  colorSecondary: string;
  colorAccent: string;
  bookingEnabled: boolean;
  whatsappEnabled: boolean;

  // Client state
  lang: Language | null;
  setLang: (lang: Language | null) => void;
  isDarkMode: boolean;
  setIsDarkMode: (dark: boolean) => void;
  isInfoOpen: boolean;
  setIsInfoOpen: (open: boolean) => void;
  isReservationOpen: boolean;
  setIsReservationOpen: (open: boolean) => void;
  
  // Search
  searchQuery: string;
  setSearchQuery: (query: string) => void;

  // Cart state
  cart: CartItem[];
  addToCart: (item: MenuItem, quantity?: number) => void;
  removeFromCart: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
  cartTotal: number;
  cartItemCount: number;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  isCheckoutOpen: boolean;
  setIsCheckoutOpen: (open: boolean) => void;

  // Item modal
  selectedItem: MenuItem | null;
  setSelectedItem: (item: MenuItem | null) => void;

  // Loading states
  isThemeLoaded: boolean;
}

const CatalogContext = createContext<CatalogContextType | undefined>(undefined);

export function useCatalog() {
  const context = useContext(CatalogContext);
  if (!context) {
    throw new Error("useCatalog must be used within CatalogProvider");
  }
  return context;
}

interface CatalogProviderProps {
  children: ReactNode;
  data: CatalogUIData;
}

// Parse enabled languages string to LanguageOption array
function parseEnabledLanguages(enabledLangs?: string): LanguageOption[] {
  const defaultLanguages: LanguageOption[] = [
    { code: "ar", label: "العربية", font: "font-cairo" },
    { code: "en", label: "English", font: "font-inter" },
    { code: "fr", label: "Français", font: "font-inter" },
  ];

  if (!enabledLangs) return defaultLanguages;

  const codes = enabledLangs.split(",").map((s) => s.trim().toLowerCase());
  return defaultLanguages.filter((l) => codes.includes(l.code));
}

export function CatalogProvider({ children, data }: CatalogProviderProps) {
  const { catalog, settings, contact, operatingHours, socialMedia } = data;

  // Client state
  const [lang, setLang] = useState<Language | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isThemeLoaded, setIsThemeLoaded] = useState(false);
  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const [isReservationOpen, setIsReservationOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Cart state
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);

  // Derived values
  const supportedLanguages = useMemo(
    () => parseEnabledLanguages(settings?.enabled_languages),
    [settings?.enabled_languages]
  );

  const colorPrimary = settings?.color_primary || "#fead1d";
  const colorSecondary = settings?.color_secondary || "#b14288";
  const colorAccent = settings?.color_accent || "#F7C948";
  const bookingEnabled = settings?.booking_enabled ?? true;
  const whatsappEnabled = settings?.whatsapp_order_enabled ?? true;

  // Storage key unique to this catalog
  const storagePrefix = `catalog_${catalog.slug}_`;

  // Cart calculations
  const cartTotal = useMemo(
    () => cart.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [cart]
  );

  const cartItemCount = useMemo(
    () => cart.reduce((sum, item) => sum + item.quantity, 0),
    [cart]
  );

  // Cart actions
  const addToCart = useCallback((item: MenuItem, quantity: number = 1) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.id === item.id);
      if (existing) {
        return prev.map((i) =>
          i.id === item.id ? { ...i, quantity: i.quantity + quantity } : i
        );
      }
      return [
        ...prev,
        {
          id: item.id,
          name_ar: item.name_ar,
          name_en: item.name_en,
          name_fr: item.name_fr,
          description_ar: item.description_ar,
          description_en: item.description_en,
          description_fr: item.description_fr,
          price: item.price,
          currency: item.currency,
          quantity,
          image_url: item.image_url,
        },
      ];
    });
  }, []);

  const removeFromCart = useCallback((itemId: string) => {
    setCart((prev) => prev.filter((i) => i.id !== itemId));
  }, []);

  const updateQuantity = useCallback((itemId: string, quantity: number) => {
    if (quantity <= 0) {
      setCart((prev) => prev.filter((i) => i.id !== itemId));
    } else {
      setCart((prev) =>
        prev.map((i) => (i.id === itemId ? { ...i, quantity } : i))
      );
    }
  }, []);

  const clearCart = useCallback(() => {
    setCart([]);
  }, []);

  // Load from localStorage on mount
  useEffect(() => {
    // Theme
    const savedTheme = localStorage.getItem(`${storagePrefix}theme`);
    if (savedTheme === "dark") {
      setIsDarkMode(true);
      document.documentElement.classList.add("dark");
    } else {
      setIsDarkMode(false);
      document.documentElement.classList.remove("dark");
    }
    setIsThemeLoaded(true);

    // Language
    const savedLang = localStorage.getItem(`${storagePrefix}lang`) as Language;
    if (savedLang && supportedLanguages.some((l) => l.code === savedLang)) {
      setLang(savedLang);
    }

    // Cart
    const savedCart = localStorage.getItem(`${storagePrefix}cart`);
    if (savedCart) {
      try {
        setCart(JSON.parse(savedCart));
      } catch {
        // Ignore invalid cart
      }
    }
  }, [storagePrefix, supportedLanguages]);

  // Save language to localStorage
  useEffect(() => {
    if (lang) {
      localStorage.setItem(`${storagePrefix}lang`, lang);
    }
  }, [lang, storagePrefix]);

  // Save cart to localStorage
  useEffect(() => {
    localStorage.setItem(`${storagePrefix}cart`, JSON.stringify(cart));
  }, [cart, storagePrefix]);

  // Update theme in localStorage and DOM
  useEffect(() => {
    if (isThemeLoaded) {
      if (isDarkMode) {
        document.documentElement.classList.add("dark");
        localStorage.setItem(`${storagePrefix}theme`, "dark");
      } else {
        document.documentElement.classList.remove("dark");
        localStorage.setItem(`${storagePrefix}theme`, "light");
      }
    }
  }, [isDarkMode, isThemeLoaded, storagePrefix]);

  const value: CatalogContextType = {
    catalog,
    settings,
    contact,
    operatingHours,
    socialMedia,
    supportedLanguages,
    colorPrimary,
    colorSecondary,
    colorAccent,
    bookingEnabled,
    whatsappEnabled,
    lang,
    setLang,
    isDarkMode,
    setIsDarkMode,
    isInfoOpen,
    setIsInfoOpen,
    isReservationOpen,
    setIsReservationOpen,
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
  };

  return (
    <CatalogContext.Provider value={value}>{children}</CatalogContext.Provider>
  );
}
