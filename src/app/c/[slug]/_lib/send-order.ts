// Sending an order or booking from the page to /api/c/[slug]/orders/ (saved for the owner's
// dashboard). The answer carries the WhatsApp message with the order number.

export interface SentOrder {
  number: number;
  message: string;
  /** wa.me link, or null when the business has no WhatsApp number */
  whatsapp: string | null;
  /** The customer's order status page (path) */
  statusUrl: string | null;
  kind: "order" | "booking" | "request";
  /** The total in US dollars as the server worked it out (null when it can't be converted) */
  totalUsd: number | null;
}

export type SendResult =
  | { ok: true; order: SentOrder }
  | { ok: false; code: string; field?: string; detail?: string; limit?: number };

/** A random key for one checkout, so retrying the same order never saves it twice */
export function newClientKey(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

export async function sendOrder(slug: string, body: Record<string, unknown>): Promise<SendResult> {
  try {
    const res = await fetch(`/api/c/${slug}/orders/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok && typeof data.number === "number") {
      return {
        ok: true,
        order: {
          number: data.number,
          message: String(data.message || ""),
          whatsapp: data.whatsapp || null,
          statusUrl: typeof data.statusUrl === "string" && data.statusUrl.startsWith("/c/") ? data.statusUrl : null,
          kind: data.kind === "booking" || data.kind === "request" ? data.kind : "order",
          totalUsd: typeof data.totalUsd === "number" && Number.isFinite(data.totalUsd) ? data.totalUsd : null,
        },
      };
    }
    return { ok: false, code: typeof data.code === "string" ? data.code : res.status === 429 ? "rate_limited" : "failed", field: data.field, detail: typeof data.detail === "string" ? data.detail : undefined, limit: typeof data.limit === "number" ? data.limit : undefined };
  } catch {
    return { ok: false, code: "network" };
  }
}
