"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { CalendarClock, Clock, Clock3, MapPin, Minus, Plus, Search, ShoppingBag, Truck } from "lucide-react";
import { formatPrice, formatTotal } from "@/lib/catalog/price";
import type { SiteLang } from "./copy";

// Sample pages for the café, shop and services modules, drawn like the real customer page
// (same price code, $1 = 89,500 L.L.). Adding items updates the basket bar; ordering itself
// happens in the live demos.

const PRICES = { primary: "USD" as const, lbpRate: 89500, rateUpdatedAt: null, showDual: true };
const unsplash = (id: string, w = 320, h = 320) => `https://images.unsplash.com/${id}?w=${w}&h=${h}&fit=crop&q=70`;

type Text = { en: string; ar: string };
type SampleItem = {
  id: string;
  name: Text;
  detail?: Text;
  price: number;
  was?: number;
  img?: string;
  minutes?: number;
  left?: number;
  soldOut?: boolean;
};
type SampleId = "cafe" | "shop" | "services";

export const SAMPLES: Record<SampleId, {
  name: Text;
  city: Text;
  cover: string;
  layout: "grid" | "list";
  info: { icon: typeof Clock; text: Text };
  search: Text;
  section: Text;
  items: SampleItem[];
}> = {
  cafe: {
    name: { en: "Nour Bakery", ar: "فرن نور" },
    city: { en: "Achrafieh", ar: "الأشرفية" },
    cover: unsplash("photo-1517433670267-08bbd4be890f", 600, 240),
    layout: "grid",
    info: { icon: Clock, text: { en: "Pickup in about 15 min · Pre-order for a date", ar: "استلام خلال 15 دقيقة تقريباً · طلب مسبق لتاريخ" } },
    search: { en: "Search drinks and sweets", ar: "ابحث في المشروبات والحلويات" },
    section: { en: "Coffee & sweets", ar: "قهوة وحلويات" },
    items: [
      { id: "cappuccino", name: { en: "Cappuccino", ar: "كابوتشينو" }, detail: { en: "Oat or almond milk", ar: "حليب الشوفان أو اللوز" }, price: 3.5, img: unsplash("photo-1572442388796-11668a67e53d") },
      { id: "iced", name: { en: "Iced latte", ar: "لاتيه مثلّج" }, price: 4, img: unsplash("photo-1461023058943-07fcbe16d735") },
      { id: "croissant", name: { en: "Butter croissant", ar: "كرواسان بالزبدة" }, price: 2, img: unsplash("photo-1555507036-ab1f4038808a") },
      { id: "cake", name: { en: "Chocolate cake", ar: "كيك بالشوكولا" }, detail: { en: "Whole cakes by pre-order", ar: "قالب كامل بطلب مسبق" }, price: 5, img: unsplash("photo-1578985545062-69928b1d9587") },
      { id: "cookies", name: { en: "Cookies (3)", ar: "كوكيز (3)" }, price: 3, img: unsplash("photo-1558961363-fa8fdf82db35") },
      { id: "donut", name: { en: "Sprinkle donut", ar: "دونات ملوّنة" }, price: 2, img: unsplash("photo-1551024601-bec78aea704b"), soldOut: true },
    ],
  },
  shop: {
    name: { en: "Cedar & Co.", ar: "سيدر أند كو" },
    city: { en: "Hamra", ar: "الحمرا" },
    cover: unsplash("photo-1567401893414-76b7b1e5a7a5", 600, 240),
    layout: "grid",
    info: { icon: Truck, text: { en: "Delivery or pickup in store", ar: "توصيل أو استلام من المحل" } },
    search: { en: "Search products", ar: "ابحث في المنتجات" },
    section: { en: "New in", ar: "وصل حديثاً" },
    items: [
      { id: "tee", name: { en: "Cotton tee", ar: "تيشيرت قطن" }, detail: { en: "S · M · L · XL", ar: "S · M · L · XL" }, price: 18, img: unsplash("photo-1521572163474-6864f9cf17ab") },
      { id: "black", name: { en: "Print tee", ar: "تيشيرت مطبوع" }, price: 18, was: 25, img: unsplash("photo-1583743814966-8936f5b7be1a") },
      { id: "sweat", name: { en: "Sweatshirt", ar: "سويتشيرت" }, price: 35, left: 3, img: unsplash("photo-1620799140408-edc6dcb6d633") },
      { id: "bag", name: { en: "Backpack", ar: "حقيبة ظهر" }, price: 45, img: unsplash("photo-1553062407-98eeb64c6a62") },
      { id: "basket", name: { en: "Wicker bag", ar: "حقيبة قش" }, price: 40, img: unsplash("photo-1590874103328-eac38a683ce7") },
      { id: "cap", name: { en: "Cap", ar: "قبعة" }, price: 12, img: unsplash("photo-1588850561407-ed78c282e89b"), soldOut: true },
    ],
  },
  services: {
    name: { en: "Studio Lea", ar: "ستوديو ليا" },
    city: { en: "Jounieh", ar: "جونية" },
    cover: unsplash("photo-1521590832167-7bcbfaa6381f", 600, 240),
    layout: "list",
    info: { icon: CalendarClock, text: { en: "Book a free time · At the studio or a home visit", ar: "احجز وقتاً متاحاً · في الاستوديو أو زيارة منزلية" } },
    search: { en: "Search services", ar: "ابحث في الخدمات" },
    section: { en: "Hair & beauty", ar: "شعر وتجميل" },
    items: [
      { id: "cut", name: { en: "Haircut", ar: "قصّ شعر" }, detail: { en: "Wash, cut and style", ar: "غسيل وقصّ وتصفيف" }, price: 15, minutes: 45 },
      { id: "colour", name: { en: "Colour", ar: "صبغة" }, detail: { en: "Full colour with a gloss", ar: "صبغة كاملة مع لمعة" }, price: 60, minutes: 120 },
      { id: "blow", name: { en: "Blow-dry", ar: "سشوار" }, price: 10, minutes: 30 },
      { id: "nails", name: { en: "Manicure", ar: "مانيكور" }, detail: { en: "Shape, care and polish", ar: "تشذيب وعناية وطلاء" }, price: 12, minutes: 40 },
      { id: "makeup", name: { en: "Event make-up", ar: "مكياج سهرة" }, price: 45, minutes: 60 },
    ],
  },
};

