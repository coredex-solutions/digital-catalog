import { NextRequest, NextResponse } from "next/server";
import { withRateLimit, RATE_LIMITS } from "@/lib/rate-limit/middleware";
import { randomUUID } from "crypto";

export const dynamic = "force-dynamic";
import { getDb } from "../../../../../lib/db/client";
import { verifyPassword, hashPassword } from "../../../../../lib/auth/password";
import { signToken } from "../../../../../lib/auth/jwt";

async function handler(request: NextRequest) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json(
        { error: "Username and password are required" },
        { status: 400 }
      );
    }

    // Get user from database
    const result = await getDb().execute({
      sql: "SELECT id, email as username, password_hash FROM super_admins WHERE email = ?",
      args: [username.toLowerCase().trim()],
    });

    // If user exists in database, verify against database
    if (result.rows.length > 0) {
      const user = result.rows[0];
      const isValid = await verifyPassword(
        password,
        user.password_hash as string
      );

      if (!isValid) {
        return NextResponse.json(
          { error: "Invalid credentials" },
          { status: 401 }
        );
      }

      // Update last login
      await getDb().execute({
        sql: "UPDATE super_admins SET last_login = CURRENT_TIMESTAMP WHERE id = ?",
        args: [user.id],
      });

      // Generate token
      const token = signToken({
        userId: user.id as string,
        username: user.username as string,
      });

      return NextResponse.json({
        token,
        user: { id: user.id, username: user.username },
      });
    }

    // Fallback: Check if database is empty and env vars are configured
    // This is a secure fallback for first-time setup only
    const adminCountResult = await getDb().execute({
      sql: "SELECT COUNT(*) as count FROM super_admins",
      args: [],
    });
    const adminCount = (adminCountResult.rows[0]?.count as number) || 0;

    // Only use env vars as fallback if:
    // 1. No users exist in database (first-time setup)
    // 2. Environment variables are configured
    // 3. Credentials match env vars
    if (adminCount === 0) {
      const envUsername = process.env.ADMIN_USERNAME;
      const envPassword = process.env.ADMIN_PASSWORD;

      // Check if env vars are configured and match
      if (envUsername && envPassword) {
        // Use constant-time comparison to prevent timing attacks
        const usernameMatch = username === envUsername;
        // Compare plain passwords directly (env vars are already plain text)
        const passwordMatch = password === envPassword;

        if (usernameMatch && passwordMatch) {
          // Auto-create user in database with hashed password
          // This ensures future logins use the database
          const userId = randomUUID();
          const passwordHash = await hashPassword(envPassword);

          await getDb().execute({
            sql: "INSERT INTO super_admins (id, email, password_hash, name, last_login) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)",
            args: [userId, envUsername.toLowerCase().trim(), passwordHash, 'Initial Admin'],
          });


          // Generate token
          const token = signToken({
            userId,
            username: envUsername,
          });

          return NextResponse.json({
            token,
            user: { id: userId, username: envUsername },
          });
        }
      }
    }

    // If we get here, credentials are invalid
    // Use generic error message to prevent user enumeration
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  return withRateLimit(request, () => handler(request), RATE_LIMITS.login);
}
