"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { X, Minus, Plus, Trash2, ShoppingBag } from "lucide-react";
import type { Language } from "@/types";
import { CartItem } from "../_providers/CatalogProvider";
import { cn } from "@/utils/helpers";

interface SaasCartDrawerProps {
  cart: CartItem[];
  lang: Language;
  onClose: () => void;
  onRemove: (itemId: string) => void;
  onUpdateQuantity: (itemId: string, quantity: number) => void;
  onCheckout: () => void;
  cartTotal: number;
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

export function SaasCartDrawer({
  cart,
  lang,
  onClose,
  onRemove,
  onUpdateQuantity,
  onCheckout,
  cartTotal,
  colorPrimary = "#fead1d",
}: SaasCartDrawerProps) {
  const dir = lang === "ar" ? "rtl" : "ltr";
  const font = lang === "ar" ? "font-cairo" : "font-inter";

  // Get item name based on language
  const getItemName = (item: CartItem) => {
    switch (lang) {
      case "ar": return item.name_ar;
      case "fr": return item.name_fr;
      default: return item.name_en;
    }
  };

  // Labels
  const labels = {
    cart: lang === "ar" ? "سلة التسوق" : lang === "fr" ? "Panier" : "Shopping Cart",
    empty: lang === "ar" ? "سلتك فارغة" : lang === "fr" ? "Votre panier est vide" : "Your cart is empty",
    emptyDesc: lang === "ar" ? "أضف بعض العناصر اللذيذة!" : lang === "fr" ? "Ajoutez des articles délicieux!" : "Add some delicious items!",
    total: lang === "ar" ? "المجموع" : lang === "fr" ? "Total" : "Total",
    checkout: lang === "ar" ? "إتمام الطلب" : lang === "fr" ? "Commander" : "Checkout",
    items: lang === "ar" ? "عناصر" : lang === "fr" ? "articles" : "items",
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-stretch justify-end pointer-events-none">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm pointer-events-auto"
      />

      <motion.div
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className={cn(
          "relative w-full max-w-md bg-white dark:bg-navy-900 shadow-2xl overflow-hidden pointer-events-auto flex flex-col",
          font,
          dir === "rtl" ? "rtl" : "ltr"
        )}
        dir={dir}
      >
        {/* Header */}
        <div className="p-6 border-b border-slate-100 dark:border-navy-800 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{ backgroundColor: `${colorPrimary}20`, color: colorPrimary }}
            >
              <ShoppingBag size={20} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">{labels.cart}</h2>
              <p className="text-sm text-slate-500">{cart.length} {labels.items}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 bg-slate-100 dark:bg-navy-800 rounded-full hover:bg-slate-200 transition-colors text-slate-600 dark:text-slate-300"
          >
            <X size={20} />
          </button>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-12">
              <ShoppingBag size={64} className="text-slate-300 dark:text-slate-600 mb-4" />
              <p className="text-lg font-medium text-slate-700 dark:text-slate-300">{labels.empty}</p>
              <p className="text-sm text-slate-500 dark:text-slate-400">{labels.emptyDesc}</p>
            </div>
          ) : (
            cart.map((item) => (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="flex gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-navy-800"
              >
                {/* Item Image */}
                {item.image_url && (
                  <div className="relative w-20 h-20 rounded-xl overflow-hidden flex-shrink-0">
                    <Image
                      src={item.image_url}
                      alt={getItemName(item)}
                      fill
                      className="object-cover"
                    />
                  </div>
                )}

                {/* Item Details */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-slate-900 dark:text-white line-clamp-1">
                    {getItemName(item)}
                  </h3>
                  <p className="text-sm mt-1" style={{ color: colorPrimary }}>
                    {formatPrice(item.price, item.currency || "USD", lang)}
                  </p>

                  {/* Quantity Controls */}
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                        className="w-8 h-8 rounded-full bg-white dark:bg-navy-700 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-navy-600 transition-colors"
                      >
                        <Minus size={14} />
                      </button>
                      <span className="w-6 text-center font-medium text-slate-900 dark:text-white">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                        className="w-8 h-8 rounded-full flex items-center justify-center text-white transition-colors"
                        style={{ backgroundColor: colorPrimary }}
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                    <button
                      onClick={() => onRemove(item.id)}
                      className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>

        {/* Footer */}
        {cart.length > 0 && (
          <div className="p-6 border-t border-slate-100 dark:border-navy-800 bg-slate-50/50 dark:bg-navy-800/50 space-y-4">
            <div className="flex justify-between items-center text-lg">
              <span className="font-medium text-slate-700 dark:text-slate-300">{labels.total}</span>
              <span className="font-bold text-2xl" style={{ color: colorPrimary }}>
                {formatPrice(cartTotal, "USD", lang)}
              </span>
            </div>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onCheckout}
              className="w-full py-4 rounded-2xl font-bold text-white shadow-lg"
              style={{ backgroundColor: colorPrimary }}
            >
              {labels.checkout}
            </motion.button>
          </div>
        )}
      </motion.div>
    </div>
  );
}
