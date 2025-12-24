// Script to seed the database
import "dotenv/config";
import { seedDatabase } from "../lib/seed/seed";

async function main() {
  try {
    console.log("Starting database seed...");
    await seedDatabase();
    console.log("Database seeded successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Error seeding database:", error);
    process.exit(1);
  }
}

main();
