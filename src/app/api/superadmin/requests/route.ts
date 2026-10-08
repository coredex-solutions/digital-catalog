import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db/client";
import { jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "default_secret_key_change_me");

async function verifySuperAdmin(request: NextRequest) {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) return null;
    const token = authHeader.split(" ")[1];
    try {
        const { payload } = await jwtVerify(token, JWT_SECRET);
        if (payload.type !== "super_admin") return null;
        return payload;
    } catch {
        return null;
    }
}

export async function GET(request: NextRequest) {
    const admin = await verifySuperAdmin(request);
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const db = getDb();
    try {
        const result = await db.execute(`
            SELECT 
                r.*, 
                c.name as catalog_name, 
                c.slug as catalog_slug 
            FROM plan_requests r
            JOIN catalogs c ON r.catalog_id = c.id
            ORDER BY r.created_at DESC
        `);
        return NextResponse.json({ requests: result.rows });
    } catch (error) {
        return NextResponse.json({ error: "DB Error" }, { status: 500 });
    }
}

export async function PATCH(request: NextRequest) {
    const admin = await verifySuperAdmin(request);
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { requestId, status, adminNotes } = body;

    if (!requestId || !status) {
        return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const db = getDb();
    try {
        // Start a transaction to update status and if approved, update the subscription
        const requestData = await db.execute({
            sql: "SELECT * FROM plan_requests WHERE id = ?",
            args: [requestId]
        });

        if (requestData.rows.length === 0) {
            return NextResponse.json({ error: "Request not found" }, { status: 404 });
        }

        const planReq = requestData.rows[0] as any;

        if (status === 'approved') {
            // Update the subscription limits based on the plan
            let maxItems = 200;
            let maxCategories = 20;
            let aiLimit = 5;
            let multiLang = 0;

            if (planReq.plan_name === 'pro') {
                maxItems = 1000;
                maxCategories = 50;
                aiLimit = 20;
                multiLang = 1;
            } else if (planReq.plan_name === 'enterprise') {
                maxItems = 10000;
                maxCategories = 200;
                aiLimit = 100;
                multiLang = 1;
            }

            await db.batch([
                {
                    sql: "UPDATE plan_requests SET status = ?, admin_notes = ? WHERE id = ?",
                    args: [status, adminNotes, requestId]
                },
                {
                    sql: `UPDATE catalog_subscriptions 
                          SET subscription_type = ?, 
                              max_items = ?, 
                              max_categories = ?, 
                              ai_image_enhancement_limit = ?,
                              multi_language_enabled = ?,
                              expires_at = datetime('now', '+1 year'),
                              updated_at = datetime('now')
                          WHERE catalog_id = ?`,
                    args: [planReq.plan_name, maxItems, maxCategories, aiLimit, multiLang, planReq.catalog_id]
                }
            ]);
        } else {
            await db.execute({
                sql: "UPDATE plan_requests SET status = ?, admin_notes = ? WHERE id = ?",
                args: [status, adminNotes, requestId]
            });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Patch Error:", error);
        return NextResponse.json({ error: "Failed to update request" }, { status: 500 });
    }
}
