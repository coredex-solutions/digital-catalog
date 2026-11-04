// The built-in business modules. A catalog has one main module (catalogs.module), chosen at
// signup, and that decides the words it uses, how its page looks, how customers order and which
// add-ons it can switch on. Every screen reads from here instead of assuming a restaurant.

export const MODULE_IDS = ["restaurant", "cafe", "shop", "services"] as const;
export type ModuleId = (typeof MODULE_IDS)[number];

/**
 * Optional features stored in catalogs.addons. Features that already have their own switch in
 * catalog settings (booking_enabled, delivery in order_types, ai_waiter_enabled) are not here.
 */
export const ADDON_IDS = ["options", "dietary", "tables", "stock"] as const;
export type AddonId = (typeof ADDON_IDS)[number];

/** How a customer receives an order or service. Ids are stored in catalog_settings.order_types */
export const ORDER_TYPES = ["dine_in", "takeaway", "delivery", "pickup", "at_location", "home_visit"] as const;
export type OrderType = (typeof ORDER_TYPES)[number];

/** Order types that need the customer's address */
export const ADDRESS_ORDER_TYPES: readonly OrderType[] = ["delivery", "home_visit"];

type Text = { en: string; ar: string };

/** Words that change with the module; every key exists in both languages */
export interface ModuleVocab {
  /** One thing sold: Dish, Product, Service */
  item: string;
  items: string;
  /** The public page: Menu, Store, Services */
  catalog: string;
  /** The place, as customers say it: the restaurant, the shop */
  business: string;
}

export interface ModuleDefinition {
  id: ModuleId;
  /** lucide-react icon name */
  icon: "UtensilsCrossed" | "Coffee" | "ShoppingBag" | "Sparkles";
  label: Text;
  /** One line under the label at signup */
  tagline: Text;
  /** Optional finer type, stored in catalogs.business_type (used for schema.org and labels) */
  subTypes: { id: string; label: Text; schemaType?: string }[];
  vocab: { en: ModuleVocab; ar: ModuleVocab };
  /** Order types the owner can offer, and the ones switched on for a new catalog */
  orderTypes: readonly OrderType[];
  defaultOrderTypes: readonly OrderType[];
  /**
   * Asking the customer when: "none", "optional" (café pre-orders: leave empty for as soon as
   * possible) or "required" (service appointments)
   */
  schedule: "none" | "optional" | "required";
  /** list = text rows with a small photo, grid = two-column photo cards */
  itemLayout: "list" | "grid";
  /** Separate table reservation sheet (restaurants and cafés only) */
  tableBooking: boolean;
  /** Item editor fields beyond name/description/price/photo */
  itemFields: { duration: boolean; sku: boolean; compareAtPrice: boolean };
  defaultAddons: readonly AddonId[];
  allowedAddons: readonly AddonId[];
  schemaType: string;
  /** The AI assistant's job title and what it helps with (used in its system prompt) */
  assistant: { title: Text; focus: string };
}

