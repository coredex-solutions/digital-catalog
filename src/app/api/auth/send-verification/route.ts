import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db/client";
import { v4 as uuidv4 } from "uuid";
import { sendVerificationEmail } from "@/lib/email";

export async function POST(request: NextRequest) {
    try {
        const { email } = await request.json();
        if (!email) {
            return NextResponse.json({ error: "Email is required" }, { status: 400 });
        }

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
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

        // Store in DB
        await db.execute({
            sql: "INSERT INTO verification_codes (id, email, code, expires_at) VALUES (?, ?, ?, ?)",
            args: [uuidv4(), email, code, expiresAt.toISOString()],
        });

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
