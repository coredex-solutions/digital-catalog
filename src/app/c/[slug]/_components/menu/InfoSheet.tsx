"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { ChevronDown, Mail, MapPin, MessageCircle, Moon, Phone, Sun } from "lucide-react";
import { formatHour } from "@/lib/utils/restaurant-hours";
import { useCatalog } from "../../_providers/CatalogProvider";
import { localized } from "../../_lib/i18n";
import { mapsLink, telLink } from "../../_lib/links";
import { whatsappLink } from "../../_lib/whatsapp";
import { CurrencyNote } from "./CurrencyNote";
import { LanguageToggle } from "./LanguageToggle";
import { Sheet } from "./Sheet";
import { cn } from "@/utils/helpers";

const DAY_INDEX: Record<string, number> = {
  sunday: 0, monday: 1, tuesday: 2, wednesday: 3, thursday: 4, friday: 5, saturday: 6,
};

function beirutDayIndex(): number {
  const weekday = new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Beirut", weekday: "long" }).format(new Date());
  return DAY_INDEX[weekday.toLowerCase()] ?? new Date().getDay();
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="border-t border-menu-line py-5 first:border-t-0 first:pt-1">
      <h3 className="mb-3 text-base font-semibold">{title}</h3>
      {children}
    </section>
  );
}

function ContactLink({ href, icon, children }: { href: string; icon: ReactNode; children: ReactNode }) {
  const external = href.startsWith("http");
  return (
    <a
      href={href}
      className="flex min-h-12 items-center gap-3 rounded-2xl px-1 font-medium transition-colors hover:text-brand-ink"
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-menu-raised text-brand-ink">{icon}</span>
      <span className="min-w-0 break-words">{children}</span>
    </a>
  );
}

