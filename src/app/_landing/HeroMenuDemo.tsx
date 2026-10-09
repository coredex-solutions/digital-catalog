"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { CheckCheck, MapPin, Minus, Plus, Search, ShoppingBag, Store, X } from "lucide-react";
import { formatPrice, formatTotal } from "@/lib/catalog/price";
import { buildOrderMessage, type OrderType } from "../c/[slug]/_lib/whatsapp";
import { Formatted } from "./WhatsAppDemo";
import type { SiteLang } from "./copy";

// Sample prices, formatted by the real menu code at $1 = 89,500 L.L.
const PRICES = { primary: "USD" as const, lbpRate: 89500, rateUpdatedAt: null, showDual: true };
const unsplash = (id: string) => `https://images.unsplash.com/${id}?w=240&h=240&fit=crop&q=75`;

type Dish = { id: string; cat: string; price: number; img?: string; soldOut?: boolean; en: [string, string]; ar: [string, string] };

const CATEGORIES = [
  { id: "mezze", en: "Mezze", ar: "مازة" },
  { id: "grills", en: "Grills", ar: "مشاوي" },
  { id: "desserts", en: "Desserts", ar: "حلويات" },
  { id: "drinks", en: "Drinks", ar: "مشروبات" },
];

const DISHES: Dish[] = [
  { id: "hummus", cat: "mezze", price: 4, img: "/landing/hummus.png", en: ["Hummus", "Chickpeas, tahini, lemon and olive oil"], ar: ["حمص", "حمص بالطحينة والليمون وزيت الزيتون"] },
  { id: "tabbouleh", cat: "mezze", price: 5, img: unsplash("photo-1786174044919-c2119725afa1"), en: ["Tabbouleh", "Parsley, tomato, bulgur, mint and lemon"], ar: ["تبولة", "بقدونس، بندورة، برغل، نعنع وليمون"] },
  { id: "kibbeh", cat: "mezze", price: 6, img: "/landing/kibbeh.png", en: ["Fried kibbeh", "Bulgur shells filled with spiced meat and pine nuts"], ar: ["كبة مقلية", "برغل محشو باللحمة المتبّلة والصنوبر"] },
  { id: "baba", cat: "mezze", price: 4.5, img: "/landing/baba-ganoush.png", en: ["Baba ghanoush", "Smoked eggplant, tahini and pomegranate"], ar: ["بابا غنوج", "باذنجان مشوي مع الطحينة والرمان"] },
  { id: "fattoush", cat: "mezze", price: 5, en: ["Fattoush", "Garden vegetables, toasted bread and sumac"], ar: ["فتوش", "خضار مشكلة، خبز محمص وسماق"] },
  { id: "grill", cat: "grills", price: 18, img: unsplash("photo-1771285119318-b342c3ecc51c"), en: ["Mixed grill", "Kafta, shish taouk and lamb with grilled vegetables"], ar: ["مشاوي مشكلة", "كفتة، شيش طاووق ولحم غنم مع خضار مشوية"] },
  { id: "taouk", cat: "grills", price: 11, img: unsplash("photo-1779086646395-00668466d0d0"), en: ["Shish taouk", "Chicken skewers with garlic sauce and fries"], ar: ["شيش طاووق", "أسياخ دجاج مع الثوم والبطاطا"] },
  { id: "shawarma", cat: "grills", price: 6, img: unsplash("photo-1529006557810-274b9b2fc783"), en: ["Chicken shawarma", "Garlic sauce, pickles and fries in Lebanese bread"], ar: ["شاورما دجاج", "ثوم، كبيس وبطاطا بخبز لبناني"] },
  { id: "baklava", cat: "desserts", price: 5, img: unsplash("photo-1761828122856-8703baac8e86"), en: ["Baklava", "Filo pastry with pistachios and syrup"], ar: ["بقلاوة", "عجينة رقائق بالفستق والقطر"] },
  { id: "bulbul", cat: "desserts", price: 4, img: unsplash("photo-1778447812923-88a9e3e6b567"), en: ["Ish el bulbul", "Crisp kataifi nest with pistachios"], ar: ["عش البلبل", "عجينة كنافة مقرمشة بالفستق"] },
  { id: "lemonade", cat: "drinks", price: 3, img: unsplash("photo-1555949366-819808d99159"), en: ["Lemonade with mint", "Fresh lemons and mint"], ar: ["ليموناضة بالنعناع", "ليمون طازج ونعناع"] },
  { id: "coffee", cat: "drinks", price: 2, img: unsplash("photo-1757079649052-a24c6ab32c64"), en: ["Lebanese coffee", "Cardamom coffee in a small cup"], ar: ["قهوة عربية", "قهوة بالهيل بفنجان صغير"] },
  { id: "jallab", cat: "drinks", price: 3, soldOut: true, en: ["Jallab", "Grape molasses and rose water"], ar: ["جلاب", "دبس العنب وماء الورد"] },
];

