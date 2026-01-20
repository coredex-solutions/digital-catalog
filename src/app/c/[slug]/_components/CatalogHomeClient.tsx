"use client";

import { useCatalog } from "../_providers/CatalogProvider";
import { DynamicLanguageSelectionPage } from "@/views/DynamicLanguageSelectionPage";
import { DynamicHomePage } from "@/views/DynamicHomePage";
import { DynamicInfoModal } from "@/views/DynamicInfoModal";
import { SaasReservationModal } from "./SaasReservationModal";
import { SaasChatWidget } from "./SaasChatWidget";
import { motion, AnimatePresence } from "framer-motion";
import type { LocalizedString } from "@/types";
import AIWaiterBubble from "./AIWaiterBubble";

export function CatalogHomeClient() {
  const {
    catalog,
    settings,
    contact,
    operatingHours,
    socialMedia,
    supportedLanguages,
    colorPrimary,
    colorSecondary,
    bookingEnabled,
    lang,
    setLang,
    isThemeLoaded,
    isInfoOpen,
    setIsInfoOpen,
    isReservationOpen,
    setIsReservationOpen,
  } = useCatalog();

  const aiWaiterEnabled = settings?.ai_waiter_enabled ?? false;

  // Show loading screen while theme is loading
  if (!isThemeLoaded) {
    return (
      <div className="fixed inset-0 flex items-center justify-center z-50" style={{ backgroundColor: 'var(--background-hex)' }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <div
            className="w-16 h-16 border-4 border-t-transparent rounded-full animate-spin"
            style={{ borderColor: `${colorPrimary} transparent transparent transparent` }}
          />
          <p className="font-medium" style={{ color: 'var(--text-muted)' }}>
            Loading...
          </p>
        </motion.div>
      </div>
    );
  }

  // Show language selection if no language is selected
  if (!lang) {
    return (
      <DynamicLanguageSelectionPage
        onSelect={setLang}
        languages={supportedLanguages}
        catalogName={catalog.name}
        colorPrimary={colorPrimary}
      />
    );
  }

  // Build localized name object
  const catalogName: LocalizedString = {
    ar: catalog.name,
    en: catalog.name,
    fr: catalog.name,
  };

  // Build CTA labels from settings
  const ctaMenuLabel: LocalizedString = {
    ar: settings?.cta_menu_label_ar || "عرض القائمة",
    en: settings?.cta_menu_label_en || "View Menu",
    fr: settings?.cta_menu_label_fr || "Voir le Menu",
  };

  const ctaBookingLabel: LocalizedString = {
    ar: settings?.cta_booking_label_ar || "حجز طاولة",
    en: settings?.cta_booking_label_en || "Make Reservation",
    fr: settings?.cta_booking_label_fr || "Réserver",
  };

  return (
    <>
      <DynamicHomePage
        lang={lang}
        onReservation={() => setIsReservationOpen(true)}
        logoUrl={catalog.logo_url || "/placeholder-logo.png"}
        name={catalogName}
        backgroundImage={settings?.hero_image_url}
        backgroundPattern="wood-pattern-dense"
        baseUrl={`/c/${catalog.slug}`}
        ctaMenuLabel={ctaMenuLabel}
        ctaBookingLabel={ctaBookingLabel}
        bookingEnabled={bookingEnabled}
        colorPrimary={colorPrimary}
        colorSecondary={colorSecondary}
        setIsInfoOpen={setIsInfoOpen}
      />

      <AnimatePresence>
        {isInfoOpen && (
          <DynamicInfoModal
            lang={lang}
            onClose={() => setIsInfoOpen(false)}
            operatingHours={operatingHours}
            socialMedia={socialMedia}
            contact={contact}
            colorPrimary={colorPrimary}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isReservationOpen && (
          <SaasReservationModal
            lang={lang}
            onClose={() => setIsReservationOpen(false)}
            colorPrimary={colorPrimary}
          />
        )}
      </AnimatePresence>

      <SaasChatWidget
        catalogSlug={catalog.slug}
        lang={lang}
        colorPrimary={colorPrimary}
        colorSecondary={colorSecondary}
        whatsappNumber={contact?.phone_whatsapp || undefined}
      />

    </>
  );
}
