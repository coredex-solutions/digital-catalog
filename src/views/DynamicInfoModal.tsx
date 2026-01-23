"use client";

import { motion } from "framer-motion";
import {
  X,
  MapPin,
  Phone,
  Mail,
  Clock,
  Instagram,
  Facebook,
  Youtube,
  ExternalLink,
} from "lucide-react";
import type {
  Language,
  OperatingHoursData,
  SocialMediaLink,
  CatalogContactData,
} from "../types";
import { cn } from "../utils/helpers";

// TikTok icon component (not in lucide-react)
function TikTokIcon({ size = 20 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
    </svg>
  );
}

// Social media icon mapping
const socialIcons: Record<string, React.ComponentType<{ size?: number }>> = {
  instagram: Instagram,
  facebook: Facebook,
  youtube: Youtube,
  tiktok: TikTokIcon,
};

// Format operating hours
function formatHours(hour: number): string {
  const h = Math.floor(hour);
  const m = Math.round((hour % 1) * 60);
  const period = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  return `${h12}:${m.toString().padStart(2, "0")} ${period}`;
}

// Extract map URL (handles both iframe URLs and embed URLs)
function extractMapUrl(url?: string | null): string {
  if (!url) return "";
  // If it's already a proper embed URL, return as is
  if (url.includes("google.com/maps/embed")) return url;
  // If it's an iframe tag, extract the src
  const srcMatch = url.match(/src=["']([^"']+)["']/);
  if (srcMatch) return srcMatch[1];
  return url;
}

interface DynamicInfoModalProps {
  lang: Language;
  onClose: () => void;
  operatingHours?: OperatingHoursData[];
  socialMedia?: SocialMediaLink[];
  contact?: CatalogContactData | null;
  // Optional color theming
  colorPrimary?: string;
}

