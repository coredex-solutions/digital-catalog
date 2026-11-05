"use client";

import { useState } from "react";
import { BusinessPicker } from "./BusinessPicker";
import { OrdersInboxDemo } from "./OrdersInboxDemo";
import { WhatsAppDemo } from "./WhatsAppDemo";
import { Reveal } from "./Reveal";
import type { Business } from "./samples";
import type { SiteCopy, SiteLang } from "./copy";

/** The same sample order on the Orders page and on WhatsApp, for the kind of business the visitor picks */
export function OrdersShowcase({ t, lang, labels }: { t: SiteCopy["whatsappDemo"]; lang: SiteLang; labels: Record<Business, string> }) {
  const [business, setBusiness] = useState<Business>("restaurant");
  return (
    <>
      <BusinessPicker value={business} onChange={setBusiness} labels={labels} label={t.pickerLabel} className="mx-auto mt-12 max-w-md" />
      <div className="mt-6 grid gap-6 lg:grid-cols-2 lg:gap-8">
        <Reveal delay={60}>
          <OrdersInboxDemo t={t} lang={lang} business={business} />
        </Reveal>
        <Reveal delay={160}>
          <WhatsAppDemo t={t} lang={lang} business={business} />
        </Reveal>
      </div>
    </>
  );
}
