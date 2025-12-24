import { getDb } from "../../../lib/db/client";
import { CategoriesPageClient } from "./CategoriesPageClient";
import type { Metadata } from "next";

// Revalidate every 10 minutes
export const revalidate = 600;

// Generate metadata for categories page
export async function generateMetadata(): Promise<Metadata> {
  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL || "https://mtabal.m.dynamicord.com";

  try {
    const categoriesResult = await getDb().execute({
      sql: "SELECT name_en FROM categories WHERE is_active = 1 ORDER BY display_order ASC LIMIT 6",
    });

    const categoryNames = categoriesResult.rows
      .map((row) => row.name_en)
      .join(", ");
    const description = `Browse all menu categories at Mtabal Restaurant including ${categoryNames}. Discover our full range of authentic Middle Eastern dishes.`;

    return {
      title: "Menu Categories",
      description,
      keywords: [
        "Menu categories",
        "Mtabal Restaurant",
        "Middle Eastern food",
        "Arabic cuisine",
        "Restaurant menu",
      ],
      openGraph: {
        title: "Menu Categories - Mtabal Restaurant",
        description,
        url: `${baseUrl}/categories`,
        images: [
          {
            url: "/transparent-bg-mtabal-en-large.webp",
            width: 1200,
            height: 630,
            alt: "Mtabal Restaurant Menu Categories",
          },
        ],
        type: "website",
        siteName: "Mtabal Restaurant",
      },
      twitter: {
        card: "summary_large_image",
        title: "Menu Categories - Mtabal Restaurant",
        description,
        images: ["/transparent-bg-mtabal-en-large.webp"],
      },
    };
  } catch (error) {
    console.error("Error generating metadata:", error);
    return {
      title: "Menu Categories",
      description:
        "Browse all menu categories at Mtabal Restaurant. Discover our full range of authentic Middle Eastern dishes.",
    };
  }
}

export default async function CategoriesPage() {
  // Fetch all data in parallel for better performance
  const [
    categoriesResult,
    hoursResult,
    socialResult,
    settingsResult,
    faqsResult,
  ] = await Promise.allSettled([
    getDb().execute({
      sql: "SELECT * FROM categories WHERE is_active = 1 ORDER BY display_order ASC",
    }),
    getDb().execute({
      sql: "SELECT day_name, open_hour, close_hour, is_closed FROM operating_hours ORDER BY id ASC",
    }),
    getDb().execute({
      sql: "SELECT id, platform, url FROM social_media",
    }),
    getDb().execute({
      sql: "SELECT google_map_iframe_url, phone_reservation, phone_checkout, whatsapp, email, address_ar, address_en, address_fr FROM restaurant_settings WHERE id = ?",
      args: ["main"],
    }),
    getDb().execute({
      sql: "SELECT id, question_ar, question_en, question_fr, answer_ar, answer_en, answer_fr FROM faqs WHERE is_active = 1 ORDER BY display_order ASC",
    }),
  ]);

  // Process categories
  const categories: Array<{
    id: string;
    name_ar: string;
    name_en: string;
    name_fr: string;
    image_url: string | null;
    icon_name: string;
    display_order: number;
  }> =
    categoriesResult.status === "fulfilled"
      ? categoriesResult.value.rows.map((row) => ({
          id: row.id as string,
          name_ar: row.name_ar as string,
          name_en: row.name_en as string,
          name_fr: row.name_fr as string,
          image_url: row.image_url as string | null,
          icon_name: row.icon_name as string,
          display_order: row.display_order as number,
        }))
      : [];

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

  // Process FAQs
  const faqs: Array<{
    id: string;
    question_ar: string;
    question_en: string;
    question_fr: string;
    answer_ar: string;
    answer_en: string;
    answer_fr: string;
  }> =
    faqsResult.status === "fulfilled"
      ? faqsResult.value.rows.map((row) => ({
          id: row.id as string,
          question_ar: row.question_ar as string,
          question_en: row.question_en as string,
          question_fr: row.question_fr as string,
          answer_ar: row.answer_ar as string,
          answer_en: row.answer_en as string,
          answer_fr: row.answer_fr as string,
        }))
      : [];

  return (
    <CategoriesPageClient
      categories={categories}
      operatingHours={operatingHours}
      socialMedia={socialMedia}
      settings={settings}
      faqs={faqs}
    />
  );
}
