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
import type { AllergenCode, DietaryCode, DishVariant } from "@/lib/catalog/dish-info";

// Menu item interface
export interface MenuItem {
  id: string;
  category_id?: string;
  name_ar: string;
  name_en: string;
  description_ar?: string | null;
  description_en?: string | null;
  price: number;
  currency?: string;
  image_url?: string | null;
  is_featured?: boolean;
  /** False while the dish is sold out: it stays on the menu but can't be ordered */
  is_available?: boolean;
  /** Options with their own price (e.g. Regular / Large); one must be chosen to order */
  variants?: DishVariant[];
  dietary?: DietaryCode[];
  /** null = the restaurant hasn't verified allergens (unknown); [] = verified, none listed */
  allergens?: AllergenCode[] | null;
}

// Cart item interface. The same dish with a different option or special request is kept as a
// separate line, so a line is identified by `key` (dish id + option + note), not by the dish id.
export interface CartItem extends MenuItem {
  key: string;
  quantity: number;
  note?: string;
  /** The chosen option; `price` is then that option's price */
  variant?: DishVariant;
}

/** Most of one line a diner can order (matches the quantity stepper) */
export const MAX_LINE_QUANTITY = 99;

function normalizeNote(note?: string | null): string {
  return (note || "").trim().slice(0, 200);
}

/** Identifies a cart line: the dish, its option and its (trimmed) special request */
export function cartLineKey(itemId: string, note?: string | null, variantId?: string | null): string {
  const normalized = normalizeNote(note);
  const base = variantId ? `${itemId}\u0001${variantId}` : itemId;
  return normalized ? `${base}\u0000${normalized}` : base;
}

/** True when the dish has options, so one must be picked before it can be ordered */
export function needsVariant(item: Pick<MenuItem, "variants">): boolean {
  return (item.variants?.length ?? 0) > 0;
}

function clampQuantity(quantity: number): number {
  return Math.min(MAX_LINE_QUANTITY, Math.max(0, Math.floor(Number(quantity) || 0)));
}

/** How many of a dish are in the order, across all its lines */
export function cartQuantityOf(cart: CartItem[], itemId: string): number {
  return cart.reduce((sum, line) => (line.id === itemId ? sum + line.quantity : sum), 0);
}

export interface MenuCategory {
  id: string;
  name_ar: string;
  name_en: string;
  image_url?: string | null;
}

export interface MenuFaq {
  id: string;
  question_ar: string;
  question_en: string;
  answer_ar: string;
  answer_en: string;
}

export interface MenuBranch {
  id: string;
  name_ar: string;
  name_en: string;
  address_ar: string;
  address_en: string;
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
  /** Adds to the line with the same dish, option and note, or starts a new line. Dishes with
   *  options are only added with a valid option id (returns false otherwise). */
  addToCart: (item: MenuItem, quantity?: number, note?: string, variantId?: string) => boolean;
  /** Set one line's quantity (0 removes it), by line key */
  updateLineQuantity: (lineKey: string, quantity: number) => void;
  /** Remove every line of a dish (used by the AI waiter, which works with dish ids) */
  removeFromCart: (itemId: string) => void;
  /** Set how many of a dish are in the order across its lines (used by the AI waiter) */
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

  const addToCart = useCallback((item: MenuItem, quantity: number = 1, note?: string, variantId?: string) => {
    if (item.is_available === false) return false;
    const amount = clampQuantity(quantity);
    if (amount <= 0) return false;
    const variant = needsVariant(item) ? item.variants!.find((v) => v.id === variantId) : undefined;
    if (needsVariant(item) && !variant) return false;
    const normalized = normalizeNote(note);
    const key = cartLineKey(item.id, normalized, variant?.id);
    setCart((prev) => {
      if (prev.some((line) => line.key === key)) {
        return prev.map((line) =>
          line.key === key ? { ...line, quantity: clampQuantity(line.quantity + amount) } : line
        );
      }
      return [
        ...prev,
        {
          key,
          id: item.id,
          category_id: item.category_id,
          name_ar: item.name_ar,
          name_en: item.name_en,
          price: variant ? variant.price : item.price,
          currency: item.currency,
          image_url: item.image_url,
          quantity: amount,
          note: normalized || undefined,
          variant,
        },
      ];
    });
    return true;
  }, []);

