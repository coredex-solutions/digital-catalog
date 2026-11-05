import { NextRequest, NextResponse } from "next/server";
import { requireCatalogAdmin } from "@/lib/auth/catalog-admin-middleware";
import { getCatalogBySlug, getCatalogSettings } from "@/lib/catalog/queries";
import { getDb } from "@/lib/db/client";
import { getPriceConfig } from "@/lib/catalog/price";
import { getModule } from "@/lib/modules/resolve";
import { createOrder } from "@/lib/orders/store";
import { beirutToday, totalInUsd, type ValidOrder } from "@/lib/orders/validate";
import { MAX_GUESTS, addDays, isRealDate, nightsBetween, parseStayConfig, stayLinePrice, stayNights, unitsOf, MAX_STAY_NIGHTS } from "@/lib/orders/stays";

const MAX_DAYS = 62;

async function loadCatalog(request: NextRequest, slug: string, write: boolean) {
  const catalog = await getCatalogBySlug(slug);
  if (!catalog) return { error: NextResponse.json({ error: "Catalog not found" }, { status: 404 }) };
  const auth = await requireCatalogAdmin(request, catalog.id, { allowExpired: true, allowViewer: !write });
  if (!auth.success) return { error: auth.response };
  if (!getModule(catalog).nights) return { error: NextResponse.json({ error: "Only places booked by the night have a calendar" }, { status: 400 }) };
  return { catalog };
}

const num = (value: unknown) => (value == null ? null : Number(value));

/** The rooms and chalets (the draft list, so new ones show before publishing) */
async function loadUnits(catalogId: string) {
  const result = await getDb().execute({
    sql: `SELECT id, name_en, name_ar, price, currency, weekend_price, unit_count, max_guests
          FROM menu_items WHERE catalog_id = ? AND COALESCE(is_active, 1) = 1 ORDER BY display_order ASC, id ASC`,
    args: [catalogId],
  });
  return result.rows.map((row) => ({
    id: String(row.id),
    name_en: String(row.name_en ?? ""),
    name_ar: String(row.name_ar ?? ""),
    price: Number(row.price) || 0,
    currency: String(row.currency || "USD"),
    weekend_price: num(row.weekend_price),
    unit_count: unitsOf({ unit_count: num(row.unit_count) }),
    max_guests: num(row.max_guests),
  }));
}

