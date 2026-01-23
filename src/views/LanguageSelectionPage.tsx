'use client';

import { motion } from "framer-motion";
import type { Language } from "../types";
import { cn } from "../utils/helpers";

interface LanguageSelectionPageProps {
  onSelect: (lang: Language) => void;
}

export function LanguageSelectionPage({ onSelect }: LanguageSelectionPageProps) {
  return (
    <div className="fixed inset-0 bg-navy-900 text-white flex flex-col items-center justify-center p-6 z-50">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-8 w-full max-w-sm"
      >
        <h1 className="text-4xl font-thin tracking-widest mb-8 font-inter">
          MENU
        </h1>
        <div className="space-y-4 flex flex-col">
          {[
            { code: "ar", label: "العربية", font: "font-cairo" },
            { code: "en", label: "English", font: "font-inter" },
            { code: "fr", label: "Français", font: "font-inter" },
          ].map((l) => (
            <button
              key={l.code}
              onClick={() => onSelect(l.code as Language)}
              className={cn(
                "py-4 px-8 border border-white/20 rounded-xl text-xl hover:bg-white/10 transition-all duration-300 hover:border-purple-500 hover:text-purple-500",
                l.font
              )}
            >
              {l.label}
            </button>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

