"use client";

import { useState } from "react";
import Link from "next/link";
import { MailCheck } from "lucide-react";
import type { SiteLang } from "../../_landing/copy";
import { getAccountCopy } from "../_copy";
import { Card, ErrorNote, Field, SubmitButton, inputClass } from "./fields";

export function ForgotForm({ lang }: { lang: SiteLang }) {
  const t = getAccountCopy(lang);
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [sentTo, setSentTo] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const res = await fetch("/api/auth/forgot-password/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, lang }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Something went wrong. Please try again.");
      setSentTo(email.trim());
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  };

  if (sentTo) {
    return (
      <Card title={t.forgot.sentTitle}>
        <div className="flex gap-3" role="status">
          <MailCheck className="mt-0.5 h-6 w-6 shrink-0 text-ui-primary" aria-hidden />
          <p className="text-ui-ink">{t.forgot.sentBody(sentTo)}</p>
        </div>
        <Link href="/login/" className="mt-6 inline-flex min-h-11 items-center font-semibold text-ui-primary underline-offset-4 hover:underline">
          {t.forgot.backToLogin}
        </Link>
      </Card>
    );
  }

  return (
    <Card title={t.forgot.title} body={t.forgot.body}>
      <form onSubmit={submit} className="space-y-5">
        <ErrorNote message={error} />
        <Field id="email" label={t.email}>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            inputMode="email"
            dir="ltr"
            required
            className={inputClass}
          />
        </Field>
        <SubmitButton busy={busy} label={t.forgot.submit} busyLabel={t.forgot.busy} />
        <Link href="/login/" className="inline-flex min-h-11 items-center text-sm font-medium text-ui-primary underline-offset-4 hover:underline">
          {t.forgot.backToLogin}
        </Link>
      </form>
    </Card>
  );
}
