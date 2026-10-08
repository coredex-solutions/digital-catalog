"use client";

import { useEffect, useState } from "react";
import { getOpenStatus, formatHour, type OpenStatus } from "@/lib/utils/restaurant-hours";
import { useCatalog } from "../../_providers/CatalogProvider";
import { cn } from "@/utils/helpers";

/**
 * "Open now · Closes at 11 PM" / "Closed · Opens Monday at 9 AM", in Beirut time.
 * Computed after mount (and refreshed every minute) so a cached server render never shows a
 * stale status; a fixed-height placeholder avoids layout shift.
 */
export function OpenStatusBadge({ className }: { className?: string }) {
  const { operatingHours, lang, t } = useCatalog();
  const [status, setStatus] = useState<OpenStatus | null>(null);

  useEffect(() => {
    const update = () => setStatus(getOpenStatus(operatingHours));
    update();
    const timer = window.setInterval(update, 60_000);
    return () => window.clearInterval(timer);
  }, [operatingHours]);

  if (!status) return <span className={cn("inline-block h-5 w-28", className)} aria-hidden />;
  if (status.state === "unknown") return null;

  const isOpen = status.state === "open";
  const detail = isOpen
    ? t.closesAt(formatHour(status.closesAt, lang))
    : status.opensToday
      ? t.opensAt(formatHour(status.opensAt, lang))
      : t.opensOn(t.days[status.opensDayIndex], formatHour(status.opensAt, lang));

  return (
    <span className={cn("inline-flex items-center gap-1.5 text-sm", className)}>
      <span className={cn("h-2 w-2 rounded-full", isOpen ? "bg-menu-success" : "bg-menu-danger")} aria-hidden />
      <span className={cn("font-semibold", isOpen ? "text-menu-success" : "text-menu-danger")}>
        {isOpen ? t.openNow : t.closed}
      </span>
      <span className="text-menu-muted">· {detail}</span>
    </span>
  );
}
