"use client";

import { usePathname, useRouter } from "next/navigation";
import { useApp } from "../../providers/AppProvider";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "../../utils/helpers";

export default function MenuLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { lang, categories } = useApp();

  // Extract categoryId from pathname (handles both /menu/categoryId and /menu/categoryId/)
  const categoryId = pathname?.replace("/menu/", "").split("/")[0] || null;

  if (!lang) {
    return <>{children}</>;
  }

  // Transform categories for display
  const transformedCategories = categories.map((cat) => ({
    id: cat.id,
    ar: cat.name_ar,
    en: cat.name_en,
    fr: cat.name_fr,
  }));

  return (
    <div className="w-full">
      {/* Sticky Categories Bar - This persists across route changes, scroll position is preserved */}
      {/* Always render the bar structure to prevent layout shift, show loading state if needed */}
      <div className="sticky top-[69px] z-30 bg-white/95 dark:bg-navy-900/95 backdrop-blur-xl py-3 px-4 mb-6 overflow-x-auto flex gap-3 no-scrollbar border-b border-purple-100/50 dark:border-purple-900/30 items-center shadow-sm">
        <div className="max-w-md mx-auto md:max-w-2xl lg:max-w-4xl flex gap-3 items-center">
          {/* Back Button */}
          <button
            onClick={() => router.push("/categories")}
            className="flex-shrink-0 w-10 h-10 rounded-full bg-white dark:bg-navy-800 text-slate-700 dark:text-slate-200 shadow-sm hover:shadow-md transition-all border border-slate-200 dark:border-navy-700 flex items-center justify-center hover:text-orange-500 dark:hover:text-orange-400 hover:border-orange-200"
          >
            {lang === "ar" ? (
              <ChevronRight size={20} />
            ) : (
              <ChevronLeft size={20} />
            )}
          </button>

          <div className="h-6 w-px bg-slate-200 dark:bg-navy-700 mx-1 flex-shrink-0" />

          {transformedCategories.length > 0 ? (
            transformedCategories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => router.push(`/menu/${cat.id}`)}
                className={cn(
                  "whitespace-nowrap px-5 py-2.5 rounded-full text-sm font-bold transition-all border cursor-pointer hover:scale-105 active:scale-95 shadow-sm flex-shrink-0",
                  categoryId === cat.id
                    ? "bg-purple-600 text-white border-transparent shadow-purple-500/30"
                    : "bg-white dark:bg-navy-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-navy-700 hover:border-orange-400 dark:hover:border-orange-500/50 hover:text-orange-600 dark:hover:text-orange-400"
                )}
              >
                {cat[lang]}
              </button>
            ))
          ) : (
            // Loading skeleton - show while categories are being fetched
            <div className="flex gap-3 items-center">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-9 w-24 bg-slate-200 dark:bg-navy-700 rounded-full animate-pulse"
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Page Content */}
      {children}
    </div>
  );
}

