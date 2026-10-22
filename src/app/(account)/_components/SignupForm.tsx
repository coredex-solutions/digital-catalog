"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check, Loader2, MailCheck } from "lucide-react";
import type { SiteLang } from "../../_landing/copy";
import { CATALOG_THEMES, DEFAULT_THEME_ID } from "@/config/themes";
import { getSiteUrl } from "@/lib/utils/base-url";
import { getAccountCopy } from "../_copy";
import { accountError } from "../_errors";
import { Card, ErrorNote, Field, PasswordInput, SubmitButton, inputClass } from "./fields";

type Step = "details" | "code" | "restaurant" | "colours";

const STEP_NUMBER: Record<Step, number> = { details: 1, code: 1, restaurant: 2, colours: 3 };
const BUSINESS_TYPES = ["restaurant", "cafe", "bakery", "other"] as const;
// Same rule as /api/auth/signup
const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const validSlug = (slug: string) => slug.length >= 3 && slug.length <= 50 && SLUG_REGEX.test(slug);
// A link suggestion from a Latin-script name; an Arabic name suggests nothing
const suggestSlug = (name: string) =>
  name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 50).replace(/-+$/, "");
const RESEND_SECONDS = 30;
// Signup API errors about the link send the owner back to the step where it is typed
const SLUG_ERRORS = [
  "This URL is already taken. Please choose another one.",
  "The URL must be 3-50 characters: lowercase letters, numbers and single hyphens.",
];

async function postJson(url: string, body: unknown) {
  const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, data };
}

