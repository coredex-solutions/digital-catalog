"use client";

import { useEffect, useRef, useState } from "react";
import { AlertTriangle, Check, ImagePlus, Loader2, RotateCcw, Wand2 } from "lucide-react";
import { formatNumber, plural, useAdminLang, useCopy } from "../../_lib/i18n";
import { translateApiMessage } from "../../_lib/api-errors";

type Kind = "enhance" | "illustrate";
type Status = "queued" | "processing" | "failed" | "ready" | "approved" | "discarded" | "reverted";

interface Job {
  id: string;
  kind: Kind;
  style: string;
  status: Status;
  sourceUrl: string | null;
  resultUrl: string | null;
  previousImageUrl: string | null;
  error: string | null;
  createdAt: string;
}

interface Credits {
  limit: number;
  used: number;
  remaining: number;
}

interface Props {
  slug: string;
  fetchWithAuth: (url: string, options?: RequestInit) => Promise<Response>;
  /** The saved dish (AI works on what is saved, not on unsaved edits) */
  itemId: string | null;
  savedImageUrl: string | null;
  /** The photo currently in the form, which may not be saved yet */
  formImageUrl: string;
  readOnly: boolean;
  /** The dish's photo changed on the server (approved or switched back) */
  onImageChange: (url: string, illustrative: boolean) => void;
}

const KINDS: Kind[] = ["enhance", "illustrate"];

const en = {
  kinds: {
    enhance: {
      title: "Improve my photo",
      body: "Better light and background. The food stays exactly as in your photo.",
    },
    illustrate: {
      title: "Create an illustrative image",
      body: "Made from the dish's name and description. Guests see it labelled “Illustrative image”.",
    },
  } as Record<Kind, { title: string; body: string }>,
  /** Labels for the API's style ids; an unknown id shows the API's own label */
  styles: {
    natural: "Natural daylight",
    bright: "Clean and bright",
    warm: "Warm restaurant",
  } as Record<string, string>,
  title: "AI photo",
  badge: "AI",
  credits: (remaining: number, limit: number) =>
    `${formatNumber(remaining, "en")} of ${plural("en", limit, { one: "# credit", other: "# credits" })} left`,
  saveFirst: "Save the dish first, then you can improve its photo or create one with AI.",
  loading: "Loading…",
  notConfigured: "AI photos aren't set up on this server yet.",
  startFailed: "Couldn't start. Please try again.",
  genericError: "Something went wrong. Please try again.",
  queued: "Waiting to start…",
  processing: "Creating your image…",
  pendingHint: "This usually takes under a minute. You can close this form; it keeps going and will be here when you come back.",
  failedDefault: "The AI service couldn't make this image. Your credit was returned.",
  retry: "Try again · 1 credit",
  startOver: "Start over",
  checkResult: "Check the result before using it",
  checkEnhance: "Make sure the food, portion and plate look exactly like what you serve.",
  checkIllustrate: "Make sure it looks like your dish. Guests will see it labelled “Illustrative image”.",
  yourPhoto: "Your photo",
  currentPhoto: "Current photo",
  improved: "Improved",
  illustrative: "Illustrative image",
  useImage: "Use this image",
  discard: "Discard",
  discardHint: "Discarding keeps your current photo. The credit stays used.",
  approvedEnhance: "The improved photo is in use. Guests see it after you publish.",
  approvedIllustrate: "The illustrative image is in use. Guests see it after you publish.",
  switchBack: "Switch back to the previous photo",
  removeImage: "Remove this image",
  makeAnother: "Make another",
  whatToMake: "What to make",
  saveForNewPhoto: "Save the dish first to use the new photo.",
  uploadFirst: "Upload a photo of the dish first.",
  lightAndBackground: "Light and background",
  improvePhoto: "Improve photo · 1 credit",
  createImage: "Create image · 1 credit",
  noCredits: "No credits left this month. They renew on the 1st.",
  creditHint: "You'll see the result before anything changes. If it fails, the credit is returned.",
  noPhoto: "No photo",
};
const ar: typeof en = {
  kinds: {
    enhance: {
      title: "حسّن صورتي",
      body: "إضاءة وخلفية أفضل، ويبقى الطعام تماماً كما في صورتك.",
    },
    illustrate: {
      title: "أنشئ صورة توضيحية",
      body: "تُصنع من اسم الطبق ووصفه، ويراها الضيوف مع عبارة «صورة توضيحية».",
    },
  },
  styles: {
    natural: "ضوء نهار طبيعي",
    bright: "نظيفة ومشرقة",
    warm: "أجواء مطعم دافئة",
  },
  title: "صورة بالذكاء الاصطناعي",
  badge: "AI",
  credits: (remaining, limit) => `الرصيد المتبقي: ${formatNumber(remaining, "ar")} من ${formatNumber(limit, "ar")}`,
  saveFirst: "احفظ الطبق أولاً، ثم يمكنك تحسين صورته أو إنشاء صورة له بالذكاء الاصطناعي.",
  loading: "جارٍ التحميل…",
  notConfigured: "صور الذكاء الاصطناعي غير مفعّلة بعد.",
  startFailed: "تعذّر البدء. حاول مرة أخرى.",
  genericError: "حدث خطأ. يُرجى المحاولة مرة أخرى.",
  queued: "بانتظار البدء…",
  processing: "جارٍ إنشاء صورتك…",
  pendingHint: "يستغرق ذلك عادةً أقل من دقيقة. يمكنك إغلاق النموذج، فالعمل يستمر وستجد النتيجة هنا عند عودتك.",
  failedDefault: "تعذّر على خدمة الذكاء الاصطناعي إنشاء هذه الصورة، وأُعيد إليك الرصيد.",
  retry: "حاول مجدداً · رصيد واحد",
  startOver: "البدء من جديد",
  checkResult: "راجع النتيجة قبل استخدامها",
  checkEnhance: "تأكد أن الطعام والكمية والصحن مطابقة تماماً لما تقدّمه.",
  checkIllustrate: "تأكد أنها تشبه طبقك. سيراها الضيوف مع عبارة «صورة توضيحية».",
  yourPhoto: "صورتك",
  currentPhoto: "الصورة الحالية",
  improved: "بعد التحسين",
  illustrative: "صورة توضيحية",
  useImage: "استخدم هذه الصورة",
  discard: "تجاهل",
  discardHint: "عند التجاهل تبقى صورتك الحالية، ولا يُعاد الرصيد.",
  approvedEnhance: "الصورة المحسّنة مستخدمة الآن. يراها الضيوف بعد النشر.",
  approvedIllustrate: "الصورة التوضيحية مستخدمة الآن. يراها الضيوف بعد النشر.",
  switchBack: "العودة إلى الصورة السابقة",
  removeImage: "إزالة هذه الصورة",
  makeAnother: "إنشاء صورة أخرى",
  whatToMake: "ماذا تريد أن تنشئ؟",
  saveForNewPhoto: "احفظ الطبق أولاً لاستخدام الصورة الجديدة.",
  uploadFirst: "ارفع صورة للطبق أولاً.",
  lightAndBackground: "الإضاءة والخلفية",
  improvePhoto: "تحسين الصورة · رصيد واحد",
  createImage: "إنشاء الصورة · رصيد واحد",
  noCredits: "لم يتبقَّ رصيد هذا الشهر. يتجدد الرصيد في أول كل شهر.",
  creditHint: "سترى النتيجة قبل أي تغيير. وإن تعذّر الإنشاء، يُعاد إليك الرصيد.",
  noPhoto: "لا صورة",
};

