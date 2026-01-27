import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db/client";

export async function POST(request: NextRequest) {
    try {
        const { email, code } = await request.json();
        if (!email || !code) {
            return NextResponse.json({ error: "Email and code are required" }, { status: 400 });
        }

        const db = getDb();

        const result = await db.execute({
            sql: "SELECT * FROM verification_codes WHERE email = ? AND code = ? AND expires_at > datetime('now') ORDER BY created_at DESC LIMIT 1",
            args: [email, code],
        });

        if (result.rows.length === 0) {
            return NextResponse.json({ error: "Invalid or expired code" }, { status: 400 });
        }

        // Optional: Delete the code after use
        await db.execute({
            sql: "DELETE FROM verification_codes WHERE email = ?",
            args: [email],
        });

        return NextResponse.json({ success: true, message: "Email verified" });

    } catch (error: any) {
        console.error("Verify code error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
