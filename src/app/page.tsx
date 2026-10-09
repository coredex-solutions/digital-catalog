import type { Metadata } from "next";
import Link from "next/link";
import { cookies, headers } from "next/headers";
import { Noto_Sans_Arabic } from "next/font/google";
import Image from "next/image";
import QRCode from "qrcode";
import {
  ArrowUpRight,
  BarChart3,
  Ban,
  Banknote,
  Check,
  Clock,
  Languages,
  Mail,
  MessageCircle,
  Palette,
  Pencil,
  QrCode,
  ScanLine,
  Search,
  Sparkles,
} from "lucide-react";
import {
  DEMO_PATH,
  SALES_EMAIL,
  SALES_WHATSAPP,
  SITE_LANG_COOKIE,
  getSiteCopy,
  type SiteLang,
} from "./_landing/copy";
import { SiteLanguageToggle } from "./_landing/SiteLanguageToggle";
import { Reveal } from "./_landing/Reveal";
import { RotatingWords } from "./_landing/RotatingWords";
import { CurrencyDemo } from "./_landing/CurrencyDemo";
import { LanguageDemo } from "./_landing/LanguageDemo";
import { WhatsAppDemo } from "./_landing/WhatsAppDemo";
import { HeroMenuDemo } from "./_landing/HeroMenuDemo";
import { formatPrice } from "@/lib/catalog/price";
import { getCatalogBySlug } from "@/lib/catalog/queries";

const arabicFont = Noto_Sans_Arabic({
  subsets: ["arabic"],
  weight: ["400", "500", "600"],
  variable: "--font-platform-arabic",
  display: "swap",
});

/** Saved choice first, then the browser's preferred language */
async function resolveSiteLang(): Promise<SiteLang> {
  const saved = (await cookies()).get(SITE_LANG_COOKIE)?.value;
  if (saved === "ar" || saved === "en") return saved;
  const accept = (await headers()).get("accept-language") || "";
  return accept.trim().toLowerCase().startsWith("ar") ? "ar" : "en";
}

export async function generateMetadata(): Promise<Metadata> {
  const t = getSiteCopy(await resolveSiteLang());
  return {
    title: { absolute: t.metaTitle },
    description: t.metaDescription,
    openGraph: { title: t.metaTitle, description: t.metaDescription, type: "website" },
  };
}

const GUEST_ICONS = [ScanLine, Languages, Banknote, MessageCircle, Search, Clock];
const OWNER_ICONS = [Pencil, Ban, Palette, QrCode, Sparkles, BarChart3];

const primaryButton =
  "inline-flex min-h-12 items-center justify-center gap-2 rounded-control bg-ui-primary px-5 font-semibold text-ui-primary-fg transition-colors hover:bg-ui-primary-hover";
const secondaryButton =
  "inline-flex min-h-12 items-center justify-center gap-2 rounded-control border border-ui-input bg-ui-surface px-5 font-semibold text-ui-ink transition-colors hover:bg-ui-subtle";

// Sample prices on the page are formatted by the real menu code at $1 = 89,500 L.L.
const PREVIEW_PRICES = { primary: "USD" as const, lbpRate: 89500, rateUpdatedAt: null, showDual: true };

const MARQUEE_DISHES = [
  { img: "/landing/hummus.png", key: "hummus", price: 4 },
  { img: "/landing/kibbeh.png", key: "kibbeh", price: 6 },
  { img: "/landing/baba-ganoush.png", key: "babaGanoush", price: 4.5 },
  { img: "/landing/mansaf.png", key: "mansaf", price: 14 },
] as const;

const cardShadow = "shadow-[0_16px_32px_-16px_rgba(23,43,38,0.35)]";

function SectionIntro({ eyebrow, title, body, center }: { eyebrow?: string; title: string; body?: string; center?: boolean }) {
  return (
    <Reveal className={center ? "mx-auto max-w-2xl text-center" : "max-w-xl"}>
      {eyebrow && <p className="text-sm font-semibold text-ui-primary">{eyebrow}</p>}
      <h2 className="mt-2 text-[1.75rem] font-semibold leading-tight sm:text-4xl">{title}</h2>
      {body && <p className="mt-4 text-lg text-ui-muted">{body}</p>}
    </Reveal>
  );
}

