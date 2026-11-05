import { NextRequest, NextResponse, after } from "next/server";
import { getFullCatalogData } from "@/lib/catalog/queries";
import { checkRateLimit, getClientIdentifier, rateLimitResponse, RATE_LIMITS } from "@/lib/rate-limit/middleware";
import { validateOrder } from "@/lib/orders/validate";
import { buildOrderContext } from "@/lib/orders/context";
import { createOrder, findByClientKey, type SavedOrder } from "@/lib/orders/store";
import { getPriceConfig } from "@/lib/catalog/price";
import { localized } from "@/app/c/[slug]/_lib/i18n";
import { buildOrderMessage, buildReservationMessage, whatsappLink, type OrderType } from "@/app/c/[slug]/_lib/whatsapp";
import type { ModuleId } from "@/lib/modules/registry";
import { notifyNewOrder } from "@/lib/push";
import { getSiteUrl } from "@/lib/utils/base-url";

/** The customer's status page for an order (path only; null for orders saved before it existed) */
function statusPath(slug: string, order: SavedOrder): string | null {
  return order.public_token ? `/c/${slug}/order/${order.public_token}/` : null;
}

/** The WhatsApp text for a saved order, in the language the customer ordered in */
function messageFor(order: SavedOrder, businessName: string, moduleId: ModuleId, statusUrl: string | null): string {
  const lang = order.lang === "ar" ? "ar" : "en";
  if (order.kind === "booking") {
    return buildReservationMessage(
      {
        restaurantName: businessName,
        name: order.customer_name,
        phone: order.customer_phone,
        date: order.requested_for?.slice(0, 10) ?? "",
        time: order.requested_for?.slice(11, 16) ?? "",
        guests: String(order.party_size ?? ""),
        notes: order.note ?? undefined,
        orderNumber: order.number,
      },
      lang,
      moduleId
    );
  }
  return buildOrderMessage(
    order.lines.map((line) => ({
      name_en: line.name_en,
      name_ar: line.name_ar,
      price: line.price,
      currency: line.currency,
      quantity: line.quantity,
      note: line.note ?? undefined,
      variant: line.variant_id ? { name_en: line.variant_en ?? "", name_ar: line.variant_ar ?? "" } : undefined,
    })),
    {
      restaurantName: businessName,
      orderType: order.order_type as OrderType,
      table: order.table_label ?? undefined,
      address: order.address ?? undefined,
      area: order.area ?? undefined,
      name: order.customer_name,
      phone: order.customer_phone,
      notes: order.note ?? undefined,
      when: order.requested_for ?? undefined,
      orderNumber: order.number,
      deliveryFee: order.delivery_fee,
      deliveryCurrency: order.delivery_currency,
      paymentMethod: order.payment_method,
      statusUrl,
    },
    order.price_config ?? getPriceConfig(null),
    lang,
    moduleId
  );
}

/**
 * POST: a customer sends an order, a service request or a table booking from the catalog page.
 * It is saved for the owner's dashboard, and the answer carries the WhatsApp message (with the
 * order number) for the customer to send. Errors carry a `code` the page shows in its own words.
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const ip = await checkRateLimit(request, RATE_LIMITS.order, `${getClientIdentifier(request)}|${slug}`);
  if (!ip.allowed) return rateLimitResponse(RATE_LIMITS.order, ip.resetAt);

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request", code: "invalid" }, { status: 400 });
  }

  const data = await getFullCatalogData(slug);
  if (!data) return NextResponse.json({ error: "Catalog not found", code: "closed" }, { status: 404 });

  const context = buildOrderContext(data);
  const businessName = (lang: "ar" | "en") => localized(data.catalog, "name", lang) || data.catalog.name;
  const reply = (order: SavedOrder, status: number) => {
    const path = statusPath(slug, order);
    const message = messageFor(order, businessName(order.lang === "ar" ? "ar" : "en"), context.module.id, path ? `${getSiteUrl()}${path}` : null);
    const whatsapp = data.contact?.phone_whatsapp ? whatsappLink(data.contact.phone_whatsapp, message) : null;
    return NextResponse.json({ number: order.number, kind: order.kind, message, whatsapp, statusUrl: path }, { status });
  };

  // A retry of an order that was already saved (lost answer, double tap): answer with that order
  // before checking anything else, since its stock has already been taken
  const clientKey = typeof body.clientKey === "string" && /^[A-Za-z0-9_-]{8,64}$/.test(body.clientKey) ? body.clientKey : null;
  if (clientKey) {
    const existing = await findByClientKey(data.catalog.id, clientKey);
    if (existing) return reply(existing, 200);
  }

  if (data.isExpired) return NextResponse.json({ error: "This page is not taking orders", code: "closed" }, { status: 403 });

  const result = validateOrder(body, context);
  if (!result.ok) {
    const status =
      result.code === "stock_changed" || result.code === "item_unavailable" ? 409 : result.code === "closed" ? 403 : result.code === "below_minimum" ? 422 : 400;
    return NextResponse.json({ error: result.message, code: result.code, field: result.field }, { status });
  }

  // Per phone number too, so one person can't flood a business from many addresses
  const phoneKey = `${result.order.phone.replace(/\D/g, "")}|${slug}`;
  const byPhone = await checkRateLimit(request, RATE_LIMITS.orderPerPhone, phoneKey);
  if (!byPhone.allowed) return rateLimitResponse(RATE_LIMITS.orderPerPhone, byPhone.resetAt);

  const saved = await createOrder(data.catalog.id, result.order, context.priceConfig);
  if (!saved.ok) {
    return NextResponse.json({ error: "Not enough stock for an item", code: "stock_changed" }, { status: 409 });
  }
  // Notify the team's phones after answering the customer (only for a new order, not a retry)
  if (!saved.repeated) {
    const order = saved.order;
    after(() => notifyNewOrder(data.catalog.id, slug, order));
  }
  return reply(saved.order, saved.repeated ? 200 : 201);
}
