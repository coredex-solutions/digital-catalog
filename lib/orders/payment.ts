// How customers can pay, set by the owner in Settings (catalog_settings.payment_config). No money
// moves through Coredex: the customer pays cash or card when they receive the order, or sends the
// amount by Whish or OMT, and the team marks the order paid. Pure, used by the page and the server.

export const PAYMENT_METHODS = ["cash", "card", "whish", "omt"] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export interface PaymentConfig {
  /** In the order the customer sees them; never empty */
  methods: PaymentMethod[];
  /** Whish number the customer sends money to (needed for whish) */
  whish_phone: string;
  /** Name and number to send an OMT transfer to (the number is needed for omt) */
  omt_name: string;
  omt_phone: string;
}

export const DEFAULT_PAYMENT: PaymentConfig = { methods: ["cash"], whish_phone: "", omt_name: "", omt_phone: "" };

const phone = (value: unknown) => (typeof value === "string" ? value.replace(/[^\d+ ]/g, "").trim().slice(0, 20) : "");
const hasDigits = (value: string) => value.replace(/\D/g, "").length >= 7;

/** Read (or clean, from the settings form) a payment config. Whish and OMT need a number. */
export function parsePaymentConfig(raw: unknown): PaymentConfig {
  let value = raw;
  if (typeof value === "string") {
    try {
      value = JSON.parse(value);
    } catch {
      return DEFAULT_PAYMENT;
    }
  }
  if (!value || typeof value !== "object") return DEFAULT_PAYMENT;
  const input = value as Record<string, unknown>;
  const whish_phone = phone(input.whish_phone);
  const omt_phone = phone(input.omt_phone);
  const omt_name = typeof input.omt_name === "string" ? input.omt_name.trim().replace(/\s+/g, " ").slice(0, 60) : "";
  const wanted = Array.isArray(input.methods) ? input.methods : [];
  const methods = PAYMENT_METHODS.filter(
    (method) =>
      wanted.includes(method) &&
      (method !== "whish" || hasDigits(whish_phone)) &&
      (method !== "omt" || hasDigits(omt_phone))
  );
  return { methods: methods.length > 0 ? methods : ["cash"], whish_phone, omt_name, omt_phone };
}

/** Whish and OMT are paid by the customer before or on delivery, so the team checks the transfer */
export const isTransfer = (method: string | null | undefined) => method === "whish" || method === "omt";

/** Order types where the customer pays at the table, so no payment choice is asked */
export const PAY_AT_TABLE = ["dine_in"];
