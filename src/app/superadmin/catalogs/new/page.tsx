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
      <SuperAdminHeader title="New Catalog">
        <Link
          href="/superadmin/catalogs"
          className="group flex items-center gap-2 px-3 py-1.5 text-ui-muted hover:text-ui-ink transition-colors bg-ui-surface border border-ui-line rounded-control text-sm font-medium"
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
              { id: 1, label: "Business" },
              { id: 2, label: "Subscription" },
              { id: 3, label: "Admin account" }
            ].map((s, i) => (
              <div key={s.id} className="flex-1 flex flex-col gap-3">
                <div className="flex items-center">
                  <div
                    className={`w-10 h-10 rounded-control flex items-center justify-center font-bold text-sm transition-all duration-500 border ${
                      step >= s.id
                        ? "bg-ui-primary border-ui-primary text-ui-primary-fg"
                        : "bg-ui-surface border-ui-line text-ui-muted"
                    }`}
                  >
                    {step > s.id ? <ShieldCheck className="w-5 h-5" /> : s.id}
                  </div>
                  {i < 2 && (
                    <div className="flex-1 px-4">
                      <div
                        className={`h-px transition-all duration-500 rounded-full ${
                          step > s.id ? "bg-ui-primary" : "bg-ui-line"
                        }`}
                      />
                    </div>
                  )}
                </div>
                <span className={`text-xs font-bold transition-colors duration-500 ${
                  step >= s.id ? "text-ui-primary" : "text-ui-muted"
                }`}>
                  {s.label}
                </span>
              </div>
            ))}
          </div>

          {error && (
            <div className="bg-ui-surface border border-ui-danger rounded-control px-5 py-4 text-ui-danger mb-8 flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-ui-danger" />
              <p className="text-sm font-medium">{error}</p>
            </div>
          )}

          {/* Step 1: Basic Info */}
          {step === 1 && (
            <div className="bg-ui-surface rounded-panel p-8 border border-ui-line animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h2 className="text-xl font-semibold text-ui-ink mb-8 flex items-center gap-3">
                <div className="w-10 h-10 rounded-control bg-ui-subtle flex items-center justify-center text-ui-primary">
                  <Zap className="w-5 h-5" />
                </div>
                Business details
              </h2>
              
              <div className="space-y-8">
                <div>
                  <label className="block text-sm font-medium text-ui-ink mb-2">
                    Business name *
                  </label>
                  <input
                    type="text"
                    autoFocus
                    value={formData.name}
                    onChange={(e) => updateFormData("name", e.target.value)}
                    className="w-full px-5 py-4 bg-ui-surface border border-ui-input rounded-control text-ui-ink placeholder:text-ui-muted focus:outline-none focus:border-ui-primary focus:ring-2 focus:ring-ui-primary transition-all"
                    placeholder="e.g., Cedar Grill"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-ui-ink mb-2">
                    Menu link *
                  </label>
                  <div className="relative group">
                    <span className="absolute left-5 top-1/2 -translate-y-1/2 text-ui-muted font-bold pointer-events-none transition-colors group-focus-within:text-ui-primary">/c/</span>
                    <input
                      type="text"
                      value={formData.slug}
                      onChange={(e) => updateFormData("slug", e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                      className="w-full pl-12 pr-5 py-4 bg-ui-surface border border-ui-input rounded-control text-ui-ink placeholder:text-ui-muted focus:outline-none focus:border-ui-primary focus:ring-2 focus:ring-ui-primary transition-all font-mono"
                      placeholder="cedar-grill"
                    />
                  </div>
                  <p className="text-xs text-ui-muted font-bold mt-3 ml-1">
                    This is the permanent web address of the menu.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-ui-ink mb-3">
                    Business type *
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {businessTypes.map((type) => (
                      <button
                        key={type.id}
                        type="button"
                        onClick={() => updateFormData("business_type", type.id)}
                        className={`group flex flex-col items-center gap-3 p-5 rounded-control border transition-all duration-300 ${
                          formData.business_type === type.id
                            ? "bg-ui-primary border-ui-primary text-ui-primary-fg"
                            : "bg-ui-surface border-ui-line text-ui-muted hover:border-ui-input hover:bg-ui-subtle"
                        }`}
                      >
                        <div className={`p-3 rounded-control transition-colors ${
                          formData.business_type === type.id
                            ? "bg-ui-primary-hover"
                            : "bg-ui-subtle group-hover:bg-ui-line"
                        }`}>
                          <type.icon className="w-5 h-5" />
                        </div>
                        <span className="text-xs font-bold">{type.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-ui-ink mb-2">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => updateFormData("description", e.target.value)}
                    rows={4}
                    className="w-full px-5 py-4 bg-ui-surface border border-ui-input rounded-control text-ui-ink placeholder:text-ui-muted focus:outline-none focus:border-ui-primary focus:ring-2 focus:ring-ui-primary transition-all resize-none"
                    placeholder="A short description of the business..."
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Subscription */}
          {step === 2 && (
            <div className="bg-ui-surface rounded-panel p-8 border border-ui-line animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h2 className="text-xl font-semibold text-ui-ink mb-8 flex items-center gap-3">
                <div className="w-10 h-10 rounded-control bg-ui-subtle flex items-center justify-center text-ui-primary">
                  <Package className="w-5 h-5" />
                </div>
                Subscription
              </h2>
              
              <div className="space-y-8">
                <div>
                  <label className="block text-sm font-medium text-ui-ink mb-3">
                    Plan type *
                  </label>
                  <div className="grid grid-cols-3 gap-4">
                    {subscriptionTypes.map((type) => (
                      <button
                        key={type.id}
                        type="button"
                        onClick={() => updateFormData("subscription_type", type.id)}
                        className={`p-6 rounded-control border text-center transition-all duration-300 group ${
                          formData.subscription_type === type.id
                            ? "bg-ui-primary border-ui-primary"
                            : "bg-ui-surface border-ui-line hover:border-ui-input"
                        }`}
                      >
                        <p className={`font-bold text-lg transition-colors ${
                          formData.subscription_type === type.id ? "text-ui-primary-fg" : "text-ui-ink"
                        }`}>
                          {type.label}
                        </p>
                        <p className={`text-xs font-bold mt-2 transition-colors ${
                          formData.subscription_type === type.id ? "text-ui-primary-fg opacity-80" : "text-ui-muted"
                        }`}>{type.description}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {formData.subscription_type === "custom_years" && (
                  <div className="animate-in slide-in-from-top-2 duration-300">
                    <label className="block text-sm font-medium text-ui-ink mb-2">
                      Duration (years)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={formData.custom_years}
                      onChange={(e) => updateFormData("custom_years", parseInt(e.target.value) || 1)}
                      className="w-32 px-5 py-4 bg-ui-surface border border-ui-input rounded-control text-ui-ink focus:outline-none focus:border-ui-primary focus:ring-2 focus:ring-ui-primary transition-all font-mono"
                    />
                  </div>
                )}

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-ui-ink mb-2">
                      Amount paid
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.amount_paid}
                      onChange={(e) => updateFormData("amount_paid", e.target.value)}
                      className="w-full px-5 py-4 bg-ui-surface border border-ui-input rounded-control text-ui-ink placeholder:text-ui-muted focus:outline-none focus:border-ui-primary focus:ring-2 focus:ring-ui-primary transition-all"
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-ui-ink mb-2">
                      Currency
                    </label>
                    <select
                      value={formData.currency}
                      onChange={(e) => updateFormData("currency", e.target.value)}
                      className="w-full px-5 py-4 bg-ui-surface border border-ui-input rounded-control text-ui-ink focus:outline-none focus:border-ui-primary focus:ring-2 focus:ring-ui-primary transition-all appearance-none cursor-pointer"
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
                  <label className="block text-sm font-medium text-ui-ink mb-2">
                    Payment method
                  </label>
                  <select
                    value={formData.payment_method}
                    onChange={(e) => updateFormData("payment_method", e.target.value)}
                    className="w-full px-5 py-4 bg-ui-surface border border-ui-input rounded-control text-ui-ink focus:outline-none focus:border-ui-primary focus:ring-2 focus:ring-ui-primary transition-all appearance-none cursor-pointer"
                  >
                    <option value="">Select method...</option>
                    <option value="cash">Cash</option>
                    <option value="bank_transfer">Bank transfer</option>
                    <option value="mobile_payment">Mobile payment</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div className="pt-8 border-t border-ui-line">
                  <label className="block text-sm font-medium text-ui-ink mb-3">
                    Features
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {[
                      { key: "booking_enabled", label: "Bookings", icon: ChevronRight },
                      { key: "analytics_enabled", label: "Analytics", icon: ChevronRight },
                    ].map((feature) => (
                      <div key={feature.key} className="flex items-center justify-between p-4 bg-ui-surface border border-ui-line rounded-control hover:bg-ui-subtle transition-colors">
                        <span className="text-ui-ink font-medium text-sm">{feature.label}</span>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input 
                            type="checkbox" 
                            className="sr-only peer"
                            aria-label={feature.label}
                            checked={formData[feature.key as keyof typeof formData] as boolean}
                            onChange={(e) => updateFormData(feature.key, e.target.checked)}
                          />
                          <div className="w-10 h-5 bg-ui-line rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-ui-primary shadow-inner"></div>
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
            <div className="bg-ui-surface rounded-panel p-8 border border-ui-line animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h2 className="text-xl font-semibold text-ui-ink mb-2 flex items-center gap-3">
                <div className="w-10 h-10 rounded-control bg-ui-subtle flex items-center justify-center text-ui-primary">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                Admin account
              </h2>
              <p className="text-ui-muted mb-8 font-medium">
                Optional: create the first admin login for this catalog.
              </p>
              
              <div className="space-y-8">
                <div>
                  <label className="block text-sm font-medium text-ui-ink mb-2">
                    Admin name
                  </label>
                  <input
                    type="text"
                    autoFocus
                    value={formData.admin_name}
                    onChange={(e) => updateFormData("admin_name", e.target.value)}
                    className="w-full px-5 py-4 bg-ui-surface border border-ui-input rounded-control text-ui-ink placeholder:text-ui-muted focus:outline-none focus:border-ui-primary focus:ring-2 focus:ring-ui-primary transition-all font-bold"
                    placeholder="e.g., Rami Haddad"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-ui-ink mb-2">
                    Admin email
                  </label>
                  <input
                    type="email"
                    value={formData.admin_email}
                    onChange={(e) => updateFormData("admin_email", e.target.value)}
                    className="w-full px-5 py-4 bg-ui-surface border border-ui-input rounded-control text-ui-ink placeholder:text-ui-muted focus:outline-none focus:border-ui-primary focus:ring-2 focus:ring-ui-primary transition-all font-mono"
                    placeholder="owner@business.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-ui-ink mb-2">
                    Password {formData.admin_email && "(min. 8 characters)"}
                  </label>
                  <input
                    type="password"
                    value={formData.admin_password}
                    onChange={(e) => updateFormData("admin_password", e.target.value)}
                    className="w-full px-5 py-4 bg-ui-surface border border-ui-input rounded-control text-ui-ink placeholder:text-ui-muted focus:outline-none focus:border-ui-primary focus:ring-2 focus:ring-ui-primary transition-all font-mono"
                    placeholder="••••••••"
                  />
                </div>

                {formData.admin_email && formData.admin_password && formData.admin_password.length < 8 && (
                  <div className="bg-ui-surface border border-ui-danger rounded-control px-4 py-3 text-ui-danger text-sm font-medium">
                    Password must be at least 8 characters.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-12 px-2">
            {step > 1 ? (
              <button
                type="button"
                onClick={() => setStep(step - 1)}
                className="px-6 py-3 text-ui-muted font-medium text-sm hover:text-ui-ink transition-colors"
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
                className="px-6 py-3 bg-ui-primary text-ui-primary-fg hover:bg-ui-primary-hover font-semibold rounded-control disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-2 group"
              >
                Continue
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading || !canProceed()}
                className="px-6 py-3 bg-ui-primary text-ui-primary-fg hover:bg-ui-primary-hover font-semibold rounded-control disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-3 group"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    Create catalog
                    <Zap className="w-4 h-4" />
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

