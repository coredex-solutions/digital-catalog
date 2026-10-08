"use client";

import { Minus, Plus, Trash2 } from "lucide-react";
import { useCatalog } from "../../_providers/CatalogProvider";
import { cn } from "@/utils/helpers";

interface QuantityStepperProps {
  value: number;
  onChange: (value: number) => void;
  /** Lowest allowed value; with min 0 the minus button turns into "remove" at 1 */
  min?: number;
  size?: "md" | "lg";
  label?: string;
}

export function QuantityStepper({ value, onChange, min = 1, size = "md", label }: QuantityStepperProps) {
  const { t } = useCatalog();
  const showRemove = min === 0 && value <= 1;
  const button = size === "lg" ? "h-12 w-12" : "h-11 w-11";

  return (
    <div
      className="inline-flex items-center rounded-control border border-menu-line bg-menu-surface"
      role="group"
      aria-label={label || t.quantity}
    >
      <button
        type="button"
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
        className={cn(button, "flex items-center justify-center rounded-control text-menu-ink transition-colors hover:bg-menu-raised disabled:opacity-35")}
        aria-label={showRemove ? t.remove : t.decrease}
      >
        {showRemove ? <Trash2 className="h-4 w-4" /> : <Minus className="h-4 w-4" />}
      </button>
      <span className={cn("min-w-8 text-center font-semibold tabular-nums", size === "lg" && "text-lg")} aria-live="polite">
        {value}
      </span>
      <button
        type="button"
        onClick={() => onChange(Math.min(99, value + 1))}
        disabled={value >= 99}
        className={cn(button, "flex items-center justify-center rounded-control text-menu-ink transition-colors hover:bg-menu-raised disabled:opacity-35")}
        aria-label={t.increase}
      >
        <Plus className="h-4 w-4" />
      </button>
    </div>
  );
}
