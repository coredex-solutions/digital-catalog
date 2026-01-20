"use client";

import { useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { X, Minus, Plus, ShoppingCart } from "lucide-react";
import type { Language } from "@/types";
import { MenuItem } from "../_providers/CatalogProvider";
import { cn } from "@/utils/helpers";

interface SaasItemModalProps {
  item: MenuItem;
  lang: Language;
  onClose: () => void;
  onAddToCart: (item: MenuItem, quantity: number) => void;
  colorPrimary?: string;
}

// Format price
function formatPrice(price: number, currency: string = "USD", lang: Language = "en"): string {
  const locale = lang === "ar" ? "ar-IQ" : lang === "fr" ? "fr-FR" : "en-US";
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(price);
}

export function SaasItemModal({
  item,
  lang,
  onClose,
  onAddToCart,
  colorPrimary = "#fead1d",
}: SaasItemModalProps) {
  const [quantity, setQuantity] = useState(1);
  const dir = lang === "ar" ? "rtl" : "ltr";
  const font = lang === "ar" ? "font-cairo" : "font-inter";

  // Get localized text
  const getItemName = () => {
    switch (lang) {
      case "ar": return item.name_ar;
      case "fr": return item.name_fr;
      default: return item.name_en;
    }
  };

  const getItemDescription = () => {
    switch (lang) {
      case "ar": return item.description_ar;
      case "fr": return item.description_fr;
      default: return item.description_en;
    }
  };

  // Labels
  const labels = {
    addToCart: lang === "ar" ? "أضف إلى السلة" : lang === "fr" ? "Ajouter au panier" : "Add to Cart",
    quantity: lang === "ar" ? "الكمية" : lang === "fr" ? "Quantité" : "Quantity",
  };

  const handleAddToCart = () => {
    onAddToCart(item, quantity);
    onClose();
  };

  const totalPrice = item.price * quantity;

  return (
    <div className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center pointer-events-none">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm pointer-events-auto"
      />

      <motion.div
        initial={{ y: "100%", opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: "100%", opacity: 0 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className={cn(
          "relative w-full max-w-lg rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden pointer-events-auto max-h-[90vh] flex flex-col",
          font,
          dir === "rtl" ? "rtl" : "ltr"
        )}
        style={{ backgroundColor: 'var(--surface)' }}
        dir={dir}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 bg-black/50 rounded-full text-white hover:bg-black/70 transition-colors"
        >
          <X size={20} />
        </button>

        {/* Image */}
        {item.image_url && (
          <div className="relative h-64 w-full flex-shrink-0">
            <Image
              src={item.image_url}
              alt={getItemName()}
              fill
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Name & Price */}
          <div className="flex justify-between items-start gap-4">
            <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
              {getItemName()}
            </h2>
            <span
              className="text-2xl font-bold flex-shrink-0"
              style={{ color: colorPrimary }}
            >
              {formatPrice(item.price, item.currency || "USD", lang)}
            </span>
          </div>

          {/* Description */}
          {getItemDescription() && (
            <p className="text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>
              {getItemDescription()}
            </p>
          )}

          <div className="flex items-center justify-between py-4 border-t" style={{ borderColor: 'rgba(var(--pattern-rgb), 0.08)' }}>
            <span className="font-medium" style={{ color: 'var(--text-muted)' }}>
              {labels.quantity}
            </span>
            <div className="flex items-center gap-3">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                style={{ backgroundColor: 'var(--surface)' }}
                className="w-10 h-10 rounded-full flex items-center justify-center border transition-colors"
              >
                <Minus size={18} style={{ color: 'var(--text-primary)' }} />
              </motion.button>
              <span className="text-xl font-bold w-8 text-center" style={{ color: 'var(--text-primary)' }}>
                {quantity}
              </span>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setQuantity(quantity + 1)}
                className="w-10 h-10 rounded-full flex items-center justify-center text-white transition-colors"
                style={{ backgroundColor: colorPrimary }}
              >
                <Plus size={18} />
              </motion.button>
            </div>
          </div>
        </div>

        {/* Add to Cart Button */}
        <div className="p-6 border-t" style={{ borderColor: 'rgba(var(--pattern-rgb), 0.08)', backgroundColor: 'rgba(var(--pattern-rgb), 0.03)' }}>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleAddToCart}
            className="w-full py-4 rounded-2xl font-bold text-white flex items-center justify-center gap-3 shadow-lg"
            style={{ backgroundColor: colorPrimary }}
          >
            <ShoppingCart size={20} />
            <span>{labels.addToCart}</span>
            <span className="ml-2 px-3 py-1 bg-white/20 rounded-full text-sm">
              {formatPrice(totalPrice, item.currency || "USD", lang)}
            </span>
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}
