"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { SuperAdminShell } from "../../_components/SuperAdminShell";
import { SuperAdminHeader, SuperAdminContent } from "../../_components/SuperAdminSidebar";
import { 
  ArrowLeft, 
  Loader2,
  Store,
  Coffee,
  ShoppingBag,
  Scissors,
  Package,
  MoreHorizontal,
  ChevronRight,
  ShieldCheck,
  Zap,
  Globe
} from "lucide-react";
import Link from "next/link";

const businessTypes = [
  { id: "restaurant", label: "Restaurant", icon: Coffee },
  { id: "cafe", label: "Cafe", icon: Coffee },
  { id: "retail", label: "Retail Shop", icon: ShoppingBag },
  { id: "salon", label: "Salon / Spa", icon: Scissors },
  { id: "bakery", label: "Bakery", icon: Package },
  { id: "supermarket", label: "Supermarket", icon: Store },
  { id: "gym", label: "Gym / Fitness", icon: Zap },
  { id: "medical", label: "Medical / Clinic", icon: ShieldCheck },
  { id: "other", label: "Other", icon: MoreHorizontal },
];

const subscriptionTypes = [
  { id: "yearly", label: "1 Year", description: "Renews annually" },
  { id: "forever", label: "Forever", description: "Lifetime access" },
  { id: "custom_years", label: "Custom", description: "Choose years" },
];