function FeatureGrid({ items, icons }: { items: { title: string; body: string }[]; icons: typeof GUEST_ICONS }) {
  return (
    <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item, index) => {
        const Icon = icons[index];
        return (
          <Reveal as="li" key={item.title} delay={(index % 3) * 90}>
            <div className="group h-full rounded-panel border border-ui-line bg-ui-surface p-5 transition-[transform,box-shadow] duration-200 hover:-translate-y-1 hover:shadow-[0_16px_32px_-20px_rgba(23,43,38,0.35)]">
              <span className="flex h-11 w-11 items-center justify-center rounded-control bg-ui-subtle text-ui-primary transition-colors duration-200 group-hover:bg-ui-primary group-hover:text-ui-primary-fg">
                <Icon className="h-5 w-5" aria-hidden />
              </span>
              <h3 className="mt-4 font-semibold">{item.title}</h3>
              <p className="mt-1 text-ui-muted">{item.body}</p>
            </div>
          </Reveal>
        );
      })}
    </ul>
  );
}

/** The real demo menu in a phone, with floating cards that illustrate what it does */
function HeroVisual({ lang, t, demoQr }: { lang: SiteLang; t: ReturnType<typeof getSiteCopy>; demoQr: string | null }) {
  const hummus = formatPrice(4, "USD", PREVIEW_PRICES, lang);
  return (
    <div className="site-pop relative mx-auto w-[300px] sm:w-[320px]" style={{ animationDelay: "150ms" }}>
      <div className="absolute -inset-10 -z-10 rounded-full bg-[radial-gradient(closest-side,rgba(15,107,91,0.22),transparent)]" aria-hidden />
      <figure id="demo" className="scroll-mt-24">
        <div className="overflow-hidden rounded-[2.25rem] border-[10px] border-ui-ink bg-ui-surface shadow-[0_32px_64px_-24px_rgba(23,43,38,0.5)]">
          {demoQr ? (
            <iframe src={`${DEMO_PATH}?lang=${lang}`} title={t.preview.label} loading="lazy" className="block h-[580px] w-full" />
          ) : (
            // No demo catalog in this database yet: a working sample menu instead of a 404
            <HeroMenuDemo lang={lang} />
          )}
        </div>
        <figcaption className="mt-3 flex items-center justify-center gap-2 text-sm text-ui-muted">
          <span>{demoQr ? t.preview.label : t.preview.sample}</span>
          {demoQr && (
            <>
              <span aria-hidden>·</span>
              <a href={DEMO_PATH} className="font-medium text-ui-primary underline-offset-4 hover:underline">
                {t.preview.open}
              </a>
            </>
          )}
        </figcaption>
      </figure>

      {/* Floating illustrations (decorative; the same facts are in the text) */}
      <div aria-hidden className="pointer-events-none">
        <div className={`site-float absolute -start-28 top-14 hidden w-56 rounded-panel border border-ui-line bg-ui-surface p-3 sm:block lg:-start-36 ${cardShadow}`}>
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#25D366] text-white">
              <MessageCircle className="h-4 w-4" />
            </span>
            <span className="text-sm font-semibold">{t.floats.orderTitle}</span>
          </div>
          <p className="mt-2 text-sm text-ui-muted">{t.floats.orderBody}</p>
        </div>

        <div className={`site-float-slow absolute -end-24 top-[46%] hidden rounded-panel border border-ui-line bg-ui-surface px-4 py-3 sm:block lg:-end-32 ${cardShadow}`}>
          <p className="text-sm font-semibold">{t.floats.priceLabel}</p>
          <p className="mt-0.5 flex items-baseline gap-2">
            <bdi className="text-lg font-semibold tabular-nums">{hummus.primary}</bdi>
            <bdi className="text-sm tabular-nums text-ui-muted">{hummus.secondary}</bdi>
          </p>
        </div>

        {demoQr && (
        <div className={`site-float absolute -start-20 bottom-24 hidden rounded-panel border border-ui-line bg-ui-surface p-3 sm:block lg:-start-28 ${cardShadow}`} style={{ animationDelay: "-3s" }}>
          <div className="relative h-24 w-24 overflow-hidden rounded-control">
            <div className="h-full w-full [&>svg]:h-full [&>svg]:w-full" dangerouslySetInnerHTML={{ __html: demoQr }} />
            <span className="site-scan absolute inset-x-1 h-0.5 rounded-full bg-ui-primary shadow-[0_0_12px_2px_rgba(15,107,91,0.6)]" />
          </div>
          <p className="mt-2 text-center text-xs font-semibold">{t.floats.scan}</p>
        </div>
        )}

        <div className="site-float-slow absolute -end-16 top-6 hidden rounded-full border border-ui-line bg-ui-surface px-3 py-1.5 text-sm font-semibold shadow-[0_12px_24px_-12px_rgba(23,43,38,0.35)] sm:block lg:-end-20">
          {t.floats.lang}
        </div>
      </div>
    </div>
  );
}

