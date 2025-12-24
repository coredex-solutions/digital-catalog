"use client";

import { useState, useEffect, useMemo, useRef, lazy, Suspense } from "react";
// Next.js doesn't use react-router-dom, but we'll keep imports for type compatibility
// Navigation will be handled via Next.js router
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import {
  ShoppingCart,
  Search,
  X,
  ChevronLeft,
  ChevronRight,
  Plus,
  Minus,
  MessageCircle,
  MapPin,
  Utensils,
  Coffee,
  Check,
  ArrowRight,
  Moon,
  Sun,
  Calendar,
  Clock,
  Users,
  FileText,
  ChevronDown,
  Phone,
  Instagram,
  Facebook,
  Info,
  Receipt,
  Home,
} from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
// Lazy load LiveChat for better performance
const ChatComponent = lazy(() =>
  import("./components/LiveChat").then((module) => ({
    default: module.LiveChat,
  }))
);
// Import pages
import { LanguageSelectionPage } from "./views/LanguageSelectionPage";
import { HomePage } from "./views/HomePage";
// Import types
import type { Language } from "./types";
// Import hooks
import { useImagePreloader } from "./hooks/useImagePreloader";
import { useNextRouter } from "./hooks/useNextRouter";
import { useParams as useNextParams } from "next/navigation";

/**
 * RESTAURANT CONFIGURATION
 */
export const RESTAURANT_CONFIG = {
  name: {
    ar: "مطعم متَبل",
    en: "Mtabal",
    fr: "Mtabal",
  },
  logo: "/transparent-bg-mtabal.webp", // Full logo
  logoEn: "/transparent-bg-mtabal-en-large.webp", // English minimalistic
  logoAr: "/transparent-bg-mtabal-ar.webp", // Arabic text
  image:
    "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200&h=800&fit=crop&q=80",
  whatsapp: "9647718006006",
  phone: "07818006006",
  email: "info@mtabal.restaurant",
  address: {
    ar: "بغداد - زيونة - شارع الخدمي",
    en: "Baghdad - Zayouna - Service Street",
    fr: "Bagdad - Zayouna - Rue de Service",
  },
  addressFull: {
    ar: "الفرع الرئيسي: بغداد - زيونة - شارع الخدمي مقابل ملعب الشعب داخل فرع مطعم ويست بركر",
    en: "Main Branch: Baghdad - Zayouna - Service Street opposite Al-Shaab Stadium inside West Burger",
    fr: "Branche Principale: Bagdad - Zayouna - Rue de Service en face du stade Al-Shaab",
  },
  branches: [
    {
      name: {
        ar: "الفرع الرئيسي",
        en: "Main Branch",
        fr: "Branche Principale",
      },
      address: {
        ar: "بغداد - زيونة - شارع الخدمي مقابل ملعب الشعب داخل فرع مطعم ويست بركر",
        en: "Baghdad - Zayouna - Service Street opposite Al-Shaab Stadium inside West Burger",
        fr: "Bagdad - Zayouna - Rue de Service en face du stade Al-Shaab",
      },
      phone: ["078 1800 6006", "077 1800 6006"],
      mapUrl:
        "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3283.8171362888916!2d43.67579277630874!3d34.60878528813813!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x15515100637877f5%3A0xc8e85733d4ff0d13!2z2YXYt9i52YUg2YXYqtio2YQg2YHYsdi5INiq2YPYsdmK2Ko!5e0!3m2!1sen!2slb!4v1763992585095!5m2!1sen!2slb",
    },
    {
      name: { ar: "الفرع الثاني", en: "Second Branch", fr: "Deuxième Branche" },
      address: {
        ar: "صلاح الدين - تكريت - شارع الرئيسي موصل تكريت مجاور مركز شرطة تكريت",
        en: "Salah Al-Din - Tikrit - Main Street Mosul-Tikrit next to Tikrit Police Station",
        fr: "Salah Al-Din - Tikrit - Rue Principale Mossoul-Tikrit à côté du poste de police de Tikrit",
      },
      phone: ["078 26333310", "077 26333310"],
      mapUrl: "", // Using main branch map for now or generic
    },
  ],
  // Operating hours (24-hour format)
  operatingHours: {
    sunday: { open: 11, close: 23.5 }, // 11 AM - 11:30 PM
    monday: { open: 11, close: 23.5 }, // 11 AM - 11:30 PM
    tuesday: { open: 11, close: 23.5 }, // 11 AM - 11:30 PM
    wednesday: { open: 11, close: 23.5 }, // 11 AM - 11:30 PM
    thursday: { open: 11, close: 23.5 }, // 11 AM - 11:30 PM
    friday: { open: 11, close: 23.5 }, // 11 AM - 11:30 PM
    saturday: { open: 11, close: 23.5 }, // 11 AM - 11:30 PM
  },
  socialMedia: {
    instagram: "https://instagram.com/mtabal.restaurant",
    facebook: "https://facebook.com/mtabalrestaurant",
    tiktok: "https://tiktok.com/@mtabal.restaurant",
    youtube: "", // Removed as not provided
  },
};

// Helper function to check if restaurant is currently open
function isRestaurantOpen(): boolean {
  const now = new Date();
  const days = [
    "sunday",
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
  ];
  const currentDay = days[
    now.getDay()
  ] as keyof typeof RESTAURANT_CONFIG.operatingHours;
  const currentHour = now.getHours();
  const hours = RESTAURANT_CONFIG.operatingHours[currentDay];

  if (!hours) return false;
  return currentHour >= hours.open && currentHour < hours.close;
}

/**
 * UTILITIES
 */
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Format Price (Iraqi Dinar)
const formatPrice = (price: number, lang: string) => {
  return new Intl.NumberFormat(lang === "ar" ? "ar-IQ" : "en-US", {
    style: "currency",
    currency: "IQD",
    maximumFractionDigits: 0,
  }).format(price);
};

// Format Hours to AM/PM
const formatHours = (hour: number): string => {
  const hours = Math.floor(hour);
  const minutes = hour % 1 === 0.5 ? 30 : 0;
  const period = hours >= 12 ? "PM" : "AM";
  const displayHour = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;

  if (minutes === 30) {
    return `${displayHour}:30 ${period}`;
  }
  return `${displayHour} ${period}`;
};

/**
 * MENU DATA
 */
const CATEGORIES = [
  {
    id: "chicken_meals_rice",
    ar: "وجبات دجاج متبل مع الأرز",
    en: "Marinated Chicken Meals with Rice",
    fr: "Repas de Poulet Mariné avec Riz",
    icon: Utensils,
  },
  {
    id: "stews_sauces",
    ar: "المرق والصلصات",
    en: "Stews and Sauces",
    fr: "Ragoûts et Sauces",
    icon: Utensils,
  },
  {
    id: "additions_salads",
    ar: "الإضافات والسلطات",
    en: "Additions and Salads",
    fr: "Suppléments et Salades",
    icon: Utensils,
  },
  {
    id: "charcoal_sandwiches",
    ar: "سندويشات متبل عالفحم",
    en: "Charcoal Grilled Marinated Sandwiches",
    fr: "Sandwichs Marinés Grillés au Charbon",
    icon: Utensils,
  },
  {
    id: "rice",
    ar: "الأرز",
    en: "Rice",
    fr: "Riz",
    icon: Utensils,
  },
  {
    id: "drinks",
    ar: "المشروبات",
    en: "Drinks",
    fr: "Boissons",
    icon: Coffee,
  },
  {
    id: "mansaf",
    ar: "مناسف الدجاج بالمكسرات على صينية",
    en: "Chicken Mansaf with Nuts on a Tray",
    fr: "Mansaf de Poulet aux Noix sur Plateau",
    icon: Utensils,
  },
  {
    id: "stuffed_chicken",
    ar: "دجاج محشي بالكسكس مع الخضروات",
    en: "Stuffed Chicken with Couscous and Vegetables",
    fr: "Poulet Farci au Couscous avec Légumes",
    icon: Utensils,
  },
  {
    id: "pressure_grilled",
    ar: "دجاج متبل مشوي مضغوط",
    en: "Pressure Cooked Marinated Grilled Chicken",
    fr: "Poulet Mariné Grillé à Pression",
    icon: Utensils,
  },
  {
    id: "charcoal_marinated",
    ar: "دجاج عالفحم",
    en: "Chicken on Charcoal",
    fr: "Poulet sur Charbon",
    icon: Utensils,
  },
  {
    id: "charcoal_bbq",
    ar: "مشاوي دجاج عالفحم",
    en: "Charcoal Grilled Chicken BBQ",
    fr: "BBQ de Poulet Grillés au Charbon",
    icon: Utensils,
  },
  {
    id: "wings",
    ar: "أجنحة دجاج متبل",
    en: "Marinated Chicken Wings",
    fr: "Ailes de Poulet Marinées",
    icon: Utensils,
  },
  {
    id: "sumac_chicken",
    ar: "دجاج بالسماك عالفحم",
    en: "Chicken with Sumac on Charcoal",
    fr: "Poulet au Sumac sur Charbon",
    icon: Utensils,
  },
];

const COMMON_MODIFIERS = [
  {
    id: "m_bread",
    name_ar: "خبز إضافي",
    name_en: "Extra Bread",
    name_fr: "Pain Supplémentaire",
    price: 500,
  },
  {
    id: "m_pickles",
    name_ar: "طرشي إضافي",
    name_en: "Extra Pickles",
    name_fr: "Cornichons",
    price: 500,
  },
];

const RICE_MODIFIERS = [
  ...COMMON_MODIFIERS,
  {
    id: "m_garlic",
    name_ar: "ثومية إضافية",
    name_en: "Extra Garlic Sauce",
    name_fr: "Sauce Ail",
    price: 1000,
  },
  {
    id: "m_stew",
    name_ar: "مرق إضافي",
    name_en: "Extra Stew",
    name_fr: "Ragoût Supplémentaire",
    price: 1500,
  },
];

const SANDWICH_MODIFIERS = [
  ...COMMON_MODIFIERS,
  {
    id: "m_cheese",
    name_ar: "جبن",
    name_en: "Cheese",
    name_fr: "Fromage",
    price: 1000,
  },
  {
    id: "m_fries",
    name_ar: "بطاطا داخل الصاج",
    name_en: "Fries inside",
    name_fr: "Frites à l'intérieur",
    price: 500,
  },
];

const GRILL_MODIFIERS = [
  ...COMMON_MODIFIERS,
  {
    id: "m_garlic",
    name_ar: "ثومية إضافية",
    name_en: "Extra Garlic Sauce",
    name_fr: "Sauce Ail",
    price: 1000,
  },
  {
    id: "m_spicy",
    name_ar: "تتبيلة حارة",
    name_en: "Spicy Marinade",
    name_fr: "Marinade Épicée",
    price: 0,
  },
];

