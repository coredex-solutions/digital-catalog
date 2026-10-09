import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db/client";
import { requireSuperAdmin } from "@/lib/auth/super-admin-middleware";
import { PLAN_CONFIG, isPaidPlanId, type PaidPlanId } from "@/lib/plans";
import { v4 as uuidv4 } from "uuid";

export async function GET(request: NextRequest) {
    const auth = await requireSuperAdmin(request);
    if (!auth.success) return auth.response;

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

const REQUEST_STATUSES = ['approved', 'rejected'];

export async function PATCH(request: NextRequest) {
    const auth = await requireSuperAdmin(request);
    if (!auth.success) return auth.response;

    let body: any;
    try {
        body = await request.json();
    } catch {
        return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }
    const { requestId, status, adminNotes } = body || {};

    if (!requestId || !status) {
        return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }
    if (!REQUEST_STATUSES.includes(status)) {
        return NextResponse.json({ error: "Status must be approved or rejected" }, { status: 400 });
    }
    const notes = typeof adminNotes === 'string' ? adminNotes.slice(0, 2000) : null;

    const db = getDb();
    try {
        const requestData = await db.execute({
            sql: "SELECT * FROM plan_requests WHERE id = ?",
            args: [requestId]
        });

        if (requestData.rows.length === 0) {
            return NextResponse.json({ error: "Request not found" }, { status: 404 });
        }

        const planReq = requestData.rows[0] as any;

        // A request is decided once; approving it twice would add another year
        if (planReq.status !== 'pending') {
            return NextResponse.json({ error: "This request has already been handled" }, { status: 409 });
        }

        if (status === 'rejected') {
            const result = await db.execute({
                sql: "UPDATE plan_requests SET status = 'rejected', admin_notes = ? WHERE id = ? AND status = 'pending'",
                args: [notes, requestId]
            });
            if (result.rowsAffected === 0) {
                return NextResponse.json({ error: "This request has already been handled" }, { status: 409 });
            }
            return NextResponse.json({ success: true });
        }

        if (!isPaidPlanId(planReq.plan_name)) {
            return NextResponse.json({ error: `Unknown plan "${planReq.plan_name}"` }, { status: 400 });
        }
        const plan = PLAN_CONFIG[planReq.plan_name as PaidPlanId];

        const subRes = await db.execute({
            sql: "SELECT id, expires_at FROM catalog_subscriptions WHERE catalog_id = ?",
            args: [planReq.catalog_id]
        });
        const existing = subRes.rows[0] as any;

        // Paid time is added on top of whatever is left, so renewing early loses nothing
        const now = new Date();
        const currentExpiry = existing?.expires_at ? new Date(String(existing.expires_at)) : null;
        const base = currentExpiry && !Number.isNaN(currentExpiry.getTime()) && currentExpiry > now ? currentExpiry : now;
        const expires = new Date(base);
        expires.setFullYear(expires.getFullYear() + 1);
        const expiresAt = expires.toISOString();

        const planArgs = [
            plan.id,
            expiresAt,
            plan.limits.max_items,
            plan.limits.max_categories,
            plan.limits.ai_image_enhancement_limit,
            plan.features.multi_language_enabled ? 1 : 0,
            plan.features.booking_enabled ? 1 : 0,
            plan.features.analytics_enabled ? 1 : 0,
            plan.features.custom_domain_enabled ? 1 : 0,
        ];

        const subscriptionStatement = existing
            ? {
                sql: `UPDATE catalog_subscriptions
                      SET subscription_type = ?,
                          expires_at = ?,
                          max_items = ?,
                          max_categories = ?,
                          ai_image_enhancement_limit = ?,
                          multi_language_enabled = ?,
                          booking_enabled = ?,
                          analytics_enabled = ?,
                          custom_domain_enabled = ?,
                          custom_years = NULL,
                          is_active = 1,
                          updated_at = datetime('now')
                      WHERE catalog_id = ?
                        AND EXISTS (SELECT 1 FROM plan_requests WHERE id = ? AND status = 'pending')`,
                args: [...planArgs, planReq.catalog_id, requestId]
            }
            : {
                sql: `INSERT INTO catalog_subscriptions (
                          subscription_type, expires_at, max_items, max_categories,
                          ai_image_enhancement_limit, multi_language_enabled, booking_enabled,
                          analytics_enabled, custom_domain_enabled,
                          id, catalog_id, starts_at, currency, is_active, created_at, updated_at
                      )
                      SELECT ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), 'USD', 1, datetime('now'), datetime('now')
                      WHERE EXISTS (SELECT 1 FROM plan_requests WHERE id = ? AND status = 'pending')`,
                args: [...planArgs, uuidv4(), planReq.catalog_id, requestId]
            };

        // One transaction; the subscription only changes while the request is still pending,
        // so two admins approving at once cannot add two years
        const [subscriptionResult, requestResult] = await db.batch([
            subscriptionStatement,
            {
                sql: "UPDATE plan_requests SET status = 'approved', admin_notes = ? WHERE id = ? AND status = 'pending'",
                args: [notes, requestId]
            }
        ], "write");

        if (subscriptionResult.rowsAffected === 0 || requestResult.rowsAffected === 0) {
            console.error("Plan approval affected no rows:", requestId, subscriptionResult.rowsAffected, requestResult.rowsAffected);
            return NextResponse.json({ error: "This request has already been handled" }, { status: 409 });
        }

        return NextResponse.json({ success: true, expires_at: expiresAt });
    } catch (error) {
        console.error("Patch Error:", error);
        return NextResponse.json({ error: "Failed to update request" }, { status: 500 });
    }
}
