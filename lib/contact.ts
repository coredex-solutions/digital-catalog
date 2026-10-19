// How restaurants reach Coredex (marketing site, billing page). Digits only, with country code.
// Set NEXT_PUBLIC_SALES_WHATSAPP to change the number without a code edit (rebuild needed).
export const SALES_WHATSAPP = (process.env.NEXT_PUBLIC_SALES_WHATSAPP || "966540679669").replace(/\D/g, "");
export const SALES_EMAIL = "ops@coredex.solutions";
