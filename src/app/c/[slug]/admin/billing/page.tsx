"use client";

import { useEffect, useState, type ReactNode } from "react";
import { CatalogAdminShell, useCatalogAdmin } from "../_components/CatalogAdminShell";
import { CatalogAdminHeader, CatalogAdminContent } from "../_components/CatalogAdminSidebar";
import { ADMIN_NAV_LABELS } from "../_components/adminNav";
import { useAdminLang, useCopy, useFormat, plural, type AdminLang } from "../_lib/i18n";
import { AlertTriangle, Check, Clock, Loader2, Mail, MessageCircle } from "lucide-react";
import { getAllPlans, getPlanConfig, parseExpiry } from "@/lib/plans";
import { SALES_EMAIL, SALES_WHATSAPP } from "@/lib/contact";

// Plans, prices and limits come from lib/plans.ts so this page always matches what approval applies
const PLANS = getAllPlans();

interface PlanRequest {
    id: string;
    plan_name: string;
    status: "pending" | "approved" | "rejected" | string;
    created_at: string;
}

const DAY = 24 * 60 * 60 * 1000;

/** Plan brand name (Essential, Pro, Enterprise) as in lib/plans.ts; kept in Latin letters in both languages, as on the landing page */
const brandName = (id: string) => getPlanConfig(id)?.name || id;

const en = {
    /** "Essential plan", "Free trial"; the legacy duration types predate named plans */
    planTitle: (id: string) =>
        ({ trial: "Free trial", yearly: "Yearly plan", forever: "Lifetime plan", custom_years: "Multi-year plan" } as Record<string, string>)[id] ??
        `${brandName(id)} plan`,
    yourPlan: "Your plan",
    endedExpired: (date: string) => `Ended on ${date}. Guests can't open your menu until you renew.`,
    endedGrace: (ended: string, offline: string) => `Ended on ${ended}. Your menu stays online until ${offline}.`,
    noEndDate: "Active, with no end date.",
    activeUntil: (date: string, days: number, lang: AdminLang) =>
        `Active until ${date} (${days === 0 ? "today" : days === 1 ? "tomorrow" : plural(lang, days, { one: "in # day", other: "in # days" })}).`,
    dishes: "Dishes",
    categories: "Categories",
    upTo: (n: string) => `Up to ${n}`,
    aiCredits: "AI photo credits used this month",
    usedOf: (used: string, limit: string) => `${used} of ${limit}`,
    requestSentTitle: "Request sent",
    youAskedFor: (plan: ReactNode, date: string): ReactNode => <>You asked for the <strong>{plan}</strong> on {date}.</>,
    weWillContact: "We'll contact you to arrange payment. Your plan changes as soon as payment is confirmed.",
    howPayingWorks: "How paying works",
    steps: ["Choose a plan below.", "We contact you to arrange payment.", "Your plan starts once payment is confirmed."],
    questions: "Questions about your plan?",
    whatsappUs: "WhatsApp us",
    newTab: "(opens in a new tab)",
    whatsappText: (slug: string) => `Hello Coredex, I have a question about the plan for ${slug}.`,
    plans: "Plans",
    pricesNote: "Prices are per year, in US dollars.",
    ownerOnly: "Only the restaurant owner can request a plan.",
    currentPlan: "Your current plan",
    aYear: "a year",
    requestRenewal: "Request renewal",
    choose: (name: string) => `Choose ${name}`,
    oneAtATime: "You can request another plan once the current request is handled.",
    yourRequests: "Your requests",
    requestSent: (plan: string) => `Request sent for the ${plan}. We'll contact you to arrange payment.`,
    sendFailed: "Couldn't send the request. Please try again.",
    sendFailedShort: "Couldn't send the request.",
    status: { pending: "Waiting for payment", approved: "Approved", rejected: "Closed" } as Record<string, string>,
    /** lib/plans.ts display_features, by their English text */
    features: {} as Record<string, string>,
};
const ar: typeof en = {
    planTitle: (id) =>
        ({ trial: "تجربة مجانية", yearly: "الباقة السنوية", forever: "باقة مدى الحياة", custom_years: "باقة متعددة السنوات" } as Record<string, string>)[id] ??
        `باقة ${brandName(id)}`,
    yourPlan: "باقتك",
    endedExpired: (date) => `انتهت في ${date}. لا يستطيع الزبائن فتح قائمتك حتى تجدّد باقتك.`,
    endedGrace: (ended, offline) => `انتهت في ${ended}. تبقى قائمتك متاحة حتى ${offline}.`,
    noEndDate: "فعّالة، بلا تاريخ انتهاء.",
    activeUntil: (date, days, lang) =>
        `فعّالة حتى ${date} (${
            days === 0
                ? "تنتهي اليوم"
                : days === 1
                  ? "تنتهي غداً"
                  : plural(lang, days, { one: "بعد يوم واحد", two: "بعد يومين", few: "بعد # أيام", many: "بعد # يوماً", other: "بعد # يوم" })
        }).`,
    dishes: "الأطباق",
    categories: "الأقسام",
    upTo: (n) => `حتى ${n}`,
    aiCredits: "رصيد صور الذكاء الاصطناعي المستخدم هذا الشهر",
    usedOf: (used, limit) => `${used} من ${limit}`,
    requestSentTitle: "تم إرسال الطلب",
    youAskedFor: (plan, date) => <>طلبت <strong>{plan}</strong> في {date}.</>,
    weWillContact: "سنتواصل معك لترتيب الدفع. تتغيّر باقتك فور تأكيد الدفع.",
    howPayingWorks: "كيف يتم الدفع",
    steps: ["اختر باقة من الباقات أدناه.", "نتواصل معك لترتيب الدفع.", "تبدأ باقتك فور تأكيد الدفع."],
    questions: "لديك أسئلة عن باقتك؟",
    whatsappUs: "راسلنا على واتساب",
    newTab: "(تُفتح في نافذة جديدة)",
    whatsappText: (slug) => `مرحباً Coredex، لدي سؤال عن باقة قائمتي ${slug}.`,
    plans: "الباقات",
    pricesNote: "الأسعار سنوية وبالدولار الأمريكي.",
    ownerOnly: "صاحب الحساب وحده يستطيع طلب باقة.",
    currentPlan: "باقتك الحالية",
    aYear: "سنوياً",
    requestRenewal: "طلب التجديد",
    choose: (name) => `اختر باقة ${name}`,
    oneAtATime: "يمكنك طلب باقة أخرى بعد معالجة الطلب الحالي.",
    yourRequests: "طلباتك",
    requestSent: (plan) => `تم إرسال طلب ${plan}. سنتواصل معك لترتيب الدفع.`,
    sendFailed: "تعذّر إرسال الطلب. حاول مرة أخرى.",
    sendFailedShort: "تعذّر إرسال الطلب.",
    status: { pending: "بانتظار الدفع", approved: "تمت الموافقة", rejected: "مغلق" },
    features: {
        "Up to 200 dishes": "حتى 200 طبق",
        "Up to 20 categories": "حتى 20 قسماً",
        "5 AI photo enhancements/mo": "5 تحسينات صور بالذكاء الاصطناعي شهرياً",
        "Arabic and English menu": "قائمة بالعربية والإنجليزية",
        "Visit and order-click analytics": "إحصاءات الزيارات ونقرات الطلب",
        "Up to 1,000 dishes": "حتى 1,000 طبق",
        "Up to 50 categories": "حتى 50 قسماً",
        "20 AI photo enhancements/mo": "20 تحسين صور بالذكاء الاصطناعي شهرياً",
        "Up to 10,000 dishes": "حتى 10,000 طبق",
        "Up to 200 categories": "حتى 200 قسم",
        "100 AI photo enhancements/mo": "100 تحسين صور بالذكاء الاصطناعي شهرياً",
    },
};