// Generate Items based on User Text Data
const MENU_ITEMS_RAW = [
  // Category 1: وجبات دجاج متبل مع الأرز
  {
    cat: "chicken_meals_rice",
    names: {
      ar: "نفر مقلوبة دجاج",
      en: "Chicken Maqluba Portion",
      fr: "Portion Maqluba Poulet",
    },
    desc: {
      ar: "طبق أرز – باذنجان – بصل – وفلفل – دجاج مشوي – صلصة – بصل",
      en: "Rice plate – Eggplant – Onion – and Pepper – Grilled Chicken – Sauce – Onion",
      fr: "Assiette de riz – Aubergine – Oignon – et Poivre – Poulet Grillé – Sauce – Oignon",
    },
    price: 8000,
    img: "https://images.unsplash.com/photo-1626804475313-973030f8109e?w=400&h=300&fit=crop&q=80",
  },
  {
    cat: "chicken_meals_rice",
    names: {
      ar: "وجبة دجاج بالكاري مع الأرز",
      en: "Chicken Curry Meal with Rice",
      fr: "Repas Curry Poulet avec Riz",
    },
    desc: {
      ar: "طبق أرز – صلصة الكاري بالدجاج المشوي – ثومية – طرشي – خبز",
      en: "Rice plate – Curry sauce with grilled chicken – Garlic sauce – Pickles – Bread",
      fr: "Assiette de riz – Sauce Curry au Poulet Grillé – Sauce Ail – Cornichons – Pain",
    },
    price: 7500,
    img: "https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=400&h=300&fit=crop&q=80",
  },
  {
    cat: "chicken_meals_rice",
    names: {
      ar: "وجبة دجاج بالبطاطا والليمون",
      en: "Chicken with Potatoes and Lemon Meal",
      fr: "Repas Poulet avec Pommes de Terre et Citron",
    },
    desc: {
      ar: "طبق أرز – دجاج – بطاطا – ليمون – ثومية – طرشي – خبز",
      en: "Rice plate – Chicken – Potatoes – Lemon – Garlic sauce – Pickles – Bread",
      fr: "Assiette de riz – Poulet – Pommes de terre – Citron – Sauce Ail – Cornichons – Pain",
    },
    price: 7500,
    img: "https://images.unsplash.com/photo-1604908177453-7462950a6a3b?w=400&h=300&fit=crop&q=80",
  },
  {
    cat: "chicken_meals_rice",
    names: { ar: "علبة السعادة", en: "Happiness Box", fr: "Boîte du Bonheur" },
    desc: {
      ar: "دجاج مسحب – فطر – صلصة – جبن",
      en: "Pulled chicken – Mushroom – Sauce – Cheese",
      fr: "Poulet effiloché – Champignon – Sauce – Fromage",
    },
    price: 6000,
    img: "https://images.unsplash.com/photo-1542574621-e088a4464f7e?w=400&h=300&fit=crop&q=80",
  },

  // Category 2: المرق والصلصات
  {
    cat: "stews_sauces",
    names: { ar: "مرقة الفاصوليا", en: "Bean Stew", fr: "Ragoût de Haricots" },
    desc: {
      ar: "مرقة فاصوليا",
      en: "Bean stew",
      fr: "Ragoût de haricots",
    },
    price: 1500,
    img: "https://images.unsplash.com/photo-1547592180-85f173990554?w=400&h=300&fit=crop&q=80",
  },
  {
    cat: "stews_sauces",
    names: {
      ar: "مرقة الباذنجان",
      en: "Eggplant Stew",
      fr: "Ragoût d'Aubergine",
    },
    desc: {
      ar: "مرقة باذنجان",
      en: "Eggplant stew",
      fr: "Ragoût d'aubergine",
    },
    price: 2000,
    img: "https://images.unsplash.com/photo-1528796940112-4979b4a98424?w=400&h=300&fit=crop&q=80",
  },
  {
    cat: "stews_sauces",
    names: {
      ar: "صلصة البطاطا بالليمون",
      en: "Potato Sauce with Lemon",
      fr: "Sauce Pomme de Terre au Citron",
    },
    desc: {
      ar: "صلصة البطاطا بالليمون",
      en: "Potato sauce with lemon",
      fr: "Sauce pomme de terre au citron",
    },
    price: 2000,
    img: "https://images.unsplash.com/photo-1573080496987-a199f8cd75ec?w=400&h=300&fit=crop&q=80",
  },
  {
    cat: "stews_sauces",
    names: { ar: "صلصة الكاري", en: "Curry Sauce", fr: "Sauce Curry" },
    desc: {
      ar: "صلصة الكاري",
      en: "Curry sauce",
      fr: "Sauce curry",
    },
    price: 2000,
    img: "https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=400&h=300&fit=crop&q=80",
  },
  {
    cat: "stews_sauces",
    names: { ar: "صلصة الفطر", en: "Mushroom Sauce", fr: "Sauce Champignons" },
    desc: {
      ar: "صلصة الفطر",
      en: "Mushroom sauce",
      fr: "Sauce champignons",
    },
    price: 2000,
    img: "https://images.unsplash.com/photo-1604908177453-7462950a6a3b?w=400&h=300&fit=crop&q=80",
  },
  {
    cat: "stews_sauces",
    names: { ar: "شوربة الدجاج", en: "Chicken Soup", fr: "Soupe de Poulet" },
    desc: {
      ar: "شوربة الدجاج",
      en: "Chicken soup",
      fr: "Soupe de poulet",
    },
    price: 1000,
    img: "https://images.unsplash.com/photo-1547592180-85f173990554?w=400&h=300&fit=crop&q=80",
  },

  // Category 3: الإضافات والسلطات
  {
    cat: "additions_salads",
    names: {
      ar: "صحن مقبلات صغير",
      en: "Small Appetizer Plate",
      fr: "Petite Assiette d'Apéritif",
    },
    desc: {
      ar: "صحن مقبلات صغير",
      en: "Small appetizer plate",
      fr: "Petite assiette d'apéritif",
    },
    price: 3000,
    img: "https://images.unsplash.com/photo-1541529086526-db283c563270?w=400&h=300&fit=crop&q=80",
  },
  {
    cat: "additions_salads",
    names: {
      ar: "صحن مقبلات مشكل",
      en: "Mixed Appetizer Plate",
      fr: "Assiette d'Apéritif Mixte",
    },
    desc: {
      ar: "صحن مقبلات مشكل",
      en: "Mixed appetizer plate",
      fr: "Assiette d'apéritif mixte",
    },
    price: 6000,
    img: "https://images.unsplash.com/photo-1579631542720-3a87824fff86?w=400&h=300&fit=crop&q=80",
  },
  {
    cat: "additions_salads",
    names: {
      ar: "حمص بطحينة",
      en: "Hummus with Tahini",
      fr: "Houmous au Tahini",
    },
    desc: {
      ar: "حمص بطحينة",
      en: "Hummus with tahini",
      fr: "Houmous au tahini",
    },
    price: 2000,
    img: "https://images.unsplash.com/photo-1547592180-85f173990554?w=400&h=300&fit=crop&q=80",
  },
  {
    cat: "additions_salads",
    names: {
      ar: "سلطة خضراء بالنعناع",
      en: "Green Salad with Mint",
      fr: "Salade Verte à la Menthe",
    },
    desc: {
      ar: "سلطة خضراء بالنعناع",
      en: "Green salad with mint",
      fr: "Salade verte à la menthe",
    },
    price: 3000,
    img: "https://images.unsplash.com/photo-1541529086526-db283c563270?w=400&h=300&fit=crop&q=80",
  },
  {
    cat: "additions_salads",
    names: { ar: "علبة بطاطا", en: "Fries Box", fr: "Boîte de Frites" },
    desc: {
      ar: "علبة بطاطا",
      en: "Fries box",
      fr: "Boîte de frites",
    },
    price: 2000,
    img: "https://images.unsplash.com/photo-1573080496987-a199f8cd75ec?w=400&h=300&fit=crop&q=80",
  },
  {
    cat: "additions_salads",
    names: {
      ar: "حشوة",
      en: "Filling",
      fr: "Farce",
    },
    desc: {
      ar: "مكسرات وشعيرية وبازليا وجزر",
      en: "Nut, vermicelli, pea, and carrot",
      fr: "aux noix, vermicelles, petits pois et carottes",
    },
    price: 3000,
    img: "https://images.unsplash.com/photo-1541529086526-db283c563270?w=400&h=300&fit=crop&q=80",
  },
  {
    cat: "additions_salads",
    names: { ar: "إضافة مكسرات", en: "Add Nuts", fr: "Ajouter des Noix" },
    desc: {
      ar: "إضافة مكسرات",
      en: "Add nuts",
      fr: "Ajouter des noix",
    },
    price: 1000,
    img: "https://images.unsplash.com/photo-1541529086526-db283c563270?w=400&h=300&fit=crop&q=80",
  },

  // Category 4: سندويشات متبل عالفحم
  {
    cat: "charcoal_sandwiches",
    names: {
      ar: "صاج دجاج مسحب عالفحم",
      en: "Charcoal Pulled Chicken Saj",
      fr: "Saj Poulet Effiloché au Charbon",
    },
    desc: {
      ar: "سندويش صاج دجاج مسحب مشوي عالفحم",
      en: "Pulled chicken saj sandwich grilled on charcoal",
      fr: "Sandwich Saj au poulet effiloché grillé au charbon",
    },
    price: 4000,
    img: "https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=400&h=300&fit=crop&q=80",
  },
  {
    cat: "charcoal_sandwiches",
    names: {
      ar: "صاج شيش طاووق",
      en: "Saj Shish Tawook",
      fr: "Saj Shish Taouk",
    },
    desc: {
      ar: "صاج شيش طاووق",
      en: "Saj shish tawook",
      fr: "Saj shish taouk",
    },
    price: 5000,
    img: "https://images.unsplash.com/photo-1529006557810-27448b22ce5e?w=400&h=300&fit=crop&q=80",
  },
  {
    cat: "charcoal_sandwiches",
    names: {
      ar: "وجبة صاج دجاج مسحب عالفحم",
      en: "Saj Pulled Chicken on Charcoal Meal",
      fr: "Repas Saj Poulet Effiloché sur Charbon",
    },
    desc: {
      ar: "شاش شيش طاووق مقطع – بطاطا – ثومية – طرشي – خبز – مخلل – سكر مع بسبس",
      en: "Cut shish tawook saj – Potatoes – Garlic sauce – Pickles – Bread – Pickles – Sugar with Pepsi",
      fr: "Saj shish taouk coupé – Pommes de terre – Sauce Ail – Cornichons – Pain – Cornichons – Sucre avec Pepsi",
    },
    price: 6500,
    img: "https://images.unsplash.com/photo-1561043433-aaf687c4cf04?w=400&h=300&fit=crop&q=80",
  },
  {
    cat: "charcoal_sandwiches",
    names: {
      ar: "وجبة صاج شيش طاووق",
      en: "Saj Shish Tawook Meal",
      fr: "Repas Saj Shish Taouk",
    },
    desc: {
      ar: "نفس مكونات الوجبة السابقة مع تغيير نوع البروتين",
      en: "Same ingredients as previous meal with different protein type",
      fr: "Mêmes ingrédients que le repas précédent avec un type de protéine différent",
    },
    price: 7500,
    img: "https://images.unsplash.com/photo-1600891964599-f61ba0e24092?w=400&h=300&fit=crop&q=80",
  },

  // Category 5: الأرز
  {
    cat: "rice",
    names: { ar: "طبق أرز", en: "Rice Plate", fr: "Assiette de Riz" },
    desc: {
      ar: "طبق أرز",
      en: "Rice plate",
      fr: "Assiette de riz",
    },
    price: 2500,
    img: "https://images.unsplash.com/photo-1596560548464-f010549b84d7?w=400&h=300&fit=crop&q=80",
  },
  {
    cat: "rice",
    names: {
      ar: "صينية أرز وسط",
      en: "Medium Rice Tray",
      fr: "Plateau de Riz Moyen",
    },
    desc: {
      ar: "صينية أرز وسط",
      en: "Medium rice tray",
      fr: "Plateau de riz moyen",
    },
    price: 3500,
    img: "https://images.unsplash.com/photo-1596560548464-f010549b84d7?w=400&h=300&fit=crop&q=80",
  },
  {
    cat: "rice",
    names: {
      ar: "صينية أرز كبيرة",
      en: "Large Rice Tray",
      fr: "Grand Plateau de Riz",
    },
    desc: {
      ar: "صينية أرز كبيرة",
      en: "Large rice tray",
      fr: "Grand plateau de riz",
    },
    price: 5000,
    img: "https://images.unsplash.com/photo-1596560548464-f010549b84d7?w=400&h=300&fit=crop&q=80",
  },
  {
    cat: "rice",
    names: {
      ar: "وجبة أرز مع مرقتين",
      en: "Rice Meal with Two Stews",
      fr: "Repas Riz avec Deux Ragoûts",
    },
    desc: {
      ar: "طبق أرز – نوعين مرق – ثومية – طرشي – حمص بطحينة",
      en: "Rice plate – Two types of stew – Garlic sauce – Pickles – Hummus",
      fr: "Assiette de riz – Deux sortes de ragoût – Sauce Ail – Cornichons – Houmous",
    },
    price: 4000,
    img: "https://images.unsplash.com/photo-1512058564366-18510be2db19?w=400&h=300&fit=crop&q=80",
  },

  // Category 6: المشروبات
  {
    cat: "drinks",
    names: {
      ar: "بيبسي – سفن – ميرندا – لبن",
      en: "Pepsi – 7UP – Miranda – Laban",
      fr: "Pepsi – 7UP – Miranda – Laban",
    },
    desc: {
      ar: "بيبسي – سفن – ميرندا – لبن",
      en: "Pepsi – 7UP – Miranda – Laban",
      fr: "Pepsi – 7UP – Miranda – Laban",
    },
    price: 750,
    img: "https://images.unsplash.com/photo-1629203851122-3726ecdf080e?w=400&h=300&fit=crop&q=80",
  },
  {
    cat: "drinks",
    names: { ar: "ماء", en: "Water", fr: "Eau" },
    desc: {
      ar: "ماء",
      en: "Water",
      fr: "Eau",
    },
    price: 500,
    img: "https://images.unsplash.com/photo-1564419320461-6870880221ad?w=400&h=300&fit=crop&q=80",
  },

  // Category 7: مناسف الدجاج بالمكسرات على صينية
  {
    cat: "mansaf",
    names: {
      ar: "منسف دجاجة مشوية صينية كبيرة",
      en: "Large Grilled Chicken Mansaf Tray",
      fr: "Grand Plateau Mansaf Poulet Grillé",
    },
    desc: {
      ar: "دجاجة – صينية أرز كبيرة – شعيرية – مكسرات – مرق مشكل – بطاطا – ثومية – طرشي – خبز",
      en: "Chicken – Large rice tray – Vermicelli – Nuts – Mixed stew – Potatoes – Garlic sauce – Pickles – Bread",
      fr: "Poulet – Grand plateau de riz – Vermicelles – Noix – Ragoût mixte – Pommes de terre – Sauce Ail – Cornichons – Pain",
    },
    price: 27000,
    img: "https://images.unsplash.com/photo-1574484284008-95d6e17956df?w=400&h=300&fit=crop&q=80",
  },
  {
    cat: "mansaf",
    names: {
      ar: "منسف نصف دجاجة مشوية",
      en: "Half Grilled Chicken Mansaf",
      fr: "Mansaf Demi-Poulet Grillé",
    },
    desc: {
      ar: "نصف دجاجة – صينية أرز – شعيرية – مكسرات – مرق مشكل – بطاطا – ثومية – طرشي – خبز",
      en: "Half chicken – Rice tray – Vermicelli – Nuts – Mixed stew – Potatoes – Garlic sauce – Pickles – Bread",
      fr: "Demi-poulet – Plateau de riz – Vermicelles – Noix – Ragoût mixte – Pommes de terre – Sauce Ail – Cornichons – Pain",
    },
    price: 16000,
    img: "https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?w=400&h=300&fit=crop&q=80",
  },
  {
    cat: "mansaf",
    names: {
      ar: "منسف دجاجة محشية صينية كبيرة",
      en: "Large Stuffed Chicken Mansaf Tray",
      fr: "Grand Plateau Mansaf Poulet Farci",
    },
    desc: {
      ar: "دجاجة محشية – صينية أرز كبيرة – شعيرية – مكسرات – مرق مشكل – بطاطا – ثومية – طرشي – خبز",
      en: "Stuffed chicken – Large rice tray – Vermicelli – Nuts – Mixed stew – Potatoes – Garlic sauce – Pickles – Bread",
      fr: "Poulet farci – Grand plateau de riz – Vermicelles – Noix – Ragoût mixte – Pommes de terre – Sauce Ail – Cornichons – Pain",
    },
    price: 30000,
    img: "https://images.unsplash.com/photo-1604908177212-7462950a6a3b?w=400&h=300&fit=crop&q=80",
  },
  {
    cat: "mansaf",
    names: {
      ar: "منسف نصف دجاجة محشية بالكسكس",
      en: "Half Stuffed Chicken Mansaf with Couscous",
      fr: "Mansaf Demi-Poulet Farci au Couscous",
    },
    desc: {
      ar: "نصف دجاجة محشية – شعيرية – مكسرات – صلصات – مرق مشكل – بطاطا – ثومية – طرشي – خبز",
      en: "Half stuffed chicken – Vermicelli – Nuts – Sauces – Mixed stew – Potatoes – Garlic sauce – Pickles – Bread",
      fr: "Demi-poulet farci – Vermicelles – Noix – Sauces – Ragoût mixte – Pommes de terre – Sauce Ail – Cornichons – Pain",
    },
    price: 17000,
    img: "https://images.unsplash.com/photo-1604908177212-7462950a6a3b?w=400&h=300&fit=crop&q=80",
  },
  {
    cat: "mansaf",
    names: {
      ar: "منسف دجاجة عالفحم (8 قطع)",
      en: "Charcoal Chicken Mansaf (8 pieces)",
      fr: "Mansaf Poulet au Charbon (8 pièces)",
    },
    desc: {
      ar: "نص دجاجة – أرز – شعيرية – مكسرات – مرق مشكل – بطاطا – ثومية – طرشي – خبز",
      en: "Half chicken – Rice – Vermicelli – Nuts – Mixed stew – Potatoes – Garlic sauce – Pickles – Bread",
      fr: "Demi-poulet – Riz – Vermicelles – Noix – Ragoût mixte – Pommes de terre – Sauce Ail – Cornichons – Pain",
    },
    price: 27000,
    img: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400&h=300&fit=crop&q=80",
  },
  {
    cat: "mansaf",
    names: {
      ar: "منسف نصف دجاجة عالفحم (4 قطع)",
      en: "Half Charcoal Chicken Mansaf (4 pieces)",
      fr: "Mansaf Demi-Poulet au Charbon (4 pièces)",
    },
    desc: {
      ar: "نفس المكونات بحجم أصغر",
      en: "Same ingredients in smaller size",
      fr: "Mêmes ingrédients en taille plus petite",
    },
    price: 16000,
    img: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400&h=300&fit=crop&q=80",
  },

  // Category 8: دجاج محشي بالكسكس مع الخضروات

  {
    cat: "pressure_grilled",
    names: {
      ar: "دجاجة مشوية كاملة",
      en: "Whole Grilled Chicken",
      fr: "Poulet Grillé Entier",
    },
    desc: {
      ar: "دجاجة – رز – شعيرية – بطاطا – ثومية – طرشي – خبز",
      en: "Chicken – Rice – Vermicelli – Potatoes – Garlic sauce – Pickles – Bread",
      fr: "Poulet – Riz – Vermicelles – Pommes de terre – Sauce Ail – Cornichons – Pain",
    },
    price: 17000,
    img: "https://images.unsplash.com/photo-1598103721382-ae42d0d74e61?w=400&h=300&fit=crop&q=80",
  },
  {
    cat: "pressure_grilled",
    names: {
      ar: "نصف دجاجة مشوية",
      en: "Half Grilled Chicken",
      fr: "Demi-Poulet Grillé",
    },
    desc: {
      ar: "نصف دجاجة – رز – شعيرية – بطاطا – ثومية – طرشي – خبز",
      en: "Half chicken – Rice – Vermicelli – Potatoes – Garlic sauce – Pickles – Bread",
      fr: "Demi-poulet – Riz – Vermicelles – Pommes de terre – Sauce Ail – Cornichons – Pain",
    },
    price: 9000,
    img: "https://images.unsplash.com/photo-1532550907401-a500c9a57435?w=400&h=300&fit=crop&q=80",
  },
  {
    cat: "pressure_grilled",
    names: {
      ar: "ربع دجاجة مشوية",
      en: "Quarter Grilled Chicken",
      fr: "Quart de Poulet Grillé",
    },
    desc: {
      ar: "ربع دجاجة مشوية",
      en: "Quarter grilled chicken",
      fr: "Quart de poulet grillé",
    },
    price: 6500,
    img: "https://images.unsplash.com/photo-1532550907401-a500c9a57435?w=400&h=300&fit=crop&q=80",
  },
  {
    cat: "pressure_grilled",
    names: {
      ar: "دجاجة مشوية كاملة مع الأرز",
      en: "Whole Grilled Chicken with Rice",
      fr: "Poulet Grillé Entier avec Riz",
    },
    desc: {
      ar: "دجاجة مشوية كاملة مع الأرز",
      en: "Whole grilled chicken with rice",
      fr: "Poulet grillé entier avec riz",
    },
    price: 20000,
    img: "https://images.unsplash.com/photo-1610057099443-fde8c4d50f91?w=400&h=300&fit=crop&q=80",
  },
  {
    cat: "pressure_grilled",
    names: {
      ar: "نصف دجاجة مشوية مع الأرز",
      en: "Half Grilled Chicken with Rice",
      fr: "Demi-Poulet Grillé avec Riz",
    },
    desc: {
      ar: "نصف دجاجة مشوية مع الأرز",
      en: "Half grilled chicken with rice",
      fr: "Demi-poulet grillé avec riz",
    },
    price: 11000,
    img: "https://images.unsplash.com/photo-1610057099443-fde8c4d50f91?w=400&h=300&fit=crop&q=80",
  },
  {
    cat: "pressure_grilled",
    names: {
      ar: "ربع دجاجة مشوية مع الأرز",
      en: "Quarter Grilled Chicken with Rice",
      fr: "Quart de Poulet Grillé avec Riz",
    },
    desc: {
      ar: "ربع دجاجة مشوية مع الأرز",
      en: "Quarter grilled chicken with rice",
      fr: "Quart de poulet grillé avec riz",
    },
    price: 6500,
    img: "https://images.unsplash.com/photo-1610057099443-fde8c4d50f91?w=400&h=300&fit=crop&q=80",
  },

  // Category 10: دجاج عالفحم
  {
    cat: "charcoal_marinated",
    names: {
      ar: "دجاجة عالفحم كاملة",
      en: "Whole Chicken on Charcoal",
      fr: "Poulet Entier sur Charbon",
    },
    desc: {
      ar: "دجاجة عالفحم كاملة (8 قطع)",
      en: "Whole chicken on charcoal (8 pieces)",
      fr: "Poulet entier sur charbon (8 pièces)",
    },
    price: 17000,
    img: "https://images.unsplash.com/photo-1527477396000-e27163b481c2?w=400&h=300&fit=crop&q=80",
  },
  {
    cat: "charcoal_marinated",
    names: {
      ar: "نصف دجاجة عالفحم",
      en: "Half Chicken on Charcoal",
      fr: "Demi-Poulet sur Charbon",
    },
    desc: {
      ar: "نصف دجاجة عالفحم (4 قطع)",
      en: "Half chicken on charcoal (4 pieces)",
      fr: "Demi-poulet sur charbon (4 pièces)",
    },
    price: 9000,
    img: "https://images.unsplash.com/photo-1527477396000-e27163b481c2?w=400&h=300&fit=crop&q=80",
  },
  {
    cat: "charcoal_marinated",
    names: {
      ar: "ربع دجاجة عالفحم",
      en: "Quarter Chicken on Charcoal",
      fr: "Quart de Poulet sur Charbon",
    },
    desc: {
      ar: "ربع دجاجة عالفحم",
      en: "Quarter chicken on charcoal",
      fr: "Quart de poulet sur charbon",
    },
    price: 6500,
    img: "https://images.unsplash.com/photo-1527477396000-e27163b481c2?w=400&h=300&fit=crop&q=80",
  },
  {
    cat: "charcoal_marinated",
    names: {
      ar: "دجاجة عالفحم مع الأرز",
      en: "Chicken on Charcoal with Rice",
      fr: "Poulet sur Charbon avec Riz",
    },
    desc: {
      ar: "دجاجة عالفحم مع الأرز (8 قطع)",
      en: "Chicken on charcoal with rice (8 pieces)",
      fr: "Poulet sur charbon avec riz (8 pièces)",
    },
    price: 20000,
    img: "https://images.unsplash.com/photo-1527477396000-e27163b481c2?w=400&h=300&fit=crop&q=80",
  },
  {
    cat: "charcoal_marinated",
    names: {
      ar: "نصف دجاجة عالفحم مع الأرز",
      en: "Half Chicken on Charcoal with Rice",
      fr: "Demi-Poulet sur Charbon avec Riz",
    },
    desc: {
      ar: "نصف دجاجة عالفحم مع الأرز (4 قطع)",
      en: "Half chicken on charcoal with rice (4 pieces)",
      fr: "Demi-poulet sur charbon avec riz (4 pièces)",
    },
    price: 11000,
    img: "https://images.unsplash.com/photo-1527477396000-e27163b481c2?w=400&h=300&fit=crop&q=80",
  },

  // Category 11: مشاوي دجاج عالفحم
  {
    cat: "charcoal_bbq",
    names: {
      ar: "وجبة شيش طاووق",
      en: "Shish Tawook Meal",
      fr: "Repas Shish Taouk",
    },
    desc: {
      ar: "يقدم مع أرز أو بطاطا، ثومية، طرشي، خبز",
      en: "Served with rice or potatoes, garlic sauce, pickles, bread",
      fr: "Servi avec riz ou pommes de terre, sauce à l'ail, cornichons, pain",
    },
    price: 7500,
    img: "https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?w=400&h=300&fit=crop&q=80",
  },
  {
    cat: "charcoal_bbq",
    names: {
      ar: "كيلو شيش طاووق",
      en: "Kilo Shish Tawook",
      fr: "Kilo Shish Taouk",
    },
    desc: {
      ar: "كيلو شيش طاووق",
      en: "Kilo shish tawook",
      fr: "Kilo shish taouk",
    },
    price: 18500,
    img: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400&h=300&fit=crop&q=80",
  },
  {
    cat: "charcoal_bbq",
    names: {
      ar: "كيلو أجنحة مع شيش طاووق",
      en: "Kilo Wings with Shish Tawook",
      fr: "Kilo Ailes avec Shish Taouk",
    },
    desc: {
      ar: "كيلو أجنحة مع شيش طاووق",
      en: "Kilo wings with shish tawook",
      fr: "Kilo ailes avec shish taouk",
    },
    price: 18500,
    img: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400&h=300&fit=crop&q=80",
  },

  // Category 12: أجنحة دجاج متبل

  {
    cat: "stuffed_chicken",
    names: {
      ar: "دجاجة محشية كاملة",
      en: "Whole Stuffed Chicken",
      fr: "Poulet Farci Entier",
    },
    desc: {
      ar: "دجاجة محشية + ثومية + بطاطا + طرشي + خبز",
      en: "Stuffed chicken + Garlic sauce + Potatoes + Pickles + Bread",
      fr: "Poulet farci + Sauce Ail + Pommes de terre + Cornichons + Pain",
    },
    price: 20000,
    img: "https://images.unsplash.com/photo-1598103721382-ae42d0d74e61?w=400&h=300&fit=crop&q=80",
  },
  {
    cat: "stuffed_chicken",
    names: {
      ar: "نصف دجاجة محشية",
      en: "Half Stuffed Chicken",
      fr: "Demi-Poulet Farci",
    },
    desc: {
      ar: "نصف دجاجة محشية + ثومية + بطاطا + طرشي + خبز",
      en: "Half stuffed chicken + Garlic sauce + Potatoes + Pickles + Bread",
      fr: "Demi-poulet farci + Sauce Ail + Pommes de terre + Cornichons + Pain",
    },
    price: 11000,
    img: "https://images.unsplash.com/photo-1606728035253-49e8a23146de?w=400&h=300&fit=crop&q=80",
  },

  // Category 9: دجاج متبل مشوي مضغوط

  {
    cat: "wings",
    names: {
      ar: "أجنحة مشوية سادة",
      en: "Plain Grilled Wings",
      fr: "Ailes Grillées Nature",
    },
    desc: {
      ar: "أجنحة مشوية سادة",
      en: "Plain grilled wings",
      fr: "Ailes grillées nature",
    },
    price: 6000,
    img: "https://images.unsplash.com/photo-1527477396000-e27163b481c2?w=400&h=300&fit=crop&q=80",
  },
  {
    cat: "wings",
    names: {
      ar: "أجنحة مشوية مع أرز",
      en: "Grilled Wings with Rice",
      fr: "Ailes Grillées avec Riz",
    },
    desc: {
      ar: "أجنحة مشوية مع أرز",
      en: "Grilled wings with rice",
      fr: "Ailes grillées avec riz",
    },
    price: 7000,
    img: "https://images.unsplash.com/photo-1604908177453-7462950a6a3b?w=400&h=300&fit=crop&q=80",
  },
  {
    cat: "wings",
    names: {
      ar: "أجنحة مشوية بالباربكيو",
      en: "BBQ Grilled Wings",
      fr: "Ailes Grillées BBQ",
    },
    desc: {
      ar: "أجنحة مشوية بالباربكيو",
      en: "BBQ grilled wings",
      fr: "Ailes grillées BBQ",
    },
    price: 6500,
    img: "https://images.unsplash.com/photo-1567620832903-9fc6debc209f?w=400&h=300&fit=crop&q=80",
  },

  // Category 13: دجاج بالسماك عالفحم
  {
    cat: "sumac_chicken",
    names: {
      ar: "دجاجة عالفحم بالسمّاك",
      en: "Chicken on Charcoal with Sumac",
      fr: "Poulet sur Charbon au Sumac",
    },
    desc: {
      ar: "دجاجة عالفحم – سماك – بطاطا – ثومية – طرشي – خبز",
      en: "Chicken on charcoal – Sumac – Potatoes – Garlic sauce – Pickles – Bread",
      fr: "Poulet sur charbon – Sumac – Pommes de terre – Sauce Ail – Cornichons – Pain",
    },
    price: 20000,
    img: "https://images.unsplash.com/photo-1594221708779-94832f4320d1?w=400&h=300&fit=crop&q=80",
  },
  {
    cat: "sumac_chicken",
    names: {
      ar: "نصف دجاجة عالفحم بالسماك",
      en: "Half Chicken on Charcoal with Sumac",
      fr: "Demi-Poulet sur Charbon au Sumac",
    },
    desc: {
      ar: "نصف دجاجة عالفحم بالسماك",
      en: "Half chicken on charcoal with sumac",
      fr: "Demi-poulet sur charbon au sumac",
    },
    price: 11000,
    img: "https://images.unsplash.com/photo-1594221708779-94832f4320d1?w=400&h=300&fit=crop&q=80",
  },
];

