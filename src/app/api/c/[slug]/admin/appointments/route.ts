import { NextRequest, NextResponse } from "next/server";
import { requireCatalogAdmin } from "@/lib/auth/catalog-admin-middleware";
import { getCatalogBySlug, getCatalogOperatingHours, getCatalogSettings } from "@/lib/catalog/queries";
import { getDb } from "@/lib/db/client";
import { getPriceConfig } from "@/lib/catalog/price";
import { getModule } from "@/lib/modules/resolve";
import { appointmentsOn, createOrder, type SavedOrder } from "@/lib/orders/store";
import { beirutToday, totalInUsd, type OrderLineSnapshot, type ValidOrder } from "@/lib/orders/validate";
import { openingFor, parseBookingConfig, requestMinutes, staffChoices, usesStaff } from "@/lib/orders/slots";
import { toPick, worksOn } from "@/lib/orders/staff";
import { repeatDates } from "@/lib/orders/appointments";
import { upcomingWaitlists, waitlistFor } from "@/lib/orders/waitlist";

const DATE = /^\d{4}-\d{2}-\d{2}$/;
const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;
const MAX_SERVICES = 10;

function isRealDate(value: unknown): value is string {
  if (typeof value !== "string" || !DATE.test(value)) return false;
  const d = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === value;
}

async function loadCatalog(request: NextRequest, slug: string, write: boolean) {
  const catalog = await getCatalogBySlug(slug);
  if (!catalog) return { error: NextResponse.json({ error: "Catalog not found" }, { status: 404 }) };
  const auth = await requireCatalogAdmin(request, catalog.id, { allowExpired: !write, allowViewer: !write });
  if (!auth.success) return { error: auth.response };
  const def = getModule(catalog);
  if (def.schedule !== "required" || def.nights) {
    return { error: NextResponse.json({ error: "Only businesses that take appointments have this calendar" }, { status: 400 }) };
  }
  return { catalog };
}

const num = (value: unknown) => (value == null ? null : Number(value));

/** The services (the draft list, so new ones can be booked before publishing) */
async function loadServices(catalogId: string) {
  const result = await getDb().execute({
    sql: `SELECT id, name_en, name_ar, price, currency, duration_minutes
          FROM menu_items WHERE catalog_id = ? AND COALESCE(is_active, 1) = 1 ORDER BY display_order ASC, id ASC`,
    args: [catalogId],
  });
  return result.rows.map((row) => ({
    id: String(row.id),
    name_en: String(row.name_en ?? ""),
    name_ar: String(row.name_ar ?? ""),
    price: Number(row.price) || 0,
    currency: String(row.currency || "USD").toUpperCase(),
    duration_minutes: num(row.duration_minutes),
  }));
}

/** An appointment as the calendar shows it */
function toAppointment(order: SavedOrder & { source?: string }, fallbackMinutes: number) {
  return {
    id: order.id,
    number: order.number,
    status: order.status,
    name: order.customer_name,
    phone: order.customer_phone,
    date: order.requested_for?.slice(0, 10) ?? "",
    time: order.requested_for?.slice(11, 16) ?? "",
    minutes: order.duration_minutes ?? fallbackMinutes,
    staff_id: order.staff_id,
    staff_name: order.staff_name,
    services: order.lines.map((line) => ({ name_en: line.name_en, name_ar: line.name_ar, quantity: line.quantity })),
    note: order.note,
    lang: order.lang === "ar" ? "ar" : "en",
    source: order.source ?? "admin",
    paid: order.paid_at !== null,
    reminded_at: order.reminded_at,
  };
}

