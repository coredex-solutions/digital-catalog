import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db/client";
import { requireCatalogAdmin } from "@/lib/auth/catalog-admin-middleware";
import { getCatalogBySlug } from "@/lib/catalog/queries";
import { getPlanConfig, isPaidPlanId } from "@/lib/plans";
import { opsEmail, sendBrandedEmail } from "@/lib/email";
import { getBaseUrl } from "@/lib/utils/base-url";
import { v4 as uuidv4 } from "uuid";

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ slug: string }> }
) {
    const { slug } = await params;
    const catalog = await getCatalogBySlug(slug);
    if (!catalog) return NextResponse.json({ error: "Catalog not found" }, { status: 404 });

    // Expired catalogs must still be able to ask for a renewal
    const auth = await requireCatalogAdmin(request, catalog.id, { allowExpired: true, ownerOnly: true });
    if (!auth.success) return auth.response;

    const body = await request.json().catch(() => null);
    const planName = body?.planName;

    if (!planName) return NextResponse.json({ error: "Missing plan name" }, { status: 400 });
    // Only real paid plans can be requested; the current plan is allowed so owners can renew
    if (!isPaidPlanId(planName)) return NextResponse.json({ error: "Unknown plan" }, { status: 400 });

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

        // Tell Coredex staff straight away; the request is saved either way
        const plan = getPlanConfig(planName);
        const to = opsEmail();
        if (to) {
            await sendBrandedEmail({
                to,
                subject: `Plan request: ${catalog.name} wants ${plan?.name ?? planName}`,
                paragraphs: [
                    `${catalog.name} (${catalog.slug}) asked for the ${plan?.name ?? planName} plan${plan ? ` ($${plan.price} a year)` : ""}.`,
                    `Requested by ${auth.admin.email}.`,
                    "Contact them to arrange payment, then approve the request in the superadmin panel.",
                ],
                button: { label: "Open plan requests", url: `${getBaseUrl(request)}/superadmin/requests/` },
            }).catch((error) => console.error("Plan request email failed:", error));
        }

        return NextResponse.json({ success: true, message: "Upgrade request submitted successfully." });
    } catch {
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
    } catch {
        return NextResponse.json({ error: "DB Error" }, { status: 500 });
    }
}
