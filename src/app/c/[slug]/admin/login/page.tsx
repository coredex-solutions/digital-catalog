"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Eye, EyeOff, Store, Loader2 } from "lucide-react";

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
        throw new Error(data.error || "Login failed");
      }

      // Store token with catalog slug prefix
      localStorage.setItem(`catalog_admin_token_${slug}`, data.token);
      
      // Redirect to catalog admin dashboard
      router.push(`/c/${slug}/admin`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center px-4"
      style={{ backgroundColor: 'var(--color-background)', color: 'var(--color-text)' }}
    >
      <div className="w-full max-w-md">
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <div 
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 shadow-lg"
            style={{ 
              background: `linear-gradient(135deg, var(--color-primary) 0%, var(--color-secondary) 100%)`
            }}
          >
            <Store className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold">Admin Login</h1>
          <p style={{ color: 'var(--color-text-muted)' }} className="mt-1">
            Manage your catalog
          </p>
        </div>

        {/* Login Card */}
        <div 
          className="rounded-2xl p-8 shadow-xl border"
          style={{ 
            backgroundColor: 'var(--color-surface)',
            borderColor: 'color-mix(in srgb, var(--color-text) 10%, transparent)'
          }}
        >
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 text-red-400 text-sm">
                {error}
              </div>
            )}

            <div>
              <label 
                className="block text-sm font-medium mb-2"
                style={{ color: 'var(--color-text-muted)' }}
              >
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-xl focus:outline-none focus:ring-2 transition-all"
                style={{ 
                  backgroundColor: 'var(--color-background)',
                  borderColor: 'color-mix(in srgb, var(--color-text) 20%, transparent)',
                  color: 'var(--color-text)'
                }}
                placeholder="admin@example.com"
                required
              />
            </div>

            <div>
              <label 
                className="block text-sm font-medium mb-2"
                style={{ color: 'var(--color-text-muted)' }}
              >
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl focus:outline-none focus:ring-2 transition-all pr-12"
                  style={{ 
                    backgroundColor: 'var(--color-background)',
                    color: 'var(--color-text)'
                  }}
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 opacity-60 hover:opacity-100"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 text-white font-semibold rounded-xl focus:outline-none focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
              style={{ 
                background: `linear-gradient(135deg, var(--color-primary) 0%, var(--color-secondary) 100%)`
              }}
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Signing in...
                </>
              ) : (
                "Sign In"
              )}
            </button>
          </form>
        </div>

        <p 
          className="text-center text-sm mt-6"
          style={{ color: 'var(--color-text-muted)' }}
        >
          Catalog Management Portal
        </p>
      </div>
    </div>
  );
}