const generateItems = () => {
  let idCounter = 1;
  return MENU_ITEMS_RAW.map((item) => {
    let modifiers: any[] = [];
    if (
      item.cat === "chicken_meals_rice" ||
      item.cat === "rice" ||
      item.cat === "mansaf"
    )
      modifiers = RICE_MODIFIERS;
    else if (item.cat === "charcoal_sandwiches") modifiers = SANDWICH_MODIFIERS;
    else if (
      item.cat === "sumac_chicken" ||
      item.cat === "charcoal_bbq" ||
      item.cat === "wings" ||
      item.cat === "pressure_grilled" ||
      item.cat === "charcoal_marinated" ||
      item.cat === "stuffed_chicken"
    )
      modifiers = GRILL_MODIFIERS;

    return {
      id: `item_${idCounter++}`,
      category_id: item.cat,
      name_ar: item.names.ar,
      name_en: item.names.en,
      name_fr: item.names.fr,
      description_ar: item.desc.ar,
      description_en: item.desc.en,
      description_fr: item.desc.fr,
      price: item.price,
      rating: (4 + Math.random()).toFixed(1), // Rating not displayed but kept for type compatibility if needed
      prep_time: "15-25 min",
      tags: [],
      modifiers: modifiers,
    };
  });
};

const MENU_ITEMS = generateItems();

