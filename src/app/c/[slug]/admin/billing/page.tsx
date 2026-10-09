"use client";

import { useEffect, useState } from "react";
import { CatalogAdminShell, useCatalogAdmin } from "../_components/CatalogAdminShell";
import { CatalogAdminHeader, CatalogAdminContent } from "../_components/CatalogAdminSidebar";
import {
    CreditCard,
    Zap,
    Check,
    Clock,
    CheckCircle2,
    AlertCircle,
    Loader2
} from "lucide-react";
import { getAllPlans, getPlanConfig } from "@/lib/plans";

// Plans, prices and limits come from lib/plans.ts so this page always matches what approval applies
const PLANS = getAllPlans().map((plan) => ({
    id: plan.id,
    name: plan.name,
    price: `$${plan.price}`,
    period: '/yr',
    features: plan.display_features,
}));

export default function BillingPage() {
    return (
        <CatalogAdminShell>
            <BillingPageContent />
        </CatalogAdminShell>
    );
}

function BillingPageContent() {
    const { features, slug, fetchWithAuth } = useCatalogAdmin();
    const [requests, setRequests] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [requesting, setRequesting] = useState<string | null>(null);

    useEffect(() => {
        fetchRequests();
    }, []);

    const fetchRequests = async () => {
        try {
            const res = await fetchWithAuth(`/api/c/${slug}/upgrade`);
            if (res.ok) {
                const data = await res.json();
                setRequests(data.requests || []);
            }
        } catch (error) {
            console.error("Failed to fetch requests");
        } finally {
            setLoading(false);
        }
    };

    const handleUpgradeRequest = async (planId: string) => {
        setRequesting(planId);
        try {
            const res = await fetchWithAuth(`/api/c/${slug}/upgrade`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ planName: planId })
            });
            if (res.ok) {
                fetchRequests();
            } else {
                const data = await res.json();
                alert(data.error || "Failed to submit request");
            }
        } catch (error) {
            alert("Connection error");
        } finally {
            setRequesting(null);
        }
    };

    const pendingRequest = requests.find(r => r.status === 'pending');
    const isTrial = features?.subscription_type === 'trial';
    const currentPlanName = getPlanConfig(features?.subscription_type || '')?.name || features?.subscription_type;

    return (
        <>
            <CatalogAdminHeader title="Billing & Subscription" />
            <CatalogAdminContent>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-8 mb-8 sm:mb-12">
                    {/* Current Plan Card */}
                    <div className="lg:col-span-2 glass-card p-5 sm:p-8 lg:p-10 rounded-panel border border-ui-line relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-5 sm:p-8 lg:p-10 opacity-5">
                            <CreditCard className="w-40 h-40" />
                        </div>
                        <div className="relative z-10">
                            <div className="flex items-center gap-4 mb-8">
                                <div className="w-12 h-12 rounded-control bg-ui-subtle flex items-center justify-center">
                                    <Zap className="w-6 h-6 text-ui-primary fill-ui-primary" />
                                </div>
                                <div>
                                    <p className="text-xs font-semibold text-ui-muted">Active Subscription</p>
                                    <h2 className="text-2xl sm:text-3xl font-semibold text-ui-ink">
                                        {isTrial ? currentPlanName : <>{currentPlanName} <span className="text-ui-primary">Plan</span></>}
                                    </h2>
                                    {isTrial && (
                                        <p className="text-sm text-ui-muted font-medium mt-1">
                                            Your menu stays online during the trial. Request a plan below to keep it running afterwards.
                                        </p>
                                    )}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6">
                                <div className="p-4 sm:p-6 rounded-panel bg-ui-bg border border-ui-line">
                                    <p className="text-xs font-semibold text-ui-muted mb-2">Item Limit</p>
                                    <p className="text-xl font-semibold">{features?.max_items}</p>
                                </div>
                                <div className="p-4 sm:p-6 rounded-panel bg-ui-bg border border-ui-line">
                                    <p className="text-xs font-semibold text-ui-muted mb-2">Category Limit</p>
                                    <p className="text-xl font-semibold">{features?.max_categories}</p>
                                </div>
                                <div className="p-4 sm:p-6 rounded-panel bg-ui-bg border border-ui-line">
                                    <p className="text-xs font-semibold text-ui-muted mb-2">AI Engine</p>
                                    <p className="text-xl font-semibold">{features?.ai_image_enhancement_used} / {features?.ai_image_enhancement_limit}</p>
                                </div>
                                <div className="p-4 sm:p-6 rounded-panel bg-ui-bg border border-ui-line">
                                    <p className="text-xs font-semibold text-ui-muted mb-2">Status</p>
                                    {features?.is_expired ? (
                                        <span className="px-2 py-1 rounded-md bg-ui-subtle text-ui-danger text-xs font-semibold">Expired</span>
                                    ) : isTrial ? (
                                        <span className="px-2 py-1 rounded-md bg-ui-subtle text-ui-warning text-xs font-semibold">Trial</span>
                                    ) : (
                                        <span className="px-2 py-1 rounded-md bg-ui-subtle text-ui-success text-xs font-semibold">Active</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Pending Request Side Card */}
                    <div className="glass-card p-5 sm:p-8 lg:p-10 rounded-panel border border-ui-line flex flex-col justify-center">
                        {pendingRequest ? (
                            <div className="text-center">
                                <div className="w-16 h-16 rounded-full bg-orange-500/20 flex items-center justify-center mx-auto mb-6">
                                    <Clock className="w-8 h-8 text-ui-warning" />
                                </div>
                                <h3 className="text-xl font-bold mb-2">Upgrade Pending</h3>
                                <p className="text-sm text-ui-muted font-medium mb-6">
                                    Your request for the <span className="text-ui-ink font-bold">{pendingRequest.plan_name}</span> plan is being reviewed by our team.
                                </p>
                                <div className="px-4 py-2 bg-orange-500/10 border border-orange-500/20 rounded-xl text-xs font-semibold text-ui-warning">
                                    Awaiting Approval
                                </div>
                            </div>
                        ) : (
                            <div className="text-center">
                                <CheckCircle2 className="w-16 h-16 text-ui-input mx-auto mb-6" />
                                <h3 className="text-xl font-bold mb-2">System Normal</h3>
                                <p className="text-sm text-ui-muted font-medium">All infrastructure parameters are within normal range for your current plan tier.</p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="mb-8">
                    <h2 className="text-2xl font-semibold mb-2">Available <span className="text-ui-primary">Upgrades</span></h2>
                    <p className="text-ui-muted text-sm font-medium">Select a node to scale your digital presence.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-8">
                    {PLANS.map((plan) => {
                        const isCurrent = features?.subscription_type === plan.id;
                        return (
                            <div key={plan.id} className={`glass-card p-5 sm:p-8 lg:p-10 rounded-panel border transition-all ${isCurrent ? 'border-primary/50 bg-ui-subtle' : 'border-ui-line hover:border-ui-input'}`}>
                                <div className="mb-8">
                                    <h3 className="text-2xl font-semibold mb-1">{plan.name}</h3>
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-4xl font-semibold">{plan.price}</span>
                                        <span className="text-ui-muted text-sm font-medium">{plan.period}</span>
                                    </div>
                                </div>

                                <div className="space-y-4 mb-10">
                                    {plan.features.map((f, i) => (
                                        <div key={i} className="flex items-center gap-3 text-sm font-medium text-ui-muted">
                                            <div className="w-5 h-5 rounded-lg bg-ui-subtle flex items-center justify-center">
                                                <div className="w-3 h-3 text-ui-muted">
                                                    <Check className="w-full h-full" />
                                                </div>
                                            </div>
                                            {f}
                                        </div>
                                    ))}
                                </div>

                                {/* Any plan can be requested, including the current one to renew it */}
                                {isCurrent && (
                                    <p className="text-xs font-semibold text-ui-muted text-center mb-3">Current Plan</p>
                                )}
                                <button
                                    onClick={() => handleUpgradeRequest(plan.id)}
                                    disabled={!!pendingRequest || requesting === plan.id}
                                    className="w-full py-5 bg-ui-primary text-ui-primary-fg rounded-control font-semibold text-sm active:scale-95 transition-all shadow-xl flex items-center justify-center gap-2 disabled:opacity-50 disabled:scale-100"
                                >
                                    {requesting === plan.id ? <Loader2 className="w-4 h-4 animate-spin" /> : isCurrent ? "Request Renewal" : isTrial ? "Choose Plan" : "Request Plan"}
                                </button>
                            </div>
                        );
                    })}
                </div>
            </CatalogAdminContent>
        </>
    );
}
