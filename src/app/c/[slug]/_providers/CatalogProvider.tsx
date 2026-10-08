"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  ReactNode,
  useMemo,
  useCallback,
  type CSSProperties,
} from "react";
import { useRouter } from "next/navigation";
import type {
  Language,
  CatalogUIData,
  OperatingHoursData,
  SocialMediaLink,
  CatalogContactData,
  CatalogSettingsData,
} from "@/types";
import { getPriceConfig, formatTotal, type PriceConfig, type FormattedPrice } from "@/lib/catalog/price";
import { getDictionary, type Dictionary } from "../_lib/i18n";
import { parseOrderTypes, type OrderType } from "../_lib/whatsapp";

// Menu item interface
export interface MenuItem {
  id: string;
  category_id?: string;
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
  /** False while the dish is sold out: it stays on the menu but can't be ordered */
  is_available?: boolean;
}

// Cart item interface
export interface CartItem extends MenuItem {
  quantity: number;
  note?: string;
}

export interface MenuCategory {
  id: string;
  name_ar: string;
  name_en: string;
  name_fr: string;
  image_url?: string | null;
}

export interface MenuFaq {
  id: string;
  question_ar: string;
  question_en: string;
  question_fr: string;
  answer_ar: string;
  answer_en: string;
  answer_fr: string;
}

export interface MenuBranch {
  id: string;
  name_ar: string;
  name_en: string;
  name_fr: string;
  address_ar: string;
  address_en: string;
  address_fr: string;
  phone_numbers: string[];
  map_url: string | null;
}

export type MenuSheet = "item" | "cart" | "checkout" | "search" | "info" | "reservation";

export interface MenuData extends CatalogUIData {
  categories: MenuCategory[];
  faqs: MenuFaq[];
  branches: MenuBranch[];
}

interface CatalogContextType {
  // Catalog data (readonly, from server)
  catalog: CatalogUIData["catalog"];
  settings: CatalogSettingsData | null;
  contact: CatalogContactData | null;
  operatingHours: OperatingHoursData[];
  socialMedia: SocialMediaLink[];
  categories: MenuCategory[];
  menuItems: MenuItem[];
  faqs: MenuFaq[];
  branches: MenuBranch[];

  // Language & appearance
  lang: Language;
  t: Dictionary;
  dir: "rtl" | "ltr";
  enabledLanguages: Language[];
  setLanguage: (lang: Language) => void;
  theme: "light" | "dark";
  toggleTheme: () => void;
  colorPrimary: string;

  // Pricing & ordering
  priceConfig: PriceConfig;
  bookingEnabled: boolean;
  orderingEnabled: boolean;
  orderTypes: OrderType[];
  orderType: OrderType;
  setOrderType: (type: OrderType) => void;
  table: string;
  setTable: (table: string) => void;

  // Cart
  cart: CartItem[];
  addToCart: (item: MenuItem, quantity?: number, note?: string) => void;
  removeFromCart: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
  cartItemCount: number;
  cartTotal: FormattedPrice;

  // Sheets (only one open at a time)
  activeSheet: MenuSheet | null;
  openSheet: (sheet: MenuSheet) => void;
  closeSheet: () => void;
  selectedItem: MenuItem | null;
  openItem: (item: MenuItem) => void;
  /** Kept for the AI waiter, which opens the cart after acting on it */
  setIsCartOpen: (open: boolean) => void;
  portalContainer: HTMLElement | null;
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
  data: MenuData;
  lang: Language;
  enabledLanguages: Language[];
  initialTheme: "light" | "dark";
  className: string;
  style: CSSProperties;
}

const ONE_YEAR = 60 * 60 * 24 * 365;

