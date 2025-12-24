/**
 * Create a super admin account for the SaaS platform
 * 
 * Run with: npx tsx scripts/create-superadmin.ts
 * 
 * Environment variables or prompts will be used for credentials
 */

import { config } from "dotenv";
config(); // Load .env file

import { getDb } from "../lib/db/client";
import { hashPassword } from "../lib/auth/password";
import { v4 as uuidv4 } from "uuid";
import * as readline from "readline";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function prompt(question: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer.trim());
    });
  });
}

async function createSuperAdmin() {
  console.log("🔐 Create Super Admin Account\n");
  console.log("This account will have full access to manage all catalogs.\n");

  // Get credentials from env or prompt
  let email = process.env.SUPERADMIN_EMAIL;
  let password = process.env.SUPERADMIN_PASSWORD;
  let name = process.env.SUPERADMIN_NAME;

  if (!email) {
    email = await prompt("Email: ");
  } else {
    console.log(`Email: ${email}`);
  }

  if (!password) {
    password = await prompt("Password (min 8 chars): ");
  } else {
    console.log("Password: ********");
  }

  if (!name) {
    name = await prompt("Name: ");
  } else {
    console.log(`Name: ${name}`);
  }

  // Validate
  if (!email || !email.includes("@")) {
    console.error("\n❌ Invalid email address");
    rl.close();
    process.exit(1);
  }

  if (!password || password.length < 8) {
    console.error("\n❌ Password must be at least 8 characters");
    rl.close();
    process.exit(1);
  }

  if (!name || name.length < 2) {
    console.error("\n❌ Name is required");
    rl.close();
    process.exit(1);
  }

  console.log("\n⏳ Creating super admin...");

  const db = getDb();
  const id = uuidv4();
  const password_hash = await hashPassword(password);

  try {
    // Check if email already exists
    const existing = await db.execute({
      sql: "SELECT id FROM super_admins WHERE email = ?",
      args: [email],
    });

    if (existing.rows.length > 0) {
      console.error("\n❌ A super admin with this email already exists");
      rl.close();
      process.exit(1);
    }

    // Create the super admin
    await db.execute({
      sql: `
        INSERT INTO super_admins (id, email, password_hash, name, is_active, created_at)
        VALUES (?, ?, ?, ?, 1, datetime('now'))
      `,
      args: [id, email, password_hash, name],
    });

    console.log("\n✅ Super admin created successfully!");
    console.log(`   ID: ${id}`);
    console.log(`   Email: ${email}`);
    console.log(`   Name: ${name}`);
    console.log("\n🔗 Login at: /superadmin/login");
  } catch (error: any) {
    console.error("\n❌ Failed to create super admin:", error.message);
    rl.close();
    process.exit(1);
  }

  rl.close();
}

createSuperAdmin()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Error:", err);
    process.exit(1);
  });

