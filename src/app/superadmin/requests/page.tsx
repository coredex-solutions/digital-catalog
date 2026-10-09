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
            case "approved": return "bg-ui-subtle text-ui-success border-ui-line";
            case "rejected": return "bg-ui-bg text-ui-danger border-ui-line";
            default: return "bg-ui-bg text-ui-warning border-ui-line";
        }
    };

    return (
        <SuperAdminShell>
            <SuperAdminHeader title="Upgrade Requests">
                <div className="text-xs text-ui-muted font-medium">
                    {requests.filter(r => r.status === 'pending').length} Pending
                </div>
            </SuperAdminHeader>

            <SuperAdminContent>
                {loading ? (
                    <div className="flex items-center justify-center h-64">
                        <Loader2 className="w-8 h-8 animate-spin text-ui-primary" />
                    </div>
                ) : (
                    <div className="space-y-4">
                        {requests.length === 0 ? (
                            <div className="bg-ui-surface border border-ui-line rounded-panel p-20 text-center">
                                <Inbox className="w-12 h-12 text-ui-input mx-auto mb-4" />
                                <p className="text-ui-muted font-medium">No upgrade requests at the moment.</p>
                            </div>
                        ) : (
                            requests.map((req) => (
                                <div key={req.id} className="glass-card p-8 rounded-panel border border-ui-line flex flex-col md:flex-row items-start md:items-center justify-between gap-6 hover:border-ui-input transition-all">
                                    <div className="flex items-center gap-6">
                                        <div className={`w-14 h-14 rounded-control flex items-center justify-center ${getStatusColor(req.status)}`}>
                                            {req.status === 'pending' ? <Clock className="w-6 h-6" /> : req.status === 'approved' ? <CheckCircle className="w-6 h-6" /> : <XCircle className="w-6 h-6" />}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-3 mb-1">
                                                <h3 className="text-lg font-bold text-ui-ink">{req.catalog_name}</h3>
                                                <span className={`px-2 py-0.5 rounded-md text-xs font-semibold border ${getStatusColor(req.status)}`}>
                                                    {req.status}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-4 text-sm text-ui-muted font-medium">
                                                <Link href={`/c/${req.catalog_slug}`} target="_blank" className="flex items-center gap-1 hover:text-ui-primary transition-colors">
                                                    /{req.catalog_slug} <ExternalLink className="w-3 h-3" />
                                                </Link>
                                                <span className="w-1 h-1 rounded-full bg-ui-input" />
                                                <span>Plan: <span className="text-ui-ink">{req.plan_name}</span></span>
                                                <span className="w-1 h-1 rounded-full bg-ui-input" />
                                                <span>{new Date(req.created_at).toLocaleDateString()}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {req.status === 'pending' && (
                                        <div className="flex items-center gap-3">
                                            <button
                                                onClick={() => handleAction(req.id, 'rejected')}
                                                disabled={!!actioning}
                                                className="px-6 py-3 bg-ui-surface text-ui-muted hover:text-ui-danger rounded-control font-semibold text-sm transition-colors border border-ui-line hover:border-ui-danger disabled:opacity-50"
                                            >
                                                Reject
                                            </button>
                                            <button
                                                onClick={() => handleAction(req.id, 'approved')}
                                                disabled={!!actioning}
                                                className="px-6 py-3 bg-ui-primary text-ui-primary-fg hover:bg-ui-primary-hover rounded-control font-semibold text-sm transition-colors flex items-center gap-2 disabled:opacity-50"
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
