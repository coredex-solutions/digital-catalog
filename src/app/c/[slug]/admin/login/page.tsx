"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Eye, EyeOff, Store, Loader2, ArrowRight } from "lucide-react";

export default function CatalogAdminLoginPage() {
  const router = useRouter();
  const params = useParams();
  const slug = params.slug as string;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch(`/api/c/${slug}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Login Failed: Invalid Credentials");
      }

      localStorage.setItem(`catalog_admin_token_${slug}`, data.token);
      router.push(`/c/${slug}/admin`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden bg-ui-bg"
    >

      <div className="w-full max-w-md relative z-10">
        {/* Core Identity Node */}
        <div className="text-center mb-12">
          <div 
            className="inline-flex items-center justify-center w-20 h-20 rounded-panel mb-6 relative group"
          >
            <div className="absolute inset-0 rounded-panel border border-ui-line group-hover:border-ui-input transition-all duration-500" />
            <div className="relative z-10 w-full h-full rounded-panel flex items-center justify-center overflow-hidden">
               <div className="absolute inset-0 opacity-20" style={{ background: `linear-gradient(135deg, var(--color-primary) 0%, var(--color-secondary) 100%)` }} />
               <Store className="w-8 h-8 text-ui-ink transition-transform duration-500" />
            </div>
          </div>
          <h1 className="text-3xl font-semibold text-ui-ink leading-none">Admin Login</h1>
          <p className="text-sm text-ui-muted mt-3">
            Catalog: {slug}
          </p>
        </div>

        {/* Access Matrix Card */}
        <div className="glass-card p-10 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-ui-subtle rounded-full -translate-y-1/2 translate-x-1/2" />
          
          <form onSubmit={handleSubmit} className="space-y-8 relative z-10">
            {error && (
              <div className="bg-ui-subtle border border-ui-line rounded-control px-5 py-4 text-ui-primary text-xs font-semibold animate-in shake duration-500">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <label 
                className="text-xs font-semibold text-ui-muted ml-2"
              >
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-6 py-4 bg-ui-bg border border-ui-input rounded-control text-ui-ink font-semibold focus:outline-none focus:border-ui-primary transition-all placeholder:text-ui-muted"
                placeholder="email@example.com"
                required
              />
            </div>

            <div className="space-y-2">
              <label 
                className="text-xs font-semibold text-ui-muted ml-2"
              >
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-6 py-4 bg-ui-bg border border-ui-input rounded-control text-ui-ink font-semibold focus:outline-none focus:border-ui-primary transition-all placeholder:text-ui-muted pr-14"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center text-ui-muted hover:text-ui-ink transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-5 px-8 bg-ui-primary text-ui-primary-fg rounded-panel font-semibold text-xs shadow-lg transition-all duration-500 disabled:opacity-30 disabled:scale-100 flex items-center justify-center gap-3 group"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Authenticating...
                </>
              ) : (
                <>
                  Sign In
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-xs font-semibold text-ui-input mt-10">
          Coredex
        </p>
      </div>
    </div>
  );
}

