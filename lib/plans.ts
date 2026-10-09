// Centralized plan configuration: the one source for plan prices, limits and feature flags.
// Signup, plan request approval, the billing page and the superadmin tools all read from here.
// Prices match the landing page (src/app/_landing/copy.ts); limits are what the billing page
// has promised owners. Every plan has Arabic and English; multi_language_enabled is kept only
// because the column exists (there is no third language).

import type { SubscriptionType } from './db/types';

export const PLAN_CONFIG = {
    // The free trial every signup starts on: Essential limits for 2 days
    trial: {
        id: 'trial',
        name: 'Free Trial',
        price: 0,
        currency: 'USD',
        period: 'trial',
        durationDays: 2,
        limits: {
            max_items: 200,
            max_categories: 20,
            ai_image_enhancement_limit: 5,
        },
        features: {
            multi_language_enabled: true,
            booking_enabled: true,
            analytics_enabled: true,
            custom_domain_enabled: false,
        },
        display_features: [
            'Up to 200 dishes',
            'Up to 20 categories',
            '5 AI photo enhancements/mo',
            'Arabic and English menu',
            'Visit and order-click analytics',
        ],
    },
    essential: {
        id: 'essential',
        name: 'Essential',
        price: 99,
        currency: 'USD',
        period: 'year',
        durationDays: null,
        limits: {
            max_items: 200,
            max_categories: 20,
            ai_image_enhancement_limit: 5,
        },
        features: {
            multi_language_enabled: true,
            booking_enabled: true,
            analytics_enabled: true,
            custom_domain_enabled: false,
        },
        display_features: [
            'Up to 200 dishes',
            'Up to 20 categories',
            '5 AI photo enhancements/mo',
            'Arabic and English menu',
            'Visit and order-click analytics',
        ],
    },
    pro: {
        id: 'pro',
        name: 'Pro',
        price: 299,
        currency: 'USD',
        period: 'year',
        durationDays: null,
        limits: {
            max_items: 1000,
            max_categories: 50,
            ai_image_enhancement_limit: 20,
        },
        features: {
            multi_language_enabled: true,
            booking_enabled: true,
            analytics_enabled: true,
            custom_domain_enabled: false,
        },
        display_features: [
            'Up to 1,000 dishes',
            'Up to 50 categories',
            '20 AI photo enhancements/mo',
            'Arabic and English menu',
        ],
    },
    enterprise: {
        id: 'enterprise',
        name: 'Enterprise',
        price: 399,
        currency: 'USD',
        period: 'year',
        durationDays: null,
        limits: {
            max_items: 10000,
            max_categories: 200,
            ai_image_enhancement_limit: 100,
        },
        features: {
            multi_language_enabled: true,
            booking_enabled: true,
            analytics_enabled: true,
            custom_domain_enabled: false,
        },
        display_features: [
            'Up to 10,000 dishes',
            'Up to 200 categories',
            '100 AI photo enhancements/mo',
            'Arabic and English menu',
        ],
    },
} as const;

export type PlanId = keyof typeof PLAN_CONFIG;
export type PlanConfig = (typeof PLAN_CONFIG)[PlanId];

/** Plans an owner can request and pay for (everything except the trial) */
export const PAID_PLAN_IDS = ['essential', 'pro', 'enterprise'] as const;
export type PaidPlanId = (typeof PAID_PLAN_IDS)[number];

/** Every value catalog_subscriptions.subscription_type may hold, including legacy durations */
export const SUBSCRIPTION_TYPES: readonly SubscriptionType[] = [
    'trial', 'essential', 'pro', 'enterprise', 'yearly', 'forever', 'custom_years',
];

export function isPaidPlanId(value: unknown): value is PaidPlanId {
    return typeof value === 'string' && (PAID_PLAN_IDS as readonly string[]).includes(value);
}

export function isSubscriptionType(value: unknown): value is SubscriptionType {
    return typeof value === 'string' && (SUBSCRIPTION_TYPES as readonly string[]).includes(value);
}

export function getPlanConfig(planId: string): PlanConfig | null {
    return Object.prototype.hasOwnProperty.call(PLAN_CONFIG, planId) ? PLAN_CONFIG[planId as PlanId] : null;
}

/**
 * Plan whose limits apply to a subscription type. The legacy duration types
 * (yearly, forever, custom_years) predate named plans and get Essential limits.
 */
export function getPlanForSubscriptionType(type: string | null | undefined): PlanConfig {
    return (type && getPlanConfig(type)) || PLAN_CONFIG.essential;
}

export function getPlanPrice(planId: string): number | null {
    const plan = getPlanConfig(planId);
    return plan ? plan.price : null;
}

export function getPlanLimits(planId: string) {
    const plan = getPlanConfig(planId);
    return plan?.limits || null;
}

export function getPlanFeatures(planId: string) {
    const plan = getPlanConfig(planId);
    return plan?.features || null;
}

/** The paid plans, in display order */
export function getAllPlans() {
    return PAID_PLAN_IDS.map((id) => PLAN_CONFIG[id]);
}

/**
 * Expiry (ISO string) for a new subscription of this type starting now, or null for
 * 'forever'. Paid plans and 'yearly' run one year, the trial its trial length.
 */
export function getSubscriptionExpiry(type: SubscriptionType, customYears?: number | null): string | null {
    const expires = new Date();
    if (type === 'forever') return null;
    if (type === 'trial') {
        expires.setDate(expires.getDate() + PLAN_CONFIG.trial.durationDays);
    } else if (type === 'custom_years') {
        const years = Number(customYears);
        if (!Number.isInteger(years) || years < 1) return null;
        expires.setFullYear(expires.getFullYear() + years);
    } else {
        expires.setFullYear(expires.getFullYear() + 1);
    }
    return expires.toISOString();
}

// ---- Grace period ----
// MENUDESIGN.md §8: "A billing lapse should follow an explicit grace policy rather than
// unexpectedly making every table unusable." For GRACE_DAYS after a plan ends, the menu stays
// online and editing still works while the owner is warned; after that the menu goes offline
// and changes are paused until renewal.
export const GRACE_DAYS = 7;

export type SubscriptionState = 'active' | 'grace' | 'expired';

/** expires_at is stored as SQLite "YYYY-MM-DD HH:MM:SS" (UTC) or ISO; null = never expires */
export function parseExpiry(expiresAt: unknown): Date | null {
    if (expiresAt === null || expiresAt === undefined || expiresAt === '') return null;
    const text = String(expiresAt);
    const date = new Date(/^\d{4}-\d{2}-\d{2} \d/.test(text) ? text.replace(' ', 'T') + 'Z' : text);
    return Number.isNaN(date.getTime()) ? null : date;
}

export function getSubscriptionState(expiresAt: unknown, now: Date = new Date()) {
    const expires = parseExpiry(expiresAt);
    if (!expires || expires > now) {
        return { state: 'active' as SubscriptionState, expiresAt: expires, offlineAt: null as Date | null };
    }
    const offlineAt = new Date(expires.getTime() + GRACE_DAYS * 24 * 60 * 60 * 1000);
    return { state: (offlineAt > now ? 'grace' : 'expired') as SubscriptionState, expiresAt: expires, offlineAt };
}

/** The same rule in SQL, for queries that filter on expiry */
export const SQL_GRACE_MODIFIER = `+${GRACE_DAYS} days`;
