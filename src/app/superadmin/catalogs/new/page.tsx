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
  MoreHorizontal
} from "lucide-react";
import Link from "next/link";

const businessTypes = [
  { id: "restaurant", label: "Restaurant", icon: Coffee },
  { id: "cafe", label: "Cafe", icon: Coffee },
  { id: "retail", label: "Retail Shop", icon: ShoppingBag },
  { id: "salon", label: "Salon / Spa", icon: Scissors },
  { id: "bakery", label: "Bakery", icon: Package },
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
      <SuperAdminHeader title="Create New Catalog">
        <Link
          href="/superadmin/catalogs"
          className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Back
        </Link>
      </SuperAdminHeader>

      <SuperAdminContent>
        <div className="max-w-2xl mx-auto">
          {/* Progress Steps */}
          <div className="flex items-center gap-2 mb-8">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex-1 flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center font-medium text-sm ${
                    step >= s
                      ? "bg-emerald-500 text-white"
                      : "bg-slate-700 text-slate-400"
                  }`}
                >
                  {s}
                </div>
                {s < 3 && (
                  <div
                    className={`flex-1 h-1 mx-2 rounded ${
                      step > s ? "bg-emerald-500" : "bg-slate-700"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-red-400 mb-6">
              {error}
            </div>
          )}

          {/* Step 1: Basic Info */}
          {step === 1 && (
            <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-8 border border-slate-700/50">
              <h2 className="text-xl font-semibold text-white mb-6">Catalog Information</h2>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Business Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => updateFormData("name", e.target.value)}
                    className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                    placeholder="e.g., Pizza Palace"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    URL Slug *
                  </label>
                  <div className="flex items-center">
                    <span className="text-slate-500 mr-2">/c/</span>
                    <input
                      type="text"
                      value={formData.slug}
                      onChange={(e) => updateFormData("slug", e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                      className="flex-1 px-4 py-3 bg-slate-900/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                      placeholder="pizza-palace"
                    />
                  </div>
                  <p className="text-slate-500 text-sm mt-1">
                    This will be the public URL for the catalog
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-3">
                    Business Type *
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {businessTypes.map((type) => (
                      <button
                        key={type.id}
                        type="button"
                        onClick={() => updateFormData("business_type", type.id)}
                        className={`flex items-center gap-3 p-4 rounded-xl border transition-all ${
                          formData.business_type === type.id
                            ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-400"
                            : "bg-slate-900/50 border-slate-600/50 text-slate-400 hover:border-slate-500"
                        }`}
                      >
                        <type.icon className="w-5 h-5" />
                        <span className="font-medium">{type.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Description (optional)
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => updateFormData("description", e.target.value)}
                    rows={3}
                    className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 resize-none"
                    placeholder="Brief description of the business..."
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Subscription */}
          {step === 2 && (
            <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-8 border border-slate-700/50">
              <h2 className="text-xl font-semibold text-white mb-6">Subscription Details</h2>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-3">
                    Subscription Type *
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {subscriptionTypes.map((type) => (
                      <button
                        key={type.id}
                        type="button"
                        onClick={() => updateFormData("subscription_type", type.id)}
                        className={`p-4 rounded-xl border text-center transition-all ${
                          formData.subscription_type === type.id
                            ? "bg-emerald-500/20 border-emerald-500/50"
                            : "bg-slate-900/50 border-slate-600/50 hover:border-slate-500"
                        }`}
                      >
                        <p className={`font-semibold ${
                          formData.subscription_type === type.id ? "text-emerald-400" : "text-white"
                        }`}>
                          {type.label}
                        </p>
                        <p className="text-slate-500 text-sm mt-1">{type.description}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {formData.subscription_type === "custom_years" && (
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Number of Years
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={formData.custom_years}
                      onChange={(e) => updateFormData("custom_years", parseInt(e.target.value) || 1)}
                      className="w-32 px-4 py-3 bg-slate-900/50 border border-slate-600/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                    />
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Amount Paid
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.amount_paid}
                      onChange={(e) => updateFormData("amount_paid", e.target.value)}
                      className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Currency
                    </label>
                    <select
                      value={formData.currency}
                      onChange={(e) => updateFormData("currency", e.target.value)}
                      className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                    >
                      <option value="USD">USD</option>
                      <option value="EUR">EUR</option>
                      <option value="GBP">GBP</option>
                      <option value="AED">AED</option>
                      <option value="SAR">SAR</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Payment Method
                  </label>
                  <select
                    value={formData.payment_method}
                    onChange={(e) => updateFormData("payment_method", e.target.value)}
                    className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  >
                    <option value="">Select method...</option>
                    <option value="cash">Cash</option>
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="mobile_payment">Mobile Payment</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Payment Notes
                  </label>
                  <textarea
                    value={formData.payment_notes}
                    onChange={(e) => updateFormData("payment_notes", e.target.value)}
                    rows={2}
                    className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 resize-none"
                    placeholder="Any notes about the payment..."
                  />
                </div>

                <div className="border-t border-slate-700/50 pt-6">
                  <label className="block text-sm font-medium text-slate-300 mb-4">
                    Features
                  </label>
                  <div className="space-y-3">
                    {[
                      { key: "booking_enabled", label: "Booking / Reservation feature" },
                      { key: "analytics_enabled", label: "Analytics dashboard" },
                    ].map((feature) => (
                      <label key={feature.key} className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData[feature.key as keyof typeof formData] as boolean}
                          onChange={(e) => updateFormData(feature.key, e.target.checked)}
                          className="w-5 h-5 rounded border-slate-600 bg-slate-900/50 text-emerald-500 focus:ring-emerald-500/50"
                        />
                        <span className="text-slate-300">{feature.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Admin Account */}
          {step === 3 && (
            <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-8 border border-slate-700/50">
              <h2 className="text-xl font-semibold text-white mb-2">Admin Account</h2>
              <p className="text-slate-400 mb-6">
                Create an admin account for this catalog. This is optional - you can add admins later.
              </p>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Admin Name
                  </label>
                  <input
                    type="text"
                    value={formData.admin_name}
                    onChange={(e) => updateFormData("admin_name", e.target.value)}
                    className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                    placeholder="John Doe"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Admin Email
                  </label>
                  <input
                    type="email"
                    value={formData.admin_email}
                    onChange={(e) => updateFormData("admin_email", e.target.value)}
                    className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                    placeholder="admin@business.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Password {formData.admin_email && "(min 8 characters)"}
                  </label>
                  <input
                    type="password"
                    value={formData.admin_password}
                    onChange={(e) => updateFormData("admin_password", e.target.value)}
                    className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                    placeholder="••••••••"
                  />
                </div>

                {formData.admin_email && formData.admin_password && formData.admin_password.length < 8 && (
                  <p className="text-amber-400 text-sm">
                    Password must be at least 8 characters
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8">
            {step > 1 ? (
              <button
                type="button"
                onClick={() => setStep(step - 1)}
                className="px-6 py-3 text-slate-400 hover:text-white transition-colors"
              >
                Back
              </button>
            ) : (
              <div />
            )}

            {step < 3 ? (
              <button
                type="button"
                onClick={() => setStep(step + 1)}
                disabled={!canProceed()}
                className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold rounded-xl hover:from-emerald-600 hover:to-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                Continue
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading || !canProceed()}
                className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold rounded-xl hover:from-emerald-600 hover:to-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Catalog"
                )}
              </button>
            )}
          </div>
        </div>
      </SuperAdminContent>
    </SuperAdminShell>
  );
}