/**
 * GET ?from=YYYY-MM-DD&days=N: the rooms and every stay (not cancelled) that touches those
 * nights, for the calendar. Viewers can read it.
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const loaded = await loadCatalog(request, slug, false);
  if ("error" in loaded) return loaded.error;
  const search = new URL(request.url).searchParams;
  const from = isRealDate(search.get("from")) ? search.get("from")! : beirutToday();
  const days = Math.min(Math.max(Math.round(Number(search.get("days")) || 14), 1), MAX_DAYS);
  const to = addDays(from, days);

  const [units, settings, result] = await Promise.all([
    loadUnits(loaded.catalog.id),
    getCatalogSettings(loaded.catalog.id),
    getDb().execute({
      sql: `SELECT id, number, status, customer_name, customer_phone, requested_for, check_out, party_size, lines, source, paid_at
            FROM orders WHERE catalog_id = ? AND check_out IS NOT NULL AND status != 'cancelled'
              AND check_out > ? AND substr(requested_for, 1, 10) < ?
            ORDER BY requested_for ASC, number ASC LIMIT 500`,
      args: [loaded.catalog.id, from, to],
    }),
  ]);
  const stays = result.rows.map((row) => {
    let lines: { item_id: string; quantity: number }[] = [];
    try {
      lines = (JSON.parse(String(row.lines ?? "[]")) as { item_id: string; quantity: number }[]).map((l) => ({ item_id: String(l.item_id), quantity: Number(l.quantity) || 0 }));
    } catch {
      // Unreadable lines: the stay still shows, without rooms
    }
    return {
      id: String(row.id),
      number: Number(row.number),
      status: String(row.status),
      name: String(row.customer_name ?? ""),
      phone: String(row.customer_phone ?? ""),
      check_in: String(row.requested_for ?? "").slice(0, 10),
      check_out: String(row.check_out),
      guests: num(row.party_size),
      source: String(row.source ?? "page"),
      paid: row.paid_at != null,
      lines,
    };
  });
  const rules = parseStayConfig((settings as unknown as Record<string, unknown> | null)?.stay_config);
  return NextResponse.json({ from, days, today: beirutToday(), units, stays, closed: rules.blocked_dates, checkIn: rules.check_in });
}

/**
 * POST { itemId, quantity?, checkIn, checkOut, name, phone?, guests?, note? }: a stay the team
 * took by phone, at the door or on another site. It is saved confirmed, and the same "still
 * free" check as the page's bookings stops it from overlapping another stay.
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const loaded = await loadCatalog(request, slug, true);
  if ("error" in loaded) return loaded.error;
  const catalogId = loaded.catalog.id;

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const checkIn = body.checkIn;
  const checkOut = body.checkOut;
  if (!isRealDate(checkIn) || !isRealDate(checkOut) || nightsBetween(checkIn, checkOut) < 1) {
    return NextResponse.json({ error: "Choose a check-in and a check-out day", field: "dates" }, { status: 400 });
  }
  if (nightsBetween(checkIn, checkOut) > MAX_STAY_NIGHTS) {
    return NextResponse.json({ error: "A stay can't be longer than 90 nights", field: "dates" }, { status: 400 });
  }
  const name = typeof body.name === "string" ? body.name.trim().replace(/\s+/g, " ").slice(0, 80) : "";
  if (!name) return NextResponse.json({ error: "Name is required", field: "name" }, { status: 400 });
  const phone = typeof body.phone === "string" ? body.phone.trim().slice(0, 20) : "";
  const guests = body.guests === undefined || body.guests === null || body.guests === "" ? null : Math.floor(Number(body.guests));
  if (guests !== null && (!Number.isFinite(guests) || guests < 1 || guests > MAX_GUESTS)) {
    return NextResponse.json({ error: "Choose the number of guests", field: "guests" }, { status: 400 });
  }
  const note = typeof body.note === "string" ? body.note.trim().slice(0, 300) || null : null;

  const units = await loadUnits(catalogId);
  const unit = units.find((u) => u.id === body.itemId);
  if (!unit) return NextResponse.json({ error: "Choose a room", field: "itemId" }, { status: 400 });
  const quantity = Math.min(Math.max(Math.floor(Number(body.quantity) || 1), 1), unit.unit_count);

  const settings = (await getCatalogSettings(catalogId)) as unknown as Record<string, unknown> | null;
  const priceConfig = getPriceConfig(settings as Parameters<typeof getPriceConfig>[0]);
  const stay = parseStayConfig(settings?.stay_config);
  const price = stayLinePrice(unit, unit.price, stayNights(checkIn, checkOut));
  const lines = [
    {
      item_id: unit.id,
      name_en: unit.name_en,
      name_ar: unit.name_ar,
      variant_id: null,
      variant_en: null,
      variant_ar: null,
      price,
      currency: unit.currency.toUpperCase(),
      quantity,
      note: null,
      reserved: 0,
    },
  ];
  const order: ValidOrder = {
    kind: "request",
    orderType: "stay",
    name,
    phone,
    table: null,
    address: null,
    area: null,
    requestedFor: `${checkIn} ${stay.check_in}`,
    partySize: guests,
    note,
    lang: body.lang === "ar" ? "ar" : "en",
    lines,
    deliveryFee: null,
    deliveryCurrency: null,
    paymentMethod: null,
    totalUsd: totalInUsd(lines, priceConfig),
    durationMinutes: null,
    capacity: null,
    discount: null,
    discountCurrency: null,
    couponId: null,
    couponCode: null,
    clientKey: null,
    checkOut,
    units: [{ itemId: unit.id, quantity, count: unit.unit_count }],
  };

  const saved = await createOrder(catalogId, order, priceConfig, "admin", "confirmed");
  if (!saved.ok) {
    return NextResponse.json({ error: "This room is already booked on some of these nights", code: "dates_taken", field: "dates" }, { status: 409 });
  }
  return NextResponse.json({ order: saved.order }, { status: 201 });
}
