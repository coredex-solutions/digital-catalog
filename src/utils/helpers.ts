import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const formatPrice = (price: number, lang: string) => {
  return new Intl.NumberFormat(lang === "ar" ? "ar-IQ" : "en-US", {
    style: "currency",
    currency: "IQD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
};

export const formatHours = (hour: number): string => {
  const isHalfHour = hour % 1 === 0.5;
  const displayHour = Math.floor(hour);
  const period = displayHour >= 12 ? "PM" : "AM";
  const hour12 = displayHour > 12 ? displayHour - 12 : displayHour === 0 ? 12 : displayHour;
  const minutes = isHalfHour ? "30" : "00";

  return `${hour12}:${minutes} ${period}`;
};

export const extractMapUrl = (iframeString?: string | null): string | null => {
  if (!iframeString) return null;
  const srcMatch = iframeString.match(/src="([^"]+)"/);
  return srcMatch ? srcMatch[1] : iframeString.startsWith("http") ? iframeString : null;
};
