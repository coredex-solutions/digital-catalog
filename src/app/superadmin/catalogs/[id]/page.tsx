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
  Clock,
  Key,
  ShieldAlert,
  Lock
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
  
  // Password Reset State
  const [resetAdmin, setResetAdmin] = useState<any>(null);
  const [newPassword, setNewPassword] = useState("");
  const [resetting, setResetting] = useState(false);

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
    if (!confirm("DANGER: This will permanently delete the catalog and all its data. Are you sure?")) return;
    
    try {
      const token = localStorage.getItem("superadmin_token");
      const res = await fetch(`/api/superadmin/catalogs/${id}`, {
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
      const res = await fetch(`/api/superadmin/catalogs/${id}/admins/${resetAdmin.id}/reset-password`, {
        method: "POST",
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
            <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-8 h-8 bg-black rounded-full" />
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
            className="group flex items-center gap-2 px-3 py-1.5 text-white/40 hover:text-white transition-all bg-white/5 border border-white/5 rounded-xl text-xs font-bold uppercase tracking-widest"
          >
            <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
            Back
          </Link>
          <div className="h-6 w-px bg-white/10" />
          <Link
            href={`/c/${catalog.slug}`}
            target="_blank"
            className="flex items-center gap-2 px-4 py-2 bg-white text-black rounded-xl hover:scale-105 transition-all text-sm font-bold shadow-lg shadow-white/10"
          >
            <ExternalLink className="w-4 h-4" />
            Launch Catalog
          </Link>
        </div>
      </SuperAdminHeader>

      <SuperAdminContent>
        {/* Top Stats Cards */}
        {/* Top Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="glass p-5 rounded-3xl border border-white/5 relative overflow-hidden group">
            <div className={`absolute top-0 right-0 w-16 h-16 bg-gradient-to-br ${catalog.is_suspended ? 'from-red-500' : 'from-primary'} opacity-5 blur-2xl rounded-full translate-x-1/3 -translate-y-1/3`} />
            <p className="text-white/30 text-[10px] font-bold uppercase tracking-widest mb-3">Status</p>
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${catalog.is_suspended ? 'bg-red-500/10 text-red-500' : 'bg-primary/10 text-primary'}`}>
                {catalog.is_suspended ? <XCircle className="w-5 h-5" /> : <CheckCircle className="w-5 h-5" />}
              </div>
              <span className={`text-xl font-bold tracking-tight ${catalog.is_suspended ? "text-red-400" : "text-white"}`}>
                {catalog.is_suspended ? "Suspended" : "Active"}
              </span>
            </div>
          </div>
          
          <div className="glass p-5 rounded-3xl border border-white/5">
            <p className="text-white/30 text-[10px] font-bold uppercase tracking-widest mb-3">Plan</p>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
                <CreditCard className="w-5 h-5" />
              </div>
              <span className="text-xl font-bold text-white tracking-tight capitalize">
                {catalog.subscription_type?.replace("_", " ")}
              </span>
            </div>
          </div>

          <div className="glass p-5 rounded-3xl border border-white/5">
            <p className="text-white/30 text-[10px] font-bold uppercase tracking-widest mb-3">Monthly Views</p>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center">
                <BarChart3 className="w-5 h-5" />
              </div>
              <span className="text-2xl font-bold text-white tracking-tight">
                {analytics?.total_views?.toLocaleString() || 0}
              </span>
            </div>
          </div>

          <div className="glass p-5 rounded-3xl border border-white/5">
            <p className="text-white/30 text-[10px] font-bold uppercase tracking-widest mb-3">Product Count</p>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
                <Store className="w-5 h-5" />
              </div>
              <span className="text-2xl font-bold text-white tracking-tight">{counts?.items || 0}</span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-8 border-b border-white/5 mb-8">
          {[
            { id: "overview", label: "Overview" },
            { id: "settings", label: "Settings" },
            { id: "admins", label: "Admins" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`pb-4 px-1 text-xs font-bold uppercase tracking-widest transition-all relative ${
                activeTab === tab.id ? "text-primary" : "text-white/30 hover:text-white/60"
              }`}
            >
              {tab.label}
              {activeTab === tab.id && (
                <div className="absolute bottom-0 left-0 w-full h-0.5 bg-primary rounded-t-full shadow-[0_-4px_10px_rgba(124,58,237,0.5)]" />
              )}
            </button>
          ))}
        </div>

        {/* TAB: OVERVIEW */}
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-6">
              <div className="glass rounded-[2rem] p-8 border border-white/5">
                <h3 className="text-xl font-bold text-white mb-6 tracking-tight">Core Information</h3>
                <div className="space-y-1">
                  <div className="flex justify-between py-4 border-b border-white/5">
                    <span className="text-white/40 font-medium">Created On</span>
                    <span className="text-white font-bold">{new Date(catalog.created_at).toLocaleDateString(undefined, { dateStyle: 'long' })}</span>
                  </div>
                  <div className="flex justify-between py-4 border-b border-white/5">
                    <span className="text-white/40 font-medium">Expires On</span>
                    <span className="text-white font-bold">
                      {catalog.expires_at ? new Date(catalog.expires_at).toLocaleDateString(undefined, { dateStyle: 'long' }) : "Unlimited"}
                    </span>
                  </div>
                  <div className="flex justify-between py-4 border-b border-white/5">
                    <span className="text-white/40 font-medium">Categories</span>
                    <span className="text-white font-bold">{counts?.categories || 0} Levels</span>
                  </div>
                  <div className="flex justify-between py-4">
                    <span className="text-white/40 font-medium">Branches</span>
                    <span className="text-white font-bold">{counts?.branches || 0} Locations</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="glass rounded-[2rem] p-8 border border-white/5">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                    <Lock className="w-5 h-5" />
                  </div>
                  <h3 className="text-xl font-bold text-white tracking-tight">Enabled Features</h3>
                </div>
                <div className="space-y-3">
                  {[
                    { flag: catalog.multi_language_enabled, label: "Multi-language Support", icon: Globe },
                    { flag: catalog.booking_enabled, label: "Booking System", icon: Calendar },
                    { flag: catalog.analytics_enabled, label: "Detailed Analytics", icon: BarChart3 }
                  ].map((feat, i) => (
                    <div key={i} className="flex items-center justify-between p-4 bg-white/5 border border-white/5 rounded-2xl">
                      <div className="flex items-center gap-4">
                        <feat.icon className="w-5 h-5 text-white/40" />
                        <span className="text-white font-medium">{feat.label}</span>
                      </div>
                      {feat.flag ? (
                        <div className="px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-widest border border-primary/20">Enabled</div>
                      ) : (
                        <div className="px-3 py-1 rounded-full bg-white/5 text-white/20 text-[10px] font-bold uppercase tracking-widest border border-white/5">Locked</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

                {/* TAB: SETTINGS */}
        {activeTab === "settings" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="glass rounded-[2rem] p-8 border border-white/5 h-fit">
              <h3 className="text-xl font-bold text-white mb-8 tracking-tight">Catalog Settings</h3>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-[10px] font-bold text-white/30 uppercase tracking-[0.2em] mb-3 ml-1">Catalog Name</label>
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className="w-full px-5 py-4 bg-black/40 border border-white/5 rounded-2xl text-white placeholder-white/10 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-white/30 uppercase tracking-[0.2em] mb-3 ml-1">URL Slug</label>
                  <div className="relative">
                    <span className="absolute left-5 top-1/2 -translate-y-1/2 text-white/20 font-bold">/c/</span>
                    <input
                      type="text"
                      value={editForm.slug}
                      onChange={(e) => setEditForm({ ...editForm, slug: e.target.value })}
                      className="w-full pl-12 pr-5 py-4 bg-black/40 border border-white/5 rounded-2xl text-white placeholder-white/10 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-mono text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-white/30 uppercase tracking-[0.2em] mb-3 ml-1">Business Category</label>
                  <select
                    value={editForm.business_type}
                    onChange={(e) => setEditForm({ ...editForm, business_type: e.target.value })}
                    className="w-full px-5 py-4 bg-black/40 border border-white/5 rounded-2xl text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all appearance-none cursor-pointer"
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
              </div>
            </div>

            <div className="glass rounded-[2rem] p-8 border border-white/5 h-fit flex flex-col">
              <h3 className="text-xl font-bold text-white mb-2 tracking-tight">Feature Access</h3>
              <p className="text-white/30 text-sm mb-8 font-medium">Control module access for this catalog.</p>
              
              <div className="space-y-3">
                {[
                  { key: "booking_enabled", label: "Booking System", desc: "Enable table or appointment bookings" },
                  { key: "analytics_enabled", label: "Detailed Analytics", desc: "Track visitor behavior and clicks" },
                  { key: "custom_domain_enabled", label: "Custom Domain", desc: "Use a custom website address" },
                ].map((feature) => (
                  <div key={feature.key} className="flex items-center justify-between p-4 bg-white/[0.03] border border-white/5 rounded-[1.5rem] hover:bg-white/[0.05] transition-colors">
                    <div>
                      <p className="text-white font-bold tracking-tight text-sm">{feature.label}</p>
                      <p className="text-[10px] text-white/20 font-bold uppercase tracking-widest">{feature.desc}</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="sr-only peer"
                        checked={!!editForm[feature.key]}
                        onChange={(e) => setEditForm({ ...editForm, [feature.key]: e.target.checked })}
                      />
                      <div className="w-11 h-6 bg-white/10 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary shadow-inner"></div>
                    </label>
                  </div>
                ))}
              </div>

              <div className="mt-10 pt-8 border-t border-white/5">
                <button
                  onClick={handleUpdate}
                  disabled={saving}
                  className="w-full py-4 bg-white text-black font-bold rounded-2xl hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 transition-all flex items-center justify-center gap-3 shadow-[0_0_20px_-5px_rgba(255,255,255,0.3)]"
                >
                  {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                  Save Changes
                </button>
              </div>
            </div>
            
            <div className="lg:col-span-2 pt-10 mt-4">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-8 h-8 rounded-xl bg-red-500/10 flex items-center justify-center text-red-500">
                    <ShieldAlert className="w-4 h-4" />
                  </div>
                  <h4 className="text-white font-bold tracking-tight">Danger Zone</h4>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center justify-between glass border border-red-500/20 p-6 rounded-[2rem] bg-red-500/[0.02]">
                    <div>
                      <p className="text-red-400 font-bold tracking-tight">Catalog Visibility</p>
                      <p className="text-red-400/40 text-[10px] font-bold uppercase tracking-widest">Disable or enable public access</p>
                    </div>
                    <button
                      onClick={() => setEditForm({ ...editForm, is_suspended: !editForm.is_suspended })}
                      className={`px-6 py-2 rounded-xl text-xs font-bold transition-all uppercase tracking-widest ${
                        editForm.is_suspended
                          ? "bg-primary text-white shadow-lg shadow-primary/20"
                          : "bg-red-500/20 text-red-400 border border-red-500/20 hover:bg-red-500/30"
                      }`}
                    >
                      {editForm.is_suspended ? "Activate" : "Suspend"}
                    </button>
                  </div>
                  
                  <div className="flex items-center justify-between glass border border-white/5 p-6 rounded-[2rem] hover:border-red-500/20 transition-colors group/del">
                    <div>
                      <p className="text-white/40 group-hover:text-red-400 font-bold tracking-tight transition-colors">Delete Catalog</p>
                      <p className="text-white/20 text-[10px] font-bold uppercase tracking-widest">Permanently remove all data</p>
                    </div>
                    <button
                       onClick={handleDelete}
                       className="p-3 rounded-xl bg-white/5 text-white/30 hover:bg-red-500 hover:text-white transition-all border border-white/5"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="mt-8 bg-red-500/10 border border-red-500/20 rounded-2xl px-5 py-4 text-red-400 text-sm font-medium flex items-center gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                    {error}
                  </div>
                )}
            </div>
          </div>
        )}

        {/* TAB: ADMINS */}
        {/* TAB: ADMINS */}
        {activeTab === "admins" && (
          <div className="glass rounded-[2rem] border border-white/5 overflow-hidden">
             <div className="p-8 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
                <h3 className="text-xl font-bold text-white tracking-tight">Admins</h3>
                <p className="text-xs text-white/30 font-bold uppercase tracking-widest">{admins.length} Total Users</p>
             </div>
             <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="text-white/30 text-[10px] uppercase font-bold tracking-widest bg-white/[0.03]">
                    <tr>
                      <th className="px-8 py-5">Name</th>
                      <th className="px-8 py-5">Contact</th>
                      <th className="px-8 py-5">Role</th>
                      <th className="px-8 py-5">Activity</th>
                      <th className="px-8 py-5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {admins.map((admin: any) => (
                      <tr key={admin.id} className="group hover:bg-white/[0.02] transition-colors">
                        <td className="px-8 py-6">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold border border-primary/20">
                              {admin.name.charAt(0)}
                            </div>
                            <span className="text-white font-bold tracking-tight">{admin.name}</span>
                          </div>
                        </td>
                        <td className="px-8 py-6 text-white/40 font-medium">{admin.email}</td>
                        <td className="px-8 py-6">
                          <span className="px-3 py-1 rounded-full bg-white/5 text-white/60 text-[10px] font-bold uppercase tracking-widest border border-white/5">
                            {admin.role}
                          </span>
                        </td>
                        <td className="px-8 py-6 text-white/40 text-sm">
                          {admin.last_login ? new Date(admin.last_login).toLocaleDateString(undefined, { dateStyle: 'medium' }) : "Never logged in"}
                        </td>
                        <td className="px-8 py-6 text-right">
                          <button
                            onClick={() => setResetAdmin(admin)}
                            className="p-2 rounded-xl bg-primary/10 text-primary hover:bg-primary hover:text-white transition-all border border-primary/20 group/action"
                            title="Reset Password"
                          >
                            <Key className="w-4 h-4 group-hover/action:scale-110 transition-transform" />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {admins.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-8 py-20 text-center">
                          <Users className="w-12 h-12 text-white/5 mx-auto mb-4" />
                          <p className="text-white/20 font-medium">No admin accounts found.</p>
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
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => !resetting && setResetAdmin(null)} />
            <div className="glass w-full max-w-md rounded-[2.5rem] border border-white/10 p-10 relative z-10 shadow-2xl animate-in zoom-in-95 duration-200">
              <div className="w-16 h-16 rounded-3xl bg-primary/10 text-primary flex items-center justify-center mb-6">
                <Lock className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2 tracking-tight">Reset Password</h3>
              <p className="text-white/40 mb-8 font-medium">
                Generating a new password for <span className="text-white font-bold">{resetAdmin.name}</span>.
              </p>

              <div className="space-y-6">
                <div>
                  <label className="block text-[10px] font-bold text-white/30 uppercase tracking-[0.2em] mb-3 ml-1">New Security Key</label>
                  <input
                    type="password"
                    autoFocus
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-5 py-4 bg-black/40 border border-white/5 rounded-2xl text-white placeholder-white/10 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-mono"
                    placeholder="••••••••"
                  />
                  <p className="text-[10px] text-white/20 mt-3 ml-1">Minimum 8 characters</p>
                </div>

                <div className="flex flex-col gap-3 pt-4">
                  <button
                    onClick={handleResetPassword}
                    disabled={resetting || !newPassword}
                    className="w-full py-4 bg-primary text-white font-bold rounded-2xl hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 shadow-[0_0_20px_-5px_rgba(124,58,237,0.5)] flex items-center justify-center gap-3"
                  >
                    {resetting ? <Loader2 className="w-5 h-5 animate-spin" /> : <ShieldAlert className="w-5 h-5" />}
                    Update Password
                  </button>
                  <button
                    onClick={() => setResetAdmin(null)}
                    disabled={resetting}
                    className="w-full py-4 text-white/40 font-bold hover:text-white transition-colors"
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