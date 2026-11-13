"use client";

// Form pieces shared by the checkout, booking and order status screens. Kept apart from the
// sheets so a page can use them without downloading a sheet (each sheet loads when it opens).
import { useId, type ReactNode } from "react";
import { CheckCircle2 } from "lucide-react";
import { formatPrice, type PriceConfig } from "@/lib/catalog/price";
import type { PaymentConfig } from "@/lib/orders/payment";
import type { BookingConfig } from "@/lib/orders/slots";
import type { Dictionary } from "../../_lib/i18n";
import { cn } from "@/utils/helpers";

export function Field({
  label,
  error,
  children,
  hint,
}: {
  label: string;
  error?: string;
  hint?: string;
  children: (props: { id: string; "aria-invalid": boolean; "aria-describedby"?: string }) => ReactNode;
}) {
  const id = useId();
  const messageId = `${id}-message`;
  return (
    <div>
      <label htmlFor={id} className="text-sm font-semibold">
        {label}
      </label>
      <div className="mt-1.5">
        {children({ id, "aria-invalid": !!error, "aria-describedby": error || hint ? messageId : undefined })}
      </div>
      {(error || hint) && (
        <p id={messageId} className={cn("mt-1 text-sm", error ? "text-menu-danger" : "text-menu-muted")}>
          {error || hint}
        </p>
      )}
    </div>
  );
}

export const inputClass =
  "w-full min-h-12 rounded-control border border-menu-input-border bg-menu-surface px-4 text-base placeholder:text-menu-muted focus:border-brand-ink focus:outline-none aria-[invalid=true]:border-menu-danger";

/** Today's date in Beirut as YYYY-MM-DD, for date pickers' minimum */
export function todayInBeirut(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Beirut" }).format(new Date());
}

/** "A deposit of $10 confirms your booking. Send the total on Whish to …", or null without a deposit */
export function depositInstructions(booking: BookingConfig, payment: PaymentConfig, priceConfig: PriceConfig, lang: "ar" | "en", t: Dictionary): string | null {
  if (!booking.deposit) return null;
  const amount = formatPrice(booking.deposit, booking.deposit_currency, priceConfig, lang).primary;
  const how = payment.whish_phone
    ? t.custDepositWhish(amount, payment.whish_phone)
    : payment.omt_phone
      ? t.custDepositOmt(amount, [payment.omt_name, payment.omt_phone].filter(Boolean).join(" · "))
      : "";
  return how || t.depositNote(amount);
}

/** Saved order shown after sending: the number, then WhatsApp (when the business has it) */
export function SavedNotice({ title, body }: { title: string; body: string }) {
  return (
    <div role="status" className="mb-3 rounded-control bg-menu-subtle px-4 py-3">
      <p className="flex items-center gap-2 font-semibold">
        <CheckCircle2 className="h-5 w-5 shrink-0 text-brand-ink" aria-hidden />
        {title}
      </p>
      <p className="mt-1 text-sm text-menu-muted">{body}</p>
    </div>
  );
}