function setCookie(name: string, value: string) {
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${ONE_YEAR}; samesite=lax`;
}

export function CatalogProvider({
  children,
  data,
  lang,
  enabledLanguages,
  initialTheme,
  className,
  style,
}: CatalogProviderProps) {
  const router = useRouter();
  const { catalog, settings, contact, operatingHours, socialMedia, categories, faqs, branches } = data;
  const menuItems = data.menuItems as MenuItem[];

  const [theme, setTheme] = useState(initialTheme);
  const [portalContainer, setPortalContainer] = useState<HTMLElement | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [activeSheet, setActiveSheet] = useState<MenuSheet | null>(null);
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [table, setTableState] = useState("");

  const t = getDictionary(lang);
  const priceConfig = useMemo(() => getPriceConfig(settings), [settings]);
  const orderTypes = useMemo(() => parseOrderTypes(settings?.order_types), [settings?.order_types]);
  const [orderType, setOrderType] = useState<OrderType>(orderTypes[0] || "dine_in");

  const bookingEnabled = Boolean(settings?.booking_enabled ?? true) && !!contact?.phone_whatsapp;
  const orderingEnabled =
    Boolean(settings?.whatsapp_order_enabled ?? true) && !!contact?.phone_whatsapp && orderTypes.length > 0;

  // Storage key unique to this catalog (same key as before, so existing carts survive)
  const storagePrefix = `catalog_${catalog.slug}_`;

  // ---- Cart ----
  const cartItemCount = useMemo(() => cart.reduce((sum, item) => sum + item.quantity, 0), [cart]);
  const cartTotal = useMemo(() => formatTotal(cart, priceConfig, lang), [cart, priceConfig, lang]);

  const addToCart = useCallback((item: MenuItem, quantity: number = 1, note?: string) => {
    if (item.is_available === false) return;
    setCart((prev) => {
      const existing = prev.find((i) => i.id === item.id);
      if (existing) {
        return prev.map((i) =>
          i.id === item.id
            ? { ...i, quantity: i.quantity + quantity, note: note !== undefined ? note : i.note }
            : i
        );
      }
      return [
        ...prev,
        {
          id: item.id,
          category_id: item.category_id,
          name_ar: item.name_ar,
          name_en: item.name_en,
          name_fr: item.name_fr,
          price: item.price,
          currency: item.currency,
          image_url: item.image_url,
          quantity,
          note: note || undefined,
        },
      ];
    });
  }, []);

  const removeFromCart = useCallback((itemId: string) => {
    setCart((prev) => prev.filter((i) => i.id !== itemId));
  }, []);

  const updateQuantity = useCallback((itemId: string, quantity: number) => {
    setCart((prev) =>
      quantity <= 0 ? prev.filter((i) => i.id !== itemId) : prev.map((i) => (i.id === itemId ? { ...i, quantity } : i))
    );
  }, []);

  const clearCart = useCallback(() => setCart([]), []);

  // ---- Sheets ----
  // Opening a sheet adds a history entry, so the phone's Back button closes the sheet instead
  // of leaving the menu. Switching between sheets reuses the entry. Next.js keeps its router
  // data in history.state, so it is preserved and only a marker is added.
  const sheetOpenRef = useRef(false);

  const openSheet = useCallback((sheet: MenuSheet) => {
    if (!sheetOpenRef.current) {
      window.history.pushState({ ...window.history.state, menuSheet: true }, "");
      sheetOpenRef.current = true;
    }
    setActiveSheet(sheet);
  }, []);

  const closeSheet = useCallback(() => {
    if (sheetOpenRef.current && window.history.state?.menuSheet) {
      // popstate (below) finishes closing
      window.history.back();
      return;
    }
    sheetOpenRef.current = false;
    setActiveSheet(null);
  }, []);

  useEffect(() => {
    const onPopState = () => {
      sheetOpenRef.current = false;
      setActiveSheet(null);
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  const openItem = useCallback(
    (item: MenuItem) => {
      setSelectedItem(item);
      openSheet("item");
    },
    [openSheet]
  );
  const setIsCartOpen = useCallback((open: boolean) => (open ? openSheet("cart") : closeSheet()), [openSheet, closeSheet]);

  // ---- Language & theme ----
  const setLanguage = useCallback(
    (next: Language) => {
      if (next === lang) return;
      setCookie(`menu_lang_${catalog.slug}`, next);
      // The server renders text and direction, so re-render it in the new language
      router.refresh();
    },
    [lang, catalog.slug, router]
  );

  const toggleTheme = useCallback(() => {
    setTheme((prev) => {
      const next = prev === "dark" ? "light" : "dark";
      setCookie("menu_theme", next);
      return next;
    });
  }, []);

  const setTable = useCallback(
    (value: string) => {
      setTableState(value);
      try {
        sessionStorage.setItem(`${storagePrefix}table`, value);
      } catch {
        // Storage unavailable (private mode); the value still lives in state
      }
    },
    [storagePrefix]
  );

  // ---- Restore state & read QR parameters on mount ----
  useEffect(() => {
    try {
      const savedCart = localStorage.getItem(`${storagePrefix}cart`);
      if (savedCart) {
        const parsed = JSON.parse(savedCart);
        // Drop lines whose dishes are no longer on the menu or are sold out, and refresh prices
        const byId = new Map(menuItems.filter((i) => i.is_available !== false).map((i) => [i.id, i]));
        setCart(
          (Array.isArray(parsed) ? parsed : [])
            .filter((line: CartItem) => byId.has(line.id) && line.quantity > 0)
            .map((line: CartItem) => ({ ...byId.get(line.id)!, quantity: line.quantity, note: line.note }))
        );
      }
    } catch {
      // Ignore an invalid saved cart
    }

    const params = new URLSearchParams(window.location.search);

    // ?table=12 on a table's QR code pre-fills the table number for dine-in orders
    const tableParam = params.get("table");
    let savedTable: string | null = null;
    try {
      savedTable = sessionStorage.getItem(`${storagePrefix}table`);
    } catch {
      // ignore
    }
    if (tableParam) {
      setTable(tableParam.slice(0, 10));
      if (orderTypes.includes("dine_in")) setOrderType("dine_in");
    } else if (savedTable) {
      setTableState(savedTable);
    }

    // ?lang=ar links switch the language once, then the cookie remembers it
    const langParam = params.get("lang") as Language | null;
    if (langParam && enabledLanguages.includes(langParam) && langParam !== lang) {
      params.delete("lang");
      const query = params.toString();
      window.history.replaceState(null, "", `${window.location.pathname}${query ? `?${query}` : ""}${window.location.hash}`);
      setLanguage(langParam);
    }
    // Run once on mount; later changes come from user actions
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(`${storagePrefix}cart`, JSON.stringify(cart));
    } catch {
      // Storage unavailable; the cart still works for this visit
    }
  }, [cart, storagePrefix]);

  const value: CatalogContextType = {
    catalog,
    settings,
    contact,
    operatingHours,
    socialMedia,
    categories,
    menuItems,
    faqs,
    branches,
    lang,
    t,
    dir: lang === "ar" ? "rtl" : "ltr",
    enabledLanguages,
    setLanguage,
    theme,
    toggleTheme,
    colorPrimary: settings?.color_primary || "#0F6B5B",
    priceConfig,
    bookingEnabled,
    orderingEnabled,
    orderTypes,
    orderType,
    setOrderType,
    table,
    setTable,
    cart,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    cartItemCount,
    cartTotal,
    activeSheet,
    openSheet,
    closeSheet,
    selectedItem,
    openItem,
    setIsCartOpen,
    portalContainer,
  };

  return (
    <CatalogContext.Provider value={value}>
      <div
        ref={setPortalContainer}
        className={className}
        style={style}
        lang={lang}
        dir={lang === "ar" ? "rtl" : "ltr"}
        data-theme={theme}
      >
        {children}
      </div>
    </CatalogContext.Provider>
  );
}