export function SignupForm({ lang, plan }: { lang: SiteLang; plan: string }) {
  const t = getAccountCopy(lang);
  const s = t.signup;
  const router = useRouter();

  const [step, setStep] = useState<Step>("details");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  // Local development without SMTP: the code is in the server's terminal, not the inbox
  const [codeInTerminal, setCodeInTerminal] = useState(false);
  const [resendIn, setResendIn] = useState(0);
  const [resent, setResent] = useState(false);
  const [verificationToken, setVerificationToken] = useState<string | null>(null);
  const [businessType, setBusinessType] = useState<string>("restaurant");
  const [catalogName, setCatalogName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugEdited, setSlugEdited] = useState(false);
  const [slugTouched, setSlugTouched] = useState(false);
  const [themeId, setThemeId] = useState(DEFAULT_THEME_ID);
  const [done, setDone] = useState<"opening" | "signIn" | null>(null);

  useEffect(() => {
    if (resendIn <= 0) return;
    const timer = setTimeout(() => setResendIn((n) => n - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendIn]);

  const fail = (message: string) => setError(accountError(message, lang));
  const go = (next: Step) => {
    setError("");
    setStep(next);
    window.scrollTo({ top: 0 });
  };

  const sendCode = async (again = false) => {
    setError("");
    setResent(false);
    setBusy(true);
    try {
      const { ok, data } = await postJson("/api/auth/send-verification/", { email, lang });
      if (!ok) return fail(data.error || "Failed to send verification email");
      setCodeInTerminal(data.printedInTerminal === true);
      setResendIn(RESEND_SECONDS);
      setCode("");
      if (again) setResent(true);
      else go("code");
    } catch {
      fail("Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const submitDetails = (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) return setError(s.details.tooShort);
    sendCode();
  };

  const verify = async (value: string) => {
    setError("");
    setBusy(true);
    try {
      const { ok, data } = await postJson("/api/auth/verify-code/", { email, code: value });
      if (!ok) {
        setCode("");
        return fail(data.error || "Invalid or expired code");
      }
      setVerificationToken(data.verificationToken);
      go("restaurant");
    } catch {
      fail("Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const onCode = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 6);
    setCode(digits);
    if (digits.length === 6 && !busy) verify(digits);
  };

  const onCatalogName = (value: string) => {
    setCatalogName(value);
    if (!slugEdited) setSlug(suggestSlug(value));
  };

  const submitRestaurant = (e: React.FormEvent) => {
    e.preventDefault();
    setSlugTouched(true);
    if (!catalogName.trim() || !validSlug(slug)) return;
    go("colours");
  };

  const createAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const { ok, data } = await postJson("/api/auth/signup/", {
        email, password, name, catalogName: catalogName.trim(), catalogSlug: slug, businessType, themeId, plan, verificationToken,
      });
      if (!ok) {
        const message = data.error || "Internal server error during registration";
        if (SLUG_ERRORS.includes(message)) {
          go("restaurant");
          setSlugTouched(true);
        }
        return fail(message);
      }
      // Sign straight in so the owner lands in their dashboard; the sign-in page is the fallback
      const login = await postJson("/api/auth/login/", { email, password, slug: data.slug }).catch(() => null);
      const account = login?.ok ? login.data.accounts?.[0] : null;
      if (account?.token) {
        localStorage.setItem(`catalog_admin_token_${account.slug}`, account.token);
        setDone("opening");
        router.push(`/c/${account.slug}/admin/`);
      } else {
        setDone("signIn");
      }
    } catch {
      fail("Internal server error during registration");
    } finally {
      setBusy(false);
    }
  };

  if (done) {
    return (
      <Card title={s.doneTitle}>
        <div role="status" className="flex flex-col items-center gap-4 py-2 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-ui-subtle text-ui-primary">
            <Check className="h-7 w-7" aria-hidden />
          </span>
          {done === "opening" ? (
            <p className="flex items-center gap-2 text-ui-muted">
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              {s.doneBody(catalogName.trim())}
            </p>
          ) : (
            <>
              <p className="text-ui-muted">{s.doneSignIn}</p>
              <Link href={`/login/?r=${slug}`} className="flex min-h-12 w-full items-center justify-center rounded-control bg-ui-primary px-5 font-semibold text-ui-primary-fg hover:bg-ui-primary-hover">
                {s.login}
              </Link>
            </>
          )}
        </div>
      </Card>
    );
  }

  const host = getSiteUrl().replace(/^https?:\/\//, "");
  const slugInvalid = slugTouched && !validSlug(slug);
  const titles: Record<Step, string> = {
    details: s.details.title,
    code: s.code.title,
    restaurant: s.restaurant.title,
    colours: s.colours.title,
  };
  const backButton = (to: Step, label = s.back) => (
    <button
      type="button"
      onClick={() => go(to)}
      className="inline-flex min-h-11 items-center gap-2 rounded-control px-2 text-sm font-medium text-ui-muted hover:text-ui-ink"
    >
      <ArrowLeft className="h-4 w-4 rtl:-scale-x-100" aria-hidden />
      {label}
    </button>
  );

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2 text-sm">
        <span className="font-medium text-ui-muted">
          {s.stepOf(STEP_NUMBER[step])} · {s.steps[step === "details" ? 0 : step === "code" ? 1 : step === "restaurant" ? 2 : 3]}
        </span>
        <span className="rounded-full border border-ui-line bg-ui-subtle px-3 py-1 text-xs font-semibold text-ui-primary">
          {s.planBadge(plan.charAt(0).toUpperCase() + plan.slice(1))}
        </span>
      </div>
      <div aria-hidden className="mb-6 grid grid-cols-3 gap-1.5">
        {[1, 2, 3].map((n) => (
          <span key={n} className={`h-1 rounded-full ${n <= STEP_NUMBER[step] ? "bg-ui-primary" : "bg-ui-line"}`} />
        ))}
      </div>

      <Card title={titles[step]} body={step === "details" ? s.details.body : step === "colours" ? s.colours.body : undefined}>
        {step === "details" && (
          <form onSubmit={submitDetails} className="space-y-5">
            <ErrorNote message={error} />
            <Field id="name" label={s.details.name}>
              <input id="name" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" dir="auto" required className={inputClass} />
            </Field>
            <Field id="email" label={t.email}>
              <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" inputMode="email" dir="ltr" required className={inputClass} />
            </Field>
            <Field id="password" label={t.password} hint={s.details.passwordHint}>
              <PasswordInput id="password" value={password} onChange={setPassword} autoComplete="new-password" showLabel={t.show} hideLabel={t.hide} describedBy="password-hint" />
            </Field>
            <SubmitButton busy={busy} label={s.details.submit} busyLabel={s.details.busy} />
            <p className="text-sm text-ui-muted">
              {s.terms}{" "}
              <Link href="/terms/" className="font-medium text-ui-primary underline-offset-4 hover:underline">{s.termsLink}</Link>
              {s.and}
              <Link href="/privacy/" className="font-medium text-ui-primary underline-offset-4 hover:underline">{s.privacyLink}</Link>.
            </p>
          </form>
        )}

        {step === "code" && (
          <div className="space-y-5">
            {codeInTerminal ? (
              <div role="status" className="rounded-control border border-ui-line bg-ui-subtle p-4 text-sm">
                <p className="font-semibold">{s.code.noSmtpTitle}</p>
                <p className="mt-2 text-ui-muted">{s.code.noSmtpBody(email)}</p>
              </div>
            ) : (
              <div className="flex gap-3">
                <MailCheck className="mt-0.5 h-5 w-5 shrink-0 text-ui-primary" aria-hidden />
                <p className="text-ui-muted">
                  {s.code.sentTo} <span dir="ltr" className="font-semibold text-ui-ink">{email}</span>
                  <span className="mt-1 block text-sm">{s.code.spam}</span>
                </p>
              </div>
            )}
            <ErrorNote message={error} />
            <Field id="code" label={s.code.label}>
              <input
                id="code"
                value={code}
                onChange={(e) => onCode(e.target.value)}
                autoComplete="one-time-code"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                dir="ltr"
                // Read-only (not disabled) while checking, so the field keeps focus for a retry
                readOnly={busy}
                autoFocus
                className={`${inputClass} text-center font-mono text-2xl tracking-[0.5em] read-only:opacity-60`}
              />
            </Field>
            {busy && (
              <p role="status" className="flex items-center gap-2 text-sm text-ui-muted">
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                {s.code.checking}
              </p>
            )}
            {resent && !error && <p role="status" className="text-sm text-ui-success">{s.code.resent}</p>}
            <div className="flex flex-wrap items-center justify-between gap-2">
              {backButton("details", s.code.changeEmail)}
              <button
                type="button"
                onClick={() => sendCode(true)}
                disabled={busy || resendIn > 0}
                className="min-h-11 rounded-control px-2 text-sm font-medium text-ui-primary hover:underline disabled:text-ui-muted disabled:no-underline"
              >
                {resendIn > 0 ? s.code.resendIn(resendIn) : s.code.resend}
              </button>
            </div>
          </div>
        )}

        {step === "restaurant" && (
          <form onSubmit={submitRestaurant} className="space-y-5" noValidate>
            <ErrorNote message={error} />
            <Field id="business-type" label={s.restaurant.type}>
              <select id="business-type" value={businessType} onChange={(e) => setBusinessType(e.target.value)} className={inputClass}>
                {BUSINESS_TYPES.map((type) => (
                  <option key={type} value={type}>{s.restaurant.types[type]}</option>
                ))}
              </select>
            </Field>
            <Field id="catalog-name" label={s.restaurant.name}>
              <input id="catalog-name" value={catalogName} onChange={(e) => onCatalogName(e.target.value)} placeholder={s.restaurant.namePlaceholder} dir="auto" required className={inputClass} />
            </Field>
            <div className="space-y-1.5">
              <label htmlFor="slug" className="block text-sm font-medium text-ui-ink">{s.restaurant.link}</label>
              <input
                id="slug"
                value={slug}
                onChange={(e) => {
                  setSlugEdited(true);
                  setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "").slice(0, 50));
                }}
                onBlur={() => setSlugTouched(true)}
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                dir="ltr"
                required
                aria-invalid={slugInvalid}
                aria-describedby="slug-hint"
                className={`${inputClass} font-mono ${slugInvalid ? "border-ui-danger" : ""}`}
              />
              <p id="slug-hint" className="text-sm text-ui-muted">
                {slugInvalid ? <span className="text-ui-danger">{s.restaurant.linkInvalid}</span> : s.restaurant.linkHint}{" "}
                <span dir="ltr" className="inline-block break-all font-mono text-ui-ink">{host}/c/{slug || "…"}</span>
              </p>
            </div>
            <button
              type="submit"
              disabled={!catalogName.trim() || !slug}
              className="flex min-h-12 w-full items-center justify-center rounded-control bg-ui-primary px-5 font-semibold text-ui-primary-fg transition-colors hover:bg-ui-primary-hover disabled:opacity-60"
            >
              {s.restaurant.continue}
            </button>
          </form>
        )}

        {step === "colours" && (
          <form onSubmit={createAccount} className="space-y-5">
            <ErrorNote message={error} />
            <fieldset>
              <legend className="sr-only">{s.colours.title}</legend>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {CATALOG_THEMES.map((theme) => {
                  const [label, description] = s.themes[theme.id] ?? [theme.name, theme.description];
                  const selected = themeId === theme.id;
                  return (
                    <label
                      key={theme.id}
                      className={`flex cursor-pointer items-start gap-3 rounded-control border p-3 transition-colors focus-within:ring-2 focus-within:ring-ui-focus ${selected ? "border-ui-primary bg-ui-subtle" : "border-ui-line hover:border-ui-input"}`}
                    >
                      <input type="radio" name="theme" value={theme.id} checked={selected} onChange={() => setThemeId(theme.id)} className="sr-only" />
                      <span aria-hidden className="mt-0.5 flex shrink-0 -space-x-1.5 rtl:space-x-reverse">
                        <span className="h-6 w-6 rounded-full border border-ui-line" style={{ backgroundColor: theme.light.primary }} />
                        <span className="h-6 w-6 rounded-full border border-ui-line" style={{ backgroundColor: theme.light.background }} />
                        <span className="h-6 w-6 rounded-full border border-ui-line" style={{ backgroundColor: theme.dark.background }} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-semibold">{label}</span>
                        <span className="block text-sm text-ui-muted">{description}</span>
                      </span>
                      {selected && <Check className="h-5 w-5 shrink-0 text-ui-primary" aria-hidden />}
                    </label>
                  );
                })}
              </div>
            </fieldset>
            <SubmitButton busy={busy} label={s.colours.submit} busyLabel={s.colours.busy} />
            {backButton("restaurant")}
          </form>
        )}
      </Card>

      <p className="mt-6 text-center text-sm text-ui-muted">
        {s.haveAccount}{" "}
        <Link href="/login/" className="font-semibold text-ui-primary underline-offset-4 hover:underline">
          {s.login}
        </Link>
      </p>
    </>
  );
}