const UI = {
  en: {
    sample: "Sample",
    rate: "Prices in dollars · $1 = 89,500 L.L.",
    add: "Add",
    request: "Add to request",
    decrease: "Remove one",
    increase: "Add one",
    soldOut: "Sold out",
    left: (n: number) => `Only ${n} left`,
    sale: "Sale",
    noResults: "Nothing found",
    basket: { cafe: "Your order", shop: "Your cart", services: "Your request" } as Record<SampleId, string>,
    count: (n: number, services: boolean) => (services ? (n === 1 ? "1 service" : `${n} services`) : n === 1 ? "1 item" : `${n} items`),
    switchLabel: "عربي",
  },
  ar: {
    sample: "نموذج",
    rate: "الأسعار بالدولار · 1$ = 89,500 ل.ل.",
    add: "أضف",
    request: "أضف إلى الطلب",
    decrease: "أنقص واحداً",
    increase: "أضف واحداً",
    soldOut: "نفد",
    left: (n: number) => `بقي ${n} فقط`,
    sale: "تخفيض",
    noResults: "لا نتائج",
    basket: { cafe: "طلبك", shop: "سلّتك", services: "طلبك" } as Record<SampleId, string>,
    count: (n: number, services: boolean) =>
      services ? (n === 1 ? "خدمة واحدة" : n === 2 ? "خدمتان" : `${n} خدمات`) : n === 1 ? "صنف واحد" : n === 2 ? "صنفان" : `${n} أصناف`,
    switchLabel: "EN",
  },
};

function normalize(text: string) {
  return text.toLowerCase().replace(/[ً-ْ]/g, "").replace(/[أإآ]/g, "ا").replace(/ة/g, "ه").replace(/ى/g, "ي");
}

export function duration(minutes: number, lang: SiteLang) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (lang === "ar") return [h ? (h === 1 ? "ساعة" : h === 2 ? "ساعتان" : `${h} ساعات`) : "", m ? `${m} دقيقة` : ""].filter(Boolean).join(" و");
  return [h ? `${h} h` : "", m ? `${m} min` : ""].filter(Boolean).join(" ");
}

