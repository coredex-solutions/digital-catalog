"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { SuperAdminShell } from "../_components/SuperAdminShell";
import { SuperAdminHeader, SuperAdminContent } from "../_components/SuperAdminSidebar";
import {
  CreditCard,
  Search,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Loader2,
  Clock,
  Plus,
  Edit,
  RefreshCw,
} from "lucide-react";

interface Subscription {
  id: string;
  catalog_id: string;
  catalog_name: string;
  catalog_slug: string;
  subscription_type: string;
  is_active: boolean;
  starts_at: string;
  expires_at: string | null;
  auto_renew: boolean;
}

export default function SubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "active" | "expired" | "expiring">("all");

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  const fetchSubscriptions = async () => {
    try {
      const token = localStorage.getItem("superadmin_token");
      const res = await fetch("/api/superadmin/subscriptions", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setSubscriptions(data.subscriptions || []);
      }
    } catch (error) {
      console.error("Failed to fetch subscriptions:", error);
    } finally {
      setLoading(false);
    }
  };

  const isExpiringSoon = (expiresAt: string | null) => {
    if (!expiresAt) return false;
    const days = Math.ceil(
      (new Date(expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );
    return days > 0 && days <= 30;
  };

  const isExpired = (expiresAt: string | null) => {
    if (!expiresAt) return false;
    return new Date(expiresAt) < new Date();
  };

  const getDaysRemaining = (expiresAt: string | null) => {
    if (!expiresAt) return "∞";
    const days = Math.ceil(
      (new Date(expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );
    if (days < 0) return "Expired";
    return `${days} days`;
  };

  const filteredSubscriptions = subscriptions.filter((sub) => {
    const matchesSearch =
      sub.catalog_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sub.catalog_slug.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    switch (filter) {
      case "active":
        return sub.is_active && !isExpired(sub.expires_at);
      case "expired":
        return isExpired(sub.expires_at);
      case "expiring":
        return isExpiringSoon(sub.expires_at);
      default:
        return true;
    }
  });

  const formatDate = (date: string | null) => {
    if (!date) return "Never";
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "premium":
        return "bg-amber-500/10 text-amber-400 border-amber-500/20";
      case "enterprise":
        return "bg-purple-500/10 text-purple-400 border-purple-500/20";
      default:
        return "bg-slate-500/10 text-slate-400 border-slate-500/20";
    }
  };

  return (
    <SuperAdminShell>
      <SuperAdminHeader title="Subscriptions">
        <div className="flex items-center gap-3">
          <div className="flex bg-slate-800/50 rounded-lg p-1">
            {(["all", "active", "expiring", "expired"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  filter === f
                    ? "bg-emerald-500 text-white"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/50 w-48"
            />
          </div>
        </div>
      </SuperAdminHeader>

      <SuperAdminContent>
        {/* Stats Cards */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-emerald-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">
                  {subscriptions.filter((s) => s.is_active && !isExpired(s.expires_at)).length}
                </p>
                <p className="text-sm text-slate-400">Active</p>
              </div>
            </div>
          </div>
          <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                <Clock className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">
                  {subscriptions.filter((s) => isExpiringSoon(s.expires_at)).length}
                </p>
                <p className="text-sm text-slate-400">Expiring Soon</p>
              </div>
            </div>
          </div>
          <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">
                  {subscriptions.filter((s) => isExpired(s.expires_at)).length}
                </p>
                <p className="text-sm text-slate-400">Expired</p>
              </div>
            </div>
          </div>
          <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <RefreshCw className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">
                  {subscriptions.filter((s) => s.auto_renew).length}
                </p>
                <p className="text-sm text-slate-400">Auto-Renew</p>
              </div>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
          </div>
        ) : (
          <div className="bg-slate-800/50 rounded-2xl border border-slate-700/50 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700/50">
                  <th className="text-left px-6 py-4 text-slate-400 font-medium text-sm">
                    Catalog
                  </th>
                  <th className="text-left px-6 py-4 text-slate-400 font-medium text-sm">
                    Plan
                  </th>
                  <th className="text-left px-6 py-4 text-slate-400 font-medium text-sm">
                    Status
                  </th>
                  <th className="text-left px-6 py-4 text-slate-400 font-medium text-sm">
                    Expires
                  </th>
                  <th className="text-left px-6 py-4 text-slate-400 font-medium text-sm">
                    remaining
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredSubscriptions.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-6 py-12 text-center text-slate-500"
                    >
                      No subscriptions found
                    </td>
                  </tr>
                ) : (
                  filteredSubscriptions.map((sub) => (
                    <tr
                      key={sub.id}
                      className="border-b border-slate-700/30 hover:bg-slate-700/20 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <Link
                          href={`/superadmin/catalogs/${sub.catalog_id}`}
                          className="font-medium text-white hover:text-emerald-400 transition-colors"
                        >
                          {sub.catalog_name}
                        </Link>
                        <p className="text-sm text-slate-500">/{sub.catalog_slug}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium border ${getTypeColor(
                            sub.subscription_type
                          )}`}
                        >
                          {sub.subscription_type}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {isExpired(sub.expires_at) ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-500/10 text-red-400">
                            <AlertTriangle className="w-3 h-3" />
                            Expired
                          </span>
                        ) : sub.is_active ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400">
                            <CheckCircle className="w-3 h-3" />
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-slate-500/10 text-slate-400">
                            Inactive
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-slate-400">
                        {formatDate(sub.expires_at)}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`font-medium ${
                            isExpired(sub.expires_at)
                              ? "text-red-400"
                              : isExpiringSoon(sub.expires_at)
                              ? "text-amber-400"
                              : "text-emerald-400"
                          }`}
                        >
                          {getDaysRemaining(sub.expires_at)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`font-medium ${
                            isExpired(sub.expires_at)
                              ? "text-red-400"
                              : isExpiringSoon(sub.expires_at)
                              ? "text-amber-400"
                              : "text-emerald-400"
                          }`}
                        >
                          {getDaysRemaining(sub.expires_at)}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </SuperAdminContent>
    </SuperAdminShell>
  );
}
