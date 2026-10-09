import { NextRequest, NextResponse } from "next/server";
import { requireCatalogAdmin } from "@/lib/auth/catalog-admin-middleware";
import { getCatalogBySlug } from "@/lib/catalog/queries";
import { getDb } from "@/lib/db/client";
import { diffMenus, getLiveMenu, getPublishedVersion } from "@/lib/catalog/publishing";

// GET: the owner's setup checklist (MENUDESIGN.md onboarding: details → currency → dishes →
// review → preview → publish → QR). Each step is worked out from the data, so progress is saved.
export async function GET(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const catalog = await getCatalogBySlug(slug);
  if (!catalog) return NextResponse.json({ error: "Catalog not found" }, { status: 404 });

  const auth = await requireCatalogAdmin(request, catalog.id, { allowExpired: true });
  if (!auth.success) return auth.response;

  const db = getDb();
  const [settingsRes, contactRes, hoursRes, live, published] = await Promise.all([
    db.execute({ sql: "SELECT currency_primary, show_dual_currency, lbp_exchange_rate, hero_image_url FROM catalog_settings WHERE catalog_id = ?", args: [catalog.id] }),
    db.execute({ sql: "SELECT phone_whatsapp FROM catalog_contact WHERE catalog_id = ?", args: [catalog.id] }),
    db.execute({ sql: "SELECT COUNT(*) AS n FROM operating_hours WHERE catalog_id = ?", args: [catalog.id] }),
    getLiveMenu(catalog.id),
    getPublishedVersion(catalog.id),
  ]);
  const settings = settingsRes.rows[0] ?? {};
  const contact = contactRes.rows[0] ?? {};

  const activeItems = live.items.filter((i) => Number(i.is_active ?? 1) === 1);
  const withoutArabic = activeItems.filter((i) => !String(i.name_ar || "").trim()).length;
  const publishedItems = published ? published.data.items.length : 0;
  const pending = published ? diffMenus(live, published.data).length : 0;
  const needsRate = Number(settings.show_dual_currency) === 1 || settings.currency_primary === "LBP";

  const steps = [
    {
      key: "details",
      title: "Add your logo and cover photo",
      hint: "Guests recognise your menu from them.",
      done: !!catalog.logo_url && !!settings.hero_image_url,
      href: `/c/${slug}/admin/settings`,
    },
    {
      key: "whatsapp",
      title: "Add your WhatsApp number",
      hint: "Orders and table bookings are sent to it.",
      done: !!String(contact.phone_whatsapp || "").trim(),
      href: `/c/${slug}/admin/settings`,
    },
    {
      key: "currency",
      title: needsRate ? "Set your exchange rate" : "Choose how prices are shown",
      hint: needsRate ? "Pound prices are worked out from the rate you enter." : "Dollars, pounds, or both.",
      done: needsRate ? Number(settings.lbp_exchange_rate) > 0 : true,
      href: `/c/${slug}/admin/settings`,
    },
    {
      key: "dishes",
      title: "Add your dishes",
      hint: activeItems.length > 0 ? `${activeItems.length} so far.` : "Start with a few; you can add more any time.",
      done: activeItems.length > 0,
      href: `/c/${slug}/admin/items`,
    },
    {
      key: "arabic",
      title: "Check the Arabic names",
      hint: withoutArabic > 0 ? `${withoutArabic} ${withoutArabic === 1 ? "dish has" : "dishes have"} no Arabic name yet.` : "Every dish has an Arabic name.",
      done: activeItems.length > 0 && withoutArabic === 0,
      href: `/c/${slug}/admin/items`,
    },
    {
      key: "hours",
      title: "Set your opening hours",
      hint: "So guests see whether you're open now.",
      done: Number(hoursRes.rows[0]?.n ?? 0) > 0,
      href: `/c/${slug}/admin/hours`,
    },
    {
      key: "publish",
      title: "Preview and publish",
      hint: pending > 0 ? `${pending} unpublished ${pending === 1 ? "change" : "changes"}.` : "Guests only see what you publish.",
      done: publishedItems > 0 && pending === 0,
      href: `/c/${slug}/admin/publish`,
    },
    {
      key: "qr",
      title: "Print your QR codes",
      hint: "Table cards with a short web address under the code.",
      // Can't be detected server-side; the dashboard marks it once the print page was opened
      done: false,
      href: `/c/${slug}/admin/qr/print`,
    },
  ];

  return NextResponse.json({ steps });
}
