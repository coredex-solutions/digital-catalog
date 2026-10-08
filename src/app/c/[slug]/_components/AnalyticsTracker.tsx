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

export type AnalyticsEvent = "page_view" | "whatsapp_click" | "booking_confirm";

/**
 * Record an analytics event. `keepalive` lets the request finish even when the page is
 * navigating away at the same moment (e.g. opening WhatsApp right after an order is sent).
 */
export function trackEvent(catalogId: string, event: AnalyticsEvent) {
  try {
    fetch("/api/analytics/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ catalog_id: catalogId, event, fingerprint: getFingerprint() }),
      keepalive: true,
    }).catch(() => {
      // Silently fail - don't block user experience
    });
  } catch {
    // fetch unavailable; analytics are best-effort
  }
}

export function CatalogAnalyticsTracker({ catalogId }: AnalyticsTrackerProps) {
  const tracked = useRef(false);

  useEffect(() => {
    // Only track once per page load
    if (tracked.current) return;
    tracked.current = true;
    trackEvent(catalogId, "page_view");
  }, [catalogId]);

  return null;
}
