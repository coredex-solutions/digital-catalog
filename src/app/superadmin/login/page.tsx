"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Shield, Loader2 } from "lucide-react";

export default function SuperAdminLoginPage() {
  const router = useRouter();
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    // Read values from refs (works with browser automation)
    const email = emailRef.current?.value || "";
    const password = passwordRef.current?.value || "";

    try {
      const res = await fetch("/api/superadmin/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Login failed");
      }

      // Store token
      localStorage.setItem("superadmin_token", data.token);

      // Redirect to dashboard
      router.push("/superadmin");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo/Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-panel bg-ui-primary mb-6">
            <Shield className="w-8 h-8 text-ui-primary-fg" />
          </div>
          <h1 className="text-3xl font-semibold text-ui-ink mb-2">Super Admin sign in</h1>
          <p className="text-ui-muted font-medium">Coredex Solutions</p>
        </div>

        {/* Login Card */}
        <div className="bg-ui-surface rounded-panel p-8 border border-ui-line shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="bg-ui-surface border border-ui-danger rounded-control px-4 py-3 text-ui-danger text-sm font-medium flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-ui-danger" />
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-ui-ink mb-2">
                Email
              </label>
              <input
                ref={emailRef}
                type="email"
                name="email"
                autoComplete="email"
                className="w-full px-5 py-4 bg-ui-surface border border-ui-input rounded-control text-ui-ink placeholder:text-ui-muted focus:outline-none focus:ring-2 focus:ring-ui-primary focus:border-ui-primary transition-all"
                placeholder="you@coredex.solutions"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-ui-ink mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  ref={passwordRef}
                  type={showPassword ? "text" : "password"}
                  name="password"
                  autoComplete="current-password"
                  className="w-full px-5 py-4 bg-ui-surface border border-ui-input rounded-control text-ui-ink placeholder:text-ui-muted focus:outline-none focus:ring-2 focus:ring-ui-primary focus:border-ui-primary transition-all pr-12"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-ui-muted hover:text-ui-ink transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 px-6 bg-ui-primary text-ui-primary-fg font-bold rounded-control hover:bg-ui-primary-hover disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-3"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Signing in...
                </>
              ) : (
                "Sign in"
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-ui-muted text-xs mt-8">
          Internal access for Coredex staff only
        </p>
      </div>
    </div>
  );
}

