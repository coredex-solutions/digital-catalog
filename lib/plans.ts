// Centralized plan configuration for consistent pricing and limits across the app

export const PLAN_CONFIG = {
    essential: {
        id: 'essential',
        name: 'Essential',
        price: 99,
        currency: 'USD',
        period: 'year',
        limits: {
            max_items: 50,
            max_categories: 5,
            ai_image_enhancement_limit: 10,
        },
        features: {
            multi_language_enabled: false,
            booking_enabled: true,
            analytics_enabled: true,
            custom_domain_enabled: false,
        },
        display_features: [
            '50 Products',
            '5 Categories',
            '10 AI Enhancements/mo',
            'Basic Analytics',
        ],
    },
    pro: {
        id: 'pro',
        name: 'Pro',
        price: 299,
        currency: 'USD',
        period: 'year',
        limits: {
            max_items: 200,
            max_categories: 20,
            ai_image_enhancement_limit: 50,
        },
        features: {
            multi_language_enabled: true,
            booking_enabled: true,
            analytics_enabled: true,
            custom_domain_enabled: false,
        },
        display_features: [
            '200 Products',
            '20 Categories',
            '50 AI Enhancements/mo',
            'Full Analytics',
            'Multi-Language',
        ],
    },
    enterprise: {
        id: 'enterprise',
        name: 'Enterprise',
        price: 399,
        currency: 'USD',
        period: 'year',
        limits: {
            max_items: 9999,
            max_categories: 999,
            ai_image_enhancement_limit: 200,
        },
        features: {
            multi_language_enabled: true,
            booking_enabled: true,
            analytics_enabled: true,
            custom_domain_enabled: true,
        },
        display_features: [
            'Unlimited Products',
            'Unlimited Categories',
            '200 AI Enhancements/mo',
            'Priority Support',
            'Custom Domain',
        ],
    },
} as const;

export type PlanId = keyof typeof PLAN_CONFIG;

export function getPlanConfig(planId: string) {
    return PLAN_CONFIG[planId as PlanId] || null;
}

export function getPlanPrice(planId: string): number | null {
    const plan = getPlanConfig(planId);
    return plan?.price || null;
}

export function getPlanLimits(planId: string) {
    const plan = getPlanConfig(planId);
    return plan?.limits || null;
}

export function getPlanFeatures(planId: string) {
    const plan = getPlanConfig(planId);
    return plan?.features || null;
}

export function getAllPlans() {
    return Object.values(PLAN_CONFIG);
}