const newKey = () => (typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`);

/**
 * AI photos for one dish (DESIGN.md §6): choose what to make, see the cost, wait for the
 * result (no invented progress), compare it with the current photo, then use it or discard it.
 */
export function AiPhotoPanel({ slug, fetchWithAuth, itemId, savedImageUrl, formImageUrl, readOnly, onImageChange }: Props) {
  const t = useCopy({ en, ar });
  const lang = useAdminLang();
  const [configured, setConfigured] = useState<boolean | null>(null);
  const [credits, setCredits] = useState<Credits | null>(null);
  const [styles, setStyles] = useState<{ id: string; label: string }[]>([]);
  const [job, setJob] = useState<Job | null>(null);
  const [kind, setKind] = useState<Kind>(savedImageUrl ? "enhance" : "illustrate");
  const [style, setStyle] = useState("natural");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  // One key per request: a double click or a retried network call can't start (or charge) twice
  const requestKey = useRef(newKey());

  useEffect(() => {
    const load = async () => {
      if (!itemId) return;
      const res = await fetchWithAuth(`/api/c/${slug}/admin/ai-images/?item_id=${encodeURIComponent(itemId)}`);
      if (!res.ok) return;
      const data = await res.json();
      setConfigured(Boolean(data.configured));
      setCredits(data.credits);
      setStyles(data.styles || []);
      const latest: Job | undefined = data.jobs?.[0];
      // Show a request that still needs attention (a failure only for a day); finished history
      // stays out of the way
      const recent = latest ? Date.now() - Date.parse(`${latest.createdAt.replace(" ", "T")}Z`) < 24 * 60 * 60 * 1000 : false;
      const show = latest && (["queued", "processing", "ready", "approved"].includes(latest.status) || (latest.status === "failed" && recent));
      setJob(show ? latest : null);
    };
    load();
  }, [fetchWithAuth, itemId, slug]);

  // While the image is being made, check every few seconds (it also keeps going if the form closes)
  const pending = job?.status === "queued" || job?.status === "processing";
  useEffect(() => {
    if (!pending || !job) return;
    const timer = setInterval(async () => {
      const res = await fetchWithAuth(`/api/c/${slug}/admin/ai-images/${job.id}/`);
      if (res.ok) {
        const data = await res.json();
        setJob(data.job);
        setCredits(data.credits);
      }
    }, 3000);
    return () => clearInterval(timer);
  }, [pending, job, fetchWithAuth, slug]);

  if (!itemId) {
    return <Shell><p className="text-sm text-ui-muted">{t.saveFirst}</p></Shell>;
  }
  if (configured === null) {
    return <Shell><p className="text-sm text-ui-muted" role="status">{t.loading}</p></Shell>;
  }
  if (!configured) {
    return <Shell><p className="text-sm text-ui-muted">{t.notConfigured}</p></Shell>;
  }

  const start = async () => {
    setBusy(true);
    setError("");
    try {
      const res = await fetchWithAuth(`/api/c/${slug}/admin/ai-images/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId, kind, style, idempotencyKey: requestKey.current }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || t.startFailed);
      setJob(data.job);
      setCredits(data.credits);
      requestKey.current = newKey();
    } catch (err) {
      // A network failure (TypeError) carries the browser's English message: show our own text
      setError(err instanceof Error && !(err instanceof TypeError) ? err.message : t.startFailed);
    } finally {
      setBusy(false);
    }
  };

  const decide = async (action: "approve" | "discard" | "retry" | "revert") => {
    if (!job) return;
    setBusy(true);
    setError("");
    try {
      const res = await fetchWithAuth(`/api/c/${slug}/admin/ai-images/${job.id}/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || t.genericError);
      setCredits(data.credits);
      if (action === "approve") onImageChange(data.job.resultUrl, data.job.kind === "illustrate");
      if (action === "revert") onImageChange(job.previousImageUrl || "", false);
      setJob(action === "discard" || action === "revert" ? null : data.job);
    } catch (err) {
      setError(err instanceof Error && !(err instanceof TypeError) ? err.message : t.genericError);
    } finally {
      setBusy(false);
    }
  };

  const unsavedPhoto = (formImageUrl || "") !== (savedImageUrl || "");
  const canEnhance = Boolean(savedImageUrl) && !unsavedPhoto;
  const noCredits = (credits?.remaining ?? 0) <= 0;

  return (
    <Shell credits={credits}>
      {error && (
        <p role="alert" className="mb-4 rounded-control border border-[#F3C7C7] bg-[#FEF2F2] px-3 py-2 text-sm font-medium text-ui-danger">
          {error}
        </p>
      )}

      {pending && job && (
        <div role="status" className="flex items-start gap-3 rounded-control bg-ui-bg p-4">
          <Loader2 className="mt-0.5 h-5 w-5 shrink-0 animate-spin text-ui-primary" aria-hidden />
          <div>
            <p className="font-medium text-ui-ink">{job.status === "queued" ? t.queued : t.processing}</p>
            <p className="mt-1 text-sm text-ui-muted">{t.pendingHint}</p>
          </div>
        </div>
      )}

      {job?.status === "failed" && (
        <div className="rounded-control border border-ui-line p-4">
          <p className="flex items-start gap-2 font-medium text-ui-ink">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-ui-warning" aria-hidden />
            {job.error ? translateApiMessage(job.error, lang) : t.failedDefault}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <button type="button" onClick={() => decide("retry")} disabled={busy || readOnly || noCredits} className={primaryButton}>
              {t.retry}
            </button>
            <button type="button" onClick={() => setJob(null)} disabled={busy} className={secondaryButton}>
              {t.startOver}
            </button>
          </div>
        </div>
      )}

      {job?.status === "ready" && job.resultUrl && (
        <div>
          <p className="font-medium text-ui-ink">{t.checkResult}</p>
          <p className="mt-1 text-sm text-ui-muted">
            {job.kind === "enhance" ? t.checkEnhance : t.checkIllustrate}
          </p>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <Figure label={job.kind === "enhance" ? t.yourPhoto : t.currentPhoto} src={job.kind === "enhance" ? job.sourceUrl : savedImageUrl} />
            <Figure label={job.kind === "enhance" ? t.improved : t.illustrative} src={job.resultUrl} highlight />
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <button type="button" onClick={() => decide("approve")} disabled={busy || readOnly} className={primaryButton}>
              <Check className="h-4 w-4" aria-hidden />
              {t.useImage}
            </button>
            <button type="button" onClick={() => decide("discard")} disabled={busy || readOnly} className={secondaryButton}>
              {t.discard}
            </button>
          </div>
          <p className="mt-2 text-xs text-ui-muted">{t.discardHint}</p>
        </div>
      )}

      {job?.status === "approved" && (
        <div className="rounded-control bg-ui-bg p-4">
          <p className="flex items-start gap-2 font-medium text-ui-ink">
            <Check className="mt-0.5 h-5 w-5 shrink-0 text-ui-success" aria-hidden />
            {job.kind === "enhance" ? t.approvedEnhance : t.approvedIllustrate}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" onClick={() => decide("revert")} disabled={busy || readOnly} className={secondaryButton}>
              <RotateCcw className="h-4 w-4" aria-hidden />
              {job.previousImageUrl ? t.switchBack : t.removeImage}
            </button>
            <button type="button" onClick={() => setJob(null)} className={secondaryButton}>
              {t.makeAnother}
            </button>
          </div>
        </div>
      )}

      {!job && (
        <fieldset disabled={readOnly || busy} className="space-y-4">
          <legend className="sr-only">{t.whatToMake}</legend>
          <div className="grid gap-2">
            {KINDS.map((option) => {
              const disabled = option === "enhance" && !canEnhance;
              return (
                <label
                  key={option}
                  className={`flex cursor-pointer gap-3 rounded-control border p-3 transition-colors has-[:checked]:border-ui-primary has-[:checked]:bg-ui-subtle ${
                    disabled ? "cursor-not-allowed opacity-60" : "border-ui-line hover:border-ui-input"
                  }`}
                >
                  <input type="radio" name="ai-kind" value={option} checked={kind === option} disabled={disabled} onChange={() => setKind(option)} className="mt-1" />
                  <span>
                    <span className="flex items-center gap-2 font-medium text-ui-ink">
                      {option === "enhance" ? <Wand2 className="h-4 w-4" aria-hidden /> : <ImagePlus className="h-4 w-4" aria-hidden />}
                      {t.kinds[option].title}
                    </span>
                    <span className="mt-0.5 block text-sm text-ui-muted">
                      {disabled ? (unsavedPhoto ? t.saveForNewPhoto : t.uploadFirst) : t.kinds[option].body}
                    </span>
                  </span>
                </label>
              );
            })}
          </div>

          <div>
            <p className="mb-2 text-sm font-medium text-ui-ink" id="ai-style-label">{t.lightAndBackground}</p>
            <div role="radiogroup" aria-labelledby="ai-style-label" className="flex flex-wrap gap-2">
              {styles.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  role="radio"
                  aria-checked={style === option.id}
                  onClick={() => setStyle(option.id)}
                  className={`min-h-11 rounded-control border px-3 text-sm font-medium transition-colors ${
                    style === option.id ? "border-ui-primary bg-ui-subtle text-ui-primary" : "border-ui-line text-ui-ink hover:border-ui-input"
                  }`}
                >
                  {t.styles[option.id] ?? option.label}
                </button>
              ))}
            </div>
          </div>

          <button type="button" onClick={start} disabled={busy || noCredits || (kind === "enhance" && !canEnhance)} className={`${primaryButton} w-full`}>
            {busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
            {kind === "enhance" ? t.improvePhoto : t.createImage}
          </button>
          <p className="text-xs text-ui-muted">
            {noCredits ? t.noCredits : t.creditHint}
          </p>
        </fieldset>
      )}
    </Shell>
  );
}

const primaryButton =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-control bg-ui-primary px-4 text-sm font-semibold text-ui-primary-fg hover:bg-ui-primary-hover disabled:opacity-50";
const secondaryButton =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-control border border-ui-input px-4 text-sm font-medium text-ui-ink hover:bg-ui-subtle disabled:opacity-50";

function Shell({ children, credits }: { children: React.ReactNode; credits?: Credits | null }) {
  const t = useCopy({ en, ar });
  return (
    <section aria-labelledby="ai-photo-title" className="rounded-panel border border-ui-line bg-ui-surface p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 id="ai-photo-title" className="flex items-center gap-2 font-semibold">
          {t.title}
          <span lang="en" className="rounded-full bg-ui-ai px-2 py-0.5 text-xs font-semibold text-ui-ai-fg">{t.badge}</span>
        </h3>
        {credits && (
          <span className="text-sm text-ui-muted tabular-nums">
            {t.credits(credits.remaining, credits.limit)}
          </span>
        )}
      </div>
      {children}
    </section>
  );
}

function Figure({ label, src, highlight = false }: { label: string; src: string | null; highlight?: boolean }) {
  const t = useCopy({ en, ar });
  return (
    <figure>
      <div className={`aspect-[4/3] overflow-hidden rounded-control border bg-ui-bg ${highlight ? "border-ui-primary" : "border-ui-line"}`}>
        {src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={src} alt={label} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-ui-muted">{t.noPhoto}</div>
        )}
      </div>
      <figcaption className="mt-1.5 text-sm font-medium text-ui-ink">{label}</figcaption>
    </figure>
  );
}
