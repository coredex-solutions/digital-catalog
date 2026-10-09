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
import { getPlanPrice } from "@/lib/plans";

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
        return "bg-ui-subtle text-ui-primary border-ui-line";
      case "enterprise":
        return "bg-ui-primary text-ui-primary-fg border-ui-primary";
      default:
        return "bg-ui-bg text-ui-muted border-ui-line";
    }
  };

  return (
    <SuperAdminShell>
      <SuperAdminHeader title="Subscriptions">
        <div className="flex items-center gap-3">
          <div className="flex bg-ui-surface border border-ui-line rounded-control p-1">
            {(["all", "active", "expiring", "expired"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${filter === f
                  ? "bg-ui-primary text-ui-primary-fg"
                  : "text-ui-muted hover:text-ui-ink"
                  }`}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ui-muted" />
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 bg-ui-surface border border-ui-input rounded-control text-ui-ink placeholder:text-ui-muted focus:outline-none focus:border-ui-primary w-48"
            />
          </div>
        </div>
      </SuperAdminHeader>

      <SuperAdminContent>
        {/* Stats Cards */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          <div className="bg-ui-surface rounded-control p-4 border border-ui-line">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-ui-subtle flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-ui-success" />
              </div>
              <div>
                <p className="text-2xl font-bold text-ui-ink">
                  {subscriptions.filter((s) => s.is_active && !isExpired(s.expires_at)).length}
                </p>
                <p className="text-sm text-ui-muted">Active</p>
              </div>
            </div>
          </div>
          <div className="bg-ui-surface rounded-control p-4 border border-ui-line">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-ui-subtle flex items-center justify-center">
                <Clock className="w-5 h-5 text-ui-warning" />
              </div>
              <div>
                <p className="text-2xl font-bold text-ui-ink">
                  {subscriptions.filter((s) => isExpiringSoon(s.expires_at)).length}
                </p>
                <p className="text-sm text-ui-muted">Expiring Soon</p>
              </div>
            </div>
          </div>
          <div className="bg-ui-surface rounded-control p-4 border border-ui-line">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-ui-subtle flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-ui-danger" />
              </div>
              <div>
                <p className="text-2xl font-bold text-ui-ink">
                  {subscriptions.filter((s) => isExpired(s.expires_at)).length}
                </p>
                <p className="text-sm text-ui-muted">Expired</p>
              </div>
            </div>
          </div>
          <div className="bg-ui-surface rounded-control p-4 border border-ui-line">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-ui-subtle flex items-center justify-center">
                <RefreshCw className="w-5 h-5 text-ui-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-ui-ink">
                  {subscriptions.filter((s) => s.auto_renew).length}
                </p>
                <p className="text-sm text-ui-muted">Auto-Renew</p>
              </div>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-ui-primary" />
          </div>
        ) : (
          <div className="bg-ui-surface rounded-panel border border-ui-line overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-ui-line">
                  <th className="text-left px-6 py-4 text-ui-muted font-medium text-sm">
                    Catalog
                  </th>
                  <th className="text-left px-6 py-4 text-ui-muted font-medium text-sm">
                    Plan
                  </th>
                  <th className="text-left px-6 py-4 text-ui-muted font-medium text-sm">
                    Price
                  </th>
                  <th className="text-left px-6 py-4 text-ui-muted font-medium text-sm">
                    Status
                  </th>
                  <th className="text-left px-6 py-4 text-ui-muted font-medium text-sm">
                    Expires
                  </th>
                  <th className="text-left px-6 py-4 text-ui-muted font-medium text-sm">
                    Remaining
                  </th>
                  <th className="text-left px-6 py-4 text-ui-muted font-medium text-sm">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredSubscriptions.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-6 py-12 text-center text-ui-muted"
                    >
                      No subscriptions found
                    </td>
                  </tr>
                ) : (
                  filteredSubscriptions.map((sub) => (
                    <tr
                      key={sub.id}
                      className="border-b border-ui-line hover:bg-ui-bg transition-colors"
                    >
                      <td className="px-6 py-4">
                        <Link
                          href={`/superadmin/catalogs/${sub.catalog_id}`}
                          className="font-medium text-ui-ink hover:text-ui-primary transition-colors"
                        >
                          {sub.catalog_name}
                        </Link>
                        <p className="text-sm text-ui-muted">/{sub.catalog_slug}</p>
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
                      <td className="px-6 py-4 text-ui-ink font-medium">
                        ${getPlanPrice(sub.subscription_type) || '—'}
                      </td>
                      <td className="px-6 py-4">
                        {isExpired(sub.expires_at) ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-ui-bg text-ui-danger border border-ui-danger">
                            <AlertTriangle className="w-3 h-3" />
                            Expired
                          </span>
                        ) : sub.is_active ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-ui-subtle text-ui-success">
                            <CheckCircle className="w-3 h-3" />
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-ui-bg text-ui-muted">
                            Inactive
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-ui-muted">
                        {formatDate(sub.expires_at)}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`font-medium ${isExpired(sub.expires_at)
                            ? "text-ui-danger"
                            : isExpiringSoon(sub.expires_at)
                              ? "text-ui-warning"
                              : "text-ui-success"
                            }`}
                        >
                          {getDaysRemaining(sub.expires_at)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <Link
                          href={`/superadmin/catalogs/${sub.catalog_id}?tab=subscription`}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-ui-subtle text-ui-primary hover:bg-ui-line transition-colors"
                        >
                          <Edit className="w-3 h-3" />
                          Manage
                        </Link>
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
