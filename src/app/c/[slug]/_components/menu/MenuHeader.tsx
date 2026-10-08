"use client";

import { MenuImage } from "./MenuImage";
import { CalendarDays, ChefHat, Info, MapPin, MessageCircle, Navigation, Phone, Search } from "lucide-react";
import type { ReactNode } from "react";
import { useCatalog } from "../../_providers/CatalogProvider";
import { localized } from "../../_lib/i18n";
import { mapsLink, telLink } from "../../_lib/links";
import { whatsappLink } from "../../_lib/whatsapp";
import { CurrencyNote } from "./CurrencyNote";
import { LanguageToggle } from "./LanguageToggle";
import { OpenStatusBadge } from "./OpenStatusBadge";
import { OPEN_WAITER_EVENT } from "../../_lib/events";

/** The category bar shows its own search button once this field has scrolled away */
export const SEARCH_FIELD_ID = "menu-search-field";

function ActionChip({ icon, label, href, onClick }: { icon: ReactNode; label: string; href?: string; onClick?: () => void }) {
  const className =
    "inline-flex min-h-11 shrink-0 items-center gap-2 rounded-control border border-menu-line bg-menu-surface px-3.5 text-sm font-medium text-menu-ink transition-colors hover:border-menu-input-border";
  if (href) {
    const external = href.startsWith("http");
    return (
      <a href={href} className={className} {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
        {icon}
        {label}
      </a>
    );
  }
  return (
    <button type="button" onClick={onClick} className={className}>
      {icon}
      {label}
    </button>
  );
}

/**
 * The top of the menu, kept compact so dishes show on the first screen (MENUDESIGN.md §5):
 * restaurant identity, language and currency, quick actions, then a search field.
 */
export function MenuHeader() {
  const { catalog, settings, contact, lang, t, openSheet, bookingEnabled } = useCatalog();

  const name = localized(catalog, "name", lang) || catalog.name;
  const city = contact ? localized(contact, "city", lang) : "";
  const address = contact ? localized(contact, "address", lang) : "";
  const cover = settings?.hero_image_url;
  const directions = mapsLink({
    mapUrl: contact?.google_map_iframe_url,
    name,
    address: contact?.address_en || address,
    city: contact?.city_en || city,
  });

  return (
    <header>
      {cover && (
        <div className="relative mx-auto h-28 w-full max-w-xl overflow-hidden bg-menu-raised sm:mt-4 sm:h-36 sm:rounded-panel">
          <MenuImage src={cover} alt="" fill priority sizes="(max-width: 640px) 100vw, 576px" className="object-cover" />
          <div className="absolute end-3 top-3">
            <LanguageToggle />
          </div>
        </div>
      )}

      <div className="mx-auto max-w-xl px-4">
        {/* Identity */}
        <div className={cover ? "relative -mt-7 flex items-end gap-3" : "flex items-center gap-3 pt-4"}>
          <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-control border-2 border-[var(--menu-bg)] bg-menu-surface shadow-menu-sm">
            {catalog.logo_url ? (
              <MenuImage src={catalog.logo_url} alt="" fill sizes="56px" className="object-cover" priority />
            ) : (
              <span className="flex h-full w-full items-center justify-center bg-brand text-xl font-semibold text-brand-fg" aria-hidden>
                {name.charAt(0)}
              </span>
            )}
          </div>
          {!cover && (
            <div className="ms-auto">
              <LanguageToggle />
            </div>
          )}
        </div>

        <h1 className="mt-2 text-[1.5rem] font-semibold leading-tight">{name}</h1>
        <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1">
          <OpenStatusBadge />
          {city && (
            <span className="inline-flex items-center gap-1.5 text-sm text-menu-muted">
              <MapPin className="h-4 w-4" aria-hidden />
              {city}
            </span>
          )}
        </div>

        {/* Quick actions */}
        <div className="-mx-4 mt-3 flex gap-2 overflow-x-auto px-4 pb-1 scrollbar-hide">
          {contact?.phone_primary && <ActionChip icon={<Phone className="h-4 w-4" aria-hidden />} label={t.call} href={telLink(contact.phone_primary)} />}
          {contact?.phone_whatsapp && (
            <ActionChip icon={<MessageCircle className="h-4 w-4" aria-hidden />} label={t.whatsapp} href={whatsappLink(contact.phone_whatsapp)} />
          )}
          {directions && <ActionChip icon={<Navigation className="h-4 w-4" aria-hidden />} label={t.directions} href={directions} />}
          {bookingEnabled && (
            <ActionChip icon={<CalendarDays className="h-4 w-4" aria-hidden />} label={t.reserve} onClick={() => openSheet("reservation")} />
          )}
          {settings?.ai_waiter_enabled && (
            <ActionChip
              icon={<ChefHat className="h-4 w-4" aria-hidden />}
              label={t.askQuestion}
              onClick={() => window.dispatchEvent(new Event(OPEN_WAITER_EVENT))}
            />
          )}
          <ActionChip icon={<Info className="h-4 w-4" aria-hidden />} label={t.info} onClick={() => openSheet("info")} />
        </div>

        <CurrencyNote className="mt-3" />

        {/* Looks like a field, opens the full-screen search (where the real input is) */}
        <button
          type="button"
          id={SEARCH_FIELD_ID}
          onClick={() => openSheet("search")}
          className="mt-3 flex min-h-12 w-full items-center gap-3 rounded-control border border-menu-input-border bg-menu-surface px-4 text-start text-base text-menu-muted"
        >
          <Search className="h-5 w-5 shrink-0" aria-hidden />
          {t.searchPlaceholder}
        </button>
      </div>
    </header>
  );
}