export function HeroModuleSample({ sample: id, lang: siteLang }: { sample: SampleId; lang: SiteLang }) {
  const [lang, setLang] = useState<SiteLang>(siteLang);
  const [cart, setCart] = useState<Record<string, number>>({});
  const [query, setQuery] = useState("");
  const sample = SAMPLES[id];
  const ui = UI[lang];
  const services = id === "services";
  const price = (amount: number) => formatPrice(amount, "USD", PRICES, lang);
  const Info = sample.info.icon;

  const visible = useMemo(() => {
    const q = normalize(query.trim());
    return q ? sample.items.filter((item) => normalize(`${item.name.en} ${item.name.ar}`).includes(q)) : sample.items;
  }, [query, sample.items]);

  const lines = sample.items.filter((item) => cart[item.id]).map((item) => ({ price: item.price, currency: "USD", quantity: cart[item.id] }));
  const count = lines.reduce((sum, line) => sum + line.quantity, 0);
  const total = formatTotal(lines, PRICES, lang);
  const change = (itemId: string, delta: number) =>
    setCart((current) => {
      const max = sample.items.find((item) => item.id === itemId)?.left ?? (services ? 1 : 99);
      const next = { ...current, [itemId]: Math.min(max, Math.max(0, (current[itemId] || 0) + delta)) };
      if (!next[itemId]) delete next[itemId];
      return next;
    });

  const priceLine = (item: SampleItem) => {
    const p = price(item.price);
    return (
      <p className="flex flex-wrap items-baseline gap-x-1.5">
        <bdi className="text-sm font-semibold tabular-nums">{p.primary}</bdi>
        {item.was && <bdi className="text-xs tabular-nums text-ui-muted line-through">{price(item.was).primary}</bdi>}
        {!item.was && p.secondary && <bdi className="text-[11px] tabular-nums text-ui-muted">{p.secondary}</bdi>}
      </p>
    );
  };

  const addControl = (item: SampleItem, className: string) => {
    if (item.soldOut) return null;
    if (cart[item.id] && !services) {
      return (
        <div className={`flex h-8 items-center rounded-control bg-ui-primary text-ui-primary-fg shadow-sm ${className}`}>
          <button type="button" onClick={() => change(item.id, -1)} aria-label={ui.decrease} className="flex h-full w-8 items-center justify-center">
            <Minus className="h-3.5 w-3.5" aria-hidden />
          </button>
          <span className="min-w-4 text-center text-sm font-semibold tabular-nums">{cart[item.id]}</span>
          <button type="button" onClick={() => change(item.id, 1)} aria-label={ui.increase} className="flex h-full w-8 items-center justify-center">
            <Plus className="h-3.5 w-3.5" aria-hidden />
          </button>
        </div>
      );
    }
    const selected = services && cart[item.id];
    return (
      <button
        type="button"
        onClick={() => change(item.id, selected ? -1 : 1)}
        aria-label={`${services ? ui.request : ui.add}: ${item.name[lang]}`}
        aria-pressed={services ? Boolean(selected) : undefined}
        className={`flex h-8 w-8 items-center justify-center rounded-control border shadow-sm transition-transform active:scale-90 ${
          selected ? "border-ui-primary bg-ui-primary text-ui-primary-fg" : "border-ui-line bg-ui-surface text-ui-primary"
        } ${className}`}
      >
        {selected ? <Minus className="h-4 w-4" aria-hidden /> : <Plus className="h-4 w-4" aria-hidden />}
      </button>
    );
  };

  return (
    <div lang={lang} dir={lang === "ar" ? "rtl" : "ltr"} className="relative h-[580px] overflow-hidden bg-ui-bg text-ui-ink">
      <div className="h-full overflow-y-auto overscroll-contain pb-20 [scrollbar-width:none]">
        {/* Cover */}
        <div className="relative h-24 bg-ui-subtle">
          <Image src={sample.cover} alt="" fill sizes="280px" className="object-cover" />
          <button
            type="button"
            onClick={() => setLang(lang === "ar" ? "en" : "ar")}
            className="absolute end-2 top-2 min-h-8 rounded-control bg-ui-surface px-3 text-xs font-semibold shadow-sm"
            lang={lang === "ar" ? "en" : "ar"}
          >
            {ui.switchLabel}
          </button>
        </div>

        {/* Header */}
        <div className="px-3 pt-3">
          <div className="flex items-center gap-2">
            <h3 className="text-xl font-semibold">{sample.name[lang]}</h3>
            <span className="rounded-full bg-ui-subtle px-2 py-0.5 text-[11px] font-semibold text-ui-primary">{ui.sample}</span>
          </div>
          <p className="mt-0.5 flex items-center gap-1 text-xs text-ui-muted">
            <MapPin className="h-3.5 w-3.5" aria-hidden />
            {sample.city[lang]}
          </p>
          <p className="mt-2 flex items-center gap-1.5 rounded-control bg-ui-subtle px-2.5 py-1.5 text-xs font-medium text-ui-heading">
            <Info className="h-3.5 w-3.5 shrink-0" aria-hidden />
            {sample.info.text[lang]}
          </p>
          <p className="mt-2 text-xs text-ui-muted">{ui.rate}</p>
          <label className="mt-2 flex min-h-10 items-center gap-2 rounded-control border border-ui-input bg-ui-surface px-2.5 focus-within:border-ui-primary">
            <Search className="h-4 w-4 shrink-0 text-ui-muted" aria-hidden />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={sample.search[lang]}
              aria-label={sample.search[lang]}
              className="w-full min-w-0 bg-transparent text-sm outline-none placeholder:text-ui-muted"
            />
          </label>
        </div>

        {/* Items */}
        <section className="px-3 pt-4">
          <h4 className="text-base font-semibold">{sample.section[lang]}</h4>
          {visible.length === 0 && <p className="py-10 text-center text-sm text-ui-muted">{ui.noResults}</p>}
          {sample.layout === "grid" ? (
            <ul className="mt-2 grid grid-cols-2 gap-2">
              {visible.map((item) => (
                <li key={item.id} className={`overflow-hidden rounded-control border border-ui-line bg-ui-surface ${item.soldOut ? "opacity-60" : ""}`}>
                  <div className="relative aspect-square bg-ui-subtle">
                    {item.img && <Image src={item.img} alt="" fill sizes="130px" className="object-cover" />}
                    {item.was && <span className="absolute start-1.5 top-1.5 rounded-full bg-ui-primary px-2 py-0.5 text-[10px] font-semibold text-ui-primary-fg">{ui.sale}</span>}
                    {addControl(item, "absolute bottom-1.5 end-1.5")}
                  </div>
                  <div className="p-2">
                    <p className="truncate text-sm font-semibold">{item.name[lang]}</p>
                    {item.detail && <p className="truncate text-[11px] text-ui-muted">{item.detail[lang]}</p>}
                    {item.soldOut ? (
                      <p className="text-xs font-semibold text-ui-danger">{ui.soldOut}</p>
                    ) : (
                      <>
                        {priceLine(item)}
                        {item.left && <p className="text-[11px] font-semibold text-ui-warning">{ui.left(item.left)}</p>}
                      </>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <ul className="divide-y divide-[var(--ui-line)]">
              {visible.map((item) => (
                <li key={item.id} className="flex items-center gap-3 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold">{item.name[lang]}</p>
                    {item.detail && <p className="text-xs text-ui-muted">{item.detail[lang]}</p>}
                    {item.minutes && (
                      <p className="mt-0.5 flex items-center gap-1 text-xs text-ui-muted">
                        <Clock3 className="h-3.5 w-3.5" aria-hidden />
                        <bdi>{duration(item.minutes, lang)}</bdi>
                      </p>
                    )}
                    <div className="mt-1">{priceLine(item)}</div>
                  </div>
                  {addControl(item, "shrink-0")}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {/* Basket bar */}
      {count > 0 && (
        <div className="site-pop absolute inset-x-2 bottom-2 flex min-h-12 items-center gap-2 rounded-control bg-ui-primary px-3 text-ui-primary-fg shadow-lg" role="status">
          {services ? <CalendarClock className="h-5 w-5" aria-hidden /> : <ShoppingBag className="h-5 w-5" aria-hidden />}
          <span className="min-w-0 leading-tight">
            <span className="block text-sm font-semibold">{ui.basket[id]}</span>
            <span className="block text-[11px] opacity-85">{ui.count(count, services)}</span>
          </span>
          <span className="ms-auto text-end leading-tight">
            <bdi className="block text-sm font-semibold tabular-nums">{total.primary}</bdi>
            {total.secondary && <bdi className="block text-[10px] tabular-nums opacity-80">{total.secondary}</bdi>}
          </span>
        </div>
      )}
    </div>
  );
}

export type { SampleId };
