"use client";

import { SuperAdminShell } from "../_components/SuperAdminShell";
import { SuperAdminHeader, SuperAdminContent } from "../_components/SuperAdminSidebar";
import { Mail, CreditCard, Languages } from "lucide-react";
import { PLAN_CONFIG, getAllPlans } from "@/lib/plans";

// The platform has no editable settings: plans, limits and the trial live in lib/plans.ts,
// and the old platform_settings values (trial days, free limits, registration and
// maintenance switches) were saved but never read. This page shows what is actually in effect.
const SUPPORT_EMAIL = "info@coredex.solutions";

const PLANS = [PLAN_CONFIG.trial, ...getAllPlans()];

export default function PlatformPage() {
  return (
    <SuperAdminShell>
      <SuperAdminHeader title="Platform" />

      <SuperAdminContent>
        <div className="max-w-4xl space-y-6">
          <section className="bg-ui-surface rounded-panel p-6 border border-ui-line" aria-labelledby="support-heading">
            <h2 id="support-heading" className="font-semibold text-ui-ink mb-4 flex items-center gap-2">
              <Mail className="w-5 h-5 text-ui-primary" aria-hidden />
              Support contact
            </h2>
            <p className="text-sm text-ui-muted">
              Owners and guests are pointed to{" "}
              <a href={`mailto:${SUPPORT_EMAIL}`} className="font-semibold text-ui-ink underline underline-offset-2">
                {SUPPORT_EMAIL}
              </a>{" "}
              (legal pages and outgoing email).
            </p>
          </section>

          <section className="bg-ui-surface rounded-panel p-6 border border-ui-line" aria-labelledby="languages-heading">
            <h2 id="languages-heading" className="font-semibold text-ui-ink mb-4 flex items-center gap-2">
              <Languages className="w-5 h-5 text-ui-primary" aria-hidden />
              Languages
            </h2>
            <p className="text-sm text-ui-muted">
              Every menu is offered in Arabic and English, on every plan.
            </p>
          </section>

          <section className="bg-ui-surface rounded-panel p-6 border border-ui-line" aria-labelledby="plans-heading">
            <h2 id="plans-heading" className="font-semibold text-ui-ink mb-1 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-ui-primary" aria-hidden />
              Plans
            </h2>
            <p className="text-sm text-ui-muted mb-6">
              Plans differ by limits and AI credits. To change them, edit <code className="font-mono text-xs">lib/plans.ts</code>.
            </p>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-ui-muted border-b border-ui-line">
                    <th scope="col" className="py-2 pr-4 font-medium">Plan</th>
                    <th scope="col" className="py-2 pr-4 font-medium">Price</th>
                    <th scope="col" className="py-2 pr-4 font-medium">Dishes</th>
                    <th scope="col" className="py-2 pr-4 font-medium">Categories</th>
                    <th scope="col" className="py-2 font-medium">AI photo enhancements / mo</th>
                  </tr>
                </thead>
                <tbody>
                  {PLANS.map((plan) => (
                    <tr key={plan.id} className="border-b border-ui-line last:border-0 text-ui-ink">
                      <th scope="row" className="py-3 pr-4 font-semibold text-left">{plan.name}</th>
                      <td className="py-3 pr-4 tabular-nums">
                        {plan.price === 0
                          ? `Free for ${PLAN_CONFIG.trial.durationDays} days`
                          : `$${plan.price} / ${plan.period}`}
                      </td>
                      <td className="py-3 pr-4 tabular-nums">{plan.limits.max_items.toLocaleString("en-US")}</td>
                      <td className="py-3 pr-4 tabular-nums">{plan.limits.max_categories.toLocaleString("en-US")}</td>
                      <td className="py-3 tabular-nums">{plan.limits.ai_image_enhancement_limit}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </SuperAdminContent>
    </SuperAdminShell>
  );
}
