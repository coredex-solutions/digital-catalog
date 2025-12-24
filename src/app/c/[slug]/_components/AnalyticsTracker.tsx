"use client";

import { useEffect, useRef } from "react";

interface AnalyticsTrackerProps {
  catalogId: string;
}

// Simple browser fingerprint (not tracking personal data, just for unique visitor counting)
function getFingerprint(): string {
  const data = [
    navigator.userAgent,
    navigator.language,
    screen.width,
    screen.height,
    screen.colorDepth,
    new Date().getTimezoneOffset(),
  ].join("|");

  // Simple hash
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}

export function CatalogAnalyticsTracker({ catalogId }: AnalyticsTrackerProps) {
  const tracked = useRef(false);

  useEffect(() => {
    // Only track once per page load
    if (tracked.current) return;
    tracked.current = true;

    const fingerprint = getFingerprint();

    // Track page view
    fetch("/api/analytics/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        catalog_id: catalogId,
        event: "page_view",
        fingerprint,
      }),
    }).catch(() => {
      // Silently fail - don't block user experience
    });
  }, [catalogId]);

  // Setup click tracking for WhatsApp and Booking buttons
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const button = target.closest("[data-action]");
      
      if (!button) return;

      const action = button.getAttribute("data-action");
      if (!action) return;

      // Map action to event type
      const eventMap: Record<string, string> = {
        whatsapp_order: "whatsapp_click",
        booking_button: "booking_click",
        booking_confirm: "booking_confirm",
      };

      const event = eventMap[action];
      if (!event) return;

      // Track the click
      fetch("/api/analytics/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          catalog_id: catalogId,
          event,
          fingerprint: getFingerprint(),
        }),
      }).catch(() => {
        // Silently fail
      });
    };

    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, [catalogId]);

  return null;
}