export const MODULES: Record<ModuleId, ModuleDefinition> = {
  restaurant: {
    id: "restaurant",
    icon: "UtensilsCrossed",
    label: { en: "Restaurant", ar: "مطعم" },
    tagline: { en: "Menu, table orders, takeaway and delivery", ar: "قائمة طعام، طلبات على الطاولة، سفري وتوصيل" },
    subTypes: [
      { id: "restaurant", label: { en: "Restaurant", ar: "مطعم" }, schemaType: "Restaurant" },
      { id: "fast_food", label: { en: "Fast food / snack", ar: "وجبات سريعة / سناك" }, schemaType: "FastFoodRestaurant" },
      { id: "bar", label: { en: "Bar / pub", ar: "بار" }, schemaType: "BarOrPub" },
      { id: "catering", label: { en: "Catering / home kitchen", ar: "تموين / مطبخ منزلي" }, schemaType: "FoodEstablishment" },
    ],
    vocab: {
      en: { item: "Dish", items: "Dishes", catalog: "Menu", business: "restaurant" },
      ar: { item: "طبق", items: "الأطباق", catalog: "القائمة", business: "المطعم" },
    },
    orderTypes: ["dine_in", "takeaway", "delivery"],
    defaultOrderTypes: ["dine_in", "takeaway"],
    schedule: "none",
    itemLayout: "list",
    tableBooking: true,
    itemFields: { duration: false, sku: false, compareAtPrice: false },
    defaultAddons: ["options", "dietary", "tables"],
    allowedAddons: ["options", "dietary", "tables", "stock"],
    schemaType: "Restaurant",
    assistant: {
      title: { en: "AI waiter", ar: "النادل الذكي" },
      focus: "dishes, ingredients, portions, spice level and what goes well together",
    },
  },
  cafe: {
    id: "cafe",
    icon: "Coffee",
    label: { en: "Café & Bakery", ar: "مقهى ومخبز" },
    tagline: { en: "Drinks, sweets and pre-orders for pickup", ar: "مشروبات، حلويات وطلبات مسبقة للاستلام" },
    subTypes: [
      { id: "cafe", label: { en: "Café / coffee shop", ar: "مقهى" }, schemaType: "CafeOrCoffeeShop" },
      { id: "bakery", label: { en: "Bakery / oven", ar: "مخبز / فرن" }, schemaType: "Bakery" },
      { id: "pastry", label: { en: "Pastry / sweets", ar: "حلويات" }, schemaType: "Bakery" },
      { id: "juice", label: { en: "Juice bar / ice cream", ar: "عصير / بوظة" }, schemaType: "IceCreamShop" },
    ],
    vocab: {
      en: { item: "Item", items: "Items", catalog: "Menu", business: "café" },
      ar: { item: "صنف", items: "الأصناف", catalog: "القائمة", business: "المقهى" },
    },
    orderTypes: ["dine_in", "takeaway", "delivery"],
    defaultOrderTypes: ["takeaway", "dine_in"],
    schedule: "optional",
    itemLayout: "grid",
    tableBooking: true,
    itemFields: { duration: false, sku: false, compareAtPrice: false },
    defaultAddons: ["options", "dietary"],
    allowedAddons: ["options", "dietary", "tables", "stock"],
    schemaType: "CafeOrCoffeeShop",
    assistant: {
      title: { en: "AI barista", ar: "المساعد الذكي" },
      focus: "drinks, sweets and baked goods, ingredients, sizes and pre-orders",
    },
  },
  shop: {
    id: "shop",
    icon: "ShoppingBag",
    label: { en: "Shop", ar: "متجر" },
    tagline: { en: "Products, stock, delivery and pickup", ar: "منتجات، مخزون، توصيل واستلام" },
    subTypes: [
      { id: "retail", label: { en: "General store", ar: "متجر عام" }, schemaType: "Store" },
      { id: "clothing", label: { en: "Clothing & shoes", ar: "ألبسة وأحذية" }, schemaType: "ClothingStore" },
      { id: "electronics", label: { en: "Electronics & phones", ar: "إلكترونيات وهواتف" }, schemaType: "ElectronicsStore" },
      { id: "grocery", label: { en: "Grocery / mini market", ar: "سمانة / ميني ماركت" }, schemaType: "GroceryStore" },
      { id: "pharmacy", label: { en: "Pharmacy / beauty", ar: "صيدلية / تجميل" }, schemaType: "Pharmacy" },
      { id: "gifts", label: { en: "Gifts & flowers", ar: "هدايا وورود" }, schemaType: "Florist" },
    ],
    vocab: {
      en: { item: "Product", items: "Products", catalog: "Store", business: "shop" },
      ar: { item: "منتج", items: "المنتجات", catalog: "المتجر", business: "المتجر" },
    },
    orderTypes: ["delivery", "pickup"],
    defaultOrderTypes: ["delivery", "pickup"],
    schedule: "none",
    itemLayout: "grid",
    tableBooking: false,
    itemFields: { duration: false, sku: true, compareAtPrice: true },
    defaultAddons: ["options", "stock"],
    allowedAddons: ["options", "stock", "dietary"],
    schemaType: "Store",
    assistant: {
      title: { en: "AI shop assistant", ar: "مساعد المتجر الذكي" },
      focus: "products, sizes and colours, what is in stock, delivery and pickup",
    },
  },
  services: {
    id: "services",
    icon: "Sparkles",
    label: { en: "Services", ar: "خدمات" },
    tagline: { en: "Service list and appointment requests", ar: "لائحة خدمات وطلبات مواعيد" },
    subTypes: [
      { id: "salon", label: { en: "Salon / barber", ar: "صالون / حلاق" }, schemaType: "HairSalon" },
      { id: "beauty", label: { en: "Beauty / spa / nails", ar: "تجميل / سبا / أظافر" }, schemaType: "BeautySalon" },
      { id: "clinic", label: { en: "Clinic / dentist", ar: "عيادة / طبيب أسنان" }, schemaType: "MedicalClinic" },
      { id: "fitness", label: { en: "Gym / trainer", ar: "نادٍ رياضي / مدرب" }, schemaType: "ExerciseGym" },
      { id: "repair", label: { en: "Repair / maintenance", ar: "تصليح / صيانة" }, schemaType: "HomeAndConstructionBusiness" },
      { id: "car_care", label: { en: "Car wash / garage", ar: "غسيل سيارات / كاراج" }, schemaType: "AutoRepair" },
      { id: "other_service", label: { en: "Other service", ar: "خدمة أخرى" }, schemaType: "LocalBusiness" },
    ],
    vocab: {
      en: { item: "Service", items: "Services", catalog: "Services", business: "business" },
      ar: { item: "خدمة", items: "الخدمات", catalog: "الخدمات", business: "المحل" },
    },
    orderTypes: ["at_location", "home_visit"],
    defaultOrderTypes: ["at_location"],
    schedule: "required",
    itemLayout: "list",
    tableBooking: false,
    itemFields: { duration: true, sku: false, compareAtPrice: false },
    defaultAddons: ["options"],
    allowedAddons: ["options"],
    schemaType: "LocalBusiness",
    assistant: {
      title: { en: "AI receptionist", ar: "موظف الاستقبال الذكي" },
      focus: "services, how long they take, prices and booking an appointment",
    },
  },
};

export const ADDON_LABELS: Record<AddonId, { label: Text; hint: Text }> = {
  options: {
    label: { en: "Options", ar: "الخيارات" },
    hint: { en: "Sizes, colours or types, each with its own price", ar: "أحجام أو ألوان أو أنواع، لكل منها سعره" },
  },
  dietary: {
    label: { en: "Dietary & allergens", ar: "الحمية ومسببات الحساسية" },
    hint: { en: "Vegetarian, spicy and allergen information", ar: "نباتي، حار، ومعلومات مسببات الحساسية" },
  },
  tables: {
    label: { en: "Table QR codes", ar: "رموز QR للطاولات" },
    hint: { en: "A code per table, so dine-in orders arrive with the table number", ar: "رمز لكل طاولة، فتصل الطلبات مع رقم الطاولة" },
  },
  stock: {
    label: { en: "Stock tracking", ar: "تتبع المخزون" },
    hint: { en: "Set quantities; items sell out by themselves when they reach zero", ar: "حدّد الكميات، وينفد الصنف تلقائياً عند الصفر" },
  },
};