export function DynamicInfoModal({
  lang,
  onClose,
  operatingHours = [],
  socialMedia = [],
  contact,
  colorPrimary,
}: DynamicInfoModalProps) {
  const dir = lang === "ar" ? "rtl" : "ltr";
  const font = lang === "ar" ? "font-cairo" : "font-inter";

  // Calculate if currently open based on operating hours
  const isOpen = (() => {
    if (!operatingHours || operatingHours.length === 0) return false;
    const now = new Date();
    const days = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];
    const currentDay = days[now.getDay()];
    const currentHour = now.getHours() + now.getMinutes() / 60;
    const todayHours = operatingHours.find((h) => h.day_name === currentDay);
    if (!todayHours || todayHours.is_closed) return false;
    return currentHour >= todayHours.open_hour && currentHour < todayHours.close_hour;
  })();

  // Day names in different languages
  const dayNames: Record<Language, string[]> = {
    ar: ["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"],
    en: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
    fr: ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"],
  };
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const dayLabels = dayNames[lang];

  // Get address for current language
  const getAddress = () => {
    if (!contact) return lang === "ar" ? "العنوان غير متوفر" : "Address not available";
    const addressKey = `address_${lang}` as keyof CatalogContactData;
    return contact[addressKey] || contact.address_en || (lang === "ar" ? "العنوان غير متوفر" : "Address not available");
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 sm:p-0 pointer-events-none">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm pointer-events-auto"
      />

      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className={cn(
          "relative w-full max-w-2xl bg-white dark:bg-navy-900 rounded-3xl shadow-2xl overflow-hidden pointer-events-auto max-h-[90vh] flex flex-col",
          font,
          dir === "rtl" ? "rtl" : "ltr"
        )}
        dir={dir}
      >
        {/* Header */}
        <div className="p-6 border-b border-slate-100 dark:border-navy-800 flex justify-between items-center bg-slate-50/50 dark:bg-navy-900">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            {lang === "ar" ? "معلومات المطعم" : lang === "fr" ? "Informations" : "Restaurant Info"}
          </h2>
          <button
            onClick={onClose}
            className="p-2 bg-slate-100 dark:bg-navy-800 rounded-full hover:bg-slate-200 transition-colors text-slate-600 dark:text-slate-300"
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          {/* Map Section */}
          {contact?.google_map_iframe_url && (
            <div className="h-64 w-full rounded-2xl overflow-hidden shadow-lg relative group">
              <iframe
                src={extractMapUrl(contact.google_map_iframe_url)}
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen={true}
                loading="lazy"
                className="grayscale hover:grayscale-0 transition-all duration-700"
              />
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
            {/* Address & Contact */}
            <div className="space-y-4 lg:space-y-6">
              <h3 className="font-bold text-slate-900 dark:text-white mb-4 text-xl border-b border-slate-100 dark:border-navy-800 pb-2">
                {lang === "ar" ? "العنوان والاتصال" : lang === "fr" ? "Adresse & Contact" : "Address & Contact"}
              </h3>

              <div className="bg-slate-50 dark:bg-navy-800/50 p-4 rounded-2xl border border-slate-100 dark:border-navy-800">
                {/* Address */}
                <div className="flex items-start gap-3 mb-4">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                    style={{
                      backgroundColor: colorPrimary ? `${colorPrimary}20` : "rgb(255 237 213)",
                      color: colorPrimary || "rgb(234 88 12)",
                    }}
                  >
                    <MapPin size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-slate-900 dark:text-white mb-2">
                      {lang === "ar" ? "العنوان" : lang === "fr" ? "Adresse" : "Address"}
                    </h4>
                    <p className="text-sm text-slate-600 dark:text-slate-400 break-words leading-relaxed">
                      {getAddress()}
                    </p>
                  </div>
                </div>

                {/* Phone */}
                {contact?.phone_primary && (
                  <div className="flex items-center gap-3 mb-4">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                      style={{
                        backgroundColor: colorPrimary ? `${colorPrimary}20` : "rgb(220 252 231)",
                        color: colorPrimary || "rgb(22 163 74)",
                      }}
                    >
                      <Phone size={20} />
                    </div>
                    <a
                      href={`tel:${contact.phone_primary}`}
                      className="text-slate-600 dark:text-slate-400 hover:underline"
                    >
                      {contact.phone_primary}
                    </a>
                  </div>
                )}

                {/* Email */}
                {contact?.email && (
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                      style={{
                        backgroundColor: colorPrimary ? `${colorPrimary}20` : "rgb(219 234 254)",
                        color: colorPrimary || "rgb(37 99 235)",
                      }}
                    >
                      <Mail size={20} />
                    </div>
                    <a
                      href={`mailto:${contact.email}`}
                      className="text-slate-600 dark:text-slate-400 hover:underline"
                    >
                      {contact.email}
                    </a>
                  </div>
                )}
              </div>

              {/* Social Media */}
              {socialMedia.length > 0 && (
                <div className="flex gap-3 flex-wrap">
                  {socialMedia
                    .filter((s) => s.url)
                    .map((social) => {
                      const Icon = socialIcons[social.platform.toLowerCase()] || ExternalLink;
                      return (
                        <a
                          key={social.id}
                          href={social.url!}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-12 h-12 rounded-xl flex items-center justify-center text-white transition-all hover:scale-105"
                          style={{ backgroundColor: colorPrimary || "#8b5cf6" }}
                          title={social.platform}
                        >
                          <Icon size={24} />
                        </a>
                      );
                    })}
                </div>
              )}
            </div>

            {/* Operating Hours */}
            <div className="space-y-4 lg:space-y-6">
              <h3 className="font-bold text-slate-900 dark:text-white mb-4 text-xl border-b border-slate-100 dark:border-navy-800 pb-2 flex items-center gap-2">
                <Clock size={20} style={{ color: colorPrimary || "#8b5cf6" }} />
                {lang === "ar" ? "ساعات العمل" : lang === "fr" ? "Horaires" : "Working Hours"}
              </h3>

              {/* Current Status */}
              <div
                className={cn(
                  "inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium",
                  isOpen
                    ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                    : "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400"
                )}
              >
                <span className={cn("w-2 h-2 rounded-full", isOpen ? "bg-green-500" : "bg-purple-500")} />
                {isOpen
                  ? lang === "ar"
                    ? "مفتوح الآن"
                    : lang === "fr"
                    ? "Ouvert"
                    : "Open Now"
                  : lang === "ar"
                  ? "مغلق الآن"
                  : lang === "fr"
                  ? "Fermé"
                  : "Closed Now"}
              </div>

              {/* Hours List */}
              <div className="bg-slate-50 dark:bg-navy-800/50 p-4 rounded-2xl border border-slate-100 dark:border-navy-800">
                <div className="space-y-2">
                  {days.map((day, index) => {
                    const hours = operatingHours.find((h) => h.day_name === day);
                    const isClosed = !hours || hours.is_closed;
                    const isToday = new Date().getDay() === index;

                    return (
                      <div
                        key={day}
                        className={cn(
                          "flex justify-between items-center py-2 px-3 rounded-lg",
                          isToday && "bg-purple-50 dark:bg-purple-900/10"
                        )}
                        style={isToday && colorPrimary ? { backgroundColor: `${colorPrimary}10` } : {}}
                      >
                        <span
                          className={cn(
                            "font-medium",
                            isToday ? "text-slate-900 dark:text-white" : "text-slate-600 dark:text-slate-400"
                          )}
                        >
                          {dayLabels[index]}
                        </span>
                        <span
                          className={cn(
                            isClosed ? "text-purple-500" : "text-slate-700 dark:text-slate-300"
                          )}
                        >
                          {isClosed
                            ? lang === "ar"
                              ? "مغلق"
                              : lang === "fr"
                              ? "Fermé"
                              : "Closed"
                            : `${formatHours(hours.open_hour)} - ${formatHours(hours.close_hour)}`}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
