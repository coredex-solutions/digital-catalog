"use client";

import { motion } from "framer-motion";
import type { Language, LanguageOption } from "../types";
import { cn } from "../utils/helpers";

interface DynamicLanguageSelectionPageProps {
  onSelect: (lang: Language) => void;
  // Dynamic languages prop - defaults to standard 3 languages
  languages?: LanguageOption[];
  // Optional catalog name to display
  catalogName?: string;
  // Theme colors (optional)
  colorPrimary?: string;
}

const DEFAULT_LANGUAGES: LanguageOption[] = [
  { code: "ar", label: "العربية", font: "font-cairo" },
  { code: "en", label: "English", font: "font-inter" },
  { code: "fr", label: "Français", font: "font-inter" },
];

export function DynamicLanguageSelectionPage({
  onSelect,
  languages = DEFAULT_LANGUAGES,
  catalogName,
  colorPrimary,
}: DynamicLanguageSelectionPageProps) {
  // Hover color style
  const hoverColorStyle = colorPrimary
    ? `hover:border-[${colorPrimary}] hover:text-[${colorPrimary}]`
    : "hover:border-orange-500 hover:text-orange-500";

  return (
    <div className="fixed inset-0 bg-navy-900 text-white flex flex-col items-center justify-center p-6 z-50">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-8 w-full max-w-sm"
      >
        <h1 className="text-4xl font-thin tracking-widest mb-8 font-inter">
          {catalogName || "MENU"}
        </h1>
        <div className="space-y-4 flex flex-col">
          {languages.map((l) => (
            <motion.button
              key={l.code}
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onSelect(l.code)}
              className={cn(
                "py-4 px-8 border border-white/20 rounded-xl text-xl transition-all duration-300",
                "hover:bg-white/10",
                l.font
              )}
              style={
                colorPrimary
                  ? {
                      // Dynamic hover border color via CSS custom properties
                      "--hover-color": colorPrimary,
                    } as React.CSSProperties
                  : undefined
              }
              onMouseEnter={(e) => {
                if (colorPrimary) {
                  e.currentTarget.style.borderColor = colorPrimary;
                  e.currentTarget.style.color = colorPrimary;
                }
              }}
              onMouseLeave={(e) => {
                if (colorPrimary) {
                  e.currentTarget.style.borderColor = "rgba(255,255,255,0.2)";
                  e.currentTarget.style.color = "white";
                }
              }}
            >
              {l.label}
            </motion.button>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