  const updateLineQuantity = useCallback((lineKey: string, quantity: number) => {
    const next = clampQuantity(quantity);
    setCart((prev) =>
      next <= 0
        ? prev.filter((line) => line.key !== lineKey)
        : prev.map((line) => (line.key === lineKey ? { ...line, quantity: next } : line))
    );
  }, []);

  const removeFromCart = useCallback((itemId: string) => {
    setCart((prev) => prev.filter((line) => line.id !== itemId));
  }, []);

  // Dish-level update for the AI waiter: grows the plain line (no note) or the first line,
  // and shrinks from the most recently added lines first.
  const updateQuantity = useCallback((itemId: string, quantity: number) => {
    const target = clampQuantity(quantity);
    setCart((prev) => {
      const lines = prev.filter((line) => line.id === itemId);
      if (lines.length === 0) return prev;
      const current = lines.reduce((sum, line) => sum + line.quantity, 0);
      if (target === current) return prev;
      if (target > current) {
        const grow = lines.find((line) => !line.note) || lines[0];
        return prev.map((line) =>
          line.key === grow.key ? { ...line, quantity: clampQuantity(line.quantity + target - current) } : line
        );
      }
      let excess = current - target;
      const reduced = new Map<string, number>();
      for (const line of [...lines].reverse()) {
        const take = Math.min(line.quantity, excess);
        reduced.set(line.key, line.quantity - take);
        excess -= take;
        if (excess <= 0) break;
      }
      return prev
        .map((line) => (reduced.has(line.key) ? { ...line, quantity: reduced.get(line.key)! } : line))
        .filter((line) => line.quantity > 0);
    });
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
        // Drop lines whose dishes are no longer on the menu or are sold out, and refresh prices.
        // Carts saved by older versions had no line keys (one line per dish); keys are rebuilt
        // from dish id + note, and lines that now share a key are merged.
        const byId = new Map(menuItems.filter((i) => i.is_available !== false).map((i) => [i.id, i]));
        const restored = new Map<string, CartItem>();
        for (const line of Array.isArray(parsed) ? parsed : []) {
          if (!line || typeof line !== "object") continue;
          const item = byId.get(String(line.id));
          const quantity = clampQuantity(line.quantity);
          if (!item || quantity <= 0) continue;
          const note = normalizeNote(typeof line.note === "string" ? line.note : "");
          // A dish with options needs a still-existing option; otherwise the line is dropped
          const savedVariantId = line.variant && typeof line.variant.id === "string" ? line.variant.id : null;
          const variant = needsVariant(item) ? item.variants!.find((v) => v.id === savedVariantId) : undefined;
          if (needsVariant(item) && !variant) continue;
          const key = cartLineKey(item.id, note, variant?.id);
          const existing = restored.get(key);
          restored.set(key, {
            key,
            id: item.id,
            category_id: item.category_id,
            name_ar: item.name_ar,
            name_en: item.name_en,
            price: variant ? variant.price : item.price,
            currency: item.currency,
            image_url: item.image_url,
            quantity: clampQuantity((existing?.quantity || 0) + quantity),
            note: note || undefined,
            variant,
          });
        }
        setCart([...restored.values()]);
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

    // ?lang=ar links switch the language once, then the cookie remembers it. Unsupported values
    // (e.g. an old ?lang=fr link) are dropped and the menu stays in the resolved language.
    const langParam = params.get("lang")?.toLowerCase();
    if (langParam) {
      params.delete("lang");
      const query = params.toString();
      window.history.replaceState(null, "", `${window.location.pathname}${query ? `?${query}` : ""}${window.location.hash}`);
      const next = enabledLanguages.find((code) => code === langParam);
      if (next && next !== lang) setLanguage(next);
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
    updateLineQuantity,
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