const UI = {
  en: {
    name: "Sofra", sample: "Sample", city: "Beirut", rate: "Prices in dollars · $1 = 89,500 L.L.",
    search: "Search the menu", noResults: "No dishes found", soldOut: "Sold out", notAvailable: "Not available right now",
    add: "Add", addToOrder: "Add to order", viewOrder: "View order", yourOrder: "Your order", total: "Total",
    send: "Send order on WhatsApp", close: "Close", back: "Back to menu", decrease: "Remove one", increase: "Add one",
    sentNote: "This is the message the restaurant receives. Nothing is sent from this sample.",
    types: { dine_in: "Dine-in", takeaway: "Takeaway", delivery: "Delivery" } as Record<OrderType, string>,
    sampleName: "Rami", address: "Hamra Street, building 4", area: "Hamra", switchLabel: "عربي",
  },
  ar: {
    name: "سفرة", sample: "نموذج", city: "بيروت", rate: "الأسعار بالدولار · 1$ = 89,500 ل.ل.",
    search: "ابحث في القائمة", noResults: "لا توجد أطباق", soldOut: "نفد", notAvailable: "غير متوفر حالياً",
    add: "أضف", addToOrder: "أضف إلى الطلب", viewOrder: "عرض الطلب", yourOrder: "طلبك", total: "المجموع",
    send: "أرسل الطلب عبر واتساب", close: "إغلاق", back: "العودة إلى القائمة", decrease: "أنقص واحداً", increase: "أضف واحداً",
    sentNote: "هذه الرسالة التي يستلمها المطعم. لا يُرسل شيء من هذا النموذج.",
    types: { dine_in: "داخل المطعم", takeaway: "سفري", delivery: "توصيل" } as Record<OrderType, string>,
    sampleName: "رامي", address: "شارع الحمرا، بناية 4", area: "الحمرا", switchLabel: "EN",
  },
};

type Sheet = { kind: "item"; id: string } | { kind: "cart" } | { kind: "sent" } | null;

function normalize(text: string) {
  return text.toLowerCase().replace(/[ً-ْ]/g, "").replace(/[أإآ]/g, "ا").replace(/ة/g, "ه").replace(/ى/g, "ي");
}

