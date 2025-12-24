import { Utensils, Coffee } from "lucide-react";

export const RESTAURANT_CONFIG = {
  name: {
    ar: "مطعم متَبل",
    en: "Mtabal",
    fr: "Mtabal",
  },
  logo: "/transparent-bg-mtabal.png",
  logoEn: "/transparent-bg-mtabal-en-large.png",
  logoAr: "/transparent-bg-mtabal-ar.png",
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
        "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2706.0748714549336!2d44.44005714457789!3d33.32164936418778!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x155783f407325e0b%3A0xbc5af51a7af7af11!2sChicken%20Mtabal%20restaurant!5e1!3m2!1sen!2slb!4v1763810181537!5m2!1sen!2slb",
    },
    {
      name: { ar: "الفرع الثاني", en: "Second Branch", fr: "Deuxième Branche" },
      address: {
        ar: "صلاح الدين - تكريت - شارع الرئيسي موصل تكريت مجاور مركز شرطة تكريت",
        en: "Salah Al-Din - Tikrit - Main Street Mosul-Tikrit next to Tikrit Police Station",
        fr: "Salah Al-Din - Tikrit - Rue Principale Mossoul-Tikrit à côté du poste de police de Tikrit",
      },
      phone: ["078 26333310", "077 26333310"],
      mapUrl: "",
    },
  ],
  operatingHours: {
    sunday: { open: 11, close: 23.5 },
    monday: { open: 11, close: 23.5 },
    tuesday: { open: 11, close: 23.5 },
    wednesday: { open: 11, close: 23.5 },
    thursday: { open: 11, close: 23.5 },
    friday: { open: 11, close: 23.5 },
    saturday: { open: 11, close: 23.5 },
  },
  socialMedia: {
    instagram: "https://instagram.com/mtabal.restaurant",
    facebook: "https://facebook.com/mtabalrestaurant",
    tiktok: "https://tiktok.com/@mtabal.restaurant",
    youtube: "",
  },
};

export const CATEGORIES = [
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

