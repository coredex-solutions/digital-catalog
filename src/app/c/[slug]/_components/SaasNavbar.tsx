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
  colorPrimary = "#8b5cf6",
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
    <nav
      className="fixed top-0 left-0 right-0 z-40 backdrop-blur-xl border-b shadow-sm transition-colors duration-300"
      style={{
        backgroundColor: 'var(--navbar-bg)',
        borderColor: 'var(--surface)'
      }}
    >
      <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {/* Home Button */}
          {showHomeButton && (
            <Link
              href={homeUrl || `/c/${catalogSlug}`}
              className="w-10 h-10 rounded-full flex items-center justify-center hover:shadow-md transition-all group flex-shrink-0 border"
              style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--surface)' }}
            >
              <Home
                size={18}
                className="transition-colors"
                style={{ color: isDarkMode ? 'var(--text-primary)' : colorPrimary }}
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
            <div className="border rounded-full px-4 py-2.5 flex items-center gap-2 flex-1 min-w-[120px] max-w-md transition-all focus-within:shadow-lg group"
              style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--surface)' }}
            >
              <Search
                size={16}
                className="transition-colors flex-shrink-0"
                style={{ color: isLangDropdownOpen ? colorPrimary : 'var(--text-muted)' }}
              />
              <input
                type="text"
                placeholder={lang === "ar" ? "بحث..." : lang === "fr" ? "Rechercher..." : "Search..."}
                style={{ color: 'var(--text-primary)' }}
                className="bg-transparent border-none outline-none text-sm w-full placeholder:text-muted-foreground/40"
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
            className="w-10 h-10 rounded-full flex items-center justify-center hover:shadow-md transition-all group border"
            style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--surface)' }}
          >
            {isDarkMode ? (
              <Sun size={18} style={{ color: colorPrimary }} className="group-hover:rotate-180 transition-transform duration-500" />
            ) : (
              <Moon size={18} style={{ color: colorPrimary }} className="group-hover:rotate-12 transition-transform duration-500" />
            )}
          </motion.button>

          {/* Language Switcher */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsLangDropdownOpen(!isLangDropdownOpen)}
              style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--surface)' }}
              className="h-10 px-3 rounded-full border flex items-center justify-center gap-1 hover:shadow-md transition-all group"
            >
              <Globe size={16} style={{ color: 'var(--text-muted)' }} />
              <span className="text-xs font-bold uppercase" style={{ color: 'var(--text-primary)' }}>
                {currentLang.code}
              </span>
              {/* <ChevronDown size={14} className={cn("transition-transform opacity-30", isLangDropdownOpen && "rotate-180")} /> */}
            </button>

            <AnimatePresence>
              {isLangDropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  style={{ backgroundColor: 'var(--surface)', borderColor: 'rgba(var(--pattern-rgb), 0.08)' }}
                  className={cn(
                    "absolute top-full mt-2 py-2 rounded-xl border shadow-xl min-w-[130px] overflow-hidden z-50",
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
                        "w-full px-4 py-2.5 text-left flex items-center gap-3 transition-colors",
                        l.code === lang ? "opacity-100" : "opacity-60 hover:opacity-100",
                        l.font
                      )}
                      style={{
                        backgroundColor: l.code === lang ? 'rgba(var(--pattern-rgb), 0.05)' : 'transparent',
                      }}
                      onMouseEnter={(e) => { if (l.code !== lang) e.currentTarget.style.backgroundColor = 'rgba(var(--pattern-rgb), 0.03)' }}
                      onMouseLeave={(e) => { if (l.code !== lang) e.currentTarget.style.backgroundColor = 'transparent' }}
                    >
                      <span className="text-xs font-bold uppercase w-6 opacity-30" style={{ color: 'var(--text-primary)' }}>{l.code}</span>
                      <span className="text-sm" style={{ color: 'var(--text-primary)' }}>{l.label}</span>
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