/** A small, fully working menu inside the hero phone: no database, same price and order code as the real menu */
export function HeroMenuDemo({ lang: siteLang }: { lang: SiteLang }) {
  const [lang, setLang] = useState<SiteLang>(siteLang);
  const [cart, setCart] = useState<Record<string, number>>({});
  const [sheet, setSheet] = useState<Sheet>(null);
  const [orderType, setOrderType] = useState<OrderType>("dine_in");
  const [query, setQuery] = useState("");
  const [activeCat, setActiveCat] = useState(CATEGORIES[0].id);
  const scrollRef = useRef<HTMLDivElement>(null);
  const navRef = useRef<HTMLDivElement>(null);
  const ui = UI[lang];
  const price = (amount: number) => formatPrice(amount, "USD", PRICES, lang);

  const visible = useMemo(() => {
    const q = normalize(query.trim());
    return q ? DISHES.filter((d) => normalize(`${d.en[0]} ${d.ar[0]} ${d.en[1]} ${d.ar[1]}`).includes(q)) : DISHES;
  }, [query]);

  const lines = DISHES.filter((d) => cart[d.id]).map((d) => ({ ...d, quantity: cart[d.id] }));
  const count = lines.reduce((sum, l) => sum + l.quantity, 0);
  const total = formatTotal(lines.map((l) => ({ price: l.price, currency: "USD", quantity: l.quantity })), PRICES, lang);

  const change = (id: string, delta: number) =>
    setCart((c) => {
      const next = { ...c, [id]: Math.max(0, (c[id] || 0) + delta) };
      if (!next[id]) delete next[id];
      return next;
    });

  // Highlight the section in view
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onScroll = () => {
      const offset = (navRef.current?.offsetHeight || 0) + 8;
      let current = CATEGORIES[0].id;
      for (const cat of CATEGORIES) {
        const section = el.querySelector<HTMLElement>(`[data-cat="${cat.id}"]`);
        if (section && section.offsetTop - offset <= el.scrollTop) current = cat.id;
      }
      setActiveCat(current);
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  // Escape closes the open sheet
  useEffect(() => {
    if (!sheet) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setSheet(null);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [sheet]);

  const jumpTo = (id: string) => {
    const el = scrollRef.current;
    const section = el?.querySelector<HTMLElement>(`[data-cat="${id}"]`);
    if (!el || !section) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollTo({ top: section.offsetTop - (navRef.current?.offsetHeight || 0), behavior: reduce ? "auto" : "smooth" });
  };

  const message = buildOrderMessage(
    lines.map((l) => ({ name_en: l.en[0], name_ar: l.ar[0], price: l.price, currency: "USD", quantity: l.quantity })),
    {
      restaurantName: ui.name,
      orderType,
      table: orderType === "dine_in" ? "7" : undefined,
      address: orderType === "delivery" ? ui.address : undefined,
      area: orderType === "delivery" ? ui.area : undefined,
      name: ui.sampleName,
      phone: "+961 71 123 456",
    },
    PRICES,
    lang
  );

  const stepper = (id: string, size: "sm" | "lg" = "sm") => (
    <div className={`flex items-center rounded-control bg-ui-primary text-ui-primary-fg ${size === "lg" ? "h-11" : "h-8"}`}>
      <button type="button" onClick={() => change(id, -1)} aria-label={ui.decrease} className={`flex h-full items-center justify-center ${size === "lg" ? "w-11" : "w-8"}`}>
        <Minus className="h-3.5 w-3.5" aria-hidden />
      </button>
      <span className="min-w-5 text-center text-sm font-semibold tabular-nums">{cart[id]}</span>
      <button type="button" onClick={() => change(id, 1)} aria-label={ui.increase} className={`flex h-full items-center justify-center ${size === "lg" ? "w-11" : "w-8"}`}>
        <Plus className="h-3.5 w-3.5" aria-hidden />
      </button>
    </div>
  );

  const priceLine = (amount: number, className = "") => {
    const p = price(amount);
    return (
      <p className={`flex flex-wrap items-baseline gap-x-1.5 ${className}`}>
        <bdi className="font-semibold tabular-nums">{p.primary}</bdi>
        {p.secondary && <bdi className="text-xs tabular-nums text-ui-muted">{p.secondary}</bdi>}
      </p>
    );
  };

  const openDish = sheet?.kind === "item" ? DISHES.find((d) => d.id === sheet.id) : null;

  return (
    <div
      lang={lang}
      dir={lang === "ar" ? "rtl" : "ltr"}
      className="relative h-[580px] overflow-hidden bg-ui-bg text-ui-ink"
      style={lang === "ar" ? { fontFamily: "var(--font-platform-arabic), sans-serif" } : undefined}
    >
      <div ref={scrollRef} className="relative h-full overflow-y-auto overscroll-contain pb-20 [scrollbar-width:none]">
        {/* Cover */}
        <div className="relative h-24 bg-ui-subtle">
          <Image src={unsplash("photo-1767114915974-3481fa23cbb0").replace("w=240&h=240", "w=600&h=240")} alt="" fill sizes="280px" className="object-cover" priority />
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
            <h3 className="text-xl font-semibold">{ui.name}</h3>
            <span className="rounded-full bg-ui-subtle px-2 py-0.5 text-[11px] font-semibold text-ui-primary">{ui.sample}</span>
          </div>
          <p className="mt-0.5 flex items-center gap-1 text-xs text-ui-muted">
            <MapPin className="h-3.5 w-3.5" aria-hidden />
            {ui.city}
          </p>
          <p className="mt-2 text-xs text-ui-muted">{ui.rate}</p>
          <label className="mt-2 flex min-h-10 items-center gap-2 rounded-control border border-ui-input bg-ui-surface px-2.5 focus-within:border-ui-primary">
            <Search className="h-4 w-4 shrink-0 text-ui-muted" aria-hidden />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={ui.search}
              aria-label={ui.search}
              className="w-full min-w-0 bg-transparent text-sm outline-none placeholder:text-ui-muted"
            />
          </label>
        </div>

        {/* Section chips */}
        {!query && (
          <div ref={navRef} className="sticky top-0 z-10 mt-2 border-b border-ui-line bg-ui-bg">
            <div className="flex gap-1 overflow-x-auto px-3 py-2 [scrollbar-width:none]">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => jumpTo(cat.id)}
                  aria-current={activeCat === cat.id ? "true" : undefined}
                  className={`shrink-0 rounded-control px-3 py-1.5 text-sm font-semibold transition-colors ${activeCat === cat.id ? "bg-ui-primary text-ui-primary-fg" : "text-ui-muted hover:text-ui-ink"}`}
                >
                  {cat[lang]}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Dishes */}
        <div className="px-3">
          {visible.length === 0 && <p className="py-10 text-center text-sm text-ui-muted">{ui.noResults}</p>}
          {CATEGORIES.map((cat) => {
            const dishes = visible.filter((d) => d.cat === cat.id);
            if (!dishes.length) return null;
            return (
              <section key={cat.id} data-cat={cat.id} className="pt-3">
                <h4 className="text-base font-semibold">{cat[lang]}</h4>
                <ul className="divide-y divide-[var(--ui-line)]">
                  {dishes.map((dish) => (
                    <li key={dish.id} className={`flex gap-2.5 py-2.5 ${dish.soldOut ? "opacity-60" : ""}`}>
                      <button type="button" onClick={() => setSheet({ kind: "item", id: dish.id })} className="min-w-0 flex-1 text-start">
                        <span className="block text-sm font-semibold">{dish[lang][0]}</span>
                        <span className="line-clamp-2 text-xs text-ui-muted">{dish[lang][1]}</span>
                        {dish.soldOut ? (
                          <span className="mt-1 inline-block text-xs font-semibold text-ui-danger">{ui.soldOut}</span>
                        ) : (
                          priceLine(dish.price, "mt-1 text-sm")
                        )}
                      </button>
                      <div className="relative shrink-0">
                        {dish.img ? (
                          <button type="button" onClick={() => setSheet({ kind: "item", id: dish.id })} className="relative block h-16 w-16 overflow-hidden rounded-control bg-ui-subtle" tabIndex={-1} aria-hidden>
                            <Image src={dish.img} alt="" fill sizes="64px" className="object-cover" />
                          </button>
                        ) : (
                          <div className="h-16 w-16" />
                        )}
                        {!dish.soldOut &&
                          (cart[dish.id] ? (
                            <div className="absolute -bottom-1.5 end-0 shadow-sm">
                              {stepper(dish.id)}
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => change(dish.id, 1)}
                              aria-label={`${ui.add} ${dish[lang][0]}`}
                              className="absolute -bottom-1.5 end-0 flex h-8 w-8 items-center justify-center rounded-control border border-ui-line bg-ui-surface text-ui-primary shadow-sm transition-transform active:scale-90"
                            >
                              <Plus className="h-4 w-4" aria-hidden />
                            </button>
                          ))}
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}
        </div>
      </div>

      {/* Order bar */}
      {count > 0 && !sheet && (
        <button
          type="button"
          onClick={() => setSheet({ kind: "cart" })}
          className="site-pop absolute inset-x-2 bottom-2 flex min-h-12 items-center gap-2 rounded-control bg-ui-primary px-3 text-ui-primary-fg shadow-lg"
        >
          <span className="relative">
            <ShoppingBag className="h-5 w-5" aria-hidden />
            <span className="absolute -end-2 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-ui-surface px-1 text-[10px] font-bold text-ui-primary">{count}</span>
          </span>
          <span className="text-sm font-semibold">{ui.viewOrder}</span>
          <span className="ms-auto text-end leading-tight">
            <bdi className="block text-sm font-semibold tabular-nums">{total.primary}</bdi>
            {total.secondary && <bdi className="block text-[10px] tabular-nums opacity-80">{total.secondary}</bdi>}
          </span>
        </button>
      )}

      {/* Sheets */}
      {sheet && (
        <div className="absolute inset-0 z-20 flex flex-col justify-end bg-black/40" onClick={() => setSheet(null)}>
          <div
            role="dialog"
            aria-modal="true"
            aria-label={openDish ? openDish[lang][0] : sheet.kind === "cart" ? ui.yourOrder : ui.send}
            onClick={(e) => e.stopPropagation()}
            className="site-pop max-h-[90%] overflow-y-auto rounded-t-panel bg-ui-surface"
          >
            {openDish && (
              <div>
                <div className="relative h-36 bg-ui-subtle">
                  {openDish.img && <Image src={openDish.img} alt="" fill sizes="280px" className="object-cover" />}
                  <button type="button" onClick={() => setSheet(null)} aria-label={ui.close} className="absolute end-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-ui-surface shadow-sm">
                    <X className="h-4 w-4" aria-hidden />
                  </button>
                </div>
                <div className="p-3">
                  <h4 className="text-lg font-semibold">{openDish[lang][0]}</h4>
                  <p className="mt-1 text-sm text-ui-muted">{openDish[lang][1]}</p>
                  {openDish.soldOut ? (
                    <p className="mt-3 rounded-control bg-ui-subtle px-3 py-2.5 text-center text-sm font-semibold text-ui-danger">{ui.notAvailable}</p>
                  ) : (
                    <>
                      {priceLine(openDish.price, "mt-2")}
                      <button
                        type="button"
                        onClick={() => {
                          change(openDish.id, 1);
                          setSheet(null);
                        }}
                        className="mt-3 flex min-h-11 w-full items-center justify-center gap-2 rounded-control bg-ui-primary px-3 text-sm font-semibold text-ui-primary-fg hover:bg-ui-primary-hover"
                      >
                        {ui.addToOrder} · <bdi>{price(openDish.price).primary}</bdi>
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}

            {sheet.kind === "cart" && (
              <div className="p-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-lg font-semibold">{ui.yourOrder}</h4>
                  <button type="button" onClick={() => setSheet(null)} aria-label={ui.close} className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-ui-subtle">
                    <X className="h-4 w-4" aria-hidden />
                  </button>
                </div>
                <ul className="mt-1 divide-y divide-[var(--ui-line)]">
                  {lines.map((line) => (
                    <li key={line.id} className="flex items-center gap-2 py-2">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold">{line[lang][0]}</p>
                        <bdi className="text-xs tabular-nums text-ui-muted">{price(line.price * line.quantity).primary}</bdi>
                      </div>
                      {stepper(line.id)}
                    </li>
                  ))}
                </ul>
                <div role="radiogroup" className="mt-2 grid grid-cols-3 gap-1 rounded-control bg-ui-subtle p-1">
                  {(Object.keys(ui.types) as OrderType[]).map((type) => (
                    <button
                      key={type}
                      type="button"
                      role="radio"
                      aria-checked={orderType === type}
                      onClick={() => setOrderType(type)}
                      className={`min-h-9 rounded-[8px] px-1 text-xs font-semibold transition-colors ${orderType === type ? "bg-ui-surface text-ui-ink shadow-sm" : "text-ui-muted"}`}
                    >
                      {ui.types[type]}
                    </button>
                  ))}
                </div>
                <div className="mt-3 flex items-baseline justify-between">
                  <span className="text-sm font-semibold">{ui.total}</span>
                  <span className="text-end">
                    <bdi className="block font-semibold tabular-nums">{total.primary}</bdi>
                    {total.secondary && <bdi className="block text-xs tabular-nums text-ui-muted">{total.secondary}</bdi>}
                  </span>
                </div>
                <button
                  type="button"
                  disabled={!count}
                  onClick={() => setSheet({ kind: "sent" })}
                  className="mt-3 flex min-h-11 w-full items-center justify-center rounded-control bg-ui-primary px-3 text-sm font-semibold text-ui-primary-fg hover:bg-ui-primary-hover disabled:opacity-50"
                >
                  {ui.send}
                </button>
              </div>
            )}

            {sheet.kind === "sent" && (
              <div>
                <div className="flex items-center gap-2 bg-ui-primary px-3 py-2.5 text-ui-primary-fg">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/15" aria-hidden>
                    <Store className="h-4 w-4" />
                  </span>
                  <span className="text-sm font-semibold">{ui.name}</span>
                  <button type="button" onClick={() => setSheet(null)} aria-label={ui.close} className="ms-auto flex h-8 w-8 items-center justify-center rounded-full hover:bg-white/15">
                    <X className="h-4 w-4" aria-hidden />
                  </button>
                </div>
                <div className="bg-[#EFEAE2] p-3">
                  <div className="ms-auto max-w-[95%] rounded-panel rounded-se-[4px] bg-[#D9FDD3] px-3 py-2 text-[13px] leading-relaxed text-[#111B21] shadow-sm">
                    <Formatted text={message} />
                    <span className="mt-1 flex items-center justify-end gap-1 text-[10px] text-[#54656F]">
                      <bdi>12:41</bdi>
                      <CheckCheck className="h-3.5 w-3.5 text-[#53BDEB]" aria-hidden />
                    </span>
                  </div>
                </div>
                <div className="p-3">
                  <p className="text-xs text-ui-muted">{ui.sentNote}</p>
                  <button
                    type="button"
                    onClick={() => {
                      setCart({});
                      setSheet(null);
                    }}
                    className="mt-2 flex min-h-11 w-full items-center justify-center rounded-control border border-ui-input px-3 text-sm font-semibold hover:bg-ui-subtle"
                  >
                    {ui.back}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
