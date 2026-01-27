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
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-tr from-primary to-purple-500 mb-6 shadow-[0_0_40px_-10px_rgba(124,58,237,0.5)]">
            <Shield className="w-10 h-10 text-white fill-white/20" />
          </div>
          <h1 className="text-4xl font-bold text-white tracking-tighter mb-2">Access Portal</h1>
          <p className="text-white/40 font-medium tracking-wide">Coredex Solutions</p>
        </div>

        {/* Login Card */}
        <div className="glass backdrop-blur-2xl rounded-[2rem] p-10 border border-white/10 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl px-4 py-3 text-purple-400 text-sm font-medium flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse" />
                {error}
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-white/40 uppercase tracking-widest mb-3 ml-1">
                Identity
              </label>
              <input
                ref={emailRef}
                type="email"
                name="email"
                autoComplete="email"
                className="w-full px-5 py-4 bg-black/40 border border-white/5 rounded-2xl text-white placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all focus:bg-black/60"
                placeholder="admin@coredex.digital"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-white/40 uppercase tracking-widest mb-3 ml-1">
                Security Key
              </label>
              <div className="relative">
                <input
                  ref={passwordRef}
                  type={showPassword ? "text" : "password"}
                  name="password"
                  autoComplete="current-password"
                  className="w-full px-5 py-4 bg-black/40 border border-white/5 rounded-2xl text-white placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all pr-12 focus:bg-black/60"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 px-6 bg-white text-black font-bold rounded-2xl hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-3 shadow-[0_0_20px_-5px_rgba(255,255,255,0.3)]"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  AUTHENTICATING...
                </>
              ) : (
                "LOGIN"
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-white/30 text-xs mt-8 font-mono tracking-widest uppercase">
          SECURE CONNECTION • ENCRYPTED
        </p>
      </div>
    </div>
  );
}

