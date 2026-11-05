// Sample orders for the landing page, one per kind of business. The Orders card and the
// WhatsApp message are both drawn from these, with the same code the real pages use.

import type { OrderDetails } from "../c/[slug]/_lib/whatsapp";
import type { SiteLang } from "./copy";

export const BUSINESSES = ["restaurant", "cafe", "shop", "services"] as const;
export type Business = (typeof BUSINESSES)[number];

type Text = Record<SiteLang, string>;

export interface SampleOrder {
  number: number;
  business: Text;
  customer: Text;
  phone: string;
  /** Order type, table, address, time, fee, discount and payment, as the checkout saves them */
  details: Omit<OrderDetails, "restaurantName" | "name" | "phone" | "address" | "area" | "when"> & {
    address?: Text;
    area?: Text;
    when?: Text;
  };
  lines: { name_en: string; name_ar: string; price: number; currency: "USD"; quantity: number }[];
  /** An older order in the list, already confirmed */
  earlier: { type: OrderDetails["orderType"]; lines: Text };
}

export const SAMPLE_ORDERS: Record<Business, SampleOrder> = {
  restaurant: {
    number: 12,
    business: { en: "Sofra", ar: "سفرة" },
    customer: { en: "Rami", ar: "رامي" },
    phone: "71 123 456",
    details: { orderType: "dine_in", table: "7" },
    lines: [
      { name_en: "Hummus", name_ar: "حمص", price: 4, currency: "USD", quantity: 2 },
      { name_en: "Fattoush", name_ar: "فتوش", price: 5, currency: "USD", quantity: 1 },
      { name_en: "Mixed grill", name_ar: "مشاوي مشكّلة", price: 14, currency: "USD", quantity: 1 },
    ],
    earlier: { type: "takeaway", lines: { en: "Lina · 2 × Chicken shawarma", ar: "لينا · 2 × شاورما دجاج" } },
  },
  cafe: {
    number: 8,
    business: { en: "Nour Bakery", ar: "فرن نور" },
    customer: { en: "Maya", ar: "مايا" },
    phone: "03 456 789",
    details: { orderType: "takeaway", when: { en: "Tomorrow 09:30", ar: "غداً 09:30" }, paymentMethod: "cash" },
    lines: [
      { name_en: "Cappuccino", name_ar: "كابوتشينو", price: 3.5, currency: "USD", quantity: 2 },
      { name_en: "Butter croissant", name_ar: "كرواسان بالزبدة", price: 2, currency: "USD", quantity: 2 },
      { name_en: "Chocolate cake", name_ar: "كيك بالشوكولا", price: 5, currency: "USD", quantity: 1 },
    ],
    earlier: { type: "takeaway", lines: { en: "Ziad · 1 × Iced latte", ar: "زياد · 1 × لاتيه مثلّج" } },
  },
  shop: {
    number: 21,
    business: { en: "Cedar & Co.", ar: "سيدر أند كو" },
    customer: { en: "Karim", ar: "كريم" },
    phone: "70 234 567",
    details: {
      orderType: "delivery",
      address: { en: "Bliss Street, building 12", ar: "شارع بلس، بناية 12" },
      area: { en: "Hamra", ar: "الحمرا" },
      deliveryFee: 3,
      deliveryCurrency: "USD",
      discount: 5,
      discountCurrency: "USD",
      couponCode: "WELCOME5",
      paymentMethod: "whish",
    },
    lines: [
      { name_en: "Cotton tee (M)", name_ar: "تيشيرت قطن (M)", price: 18, currency: "USD", quantity: 1 },
      { name_en: "Backpack", name_ar: "حقيبة ظهر", price: 45, currency: "USD", quantity: 1 },
    ],
    earlier: { type: "pickup", lines: { en: "Sara · 1 × Sweatshirt", ar: "سارة · 1 × سويتشيرت" } },
  },
  services: {
    number: 5,
    business: { en: "Studio Lea", ar: "ستوديو ليا" },
    customer: { en: "Nadine", ar: "نادين" },
    phone: "76 345 678",
    details: { orderType: "at_location", when: { en: "Tuesday 10:30", ar: "الثلاثاء 10:30" } },
    lines: [
      { name_en: "Haircut", name_ar: "قصّ شعر", price: 15, currency: "USD", quantity: 1 },
      { name_en: "Blow-dry", name_ar: "سشوار", price: 10, currency: "USD", quantity: 1 },
    ],
    earlier: { type: "home_visit", lines: { en: "Rana · 1 × Manicure", ar: "رنا · 1 × مانيكور" } },
  },
};

/** The sample's details in one language, ready for buildOrderMessage */
export function sampleDetails(sample: SampleOrder, lang: SiteLang): OrderDetails {
  const { address, area, when, ...rest } = sample.details;
  return {
    ...rest,
    restaurantName: sample.business[lang],
    name: sample.customer[lang],
    phone: sample.phone,
    address: address?.[lang],
    area: area?.[lang],
    when: when?.[lang],
  };
}
