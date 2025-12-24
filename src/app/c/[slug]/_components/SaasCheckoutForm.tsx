"use client";

import { useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { X, MessageCircle, User, Phone, FileText, ShoppingBag, Send, Check } from "lucide-react";
import type { Language, CatalogContactData } from "@/types";
import { CartItem } from "../_providers/CatalogProvider";
import { cn } from "@/utils/helpers";

interface SaasCheckoutFormProps {
  cart: CartItem[];
  lang: Language;
  onClose: () => void;
  onSuccess: () => void;
  cartTotal: number;
  catalogName: string;
  contact?: CatalogContactData | null;
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

export function SaasCheckoutForm({
  cart,
  lang,
  onClose,
  onSuccess,
  cartTotal,
  catalogName,
  contact,
  colorPrimary = "#fead1d",
}: SaasCheckoutFormProps) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [isSending, setIsSending] = useState(false);

  const dir = lang === "ar" ? "rtl" : "ltr";
  const font = lang === "ar" ? "font-cairo" : "font-inter";
  const whatsappNumber = contact?.phone_whatsapp;

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
    title: lang === "ar" ? "إتمام الطلب" : lang === "fr" ? "Commander" : "Checkout",
    yourOrder: lang === "ar" ? "طلبك" : lang === "fr" ? "Votre commande" : "Your Order",
    yourDetails: lang === "ar" ? "بياناتك" : lang === "fr" ? "Vos coordonnées" : "Your Details",
    name: lang === "ar" ? "الاسم" : lang === "fr" ? "Nom" : "Name",
    namePlaceholder: lang === "ar" ? "أدخل اسمك" : lang === "fr" ? "Entrez votre nom" : "Enter your name",
    phone: lang === "ar" ? "رقم الهاتف" : lang === "fr" ? "Téléphone" : "Phone",
    phonePlaceholder: lang === "ar" ? "رقم الواتساب" : lang === "fr" ? "Numéro WhatsApp" : "WhatsApp number",
    notes: lang === "ar" ? "ملاحظات" : lang === "fr" ? "Notes" : "Notes",
    notesPlaceholder: lang === "ar" ? "أي طلبات خاصة؟" : lang === "fr" ? "Demandes spéciales?" : "Any special requests?",
    total: lang === "ar" ? "المجموع" : lang === "fr" ? "Total" : "Total",
    orderViaWhatsApp: lang === "ar" ? "اطلب عبر واتساب" : lang === "fr" ? "Commander via WhatsApp" : "Order via WhatsApp",
    sending: lang === "ar" ? "جاري الإرسال..." : lang === "fr" ? "Envoi en cours..." : "Sending...",
  };

  // Build WhatsApp message
  const buildWhatsAppMessage = () => {
    let message = `🛒 *${lang === "ar" ? "طلب جديد من" : "New Order from"} ${catalogName}*\n\n`;
    
    message += `👤 *${labels.name}:* ${name}\n`;
    message += `📱 *${labels.phone}:* ${phone}\n\n`;
    
    message += `📋 *${labels.yourOrder}:*\n`;
    cart.forEach((item) => {
      message += `• ${getItemName(item)} x${item.quantity} - ${formatPrice(item.price * item.quantity, item.currency || "USD", lang)}\n`;
    });
    
    message += `\n💰 *${labels.total}:* ${formatPrice(cartTotal, "USD", lang)}`;
    
    if (notes) {
      message += `\n\n📝 *${labels.notes}:* ${notes}`;
    }
    
    return encodeURIComponent(message);
  };

  const handleSubmit = () => {
    if (!name.trim() || !phone.trim() || !whatsappNumber) return;
    
    setIsSending(true);
    
    const message = buildWhatsAppMessage();
    const whatsappUrl = `https://wa.me/${whatsappNumber.replace(/\D/g, "")}?text=${message}`;
    
    // Open WhatsApp
    window.open(whatsappUrl, "_blank");
    
    setTimeout(() => {
      setIsSending(false);
      onSuccess();
    }, 500);
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 pointer-events-none">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm pointer-events-auto"
      />

      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className={cn(
          "relative w-full max-w-lg bg-white dark:bg-navy-900 rounded-3xl shadow-2xl overflow-hidden pointer-events-auto max-h-[90vh] flex flex-col",
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
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">{labels.title}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 bg-slate-100 dark:bg-navy-800 rounded-full hover:bg-slate-200 transition-colors text-slate-600 dark:text-slate-300"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Order Summary */}
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
              <ShoppingBag size={18} style={{ color: colorPrimary }} />
              {labels.yourOrder}
            </h3>
            <div className="bg-slate-50 dark:bg-navy-800 rounded-2xl p-4 space-y-2 max-h-40 overflow-y-auto">
              {cart.map((item) => (
                <div key={item.id} className="flex justify-between items-center text-sm">
                  <span className="text-slate-700 dark:text-slate-300">
                    {getItemName(item)} x{item.quantity}
                  </span>
                  <span className="font-medium" style={{ color: colorPrimary }}>
                    {formatPrice(item.price * item.quantity, item.currency || "USD", lang)}
                  </span>
                </div>
              ))}
              <div className="border-t border-slate-200 dark:border-navy-700 pt-2 mt-2 flex justify-between items-center font-bold">
                <span className="text-slate-900 dark:text-white">{labels.total}</span>
                <span style={{ color: colorPrimary }}>{formatPrice(cartTotal, "USD", lang)}</span>
              </div>
            </div>
          </div>

          {/* Customer Details Form */}
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
              <User size={18} style={{ color: colorPrimary }} />
              {labels.yourDetails}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  {labels.name} *
                </label>
                <div className="relative">
                  <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={labels.namePlaceholder}
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-navy-800 border border-slate-200 dark:border-navy-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2"
                    style={{ "--tw-ring-color": colorPrimary } as any}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  {labels.phone} *
                </label>
                <div className="relative">
                  <Phone size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder={labels.phonePlaceholder}
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-navy-800 border border-slate-200 dark:border-navy-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2"
                    style={{ "--tw-ring-color": colorPrimary } as any}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  {labels.notes}
                </label>
                <div className="relative">
                  <FileText size={18} className="absolute left-3 top-3 text-slate-400" />
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder={labels.notesPlaceholder}
                    rows={3}
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-navy-800 border border-slate-200 dark:border-navy-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 resize-none"
                    style={{ "--tw-ring-color": colorPrimary } as any}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-100 dark:border-navy-800 bg-slate-50/50 dark:bg-navy-800/50">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleSubmit}
            disabled={!name.trim() || !phone.trim() || !whatsappNumber || isSending}
            className="w-full py-4 rounded-2xl font-bold text-white flex items-center justify-center gap-3 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ backgroundColor: "#25D366" }}
          >
            <MessageCircle size={20} />
            <span>{isSending ? labels.sending : labels.orderViaWhatsApp}</span>
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}
