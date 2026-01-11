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
      className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden bg-[#050505]"
    >
      {/* Background Intelligence Glows */}
      <div className="absolute top-0 -left-1/4 w-1/2 h-1/2 bg-primary/10 blur-[120px] rounded-full animate-pulse" />
      <div className="absolute bottom-0 -right-1/4 w-1/2 h-1/2 bg-primary/5 blur-[100px] rounded-full" />

      <div className="w-full max-w-md relative z-10 animate-in fade-in slide-in-from-bottom-8 duration-1000">
        {/* Core Identity Node */}
        <div className="text-center mb-12">
          <div 
            className="inline-flex items-center justify-center w-20 h-20 rounded-[2.5rem] mb-6 relative group"
          >
            <div className="absolute inset-0 rounded-[2.5rem] bg-primary blur-2xl opacity-20 group-hover:opacity-40 transition-opacity duration-500" />
            <div className="absolute inset-0 rounded-[2.5rem] border border-white/10 group-hover:border-white/20 transition-all duration-500" />
            <div className="relative z-10 w-full h-full rounded-[2.5rem] flex items-center justify-center overflow-hidden">
               <div className="absolute inset-0 opacity-20" style={{ background: `linear-gradient(135deg, var(--color-primary) 0%, var(--color-secondary) 100%)` }} />
               <Store className="w-8 h-8 text-white group-hover:scale-110 transition-transform duration-500" />
            </div>
          </div>
          <h1 className="text-3xl font-black text-white tracking-tighter uppercase leading-none">Admin Login</h1>
          <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em] mt-3 font-mono">
            Catalog: {slug}
          </p>
        </div>

        {/* Access Matrix Card */}
        <div className="glass-card p-10 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-[60px] rounded-full -translate-y-1/2 translate-x-1/2" />
          
          <form onSubmit={handleSubmit} className="space-y-8 relative z-10">
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-2xl px-5 py-4 text-red-400 text-[10px] font-black uppercase tracking-widest animate-in shake duration-500">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <label 
                className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] ml-2"
              >
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-6 py-4 bg-white/[0.03] border border-white/5 rounded-2xl text-white font-black tracking-tight focus:outline-none focus:border-primary/50 transition-all placeholder:text-white/10"
                placeholder="email@example.com"
                required
              />
            </div>

            <div className="space-y-2">
              <label 
                className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] ml-2"
              >
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-6 py-4 bg-white/[0.03] border border-white/5 rounded-2xl text-white font-black tracking-tight focus:outline-none focus:border-primary/50 transition-all placeholder:text-white/10 pr-14"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center text-white/20 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-5 px-8 bg-primary text-white rounded-[2rem] font-black text-[11px] uppercase tracking-[0.3em] shadow-lg shadow-primary/20 hover:shadow-primary/40 hover:scale-[1.02] transition-all duration-500 disabled:opacity-30 disabled:scale-100 flex items-center justify-center gap-3 group"
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

        <p className="text-center text-[9px] font-black text-white/10 uppercase tracking-[0.5em] mt-10">
          Digital Catalog Management System v2030
        </p>
      </div>
    </div>
  );
}

