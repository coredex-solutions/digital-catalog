"use client";

import { useState } from "react";
import { Eye, EyeOff, Loader2 } from "lucide-react";

export const inputClass =
  "block min-h-12 w-full rounded-control border border-ui-input bg-ui-surface px-4 text-base text-ui-ink placeholder:text-ui-muted focus:border-ui-primary";

export function Card({ title, body, children }: { title: string; body?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="rounded-panel border border-ui-line bg-ui-surface p-6 shadow-[0_24px_48px_-32px_rgba(23,21,46,0.35)] sm:p-8">
      <h1 className="text-2xl font-semibold">{title}</h1>
      {body && <p className="mt-2 text-ui-muted">{body}</p>}
      <div className="mt-6">{children}</div>
    </section>
  );
}

export function Field({ id, label, hint, children }: { id: string; label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-medium text-ui-ink">
        {label}
      </label>
      {children}
      {hint && (
        <p id={`${id}-hint`} className="text-sm text-ui-muted">
          {hint}
        </p>
      )}
    </div>
  );
}

export function PasswordInput({
  id,
  value,
  onChange,
  autoComplete,
  showLabel,
  hideLabel,
  describedBy,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete: "current-password" | "new-password";
  showLabel: string;
  hideLabel: string;
  describedBy?: string;
}) {
  const [visible, setVisible] = useState(false);
  // Passwords are typed left to right in both languages, so the field and its button are too
  return (
    <div className="relative" dir="ltr">
      <input
        id={id}
        type={visible ? "text" : "password"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete={autoComplete}
        aria-describedby={describedBy}
        required
        className={`${inputClass} pe-12`}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? hideLabel : showLabel}
        aria-pressed={visible}
        className="absolute inset-y-0 end-0 flex w-12 items-center justify-center rounded-control text-ui-muted hover:text-ui-ink"
      >
        {visible ? <EyeOff className="h-5 w-5" aria-hidden /> : <Eye className="h-5 w-5" aria-hidden />}
      </button>
    </div>
  );
}

export function SubmitButton({ busy, label, busyLabel }: { busy: boolean; label: string; busyLabel: string }) {
  return (
    <button
      type="submit"
      disabled={busy}
      className="flex min-h-12 w-full items-center justify-center gap-2 rounded-control bg-ui-primary px-5 font-semibold text-ui-primary-fg transition-colors hover:bg-ui-primary-hover disabled:opacity-60"
    >
      {busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
      {busy ? busyLabel : label}
    </button>
  );
}

export function ErrorNote({ message }: { message: string }) {
  if (!message) return null;
  return (
    <p role="alert" className="rounded-control border border-[#F3C7C7] bg-[#FEF2F2] px-4 py-3 text-sm font-medium text-ui-danger">
      {message}
    </p>
  );
}