/** Endless strip of sample dishes, priced like the real menu */
function DishMarquee({ lang, t }: { lang: SiteLang; t: ReturnType<typeof getSiteCopy> }) {
  const cards = MARQUEE_DISHES.map((dish) => ({ ...dish, name: t.dishes[dish.key], price: formatPrice(dish.price, "USD", PREVIEW_PRICES, lang) }));
  const loop = [...cards, ...cards, ...cards, ...cards];
  return (
    <section aria-label={t.marquee.label} className="border-y border-ui-line bg-ui-surface py-8">
      <p className="mx-auto max-w-6xl px-4 text-sm font-medium text-ui-muted sm:px-6">{t.marquee.label}</p>
      <div className="site-marquee-wrap mt-4 overflow-hidden [mask-image:linear-gradient(90deg,transparent,#000_8%,#000_92%,transparent)]">
        <ul className="site-marquee flex w-max gap-4 px-2">
          {loop.map((dish, i) => (
            <li key={i} aria-hidden={i >= cards.length} className="flex w-72 shrink-0 items-center gap-3 rounded-panel border border-ui-line bg-ui-bg p-2.5">
              <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-control">
                <Image src={dish.img} alt="" fill sizes="64px" className="object-cover" />
              </div>
              <div className="min-w-0">
                <p className="truncate font-semibold">{dish.name}</p>
                <p className="flex flex-wrap items-baseline gap-x-2">
                  <bdi className="font-semibold tabular-nums">{dish.price.primary}</bdi>
                  <bdi className="text-sm tabular-nums text-ui-muted">{dish.price.secondary}</bdi>
                </p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/** Absolute URL of the live demo, for the scannable QR code */
async function demoUrl(): Promise<string> {
  if (process.env.NEXT_PUBLIC_BASE_URL) return `${process.env.NEXT_PUBLIC_BASE_URL.replace(/\/$/, "")}${DEMO_PATH}`;
  const h = await headers();
  const host = h.get("x-forwarded-host") || h.get("host") || "localhost:3000";
  const proto = h.get("x-forwarded-proto") || (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}${DEMO_PATH}`;
}

export default async function LandingPage() {
  const lang = await resolveSiteLang();
  const t = getSiteCopy(lang);
  const whatsappHref = `https://wa.me/${SALES_WHATSAPP}`;
  // The live demo needs a catalog with the demo slug; without one, demo links and the QR are hidden
  const hasDemo = await getCatalogBySlug(DEMO_PATH.split("/").pop()!).then(Boolean, () => false);
  // Real QR code to the live demo (scannable from a laptop screen), with a 4-module quiet zone
  const demoQr = hasDemo ? await QRCode.toString(await demoUrl(), { type: "svg", margin: 4, color: { dark: "#172B26", light: "#FFFFFF" } }) : null;

  return (
    <div lang={lang} dir={lang === "ar" ? "rtl" : "ltr"} className={`platform ${arabicFont.variable} min-h-screen overflow-x-clip antialiased`}>
      <noscript>
        <style>{`.platform [data-reveal]{opacity:1!important;transform:none!important}`}</style>
      </noscript>

      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-ui-line bg-ui-bg">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <span className="flex h-8 w-8 items-center justify-center rounded-control bg-ui-primary text-ui-primary-fg" aria-hidden>
              <QrCode className="h-4 w-4" />
            </span>
            <span dir="ltr">Coredex</span>
          </Link>
          <nav aria-label="Main" className="ms-6 hidden items-center gap-1 md:flex">
            {[
              ["#features", t.nav.features],
              ["#demo", t.nav.demo],
              ["#pricing", t.nav.pricing],
              ["#faq", t.nav.faq],
            ].map(([href, label]) => (
              <a key={href} href={href} className="rounded-control px-3 py-2 text-sm font-medium text-ui-muted transition-colors hover:text-ui-ink">
                {label}
              </a>
            ))}
          </nav>
          <div className="ms-auto flex items-center gap-2">
            <SiteLanguageToggle current={lang} label={t.nav.language} />
            <Link href="/signup" className={`${primaryButton} hidden min-h-11 text-sm sm:inline-flex`}>
              {t.nav.start}
            </Link>
          </div>
        </div>
      </header>

      <main>
        {/* Hero (CSS-only entrance so text paints immediately) */}
        <section className="site-hero-bg relative">
          <div className="mx-auto grid max-w-6xl items-center gap-14 px-4 pb-20 pt-12 sm:px-6 lg:grid-cols-[1fr_auto] lg:gap-24 lg:pt-20">
            <div className="max-w-xl">
              <p className="site-pop inline-flex items-center gap-2 rounded-full border border-ui-line bg-ui-surface px-3 py-1 text-sm font-semibold text-ui-primary">
                <span className="h-2 w-2 rounded-full bg-ui-primary" aria-hidden />
                {t.hero.eyebrow}
              </p>
              <h1 className="site-pop mt-5 text-[2.5rem] font-semibold leading-[1.1] sm:text-6xl" style={{ animationDelay: "60ms" }}>
                <span className="sr-only">{t.heroTitle.full}</span>
                <span aria-hidden>{t.heroTitle.lead}</span>
                <br aria-hidden />
                <RotatingWords words={t.heroTitle.rotating} className="text-ui-primary" />
              </h1>
              <p className="site-pop mt-6 text-lg text-ui-muted sm:text-xl" style={{ animationDelay: "120ms" }}>
                {t.hero.body}
              </p>
              <div className="site-pop mt-8 flex flex-col gap-3 sm:flex-row" style={{ animationDelay: "180ms" }}>
                <Link href="/signup" className={`${primaryButton} min-h-[52px] px-6 text-base`}>
                  {t.hero.primary}
                </Link>
                {hasDemo && (
                  <a href={DEMO_PATH} className={`${secondaryButton} min-h-[52px] px-6 text-base`}>
                    {t.hero.secondary}
                    <ArrowUpRight className="h-4 w-4 rtl:-scale-x-100" aria-hidden />
                  </a>
                )}
              </div>
              <p className="site-pop mt-4 text-sm text-ui-muted" style={{ animationDelay: "240ms" }}>
                {hasDemo ? t.hero.note : t.hero.noteNoDemo}
              </p>
            </div>
            <HeroVisual lang={lang} t={t} demoQr={demoQr} />
          </div>
        </section>

        <DishMarquee lang={lang} t={t} />

        {/* Guests */}
        <section id="features" className="scroll-mt-20">
          <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
            <SectionIntro title={t.guests.title} />
            <FeatureGrid items={t.guests.items} icons={GUEST_ICONS} />
          </div>
        </section>

        {/* Showcase: dual pricing */}
        <section className="border-t border-ui-line bg-ui-surface">
          <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-20 sm:px-6 lg:grid-cols-2 lg:gap-16">
            <SectionIntro eyebrow={t.currency.eyebrow} title={t.currency.title} body={t.currency.body} />
            <Reveal delay={120}>
              <CurrencyDemo t={t.currency} lang={lang} />
            </Reveal>
          </div>
        </section>

        {/* Showcase: languages */}
        <section className="border-t border-ui-line">
          <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-20 sm:px-6 lg:grid-cols-2 lg:gap-16">
            <div className="lg:order-2">
              <SectionIntro eyebrow={t.language.eyebrow} title={t.language.title} body={t.language.body} />
            </div>
            <Reveal delay={120} className="lg:order-1">
              <LanguageDemo t={t.language} lang={lang} />
            </Reveal>
          </div>
        </section>

        {/* Showcase: WhatsApp orders */}
        <section className="border-t border-ui-line bg-ui-surface">
          <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-20 sm:px-6 lg:grid-cols-2 lg:gap-16">
            <SectionIntro eyebrow={t.whatsappDemo.eyebrow} title={t.whatsappDemo.title} body={t.whatsappDemo.body} />
            <Reveal delay={120}>
              <WhatsAppDemo t={t.whatsappDemo} lang={lang} />
            </Reveal>
          </div>
        </section>

        {/* Owners */}
        <section className="border-t border-ui-line">
          <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
            <SectionIntro title={t.owners.title} />
            <FeatureGrid items={t.owners.items} icons={OWNER_ICONS} />
          </div>
        </section>

        {/* Steps */}
        <section className="border-t border-ui-line bg-ui-surface">
          <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
            <SectionIntro title={t.steps.title} center />
            <ol className="relative mt-12 grid gap-10 md:grid-cols-3 md:gap-6">
              <span className="absolute inset-x-[16%] top-6 hidden h-px bg-ui-line md:block" aria-hidden />
              {t.steps.items.map((step, index) => (
                <Reveal as="li" key={step.title} delay={index * 120} className="relative text-center">
                  <span className="relative mx-auto flex h-12 w-12 items-center justify-center rounded-full border-4 border-ui-surface bg-ui-primary text-lg font-semibold text-ui-primary-fg" aria-hidden>
                    {index + 1}
                  </span>
                  <h3 className="mt-4 text-lg font-semibold">{step.title}</h3>
                  <p className="mx-auto mt-1 max-w-xs text-ui-muted">{step.body}</p>
                </Reveal>
              ))}
            </ol>
          </div>
        </section>

        {/* Pricing */}
        <section id="pricing" className="scroll-mt-20 border-t border-ui-line">
          <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
            <SectionIntro title={t.pricing.title} body={t.pricing.body} center />
            <div className="mt-12 grid gap-6 lg:grid-cols-3">
              {t.pricing.plans.map((plan, index) => {
                const highlight = plan.id === "pro";
                return (
                  <Reveal
                    as="article"
                    key={plan.id}
                    delay={index * 100}
                    className={`relative flex flex-col rounded-panel bg-ui-surface p-6 ${
                      highlight ? "border-2 border-ui-primary shadow-[0_24px_48px_-28px_rgba(15,107,91,0.55)]" : "border border-ui-line"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="text-lg font-semibold" dir="ltr">
                        {plan.name}
                      </h3>
                      {highlight && <span className="rounded-full bg-ui-subtle px-3 py-1 text-xs font-semibold text-ui-primary">{t.pricing.popular}</span>}
                    </div>
                    <p className="mt-1 text-sm text-ui-muted">{plan.summary}</p>
                    <p className="mt-5 flex items-baseline gap-1.5">
                      <bdi className="text-4xl font-semibold tabular-nums">{plan.price}</bdi>
                      <span className="text-ui-muted">{t.pricing.perYear}</span>
                    </p>
                    <ul className="mt-6 flex-1 space-y-3">
                      {plan.features.map((feature) => (
                        <li key={feature} className="flex gap-2.5">
                          <Check className="mt-0.5 h-5 w-5 shrink-0 text-ui-success" aria-hidden />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                    <Link href={`/signup?plan=${plan.id}`} className={`${highlight ? primaryButton : secondaryButton} mt-8 w-full`}>
                      {t.pricing.choose}
                    </Link>
                  </Reveal>
                );
              })}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="scroll-mt-20 border-t border-ui-line bg-ui-surface">
          <div className="mx-auto max-w-3xl px-4 py-20 sm:px-6">
            <SectionIntro title={t.faq.title} center />
            <Reveal className="mt-8 divide-y divide-[var(--ui-line)] border-y border-ui-line">
              {t.faq.items.map((item) => (
                <details key={item.q} className="group py-1">
                  <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-4 py-3 font-semibold [&::-webkit-details-marker]:hidden">
                    {item.q}
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-ui-subtle text-lg leading-none text-ui-primary transition-transform duration-200 group-open:rotate-45" aria-hidden>
                      +
                    </span>
                  </summary>
                  <p className="pb-4 text-ui-muted">{item.a}</p>
                </details>
              ))}
            </Reveal>
          </div>
        </section>

        {/* Closing call to action */}
        <section id="contact" className="px-4 py-20 sm:px-6">
          <Reveal className="relative mx-auto max-w-6xl overflow-hidden rounded-[1.75rem] bg-ui-primary px-6 py-12 text-ui-primary-fg sm:px-12 sm:py-16">
            <div className="relative z-10 max-w-xl">
              <h2 className="text-[1.75rem] font-semibold leading-tight sm:text-4xl">{t.cta.title}</h2>
              <p className="mt-4 text-lg opacity-90">{t.cta.body}</p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link href="/signup" className="inline-flex min-h-[52px] items-center justify-center rounded-control bg-ui-surface px-6 font-semibold text-ui-ink transition-colors hover:bg-ui-subtle">
                  {t.cta.primary}
                </Link>
                <a
                  href={whatsappHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-[52px] items-center justify-center gap-2 rounded-control border border-white/70 px-6 font-semibold transition-colors hover:bg-white/10"
                >
                  <MessageCircle className="h-5 w-5" aria-hidden />
                  {t.cta.secondary}
                </a>
              </div>
              <p className="mt-6 text-sm">
                <a href={`mailto:${SALES_EMAIL}`} className="inline-flex items-center gap-2 underline-offset-4 hover:underline">
                  <Mail className="h-4 w-4" aria-hidden />
                  <bdi>{SALES_EMAIL}</bdi>
                </a>
              </p>
            </div>
            {/* Dish photos fanned out on large screens */}
            <div aria-hidden className="pointer-events-none absolute -end-6 top-1/2 hidden -translate-y-1/2 lg:block">
              <div className="relative h-80 w-96">
                {[
                  { img: "/landing/mansaf.png", cls: "end-40 top-6 -rotate-6" },
                  { img: "/landing/kibbeh.png", cls: "end-20 top-0 rotate-3" },
                  { img: "/landing/hummus.png", cls: "end-2 top-10 rotate-12" },
                ].map((photo, i) => (
                  <div key={photo.img} className={`absolute h-56 w-40 ${photo.cls}`}>
                    <div className="site-float relative h-full w-full overflow-hidden rounded-panel border-4 border-white/90 shadow-xl" style={{ animationDelay: `${-i * 2}s` }}>
                      <Image src={photo.img} alt="" fill sizes="160px" className="object-cover" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
        </section>
      </main>

      <footer className="border-t border-ui-line">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-8 text-sm text-ui-muted sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p>{t.footer.rights}</p>
          <div className="flex flex-wrap gap-x-6 gap-y-2">
            {hasDemo && (
              <a href={DEMO_PATH} className="hover:text-ui-ink">
                {t.footer.demo}
              </a>
            )}
            <Link href="/signup" className="hover:text-ui-ink">
              {t.footer.signup}
            </Link>
            <Link href="/privacy/" className="hover:text-ui-ink">
              {t.footer.privacy}
            </Link>
            <Link href="/terms/" className="hover:text-ui-ink">
              {t.footer.terms}
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

