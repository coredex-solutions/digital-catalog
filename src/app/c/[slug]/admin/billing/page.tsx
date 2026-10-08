"use client";

import { useEffect, useState } from "react";
import { useCatalogAdmin } from "../_components/CatalogAdminShell";
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

const PLANS = [
    {
        id: 'essential',
        name: 'Essential',
        price: '$99',
        period: '/yr',
        features: ['50 Products', '5 Categories', '10 AI Enhancements/mo', 'Basic Analytics']
    },
    {
        id: 'pro',
        name: 'Pro',
        price: '$299',
        period: '/yr',
        features: ['200 Products', '20 Categories', '50 AI Enhancements/mo', 'Full Analytics', 'Multi-Language']
    },
    {
        id: 'enterprise',
        name: 'Enterprise',
        price: '$399',
        period: '/yr',
        features: ['Unlimited Products', 'Unlimited Categories', '200 AI Enhancements/mo', 'Priority Support', 'Custom Domain']
    }
];

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

    return (
        <>
            <CatalogAdminHeader title="Billing & Subscription" />
            <CatalogAdminContent>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
                    {/* Current Plan Card */}
                    <div className="lg:col-span-2 glass-card p-10 rounded-[3rem] border border-white/5 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-10 opacity-5">
                            <CreditCard className="w-40 h-40" />
                        </div>
                        <div className="relative z-10">
                            <div className="flex items-center gap-4 mb-8">
                                <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center">
                                    <Zap className="w-6 h-6 text-primary fill-primary" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em]">Active Subscription</p>
                                    <h2 className="text-3xl font-black italic uppercase tracking-tighter text-white">
                                        {features?.subscription_type} <span className="text-primary not-italic">Plan</span>
                                    </h2>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                                <div className="p-6 rounded-3xl bg-white/[0.02] border border-white/5">
                                    <p className="text-[9px] font-black text-white/20 uppercase tracking-widest mb-2">Item Limit</p>
                                    <p className="text-xl font-black italic">{features?.max_items}</p>
                                </div>
                                <div className="p-6 rounded-3xl bg-white/[0.02] border border-white/5">
                                    <p className="text-[9px] font-black text-white/20 uppercase tracking-widest mb-2">Category Limit</p>
                                    <p className="text-xl font-black italic">{features?.max_categories}</p>
                                </div>
                                <div className="p-6 rounded-3xl bg-white/[0.02] border border-white/5">
                                    <p className="text-[9px] font-black text-white/20 uppercase tracking-widest mb-2">AI Engine</p>
                                    <p className="text-xl font-black italic">{features?.ai_image_enhancement_used} / {features?.ai_image_enhancement_limit}</p>
                                </div>
                                <div className="p-6 rounded-3xl bg-white/[0.02] border border-white/5">
                                    <p className="text-[9px] font-black text-white/20 uppercase tracking-widest mb-2">Status</p>
                                    <span className="px-2 py-1 rounded-md bg-green-500/10 text-green-400 text-[10px] font-black uppercase">Active</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Pending Request Side Card */}
                    <div className="glass-card p-10 rounded-[3rem] border border-white/5 flex flex-col justify-center">
                        {pendingRequest ? (
                            <div className="text-center">
                                <div className="w-16 h-16 rounded-full bg-orange-500/20 flex items-center justify-center mx-auto mb-6 animate-pulse">
                                    <Clock className="w-8 h-8 text-orange-500" />
                                </div>
                                <h3 className="text-xl font-bold mb-2 uppercase italic tracking-tighter">Upgrade Pending</h3>
                                <p className="text-sm text-white/40 font-medium mb-6">
                                    Your request for the <span className="text-white font-bold uppercase">{pendingRequest.plan_name}</span> plan is being reviewed by our team.
                                </p>
                                <div className="px-4 py-2 bg-orange-500/10 border border-orange-500/20 rounded-xl text-[10px] font-black uppercase text-orange-500 tracking-widest">
                                    Awaiting Approval
                                </div>
                            </div>
                        ) : (
                            <div className="text-center">
                                <CheckCircle2 className="w-16 h-16 text-white/10 mx-auto mb-6" />
                                <h3 className="text-xl font-bold mb-2 uppercase italic tracking-tighter">System Normal</h3>
                                <p className="text-sm text-white/40 font-medium">All infrastructure parameters are within normal range for your current plan tier.</p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="mb-8">
                    <h2 className="text-2xl font-black italic uppercase tracking-tighter mb-2">Available <span className="text-primary not-italic">Upgrades</span></h2>
                    <p className="text-white/40 text-sm font-medium">Select a node to scale your digital presence.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {PLANS.map((plan) => {
                        const isCurrent = features?.subscription_type === plan.id;
                        return (
                            <div key={plan.id} className={`glass-card p-10 rounded-[3rem] border transition-all ${isCurrent ? 'border-primary/50 bg-primary/5' : 'border-white/5 hover:border-white/20'}`}>
                                <div className="mb-8">
                                    <h3 className="text-2xl font-black italic uppercase tracking-tighter mb-1">{plan.name}</h3>
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-4xl font-black italic tracking-tighter">{plan.price}</span>
                                        <span className="text-white/40 text-sm font-medium">{plan.period}</span>
                                    </div>
                                </div>

                                <div className="space-y-4 mb-10">
                                    {plan.features.map((f, i) => (
                                        <div key={i} className="flex items-center gap-3 text-sm font-medium text-white/60">
                                            <div className="w-5 h-5 rounded-lg bg-white/5 flex items-center justify-center">
                                                <div className="w-3 h-3 text-white/40">
                                                    <Check className="w-full h-full" />
                                                </div>
                                            </div>
                                            {f}
                                        </div>
                                    ))}
                                </div>

                                {isCurrent ? (
                                    <div className="w-full py-5 bg-white/5 text-white/40 rounded-2xl font-black uppercase tracking-widest text-sm flex items-center justify-center gap-2 border border-white/5">
                                        Current Plan
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => handleUpgradeRequest(plan.id)}
                                        disabled={!!pendingRequest || requesting === plan.id}
                                        className="w-full py-5 bg-white text-black rounded-2xl font-black uppercase tracking-widest text-sm hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-white/5 flex items-center justify-center gap-2 disabled:opacity-50 disabled:scale-100"
                                    >
                                        {requesting === plan.id ? <Loader2 className="w-4 h-4 animate-spin" /> : "Request Upgrade"}
                                    </button>
                                )}
                            </div>
                        );
                    })}
                </div>
            </CatalogAdminContent>
        </>
    );
}
