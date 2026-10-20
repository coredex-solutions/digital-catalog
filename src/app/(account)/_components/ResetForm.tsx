"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2, Loader2 } from "lucide-react";
import type { SiteLang } from "../../_landing/copy";
import { getAccountCopy } from "../_copy";
import { Card, ErrorNote, Field, PasswordInput, SubmitButton } from "./fields";

type Status =
  | { kind: "checking" }
  | { kind: "invalid"; message: string }
  | { kind: "ready"; email: string; restaurant: string }
  | { kind: "done"; slug: string };

const INCOMPLETE_LINK: Status = { kind: "invalid", message: "This reset link is incomplete. Ask for a new one." };

export function ResetForm({ lang, token }: { lang: SiteLang; token: string }) {
  const t = getAccountCopy(lang);
  const [checked, setStatus] = useState<Status>({ kind: "checking" });
  // A link without a token can't be checked at all
  const status = token ? checked : INCOMPLETE_LINK;
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) return;
    fetch(`/api/auth/reset-password/?token=${encodeURIComponent(token)}`)
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        setStatus(res.ok ? { kind: "ready", email: data.email, restaurant: data.restaurant } : { kind: "invalid", message: data.error || "This link no longer works." });
      })
      .catch(() => setStatus({ kind: "invalid", message: "Couldn't check the link. Check your connection and reload." }));
  }, [token]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password.length < 8) return setError(t.reset.tooShort);
    if (password !== confirm) return setError(t.reset.mismatch);
    setBusy(true);
    try {
      const res = await fetch("/api/auth/reset-password/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Couldn't change the password. Please try again.");
      setStatus({ kind: "done", slug: data.slug });
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  };

  if (status.kind === "checking") {
    return (
      <Card title={t.reset.title}>
        <p className="flex items-center gap-2 text-ui-muted" role="status">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          {t.reset.checking}
        </p>
      </Card>
    );
  }

  if (status.kind === "invalid") {
    return (
      <Card title={t.reset.title}>
        <ErrorNote message={status.message} />
        <Link href="/forgot-password/" className="mt-6 inline-flex min-h-11 items-center font-semibold text-ui-primary underline-offset-4 hover:underline">
          {t.reset.newLink}
        </Link>
      </Card>
    );
  }

  if (status.kind === "done") {
    return (
      <Card title={t.reset.doneTitle}>
        <p className="flex gap-3 text-ui-ink" role="status">
          <CheckCircle2 className="mt-0.5 h-6 w-6 shrink-0 text-ui-success" aria-hidden />
          {t.reset.doneBody}
        </p>
        <Link
          href={`/login/?r=${encodeURIComponent(status.slug)}`}
          className="mt-6 flex min-h-12 w-full items-center justify-center rounded-control bg-ui-primary px-5 font-semibold text-ui-primary-fg hover:bg-ui-primary-hover"
        >
          {t.reset.signIn}
        </Link>
      </Card>
    );
  }

  return (
    <Card title={t.reset.title} body={t.reset.forAccount(status.email, status.restaurant)}>
      <form onSubmit={submit} className="space-y-5">
        <ErrorNote message={error} />
        <Field id="new-password" label={t.reset.newPassword} hint={t.reset.hint}>
          <PasswordInput id="new-password" value={password} onChange={setPassword} autoComplete="new-password" showLabel={t.show} hideLabel={t.hide} describedBy="new-password-hint" />
        </Field>
        <Field id="confirm-password" label={t.reset.confirm}>
          <PasswordInput id="confirm-password" value={confirm} onChange={setConfirm} autoComplete="new-password" showLabel={t.show} hideLabel={t.hide} />
        </Field>
        <SubmitButton busy={busy} label={t.reset.submit} busyLabel={t.reset.busy} />
      </form>
    </Card>
  );
}
