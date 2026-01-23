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
  colorPrimary = "#8b5cf6",
  colorAccent = "#c084fc",
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
      <div className="text-center py-12" style={{ color: 'var(--text-muted)' }}>
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
          className="group flex flex-col rounded-xl p-4 shadow-sm transition-all cursor-pointer overflow-hidden border"
          style={{ backgroundColor: 'var(--surface)', borderColor: 'rgba(var(--pattern-rgb), 0.08)' }}
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
                    className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full font-bold shadow-sm backdrop-blur-md"
                    style={{ backgroundColor: 'var(--surface)', color: 'var(--text-primary)', border: '1px solid rgba(var(--pattern-rgb), 0.1)' }}
                  >
                    <Star className="w-3 h-3 fill-current" style={{ color: colorPrimary }} />
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
                <h3 className="font-bold text-lg leading-tight" style={{ color: 'var(--text-primary)' }}>
                  {getItemName(item)}
                </h3>
              </div>
              {getItemDescription(item) && (
                <p className="text-sm mt-2 line-clamp-2" style={{ color: 'var(--text-muted)' }}>
                  {getItemDescription(item)}
                </p>
              )}
            </div>

            {/* Footer logic matched to Legacy ItemCard */}
            <div className="flex justify-between items-center pt-3 border-t mt-2" style={{ borderColor: 'rgba(var(--pattern-rgb), 0.08)' }}>
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
