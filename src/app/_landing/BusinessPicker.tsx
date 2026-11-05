"use client";

import { Coffee, ShoppingBag, Sparkles, UtensilsCrossed } from "lucide-react";
import { BUSINESSES, type Business } from "./samples";

const ICONS: Record<Business, typeof Coffee> = { restaurant: UtensilsCrossed, cafe: Coffee, shop: ShoppingBag, services: Sparkles };

/** A row of four buttons that switches a landing demo between kinds of business */
export function BusinessPicker({
  value,
  onChange,
  labels,
  label,
  className = "",
}: {
  value: Business;
  onChange: (business: Business) => void;
  labels: Record<Business, string>;
  label: string;
  className?: string;
}) {
  return (
    <div role="group" aria-label={label} className={`grid grid-cols-4 gap-1 rounded-panel border border-ui-line bg-ui-surface p-1 ${className}`}>
      {BUSINESSES.map((business) => {
        const Icon = ICONS[business];
        const selected = value === business;
        return (
          <button
            key={business}
            type="button"
            aria-pressed={selected}
            onClick={() => onChange(business)}
            className={`flex min-h-11 items-center justify-center gap-1.5 rounded-control px-1 text-xs font-semibold transition-colors sm:text-sm ${
              selected ? "bg-ui-primary text-ui-primary-fg" : "text-ui-muted hover:bg-ui-subtle hover:text-ui-ink"
            }`}
          >
            <Icon className="hidden h-4 w-4 shrink-0 min-[400px]:block" aria-hidden />
            {labels[business]}
          </button>
        );
      })}
    </div>
  );
}
