// How restaurants reach Coredex (marketing site, billing page). Digits only, with country code.
// Set NEXT_PUBLIC_SALES_WHATSAPP to change the number without a code edit (rebuild needed).
export const SALES_WHATSAPP = (process.env.NEXT_PUBLIC_SALES_WHATSAPP || "966540679669").replace(/\D/g, "");
export const SALES_EMAIL = "ops@coredex.solutions";

// Where owners send the plan payment, shown on the billing page once they choose a plan.
// NEXT_PUBLIC_BILLING_WHISH: the Whish number (country code + number, digits only).
// NEXT_PUBLIC_BILLING_OMT: who to send an OMT transfer to, e.g. "Bilal K. · 961 70 123 456".
// Without them the billing page says the team will contact the owner to arrange payment.
export const BILLING_WHISH = (process.env.NEXT_PUBLIC_BILLING_WHISH || "").replace(/\D/g, "");
export const BILLING_OMT = (process.env.NEXT_PUBLIC_BILLING_OMT || "").trim().slice(0, 120);
export const BILLING_TRANSFERS = Boolean(BILLING_WHISH || BILLING_OMT);
