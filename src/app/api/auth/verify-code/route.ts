import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db/client";
import { signEmailVerificationToken } from "@/lib/auth/jwt";
import { checkRateLimit, rateLimitResponse, RATE_LIMITS } from "@/lib/rate-limit/middleware";

// Per-address cap on guesses, so a code can't be brute-forced from many IPs
const PER_EMAIL_LIMIT = { ...RATE_LIMITS.verifyCode, keyPrefix: "verify-code:email" };
const PER_IP_LIMIT = { windowMs: 15 * 60 * 1000, maxRequests: 20 };

export async function POST(request: NextRequest) {
    try {
        const ipLimit = await checkRateLimit(request, PER_IP_LIMIT);
        if (!ipLimit.allowed) return rateLimitResponse(PER_IP_LIMIT, ipLimit.resetAt);

        const body = await request.json();
        const email = typeof body.email === "string" ? body.email.toLowerCase().trim() : "";
        const code = typeof body.code === "string" ? body.code.trim() : "";
        if (!email || !code) {
            return NextResponse.json({ error: "Email and code are required" }, { status: 400 });
        }

        const emailLimit = await checkRateLimit(request, PER_EMAIL_LIMIT, email);
        if (!emailLimit.allowed) return rateLimitResponse(PER_EMAIL_LIMIT, emailLimit.resetAt);

        const db = getDb();

        const result = await db.execute({
            sql: "SELECT * FROM verification_codes WHERE email = ? AND code = ? AND datetime(expires_at) > datetime('now') ORDER BY created_at DESC LIMIT 1",
            args: [email, code],
        });

        if (result.rows.length === 0) {
            return NextResponse.json({ error: "Invalid or expired code" }, { status: 400 });
        }

        // Codes are single-use
        await db.execute({
            sql: "DELETE FROM verification_codes WHERE email = ?",
            args: [email],
        });

        // Signup requires this token, so the email can't be skipped by calling signup directly
        return NextResponse.json({
            success: true,
            message: "Email verified",
            verificationToken: signEmailVerificationToken(email),
        });

    } catch (error: any) {
        console.error("Verify code error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