/**
 * GET ?date=YYYY-MM-DD: the day's appointments (not cancelled), the staff, the opening hours that
 * day, the services, the day's waiting list and the days ahead with people waiting, for the
 * calendar. Viewers can read it.
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const loaded = await loadCatalog(request, slug, false);
  if ("error" in loaded) return loaded.error;
  const catalogId = loaded.catalog.id;
  const search = new URL(request.url).searchParams;
  const today = beirutToday();
  const date = isRealDate(search.get("date")) ? search.get("date")! : today;

  const [settings, hours, services, orders, waitlist, waitlistDays] = await Promise.all([
    getCatalogSettings(catalogId),
    getCatalogOperatingHours(catalogId),
    loadServices(catalogId),
    appointmentsOn(catalogId, date),
    waitlistFor(catalogId, date),
    upcomingWaitlists(catalogId, today),
  ]);
  const booking = parseBookingConfig((settings as unknown as Record<string, unknown> | null)?.booking_config);
  const appointments = orders.map((order) => toAppointment(order, booking.default_minutes));
  const opening = openingFor(
    hours.map((h) => ({ day_name: h.day_name, open_hour: Number(h.open_hour), close_hour: Number(h.close_hour), is_closed: Number(h.is_closed) })),
    date
  );

  return NextResponse.json({
    date,
    today,
    opening: opening ?? null,
    hasHours: opening !== undefined,
    blocked: booking.blocked_dates.includes(date),
    slotMinutes: booking.enabled ? booking.slot_minutes : 30,
    defaultMinutes: booking.default_minutes,
    staff: booking.staff.map((person) => ({ ...person, works: worksOn(person, date) })),
    services,
    appointments,
    waitlist,
    waitlistDays,
  });
}

/**
 * POST { itemIds, staffId?, date, time, name, phone?, note?, repeat?: { weeks, count }, lang? }:
 * appointments the team took by phone or at the desk, saved confirmed. The same "still free"
 * check as the page's bookings stops two appointments with one person (or more than the business
 * takes at once) at the same time. A repeat booking skips the dates that are taken and says which.
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

  const date = body.date;
  const time = typeof body.time === "string" ? body.time.slice(0, 5) : "";
  if (!isRealDate(date) || !TIME.test(time)) return NextResponse.json({ error: "Choose a date and time", field: "when" }, { status: 400 });
  if (date < beirutToday()) return NextResponse.json({ error: "Choose a day from today on", field: "when" }, { status: 400 });
  const name = typeof body.name === "string" ? body.name.trim().replace(/\s+/g, " ").slice(0, 80) : "";
  if (!name) return NextResponse.json({ error: "Name is required", field: "name" }, { status: 400 });
  const phone = typeof body.phone === "string" ? body.phone.trim().slice(0, 20) : "";
  const note = typeof body.note === "string" ? body.note.trim().slice(0, 300) || null : null;
  const lang = body.lang === "ar" ? "ar" : "en";

  const services = await loadServices(catalogId);
  const byId = new Map(services.map((service) => [service.id, service]));
  const itemIds = Array.isArray(body.itemIds) ? [...new Set(body.itemIds.filter((id): id is string => typeof id === "string" && byId.has(id)))].slice(0, MAX_SERVICES) : [];
  if (itemIds.length === 0) return NextResponse.json({ error: "Choose at least one service", field: "services" }, { status: 400 });

  const settings = (await getCatalogSettings(catalogId)) as unknown as Record<string, unknown> | null;
  const priceConfig = getPriceConfig(settings as Parameters<typeof getPriceConfig>[0]);
  const booking = parseBookingConfig(settings?.booking_config);

  const lines: OrderLineSnapshot[] = itemIds.map((id) => {
    const service = byId.get(id)!;
    return {
      item_id: id,
      name_en: service.name_en,
      name_ar: service.name_ar,
      variant_id: null,
      variant_en: null,
      variant_ar: null,
      price: service.price,
      currency: service.currency,
      quantity: 1,
      note: null,
      reserved: 0,
    };
  });
  const minutes = requestMinutes(itemIds.map((id) => ({ duration_minutes: byId.get(id)!.duration_minutes, quantity: 1 })), booking);

  // By person: the one asked for, or anyone who does all these services (those working that day first)
  let staffPool: ReturnType<typeof staffChoices> | null = null;
  if (usesStaff(booking)) {
    const asked = typeof body.staffId === "string" && body.staffId ? body.staffId : "any";
    staffPool = staffChoices(booking, itemIds, asked);
    if (staffPool.length === 0) {
      return NextResponse.json(
        { error: asked === "any" ? "No one on your staff does all of these services" : "This person doesn't do all of these services", field: "staff" },
        { status: 400 }
      );
    }
  }

  const repeat = body.repeat && typeof body.repeat === "object" ? (body.repeat as Record<string, unknown>) : null;
  const dates = repeat ? repeatDates(date, Number(repeat.weeks), Number(repeat.count)) : [date];

  const saved: SavedOrder[] = [];
  const skipped: string[] = [];
  for (const day of dates) {
    const people = staffPool ? [...staffPool].sort((a, b) => Number(worksOn(b, day)) - Number(worksOn(a, day))) : null;
    const order: ValidOrder = {
      kind: "request",
      orderType: "at_location",
      name,
      phone,
      table: null,
      address: null,
      area: null,
      requestedFor: `${day} ${time}`,
      partySize: null,
      note,
      lang,
      lines,
      deliveryFee: null,
      deliveryCurrency: null,
      paymentMethod: null,
      totalUsd: totalInUsd(lines, priceConfig),
      durationMinutes: minutes,
      // Without set times or staff, the team's own bookings aren't limited
      capacity: people ? 1 : booking.enabled ? booking.capacity : null,
      discount: null,
      discountCurrency: null,
      couponId: null,
      couponCode: null,
      clientKey: null,
      checkOut: null,
      units: null,
      staff: people ? people.map(toPick) : null,
    };
    const result = await createOrder(catalogId, order, priceConfig, "admin", "confirmed");
    if (result.ok) saved.push(result.order);
    else skipped.push(day);
  }

  if (saved.length === 0) {
    return NextResponse.json(
      { error: staffPool ? "This person is already booked at that time" : "This time is already fully booked", code: "slot_taken", field: "when", skipped },
      { status: 409 }
    );
  }
  return NextResponse.json({ orders: saved.map((order) => toAppointment(order, booking.default_minutes)), skipped }, { status: 201 });
}

/** PATCH { id, reminded }: mark that the team sent (or didn't send) the customer a reminder */
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const loaded = await loadCatalog(request, slug, true);
  if ("error" in loaded) return loaded.error;

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  if (typeof body.id !== "string") return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  const result = await getDb().execute({
    sql: `UPDATE orders SET reminded_at = ${body.reminded === false ? "NULL" : "COALESCE(reminded_at, datetime('now'))"}, updated_at = datetime('now')
          WHERE id = ? AND catalog_id = ? AND kind = 'request' RETURNING reminded_at`,
    args: [body.id, loaded.catalog.id],
  });
  if (result.rows.length === 0) return NextResponse.json({ error: "Order not found" }, { status: 404 });
  return NextResponse.json({ reminded_at: result.rows[0].reminded_at == null ? null : String(result.rows[0].reminded_at) });
}