/**
 * TYPES
 */
type Item = (typeof MENU_ITEMS)[0];
type CartItem = Item & {
  cartId: string;
  quantity: number;
  selectedModifiers: typeof COMMON_MODIFIERS;
};

/**
 * COMPONENT: Menu Page Wrapper
 */
function MenuPageWrapper({
  lang,
  searchQuery,
  setSearchQuery,
  setLang,
  isDarkMode,
  setIsDarkMode,
  addToCart,
  cart,
  font,
  dir,
}: any) {
  const params = useNextParams();
  const categoryId = params?.categoryId as string | undefined;
  const { navigate } = useNextRouter();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(
    categoryId || null
  );
  const [selectedItemLocal, setSelectedItemLocal] = useState<Item | null>(null);
  const [isCartOpenLocal, setIsCartOpenLocal] = useState(false);
  const [isCheckoutOpenLocal, setIsCheckoutOpenLocal] = useState(false);
  const [isInfoOpenLocal, setIsInfoOpenLocal] = useState(false);
  const [isReservationOpenLocal, setIsReservationOpenLocal] = useState(false);
  const [cartLocal, setCartLocal] = useState<CartItem[]>(cart);

  useEffect(() => {
    if (categoryId) {
      setSelectedCategory(categoryId);
    }
  }, [categoryId]);

  useEffect(() => {
    setCartLocal(cart);
  }, [cart]);

  const removeFromCart = (cartId: string) => {
    setCartLocal((prev) => prev.filter((i) => i.cartId !== cartId));
  };

  const cartTotal = cartLocal.reduce((sum: number, item: CartItem) => {
    const modifiersPrice = item.selectedModifiers.reduce(
      (mSum: number, m: any) => mSum + m.price,
      0
    );
    return sum + (item.price + modifiersPrice) * item.quantity;
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
          onOpenInfo={() => setIsInfoOpenLocal(true)}
          isDark={isDarkMode}
          toggleTheme={() => setIsDarkMode(!isDarkMode)}
          showHomeButton={true}
          onNavigateHome={() => navigate("/")}
        />
        <main className="pt-20 pb-24 px-4 max-w-md mx-auto md:max-w-2xl lg:max-w-4xl relative z-10">
          <MenuFeed
            items={MENU_ITEMS}
            categories={CATEGORIES}
            activeCategory={selectedCategory}
            searchQuery={searchQuery}
            lang={lang}
            onAddClick={(item: Item) => setSelectedItemLocal(item)}
            onCategoryClick={(catId: string) => {
              setSelectedCategory(catId);
              navigate(`/menu/${catId}`);
            }}
            onBack={() => {
              setSelectedCategory(null);
              navigate("/categories");
            }}
          />
        </main>
        <Footer lang={lang} />
        {!isCartOpenLocal && !isCheckoutOpenLocal && (
          <div className="fixed bottom-8 left-6 z-[60]">
            <motion.button
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsCartOpenLocal(true)}
              className="relative w-14 h-14 bg-slate-900/95 dark:bg-orange-500/95 backdrop-blur-lg text-white rounded-full shadow-xl shadow-slate-900/30 dark:shadow-orange-500/30 flex items-center justify-center border border-white/10 transition-all group"
            >
              <ShoppingCart size={22} strokeWidth={2} />
              {cartLocal.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full font-bold border-2 border-white dark:border-navy-900">
                  {cartLocal.length}
                </span>
              )}
            </motion.button>
          </div>
        )}
        <FloatingReservationButton
          lang={lang}
          onReservation={() => setIsReservationOpenLocal(true)}
          isCartOpen={isCartOpenLocal}
          isCheckoutOpen={isCheckoutOpenLocal}
        />
        <Suspense fallback={null}>
          <ChatComponent lang={lang} />
        </Suspense>
      </div>
      <AnimatePresence>
        {selectedItemLocal && (
          <ItemModal
            item={selectedItemLocal}
            lang={lang}
            onClose={() => setSelectedItemLocal(null)}
            onConfirm={(item: Item, modifiers: any[] = [], quantity = 1) => {
              addToCart(item, modifiers, quantity);
              const newItem: CartItem = {
                ...item,
                cartId: Math.random().toString(36).substr(2, 9),
                quantity,
                selectedModifiers: modifiers,
              };
              setCartLocal((prev) => [...prev, newItem]);
            }}
          />
        )}
        {isCartOpenLocal && (
          <CartDrawer
            cart={cartLocal}
            total={cartTotal}
            lang={lang}
            onClose={() => setIsCartOpenLocal(false)}
            onRemove={removeFromCart}
            onCheckout={() => {
              setIsCartOpenLocal(false);
              setIsCheckoutOpenLocal(true);
            }}
          />
        )}
        {isCheckoutOpenLocal && (
          <CheckoutForm
            cart={cartLocal}
            total={cartTotal}
            lang={lang}
            onClose={() => setIsCheckoutOpenLocal(false)}
          />
        )}
        {isInfoOpenLocal && (
          <InfoModal lang={lang} onClose={() => setIsInfoOpenLocal(false)} />
        )}
        {isReservationOpenLocal && (
          <ReservationModal
            lang={lang}
            onClose={() => setIsReservationOpenLocal(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
}

/**
 * MAIN APP COMPONENT WITH ROUTING
 */
function AppContent() {
  // State
  const [lang, setLang] = useState<Language | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isReservationOpen, setIsReservationOpen] = useState(false);
  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isThemeLoaded, setIsThemeLoaded] = useState(false);
  const [isFirstLoad, setIsFirstLoad] = useState(true);

  // Track if we've loaded from localStorage to prevent overwriting on initial mount
  const hasLoadedFromStorage = useRef(false);
  const { navigate } = useNextRouter();

  // Derived State
  const dir = lang === "ar" ? "rtl" : "ltr";
  const font = lang === "ar" ? "font-cairo" : "font-inter";

  // Handlers
  const addToCart = (
    item: Item,
    modifiers: typeof COMMON_MODIFIERS = [],
    quantity = 1
  ) => {
    const newItem: CartItem = {
      ...item,
      cartId: Math.random().toString(36).substr(2, 9),
      quantity,
      selectedModifiers: modifiers,
    };
    setCart((prev) => [...prev, newItem]);
    setSelectedItem(null);
  };

  // Effects
  useEffect(() => {
    const savedTheme = localStorage.getItem("app_theme");
    if (savedTheme === "dark") {
      setIsDarkMode(true);
      document.documentElement.classList.add("dark");
    } else {
      setIsDarkMode(false);
      document.documentElement.classList.remove("dark");
    }
    setIsThemeLoaded(true);

    const savedLang = localStorage.getItem("app_lang") as Language;
    if (savedLang) {
      setLang(savedLang);
    }

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

  useEffect(() => {
    if (lang) {
      localStorage.setItem("app_lang", lang);
    }
  }, [lang]);

  useEffect(() => {
    if (hasLoadedFromStorage.current) {
      localStorage.setItem("app_cart", JSON.stringify(cart));
    }
  }, [cart]);

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

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [selectedCategory]);

  useEffect(() => {
    if (isThemeLoaded && lang) {
      const timer = setTimeout(() => {
        setIsFirstLoad(false);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isThemeLoaded, lang]);

  // Preload all logo images
  const logoImages = [
    RESTAURANT_CONFIG.logo,
    RESTAURANT_CONFIG.logoEn,
    RESTAURANT_CONFIG.logoAr,
  ];
  const { isLoading: areImagesLoading } = useImagePreloader(logoImages);

  // Render Logic
  if (!isThemeLoaded || areImagesLoading) {
    return (
      <div className="fixed inset-0 bg-white dark:bg-navy-900 flex items-center justify-center z-50">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-600 dark:text-slate-400 font-medium">
            Loading...
          </p>
        </motion.div>
      </div>
    );
  }

  // If no language selected, show language selection on all routes
  if (!lang) {
    return <LanguageSelectionPage onSelect={setLang} />;
  }

  // For Next.js, routing is handled by the file system
  // This component just manages state - pages will render the UI
  return (
    <>
      {lang && (
        <GlobalModals
          lang={lang}
          isReservationOpen={isReservationOpen}
          setIsReservationOpen={setIsReservationOpen}
        />
      )}
    </>
  );
}

// Export components and functions for use in Next.js pages
export {
  Navbar,
  CategoryGrid,
  MenuFeed,
  ItemCard,
  ItemModal,
  CartDrawer,
  CheckoutForm,
  Footer,
  InfoModal,
  ReservationModal,
  MenuPageWrapper,
  GlobalModals,
  FloatingReservationButton,
  CATEGORIES,
  MENU_ITEMS,
  formatPrice,
  formatHours,
  isRestaurantOpen,
};

// Floating Reservation Button Component
function FloatingReservationButton({
  lang,
  onReservation,
  isCartOpen = false,
  isCheckoutOpen = false,
}: {
  lang: Language;
  onReservation: () => void;
  isCartOpen?: boolean;
  isCheckoutOpen?: boolean;
}) {
  // Don't show if cart or checkout is open
  if (isCartOpen || isCheckoutOpen) return null;

  return (
    <div className="fixed bottom-24 right-6 z-[60]">
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onReservation}
        className="w-14 h-14 bg-gradient-to-tr from-orange-500 to-orange-400 hover:from-orange-600 hover:to-orange-500 text-white rounded-full shadow-xl shadow-orange-500/30 flex items-center justify-center transition-all group"
        title={lang === "ar" ? "حجز طاولة" : "Make Reservation"}
      >
        <Calendar size={22} strokeWidth={2} />
      </motion.button>
    </div>
  );
}

// Global modals that work across all routes
function GlobalModals({
  lang,
  isReservationOpen,
  setIsReservationOpen,
  settings,
}: {
  lang: Language | null;
  isReservationOpen: boolean;
  setIsReservationOpen: (open: boolean) => void;
  settings?: any;
}) {
  if (!lang) return null;

  return (
    <AnimatePresence>
      {isReservationOpen && (
        <ReservationModal
          lang={lang}
          onClose={() => setIsReservationOpen(false)}
          settings={settings}
        />
      )}
    </AnimatePresence>
  );
}

// Keep ReservationModal function definition for reference (it's defined later in the file)

// For Next.js, we don't use BrowserRouter - routing is handled by Next.js
// AppContent will be used directly in Next.js pages
export default function App() {
  return <AppContent />;
}

/**
 * COMPONENT: Language Selection
 */
function LanguageSelection({ onSelect }: { onSelect: (l: Language) => void }) {
  return (
    <div className="fixed inset-0 bg-navy-900 text-white flex flex-col items-center justify-center p-6 z-50">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-8 w-full max-w-sm"
      >
        <h1 className="text-4xl font-thin tracking-widest mb-8 font-inter">
          MENU
        </h1>
        <div className="space-y-4 flex flex-col">
          {[
            { code: "ar", label: "العربية", font: "font-cairo" },
            { code: "en", label: "English", font: "font-inter" },
            { code: "fr", label: "Français", font: "font-inter" },
          ].map((l) => (
            <button
              key={l.code}
              onClick={() => onSelect(l.code as Language)}
              className={cn(
                "py-4 px-8 border border-white/20 rounded-xl text-xl hover:bg-white/10 transition-all duration-300 hover:border-orange-500 hover:text-orange-500",
                l.font
              )}
            >
              {l.label}
            </button>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

/**
 * COMPONENT: Landing Page (kept for backward compatibility - unused but kept for reference)
 */
// @ts-ignore - unused but kept for reference
function LandingPage({
  lang,
  onViewMenu,
  onReservation,
}: {
  lang: Language;
  onViewMenu: () => void;
  onReservation: () => void;
}) {
  const dir = lang === "ar" ? "rtl" : "ltr";
  const font = lang === "ar" ? "font-cairo" : "font-inter";

  return (
    <div
      className={cn(
        "fixed inset-0 bg-white dark:bg-navy-900 text-slate-900 dark:text-white overflow-hidden bg-wood-pattern-dense",
        font,
        dir === "rtl" ? "rtl" : "ltr"
      )}
      dir={dir}
    >
      {/* Background Image with Overlay */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-white/80 dark:bg-navy-950/80 z-10 backdrop-blur-[2px]" />
        {/* Wood Pattern Overlay for Landing */}
        <div className="absolute inset-0 z-[5] opacity-20 pointer-events-none bg-wood-pattern-dense mix-blend-multiply dark:mix-blend-overlay" />
        <img
          src={RESTAURANT_CONFIG.image}
          alt={RESTAURANT_CONFIG.name[lang]}
          className="w-full h-full object-cover opacity-20 dark:opacity-10 grayscale"
        />
      </div>

      {/* Content */}
      <div className="relative z-20 h-full flex flex-col items-center justify-center px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="text-center max-w-2xl w-full space-y-12"
        >
          {/* Restaurant Logo & Name */}
          <div className="space-y-6 flex flex-col items-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8 }}
              className="w-48 h-48 md:w-64 md:h-64 relative"
            >
              <img
                src={RESTAURANT_CONFIG.logo}
                alt="Mtabal Logo"
                className="w-full h-full object-contain drop-shadow-[0_0_15px_rgba(254,173,29,0.8)]"
              />
            </motion.div>

            <div className="space-y-4">
              <motion.h1
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2, duration: 0.6 }}
                className={cn(
                  "text-5xl md:text-6xl lg:text-7xl font-bold tracking-wide text-slate-900 dark:text-white",
                  lang === "ar" &&
                    "font-handwriting text-6xl md:text-7xl lg:text-8xl"
                )}
              >
                {RESTAURANT_CONFIG.name[lang]}
              </motion.h1>
              <motion.div
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: "100%" }}
                transition={{ delay: 0.4, duration: 0.8 }}
                className="h-1 bg-gradient-to-r from-transparent via-orange-500 to-transparent mx-auto max-w-xs rounded-full"
              />
            </div>
          </div>

          {/* Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.6 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
          >
            <motion.button
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              onClick={onViewMenu}
              className={cn(
                "px-8 py-4 bg-white/50 dark:bg-navy-800/50 backdrop-blur-md border border-slate-200 dark:border-navy-700 rounded-full text-lg font-bold text-slate-800 dark:text-slate-200",
                "hover:bg-purple-500 hover:text-white hover:border-purple-500 transition-all duration-300",
                "shadow-xl shadow-purple-500/10 min-w-[200px]"
              )}
            >
              {lang === "ar"
                ? "عرض القائمة"
                : lang === "fr"
                ? "Voir le Menu"
                : "View Menu"}
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              onClick={onReservation}
              className={cn(
                "px-8 py-4 bg-orange-500 text-white rounded-full text-lg font-bold",
                "hover:bg-orange-600 transition-all duration-300",
                "shadow-xl shadow-orange-500/30 min-w-[200px]"
              )}
            >
              {lang === "ar"
                ? "حجز طاولة"
                : lang === "fr"
                ? "Réserver"
                : "Make Reservation"}
            </motion.button>
          </motion.div>
        </motion.div>
      </div>

      {/* Decorative Elements */}
      <div className="absolute top-20 left-20 w-64 h-64 bg-orange-500/5 rounded-full blur-3xl mix-blend-multiply dark:mix-blend-screen pointer-events-none" />
      <div className="absolute bottom-20 right-20 w-80 h-80 bg-purple-500/5 rounded-full blur-3xl mix-blend-multiply dark:mix-blend-screen pointer-events-none" />
    </div>
  );
}

/**
 * COMPONENT: Reservation Modal (iOS Premium Style)
 */
function ReservationModal({
  lang,
  onClose,
  settings,
}: {
  lang: Language;
  onClose: () => void;
  settings?: any;
}) {
  const dir = lang === "ar" ? "rtl" : "ltr";
  const font = lang === "ar" ? "font-cairo" : "font-inter";

  const [formData, setFormData] = useState({
    fullName: "",
    date: "",
    time: "",
    numberOfPeople: "",
    notes: "",
  });

  // Generate date options (next 30 days)
  const generateDateOptions = () => {
    const dates = [];
    const today = new Date();
    for (let i = 0; i < 30; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      const dateStr = date.toISOString().split("T")[0];
      const displayDate = date.toLocaleDateString(
        lang === "ar" ? "ar-EG" : lang === "fr" ? "fr-FR" : "en-US",
        { weekday: "short", month: "short", day: "numeric" }
      );
      dates.push({ value: dateStr, label: displayDate });
    }
    return dates;
  };

  const generateTimeOptions = () => {
    const times = [];
    for (let hour = 10; hour < 23; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const timeStr = `${hour.toString().padStart(2, "0")}:${minute
          .toString()
          .padStart(2, "0")}`;
        const displayTime = new Date(
          `2000-01-01T${timeStr}`
        ).toLocaleTimeString(
          lang === "ar" ? "ar-EG" : lang === "fr" ? "fr-FR" : "en-US",
          { hour: "numeric", minute: "2-digit", hour12: true }
        );
        times.push({ value: timeStr, label: displayTime });
      }
    }
    return times;
  };

  const peopleOptions = Array.from({ length: 10 }, (_, i) => i + 1);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const dateObj = new Date(formData.date);
    const formattedDate = dateObj.toLocaleDateString(
      lang === "ar" ? "ar-EG" : lang === "fr" ? "fr-FR" : "en-US",
      { weekday: "long", year: "numeric", month: "long", day: "numeric" }
    );
    const timeObj = new Date(`2000-01-01T${formData.time}`);
    const formattedTime = timeObj.toLocaleTimeString(
      lang === "ar" ? "ar-EG" : lang === "fr" ? "fr-FR" : "en-US",
      { hour: "numeric", minute: "2-digit", hour12: true }
    );

    let text = `*Reservation Request / طلب حجز* %0A%0A`;
    text += `━━━━━━━━━━━━━━━━━━━━%0A%0A`;
    text += `*${lang === "ar" ? "الاسم الكامل" : "Full Name"}:* ${
      formData.fullName
    }%0A%0A`;
    text += `*${lang === "ar" ? "التاريخ" : "Date"}:* ${formattedDate}%0A%0A`;
    text += `*${lang === "ar" ? "الوقت" : "Time"}:* ${formattedTime}%0A%0A`;
    text += `*${lang === "ar" ? "عدد الأشخاص" : "Guests"}:* ${
      formData.numberOfPeople
    }%0A%0A`;
    if (formData.notes.trim())
      text += `*${lang === "ar" ? "ملاحظات" : "Notes"}:* ${
        formData.notes
      }%0A%0A`;
    text += `━━━━━━━━━━━━━━━━━━━━`;

    // Use phone_reservation for reservations, fallback to whatsapp if not available
    const reservationPhone =
      settings?.phone_reservation ||
      settings?.whatsapp ||
      RESTAURANT_CONFIG.whatsapp;

    window.open(`https://wa.me/${reservationPhone}?text=${text}`, "_blank");
    setFormData({
      fullName: "",
      date: "",
      time: "",
      numberOfPeople: "",
      notes: "",
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center pointer-events-none">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm pointer-events-auto"
      />

      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className={cn(
          "relative w-full max-w-lg bg-white/95 dark:bg-navy-900/95 backdrop-blur-xl rounded-t-[2.5rem] sm:rounded-[2.5rem] shadow-2xl pointer-events-auto overflow-hidden border-t border-white/20 sm:border sm:border-white/10",
          font,
          dir === "rtl" ? "rtl" : "ltr"
        )}
        dir={dir}
      >
        {/* Drag Handle */}
        <div className="absolute top-3 left-1/2 -translate-x-1/2 w-12 h-1.5 bg-slate-300/50 dark:bg-white/20 rounded-full sm:hidden z-20" />

        {/* Header */}
        <div className="px-8 pt-8 pb-4 border-b border-slate-100 dark:border-navy-800/50 flex justify-between items-end">
          <div>
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white">
              {lang === "ar"
                ? "حجز طاولة"
                : lang === "fr"
                ? "Réserver"
                : "Book a Table"}
            </h2>
            <p className="text-slate-500 dark:text-slate-400 mt-1">
              {lang === "ar"
                ? "تجربة طعام لا تنسى بانتظارك"
                : "An unforgettable dining experience awaits"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 bg-slate-100 dark:bg-navy-800 rounded-full hover:bg-slate-200 transition-colors text-slate-600 dark:text-slate-300"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="p-8 space-y-6 overflow-y-auto max-h-[70vh]"
        >
          <div className="space-y-4">
            {/* Name */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300 ml-1">
                {lang === "ar" ? "الاسم الكامل" : "Full Name"}{" "}
                <span className="text-orange-500">*</span>
              </label>
              <div className="relative">
                <FileText
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500"
                  size={20}
                />
                <input
                  type="text"
                  required
                  value={formData.fullName}
                  onChange={(e) =>
                    setFormData({ ...formData, fullName: e.target.value })
                  }
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-navy-800 rounded-2xl border-none outline-none focus:ring-2 focus:ring-orange-500/50 transition-all font-medium text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500"
                  placeholder={
                    lang === "ar" ? "الاسم..." : "Enter your name..."
                  }
                />
              </div>
            </div>

            {/* Date & Time Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 dark:text-slate-300 ml-1">
                  {lang === "ar" ? "التاريخ" : "Date"}{" "}
                  <span className="text-orange-500">*</span>
                </label>
                <div className="relative">
                  <Calendar
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500"
                    size={20}
                  />
                  <select
                    required
                    value={formData.date}
                    onChange={(e) =>
                      setFormData({ ...formData, date: e.target.value })
                    }
                    className="w-full pl-12 pr-8 py-4 bg-slate-50 dark:bg-navy-800 rounded-2xl border-none outline-none focus:ring-2 focus:ring-orange-500/50 transition-all font-medium appearance-none cursor-pointer text-slate-900 dark:text-white"
                  >
                    <option value="">
                      {lang === "ar" ? "التاريخ" : "Select Date"}
                    </option>
                    {generateDateOptions().map((d) => (
                      <option key={d.value} value={d.value}>
                        {d.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none"
                    size={16}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 dark:text-slate-300 ml-1">
                  {lang === "ar" ? "الوقت" : "Time"}{" "}
                  <span className="text-orange-500">*</span>
                </label>
                <div className="relative">
                  <Clock
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500"
                    size={20}
                  />
                  <select
                    required
                    value={formData.time}
                    onChange={(e) =>
                      setFormData({ ...formData, time: e.target.value })
                    }
                    className="w-full pl-12 pr-8 py-4 bg-slate-50 dark:bg-navy-800 rounded-2xl border-none outline-none focus:ring-2 focus:ring-orange-500/50 transition-all font-medium appearance-none cursor-pointer text-slate-900 dark:text-white"
                  >
                    <option value="" className="text-slate-900 dark:text-white">
                      {lang === "ar" ? "الوقت" : "Select Time"}
                    </option>
                    {generateTimeOptions().map((t) => (
                      <option
                        key={t.value}
                        value={t.value}
                        className="text-slate-900 dark:text-white"
                      >
                        {t.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none"
                    size={16}
                  />
                </div>
              </div>
            </div>

            {/* Guests */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300 ml-1">
                {lang === "ar" ? "عدد الضيوف" : "Guests"}{" "}
                <span className="text-orange-500">*</span>
              </label>
              <div className="relative">
                <Users
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500"
                  size={20}
                />
                <select
                  required
                  value={formData.numberOfPeople}
                  onChange={(e) =>
                    setFormData({ ...formData, numberOfPeople: e.target.value })
                  }
                  className="w-full pl-12 pr-8 py-4 bg-slate-50 dark:bg-navy-800 rounded-2xl border-none outline-none focus:ring-2 focus:ring-orange-500/50 transition-all font-medium appearance-none cursor-pointer text-slate-900 dark:text-white"
                >
                  <option value="" className="text-slate-900 dark:text-white">
                    {lang === "ar" ? "عدد الأشخاص" : "Number of People"}
                  </option>
                  {peopleOptions.map((n) => (
                    <option
                      key={n}
                      value={n}
                      className="text-slate-900 dark:text-white"
                    >
                      {n} {lang === "ar" ? "شخص" : "People"}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none"
                  size={16}
                />
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300 ml-1">
                {lang === "ar" ? "ملاحظات (اختياري)" : "Notes (Optional)"}
              </label>
              <textarea
                rows={3}
                value={formData.notes}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
                className="w-full p-4 bg-slate-50 dark:bg-navy-800 rounded-2xl border-none outline-none focus:ring-2 focus:ring-orange-500/50 transition-all font-medium resize-none text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500"
                placeholder={
                  lang === "ar"
                    ? "عيد ميلاد، مناسبة خاصة..."
                    : "Birthday, special occasion..."
                }
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={
              !formData.fullName ||
              !formData.date ||
              !formData.time ||
              !formData.numberOfPeople
            }
            className="w-full py-4 bg-orange-500 hover:bg-orange-600 text-white rounded-2xl font-bold text-lg shadow-lg shadow-orange-500/30 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {lang === "ar" ? "تأكيد الحجز" : "Confirm Reservation"}
            <ArrowRight size={20} />
          </button>
        </form>
      </motion.div>
    </div>
  );
}

/**
 * COMPONENT: Navbar
 */
function Navbar({
  lang,
  onSearch,
  onLanguageChange,
  onOpenInfo,
  isDark,
  toggleTheme,
  showHomeButton = false,
  onNavigateHome,
}: {
  lang: Language;
  onSearch: (query: string) => void;
  onLanguageChange: (lang: Language) => void;
  onOpenInfo: () => void;
  isDark: boolean;
  toggleTheme: () => void;
  showHomeButton?: boolean;
  onNavigateHome?: () => void;
}) {
  const [isLangDropdownOpen, setIsLangDropdownOpen] = useState(false);
  const dir = lang === "ar" ? "rtl" : "ltr";

  const languages = [
    { code: "ar", label: "العربية", flag: "AR" },
    { code: "en", label: "English", flag: "EN" },
    { code: "fr", label: "Français", font: "font-inter", flag: "FR" },
  ];

  const currentLang = languages.find((l) => l.code === lang) || languages[1];

  return (
    <nav className="fixed top-0 left-0 right-0 z-40 bg-white/95 dark:bg-navy-900/95 backdrop-blur-xl border-b border-orange-500/10 dark:border-purple-500/10 shadow-sm transition-colors duration-300">
      <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {/* Home Button - Only show when not on home page */}
          {showHomeButton && onNavigateHome && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onNavigateHome}
              className="w-10 h-10 rounded-full bg-white dark:bg-navy-800 border border-slate-200 dark:border-navy-700 flex items-center justify-center hover:bg-white dark:hover:bg-navy-700 hover:shadow-md hover:border-orange-500/30 transition-all group flex-shrink-0"
              title={lang === "ar" ? "الرئيسية" : "Home"}
            >
              <Home
                size={18}
                className="text-slate-700 dark:text-slate-200 group-hover:text-orange-500 transition-colors"
              />
            </motion.button>
          )}

          {/* Logo in Navbar */}
          <button
            onClick={onOpenInfo}
            className="flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
          >
            <img
              src={
                lang === "ar"
                  ? RESTAURANT_CONFIG.logoAr
                  : RESTAURANT_CONFIG.logoEn
              }
              alt="Logo"
              className="h-10 w-auto object-contain drop-shadow-[0_0_10px_rgba(254,173,29,0.8)]"
            />
          </button>

          {/* Search Bar */}
          <div className="bg-white dark:bg-navy-800 border border-slate-200 dark:border-navy-700 rounded-full px-4 py-2.5 flex items-center gap-2 flex-1 min-w-[120px] max-w-md transition-all focus-within:bg-white dark:focus-within:bg-navy-900 focus-within:shadow-lg focus-within:shadow-orange-500/5 focus-within:border-orange-500/50 group">
            <Search
              size={16}
              className="text-slate-400 group-focus-within:text-orange-500 transition-colors flex-shrink-0"
            />
            <input
              type="text"
              placeholder={lang === "ar" ? "بحث..." : "Search..."}
              className="bg-transparent border-none outline-none text-sm w-full text-slate-700 dark:text-slate-200 placeholder:text-slate-400"
              onChange={(e) => onSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Theme Switcher - Minimalistic Pro */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={toggleTheme}
            className="w-10 h-10 rounded-full bg-white dark:bg-navy-800 border border-slate-200 dark:border-navy-700 flex items-center justify-center hover:bg-white dark:hover:bg-navy-700 hover:shadow-md hover:border-orange-500/30 transition-all group"
          >
            {isDark ? (
              <Sun
                size={18}
                className="text-orange-500 group-hover:rotate-180 transition-transform duration-500"
              />
            ) : (
              <Moon
                size={18}
                className="text-purple-600 dark:text-purple-400 group-hover:rotate-12 transition-transform duration-500"
              />
            )}
          </motion.button>

          {/* Language Switcher - Minimalistic Pro */}
          <div className="relative">
            <button
              onClick={() => setIsLangDropdownOpen(!isLangDropdownOpen)}
              className="w-10 h-10 rounded-full bg-white dark:bg-navy-800 border border-slate-200 dark:border-navy-700 flex items-center justify-center hover:bg-white dark:hover:bg-navy-700 hover:shadow-md hover:border-purple-500/30 transition-all group"
            >
              <span className="text-xs font-bold text-slate-700 dark:text-slate-200 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                {currentLang.flag}
              </span>
            </button>

            {/* Language Dropdown */}
            <AnimatePresence>
              {isLangDropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setIsLangDropdownOpen(false)}
                  />
                  <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className={cn(
                      "absolute top-full mt-2 end-0 w-48 bg-white dark:bg-navy-800 rounded-xl shadow-xl border border-slate-200 dark:border-navy-700 overflow-hidden z-50",
                      dir === "rtl" ? "left-0" : "right-0"
                    )}
                  >
                    {languages.map((l) => {
                      const isSelected = l.code === lang;
                      return (
                        <button
                          key={l.code}
                          onClick={() => {
                            onLanguageChange(l.code as Language);
                            setIsLangDropdownOpen(false);
                          }}
                          className={cn(
                            "w-full flex items-center gap-3 px-4 py-3 hover:bg-white dark:hover:bg-slate-700 transition-colors text-left",
                            isSelected &&
                              "bg-orange-500/10 dark:bg-orange-500/20 border-e-2 border-orange-500",
                            l.code === "ar" ? "font-cairo" : "font-inter"
                          )}
                        >
                          <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase px-2 py-1 bg-slate-100 dark:bg-slate-700 rounded">
                            {l.flag}
                          </span>
                          <span
                            className={cn(
                              "text-sm font-medium",
                              isSelected
                                ? "text-orange-500 dark:text-orange-500"
                                : "text-slate-700 dark:text-slate-300"
                            )}
                          >
                            {l.label}
                          </span>
                          {isSelected && (
                            <Check
                              size={16}
                              className="text-orange-500 dark:text-orange-500 ms-auto"
                            />
                          )}
                        </button>
                      );
                    })}
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>

          {/* Info Button */}
          <button
            onClick={onOpenInfo}
            className="p-2 text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-navy-800 rounded-full transition-colors hidden sm:block"
          >
            <Info size={24} strokeWidth={1.5} />
          </button>
        </div>
      </div>
    </nav>
  );
}

/**
 * COMPONENT: Category Grid
 */
function CategoryGrid({ categories, lang, onSelect, isFirstLoad }: any) {
  return (
    <div className="space-y-6">
      {/* Categories Grid */}
      <motion.div
        initial={isFirstLoad ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="grid grid-cols-2 gap-4"
      >
        {categories.map((cat: any, idx: number) => {
          const Icon = cat.icon;
          const hasImage = cat.image_url;
          return (
            <motion.button
              key={cat.id}
              initial={isFirstLoad ? false : { opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={isFirstLoad ? { duration: 0 } : { delay: idx * 0.05 }}
              onClick={() => onSelect(cat.id)}
              className="relative bg-white dark:bg-navy-800 rounded-2xl shadow-sm border border-transparent hover:border-purple-500/30 dark:hover:border-purple-500/50 overflow-hidden hover:shadow-lg hover:shadow-purple-500/5 transition-all group"
            >
              {hasImage ? (
                <div className="aspect-square relative">
                  <Image
                    src={cat.image_url}
                    alt={cat[lang]}
                    fill
                    sizes="(max-width: 640px) 200px, 300px"
                    quality={75}
                    priority={idx < 4}
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <span className="font-bold text-sm text-white drop-shadow-lg">
                      {cat[lang]}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="p-6 flex flex-col items-center gap-4">
                  <div className="absolute inset-0 bg-gradient-to-br -z-10 from-transparent via-transparent to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="w-14 h-14 rounded-full bg-orange-50 dark:bg-navy-700 flex items-center justify-center group-hover:bg-orange-500 text-orange-500 group-hover:text-white transition-all duration-300 shadow-sm group-hover:shadow-orange-500/30">
                    <Icon size={26} strokeWidth={1.5} />
                  </div>
                  <span className="font-bold text-sm text-slate-700 dark:text-slate-200 group-hover:text-purple-700 dark:group-hover:text-purple-300 transition-colors">
                    {cat[lang]}
                  </span>
                </div>
              )}
            </motion.button>
          );
        })}
      </motion.div>
    </div>
  );
}

/**
 * COMPONENT: Menu Feed
 */
function MenuFeed({
  items,
  activeCategory,
  searchQuery,
  lang,
  onAddClick,
}: any) {
  // Sticky Filter Logic
  const filteredItems = useMemo(() => {
    let res = items;
    if (activeCategory)
      res = res.filter((i: Item) => i.category_id === activeCategory);
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      res = res.filter(
        (i: Item) =>
          i.name_en.toLowerCase().includes(q) ||
          i.name_ar.includes(q) ||
          i.name_fr.toLowerCase().includes(q)
      );
    }
    return res;
  }, [items, activeCategory, searchQuery]);

  return (
    <div>
      {/* Items Grid */}
      <div className="grid grid-cols-1 gap-4">
        {filteredItems.map((item: Item) => (
          <ItemCard
            key={item.id}
            item={item}
            lang={lang}
            onAdd={() => onAddClick(item)}
          />
        ))}
        {filteredItems.length === 0 && (
          <div className="text-center py-20 text-slate-400">
            {lang === "ar" ? "لا توجد نتائج" : "No items found"}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * COMPONENT: Item Card (Minimalistic)
 */
function ItemCard({ item, lang, onAdd }: any) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={onAdd}
      className="group bg-white dark:bg-navy-800 rounded-2xl p-5 shadow-sm hover:shadow-lg hover:shadow-orange-500/5 border border-slate-100 dark:border-navy-700 hover:border-orange-200/50 dark:hover:border-orange-500/30 transition-all duration-300 cursor-pointer active:scale-[0.98]"
    >
      {/* Content */}
      <div className="flex flex-col gap-4">
        {/* Title and Description */}
        <div className="flex-1">
          <h3
            className={cn(
              "font-bold text-slate-900 dark:text-slate-100 text-lg mb-2 leading-tight",
              lang === "ar" && "font-cairo"
            )}
          >
            {item[`name_${lang}`]}
          </h3>
          <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed line-clamp-2">
            {item[`description_${lang}`]}
          </p>
        </div>

        {/* Footer with Price and Add Button */}
        <div className="flex justify-between items-center pt-3 border-t border-slate-100 dark:border-navy-700">
          <div className="font-bold text-xl text-purple-700 dark:text-orange-400">
            {formatPrice(item.price, lang)}
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onAdd();
            }}
            className="w-10 h-10 rounded-lg bg-orange-500 hover:bg-orange-600 text-white flex items-center justify-center shadow-md shadow-orange-500/20 active:scale-95 transition-all"
          >
            <Plus size={18} strokeWidth={2.5} />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

/**
 * COMPONENT: Item Modifier Modal (iOS Premium Style)
 */
function ItemModal({ item, lang, onClose, onConfirm }: any) {
  const [modifiers, setModifiers] = useState<any[]>([]);
  const [quantity, setQuantity] = useState(1);

  const toggleModifier = (mod: any) => {
    if (modifiers.find((m) => m.id === mod.id)) {
      setModifiers(modifiers.filter((m) => m.id !== mod.id));
    } else {
      setModifiers([...modifiers, mod]);
    }
  };

  const totalPrice =
    (item.price + modifiers.reduce((s: number, m: any) => s + m.price, 0)) *
    quantity;

  return (
    <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center pointer-events-none">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm pointer-events-auto"
      />

      {/* Modal Content */}
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="relative w-full max-w-lg bg-white/90 dark:bg-navy-900/90 backdrop-blur-xl rounded-t-[2.5rem] sm:rounded-[2.5rem] overflow-hidden shadow-2xl pointer-events-auto max-h-[90vh] flex flex-col border-t border-white/20 sm:border sm:border-white/10"
      >
        {/* Drag Handle (Mobile Visual Cue) */}
        <div className="absolute top-3 left-1/2 -translate-x-1/2 w-12 h-1.5 bg-slate-300/50 dark:bg-white/20 rounded-full sm:hidden z-20" />

        {/* Header - No Image */}
        <div className="p-6 border-b border-slate-100 dark:border-navy-800 flex justify-between items-center bg-slate-50/50 dark:bg-navy-900">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            {item[`name_${lang}`]}
          </h2>
          <button
            onClick={onClose}
            className="p-2 bg-slate-100 dark:bg-navy-800 rounded-full hover:bg-slate-200 dark:hover:bg-navy-700 transition-colors text-slate-600 dark:text-slate-300"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content Scrollable */}
        <div className="flex-1 overflow-y-auto px-6 pt-6 pb-4 space-y-6">
          <div>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
              {item[`description_${lang}`]}
            </p>
          </div>

          {item.modifiers && item.modifiers.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                {lang === "ar"
                  ? "إضافات"
                  : lang === "fr"
                  ? "Suppléments"
                  : "Add-ons"}
                <div className="h-px flex-1 bg-slate-200 dark:bg-navy-700" />
              </h3>
              <div className="space-y-3">
                {item.modifiers.map((mod: any) => {
                  const isSelected = modifiers.find((m) => m.id === mod.id);
                  return (
                    <motion.button
                      key={mod.id}
                      onClick={() => toggleModifier(mod)}
                      whileTap={{ scale: 0.98 }}
                      className={cn(
                        "w-full flex items-center justify-between p-4 rounded-2xl border transition-all duration-300",
                        isSelected
                          ? "bg-orange-500/10 border-orange-500/50 shadow-lg shadow-orange-500/10"
                          : "bg-slate-50 dark:bg-navy-800/50 border-transparent hover:bg-slate-100 dark:hover:bg-navy-800"
                      )}
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className={cn(
                            "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors",
                            isSelected
                              ? "bg-orange-500 border-orange-500 text-white"
                              : "border-slate-300 dark:border-slate-600"
                          )}
                        >
                          {isSelected && <Check size={14} strokeWidth={3} />}
                        </div>
                        <span
                          className={cn(
                            "font-medium text-lg",
                            isSelected
                              ? "text-orange-600 dark:text-orange-400"
                              : "text-slate-700 dark:text-slate-200"
                          )}
                        >
                          {mod[`name_${lang}`]}
                        </span>
                      </div>
                      <span className="font-bold text-slate-900 dark:text-white">
                        {mod.price > 0
                          ? `+${formatPrice(mod.price, lang)}`
                          : lang === "ar"
                          ? "مجاني"
                          : "Free"}
                      </span>
                    </motion.button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Bottom Action Bar */}
        <div className="p-6 bg-white dark:bg-navy-900 border-t border-slate-100 dark:border-navy-800/50 shadow-[0_-10px_40px_rgba(0,0,0,0.1)] z-20">
          <div className="flex items-center gap-6">
            {/* Quantity Stepper */}
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-navy-800 rounded-full p-1.5">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="w-10 h-10 flex items-center justify-center bg-white dark:bg-navy-700 rounded-full shadow-sm text-slate-900 dark:text-white hover:bg-slate-50 dark:hover:bg-navy-600 transition-colors"
              >
                <Minus size={18} />
              </button>
              <span className="w-8 text-center font-bold text-lg text-slate-900 dark:text-white">
                {quantity}
              </span>
              <button
                onClick={() => setQuantity(quantity + 1)}
                className="w-10 h-10 flex items-center justify-center bg-white dark:bg-navy-700 rounded-full shadow-sm text-slate-900 dark:text-white hover:bg-slate-50 dark:hover:bg-navy-600 transition-colors"
              >
                <Plus size={18} />
              </button>
            </div>

            {/* Add Button */}
            <button
              onClick={() => onConfirm(item, modifiers, quantity)}
              className="flex-1 bg-orange-500 hover:bg-orange-600 text-white py-4 rounded-full font-bold text-lg shadow-lg shadow-orange-500/30 active:scale-95 transition-all flex justify-between px-6 items-center group"
            >
              <span>
                {lang === "ar" ? "إضافة" : lang === "fr" ? "Ajouter" : "Add"}
              </span>
              <span className="bg-white/20 px-3 py-1 rounded-full text-sm group-hover:bg-white/30 transition-colors">
                {formatPrice(totalPrice, lang)}
              </span>
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

/**
 * COMPONENT: Cart Drawer (Invoice Style)
 */
function CartDrawer({ cart, total, lang, onClose, onRemove, onCheckout }: any) {
  const dir = lang === "ar" ? "rtl" : "ltr";
  const font = lang === "ar" ? "font-cairo" : "font-inter";

  return (
    <div className="fixed inset-0 z-[80] flex justify-end pointer-events-none">
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-[2px] pointer-events-auto"
        onClick={onClose}
      />
      <motion.div
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", damping: 30, stiffness: 300 }}
        className={cn(
          "pointer-events-auto relative w-full max-w-md bg-[#F8F9FA] dark:bg-[#1a1f2c] h-full shadow-2xl flex flex-col",
          font,
          dir === "rtl" ? "rtl" : "ltr",
          lang === "ar" ? "left-0" : "right-0"
        )}
        dir={dir}
      >
        {/* Header */}
        <div className="bg-white dark:bg-navy-900 p-6 shadow-sm z-10 flex justify-between items-center border-b border-slate-100 dark:border-navy-800">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Receipt className="text-orange-500" />
              {lang === "ar"
                ? "الفاتورة"
                : lang === "fr"
                ? "Facture"
                : "Bill Details"}
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              {new Date().toLocaleDateString()} •{" "}
              {new Date().toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 dark:hover:bg-navy-800 rounded-full transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Bill Items */}
        <div className="flex-1 overflow-y-auto p-6 relative">
          {/* Paper Texture Effect (CSS Pattern) */}
          <div className="absolute inset-0 pointer-events-none opacity-[0.08] bg-[url('https://www.transparenttextures.com/patterns/paper-fibers.png')]" />

          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-4">
              <div className="w-20 h-20 bg-slate-100 dark:bg-navy-800 rounded-full flex items-center justify-center">
                <ShoppingCart size={40} className="opacity-50" />
              </div>
              <p className="font-medium">
                {lang === "ar" ? "السلة فارغة" : "Cart is empty"}
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Items List */}
              <div className="bg-white dark:bg-navy-800 rounded-2xl shadow-sm border border-slate-200 dark:border-navy-700 overflow-hidden">
                {cart.map((item: CartItem, idx: number) => (
                  <div
                    key={item.cartId}
                    className={cn(
                      "p-4 flex gap-4 transition-colors hover:bg-slate-50 dark:hover:bg-navy-700/50",
                      idx !== cart.length - 1 &&
                        "border-b border-slate-100 dark:border-navy-700"
                    )}
                  >
                    {/* Qty Badge */}
                    <div className="flex flex-col items-center justify-center bg-slate-100 dark:bg-navy-900 w-10 h-10 rounded-lg shrink-0 font-bold text-slate-700 dark:text-slate-300">
                      x{item.quantity}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start mb-1">
                        <h4 className="font-bold text-slate-900 dark:text-white truncate pr-2">
                          {(item as any)[`name_${lang}`]}
                        </h4>
                        <span className="font-semibold text-slate-900 dark:text-white whitespace-nowrap">
                          {formatPrice(item.price * item.quantity, lang)}
                        </span>
                      </div>

                      {item.selectedModifiers.length > 0 && (
                        <div className="text-xs text-slate-500 dark:text-slate-400 mb-2 space-y-0.5">
                          {item.selectedModifiers.map((m: any) => (
                            <div key={m.id} className="flex justify-between">
                              <span>+ {m[`name_${lang}`]}</span>
                              <span>
                                {m.price > 0
                                  ? formatPrice(m.price * item.quantity, lang)
                                  : ""}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}

                      <button
                        onClick={() => onRemove(item.cartId)}
                        className="text-xs text-red-500 hover:text-red-600 font-medium flex items-center gap-1 mt-1"
                      >
                        <X size={12} /> {lang === "ar" ? "حذف" : "Remove"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Summary Section */}
              {/* Total & Checkout Sticky Footer */}
              <div className="sticky bottom-0 left-0 right-0 p-6 bg-white dark:bg-navy-900 border-t border-slate-100 dark:border-navy-800 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] z-20">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-xl font-bold text-slate-900 dark:text-white">
                    {lang === "ar" ? "المجموع الكلي" : "Total Amount"}
                  </span>
                  <span className="text-2xl font-bold text-orange-500">
                    {formatPrice(total, lang)}
                  </span>
                </div>

                <button
                  onClick={onCheckout}
                  className="w-full bg-slate-900 dark:bg-orange-500 text-white py-4 rounded-xl font-bold text-lg shadow-lg shadow-slate-900/20 dark:shadow-orange-500/20 flex items-center justify-center gap-3 hover:translate-y-[-2px] active:translate-y-0 transition-all"
                >
                  {lang === "ar" ? "تأكيد الطلب" : "Confirm Order"}
                  <ArrowRight size={20} />
                </button>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

/**
 * COMPONENT: Checkout Form (iOS Premium Style)
 */
function CheckoutForm({ cart, total, lang, onClose, settings }: any) {
  const dir = lang === "ar" ? "rtl" : "ltr";
  const font = lang === "ar" ? "font-cairo" : "font-inter";
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    address: "",
    notes: "",
  });

  const handleSubmit = (e: any) => {
    e.preventDefault();

    // Construct WhatsApp Message
    let text = `*New Order / طلب جديد* %0A`;
    text += `---------------------------%0A`;
    cart.forEach((item: CartItem) => {
      text += `${item.quantity}x ${(item as any)[`name_${lang}`]} %0A`;
      if (item.selectedModifiers.length > 0) {
        text += `   (${item.selectedModifiers
          .map((m: any) => m[`name_${lang}`])
          .join(", ")}) %0A`;
      }
      text += `%0A`;
    });
    text += `---------------------------%0A`;
    text += `*Total: ${formatPrice(total, lang)}* %0A`;
    text += `---------------------------%0A`;
    text += `Name: ${formData.name} %0A`;
    text += `Phone: ${formData.phone} %0A`;
    text += `Address: ${formData.address} %0A`;
    text += `Notes: ${formData.notes} %0A`;

    // Replace with actual restaurant phone
    window.open(
      `https://wa.me/${
        settings?.whatsapp || RESTAURANT_CONFIG.whatsapp
      }?text=${text}`,
      "_blank"
    );
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center pointer-events-none">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm pointer-events-auto"
      />

      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className={cn(
          "relative w-full max-w-lg bg-white dark:bg-navy-900 backdrop-blur-xl rounded-t-[2.5rem] sm:rounded-[2.5rem] shadow-2xl pointer-events-auto overflow-hidden border-t border-white/20 sm:border sm:border-white/10 p-8",
          font,
          dir === "rtl" ? "rtl" : "ltr"
        )}
        dir={dir}
      >
        {/* Drag Handle */}
        <div className="absolute top-3 left-1/2 -translate-x-1/2 w-12 h-1.5 bg-slate-300/50 dark:bg-white/20 rounded-full sm:hidden z-20" />

        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white">
              {lang === "ar" ? "معلومات التوصيل" : "Delivery Details"}
            </h2>
            <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">
              {lang === "ar"
                ? "أدخل معلوماتك لإكمال الطلب"
                : "Enter your info to complete the order"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 bg-slate-100 dark:bg-navy-800 rounded-full hover:bg-slate-200 transition-colors text-slate-600 dark:text-slate-300"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Input
            label={lang === "ar" ? "الاسم" : "Full Name"}
            value={formData.name}
            onChange={(v: string) => setFormData({ ...formData, name: v })}
            required
            icon={Users}
          />
          <Input
            label={lang === "ar" ? "رقم الهاتف" : "Phone"}
            value={formData.phone}
            onChange={(v: string) => setFormData({ ...formData, phone: v })}
            type="tel"
            required
            icon={Phone}
          />
          <Input
            label={lang === "ar" ? "العنوان بالتفصيل" : "Detailed Address"}
            value={formData.address}
            onChange={(v: string) => setFormData({ ...formData, address: v })}
            required
            icon={MapPin}
          />

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
              {lang === "ar" ? "ملاحظات" : "Notes"}
            </label>
            <textarea
              className="w-full p-4 bg-slate-50 dark:bg-navy-800 rounded-2xl border-none outline-none focus:ring-2 focus:ring-orange-500/50 transition-all text-sm resize-none text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500"
              rows={2}
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              placeholder={
                lang === "ar" ? "ملاحظات إضافية..." : "Additional notes..."
              }
            />
          </div>

          <button
            type="submit"
            className="w-full bg-[#25D366] hover:bg-[#1ebc57] text-white py-4 rounded-2xl font-bold text-lg mt-4 flex items-center justify-center gap-2 shadow-lg shadow-green-500/20 active:scale-95 transition-all"
          >
            <MessageCircle size={20} />
            {lang === "ar" ? "اطلب عبر واتساب" : "Order via WhatsApp"}
          </button>
        </form>
      </motion.div>
    </div>
  );
}

const Input = ({
  label,
  value,
  onChange,
  type = "text",
  required,
  icon: Icon,
}: any) => (
  <div className="space-y-2">
    <label className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
      {label} {required && <span className="text-orange-500">*</span>}
    </label>
    <div className="relative">
      {Icon && (
        <Icon
          size={20}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500"
        />
      )}
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        className={cn(
          "w-full pr-4 py-4 bg-slate-50 dark:bg-navy-800 rounded-2xl border-none outline-none focus:ring-2 focus:ring-orange-500/50 transition-all font-medium text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500",
          Icon ? "pl-12" : "pl-4"
        )}
      />
    </div>
  </div>
);

/**
 * COMPONENT: Live Chat Bubble
 */

/**
 * COMPONENT: Footer (Minimalistic + Map)
 */
// Helper function to extract URL from iframe code or return URL as-is
function extractMapUrl(iframeCodeOrUrl: string | null | undefined): string {
  if (!iframeCodeOrUrl) return "";

  // If it's already a URL (starts with http), return it
  if (iframeCodeOrUrl.trim().startsWith("http")) {
    return iframeCodeOrUrl.trim();
  }

  // If it's iframe HTML, extract the src attribute
  const srcMatch = iframeCodeOrUrl.match(/src=["']([^"']+)["']/);
  if (srcMatch && srcMatch[1]) {
    return srcMatch[1];
  }

  return iframeCodeOrUrl.trim();
}

function Footer({
  lang,
  settings,
  operatingHours,
  socialMedia,
}: {
  lang: Language;
  settings?: any;
  operatingHours?: any[];
  socialMedia?: any[];
}) {
  const dir = lang === "ar" ? "rtl" : "ltr";
  const font = lang === "ar" ? "font-cairo" : "font-inter";
  // Use dynamic operating hours if available
  const isOpen = (() => {
    if (!operatingHours || operatingHours.length === 0) {
      return isRestaurantOpen(); // Fallback to static function
    }
    const now = new Date();
    const days = [
      "sunday",
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "saturday",
    ];
    const currentDay = days[now.getDay()];
    const currentHour = now.getHours() + now.getMinutes() / 60;
    const todayHours = operatingHours.find((h) => h.day_name === currentDay);
    if (todayHours?.is_closed) return false;
    if (todayHours) {
      return (
        currentHour >= todayHours.open_hour &&
        currentHour < todayHours.close_hour
      );
    }
    return isRestaurantOpen();
  })();

  const dayNames: Record<Language, string[]> = {
    ar: [
      "الأحد",
      "الإثنين",
      "الثلاثاء",
      "الأربعاء",
      "الخميس",
      "الجمعة",
      "السبت",
    ],
    en: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
    fr: ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"],
  };
  const days = [
    "sunday",
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
  ];
  const dayLabels = dayNames[lang];

  return (
    <footer
      className={cn(
        "bg-white dark:bg-navy-950 text-slate-600 dark:text-slate-400 border-t border-slate-100 dark:border-navy-800 relative overflow-hidden",
        font,
        dir === "rtl" ? "rtl" : "ltr"
      )}
      dir={dir}
    >
      {/* Subtle Pattern */}
      <div className="absolute inset-0 opacity-[0.06] bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]" />

      <div className="max-w-7xl mx-auto px-6 py-12 sm:py-16 relative z-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-8">
          {/* 1. Brand & Socials */}
          <div className="space-y-6">
            <div className="flex flex-col items-start gap-6">
              <img
                src={settings?.logo_url || RESTAURANT_CONFIG.logo}
                alt={settings?.[`name_${lang}`] || "Mtabal"}
                className="h-24 w-auto object-contain drop-shadow-[0_0_10px_rgba(254,173,29,0.8)]"
              />
              <p className="text-sm leading-relaxed text-slate-500 dark:text-slate-400">
                {lang === "ar"
                  ? "نقدم تجربة طعام استثنائية تمزج بين الأصالة واللمسة العصرية. زورونا لتذوق الفرق."
                  : "Delivering an exceptional dining experience blending authenticity with a modern touch. Visit us to taste the difference."}
              </p>
            </div>
            <div className="flex gap-3">
              {/* Social Media Links from database or fallback */}
              {(socialMedia && socialMedia.length > 0
                ? socialMedia
                : [
                    {
                      platform: "instagram",
                      url: RESTAURANT_CONFIG.socialMedia.instagram,
                    },
                    {
                      platform: "facebook",
                      url: RESTAURANT_CONFIG.socialMedia.facebook,
                    },
                    {
                      platform: "tiktok",
                      url: RESTAURANT_CONFIG.socialMedia.tiktok,
                    },
                  ].filter((s) => s.url)
              ).map((s: any, i: number) => {
                const platform = s.platform || s.platform_name;
                const url = s.url || s.link;
                if (platform === "instagram") {
                  return (
                    <a
                      key={i}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-10 h-10 rounded-full bg-white dark:bg-navy-800 shadow-sm flex items-center justify-center hover:scale-110 transition-transform hover:text-orange-500"
                    >
                      <Instagram size={18} />
                    </a>
                  );
                } else if (platform === "facebook") {
                  return (
                    <a
                      key={i}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-10 h-10 rounded-full bg-white dark:bg-navy-800 shadow-sm flex items-center justify-center hover:scale-110 transition-transform hover:text-orange-500"
                    >
                      <Facebook size={18} />
                    </a>
                  );
                } else if (platform === "tiktok") {
                  return (
                    <a
                      key={i}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-10 h-10 rounded-full bg-white dark:bg-navy-800 shadow-sm flex items-center justify-center hover:scale-110 transition-transform hover:text-orange-500"
                    >
                      <svg
                        viewBox="0 0 24 24"
                        className="w-4 h-4 fill-current"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
                      </svg>
                    </a>
                  );
                }
                return null;
              })}
              {/* WhatsApp Button - Minimalistic & Pro Design */}
              <a
                href={`https://wa.me/${
                  settings?.whatsapp_number || RESTAURANT_CONFIG.whatsapp
                }`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-[#25D366] hover:bg-[#20BA5A] shadow-sm flex items-center justify-center hover:scale-110 transition-all duration-200 group relative"
                aria-label="WhatsApp"
              >
                <svg
                  viewBox="0 0 24 24"
                  className="w-5 h-5 fill-white"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                </svg>
              </a>
            </div>
          </div>

          {/* 2. Contact Info - Address */}
          <div className="space-y-6">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              {lang === "ar" ? "العنوان" : "Address"}
            </h3>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <MapPin size={18} className="text-orange-500 mt-1 shrink-0" />
                <div>
                  <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                    {settings?.[`address_${lang}`] ||
                      RESTAURANT_CONFIG.address[lang] ||
                      (lang === "ar"
                        ? "العنوان غير متوفر"
                        : "Address not available")}
                  </p>
                </div>
              </div>
              {(settings?.phone_reservation || settings?.phone_checkout) && (
                <div className="flex flex-wrap gap-2 pl-7">
                  {settings?.phone_reservation && (
                    <a
                      href={`tel:${settings.phone_reservation.replace(
                        /\s/g,
                        ""
                      )}`}
                      className="text-xs bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 px-3 py-1.5 rounded-lg hover:bg-orange-100 dark:hover:bg-orange-900/30 transition-colors font-mono flex items-center gap-1.5"
                      dir="ltr"
                    >
                      <Phone size={12} />
                      {settings.phone_reservation}
                    </a>
                  )}
                  {settings?.phone_checkout && (
                    <a
                      href={`tel:${settings.phone_checkout.replace(/\s/g, "")}`}
                      className="text-xs bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 px-3 py-1.5 rounded-lg hover:bg-orange-100 dark:hover:bg-orange-900/30 transition-colors font-mono flex items-center gap-1.5"
                      dir="ltr"
                    >
                      <Phone size={12} />
                      {settings.phone_checkout}
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* 3. Operating Hours */}
          <div className="space-y-6">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              {lang === "ar" ? "ساعات العمل" : "Opening Hours"}
              <span
                className={cn(
                  "text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider",
                  isOpen
                    ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                    : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                )}
              >
                {isOpen
                  ? lang === "ar"
                    ? "مفتوح"
                    : "Open"
                  : lang === "ar"
                  ? "مغلق"
                  : "Closed"}
              </span>
            </h3>
            <div className="space-y-2">
              {days.map((day, idx) => {
                // Use dynamic operating hours or fallback to static
                const todayHours = operatingHours?.find(
                  (h: any) => h.day_name === day
                );
                const staticHours =
                  RESTAURANT_CONFIG.operatingHours[
                    day as keyof typeof RESTAURANT_CONFIG.operatingHours
                  ];
                const isToday = days[new Date().getDay()] === day;
                const isClosed = todayHours?.is_closed || false;
                const openHour = todayHours
                  ? todayHours.open_hour
                  : staticHours.open;
                const closeHour = todayHours
                  ? todayHours.close_hour
                  : staticHours.close;
                return (
                  <div
                    key={day}
                    className={cn(
                      "flex justify-between text-sm py-1 border-b border-dashed border-slate-200 dark:border-navy-800 last:border-0",
                      isToday ? "font-bold text-slate-900 dark:text-white" : ""
                    )}
                  >
                    <span>{dayLabels[idx]}</span>
                    <span dir="ltr" className="font-mono text-xs">
                      {isClosed
                        ? lang === "ar"
                          ? "مغلق"
                          : "Closed"
                        : `${formatHours(openHour)} - ${formatHours(
                            closeHour
                          )}`}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 4. Map */}
          <div className="h-[200px] sm:h-[250px] lg:h-[300px] w-full rounded-2xl overflow-hidden shadow-lg border-4 border-white dark:border-navy-800 relative group sm:col-span-2 lg:col-span-1 order-first sm:order-last lg:order-none bg-slate-100 dark:bg-slate-800">
            {(() => {
              const mapUrl = extractMapUrl(settings?.google_map_iframe_url);
              return mapUrl ? (
                <>
                  <iframe
                    src={mapUrl}
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    allowFullScreen={true}
                    loading="lazy"
                    className="relative z-10 grayscale hover:grayscale-0 transition-all duration-700 w-full h-full"
                  />
                  {/* Minimalistic Caption Overlay */}
                  <div className="absolute top-3 left-3 z-20">
                    <div className="bg-white/90 dark:bg-navy-900/90 backdrop-blur-md px-2.5 py-1 rounded-lg shadow-sm border border-white/20">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                        {lang === "ar"
                          ? "موقعنا"
                          : lang === "fr"
                          ? "Notre Emplacement"
                          : "Our Location"}
                      </span>
                    </div>
                  </div>
                </>
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center p-4">
                    <MapPin
                      size={32}
                      className="mx-auto text-slate-400 dark:text-slate-500 mb-2"
                    />
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {lang === "ar" ? "خريطة غير متوفرة" : "Map not available"}
                    </p>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>

        <div className="mt-16 pt-8 border-t border-slate-200 dark:border-navy-800 flex flex-col md:flex-row items-center justify-between text-xs text-slate-400 dark:text-slate-500 gap-4">
          <p>
            © {new Date().getFullYear()}{" "}
            {settings?.[`name_${lang}`] || RESTAURANT_CONFIG.name[lang]}.{" "}
            {lang === "ar"
              ? "جميع الحقوق محفوظة"
              : lang === "fr"
              ? "Tous droits réservés"
              : "All rights reserved"}
            .
          </p>
          <div className="flex items-center gap-1.5">
            <span>
              {lang === "ar"
                ? "القائمة بواسطة"
                : lang === "fr"
                ? "Menu par"
                : "Menu By"}
            </span>
            <a
              href="https://dynamicord.com"
              target="_blank"
              rel="noopener noreferrer"
              className="font-bold text-slate-600 dark:text-slate-300 hover:text-orange-500 dark:hover:text-orange-400 transition-colors underline decoration-slate-300 dark:decoration-slate-600 hover:decoration-orange-500 underline-offset-2"
            >
              dynamicord.com
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

/**
 * COMPONENT: Info Modal (Restaurant Details)
 */
function InfoModal({
  lang,
  onClose,
  settings,
  operatingHours,
  socialMedia,
}: {
  lang: Language;
  onClose: () => void;
  settings?: any;
  operatingHours?: any[];
  socialMedia?: any[];
}) {
  const dir = lang === "ar" ? "rtl" : "ltr";
  const font = lang === "ar" ? "font-cairo" : "font-inter";
  // Use dynamic operating hours if available
  const isOpen = (() => {
    if (!operatingHours || operatingHours.length === 0) {
      return isRestaurantOpen(); // Fallback to static function
    }
    const now = new Date();
    const days = [
      "sunday",
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "saturday",
    ];
    const currentDay = days[now.getDay()];
    const currentHour = now.getHours() + now.getMinutes() / 60;
    const todayHours = operatingHours.find((h) => h.day_name === currentDay);
    if (todayHours?.is_closed) return false;
    if (todayHours) {
      return (
        currentHour >= todayHours.open_hour &&
        currentHour < todayHours.close_hour
      );
    }
    return isRestaurantOpen();
  })();

  const dayNames: Record<Language, string[]> = {
    ar: [
      "الأحد",
      "الإثنين",
      "الثلاثاء",
      "الأربعاء",
      "الخميس",
      "الجمعة",
      "السبت",
    ],
    en: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
    fr: ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"],
  };
  const days = [
    "sunday",
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
  ];
  const dayLabels = dayNames[lang];

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 sm:p-0 pointer-events-none">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm pointer-events-auto"
      />

      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className={cn(
          "relative w-full max-w-2xl bg-white dark:bg-navy-900 rounded-3xl shadow-2xl overflow-hidden pointer-events-auto max-h-[90vh] flex flex-col",
          font,
          dir === "rtl" ? "rtl" : "ltr"
        )}
        dir={dir}
      >
        <div className="p-6 border-b border-slate-100 dark:border-navy-800 flex justify-between items-center bg-slate-50/50 dark:bg-navy-900">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            {lang === "ar" ? "معلومات المطعم" : "Restaurant Info"}
          </h2>
          <button
            onClick={onClose}
            className="p-2 bg-slate-100 dark:bg-navy-800 rounded-full hover:bg-slate-200 transition-colors text-slate-600 dark:text-slate-300"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          {/* Map Section */}
          <div className="h-64 w-full rounded-2xl overflow-hidden shadow-lg relative group">
            <iframe
              src={extractMapUrl(settings?.google_map_iframe_url) || ""}
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen={true}
              loading="lazy"
              className="grayscale hover:grayscale-0 transition-all duration-700"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
            {/* Address & Contact */}
            <div className="space-y-4 lg:space-y-6">
              <h3 className="font-bold text-slate-900 dark:text-white mb-4 text-xl border-b border-slate-100 dark:border-navy-800 pb-2">
                {lang === "ar" ? "العنوان والاتصال" : "Address & Contact"}
              </h3>

              <div className="bg-slate-50 dark:bg-navy-800/50 p-4 rounded-2xl border border-slate-100 dark:border-navy-800">
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-900/20 text-orange-600 flex items-center justify-center shrink-0">
                    <MapPin size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-slate-900 dark:text-white mb-2">
                      {lang === "ar" ? "العنوان" : "Address"}
                    </h4>
                    <p className="text-sm text-slate-600 dark:text-slate-400 break-words leading-relaxed">
                      {settings?.[`address_${lang}`] ||
                        RESTAURANT_CONFIG.address[lang] ||
                        (lang === "ar"
                          ? "العنوان غير متوفر"
                          : "Address not available")}
                    </p>
                  </div>
                </div>
                {(settings?.phone_reservation || settings?.phone_checkout) && (
                  <div className="flex flex-wrap gap-2 pl-0 sm:pl-[52px]">
                    {settings?.phone_reservation && (
                      <a
                        href={`tel:${settings.phone_reservation.replace(
                          /\s/g,
                          ""
                        )}`}
                        className="flex items-center gap-1.5 text-xs font-bold bg-white dark:bg-navy-900 px-3 py-1.5 rounded-lg shadow-sm hover:text-orange-500 transition-colors whitespace-nowrap"
                        dir="ltr"
                      >
                        <Phone size={12} />
                        {settings.phone_reservation}
                      </a>
                    )}
                    {settings?.phone_checkout && (
                      <a
                        href={`tel:${settings.phone_checkout.replace(
                          /\s/g,
                          ""
                        )}`}
                        className="flex items-center gap-1.5 text-xs font-bold bg-white dark:bg-navy-900 px-3 py-1.5 rounded-lg shadow-sm hover:text-orange-500 transition-colors whitespace-nowrap"
                        dir="ltr"
                      >
                        <Phone size={12} />
                        {settings.phone_checkout}
                      </a>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Operating Hours */}
            <div className="bg-slate-50 dark:bg-navy-800 rounded-2xl p-4 sm:p-6">
              <div className="flex items-center gap-3 mb-4">
                <Clock className="text-purple-500" />
                <h3 className="font-bold text-slate-900 dark:text-white">
                  {lang === "ar" ? "ساعات العمل" : "Opening Hours"}
                </h3>
                <span
                  className={cn(
                    "text-xs font-bold px-2 py-0.5 rounded-full ml-auto",
                    isOpen
                      ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                      : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                  )}
                >
                  {isOpen
                    ? lang === "ar"
                      ? "مفتوح"
                      : "Open"
                    : lang === "ar"
                    ? "مغلق"
                    : "Closed"}
                </span>
              </div>
              <div className="space-y-2">
                {days.map((day, idx) => {
                  const hoursData = operatingHours?.find(
                    (h) => h.day_name === day
                  );

                  // Handle database format (open_hour/close_hour) or fallback format (open/close)
                  const openHour = hoursData?.open_hour ?? hoursData?.open;
                  const closeHour = hoursData?.close_hour ?? hoursData?.close;
                  const isClosed = hoursData?.is_closed;

                  // Fallback to static config if no database data
                  const fallbackHours =
                    RESTAURANT_CONFIG.operatingHours[
                      day as keyof typeof RESTAURANT_CONFIG.operatingHours
                    ];
                  const finalOpenHour = openHour ?? fallbackHours?.open;
                  const finalCloseHour = closeHour ?? fallbackHours?.close;

                  if (
                    isClosed ||
                    finalOpenHour === undefined ||
                    finalCloseHour === undefined
                  ) {
                    return (
                      <div key={day} className="flex justify-between text-sm">
                        <span className="text-slate-500 dark:text-slate-400">
                          {dayLabels[idx]}
                        </span>
                        <span className="font-medium text-red-500 dark:text-red-400">
                          {lang === "ar" ? "مغلق" : "Closed"}
                        </span>
                      </div>
                    );
                  }

                  return (
                    <div key={day} className="flex justify-between text-sm">
                      <span className="text-slate-500 dark:text-slate-400">
                        {dayLabels[idx]}
                      </span>
                      <span
                        dir="ltr"
                        className="font-mono font-medium text-slate-700 dark:text-slate-200"
                      >
                        {formatHours(finalOpenHour)} -{" "}
                        {formatHours(finalCloseHour)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
