"use client";

import { useApp } from "../../providers/AppProvider";
import { GlobalModals } from "../../App";
import { useEffect, useState } from "react";

export function GlobalModalsWrapper() {
  const { lang, isReservationOpen, setIsReservationOpen } = useApp();
  const [settings, setSettings] = useState<any>(null);

  useEffect(() => {
    // Fetch settings for global modals
    fetch("/api/restaurant-settings")
      .then((res) => res.json())
      .then((data) => setSettings(data))
      .catch((err) => console.error("Error fetching settings:", err));
  }, []);

  if (!lang) return null;

  return (
    <GlobalModals
      lang={lang}
      isReservationOpen={isReservationOpen}
      setIsReservationOpen={setIsReservationOpen}
      settings={settings}
    />
  );
}
