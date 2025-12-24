export const COMMON_MODIFIERS = [
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

export const RICE_MODIFIERS = [
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

export const SANDWICH_MODIFIERS = [
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

export const GRILL_MODIFIERS = [
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

// This is a large file, so we'll import the raw data from App.tsx
// For now, we'll export the generateItems function that will be used
export function generateItems(MENU_ITEMS_RAW: any[]) {
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
      image: item.img,
      image_fallback:
        "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=300&fit=crop&q=80",
      rating: (4 + Math.random()).toFixed(1),
      prep_time: "15-25 min",
      tags: [],
      modifiers: modifiers,
    };
  });
}

