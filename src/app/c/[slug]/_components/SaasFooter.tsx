"use client";

import {
  MapPin,
  Phone,
  Clock,
  Instagram,
  Facebook,
  ExternalLink,
} from "lucide-react";
import type { Language, OperatingHoursData, SocialMediaLink, CatalogContactData } from "@/types";
import { cn, formatHours, extractMapUrl } from "@/utils/helpers";
import { RESTAURANT_CONFIG } from "@/config/restaurant";

// TikTok icon component
function TikTokIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
    </svg>
  );
}

interface SaasFooterProps {
  lang: Language;
  operatingHours?: OperatingHoursData[];
  socialMedia?: SocialMediaLink[];
  contact?: CatalogContactData | null;
  logoUrl?: string | null;
  catalogName?: string;
  colorPrimary?: string;
  whatsappNumber?: string | null;
}

export function SaasFooter({
  lang,
  operatingHours = [],
  socialMedia = [],
  contact,
  logoUrl,
  catalogName = "Restaurant",
  colorPrimary = "#fead1d",
  whatsappNumber
}: SaasFooterProps) {
  const dir = lang === "ar" ? "rtl" : "ltr";
  const font = lang === "ar" ? "font-cairo" : "font-inter";

  // Calculate if currently open
  const isOpen = (() => {
    if (!operatingHours || operatingHours.length === 0) return false;
    const now = new Date();
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const currentDay = days[now.getDay()];
    // Calculate current hour as decimal (e.g. 14:30 -> 14.5)
    const currentHour = now.getHours() + now.getMinutes() / 60;

    // Find today's hours
    const todayHours = operatingHours.find((h) => h.day_name === currentDay);

    if (!todayHours || todayHours.is_closed) return false;

    // Check if current time is within open hours
    return currentHour >= todayHours.open_hour && currentHour < todayHours.close_hour;
  })();

  const dayNames: Record<Language, string[]> = {
    ar: ["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"],
    en: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
    fr: ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"],
  };
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const dayLabels = dayNames[lang];

  return (
    <footer
      className={cn(
        "bg-[var(--background-hex)] text-[var(--text-muted)] border-t relative overflow-hidden",
        font,
        dir === "rtl" ? "rtl" : "ltr"
      )}
      style={{ borderColor: 'rgba(var(--pattern-rgb), 0.08)' }}
      dir={dir}
    >
      {/* Subtle Pattern to match legacy wood feel or clean pro look */}
      <div className="absolute inset-0 opacity-[0.06] bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]" />

      <div className="max-w-7xl mx-auto px-6 py-12 sm:py-16 relative z-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-8">
          {/* 1. Brand & Socials */}
          <div className="space-y-6">
            <div className="flex flex-col items-start gap-6">
              <img
                src={logoUrl || RESTAURANT_CONFIG.logo}
                alt={catalogName}
                className="h-24 w-auto object-contain"
                style={{ filter: `drop-shadow(0 0 10px ${colorPrimary}80)` }}
              />
              <p className="text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                {lang === "ar"
                  ? "نقدم تجربة طعام استثنائية تمزج بين الأصالة واللمسة العصرية. زورونا لتذوق الفرق."
                  : lang === "fr"
                    ? "Une expérience culinaire exceptionnelle alliant authenticité et modernité."
                    : "Delivering an exceptional dining experience blending authenticity with a modern touch. Visit us to taste the difference."}
              </p>
            </div>
            <div className="flex gap-3">
              {/* Social Media Links */}
              {socialMedia.filter((s) => s.url).map((s, i) => {
                let Icon: any = ExternalLink;
                if (s.platform.toLowerCase() === "instagram") Icon = Instagram;
                else if (s.platform.toLowerCase() === "facebook") Icon = Facebook;
                else if (s.platform.toLowerCase() === "tiktok") Icon = TikTokIcon;

                return (
                  <a
                    key={i}
                    href={s.url || undefined}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ backgroundColor: 'var(--surface)', borderColor: 'rgba(var(--pattern-rgb), 0.05)' }}
                    className="w-10 h-10 rounded-full shadow-sm flex items-center justify-center hover:scale-110 transition-transform group/social border"
                  >
                    <div className="transition-colors group-hover/social:scale-110" style={{ color: colorPrimary }}>
                      <Icon size={18} />
                    </div>
                  </a>
                );
              })}

              {/* WhatsApp Button */}
              {whatsappNumber && (
                <a
                  href={`https://wa.me/${whatsappNumber}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full bg-[#25D366] hover:bg-[#20BA5A] shadow-sm flex items-center justify-center hover:scale-110 transition-all duration-200 group relative"
                  aria-label="WhatsApp"
                >
                  <svg
                    viewBox="0 0 24 24"
                    className="w-5 h-5 fill-white"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                  </svg>
                </a>
              )}
            </div>
          </div>

          {/* 2. Contact Info - Address */}
          <div className="space-y-6">
            <h3 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
              {lang === "ar" ? "العنوان" : "Address"}
            </h3>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <MapPin size={18} style={{ color: colorPrimary }} className="mt-1 shrink-0" />
                <div>
                  <p className="text-sm leading-relaxed" style={{ color: 'var(--text-primary)' }}>
                    {(() => {
                      const addr = (lang === "ar" ? contact?.address_ar : contact?.address_en) || contact?.address_en;
                      return addr || (lang === "ar" ? "العنوان غير متوفر" : "Address not available");
                    })()}
                  </p>
                </div>
              </div>
              {contact?.phone_primary && (
                <div className="flex flex-wrap gap-2 pl-7">
                  {contact?.phone_primary && (
                    <a
                      href={`tel:${contact.phone_primary.replace(/\s/g, "")}`}
                      className="text-xs px-3 py-1.5 rounded-lg transition-colors font-mono flex items-center gap-1.5"
                      style={{
                        backgroundColor: `${colorPrimary}15`,
                        color: colorPrimary
                      }}
                      dir="ltr"
                    >
                      <Phone size={12} />
                      {contact.phone_primary}
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* 3. Operating Hours */}
          <div className="space-y-6">
            <h3 className="text-lg font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
              {lang === "ar" ? "ساعات العمل" : "Opening Hours"}
              <span
                className={cn(
                  "text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider",
                  isOpen
                    ? "bg-green-500/15 text-green-600 dark:text-green-400"
                    : "bg-red-500/15 text-red-600 dark:text-red-400"
                )}
              >
                {isOpen
                  ? lang === "ar"
                    ? "مفتوح"
                    : "Open"
                  : lang === "ar"
                    ? "مغلق"
                    : "Closed"}
              </span>
            </h3>
            <div className="space-y-2">
              {days.map((day, idx) => {
                const todayHours = operatingHours.find((h) => h.day_name === day);
                const isToday = new Date().getDay() === idx;
                const isClosed = !todayHours || todayHours.is_closed;

                return (
                  <div
                    key={day}
                    className={cn(
                      "flex justify-between text-sm py-1 last:border-0",
                      isToday ? "font-bold" : ""
                    )}
                    style={{
                      borderBottom: '1px solid rgba(var(--pattern-rgb), 0.08)',
                      color: isToday ? 'var(--text-primary)' : 'var(--text-muted)'
                    }}
                  >
                    <span>{dayLabels[idx]}</span>
                    <span dir="ltr" className="font-mono text-xs" style={{ color: isToday ? colorPrimary : 'var(--text-muted)' }}>
                      {isClosed
                        ? lang === "ar"
                          ? "مغلق"
                          : "Closed"
                        : `${formatHours(todayHours.open_hour)} - ${formatHours(todayHours.close_hour)}`}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 4. Map */}
          <div
            className="h-[200px] sm:h-[250px] lg:h-[300px] w-full rounded-2xl overflow-hidden shadow-lg border relative group sm:col-span-2 lg:col-span-1 order-first sm:order-last lg:order-none"
            style={{ backgroundColor: 'var(--surface)', borderColor: 'rgba(var(--pattern-rgb), 0.08)' }}
          >
            {(() => {
              const mapUrl = extractMapUrl(contact?.google_map_iframe_url);
              return mapUrl ? (
                <>
                  <iframe
                    src={mapUrl}
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    allowFullScreen={true}
                    loading="lazy"
                    className="relative z-10 hover:opacity-100 transition-all duration-700 w-full h-full opacity-60 mix-blend-luminosity hover:mix-blend-normal contrast-[0.9] brightness-[1.1] dark:brightness-[0.8]"
                  />
                  {/* Minimalistic Caption Overlay */}
                  <div className="absolute top-3 left-3 z-20">
                    <div className="backdrop-blur-md px-2.5 py-1 rounded-lg shadow-sm border" style={{ backgroundColor: 'var(--surface)', borderColor: 'rgba(255,255,255,0.08)' }}>
                      <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-primary)' }}>
                        {lang === "ar"
                          ? "موقعنا"
                          : lang === "fr"
                            ? "Notre Emplacement"
                            : "Our Location"}
                      </span>
                    </div>
                  </div>
                </>
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center p-4">
                    <MapPin
                      size={32}
                      className="mx-auto mb-2"
                      style={{ color: 'var(--text-muted)' }}
                    />
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      {lang === "ar" ? "خريطة غير متوفرة" : "Map not available"}
                    </p>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>

        <div className="mt-16 pt-8 border-t flex flex-col md:flex-row items-center justify-between text-xs gap-4" style={{ borderColor: 'var(--surface)', color: 'var(--text-muted)' }}>
          <p>
            © {new Date().getFullYear()}{" "}
            {catalogName}.{" "}
            {lang === "ar"
              ? "جميع الحقوق محفوظة"
              : lang === "fr"
                ? "Tous droits réservés"
                : "All rights reserved"}
            .
          </p>
          <div className="flex items-center gap-1.5">
            <span>
              {lang === "ar"
                ? "القائمة بواسطة"
                : lang === "fr"
                  ? "Menu par"
                  : "Menu By"}
            </span>
            <a
              href="https://coredex.solutions"
              target="_blank"
              rel="noopener noreferrer"
              className="font-bold transition-colors underline underline-offset-2"
              style={{ color: 'var(--text-primary)', "--tw-decoration-color": colorPrimary } as any}
            >
              Coredex Solutions
            </a>
          </div>
        </div>
      </div>
    </footer >
  );
}
