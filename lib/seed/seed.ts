// Seed script to populate database with initial data
import { getDb } from "../db/client";
import { SEED_CATEGORIES, SEED_MENU_ITEMS_ALL } from "./data";
import {
  SEED_RESTAURANT_SETTINGS,
  SEED_OPERATING_HOURS,
  SEED_SOCIAL_MEDIA,
  SEED_BRANCHES,
  SEED_FAQS,
} from "./restaurant-data";
import { runMigrations } from "../db/client";

export async function seedDatabase() {
  try {
    // Run migrations first
    await runMigrations();

    // Seed categories
    console.log("Seeding categories...");
    for (const category of SEED_CATEGORIES) {
      await getDb().execute({
        sql: `INSERT OR REPLACE INTO categories (id, name_ar, name_en, name_fr, icon_name, display_order, is_active)
              VALUES (?, ?, ?, ?, ?, ?, ?)`,
        args: [
          category.id,
          category.name_ar,
          category.name_en,
          category.name_fr,
          category.icon_name,
          category.display_order,
          1,
        ],
      });
    }

    // Seed menu items
    console.log("Seeding menu items...");
    for (const item of SEED_MENU_ITEMS_ALL) {
      const id = `item_${item.category_id}_${item.display_order}`;
      await getDb().execute({
        sql: `INSERT OR REPLACE INTO menu_items 
              (id, category_id, name_ar, name_en, name_fr, description_ar, description_en, description_fr, price, display_order, is_active)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [
          id,
          item.category_id,
          item.name_ar,
          item.name_en,
          item.name_fr,
          item.description_ar || null,
          item.description_en || null,
          item.description_fr || null,
          item.price,
          item.display_order,
          1,
        ],
      });
    }

    // Seed restaurant settings
    console.log("Seeding restaurant settings...");
    await getDb().execute({
      sql: `INSERT OR REPLACE INTO restaurant_settings 
            (id, google_map_iframe_url, phone_reservation, phone_checkout, whatsapp, email, address_ar, address_en, address_fr)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        "main",
        SEED_RESTAURANT_SETTINGS.google_map_iframe_url,
        SEED_RESTAURANT_SETTINGS.phone_reservation,
        SEED_RESTAURANT_SETTINGS.phone_checkout,
        SEED_RESTAURANT_SETTINGS.whatsapp,
        SEED_RESTAURANT_SETTINGS.email,
        SEED_RESTAURANT_SETTINGS.address_ar,
        SEED_RESTAURANT_SETTINGS.address_en,
        SEED_RESTAURANT_SETTINGS.address_fr,
      ],
    });

    // Seed operating hours
    console.log("Seeding operating hours...");
    for (const hours of SEED_OPERATING_HOURS) {
      await getDb().execute({
        sql: `INSERT OR REPLACE INTO operating_hours (day_name, open_hour, close_hour, is_closed)
              VALUES (?, ?, ?, ?)`,
        args: [
          hours.day_name,
          hours.open_hour,
          hours.close_hour,
          hours.is_closed ? 1 : 0,
        ],
      });
    }

    // Seed social media
    console.log("Seeding social media...");
    for (const social of SEED_SOCIAL_MEDIA) {
      await getDb().execute({
        sql: `INSERT OR REPLACE INTO social_media (id, platform, url)
              VALUES (?, ?, ?)`,
        args: [social.id, social.platform, social.url || null],
      });
    }

    // Seed branches
    console.log("Seeding branches...");
    for (const branch of SEED_BRANCHES) {
      await getDb().execute({
        sql: `INSERT OR REPLACE INTO branches 
              (id, name_ar, name_en, name_fr, address_ar, address_en, address_fr, phone_numbers, map_url, display_order, is_active)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [
          branch.id,
          branch.name_ar,
          branch.name_en,
          branch.name_fr,
          branch.address_ar,
          branch.address_en,
          branch.address_fr,
          JSON.stringify(branch.phone_numbers),
          branch.map_url || null,
          branch.display_order,
          1,
        ],
      });
    }

    // Seed FAQs
    console.log("Seeding FAQs...");
    for (const faq of SEED_FAQS) {
      await getDb().execute({
        sql: `INSERT OR REPLACE INTO faqs 
              (id, question_ar, question_en, question_fr, answer_ar, answer_en, answer_fr, display_order, is_active)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [
          faq.id,
          faq.question_ar,
          faq.question_en,
          faq.question_fr,
          faq.answer_ar,
          faq.answer_en,
          faq.answer_fr,
          faq.display_order,
          1,
        ],
      });
    }

    console.log("Database seeded successfully!");
  } catch (error) {
    console.error("Error seeding database:", error);
    throw error;
  }
}
