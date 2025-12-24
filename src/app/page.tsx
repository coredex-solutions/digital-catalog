import { getDb } from "../../lib/db/client";
import { HomePageClient } from "./HomePageClient";

// Revalidate every 10 minutes
export const revalidate = 600;

export default async function Page() {
  // Fetch all data in parallel for better performance
  const [settingsResult, hoursResult, socialResult] = await Promise.allSettled([
    getDb().execute({
      sql: "SELECT google_map_iframe_url, phone_reservation, phone_checkout, whatsapp, email, address_ar, address_en, address_fr FROM restaurant_settings WHERE id = ?",
      args: ["main"],
    }),
    getDb().execute({
      sql: "SELECT day_name, open_hour, close_hour, is_closed FROM operating_hours ORDER BY id ASC",
    }),
    getDb().execute({
      sql: "SELECT id, platform, url FROM social_media",
    }),
  ]);

  // Process settings
  let settings = null;
  if (
    settingsResult.status === "fulfilled" &&
    settingsResult.value.rows.length > 0
  ) {
    const row = settingsResult.value.rows[0];
    settings = {
      google_map_iframe_url: row.google_map_iframe_url,
      phone_reservation: row.phone_reservation,
      phone_checkout: row.phone_checkout,
      whatsapp: row.whatsapp,
      email: row.email,
      address_ar: row.address_ar,
      address_en: row.address_en,
      address_fr: row.address_fr,
    };
  }

  // Process operating hours
  const operatingHours: Array<{
    day_name: string;
    open_hour: number;
    close_hour: number;
    is_closed: boolean;
  }> =
    hoursResult.status === "fulfilled"
      ? hoursResult.value.rows.map((row) => ({
          day_name: row.day_name as string,
          open_hour: row.open_hour as number,
          close_hour: row.close_hour as number,
          is_closed: (row.is_closed as number) === 1,
        }))
      : [];

  // Process social media
  const socialMedia: Array<{
    id: string;
    platform: string;
    url: string;
  }> =
    socialResult.status === "fulfilled"
      ? socialResult.value.rows.map((row) => ({
          id: row.id as string,
          platform: row.platform as string,
          url: row.url as string,
        }))
      : [];

  // Generate structured data for Restaurant
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Restaurant",
    name: "Mtabal Restaurant",
    description:
      "Authentic Middle Eastern cuisine featuring grilled specialties, traditional dishes, and more",
    url: process.env.NEXT_PUBLIC_SITE_URL || "https://mtabal.m.dynamicord.com",
    telephone: settings?.phone_reservation || "",
    email: settings?.email || "",
    address: {
      "@type": "PostalAddress",
      streetAddress: settings?.address_en || "",
      addressLocality: "City",
      addressCountry: "Country",
    },
    servesCuisine: ["Middle Eastern", "Lebanese", "Arabic"],
    priceRange: "$$",
    openingHoursSpecification: operatingHours
      .filter((hour) => !hour.is_closed)
      .map((hour) => ({
        "@type": "OpeningHoursSpecification",
        dayOfWeek: hour.day_name,
        opens: `${String(hour.open_hour).padStart(2, "0")}:00`,
        closes: `${String(hour.close_hour).padStart(2, "0")}:00`,
      })),
    hasMenu: `${
      process.env.NEXT_PUBLIC_SITE_URL || "https://mtabal.m.dynamicord.com"
    }/categories`,
    acceptsReservations: "True",
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <HomePageClient
        settings={settings}
        operatingHours={operatingHours}
        socialMedia={socialMedia}
      />
    </>
  );
}
