"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { SuperAdminShell } from "../../_components/SuperAdminShell";
import { getPlanConfig, getPlanPrice } from "@/lib/plans";
import { SuperAdminHeader, SuperAdminContent } from "../../_components/SuperAdminSidebar";
import {
  ArrowLeft,
  ExternalLink,
  Save,
  Trash2,
  AlertTriangle,
  Loader2,
  CheckCircle,
  XCircle,
  Calendar,
  CreditCard,
  Users,
  BarChart3,
  Globe,
  Store,
  Clock,
  Key,
  ShieldAlert,
  Lock,
  Plus,
  Pencil
} from "lucide-react";

/** Keep only the menu languages the platform offers (Arabic and English), defaulting to both */
function sanitizeLanguages(value: unknown): string {
  const list = String(value || "").split(",").map((l) => l.trim());
  return ["ar", "en"].filter((l) => list.includes(l)).join(",") || "ar,en";
}

export default function CatalogDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [savingSection, setSavingSection] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [activeTab, setActiveTab] = useState<"overview" | "settings" | "subscription" | "admins">("overview");

  const [data, setData] = useState<any>(null);
  const [editForm, setEditForm] = useState<any>(null);

  // Password Reset State
  const [resetAdmin, setResetAdmin] = useState<any>(null);
  const [newPassword, setNewPassword] = useState("");
  const [resetting, setResetting] = useState(false);

  // Add/Edit Admin State
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [adminModalMode, setAdminModalMode] = useState<"add" | "edit">("add");
  const [adminForm, setAdminForm] = useState({
    id: "",
    name: "",
    email: "",
    password: "",
    role: "admin"
  });
  const [savingAdmin, setSavingAdmin] = useState(false);

  useEffect(() => {
    fetchCatalogDetails();
  }, [id]);

  const fetchCatalogDetails = async () => {
    try {
      const token = localStorage.getItem("superadmin_token");
      if (!token) return;

      const res = await fetch(`/api/superadmin/catalogs/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error("Failed to load catalog");

      const result = await res.json();
      setData(result);

      // Initialize edit form with catalog AND subscription data
      setEditForm({
        // Catalog fields
        name: result.catalog.name,
        slug: result.catalog.slug,
        business_type: result.catalog.business_type,
        description: result.catalog.description || "",
        is_suspended: result.catalog.is_suspended,
        suspension_reason: result.catalog.suspension_reason || "",

        // Subscription fields (mapped from catalog object where we joined them)
        booking_enabled: Boolean(result.catalog.booking_enabled),
        analytics_enabled: Boolean(result.catalog.analytics_enabled),
        custom_domain_enabled: Boolean(result.catalog.custom_domain_enabled),
        ai_image_enhancement_limit: result.catalog.ai_image_enhancement_limit || 0,
        max_items: result.catalog.max_items || 200,
        max_categories: result.catalog.max_categories || 20,

        // Subscription management fields
        subscription_type: result.catalog.subscription_type || "essential",
        starts_at: result.catalog.starts_at || "",
        expires_at: result.catalog.expires_at || "",
        amount_paid: result.catalog.amount_paid || "",
        payment_method: result.catalog.payment_method || "",
        payment_notes: result.catalog.payment_notes || "",

        // Settings fields
        // Menus are Arabic and English only; legacy values such as "fr" are dropped
        enabled_languages: sanitizeLanguages(result.settings?.enabled_languages),
        default_language: ["ar", "en"].includes(result.settings?.default_language)
          ? result.settings.default_language
          : sanitizeLanguages(result.settings?.enabled_languages).split(",")[0],
      });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Section-specific save handlers
  const handleSaveSection = async (section: string, fields: Record<string, any>) => {
    setSavingSection(section);
    setError("");
    setSuccessMessage("");

    try {
      const token = localStorage.getItem("superadmin_token");
      const res = await fetch(`/api/superadmin/catalogs/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(fields),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Update failed");
      }

      await fetchCatalogDetails();
      setSuccessMessage(`${section} saved successfully!`);
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSavingSection(null);
    }
  };

  const saveCatalogSettings = () => handleSaveSection("Catalog Settings", {
    name: editForm.name,
    slug: editForm.slug,
    business_type: editForm.business_type,
    ai_image_enhancement_limit: editForm.ai_image_enhancement_limit,
    max_items: editForm.max_items,
    max_categories: editForm.max_categories,
  });

  const saveFeatureAccess = () => handleSaveSection("Feature Access", {
    booking_enabled: editForm.booking_enabled,
    analytics_enabled: editForm.analytics_enabled,
    custom_domain_enabled: editForm.custom_domain_enabled,
  });

  const saveLanguageConfig = () => {
    const enabled = sanitizeLanguages(editForm.enabled_languages);
    return handleSaveSection("Language Configuration", {
      enabled_languages: enabled,
      default_language: enabled.split(",").includes(editForm.default_language) ? editForm.default_language : enabled.split(",")[0],
    });
  };

  // Admin Management
  const openAddAdmin = () => {
    setAdminForm({ id: "", name: "", email: "", password: "", role: "admin" });
    setAdminModalMode("add");
    setShowAdminModal(true);
  };

  const openEditAdmin = (admin: any) => {
    setAdminForm({ id: admin.id, name: admin.name, email: admin.email, password: "", role: admin.role });
    setAdminModalMode("edit");
    setShowAdminModal(true);
  };

  const handleSaveAdmin = async () => {
    if (!adminForm.name || !adminForm.email) {
      alert("Name and email are required");
      return;
    }
    if (adminModalMode === "add" && (!adminForm.password || adminForm.password.length < 8)) {
      alert("Password must be at least 8 characters");
      return;
    }

    setSavingAdmin(true);
    try {
      const token = localStorage.getItem("superadmin_token");
      const url = adminModalMode === "add"
        ? `/api/superadmin/catalogs/${id}/admins`
        : `/api/superadmin/catalogs/${id}/admins/${adminForm.id}`;

      const body: any = {
        name: adminForm.name,
        email: adminForm.email,
        role: adminForm.role,
      };
      if (adminForm.password) body.password = adminForm.password;

      const res = await fetch(url, {
        method: adminModalMode === "add" ? "POST" : "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to save admin");
      }

      await fetchCatalogDetails();
      setShowAdminModal(false);
      setSuccessMessage(adminModalMode === "add" ? "Admin added successfully!" : "Admin updated successfully!");
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSavingAdmin(false);
    }
  };

  const handleDeleteAdmin = async (adminId: string) => {
    if (!confirm("Are you sure you want to remove this admin?")) return;

    try {
      const token = localStorage.getItem("superadmin_token");
      const res = await fetch(`/api/superadmin/catalogs/${id}/admins/${adminId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to delete admin");
      }

      await fetchCatalogDetails();
      setSuccessMessage("Admin removed successfully!");
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDelete = async () => {
    if (!confirm("DANGER: This will permanently delete the catalog and all its data. Are you sure?")) return;

    try {
      const token = localStorage.getItem("superadmin_token");
      const res = await fetch(`/api/superadmin/catalogs/${id}?hard=true`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error("Deletion failed");

      router.push("/superadmin/catalogs");
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleResetPassword = async () => {
    if (!newPassword || newPassword.length < 8) {
      alert("Password must be at least 8 characters long");
      return;
    }

    setResetting(true);
    try {
      const token = localStorage.getItem("superadmin_token");
      const res = await fetch(`/api/superadmin/catalogs/${id}/admins/${resetAdmin.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ password: newPassword }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Reset failed");
      }

      alert("Password reset successfully!");
      setResetAdmin(null);
      setNewPassword("");
    } catch (err: any) {
      alert(err.message);
    } finally {
      setResetting(false);
    }
  };

  if (loading) {
    return (
      <SuperAdminShell>
        <div className="flex items-center justify-center h-screen -mt-20">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-ui-line border-t-ui-primary rounded-full animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-8 h-8 bg-ui-bg rounded-full" />
            </div>
          </div>
        </div>
      </SuperAdminShell>
    );
  }

  if (!data) return null;

  const { catalog, admins, analytics, counts } = data;

  return (
    <SuperAdminShell>
      <SuperAdminHeader title={catalog.name}>
        <div className="flex items-center gap-4">
          <Link
            href="/superadmin/catalogs"
            className="group flex items-center gap-2 px-3 py-1.5 text-ui-muted hover:text-ui-ink transition-colors bg-ui-surface border border-ui-line rounded-control text-sm font-medium"
          >
            <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
            Back
          </Link>
          <div className="h-6 w-px bg-ui-line" />
          <Link
            href={`/c/${catalog.slug}`}
            target="_blank"
            className="flex items-center gap-2 px-4 py-2 bg-ui-primary text-ui-primary-fg hover:bg-ui-primary-hover rounded-control transition-colors text-sm font-semibold"
          >
            <ExternalLink className="w-4 h-4" />
            Open menu
          </Link>
        </div>
      </SuperAdminHeader>

      <SuperAdminContent>
        {/* Top Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="glass p-5 rounded-panel border border-ui-line">
            <p className="text-ui-muted text-xs font-bold mb-3">Status</p>
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${catalog.is_suspended ? 'bg-ui-bg text-ui-danger' : 'bg-ui-subtle text-ui-success'}`}>
                {catalog.is_suspended ? <XCircle className="w-5 h-5" /> : <CheckCircle className="w-5 h-5" />}
              </div>
              <span className={`text-xl font-bold ${catalog.is_suspended ? "text-ui-danger" : "text-ui-ink"}`}>
                {catalog.is_suspended ? "Suspended" : "Active"}
              </span>
            </div>
          </div>

          <div className="glass p-5 rounded-panel border border-ui-line">
            <p className="text-ui-muted text-xs font-bold mb-3">Plan</p>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-ui-subtle text-ui-primary flex items-center justify-center">
                <CreditCard className="w-5 h-5" />
              </div>
              <span className="text-lg font-semibold text-ui-ink capitalize">
                {catalog.subscription_type?.replace("_", " ")}
              </span>
            </div>
          </div>

          <div className="glass p-5 rounded-panel border border-ui-line">
            <p className="text-ui-muted text-xs font-bold mb-3">Monthly Views</p>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-ui-subtle text-ui-primary flex items-center justify-center">
                <BarChart3 className="w-5 h-5" />
              </div>
              <span className="text-2xl font-bold text-ui-ink">
                {analytics?.total_views?.toLocaleString() || 0}
              </span>
            </div>
          </div>

          <div className="glass p-5 rounded-panel border border-ui-line">
            <p className="text-ui-muted text-xs font-bold mb-3">Product Count</p>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-ui-subtle text-ui-primary flex items-center justify-center">
                <Store className="w-5 h-5" />
              </div>
              <span className="text-2xl font-bold text-ui-ink">{counts?.items || 0}</span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-8 border-b border-ui-line mb-8">
          {[
            { id: "overview", label: "Overview" },
            { id: "subscription", label: "Subscription" },
            { id: "settings", label: "Settings" },
            { id: "admins", label: "Admins" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`pb-4 px-1 text-sm font-semibold transition-colors relative ${activeTab === tab.id ? "text-ui-primary" : "text-ui-muted hover:text-ui-ink"
                }`}
            >
              {tab.label}
              {activeTab === tab.id && (
                <div className="absolute bottom-0 left-0 w-full h-0.5 bg-ui-primary rounded-t-full" />
              )}
            </button>
          ))}
        </div>

        {/* TAB: OVERVIEW */}
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-6">
              <div className="glass rounded-panel p-8 border border-ui-line">
                <h3 className="text-lg font-semibold text-ui-ink mb-6">Details</h3>
                <div className="space-y-1">
                  <div className="flex justify-between py-4 border-b border-ui-line">
                    <span className="text-ui-muted font-medium">Created On</span>
                    <span className="text-ui-ink font-bold">{new Date(catalog.created_at).toLocaleDateString(undefined, { dateStyle: 'long' })}</span>
                  </div>
                  <div className="flex justify-between py-4 border-b border-ui-line">
                    <span className="text-ui-muted font-medium">Expires On</span>
                    <span className="text-ui-ink font-bold">
                      {catalog.expires_at ? new Date(catalog.expires_at).toLocaleDateString(undefined, { dateStyle: 'long' }) : "Unlimited"}
                    </span>
                  </div>
                  <div className="flex justify-between py-4 border-b border-ui-line">
                    <span className="text-ui-muted font-medium">Categories</span>
                    <span className="text-ui-ink font-bold">{counts?.categories || 0}</span>
                  </div>
                  <div className="flex justify-between py-4">
                    <span className="text-ui-muted font-medium">Branches</span>
                    <span className="text-ui-ink font-bold">{counts?.branches || 0}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="glass rounded-panel p-8 border border-ui-line">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-control bg-ui-subtle flex items-center justify-center text-ui-primary">
                    <Lock className="w-5 h-5" />
                  </div>
                  <h3 className="text-lg font-semibold text-ui-ink">Enabled Features</h3>
                </div>
                <div className="space-y-3">
                  {[
                    { flag: catalog.booking_enabled, label: "Booking System", icon: Calendar },
                    { flag: catalog.analytics_enabled, label: "Detailed Analytics", icon: BarChart3 }
                  ].map((feat, i) => (
                    <div key={i} className="flex items-center justify-between p-4 bg-ui-bg border border-ui-line rounded-control">
                      <div className="flex items-center gap-4">
                        <feat.icon className="w-5 h-5 text-ui-muted" />
                        <span className="text-ui-ink font-medium">{feat.label}</span>
                      </div>
                      {feat.flag ? (
                        <div className="px-3 py-1 rounded-full bg-ui-subtle text-ui-success text-xs font-bold border border-ui-line">Enabled</div>
                      ) : (
                        <div className="px-3 py-1 rounded-full bg-ui-bg text-ui-muted text-xs font-bold border border-ui-line">Off</div>
                      )}
                    </div>
                  ))}

                  {/* AI Usage Display */}
                  <div className="mt-6 p-6 border border-ui-line rounded-panel">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-ui-subtle flex items-center justify-center text-ui-primary">
                          <BarChart3 className="w-4 h-4" />
                        </div>
                        <p className="text-ui-ink font-bold text-sm">AI Image Enhancement</p>
                      </div>
                      <span className="text-xs font-semibold text-ui-primary">Monthly Credits</span>
                    </div>

                    <div className="space-y-3">
                      <div className="flex justify-between items-end">
                        <p className="text-2xl font-semibold text-ui-ink leading-none">
                          {catalog.ai_image_enhancement_used || 0}
                          <span className="text-ui-muted text-sm font-bold ml-1">/ {catalog.ai_image_enhancement_limit || 10}</span>
                        </p>
                        <p className="text-xs font-bold text-ui-muted">
                          {Math.round(((catalog.ai_image_enhancement_used || 0) / (catalog.ai_image_enhancement_limit || 10)) * 100)}% Used
                        </p>
                      </div>
                      <div className="h-2 w-full bg-ui-line rounded-full overflow-hidden">
                        <div
                          className="h-full bg-ui-primary transition-all duration-1000"
                          style={{ width: `${Math.min(100, ((catalog.ai_image_enhancement_used || 0) / (catalog.ai_image_enhancement_limit || 10)) * 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB: SUBSCRIPTION */}
        {activeTab === "subscription" && (
          <div className="space-y-6">
            {/* Success/Error Messages */}
            {successMessage && (
              <div className="p-4 bg-ui-subtle border border-ui-line rounded-control text-ui-success text-sm font-bold flex items-center gap-3 animate-in slide-in-from-top">
                <CheckCircle className="w-5 h-5" />
                {successMessage}
              </div>
            )}
            {error && (
              <div className="p-4 bg-ui-surface border border-ui-danger rounded-control text-ui-danger text-sm font-bold flex items-center gap-3">
                <XCircle className="w-5 h-5" />
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Plan & Status */}
              <div className="glass rounded-panel p-8 border border-ui-line">
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-10 h-10 rounded-control bg-ui-subtle flex items-center justify-center text-ui-primary">
                    <CreditCard className="w-5 h-5" />
                  </div>
                  <h3 className="text-lg font-semibold text-ui-ink">Plan & Status</h3>
                </div>

                <div className="space-y-6">
                  {/* Plan Selection */}
                  <div>
                    <label className="block text-sm font-medium text-ui-ink mb-2">Subscription Plan</label>
                    <select
                      value={editForm.subscription_type}
                      onChange={(e) => {
                        const plan = e.target.value;
                        // Auto-apply plan defaults (from lib/plans.ts) including price
                        const config = getPlanConfig(plan);
                        const planSettings = config ? { ...config.limits } : {};
                        setEditForm({
                          ...editForm,
                          subscription_type: plan,
                          ...planSettings,
                          amount_paid: config?.price || editForm.amount_paid
                        });
                      }}
                      className="w-full px-5 py-4 bg-ui-surface border border-ui-input rounded-control text-ui-ink focus:outline-none focus:border-ui-primary focus:ring-2 focus:ring-ui-primary transition-all appearance-none cursor-pointer font-bold"
                    >
                      <option value="trial">Free Trial</option>
                      <option value="essential">Essential</option>
                      <option value="pro">Pro</option>
                      <option value="enterprise">Enterprise</option>
                      <option value="yearly">Yearly (Legacy)</option>
                      <option value="forever">Forever (Legacy)</option>
                      <option value="custom_years">Custom Years (Legacy)</option>
                    </select>
                  </div>

                  {/* Status Badge */}
                  <div className="p-4 bg-ui-bg rounded-control border border-ui-line">
                    <div className="flex items-center justify-between">
                      <span className="text-ui-muted text-sm font-medium">Current Status</span>
                      {(() => {
                        const expiresAt = catalog.expires_at ? new Date(catalog.expires_at) : null;
                        const now = new Date();
                        const daysRemaining = expiresAt ? Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : null;

                        if (!expiresAt) {
                          return <span className="px-3 py-1 rounded-full bg-ui-subtle text-ui-primary text-xs font-bold">Forever Active</span>;
                        } else if (daysRemaining && daysRemaining < 0) {
                          return <span className="px-3 py-1 rounded-full bg-ui-bg border border-ui-danger text-ui-danger text-xs font-bold">Expired</span>;
                        } else if (daysRemaining && daysRemaining <= 30) {
                          return <span className="px-3 py-1 rounded-full bg-ui-bg border border-ui-line text-ui-warning text-xs font-bold">Expiring Soon ({daysRemaining} days)</span>;
                        } else {
                          return <span className="px-3 py-1 rounded-full bg-ui-subtle text-ui-success text-xs font-bold">Active ({daysRemaining} days)</span>;
                        }
                      })()}
                    </div>
                  </div>

                  {/* Subscription Dates */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-ui-ink mb-2">Start Date</label>
                      <input
                        type="date"
                        value={editForm.starts_at ? editForm.starts_at.split('T')[0] : ''}
                        onChange={(e) => setEditForm({ ...editForm, starts_at: e.target.value })}
                        className="w-full px-5 py-4 bg-ui-surface border border-ui-input rounded-control text-ui-ink focus:outline-none focus:border-ui-primary focus:ring-2 focus:ring-ui-primary transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-ui-ink mb-2">Expiry Date</label>
                      <input
                        type="date"
                        value={editForm.expires_at ? editForm.expires_at.split('T')[0] : ''}
                        onChange={(e) => setEditForm({ ...editForm, expires_at: e.target.value || null })}
                        className="w-full px-5 py-4 bg-ui-surface border border-ui-input rounded-control text-ui-ink focus:outline-none focus:border-ui-primary focus:ring-2 focus:ring-ui-primary transition-all"
                      />
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        const currentExpiry = editForm.expires_at ? new Date(editForm.expires_at) : new Date();
                        currentExpiry.setFullYear(currentExpiry.getFullYear() + 1);
                        setEditForm({ ...editForm, expires_at: currentExpiry.toISOString().split('T')[0] });
                      }}
                      className="flex-1 py-3 bg-ui-surface text-ui-primary font-semibold rounded-control hover:bg-ui-subtle transition-all text-sm border border-ui-line"
                    >
                      + Extend 1 Year
                    </button>
                    <button
                      onClick={() => setEditForm({ ...editForm, expires_at: null })}
                      className="flex-1 py-3 bg-ui-surface text-ui-primary font-semibold rounded-control hover:bg-ui-subtle transition-all text-sm border border-ui-line"
                    >
                      Set as Forever
                    </button>
                  </div>
                </div>

                {/* Save Plan Button */}
                <div className="pt-6 mt-6 border-t border-ui-line">
                  <button
                    onClick={() => handleSaveSection("Plan & Dates", {
                      subscription_type: editForm.subscription_type,
                      starts_at: editForm.starts_at,
                      expires_at: editForm.expires_at,
                    })}
                    disabled={savingSection === "Plan & Dates"}
                    className="w-full py-3 bg-ui-primary text-ui-primary-fg hover:bg-ui-primary-hover font-semibold rounded-control disabled:opacity-50 transition-all flex items-center justify-center gap-2 text-sm"
                  >
                    {savingSection === "Plan & Dates" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Save Plan & Dates
                  </button>
                </div>
              </div>

              {/* Limits */}
              <div className="glass rounded-panel p-8 border border-ui-line">
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-10 h-10 rounded-control bg-ui-subtle flex items-center justify-center text-ui-primary">
                    <Store className="w-5 h-5" />
                  </div>
                  <h3 className="text-lg font-semibold text-ui-ink">Plan Limits</h3>
                </div>

                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-ui-ink mb-2">Max Products</label>
                      <input
                        type="number"
                        value={editForm.max_items}
                        onChange={(e) => setEditForm({ ...editForm, max_items: parseInt(e.target.value) || 0 })}
                        className="w-full px-5 py-4 bg-ui-surface border border-ui-input rounded-control text-ui-ink focus:outline-none focus:border-ui-primary focus:ring-2 focus:ring-ui-primary transition-all font-bold text-xl"
                      />
                      <p className="text-xs text-ui-muted mt-2 ml-1">Currently using: {counts?.items || 0}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-ui-ink mb-2">Max Categories</label>
                      <input
                        type="number"
                        value={editForm.max_categories}
                        onChange={(e) => setEditForm({ ...editForm, max_categories: parseInt(e.target.value) || 0 })}
                        className="w-full px-5 py-4 bg-ui-surface border border-ui-input rounded-control text-ui-ink focus:outline-none focus:border-ui-primary focus:ring-2 focus:ring-ui-primary transition-all font-bold text-xl"
                      />
                      <p className="text-xs text-ui-muted mt-2 ml-1">Currently using: {counts?.categories || 0}</p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-ui-ink mb-2">AI Enhancement Limit (Monthly)</label>
                    <input
                      type="number"
                      value={editForm.ai_image_enhancement_limit}
                      onChange={(e) => setEditForm({ ...editForm, ai_image_enhancement_limit: parseInt(e.target.value) || 0 })}
                      className="w-full px-5 py-4 bg-ui-surface border border-ui-input rounded-control text-ui-ink focus:outline-none focus:border-ui-primary focus:ring-2 focus:ring-ui-primary transition-all font-bold text-xl"
                    />
                    <p className="text-xs text-ui-muted mt-2 ml-1">Used this month: {catalog.ai_image_enhancement_used || 0}</p>
                  </div>
                </div>

                {/* Save Limits Button */}
                <div className="pt-6 mt-6 border-t border-ui-line">
                  <button
                    onClick={() => handleSaveSection("Limits", {
                      max_items: editForm.max_items,
                      max_categories: editForm.max_categories,
                      ai_image_enhancement_limit: editForm.ai_image_enhancement_limit,
                    })}
                    disabled={savingSection === "Limits"}
                    className="w-full py-3 bg-ui-primary text-ui-primary-fg hover:bg-ui-primary-hover font-semibold rounded-control disabled:opacity-50 transition-all flex items-center justify-center gap-2 text-sm"
                  >
                    {savingSection === "Limits" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Save Limits
                  </button>
                </div>
              </div>

              {/* Payment Recording */}
              <div className="lg:col-span-2 glass rounded-panel p-8 border border-ui-line">
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-10 h-10 rounded-control bg-ui-subtle flex items-center justify-center text-ui-success">
                    <CreditCard className="w-5 h-5" />
                  </div>
                  <h3 className="text-lg font-semibold text-ui-ink">Payment Record</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-ui-ink mb-2">Amount Paid</label>
                    <div className="relative">
                      <span className="absolute left-5 top-1/2 -translate-y-1/2 text-ui-muted font-bold">$</span>
                      <input
                        type="number"
                        value={editForm.amount_paid}
                        onChange={(e) => setEditForm({ ...editForm, amount_paid: e.target.value })}
                        className="w-full pl-10 pr-5 py-4 bg-ui-surface border border-ui-input rounded-control text-ui-ink focus:outline-none focus:border-ui-primary focus:ring-2 focus:ring-ui-primary transition-all font-bold text-xl"
                        placeholder="0"
                      />
                    </div>
                    <p className="text-xs text-ui-muted mt-2 ml-1">
                      Plan price: ${
                        getPlanPrice(editForm.subscription_type as string) || '—'
                      }/year
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-ui-ink mb-2">Payment Method</label>
                    <select
                      value={editForm.payment_method}
                      onChange={(e) => setEditForm({ ...editForm, payment_method: e.target.value })}
                      className="w-full px-5 py-4 bg-ui-surface border border-ui-input rounded-control text-ui-ink focus:outline-none focus:border-ui-primary focus:ring-2 focus:ring-ui-primary transition-all appearance-none cursor-pointer"
                    >
                      <option value="">Select method...</option>
                      <option value="cash">Cash</option>
                      <option value="bank_transfer">Bank Transfer</option>
                      <option value="whatsapp_pay">WhatsApp Pay</option>
                      <option value="credit_card">Credit Card</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-ui-ink mb-2">Payment Notes</label>
                    <input
                      type="text"
                      value={editForm.payment_notes}
                      onChange={(e) => setEditForm({ ...editForm, payment_notes: e.target.value })}
                      className="w-full px-5 py-4 bg-ui-surface border border-ui-input rounded-control text-ui-ink focus:outline-none focus:border-ui-primary focus:ring-2 focus:ring-ui-primary transition-all"
                      placeholder="Receipt #, date, etc."
                    />
                  </div>
                </div>

                {/* Save Payment Button */}
                <div className="pt-6 mt-6 border-t border-ui-line">
                  <button
                    onClick={() => handleSaveSection("Payment", {
                      amount_paid: parseFloat(editForm.amount_paid) || null,
                      payment_method: editForm.payment_method,
                      payment_notes: editForm.payment_notes,
                    })}
                    disabled={savingSection === "Payment"}
                    className="w-full py-3 bg-ui-primary text-ui-primary-fg hover:bg-ui-primary-hover font-semibold rounded-control disabled:opacity-50 transition-all flex items-center justify-center gap-2 text-sm"
                  >
                    {savingSection === "Payment" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Record Payment
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB: SETTINGS */}
        {activeTab === "settings" && (
          <div className="space-y-6">
            {/* Success/Error Messages */}
            {successMessage && (
              <div className="p-4 bg-ui-subtle border border-ui-line rounded-control text-ui-success text-sm font-bold flex items-center gap-3 animate-in slide-in-from-top">
                <CheckCircle className="w-5 h-5" />
                {successMessage}
              </div>
            )}
            {error && (
              <div className="p-4 bg-ui-surface border border-ui-danger rounded-control text-ui-danger text-sm font-bold flex items-center gap-3">
                <XCircle className="w-5 h-5" />
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="glass rounded-panel p-8 border border-ui-line h-fit">
                <h3 className="text-lg font-semibold text-ui-ink mb-8">Catalog Settings</h3>

                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-ui-ink mb-2">Catalog Name</label>
                    <input
                      type="text"
                      value={editForm.name}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      className="w-full px-5 py-4 bg-ui-surface border border-ui-input rounded-control text-ui-ink placeholder:text-ui-muted focus:outline-none focus:border-ui-primary focus:ring-2 focus:ring-ui-primary transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-ui-ink mb-2">URL Slug</label>
                    <div className="relative">
                      <span className="absolute left-5 top-1/2 -translate-y-1/2 text-ui-muted font-bold">/c/</span>
                      <input
                        type="text"
                        value={editForm.slug}
                        onChange={(e) => setEditForm({ ...editForm, slug: e.target.value })}
                        className="w-full pl-12 pr-5 py-4 bg-ui-surface border border-ui-input rounded-control text-ui-ink placeholder:text-ui-muted focus:outline-none focus:border-ui-primary focus:ring-2 focus:ring-ui-primary transition-all font-mono text-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-ui-ink mb-2">Business Category</label>
                    <select
                      value={editForm.business_type}
                      onChange={(e) => setEditForm({ ...editForm, business_type: e.target.value })}
                      className="w-full px-5 py-4 bg-ui-surface border border-ui-input rounded-control text-ui-ink focus:outline-none focus:border-ui-primary focus:ring-2 focus:ring-ui-primary transition-all appearance-none cursor-pointer"
                    >
                      <option value="restaurant">Restaurant</option>
                      <option value="cafe">Cafe</option>
                      <option value="retail">Retail</option>
                      <option value="salon">Salon</option>
                      <option value="bakery">Bakery</option>
                      <option value="supermarket">Supermarket</option>
                      <option value="gym">Gym / Fitness</option>
                      <option value="medical">Medical / Clinic</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div className="pt-4 border-t border-ui-line grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-ui-ink mb-2">Max Products</label>
                      <input
                        type="number"
                        value={editForm.max_items}
                        onChange={(e) => setEditForm({ ...editForm, max_items: parseInt(e.target.value) || 0 })}
                        className="w-full px-5 py-4 bg-ui-surface border border-ui-input rounded-control text-ui-ink focus:outline-none focus:border-ui-primary focus:ring-2 focus:ring-ui-primary transition-all font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-ui-ink mb-2">Max Categories</label>
                      <input
                        type="number"
                        value={editForm.max_categories}
                        onChange={(e) => setEditForm({ ...editForm, max_categories: parseInt(e.target.value) || 0 })}
                        className="w-full px-5 py-4 bg-ui-surface border border-ui-input rounded-control text-ui-ink focus:outline-none focus:border-ui-primary focus:ring-2 focus:ring-ui-primary transition-all font-bold"
                      />
                    </div>
                  </div>

                  <div className="pt-4 border-t border-ui-line">
                    <label className="block text-sm font-medium text-ui-ink mb-2">AI Enhancement Limit</label>
                    <input
                      type="number"
                      value={editForm.ai_image_enhancement_limit}
                      onChange={(e) => setEditForm({ ...editForm, ai_image_enhancement_limit: parseInt(e.target.value) || 0 })}
                      className="w-full px-5 py-4 bg-ui-surface border border-ui-input rounded-control text-ui-ink placeholder:text-ui-muted focus:outline-none focus:border-ui-primary focus:ring-2 focus:ring-ui-primary transition-all font-bold text-xl"
                    />
                    <p className="text-xs text-ui-muted mt-3 ml-1">Number of monthly professional image enhancements allowed.</p>
                  </div>

                  {/* Section Save Button */}
                  <div className="pt-6 border-t border-ui-line">
                    <button
                      onClick={saveCatalogSettings}
                      disabled={savingSection === "Catalog Settings"}
                      className="w-full py-3 bg-ui-primary text-ui-primary-fg hover:bg-ui-primary-hover font-semibold rounded-control disabled:opacity-50 transition-all flex items-center justify-center gap-2 text-sm"
                    >
                      {savingSection === "Catalog Settings" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                      Save Catalog Settings
                    </button>
                  </div>
                </div>
              </div>

              <div className="glass rounded-panel p-8 border border-ui-line h-fit flex flex-col">
                <h3 className="text-lg font-semibold text-ui-ink mb-2">Feature Access</h3>
                <p className="text-ui-muted text-sm mb-8 font-medium">Turn features on or off for this catalog.</p>

                <div className="space-y-3">
                  {[
                    { key: "booking_enabled", label: "Booking System", desc: "Enable table or appointment bookings" },
                    { key: "analytics_enabled", label: "Detailed Analytics", desc: "Track visitor behavior and clicks" },
                    { key: "custom_domain_enabled", label: "Custom Domain", desc: "Use a custom website address" },
                  ].map((feature) => (
                    <div key={feature.key} className="flex items-center justify-between p-4 bg-ui-surface border border-ui-line rounded-control hover:bg-ui-subtle transition-colors">
                      <div>
                        <p className="text-ui-ink font-bold text-sm">{feature.label}</p>
                        <p className="text-xs text-ui-muted font-bold">{feature.desc}</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          className="sr-only peer"
                          aria-label={feature.label}
                          checked={!!editForm[feature.key]}
                          onChange={(e) => setEditForm({ ...editForm, [feature.key]: e.target.checked })}
                        />
                        <div className="w-11 h-6 bg-ui-line rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-ui-primary shadow-inner"></div>
                      </label>
                    </div>
                  ))}
                </div>

                {/* Languages Selection (Conditional) */}
                <div className="mt-8 pt-8 border-t border-ui-line space-y-6">
                  <h4 className="text-sm font-bold text-ui-ink">Language Configuration</h4>

                  <div className="space-y-4">
                    <p id="enabled-languages-label" className="block text-sm font-medium text-ui-ink">Enabled Languages</p>
                    <div role="group" aria-labelledby="enabled-languages-label" className="grid grid-cols-2 gap-3">
                      {[
                        { code: "en", label: "English" },
                        { code: "ar", label: "Arabic" },
                      ].map((l) => {
                        const langs = editForm.enabled_languages.split(",").filter(Boolean);
                        const isEnabled = langs.includes(l.code);
                        return (
                          <button
                            key={l.code}
                            type="button"
                            aria-pressed={isEnabled}
                            onClick={() => {
                              let newLangs = [...langs];
                              if (isEnabled) {
                                // Can only remove if there's more than 1 language and it's not the default
                                if (newLangs.length > 1 && l.code !== editForm.default_language) {
                                  newLangs = newLangs.filter(c => c !== l.code);
                                }
                              } else {
                                newLangs.push(l.code);
                              }
                              setEditForm({ ...editForm, enabled_languages: newLangs.join(",") });
                            }}
                            className={`py-3 rounded-control border font-bold text-xs transition-all ${isEnabled
                              ? "bg-ui-subtle border-ui-primary text-ui-primary"
                              : "bg-ui-surface border-ui-line text-ui-muted hover:text-ui-ink"
                              }`}
                          >
                            {l.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <label htmlFor="catalog-default-language" className="block text-sm font-medium text-ui-ink mb-2">Primary Language</label>
                    <select
                      id="catalog-default-language"
                      value={editForm.default_language}
                      onChange={(e) => setEditForm({ ...editForm, default_language: e.target.value })}
                      className="w-full px-5 py-4 bg-ui-surface border border-ui-input rounded-control text-ui-ink focus:outline-none focus:border-ui-primary focus:ring-2 focus:ring-ui-primary transition-all appearance-none cursor-pointer"
                    >
                      {editForm.enabled_languages.split(",").filter(Boolean).map((code: string) => (
                        <option key={code} value={code}>
                          {code === "ar" ? "Arabic" : "English"}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Section Save Button for Features */}
                <div className="mt-8 pt-6 border-t border-ui-line">
                  <button
                    onClick={saveFeatureAccess}
                    disabled={savingSection === "Feature Access"}
                    className="w-full py-3 bg-ui-primary text-ui-primary-fg hover:bg-ui-primary-hover font-semibold rounded-control disabled:opacity-50 transition-all flex items-center justify-center gap-2 text-sm"
                  >
                    {savingSection === "Feature Access" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Save Feature Access
                  </button>
                </div>

                {/* Section Save Button for Languages */}
                <div className="mt-8 pt-6 border-t border-ui-line">
                  <button
                    onClick={saveLanguageConfig}
                    disabled={savingSection === "Language Configuration"}
                    className="w-full py-3 bg-ui-primary text-ui-primary-fg hover:bg-ui-primary-hover font-semibold rounded-control disabled:opacity-50 transition-all flex items-center justify-center gap-2 text-sm"
                  >
                    {savingSection === "Language Configuration" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Globe className="w-4 h-4" />}
                    Save Language Config
                  </button>
                </div>
              </div>

              <div className="lg:col-span-2 pt-10 mt-4">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-8 h-8 rounded-control bg-ui-bg border border-ui-line flex items-center justify-center text-ui-danger">
                    <ShieldAlert className="w-4 h-4" />
                  </div>
                  <h4 className="text-ui-ink font-bold">Danger Zone</h4>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center justify-between glass border border-ui-line p-6 rounded-panel">
                    <div>
                      <p className="text-ui-ink font-bold">Catalog Visibility</p>
                      <p className="text-ui-muted text-xs font-bold">Disable or enable public access</p>
                    </div>
                    <button
                      onClick={() => handleSaveSection("Visibility", { is_suspended: !editForm.is_suspended })}
                      disabled={savingSection === "Visibility"}
                      className={`px-6 py-2 rounded-control text-sm font-semibold transition-colors ${editForm.is_suspended
                        ? "bg-ui-primary text-ui-primary-fg hover:bg-ui-primary-hover"
                        : "bg-ui-surface text-ui-danger border border-ui-danger hover:bg-ui-bg"
                        }`}
                    >
                      {savingSection === "Visibility" ? <Loader2 className="w-4 h-4 animate-spin" /> : (editForm.is_suspended ? "Activate" : "Suspend")}
                    </button>
                  </div>

                  <div className="flex items-center justify-between glass border border-ui-line p-6 rounded-panel hover:border-ui-danger transition-colors group/del">
                    <div>
                      <p className="text-ui-ink group-hover/del:text-ui-danger font-bold transition-colors">Delete Catalog</p>
                      <p className="text-ui-muted text-xs font-bold">Permanently remove all data</p>
                    </div>
                    <button
                      onClick={handleDelete}
                      aria-label="Delete catalog"
                      className="p-3 rounded-control bg-ui-surface text-ui-danger hover:bg-ui-danger hover:text-white transition-all border border-ui-line"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="mt-8 bg-ui-surface border border-ui-danger rounded-control px-5 py-4 text-ui-danger text-sm font-medium flex items-center gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-ui-danger" />
                    {error}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB: ADMINS */}
        {activeTab === "admins" && (
          <div className="glass rounded-panel border border-ui-line overflow-hidden">
            <div className="p-8 border-b border-ui-line flex justify-between items-center bg-ui-bg">
              <div>
                <h3 className="text-lg font-semibold text-ui-ink">Admins</h3>
                <p className="text-xs text-ui-muted font-medium mt-1">{admins.length} Total Users</p>
              </div>
              <button
                onClick={openAddAdmin}
                className="flex items-center gap-2 px-4 py-2.5 bg-ui-primary text-ui-primary-fg hover:bg-ui-primary-hover font-semibold rounded-control transition-colors text-sm"
              >
                <Plus className="w-4 h-4" />
                Add Admin
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="text-ui-muted text-xs font-bold bg-ui-bg">
                  <tr>
                    <th className="px-8 py-5">Name</th>
                    <th className="px-8 py-5">Contact</th>
                    <th className="px-8 py-5">Role</th>
                    <th className="px-8 py-5">Activity</th>
                    <th className="px-8 py-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ui-line">
                  {admins.map((admin: any) => (
                    <tr key={admin.id} className="group hover:bg-ui-subtle transition-colors">
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-ui-subtle text-ui-primary flex items-center justify-center font-bold border border-ui-line">
                            {admin.name.charAt(0)}
                          </div>
                          <span className="text-ui-ink font-bold">{admin.name}</span>
                        </div>
                      </td>
                      <td className="px-8 py-6 text-ui-muted font-medium">{admin.email}</td>
                      <td className="px-8 py-6">
                        <span className="px-3 py-1 rounded-full bg-ui-subtle text-ui-muted text-xs font-bold border border-ui-line">
                          {admin.role}
                        </span>
                      </td>
                      <td className="px-8 py-6 text-ui-muted text-sm">
                        {admin.last_login ? new Date(admin.last_login).toLocaleDateString(undefined, { dateStyle: 'medium' }) : "Never logged in"}
                      </td>
                      <td className="px-8 py-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openEditAdmin(admin)}
                            className="p-2 min-w-11 min-h-11 inline-flex items-center justify-center rounded-control bg-ui-surface text-ui-muted hover:bg-ui-subtle hover:text-ui-ink transition-all border border-ui-line"
                            title="Edit Admin"
                            aria-label={`Edit admin ${admin.email}`}
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setResetAdmin(admin)}
                            className="p-2 min-w-11 min-h-11 inline-flex items-center justify-center rounded-control bg-ui-surface text-ui-primary hover:bg-ui-primary hover:text-ui-primary-fg transition-all border border-ui-line"
                            title="Reset Password"
                            aria-label={`Reset password for ${admin.email}`}
                          >
                            <Key className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteAdmin(admin.id)}
                            className="p-2 min-w-11 min-h-11 inline-flex items-center justify-center rounded-control bg-ui-surface text-ui-danger hover:bg-ui-danger hover:text-white transition-all border border-ui-line"
                            title="Remove Admin"
                            aria-label={`Remove admin ${admin.email}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {admins.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-8 py-20 text-center">
                        <Users className="w-12 h-12 text-ui-line mx-auto mb-4" />
                        <p className="text-ui-muted font-medium">No admin accounts found.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Reset Password Modal */}
        {resetAdmin && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40" onClick={() => !resetting && setResetAdmin(null)} />
            <div className="glass w-full max-w-md rounded-panel border border-ui-line p-10 relative z-10 shadow-2xl animate-in zoom-in-95 duration-200">
              <div className="w-16 h-16 rounded-panel bg-ui-subtle text-ui-primary flex items-center justify-center mb-6">
                <Lock className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-semibold text-ui-ink mb-2">Reset Password</h3>
              <p className="text-ui-muted mb-8 font-medium">
                Generating a new password for <span className="text-ui-ink font-bold">{resetAdmin.name}</span>.
              </p>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-ui-ink mb-2">New password</label>
                  <input
                    type="password"
                    autoFocus
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-5 py-4 bg-ui-surface border border-ui-input rounded-control text-ui-ink placeholder:text-ui-muted focus:outline-none focus:border-ui-primary focus:ring-2 focus:ring-ui-primary transition-all font-mono"
                    placeholder="••••••••"
                  />
                  <p className="text-xs text-ui-muted mt-3 ml-1">Minimum 8 characters</p>
                </div>

                <div className="flex flex-col gap-3 pt-4">
                  <button
                    onClick={handleResetPassword}
                    disabled={resetting || !newPassword}
                    className="w-full py-4 bg-ui-primary text-ui-primary-fg hover:bg-ui-primary-hover font-semibold rounded-control transition-colors disabled:opacity-50 flex items-center justify-center gap-3"
                  >
                    {resetting ? <Loader2 className="w-5 h-5 animate-spin" /> : <ShieldAlert className="w-5 h-5" />}
                    Update Password
                  </button>
                  <button
                    onClick={() => setResetAdmin(null)}
                    disabled={resetting}
                    className="w-full py-4 text-ui-muted font-bold hover:text-ui-ink transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Add/Edit Admin Modal */}
        {showAdminModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40" onClick={() => !savingAdmin && setShowAdminModal(false)} />
            <div className="glass w-full max-w-md rounded-panel border border-ui-line p-10 relative z-10 shadow-2xl animate-in zoom-in-95 duration-200">
              <div className="w-16 h-16 rounded-panel bg-ui-subtle text-ui-primary flex items-center justify-center mb-6">
                {adminModalMode === "add" ? <Plus className="w-8 h-8" /> : <Pencil className="w-8 h-8" />}
              </div>
              <h3 className="text-xl font-semibold text-ui-ink mb-2">
                {adminModalMode === "add" ? "Add New Admin" : "Edit Admin"}
              </h3>
              <p className="text-ui-muted mb-8 font-medium">
                {adminModalMode === "add" ? "Create a new admin account for this catalog." : "Update admin details."}
              </p>

              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-ui-ink mb-2">Full Name</label>
                  <input
                    type="text"
                    value={adminForm.name}
                    onChange={(e) => setAdminForm({ ...adminForm, name: e.target.value })}
                    className="w-full px-5 py-4 bg-ui-surface border border-ui-input rounded-control text-ui-ink placeholder:text-ui-muted focus:outline-none focus:border-ui-primary focus:ring-2 focus:ring-ui-primary transition-all"
                    placeholder="John Doe"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-ui-ink mb-2">Email Address</label>
                  <input
                    type="email"
                    value={adminForm.email}
                    onChange={(e) => setAdminForm({ ...adminForm, email: e.target.value })}
                    className="w-full px-5 py-4 bg-ui-surface border border-ui-input rounded-control text-ui-ink placeholder:text-ui-muted focus:outline-none focus:border-ui-primary focus:ring-2 focus:ring-ui-primary transition-all"
                    placeholder="admin@example.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-ui-ink mb-2">
                    Password {adminModalMode === "edit" && <span className="text-ui-muted">(leave blank to keep current)</span>}
                  </label>
                  <input
                    type="password"
                    value={adminForm.password}
                    onChange={(e) => setAdminForm({ ...adminForm, password: e.target.value })}
                    className="w-full px-5 py-4 bg-ui-surface border border-ui-input rounded-control text-ui-ink placeholder:text-ui-muted focus:outline-none focus:border-ui-primary focus:ring-2 focus:ring-ui-primary transition-all font-mono"
                    placeholder="••••••••"
                  />
                  {adminModalMode === "add" && <p className="text-xs text-ui-muted mt-2 ml-1">Minimum 8 characters</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-ui-ink mb-2">Role</label>
                  <select
                    value={adminForm.role}
                    onChange={(e) => setAdminForm({ ...adminForm, role: e.target.value })}
                    className="w-full px-5 py-4 bg-ui-surface border border-ui-input rounded-control text-ui-ink focus:outline-none focus:border-ui-primary focus:ring-2 focus:ring-ui-primary transition-all appearance-none cursor-pointer"
                  >
                    <option value="admin">Admin</option>
                    <option value="owner">Owner</option>
                    <option value="viewer">Viewer</option>
                  </select>
                </div>

                <div className="flex flex-col gap-3 pt-4">
                  <button
                    onClick={handleSaveAdmin}
                    disabled={savingAdmin}
                    className="w-full py-4 bg-ui-primary text-ui-primary-fg hover:bg-ui-primary-hover font-semibold rounded-control transition-colors disabled:opacity-50 flex items-center justify-center gap-3"
                  >
                    {savingAdmin ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                    {adminModalMode === "add" ? "Create Admin" : "Update Admin"}
                  </button>
                  <button
                    onClick={() => setShowAdminModal(false)}
                    disabled={savingAdmin}
                    className="w-full py-4 text-ui-muted font-bold hover:text-ui-ink transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </SuperAdminContent>
    </SuperAdminShell>
  );
}