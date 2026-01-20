"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { Utensils, Coffee, ChevronRight } from "lucide-react";
import type { Language } from "@/types";
import { cn } from "@/utils/helpers";

// Icon mapping
const iconMap: Record<string, any> = {
  Utensils,
  Coffee,
};

interface CategoryData {
  id: string;
  name_ar: string;
  name_en: string;
  name_fr: string;
  image_url: string | null;
  icon_name?: string;
}

interface SaasCategoryGridProps {
  categories: CategoryData[];
  lang: Language;
  catalogSlug: string;
  colorPrimary?: string;
  colorSecondary?: string;
  isFirstLoad?: boolean;
}

export function SaasCategoryGrid({
  categories,
  lang,
  catalogSlug,
  colorPrimary = "#fead1d",
  colorSecondary = "#b14288",
  isFirstLoad = false,
}: SaasCategoryGridProps) {
  // Get category name based on language
  const getCategoryName = (cat: CategoryData) => {
    switch (lang) {
      case "ar": return cat.name_ar;
      case "fr": return cat.name_fr;
      default: return cat.name_en;
    }
  };

  // Labels
  const viewItemsLabel = lang === "ar" ? "عرض العناصر" : lang === "fr" ? "Voir les articles" : "View items";

  return (
    <div className="space-y-6">
      <motion.div
        initial={isFirstLoad ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="grid grid-cols-2 gap-4"
      >
        {categories.map((cat, idx) => {
          const Icon = iconMap[cat.icon_name || "Utensils"] || Utensils;
          const hasImage = !!cat.image_url;

          return (
            <motion.div
              key={cat.id}
              initial={isFirstLoad ? false : { opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={isFirstLoad ? { duration: 0 } : { delay: idx * 0.05 }}
            >
              <Link
                href={`/c/${catalogSlug}/menu/${cat.id}`}
                style={{
                  backgroundColor: 'var(--surface)',
                  ...(hasImage ? { borderColor: "transparent" } : {})
                }}
                className="relative rounded-xl shadow-sm border border-transparent overflow-hidden hover:shadow-lg transition-all group block"
              >
                {hasImage ? (
                  <div className="aspect-square relative">
                    <Image
                      src={cat.image_url!}
                      alt={getCategoryName(cat)}
                      fill
                      sizes="(max-width: 640px) 200px, 300px"
                      quality={75}
                      priority={idx < 4}
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-4">
                      <span className="font-bold text-sm text-white drop-shadow-lg">
                        {getCategoryName(cat)}
                      </span>
                      <div className="flex items-center gap-1 text-white/70 text-xs mt-1">
                        <span>{viewItemsLabel}</span>
                        <ChevronRight className="w-3 h-3" />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-6 flex flex-col items-center gap-4">
                    <div
                      className="absolute inset-0 bg-gradient-to-br -z-10 from-transparent via-transparent opacity-0 group-hover:opacity-100 transition-opacity"
                      style={{
                        background: `linear-gradient(135deg, transparent, ${colorPrimary}10)`,
                      }}
                    />
                    <div
                      className="w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 shadow-sm"
                      style={{
                        backgroundColor: `${colorPrimary}10`,
                        color: colorPrimary,
                      }}
                    >
                      <Icon size={26} strokeWidth={1.5} />
                    </div>
                    <span
                      className="font-bold text-sm transition-colors text-center"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      {getCategoryName(cat)}
                    </span>
                  </div>
                )}
              </Link>
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
}
