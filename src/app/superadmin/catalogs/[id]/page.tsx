"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { SuperAdminShell } from "../../_components/SuperAdminShell";
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
  Clock
} from "lucide-react";

export default function CatalogDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<"overview" | "settings" | "admins">("overview");
  
  const [data, setData] = useState<any>(null);
  const [editForm, setEditForm] = useState<any>(null);

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
        multi_language_enabled: Boolean(result.catalog.multi_language_enabled),
        booking_enabled: Boolean(result.catalog.booking_enabled),
        analytics_enabled: Boolean(result.catalog.analytics_enabled),
        custom_domain_enabled: Boolean(result.catalog.custom_domain_enabled),
      });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    setSaving(true);
    setError("");
    
    try {
      const token = localStorage.getItem("superadmin_token");
      const res = await fetch(`/api/superadmin/catalogs/${id}`, {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify(editForm),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Update failed");
      }

      await fetchCatalogDetails();
      alert("Catalog updated successfully!");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to suspend this catalog? Users will lose access immediately.")) return;
    
    try {
      const token = localStorage.getItem("superadmin_token");
      const res = await fetch(`/api/superadmin/catalogs/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error("Delete failed");
      
      await fetchCatalogDetails();
    } catch (err: any) {
      alert(err.message);
    }
  };

  if (loading) {
    return (
      <SuperAdminShell>
        <div className="flex items-center justify-center h-full min-h-[400px]">
          <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
        </div>
      </SuperAdminShell>
    );
  }

  if (!data) return null;

  const { catalog, admins, analytics, counts } = data;

  return (
    <SuperAdminShell>
      <SuperAdminHeader title={catalog.name}>
        <Link
          href="/superadmin/catalogs"
          className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mr-auto"
        >
          <ArrowLeft className="w-5 h-5" />
          Back
        </Link>
        <Link
          href={`/c/${catalog.slug}`}
          target="_blank"
          className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-slate-300 rounded-xl hover:bg-slate-700 hover:text-white transition-all text-sm font-medium border border-slate-700"
        >
          <ExternalLink className="w-4 h-4" />
          Open Public Site
        </Link>
      </SuperAdminHeader>

      <SuperAdminContent>
        {/* Top Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-slate-800/50 p-4 rounded-2xl border border-slate-700/50">
            <p className="text-slate-500 text-xs mb-1">Status</p>
            <div className="flex items-center gap-2">
              {catalog.is_suspended ? (
                <XCircle className="w-5 h-5 text-red-400" />
              ) : (
                <CheckCircle className="w-5 h-5 text-emerald-400" />
              )}
              <span className={`font-semibold ${catalog.is_suspended ? "text-red-400" : "text-emerald-400"}`}>
                {catalog.is_suspended ? "Suspended" : "Active"}
              </span>
            </div>
          </div>
          <div className="bg-slate-800/50 p-4 rounded-2xl border border-slate-700/50">
            <p className="text-slate-500 text-xs mb-1">Subscription</p>
            <div className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-blue-400" />
              <span className="font-semibold text-white capitalize">
                {catalog.subscription_type?.replace("_", " ")}
              </span>
            </div>
          </div>
          <div className="bg-slate-800/50 p-4 rounded-2xl border border-slate-700/50">
            <p className="text-slate-500 text-xs mb-1">Total Views</p>
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-purple-400" />
              <span className="font-semibold text-white">{analytics?.total_views || 0}</span>
            </div>
          </div>
          <div className="bg-slate-800/50 p-4 rounded-2xl border border-slate-700/50">
            <p className="text-slate-500 text-xs mb-1">Menu Items</p>
            <div className="flex items-center gap-2">
              <Store className="w-5 h-5 text-amber-400" />
              <span className="font-semibold text-white">{counts?.items || 0}</span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-6 border-b border-slate-700/50 mb-8">
          {[
            { id: "overview", label: "Overview" },
            { id: "settings", label: "Settings" },
            { id: "admins", label: "Admins" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`pb-4 px-2 text-sm font-medium transition-colors relative ${
                activeTab === tab.id ? "text-emerald-400" : "text-slate-400 hover:text-white"
              }`}
            >
              {tab.label}
              {activeTab === tab.id && (
                <div className="absolute bottom-0 left-0 w-full h-0.5 bg-emerald-500 rounded-t-full" />
              )}
            </button>
          ))}
        </div>

        {/* TAB: OVERVIEW */}
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50">
                <h3 className="text-lg font-semibold text-white mb-4">Quick Details</h3>
                <div className="space-y-4">
                  <div className="flex justify-between py-2 border-b border-slate-700/50">
                    <span className="text-slate-400">Created At</span>
                    <span className="text-white">{new Date(catalog.created_at).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-slate-700/50">
                    <span className="text-slate-400">Valid Until</span>
                    <span className="text-white">
                      {catalog.expires_at ? new Date(catalog.expires_at).toLocaleDateString() : "Forever"}
                    </span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-slate-700/50">
                    <span className="text-slate-400">Categories</span>
                    <span className="text-white">{counts?.categories || 0}</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-slate-400">Branches</span>
                    <span className="text-white">{counts?.branches || 0}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50">
                <h3 className="text-lg font-semibold text-white mb-4">Subscription Features</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-slate-900/30 rounded-xl">
                    <div className="flex items-center gap-3">
                      <Globe className="w-5 h-5 text-slate-400" />
                      <span className="text-slate-300">Multi-language</span>
                    </div>
                    {catalog.multi_language_enabled ? (
                      <CheckCircle className="w-5 h-5 text-emerald-500" />
                    ) : (
                      <XCircle className="w-5 h-5 text-slate-600" />
                    )}
                  </div>
                  <div className="flex items-center justify-between p-3 bg-slate-900/30 rounded-xl">
                    <div className="flex items-center gap-3">
                      <Calendar className="w-5 h-5 text-slate-400" />
                      <span className="text-slate-300">Booking System</span>
                    </div>
                    {catalog.booking_enabled ? (
                      <CheckCircle className="w-5 h-5 text-emerald-500" />
                    ) : (
                      <XCircle className="w-5 h-5 text-slate-600" />
                    )}
                  </div>
                  <div className="flex items-center justify-between p-3 bg-slate-900/30 rounded-xl">
                    <div className="flex items-center gap-3">
                      <BarChart3 className="w-5 h-5 text-slate-400" />
                      <span className="text-slate-300">Analytics</span>
                    </div>
                    {catalog.analytics_enabled ? (
                      <CheckCircle className="w-5 h-5 text-emerald-500" />
                    ) : (
                      <XCircle className="w-5 h-5 text-slate-600" />
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

                {/* TAB: SETTINGS */}
                {activeTab === "settings" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Column 1: Basic Info */}
            <div className="bg-slate-800/50 rounded-2xl p-8 border border-slate-700/50 h-fit">
              <h3 className="text-lg font-semibold text-white mb-6">Catalog Information</h3>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Business Name</label>
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Slug (URL)</label>
                  <input
                    type="text"
                    value={editForm.slug}
                    onChange={(e) => setEditForm({ ...editForm, slug: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Business Type</label>
                  <select
                    value={editForm.business_type}
                    onChange={(e) => setEditForm({ ...editForm, business_type: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  >
                    <option value="restaurant">Restaurant</option>
                    <option value="cafe">Cafe</option>
                    <option value="retail">Retail</option>
                    <option value="salon">Salon</option>
                    <option value="bakery">Bakery</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Column 2: Subscription Features */}
            <div className="bg-slate-800/50 rounded-2xl p-8 border border-slate-700/50 h-fit">
              <h3 className="text-lg font-semibold text-white mb-6">Subscription Features</h3>
              <p className="text-slate-400 text-sm mb-6">
                Enable or disable specific features for this catalog based on their plan.
              </p>
              
              <div className="space-y-4">
                {[
                  { key: "booking_enabled", label: "Booking System", desc: "Enable table reservations" },
                  { key: "analytics_enabled", label: "Analytics Dashboard", desc: "View visitor stats" },
                  { key: "custom_domain_enabled", label: "Custom Domain", desc: "Allow connecting own domain" },
                ].map((feature) => (
                  <div key={feature.key} className="flex items-center justify-between p-4 bg-slate-900/30 rounded-xl border border-slate-700/30">
                    <div>
                      <p className="text-white font-medium">{feature.label}</p>
                      <p className="text-xs text-slate-500">{feature.desc}</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
  <input 
    type="checkbox" 
    className="sr-only peer"
    checked={!!editForm[feature.key]} // <--- Added !! to force boolean
    onChange={(e) => setEditForm({ ...editForm, [feature.key]: e.target.checked })}
  />
  <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
</label>
                  </div>
                ))}
              </div>

              <div className="mt-8 pt-6 border-t border-slate-700/50 flex justify-end">
                <button
                  onClick={handleUpdate}
                  disabled={saving}
                  className="w-full sm:w-auto px-6 py-3 bg-emerald-500 text-white font-semibold rounded-xl hover:bg-emerald-600 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                >
                  {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                  Save Changes
                </button>
              </div>
            </div>
            
            {/* Danger Zone (Full Width) */}
            <div className="lg:col-span-2 pt-6 border-t border-slate-700/50">
                <h4 className="text-white font-medium mb-4 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-400" />
                  Danger Zone
                </h4>
                <div className="flex items-center justify-between bg-red-500/10 border border-red-500/20 p-4 rounded-xl">
                  <div>
                    <p className="text-red-200 font-medium">Suspend Catalog</p>
                    <p className="text-red-400/70 text-sm">Temporarily disable access</p>
                  </div>
                  <button
                    onClick={() => setEditForm({ ...editForm, is_suspended: !editForm.is_suspended })}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      editForm.is_suspended
                        ? "bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30"
                        : "bg-red-500/20 text-red-400 hover:bg-red-500/30"
                    }`}
                  >
                    {editForm.is_suspended ? "Activate" : "Suspend"}
                  </button>
                </div>
                
                <div className="mt-4 flex justify-end">
                  <button
                     onClick={handleDelete}
                     className="text-red-400 text-sm hover:text-red-300 flex items-center gap-1"
                  >
                    <Trash2 className="w-4 h-4" />
                    Permanently Delete
                  </button>
                </div>

                {error && (
                  <div className="mt-6 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-red-400">
                    {error}
                  </div>
                )}
            </div>
          </div>
        )}

        {/* TAB: ADMINS */}
        {activeTab === "admins" && (
          <div className="bg-slate-800/50 rounded-2xl border border-slate-700/50 overflow-hidden">
             <div className="p-6 border-b border-slate-700/50 flex justify-between items-center">
                <h3 className="text-lg font-semibold text-white">Catalog Admins</h3>
             </div>
             <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-900/50 text-slate-400 text-xs uppercase">
                    <tr>
                      <th className="px-6 py-4">Name</th>
                      <th className="px-6 py-4">Email</th>
                      <th className="px-6 py-4">Role</th>
                      <th className="px-6 py-4">Last Login</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700/50">
                    {admins.map((admin: any) => (
                      <tr key={admin.id} className="hover:bg-slate-700/20 transition-colors">
                        <td className="px-6 py-4 text-white font-medium">{admin.name}</td>
                        <td className="px-6 py-4 text-slate-300">{admin.email}</td>
                        <td className="px-6 py-4">
                          <span className="px-2 py-1 rounded-full bg-blue-500/10 text-blue-400 text-xs border border-blue-500/20 capitalize">
                            {admin.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-slate-400 text-sm">
                          {admin.last_login ? new Date(admin.last_login).toLocaleDateString() : "Never"}
                        </td>
                      </tr>
                    ))}
                    {admins.length === 0 && (
                      <tr>
                        <td colSpan={4} className="px-6 py-8 text-center text-slate-500">
                          No admins assigned to this catalog.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
             </div>
          </div>
        )}
      </SuperAdminContent>
    </SuperAdminShell>
  );
}