"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import type { Language, LocalizedString } from "../types";
import { cn } from "../utils/helpers";
import { 
  ChevronRight, 
  ChefHat, 
  Utensils, 
  Calendar, 
  Info,
  ArrowRight,
  Sparkles,
  BookOpen
} from "lucide-react";

interface DynamicHomePageProps {
  lang: Language;
  onReservation: () => void;
  logoUrl: string;
  name: LocalizedString;
  backgroundImage?: string | null;
  backgroundPattern?: string;
  baseUrl?: string;
  ctaMenuLabel?: LocalizedString;
  ctaBookingLabel?: LocalizedString;
  bookingEnabled?: boolean;
  colorPrimary?: string;
  colorSecondary?: string;
  setIsInfoOpen?: (open: boolean) => void;
}

export function DynamicHomePage({
  lang,
  onReservation,
  logoUrl,
  name,
  backgroundImage,
  backgroundPattern = "wood-pattern-dense",
  baseUrl = "",
  ctaMenuLabel = { ar: "عرض القائمة", en: "View Menu", fr: "Voir le Menu" },
  ctaBookingLabel = { ar: "حجز طاولة", en: "Make Reservation", fr: "Réserver" },
  bookingEnabled = true,
  colorPrimary = "#fead1d",
  colorSecondary,
  setIsInfoOpen,
}: DynamicHomePageProps) {
  const router = useRouter();
  const dir = lang === "ar" ? "rtl" : "ltr";
  const font = lang === "ar" ? "font-cairo" : "font-inter";

  return (
    <div
      className={cn(
        "fixed inset-0 bg-[#0a0a0c] text-white overflow-hidden",
        font
      )}
      dir={dir}
    >
      {/* Dynamic Background with Multiple Layers */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/20 to-black/80 z-10" />
        
        {/* The Actual Image Background */}
        {backgroundImage && (
          <motion.img
            initial={{ scale: 1.1, opacity: 0 }}
            animate={{ scale: 1, opacity: 0.4 }}
            transition={{ duration: 2 }}
            src={backgroundImage}
            alt={name[lang]}
            className="w-full h-full object-cover grayscale-[0.5] blur-[2px]"
          />
        )}

        {/* Animated Mesh Gradients */}
        <div 
          className="absolute inset-0 opacity-20 pointer-events-none"
          style={{
            background: `radial-gradient(circle at 0% 0%, ${colorPrimary}66 0%, transparent 50%),
                         radial-gradient(circle at 100% 100%, ${colorSecondary}66 0%, transparent 50%)`
          }}
        />
        
        {/* Pattern Overlay */}
        <div className="absolute inset-0 opacity-5 mix-blend-overlay bg-repeat bg-[scale:20%]" />
      </div>

      {/* Main Content UI */}
      <div className="relative z-20 h-full flex flex-col items-center justify-between py-12 px-6">
        
        {/* Header / Brand */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center text-center"
        >
          <div 
            className="w-24 h-24 mb-6 rounded-3xl bg-white/5 backdrop-blur-2xl border border-white/10 flex items-center justify-center p-4 relative group"
            style={{ borderColor: `${colorPrimary}22` }}
          >
            <div className="absolute inset-0 bg-white/5 blur-xl group-hover:bg-white/10 transition-all rounded-3xl" />
            <img 
              src={logoUrl} 
              alt="Logo" 
              className="w-full h-full object-contain relative z-10 filter drop-shadow-[0_4px_8px_rgba(0,0,0,0.5)] scale-110" 
            />
          </div>
          <div className="space-y-2">
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-white/40 block">Welcome To</span>
            <h1 className={cn(
                  "text-4xl md:text-6xl font-black tracking-tight",
                  lang === "ar" ? "font-cairo leading-tight" : "italic tracking-tighter"
                )}>
              {name[lang]}
            </h1>
          </div>
        </motion.div>

        {/* Center / Decorative */}
        <div className="relative flex flex-col items-center">
            <motion.div 
              animate={{ 
                rotate: 360,
                scale: [1, 1.05, 1]
              }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              className="absolute w-[300px] h-[300px] border border-white/[0.03] rounded-full"
            />
            <motion.div 
              animate={{ 
                rotate: -360,
                scale: [1, 1.1, 1]
              }}
              transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
              className="absolute w-[400px] h-[400px] border border-white/[0.02] rounded-full"
            />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3, duration: 0.8 }}
              className="z-10 relative"
            >
               <div className="flex flex-col items-center gap-4 text-center">
                  <div className="p-4 rounded-full bg-white/5 backdrop-blur-3xl border border-white/5">
                     <Utensils className="w-8 h-8 text-white/40" />
                  </div>
                  <p className="text-white/30 text-xs font-bold uppercase tracking-widest max-w-[200px]">
                    {lang === 'ar' ? 'اكتشف عالمنا من النكهات المتميزة' : 'Discover our world of premium flavors'}
                  </p>
               </div>
            </motion.div>
        </div>

        {/* Action Menu (Menu & Reservation) */}
        <div className="w-full max-w-sm space-y-4">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => router.push(`${baseUrl}/categories`)}
            className="w-full overflow-hidden relative group p-[2px] rounded-[2rem] transition-all"
          >
             <div 
               className="absolute inset-0 bg-gradient-to-r transition-all duration-500 group-hover:rotate-180" 
               style={{ backgroundImage: `linear-gradient(to right, ${colorPrimary}, ${colorSecondary})` }}
             />
             <div className="relative bg-[#0a0a0c] rounded-[2rem] px-8 py-5 flex items-center justify-between">
                <div className="flex items-center gap-4">
                   <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
                      <BookOpen className="w-5 h-5" style={{ color: colorPrimary }} />
                   </div>
                   <span className="text-xl font-black italic tracking-tighter uppercase">{ctaMenuLabel[lang]}</span>
                </div>
                <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-black group-hover:translate-x-1 transition-transform">
                   <ChevronRight className={cn("w-5 h-5", dir === 'rtl' && 'rotate-180')} />
                </div>
             </div>
          </motion.button>

          {bookingEnabled && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onReservation}
              className="w-full relative group p-5 bg-white/[0.04] backdrop-blur-3xl border border-white/10 rounded-[2rem] flex items-center justify-between hover:bg-white/[0.08] transition-all"
            >
                <div className="flex items-center gap-4">
                   <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
                      <Calendar className="w-5 h-5 text-white/40" />
                   </div>
                   <span className="text-lg font-bold tracking-tight text-white/80">{ctaBookingLabel[lang]}</span>
                </div>
                <ArrowRight className={cn("w-5 h-5 text-white/20 group-hover:text-white transition-all", dir === 'rtl' && 'rotate-180')} />
            </motion.button>
          )}

          {/* Social / Info Footer */}
          <div className="flex items-center justify-center gap-6 pt-4">
             <div className="h-[1px] flex-1 bg-white/5" />
             <div className="flex gap-4">
                <div 
                  className="w-10 h-10 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center hover:bg-white hover:text-black transition-all cursor-pointer"
                  onClick={() => setIsInfoOpen?.(true)}
                >
                   <Info className="w-4 h-4" />
                </div>
                <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center hover:bg-white hover:text-black transition-all cursor-pointer">
                   <Sparkles className="w-4 h-4" />
                </div>
             </div>
             <div className="h-[1px] flex-1 bg-white/5" />
          </div>
        </div>
      </div>

      {/* Peripheral Design elements */}
      <div className="absolute -top-20 -left-20 w-80 h-80 bg-primary/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-secondary/5 rounded-full blur-[100px] pointer-events-none" />
    </div>
  );
}
