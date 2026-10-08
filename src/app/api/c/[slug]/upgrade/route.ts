import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db/client";
import { requireCatalogAdmin } from "@/lib/auth/catalog-admin-middleware";
import { getCatalogBySlug } from "@/lib/catalog/queries";
import { v4 as uuidv4 } from "uuid";

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ slug: string }> }
) {
    const { slug } = await params;
    const catalog = await getCatalogBySlug(slug);
    if (!catalog) return NextResponse.json({ error: "Catalog not found" }, { status: 404 });

    const auth = await requireCatalogAdmin(request, catalog.id);
    if (!auth.success) return auth.response;

    const body = await request.json();
    const { planName } = body;

    if (!planName) return NextResponse.json({ error: "Missing plan name" }, { status: 400 });

    const db = getDb();
    try {
        // Check if there's already a pending request for this catalog
        const existing = await db.execute({
            sql: "SELECT id FROM plan_requests WHERE catalog_id = ? AND status = 'pending'",
            args: [catalog.id]
        });

        if (existing.rows.length > 0) {
            return NextResponse.json({ error: "You already have a pending upgrade request." }, { status: 400 });
        }

        await db.execute({
            sql: "INSERT INTO plan_requests (id, catalog_id, plan_name, status, created_at) VALUES (?, ?, ?, 'pending', datetime('now'))",
            args: [uuidv4(), catalog.id, planName]
        });

        return NextResponse.json({ success: true, message: "Upgrade request submitted successfully." });
    } catch (error) {
        return NextResponse.json({ error: "Failed to submit request" }, { status: 500 });
    }
}

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ slug: string }> }
) {
    const { slug } = await params;
    const catalog = await getCatalogBySlug(slug);
    if (!catalog) return NextResponse.json({ error: "Catalog not found" }, { status: 404 });

    const auth = await requireCatalogAdmin(request, catalog.id);
    if (!auth.success) return auth.response;

    const db = getDb();
    try {
        const result = await db.execute({
            sql: "SELECT * FROM plan_requests WHERE catalog_id = ? ORDER BY created_at DESC",
            args: [catalog.id]
        });
        return NextResponse.json({ requests: result.rows });
    } catch (error) {
        return NextResponse.json({ error: "DB Error" }, { status: 500 });
    }
}
