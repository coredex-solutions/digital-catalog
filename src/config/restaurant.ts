import { Utensils, Coffee } from "lucide-react";

export const RESTAURANT_CONFIG = {
  name: {
    ar: "اسم المطعم",
    en: "Restaurant Name",
    fr: "Nom du Restaurant",
  },
  logo: "/placeholder-logo.png",
  logoEn: "/placeholder-logo.png",
  logoAr: "/placeholder-logo.png",
  image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200&h=800&fit=crop&q=80",
  whatsapp: "",
  phone: "",
  email: "",
  address: {
    ar: "العنوان الرئيسي",
    en: "Main Address",
    fr: "Adresse Principale",
  },
  addressFull: {
    ar: "العنوان الكامل",
    en: "Full Address",
    fr: "Adresse Complète",
  },
  branches: [],
  operatingHours: {
    sunday: { open: 9, close: 22 },
    monday: { open: 9, close: 22 },
    tuesday: { open: 9, close: 22 },
    wednesday: { open: 9, close: 22 },
    thursday: { open: 9, close: 22 },
    friday: { open: 9, close: 22 },
    saturday: { open: 9, close: 22 },
  },
  socialMedia: {
    instagram: "",
    facebook: "",
    tiktok: "",
    youtube: "",
  },
};

export const CATEGORIES: any[] = [];

export function isRestaurantOpen(): boolean {
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

