"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { Plus, Star } from "lucide-react";
import type { Language } from "@/types";
import { MenuItem } from "../_providers/CatalogProvider";
import { cn } from "@/utils/helpers";

interface SaasMenuFeedProps {
  items: MenuItem[];
  lang: Language;
  searchQuery?: string;
  onItemClick: (item: MenuItem) => void;
  colorPrimary?: string;
  colorAccent?: string;
}

// Format price helper
function formatPrice(price: number, currency: string = "USD", lang: Language = "en"): string {
  const locale = lang === "ar" ? "ar-IQ" : lang === "fr" ? "fr-FR" : "en-US";
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(price);
}

export function SaasMenuFeed({
  items,
  lang,
  searchQuery = "",
  onItemClick,
  colorPrimary = "#fead1d",
  colorAccent = "#F7C948",
}: SaasMenuFeedProps) {
  // Filter items
  const filteredItems = items.filter((item) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      item.name_en.toLowerCase().includes(query) ||
      item.name_ar.includes(query) ||
      item.name_fr?.toLowerCase().includes(query)
    );
  });

  const getItemName = (item: MenuItem) => {
    switch (lang) {
      case "ar": return item.name_ar;
      case "fr": return item.name_fr;
      default: return item.name_en;
    }
  };

  const getItemDescription = (item: MenuItem) => {
    switch (lang) {
      case "ar": return item.description_ar;
      case "fr": return item.description_fr;
      default: return item.description_en;
    }
  };

  const labels = {
    noResults: lang === "ar" ? "لا توجد نتائج" : lang === "fr" ? "Aucun résultat" : "No results found",
    featured: lang === "ar" ? "مميز" : lang === "fr" ? "Vedette" : "Featured",
    add: lang === "ar" ? "أضف" : lang === "fr" ? "Ajouter" : "Add",
  };

  if (filteredItems.length === 0) {
    return (
      <div className="text-center py-12 text-slate-500 dark:text-slate-400">
        {labels.noResults}
      </div>
    );
  }

  // Use Vertical Card Layout to match legacy structure better, 
  // or at least be more distinct than the horizontal list
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {filteredItems.map((item, index) => (
        <motion.div
          key={item.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
          onClick={() => onItemClick(item)}
          className="group flex flex-col bg-white dark:bg-navy-800 rounded-2xl p-4 shadow-sm border border-slate-100 dark:border-navy-700 hover:shadow-lg transition-all cursor-pointer overflow-hidden"
        >
          {/* Image Section (Optional, but looks good) */}
          {item.image_url && (
            <div className="relative w-full h-48 rounded-xl overflow-hidden mb-4">
              <Image
                src={item.image_url}
                alt={getItemName(item)}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-500"
              />
              {item.is_featured && (
                <div className="absolute top-2 right-2">
                    <span 
                      className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full font-bold shadow-sm backdrop-blur-md bg-white/90 text-slate-900"
                    >
                      <Star className="w-3 h-3 fill-current text-orange-500" />
                      {labels.featured}
                    </span>
                </div>
              )}
            </div>
          )}

          {/* Content Section */}
          <div className="flex-1 flex flex-col gap-3">
             <div className="flex-1">
                <div className="flex justify-between items-start gap-2">
                   <h3 className="font-bold text-lg text-slate-900 dark:text-white leading-tight">
                      {getItemName(item)}
                   </h3>
                </div>
                {getItemDescription(item) && (
                   <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 line-clamp-2">
                      {getItemDescription(item)}
                   </p>
                )}
             </div>
             
             {/* Footer logic matched to Legacy ItemCard */}
             <div className="flex justify-between items-center pt-3 border-t border-slate-100 dark:border-navy-700 mt-2">
                <span 
                  className="font-bold text-xl"
                  style={{ color: colorPrimary }}
                >
                   {formatPrice(item.price, item.currency || "USD", lang)}
                </span>
                <button
                   onClick={(e) => {
                      e.stopPropagation();
                      onItemClick(item);
                   }}
                   className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-md active:scale-95 transition-all"
                   style={{ backgroundColor: colorPrimary }}
                >
                   <Plus size={20} strokeWidth={2.5} />
                </button>
             </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
