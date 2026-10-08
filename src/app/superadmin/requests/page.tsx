"use client";

import { useEffect, useState } from "react";
import { SuperAdminShell } from "../_components/SuperAdminShell";
import { SuperAdminHeader, SuperAdminContent } from "../_components/SuperAdminSidebar";
import {
    Inbox,
    CheckCircle,
    XCircle,
    Loader2,
    Clock,
    ExternalLink,
    MessageSquare
} from "lucide-react";
import Link from "next/link";

interface PlanRequest {
    id: string;
    catalog_id: string;
    catalog_name: string;
    catalog_slug: string;
    plan_name: string;
    status: 'pending' | 'approved' | 'rejected';
    admin_notes: string | null;
    created_at: string;
}

export default function RequestsPage() {
    const [requests, setRequests] = useState<PlanRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [actioning, setActioning] = useState<string | null>(null);

    useEffect(() => {
        fetchRequests();
    }, []);

    const fetchRequests = async () => {
        try {
            const token = localStorage.getItem("superadmin_token");
            const res = await fetch("/api/superadmin/requests", {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                const data = await res.json();
                setRequests(data.requests || []);
            }
        } catch (error) {
            console.error("Failed to fetch requests:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async (requestId: string, status: 'approved' | 'rejected') => {
        setActioning(requestId);
        try {
            const token = localStorage.getItem("superadmin_token");
            const res = await fetch("/api/superadmin/requests", {
                method: "PATCH",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ requestId, status }),
            });
            if (res.ok) {
                fetchRequests();
            }
        } catch (error) {
            console.error("Action failed:", error);
        } finally {
            setActioning(null);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case "approved": return "bg-green-500/10 text-green-400 border-green-500/20";
            case "rejected": return "bg-red-500/10 text-red-400 border-red-500/20";
            default: return "bg-orange-500/10 text-orange-400 border-orange-500/20";
        }
    };

    return (
        <SuperAdminShell>
            <SuperAdminHeader title="Upgrade Requests">
                <div className="text-xs text-white/40 font-medium uppercase tracking-widest">
                    {requests.filter(r => r.status === 'pending').length} Pending
                </div>
            </SuperAdminHeader>

            <SuperAdminContent>
                {loading ? (
                    <div className="flex items-center justify-center h-64">
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    </div>
                ) : (
                    <div className="space-y-4">
                        {requests.length === 0 ? (
                            <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-20 text-center">
                                <Inbox className="w-12 h-12 text-white/10 mx-auto mb-4" />
                                <p className="text-white/40 font-medium">No upgrade requests at the moment.</p>
                            </div>
                        ) : (
                            requests.map((req) => (
                                <div key={req.id} className="glass-card p-8 rounded-[2rem] border border-white/5 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 hover:border-white/10 transition-all">
                                    <div className="flex items-center gap-6">
                                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${getStatusColor(req.status)}`}>
                                            {req.status === 'pending' ? <Clock className="w-6 h-6" /> : req.status === 'approved' ? <CheckCircle className="w-6 h-6" /> : <XCircle className="w-6 h-6" />}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-3 mb-1">
                                                <h3 className="text-lg font-bold text-white tracking-tight">{req.catalog_name}</h3>
                                                <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-widest border ${getStatusColor(req.status)}`}>
                                                    {req.status}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-4 text-sm text-white/40 font-medium">
                                                <Link href={`/c/${req.catalog_slug}`} target="_blank" className="flex items-center gap-1 hover:text-primary transition-colors">
                                                    /{req.catalog_slug} <ExternalLink className="w-3 h-3" />
                                                </Link>
                                                <span className="w-1 h-1 rounded-full bg-white/10" />
                                                <span>Plan: <span className="text-white uppercase">{req.plan_name}</span></span>
                                                <span className="w-1 h-1 rounded-full bg-white/10" />
                                                <span>{new Date(req.created_at).toLocaleDateString()}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {req.status === 'pending' && (
                                        <div className="flex items-center gap-3">
                                            <button
                                                onClick={() => handleAction(req.id, 'rejected')}
                                                disabled={!!actioning}
                                                className="px-6 py-3 bg-white/5 text-white/60 hover:text-red-400 hover:bg-red-500/10 rounded-xl font-bold text-sm transition-all border border-transparent hover:border-red-500/20 disabled:opacity-50"
                                            >
                                                Reject
                                            </button>
                                            <button
                                                onClick={() => handleAction(req.id, 'approved')}
                                                disabled={!!actioning}
                                                className="px-6 py-3 bg-primary text-white hover:scale-105 active:scale-95 rounded-xl font-bold text-sm transition-all shadow-xl shadow-primary/20 flex items-center gap-2 disabled:opacity-50"
                                            >
                                                {actioning === req.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                                                Approve Upgrade
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                )}
            </SuperAdminContent>
        </SuperAdminShell>
    );
}