export function InfoSheet() {
  const {
    activeSheet,
    closeSheet,
    catalog,
    contact,
    operatingHours,
    socialMedia,
    branches,
    faqs,
    lang,
    t,
    theme,
    toggleTheme,
    enabledLanguages,
  } = useCatalog();
  const open = activeSheet === "info";
  const name = localized(catalog, "name", lang) || catalog.name;
  const description = localized(catalog, "description", lang);
  const address = contact ? [localized(contact, "address", lang), localized(contact, "city", lang)].filter(Boolean).join(lang === "ar" ? "، " : ", ") : "";
  const directions = mapsLink({ mapUrl: contact?.google_map_iframe_url, name, address: contact?.address_en, city: contact?.city_en });

  // Show the week starting today
  const today = open ? beirutDayIndex() : 0;
  const hours = [...operatingHours]
    .map((row) => ({ ...row, index: DAY_INDEX[String(row.day_name).toLowerCase()] ?? -1 }))
    .filter((row) => row.index >= 0)
    .sort((a, b) => ((a.index - today + 7) % 7) - ((b.index - today + 7) % 7));

  return (
    <Sheet open={open} onClose={closeSheet} title={name}>
      {description && <p className="mb-6 leading-relaxed text-menu-muted">{description}</p>}

      {hours.length > 0 && (
        <Section title={t.hours}>
          <dl className="space-y-1">
            {hours.map((row) => {
              const isToday = row.index === today;
              return (
                <div key={row.index} className={cn("flex justify-between gap-4 rounded-xl px-3 py-2", isToday && "bg-brand-soft font-semibold")}>
                  <dt>{isToday ? `${t.days[row.index]} · ${t.today}` : t.days[row.index]}</dt>
                  <dd className={cn("tabular-nums", row.is_closed && "text-menu-muted")} dir="ltr">
                    {row.is_closed ? t.closedToday : `${formatHour(row.open_hour, lang)} – ${formatHour(row.close_hour, lang)}`}
                  </dd>
                </div>
              );
            })}
          </dl>
        </Section>
      )}

      {(contact?.phone_primary || contact?.phone_whatsapp || contact?.email || directions) && (
        <Section title={t.contact}>
          <div className="space-y-1">
            {directions && (
              <ContactLink href={directions} icon={<MapPin className="h-5 w-5" aria-hidden />}>
                <span className="block">{address || t.openInMaps}</span>
                {address && <span className="block text-sm font-normal text-menu-muted">{t.openInMaps}</span>}
              </ContactLink>
            )}
            {contact?.phone_primary && (
              <ContactLink href={telLink(contact.phone_primary)} icon={<Phone className="h-5 w-5" aria-hidden />}>
                <bdi dir="ltr">{contact.phone_primary}</bdi>
              </ContactLink>
            )}
            {contact?.phone_whatsapp && (
              <ContactLink href={whatsappLink(contact.phone_whatsapp)} icon={<MessageCircle className="h-5 w-5" aria-hidden />}>
                {t.whatsapp} · <bdi dir="ltr">{contact.phone_whatsapp}</bdi>
              </ContactLink>
            )}
            {contact?.email && (
              <ContactLink href={`mailto:${contact.email}`} icon={<Mail className="h-5 w-5" aria-hidden />}>
                {contact.email}
              </ContactLink>
            )}
          </div>
        </Section>
      )}

      {branches.length > 0 && (
        <Section title={t.branches}>
          <ul className="space-y-3">
            {branches.map((branch) => {
              const branchName = localized(branch, "name", lang);
              const branchAddress = localized(branch, "address", lang);
              const branchMap = mapsLink({ mapUrl: branch.map_url, name: `${name} ${branchName}`, address: branch.address_en });
              return (
                <li key={branch.id} className="rounded-2xl border border-menu-line p-4">
                  <p className="font-semibold">{branchName}</p>
                  {branchAddress && <p className="mt-0.5 text-sm text-menu-muted">{branchAddress}</p>}
                  <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm font-semibold text-brand-ink">
                    {branch.phone_numbers.map((phone) => (
                      <a key={phone} href={telLink(phone)} className="inline-flex min-h-11 items-center">
                        <bdi dir="ltr">{phone}</bdi>
                      </a>
                    ))}
                    {branchMap && (
                      <a href={branchMap} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center">
                        {t.directions}
                      </a>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </Section>
      )}

      {faqs.length > 0 && (
        <Section title={t.faqs}>
          <div className="space-y-2">
            {faqs.map((faq) => (
              <details key={faq.id} className="group rounded-2xl border border-menu-line">
                <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 font-semibold [&::-webkit-details-marker]:hidden">
                  {localized(faq, "question", lang)}
                  <ChevronDown className="h-4 w-4 shrink-0 text-menu-muted transition-transform group-open:rotate-180" aria-hidden />
                </summary>
                <p className="whitespace-pre-line px-4 pb-4 text-sm leading-relaxed text-menu-muted">{localized(faq, "answer", lang)}</p>
              </details>
            ))}
          </div>
        </Section>
      )}

      {socialMedia.length > 0 && (
        <Section title={t.follow}>
          <div className="flex flex-wrap gap-2">
            {socialMedia.map((link) => (
              <a
                key={link.id}
                href={link.url!}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-11 items-center rounded-control border border-menu-line px-4 text-sm font-semibold capitalize transition-colors hover:border-brand-ink"
              >
                {link.platform}
              </a>
            ))}
          </div>
        </Section>
      )}

      <Section title={t.about}>
        <Link href={`/c/${catalog.slug}/about`} className="inline-flex min-h-11 items-center font-semibold text-brand-ink underline-offset-4 hover:underline">
          {t.about} {name}
        </Link>
      </Section>

      <Section title={t.preferences}>
        <div className="flex flex-wrap items-center gap-3">
          {enabledLanguages.length > 1 && <LanguageToggle variant="segmented" />}
          <button
            type="button"
            onClick={toggleTheme}
            className="inline-flex min-h-11 items-center gap-2 rounded-control border border-menu-line px-4 text-sm font-semibold"
            aria-pressed={theme === "dark"}
          >
            {theme === "dark" ? <Sun className="h-4 w-4" aria-hidden /> : <Moon className="h-4 w-4" aria-hidden />}
            {theme === "dark" ? t.lightMode : t.darkMode}
          </button>
        </div>
        <CurrencyNote className="mt-4" />
        <p className="mt-6 text-center text-xs text-menu-muted">{t.poweredBy}</p>
      </Section>
    </Sheet>
  );
}
