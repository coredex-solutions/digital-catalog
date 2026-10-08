import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db/client";
import { v4 as uuidv4 } from "uuid";
import { randomInt } from "crypto";
import { sendVerificationEmail } from "@/lib/email";
import { checkRateLimit, rateLimitResponse, RATE_LIMITS } from "@/lib/rate-limit/middleware";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Per-address cap so one inbox can't be flooded from many IPs
const PER_EMAIL_LIMIT = { windowMs: 60 * 60 * 1000, maxRequests: 3, keyPrefix: "send-verification:email" };

export async function POST(request: NextRequest) {
    try {
        const ipLimit = await checkRateLimit(request, RATE_LIMITS.sendCode);
        if (!ipLimit.allowed) return rateLimitResponse(RATE_LIMITS.sendCode, ipLimit.resetAt);

        const body = await request.json();
        const email = typeof body.email === "string" ? body.email.toLowerCase().trim() : "";
        if (!email || !EMAIL_REGEX.test(email)) {
            return NextResponse.json({ error: "A valid email is required" }, { status: 400 });
        }

        const emailLimit = await checkRateLimit(request, PER_EMAIL_LIMIT, email);
        if (!emailLimit.allowed) return rateLimitResponse(PER_EMAIL_LIMIT, emailLimit.resetAt);

        const db = getDb();

        // Ensure table exists (piggyback on first call)
        await db.execute(`
            CREATE TABLE IF NOT EXISTS verification_codes (
                id TEXT PRIMARY KEY,
                email TEXT NOT NULL,
                code TEXT NOT NULL,
                expires_at DATETIME NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Generate 6 digit code
        const code = randomInt(100000, 1000000).toString();

        // Only the newest code is valid; stored in SQLite datetime format so the
        // expires_at > datetime('now') check in verify-code compares correctly
        await db.batch([
            {
                sql: "DELETE FROM verification_codes WHERE email = ?",
                args: [email],
            },
            {
                sql: "INSERT INTO verification_codes (id, email, code, expires_at) VALUES (?, ?, ?, datetime('now', '+10 minutes'))",
                args: [uuidv4(), email, code],
            },
        ]);

        // Send Email
        try {
            await sendVerificationEmail(email, code);
        } catch (emailErr) {
            console.error("Email send failed:", emailErr);
            // We still proceed if SMTP is not configured but log it
            if (process.env.NODE_ENV === 'production') {
                return NextResponse.json({ error: "Failed to send verification email" }, { status: 500 });
            }
        }

        return NextResponse.json({ success: true, message: "Code sent" });

    } catch (error: any) {
        console.error("Send verification error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
