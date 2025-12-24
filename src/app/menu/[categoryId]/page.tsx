import { getDb } from "../../../../lib/db/client";
import MenuPageClient from "./MenuPageClient";
import { CATEGORIES } from "../../../config/restaurant";
import type { Metadata } from "next";

// Revalidate every 10 minutes
export const revalidate = 600;

// Generate unique metadata for each menu page
export async function generateMetadata({
  params,
}: {
  params: Promise<{ categoryId: string }>;
}): Promise<Metadata> {
  const { categoryId } = await params;

  try {
    const categoryResult = await getDb().execute({
      sql: "SELECT name_ar, name_en, name_fr, image_url FROM categories WHERE id = ? AND is_active = 1",
      args: [categoryId],
    });

    const menuItemsResult = await getDb().execute({
      sql: "SELECT name_en FROM menu_items WHERE category_id = ? AND is_active = 1 ORDER BY display_order ASC LIMIT 5",
      args: [categoryId],
    });

    if (categoryResult.rows.length === 0) {
      return {
        title: "Menu",
        description: "Explore our delicious menu at Mtabal Restaurant",
      };
    }

    const category = categoryResult.rows[0];
    const categoryName = category.name_en as string;
    const imageUrl = category.image_url as string | null;

    // Get first few menu items for description
    const menuItems = menuItemsResult.rows
      .map((row) => row.name_en)
      .slice(0, 3);
    const itemsList =
      menuItems.length > 0 ? ` featuring ${menuItems.join(", ")}` : "";

    const title = `${categoryName} Menu`;
    const description = `Explore our ${categoryName} menu at Mtabal Restaurant${itemsList}. Authentic Middle Eastern cuisine delivered fresh daily.`;

    const baseUrl =
      process.env.NEXT_PUBLIC_SITE_URL || "https://mtabal.m.dynamicord.com";
    const ogImage = imageUrl || "/transparent-bg-mtabal-en-large.webp";

    return {
      title,
      description,
      keywords: [
        `${categoryName}`,
        "Mtabal Restaurant",
        "Middle Eastern food",
        "Arabic cuisine",
        "Restaurant menu",
      ],
      openGraph: {
        title,
        description,
        url: `${baseUrl}/menu/${categoryId}`,
        images: [
          {
            url: ogImage,
            width: 1200,
            height: 630,
            alt: `${categoryName} at Mtabal Restaurant`,
          },
        ],
        type: "website",
        siteName: "Mtabal Restaurant",
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
        images: [ogImage],
      },
    };
  } catch (error) {
    console.error("Error generating metadata:", error);
    return {
      title: "Menu",
      description: "Explore our delicious menu at Mtabal Restaurant",
    };
  }
}

// Generate static params for all categories
export async function generateStaticParams() {
  try {
    const result = await getDb().execute({
      sql: "SELECT id FROM categories WHERE is_active = 1",
    });
    return result.rows.map((row) => ({
      categoryId: row.id as string,
    }));
  } catch (error) {
    console.error("Error generating static params:", error);
    // Fallback to static categories if DB fails
    return CATEGORIES.map((cat) => ({
      categoryId: cat.id,
    }));
  }
}

export default async function MenuPage({
  params,
}: {
  params: Promise<{ categoryId: string }>;
}) {
  const { categoryId } = await params;

  // Fetch all data in parallel for better performance
  const [
    categoryResult,
    menuItemsResult,
    categoriesResult,
    hoursResult,
    socialResult,
    settingsResult,
    faqsResult,
  ] = await Promise.allSettled([
    getDb().execute({
      sql: "SELECT id, name_ar, name_en, name_fr, image_url, icon_name FROM categories WHERE id = ? AND is_active = 1",
      args: [categoryId],
    }),
    getDb().execute({
      sql: "SELECT id, category_id, name_ar, name_en, name_fr, description_ar, description_en, description_fr, price, display_order FROM menu_items WHERE category_id = ? AND is_active = 1 ORDER BY display_order ASC",
      args: [categoryId],
    }),
    getDb().execute({
      sql: "SELECT id, name_ar, name_en, name_fr, icon_name, image_url FROM categories WHERE is_active = 1 ORDER BY display_order ASC",
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

  // Process category
  let category: {
    id: string;
    name_ar: string;
    name_en: string;
    name_fr: string;
    image_url: string | null;
    icon_name: string;
  } | null = null;

  if (
    categoryResult.status === "fulfilled" &&
    categoryResult.value.rows.length > 0
  ) {
    const row = categoryResult.value.rows[0];
    category = {
      id: row.id as string,
      name_ar: row.name_ar as string,
      name_en: row.name_en as string,
      name_fr: row.name_fr as string,
      image_url: row.image_url as string | null,
      icon_name: row.icon_name as string,
    };
  }

  // Process menu items
  const menuItems: Array<{
    id: string;
    category_id: string;
    name_ar: string;
    name_en: string;
    name_fr: string;
    description_ar: string | null;
    description_en: string | null;
    description_fr: string | null;
    price: number;
    display_order: number;
  }> =
    categoryResult.status === "fulfilled" &&
    menuItemsResult.status === "fulfilled"
      ? menuItemsResult.value.rows.map((row) => ({
          id: row.id as string,
          category_id: row.category_id as string,
          name_ar: row.name_ar as string,
          name_en: row.name_en as string,
          name_fr: row.name_fr as string,
          description_ar: row.description_ar as string | null,
          description_en: row.description_en as string | null,
          description_fr: row.description_fr as string | null,
          price: row.price as number,
          display_order: row.display_order as number,
        }))
      : [];

  // Process categories
  const categories: Array<{
    id: string;
    name_ar: string;
    name_en: string;
    name_fr: string;
    icon_name: string;
    image_url: string | null;
  }> =
    categoriesResult.status === "fulfilled"
      ? categoriesResult.value.rows.map((row) => ({
          id: row.id as string,
          name_ar: row.name_ar as string,
          name_en: row.name_en as string,
          name_fr: row.name_fr as string,
          icon_name: row.icon_name as string,
          image_url: row.image_url as string | null,
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
    <MenuPageClient
      category={category}
      menuItems={menuItems}
      categories={categories}
      operatingHours={operatingHours}
      socialMedia={socialMedia}
      settings={settings}
      faqs={faqs}
    />
  );
}