export default function NewCatalogPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [step, setStep] = useState(1);

  // Form state
  const [formData, setFormData] = useState({
    // Catalog info
    name: "",
    slug: "",
    business_type: "restaurant",
    description: "",
    // Subscription
    subscription_type: "yearly",
    custom_years: 1,
    amount_paid: "",
    currency: "USD",
    payment_method: "",
    payment_notes: "",
    // Features
    multi_language_enabled: true,
    booking_enabled: true,
    analytics_enabled: true,
    // Admin
    admin_name: "",
    admin_email: "",
    admin_password: "",
  });

  const updateFormData = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    
    // Auto-generate slug from name
    if (field === "name") {
      const slug = value
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .trim();
      setFormData((prev) => ({ ...prev, slug }));
    }
  };

  const handleSubmit = async () => {
    setError("");
    setLoading(true);

    try {
      const token = localStorage.getItem("superadmin_token");
      if (!token) throw new Error("Not authenticated");

      const res = await fetch("/api/superadmin/catalogs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...formData,
          amount_paid: formData.amount_paid ? parseFloat(formData.amount_paid) : null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to create catalog");
      }

      router.push(`/superadmin/catalogs/${data.catalog.id}`);
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  const canProceed = () => {
    if (step === 1) {
      return formData.name && formData.slug && formData.business_type;
    }
    if (step === 2) {
      return formData.subscription_type && (
        formData.subscription_type !== "custom_years" || formData.custom_years > 0
      );
    }
    if (step === 3) {
      // Admin is optional, but if email is provided, all fields required
      if (formData.admin_email) {
        return formData.admin_name && formData.admin_password && formData.admin_password.length >= 8;
      }
      return true;
    }
    return true;
  };

  return (
    <SuperAdminShell>
      <SuperAdminHeader title="System Manifest">
        <Link
          href="/superadmin/catalogs"
          className="group flex items-center gap-2 px-3 py-1.5 text-white/40 hover:text-white transition-all bg-white/5 border border-white/5 rounded-xl text-xs font-bold uppercase tracking-widest"
        >
          <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
          Back
        </Link>
      </SuperAdminHeader>

      <SuperAdminContent>
        <div className="max-w-3xl mx-auto">
          {/* Progress Steps */}
          <div className="flex items-center gap-4 mb-12">
            {[
              { id: 1, label: "Identity" },
              { id: 2, label: "Subscription" },
              { id: 3, label: "Security" }
            ].map((s, i) => (
              <div key={s.id} className="flex-1 flex flex-col gap-3">
                <div className="flex items-center">
                  <div
                    className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-sm transition-all duration-500 border ${
                      step >= s.id
                        ? "bg-primary border-primary shadow-[0_0_20px_rgba(124,58,237,0.4)] text-white"
                        : "bg-white/5 border-white/5 text-white/20"
                    }`}
                  >
                    {step > s.id ? <ShieldCheck className="w-5 h-5" /> : s.id}
                  </div>
                  {i < 2 && (
                    <div className="flex-1 px-4">
                      <div
                        className={`h-px transition-all duration-500 rounded-full ${
                          step > s.id ? "bg-primary" : "bg-white/5"
                        }`}
                      />
                    </div>
                  )}
                </div>
                <span className={`text-[10px] uppercase font-bold tracking-widest transition-colors duration-500 ${
                  step >= s.id ? "text-primary" : "text-white/20"
                }`}>
                  {s.label}
                </span>
              </div>
            ))}
          </div>

          {error && (
            <div className="bg-purple-500/10 border border-purple-500/20 rounded-2xl px-5 py-4 text-purple-400 mb-8 flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
              <p className="text-sm font-medium">{error}</p>
            </div>
          )}

          {/* Step 1: Basic Info */}
          {step === 1 && (
            <div className="glass rounded-[2rem] p-10 border border-white/5 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h2 className="text-2xl font-bold text-white mb-8 tracking-tight flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                  <Zap className="w-5 h-5" />
                </div>
                Brand Profile
              </h2>
              
              <div className="space-y-8">
                <div>
                  <label className="block text-[10px] font-bold text-white/30 uppercase tracking-[0.2em] mb-3 ml-1">
                    Entity Name *
                  </label>
                  <input
                    type="text"
                    autoFocus
                    value={formData.name}
                    onChange={(e) => updateFormData("name", e.target.value)}
                    className="w-full px-5 py-4 bg-black/40 border border-white/5 rounded-2xl text-white placeholder-white/10 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                    placeholder="e.g., Nexus Gastronomy"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-white/30 uppercase tracking-[0.2em] mb-3 ml-1">
                    Route Signature *
                  </label>
                  <div className="relative group">
                    <span className="absolute left-5 top-1/2 -translate-y-1/2 text-white/20 font-bold pointer-events-none transition-colors group-focus-within:text-primary/40">coredex.digital/c/</span>
                    <input
                      type="text"
                      value={formData.slug}
                      onChange={(e) => updateFormData("slug", e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                      className="w-full pl-36 pr-5 py-4 bg-black/40 border border-white/5 rounded-2xl text-white placeholder-white/10 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-mono"
                      placeholder="nexus-gastronomy"
                    />
                  </div>
                  <p className="text-[10px] text-white/20 font-bold uppercase tracking-widest mt-3 ml-1">
                    This is your permanent system identifier.
                  </p>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-white/30 uppercase tracking-[0.2em] mb-4 ml-1">
                    Market Sector *
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {businessTypes.map((type) => (
                      <button
                        key={type.id}
                        type="button"
                        onClick={() => updateFormData("business_type", type.id)}
                        className={`group flex flex-col items-center gap-3 p-5 rounded-[1.5rem] border transition-all duration-300 ${
                          formData.business_type === type.id
                            ? "bg-primary border-primary shadow-[0_10px_30px_-10px_rgba(124,58,237,0.5)] text-white"
                            : "bg-white/[0.03] border-white/5 text-white/40 hover:border-white/20 hover:bg-white/[0.05]"
                        }`}
                      >
                        <div className={`p-3 rounded-2xl transition-colors ${
                          formData.business_type === type.id
                            ? "bg-white/20"
                            : "bg-white/5 group-hover:bg-white/10"
                        }`}>
                          <type.icon className="w-5 h-5" />
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-widest">{type.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-white/30 uppercase tracking-[0.2em] mb-3 ml-1">
                    Manifesto / Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => updateFormData("description", e.target.value)}
                    rows={4}
                    className="w-full px-5 py-4 bg-black/40 border border-white/5 rounded-2xl text-white placeholder-white/10 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all resize-none"
                    placeholder="Vision and mission of this entity..."
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Subscription */}
          {step === 2 && (
            <div className="glass rounded-[2rem] p-10 border border-white/5 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h2 className="text-2xl font-bold text-white mb-8 tracking-tight flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                  <Package className="w-5 h-5" />
                </div>
                Access Tiering
              </h2>
              
              <div className="space-y-8">
                <div>
                  <label className="block text-[10px] font-bold text-white/30 uppercase tracking-[0.2em] mb-4 ml-1">
                    Select Plan Type *
                  </label>
                  <div className="grid grid-cols-3 gap-4">
                    {subscriptionTypes.map((type) => (
                      <button
                        key={type.id}
                        type="button"
                        onClick={() => updateFormData("subscription_type", type.id)}
                        className={`p-6 rounded-[1.5rem] border text-center transition-all duration-300 group ${
                          formData.subscription_type === type.id
                            ? "bg-primary border-primary shadow-[0_10px_30px_-10px_rgba(124,58,237,0.5)]"
                            : "bg-white/[0.03] border-white/5"
                        }`}
                      >
                        <p className={`font-bold tracking-tight text-lg transition-colors ${
                          formData.subscription_type === type.id ? "text-white" : "text-white/40 group-hover:text-white"
                        }`}>
                          {type.label}
                        </p>
                        <p className={`text-[10px] font-bold uppercase tracking-widest mt-2 transition-colors ${
                          formData.subscription_type === type.id ? "text-white/60" : "text-white/20"
                        }`}>{type.description}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {formData.subscription_type === "custom_years" && (
                  <div className="animate-in slide-in-from-top-2 duration-300">
                    <label className="block text-[10px] font-bold text-white/30 uppercase tracking-[0.2em] mb-3 ml-1">
                      Override Duration (Years)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={formData.custom_years}
                      onChange={(e) => updateFormData("custom_years", parseInt(e.target.value) || 1)}
                      className="w-32 px-5 py-4 bg-black/40 border border-white/5 rounded-2xl text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-mono"
                    />
                  </div>
                )}

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-[10px] font-bold text-white/30 uppercase tracking-[0.2em] mb-3 ml-1">
                      Finalized Quantum
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.amount_paid}
                      onChange={(e) => updateFormData("amount_paid", e.target.value)}
                      className="w-full px-5 py-4 bg-black/40 border border-white/5 rounded-2xl text-white placeholder-white/10 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-white/30 uppercase tracking-[0.2em] mb-3 ml-1">
                      Currency Unit
                    </label>
                    <select
                      value={formData.currency}
                      onChange={(e) => updateFormData("currency", e.target.value)}
                      className="w-full px-5 py-4 bg-black/40 border border-white/5 rounded-2xl text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all appearance-none cursor-pointer"
                    >
                      <option value="USD">USD ($)</option>
                      <option value="EUR">EUR (€)</option>
                      <option value="GBP">GBP (£)</option>
                      <option value="AED">AED (د.إ)</option>
                      <option value="SAR">SAR (ر.س)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-white/30 uppercase tracking-[0.2em] mb-3 ml-1">
                    Settlement Method
                  </label>
                  <select
                    value={formData.payment_method}
                    onChange={(e) => updateFormData("payment_method", e.target.value)}
                    className="w-full px-5 py-4 bg-black/40 border border-white/5 rounded-2xl text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all appearance-none cursor-pointer"
                  >
                    <option value="">Select Protocol...</option>
                    <option value="cash">Direct Cash</option>
                    <option value="bank_transfer">Bank Settlement</option>
                    <option value="mobile_payment">Mobile Link</option>
                    <option value="other">Alternative</option>
                  </select>
                </div>

                <div className="pt-8 border-t border-white/5">
                  <label className="block text-[10px] font-bold text-white/30 uppercase tracking-[0.2em] mb-6 ml-1">
                    System Permissions
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {[
                      { key: "booking_enabled", label: "Reservation Matrix", icon: ChevronRight },
                      { key: "analytics_enabled", label: "Hyper-Analytics", icon: ChevronRight },
                      { key: "multi_language_enabled", label: "Multilingual Engine", icon: Globe },
                    ].map((feature) => (
                      <div key={feature.key} className="flex items-center justify-between p-4 bg-white/[0.03] border border-white/5 rounded-2xl hover:bg-white/[0.05] transition-colors">
                        <span className="text-white font-bold tracking-tight text-sm">{feature.label}</span>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input 
                            type="checkbox" 
                            className="sr-only peer"
                            checked={formData[feature.key as keyof typeof formData] as boolean}
                            onChange={(e) => updateFormData(feature.key, e.target.checked)}
                          />
                          <div className="w-10 h-5 bg-white/10 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary shadow-inner"></div>
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Admin Account */}
          {step === 3 && (
            <div className="glass rounded-[2rem] p-10 border border-white/5 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h2 className="text-2xl font-bold text-white mb-2 tracking-tight flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                Security Protocol
              </h2>
              <p className="text-white/40 mb-8 font-medium">
                Provision default administrative credentials for this catalog.
              </p>
              
              <div className="space-y-8">
                <div>
                  <label className="block text-[10px] font-bold text-white/30 uppercase tracking-[0.2em] mb-3 ml-1">
                    Operative Identity
                  </label>
                  <input
                    type="text"
                    autoFocus
                    value={formData.admin_name}
                    onChange={(e) => updateFormData("admin_name", e.target.value)}
                    className="w-full px-5 py-4 bg-black/40 border border-white/5 rounded-2xl text-white placeholder-white/10 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-bold"
                    placeholder="e.g., Operative 01"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-white/30 uppercase tracking-[0.2em] mb-3 ml-1">
                    System Email
                  </label>
                  <input
                    type="email"
                    value={formData.admin_email}
                    onChange={(e) => updateFormData("admin_email", e.target.value)}
                    className="w-full px-5 py-4 bg-black/40 border border-white/5 rounded-2xl text-white placeholder-white/10 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-mono"
                    placeholder="admin@entity.digital"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-white/30 uppercase tracking-[0.2em] mb-3 ml-1">
                    Access Key {formData.admin_email && "(Min 8 Bits)"}
                  </label>
                  <input
                    type="password"
                    value={formData.admin_password}
                    onChange={(e) => updateFormData("admin_password", e.target.value)}
                    className="w-full px-5 py-4 bg-black/40 border border-white/5 rounded-2xl text-white placeholder-white/10 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-mono"
                    placeholder="••••••••"
                  />
                </div>

                {formData.admin_email && formData.admin_password && formData.admin_password.length < 8 && (
                  <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl px-4 py-3 text-purple-500 text-[10px] font-bold uppercase tracking-widest animate-pulse">
                    Security Policy Violation: Access Key Too Short
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          {/* Navigation Buttons */}
          <div className="flex justify-between mt-12 px-2">
            {step > 1 ? (
              <button
                type="button"
                onClick={() => setStep(step - 1)}
                className="px-8 py-4 text-white/40 font-bold uppercase tracking-[0.2em] text-[10px] hover:text-white transition-colors"
              >
                Previous Stage
              </button>
            ) : (
              <div />
            )}

            {step < 3 ? (
              <button
                type="button"
                onClick={() => setStep(step + 1)}
                disabled={!canProceed()}
                className="px-10 py-5 bg-white text-black font-bold rounded-2xl hover:scale-105 active:scale-95 disabled:opacity-20 disabled:scale-100 transition-all shadow-[0_10px_30px_rgba(255,255,255,0.2)] flex items-center gap-2 group"
              >
                PROCEED TO PHASE {step + 1}
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading || !canProceed()}
                className="px-10 py-5 bg-primary text-white font-bold rounded-2xl hover:scale-105 active:scale-95 disabled:opacity-50 disabled:scale-100 transition-all shadow-[0_10px_40px_-5px_rgba(124,58,237,0.6)] flex items-center gap-3 group"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    INITIALIZING...
                  </>
                ) : (
                  <>
                    DEPLOY CATALOG
                    <Zap className="w-4 h-4 fill-current group-hover:scale-125 transition-transform" />
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </SuperAdminContent>
    </SuperAdminShell>
  );
}