const STATUS_CLASS: Record<string, string> = {
    pending: "text-ui-warning",
    approved: "text-ui-success",
    rejected: "text-ui-muted",
};

export default function BillingPage() {
    return (
        <CatalogAdminShell>
            <BillingPageContent />
        </CatalogAdminShell>
    );
}

function BillingPageContent() {
    const { features, slug, user, fetchWithAuth } = useCatalogAdmin();
    const lang = useAdminLang();
    const t = useCopy({ en, ar });
    const f = useFormat();
    const [requests, setRequests] = useState<PlanRequest[]>([]);
    const [requesting, setRequesting] = useState<string | null>(null);
    const [message, setMessage] = useState<{ kind: "error" | "done"; text: string } | null>(null);

    // Owners request plans; editors and viewers can see this page but not change the plan
    const isOwner = !user?.role || user.role === "owner" || user.role === "admin";

    /** A Beirut date, e.g. "19 October 2026" / "19 تشرين الأول 2026" */
    const formatDate = (value: string | Date | null | undefined) => {
        const date = value instanceof Date ? value : parseExpiry(value);
        return date ? f.date(date) : "";
    };

    useEffect(() => {
        fetchRequests();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const fetchRequests = async () => {
        try {
            const res = await fetchWithAuth(`/api/c/${slug}/upgrade/`);
            if (res.ok) {
                const data = await res.json();
                setRequests(data.requests || []);
            }
        } catch {
            // The history is a convenience; the page still works without it
        }
    };

    const handleRequest = async (planId: string) => {
        setRequesting(planId);
        setMessage(null);
        try {
            const res = await fetchWithAuth(`/api/c/${slug}/upgrade/`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ planName: planId }),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(data.error || t.sendFailed);
            setMessage({ kind: "done", text: t.requestSent(t.planTitle(planId)) });
            fetchRequests();
        } catch (error) {
            setMessage({ kind: "error", text: error instanceof Error && error.message ? error.message : t.sendFailedShort });
        } finally {
            setRequesting(null);
        }
    };

    const pendingRequest = requests.find((r) => r.status === "pending");
    const currentId = features?.subscription_type || "";
    const currentName = t.planTitle(currentId);

    // Where the plan stands, in one sentence
    const expires = parseExpiry(features?.expires_at);
    const daysLeft = expires ? Math.max(0, Math.ceil((expires.getTime() - Date.now()) / DAY)) : null;
    let status: { tone: "ok" | "warn" | "danger"; text: string };
    if (features?.is_expired) {
        status = { tone: "danger", text: t.endedExpired(formatDate(features.plan_ended_at)) };
    } else if (features?.in_grace) {
        status = { tone: "warn", text: t.endedGrace(formatDate(features.plan_ended_at), formatDate(features.offline_at)) };
    } else if (!expires) {
        status = { tone: "ok", text: t.noEndDate };
    } else {
        status = { tone: daysLeft !== null && daysLeft <= 7 ? "warn" : "ok", text: t.activeUntil(formatDate(expires), daysLeft ?? 0, lang) };
    }
    const toneClass = { ok: "text-ui-success", warn: "text-ui-warning", danger: "text-ui-danger" }[status.tone];

    const whatsappHref = `https://wa.me/${SALES_WHATSAPP}?text=${encodeURIComponent(t.whatsappText(slug))}`;
    const limit = (value: number | undefined) => (value == null ? "–" : f.number(value));

    return (
        <>
            <CatalogAdminHeader title={ADMIN_NAV_LABELS[lang].billing} />
            <CatalogAdminContent>
                <div className="mb-10 grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-3">
                    {/* Current plan */}
                    <section aria-labelledby="current-plan" className="rounded-panel border border-ui-line bg-ui-surface p-5 sm:p-8 lg:col-span-2">
                        <p className="text-sm font-medium text-ui-muted">{t.yourPlan}</p>
                        <h2 id="current-plan" className="mt-1 text-2xl font-semibold sm:text-3xl">{currentName}</h2>
                        <p className={`mt-2 flex items-start gap-2 font-medium ${toneClass}`}>
                            {status.tone === "ok" ? <Check className="mt-0.5 h-5 w-5 shrink-0" aria-hidden /> : <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />}
                            {status.text}
                        </p>

                        <dl className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
                            <div className="rounded-control border border-ui-line bg-ui-bg p-4">
                                <dt className="text-sm text-ui-muted">{t.dishes}</dt>
                                <dd className="mt-1 text-lg font-semibold tabular-nums">{t.upTo(limit(features?.max_items))}</dd>
                            </div>
                            <div className="rounded-control border border-ui-line bg-ui-bg p-4">
                                <dt className="text-sm text-ui-muted">{t.categories}</dt>
                                <dd className="mt-1 text-lg font-semibold tabular-nums">{t.upTo(limit(features?.max_categories))}</dd>
                            </div>
                            <div className="rounded-control border border-ui-line bg-ui-bg p-4">
                                <dt className="text-sm text-ui-muted">{t.aiCredits}</dt>
                                <dd className="mt-1 text-lg font-semibold tabular-nums">
                                    {t.usedOf(f.number(features?.ai_image_enhancement_used ?? 0), f.number(features?.ai_image_enhancement_limit ?? 0))}
                                </dd>
                            </div>
                        </dl>
                    </section>

                    {/* How paying works, or the request in progress */}
                    <section aria-labelledby="payment-steps" className="rounded-panel border border-ui-line bg-ui-surface p-5 sm:p-8">
                        {pendingRequest ? (
                            <>
                                <h2 id="payment-steps" className="flex items-center gap-2 text-lg font-semibold">
                                    <Clock className="h-5 w-5 text-ui-warning" aria-hidden />
                                    {t.requestSentTitle}
                                </h2>
                                <p className="mt-3 text-ui-ink">
                                    {t.youAskedFor(t.planTitle(pendingRequest.plan_name), formatDate(pendingRequest.created_at))}
                                </p>
                                <p className="mt-2 text-ui-muted">{t.weWillContact}</p>
                            </>
                        ) : (
                            <>
                                <h2 id="payment-steps" className="text-lg font-semibold">{t.howPayingWorks}</h2>
                                <ol className="mt-3 list-decimal space-y-2 ps-5 text-ui-ink">
                                    {t.steps.map((step) => (
                                        <li key={step}>{step}</li>
                                    ))}
                                </ol>
                            </>
                        )}
                        <div className="mt-6 flex flex-col gap-2 border-t border-ui-line pt-5">
                            <p className="text-sm text-ui-muted">{t.questions}</p>
                            <a href={whatsappHref} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center gap-2 font-medium text-ui-primary hover:underline">
                                <MessageCircle className="h-5 w-5" aria-hidden />
                                {t.whatsappUs}
                                <span className="sr-only">{t.newTab}</span>
                            </a>
                            <a href={`mailto:${SALES_EMAIL}`} className="inline-flex min-h-11 items-center gap-2 font-medium text-ui-primary hover:underline">
                                <Mail className="h-5 w-5" aria-hidden />
                                <bdi dir="ltr">{SALES_EMAIL}</bdi>
                            </a>
                        </div>
                    </section>
                </div>

                <section aria-labelledby="plans-title">
                    <div className="mb-6">
                        <h2 id="plans-title" className="text-2xl font-semibold">{t.plans}</h2>
                        <p className="mt-1 text-ui-muted">{t.pricesNote}</p>
                    </div>

                    {message && (
                        <p
                            role={message.kind === "error" ? "alert" : "status"}
                            className={`mb-6 rounded-control border px-4 py-3 text-sm font-medium ${
                                message.kind === "error" ? "border-[#F3C7C7] bg-[#FEF2F2] text-ui-danger" : "border-ui-line bg-ui-subtle text-ui-ink"
                            }`}
                        >
                            {message.text}
                        </p>
                    )}
                    {!isOwner && <p className="mb-6 text-sm text-ui-muted">{t.ownerOnly}</p>}

                    <div className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-3">
                        {PLANS.map((plan) => {
                            const isCurrent = currentId === plan.id;
                            return (
                                <div
                                    key={plan.id}
                                    className={`flex flex-col rounded-panel border bg-ui-surface p-5 sm:p-8 ${isCurrent ? "border-2 border-ui-primary" : "border-ui-line"}`}
                                >
                                    {isCurrent && <p className="mb-2 text-sm font-semibold text-ui-primary">{t.currentPlan}</p>}
                                    <h3 className="text-xl font-semibold">{plan.name}</h3>
                                    <p className="mt-2 flex items-baseline gap-1">
                                        <span className="text-4xl font-semibold tabular-nums" dir="ltr">${f.number(plan.price)}</span>
                                        <span className="text-sm text-ui-muted">{t.aYear}</span>
                                    </p>
                                    <ul className="mb-8 mt-6 space-y-3">
                                        {plan.display_features.map((feature) => (
                                            <li key={feature} className="flex items-start gap-3 text-ui-ink">
                                                <Check className="mt-0.5 h-5 w-5 shrink-0 text-ui-primary" aria-hidden />
                                                {t.features[feature] ?? feature}
                                            </li>
                                        ))}
                                    </ul>
                                    <button
                                        type="button"
                                        onClick={() => handleRequest(plan.id)}
                                        disabled={!isOwner || !!pendingRequest || requesting !== null}
                                        className={`mt-auto flex min-h-12 w-full items-center justify-center gap-2 rounded-control px-5 font-semibold transition-colors disabled:opacity-50 ${
                                            isCurrent ? "border border-ui-primary text-ui-primary hover:bg-ui-subtle" : "bg-ui-primary text-ui-primary-fg hover:bg-ui-primary-hover"
                                        }`}
                                    >
                                        {requesting === plan.id && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
                                        {isCurrent ? t.requestRenewal : t.choose(plan.name)}
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                    {pendingRequest && <p className="mt-4 text-sm text-ui-muted">{t.oneAtATime}</p>}
                </section>

                {requests.length > 0 && (
                    <section aria-labelledby="history-title" className="mt-12">
                        <h2 id="history-title" className="mb-4 text-lg font-semibold">{t.yourRequests}</h2>
                        <ul className="divide-y divide-ui-line rounded-panel border border-ui-line bg-ui-surface">
                            {requests.slice(0, 10).map((request) => (
                                <li key={request.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
                                    <span className="font-medium text-ui-ink">
                                        {t.planTitle(request.plan_name)} <span className="font-normal text-ui-muted">· {formatDate(request.created_at)}</span>
                                    </span>
                                    <span className={`text-sm font-semibold ${STATUS_CLASS[request.status] || "text-ui-muted"}`}>
                                        {t.status[request.status] || request.status}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    </section>
                )}
            </CatalogAdminContent>
        </>
    );
}
