"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Home, Moon, Sun, Globe, Info, ChevronDown } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import type { Language, LanguageOption } from "@/types";
import { cn } from "@/utils/helpers";

interface SaasNavbarProps {
  lang: Language;
  onLanguageChange: (lang: Language) => void;
  onOpenInfo: () => void;
  isDarkMode: boolean;
  onToggleTheme: () => void;
  onSearch?: (query: string) => void;
  // Dynamic data
  logoUrl: string | null;
  catalogSlug: string;
  supportedLanguages?: LanguageOption[];
  // Optional navigation
  showHomeButton?: boolean;
  homeUrl?: string;
  // Dynamic colors
  colorPrimary?: string;
}

const DEFAULT_LANGUAGES: LanguageOption[] = [
  { code: "ar", label: "العربية", font: "font-cairo" },
  { code: "en", label: "English", font: "font-inter" },
  { code: "fr", label: "Français", font: "font-inter" },
];

export function SaasNavbar({
  lang,
  onLanguageChange,
  onOpenInfo,
  isDarkMode,
  onToggleTheme,
  onSearch,
  logoUrl,
  catalogSlug,
  supportedLanguages = DEFAULT_LANGUAGES,
  showHomeButton = false,
  homeUrl,
  colorPrimary = "#fead1d",
}: SaasNavbarProps) {
  const [isLangDropdownOpen, setIsLangDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const dir = lang === "ar" ? "rtl" : "ltr";

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsLangDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const currentLang = supportedLanguages.find((l) => l.code === lang) || supportedLanguages[0];

  return (
    <nav className="fixed top-0 left-0 right-0 z-40 bg-white/95 dark:bg-navy-900/95 backdrop-blur-xl border-b border-slate-200/50 dark:border-slate-700/50 shadow-sm transition-colors duration-300">
      <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {/* Home Button */}
          {showHomeButton && (
            <Link
              href={homeUrl || `/c/${catalogSlug}`}
              className="w-10 h-10 rounded-full bg-white dark:bg-navy-800 border border-slate-200 dark:border-navy-700 flex items-center justify-center hover:shadow-md transition-all group flex-shrink-0"
              style={{ borderColor: `${colorPrimary}30` }}
            >
              <Home
                size={18}
                className="text-slate-700 dark:text-slate-200 group-hover:text-orange-500 transition-colors"
                style={{ color: isDarkMode ? undefined : colorPrimary }}
              />
            </Link>
          )}

          {/* Logo */}
          <button
            onClick={onOpenInfo}
            className="flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
            title={lang === "ar" ? "معلومات" : "Info"}
          >
            {logoUrl ? (
              <Image
                src={logoUrl}
                alt="Logo"
                width={40}
                height={40}
                className="h-10 w-auto object-contain"
                style={{ filter: `drop-shadow(0 0 8px ${colorPrimary}80)` }}
              />
            ) : (
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center"
                style={{ backgroundColor: colorPrimary }}
              >
                <Info size={20} className="text-white" />
              </div>
            )}
          </button>

          {/* Search Bar */}
          {onSearch && (
            <div className="bg-white dark:bg-navy-800 border border-slate-200 dark:border-navy-700 rounded-full px-4 py-2.5 flex items-center gap-2 flex-1 min-w-[120px] max-w-md transition-all focus-within:shadow-lg group"
              style={{ borderColor: `${colorPrimary}20` }}
            >
              <Search
                size={16}
                className="text-slate-400 group-focus-within:text-orange-500 transition-colors flex-shrink-0"
                style={{ color: isLangDropdownOpen ? colorPrimary : undefined }}
              />
              <input
                type="text"
                placeholder={lang === "ar" ? "بحث..." : lang === "fr" ? "Rechercher..." : "Search..."}
                className="bg-transparent border-none outline-none text-sm w-full text-slate-700 dark:text-slate-200 placeholder:text-slate-400"
                onChange={(e) => onSearch(e.target.value)}
              />
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Theme Toggle */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onToggleTheme}
            className="w-10 h-10 rounded-full bg-white dark:bg-navy-800 border border-slate-200 dark:border-navy-700 flex items-center justify-center hover:shadow-md transition-all group"
          >
            {isDarkMode ? (
              <Sun size={18} className="text-orange-500 group-hover:rotate-180 transition-transform duration-500" />
            ) : (
              <Moon size={18} className="text-purple-600 group-hover:rotate-12 transition-transform duration-500" />
            )}
          </motion.button>

          {/* Language Switcher */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsLangDropdownOpen(!isLangDropdownOpen)}
              className="h-10 px-3 rounded-full bg-white dark:bg-navy-800 border border-slate-200 dark:border-navy-700 flex items-center justify-center gap-1 hover:shadow-md transition-all group"
            >
              <Globe size={16} className="text-slate-500" />
              <span className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase">
                {currentLang.code}
              </span>
              <ChevronDown size={14} className={cn("text-slate-400 transition-transform", isLangDropdownOpen && "rotate-180")} />
            </button>

            <AnimatePresence>
              {isLangDropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  className={cn(
                    "absolute top-full mt-2 py-2 bg-white dark:bg-navy-800 rounded-xl border border-slate-200 dark:border-navy-700 shadow-xl min-w-[130px] overflow-hidden z-50",
                    dir === "rtl" ? "left-0" : "right-0"
                  )}
                >
                  {supportedLanguages.map((l) => (
                    <button
                      key={l.code}
                      onClick={() => {
                        onLanguageChange(l.code);
                        setIsLangDropdownOpen(false);
                      }}
                      className={cn(
                        "w-full px-4 py-2.5 text-left flex items-center gap-3 hover:bg-slate-100 dark:hover:bg-navy-700 transition-colors",
                        l.code === lang && "bg-slate-100 dark:bg-navy-700",
                        l.font
                      )}
                    >
                      <span className="text-xs font-bold text-slate-400 uppercase w-6">{l.code}</span>
                      <span className="text-sm text-slate-700 dark:text-slate-200">{l.label}</span>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </nav>
  );
}
