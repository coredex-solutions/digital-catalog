"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronRight, Store } from "lucide-react";
import type { SiteLang } from "../../_landing/copy";
import { getAccountCopy } from "../_copy";
import { accountError } from "../_errors";
import { Card, ErrorNote, Field, PasswordInput, SubmitButton, inputClass } from "./fields";

interface Account {
  slug: string;
  name: string;
  role: string;
  token: string;
}

const roleKey = (role: string) => (role === "editor" || role === "viewer" ? role : "owner");

/** `restaurant` limits sign-in to one restaurant (old /c/<slug>/admin/login links land here) */
export function LoginForm({ lang, restaurant }: { lang: SiteLang; restaurant?: string }) {
  const t = getAccountCopy(lang);
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [choices, setChoices] = useState<Account[] | null>(null);

  const open = (account: Account) => {
    localStorage.setItem(`catalog_admin_token_${account.slug}`, account.token);
    router.push(`/c/${account.slug}/admin/`);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const res = await fetch("/api/auth/login/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, slug: restaurant }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Sign-in failed. Please try again.");
      const accounts: Account[] = data.accounts || [];
      if (accounts.length === 1) return open(accounts[0]);
      setChoices(accounts);
      setBusy(false);
    } catch (err) {
      setError(accountError(err instanceof Error ? err.message : String(err), lang));
      setBusy(false);
    }
  };

  if (choices) {
    return (
      <Card title={t.login.choose} body={t.login.chooseBody}>
        <ul className="space-y-2">
          {choices.map((account) => (
            <li key={account.slug}>
              <button
                type="button"
                onClick={() => open(account)}
                className="flex min-h-14 w-full items-center gap-3 rounded-control border border-ui-line px-4 text-start transition-colors hover:border-ui-primary hover:bg-ui-subtle"
              >
                <Store className="h-5 w-5 shrink-0 text-ui-primary" aria-hidden />
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-semibold">{account.name}</span>
                  <span className="block text-sm text-ui-muted">{t.login.roles[roleKey(account.role)]}</span>
                </span>
                <ChevronRight className="h-5 w-5 text-ui-muted rtl:-scale-x-100" aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      </Card>
    );
  }

  return (
    <>
      <Card title={t.login.title} body={restaurant ? t.login.restaurantFor(restaurant) : t.login.body}>
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
          <Field id="password" label={t.password}>
            <PasswordInput id="password" value={password} onChange={setPassword} autoComplete="current-password" showLabel={t.show} hideLabel={t.hide} />
          </Field>
          <div className="text-end">
            <Link href="/forgot-password/" className="text-sm font-medium text-ui-primary underline-offset-4 hover:underline">
              {t.login.forgot}
            </Link>
          </div>
          <SubmitButton busy={busy} label={t.login.submit} busyLabel={t.login.busy} />
        </form>
      </Card>
      <p className="mt-6 text-center text-sm text-ui-muted">
        {t.login.noAccount}{" "}
        <Link href="/signup/" className="font-semibold text-ui-primary underline-offset-4 hover:underline">
          {t.login.signup}
        </Link>
      </p>
    </>
  );
}
