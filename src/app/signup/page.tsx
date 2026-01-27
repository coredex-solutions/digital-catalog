"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Zap,
    ArrowRight,
    Check,
    Loader2,
    Globe,
    ShieldCheck,
    Building2,
    User,
    Mail,
    Lock,
    Sparkles
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CATALOG_THEMES, DEFAULT_THEME_ID } from "@/config/themes";
import { PinInput } from "./_components/PinInput";

export default function SignupPage() {
    const router = useRouter();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const [formData, setFormData] = useState({
        email: "",
        password: "",
        name: "",
        catalogName: "",
        catalogSlug: "",
        businessType: "restaurant",
        themeId: DEFAULT_THEME_ID
    });

    const [verifying, setVerifying] = useState(false);

    const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "");
        setFormData({ ...formData, catalogSlug: value });
    };

    const handleSendCode = async () => {
        if (!formData.email || !formData.password || !formData.name) return;
        setLoading(true);
        setError(null);
        try {
            const res = await fetch("/api/auth/send-verification", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: formData.email }),
            });
            if (res.ok) {
                setStep(1.5);
            } else {
                const data = await res.json();
                setError(data.error || "Failed to send code");
            }
        } catch (err) {
            setError("Connection error");
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyCode = async (code: string) => {
        setVerifying(true);
        setError(null);
        try {
            const res = await fetch("/api/auth/verify-code", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: formData.email, code }),
            });
            if (res.ok) {
                setStep(2);
            } else {
                const data = await res.json();
                setError(data.error || "Invalid code");
            }
        } catch (err) {
            setError("Verification failed");
        } finally {
            setVerifying(false);
        }
    };

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const res = await fetch("/api/auth/signup", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            const data = await res.json();

            if (res.ok) {
                setSuccess(true);
                setTimeout(() => {
                    router.push(`/c/${formData.catalogSlug}/admin/login`);
                }, 3000);
            } else {
                setError(data.error || "Signup failed");
            }
        } catch (err) {
            setError("An unexpected error occurred");
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="min-h-screen bg-[#020203] text-white selection:bg-primary/30 font-outfit relative overflow-hidden flex items-center justify-center p-6">
            {/* Background Orbs */}
            <div className="fixed inset-0 pointer-events-none opacity-40 z-0">
                <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-primary/10 rounded-full blur-[160px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-violet-600/5 rounded-full blur-[160px]" />
            </div>

            <div className="w-full max-w-xl relative z-10">
                <Link href="/" className="flex items-center gap-3 mb-12 group justify-center">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary to-secondary flex items-center justify-center shadow-lg group-hover:rotate-12 transition-transform duration-500">
                        <Zap className="text-white w-5 h-5 fill-white" />
                    </div>
                    <span className="text-xl font-black tracking-tighter uppercase italic">Coredex Solutions</span>
                </Link>

                <AnimatePresence mode="wait">
                    {!success ? (
                        <motion.div
                            key="form"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="glass-card p-10 md:p-12 rounded-[2.5rem] border border-white/5 relative overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 p-8 text-white/5">
                                <Building2 className="w-32 h-32" />
                            </div>

                            <div className="relative z-10">
                                <div className="mb-10 text-center">
                                    <h2 className="text-4xl font-black tracking-tighter mb-4 italic">
                                        {step === 1 ? "ACCOUNT SETUP" : step === 1.5 ? "EMAIL VERIFICATION" : step === 2 ? "CATALOG DETAILS" : "DESIGN SIGNATURE"}
                                    </h2>
                                    <div className="flex items-center justify-center gap-2 mb-4">
                                        <span className="px-3 py-1 bg-primary/20 text-primary text-[9px] font-black uppercase tracking-widest rounded-full border border-primary/20">
                                            Free 48h Premium Trial
                                        </span>
                                    </div>
                                    <p className="text-white/40 text-sm font-medium uppercase tracking-widest">
                                        Step {step === 1.5 ? "1.5" : step} of 3 — {step === 1 ? "Owner verification" : step === 1.5 ? "Email Confirmation" : step === 2 ? "Environment config" : "Visual identity"}
                                    </p>
                                </div>

                                {error && (
                                    <div className="mb-8 p-4 bg-purple-500/10 border border-purple-500/20 rounded-2xl text-[10px] font-black uppercase tracking-widest text-purple-400 text-center">
                                        {error}
                                    </div>
                                )}

                                <form onSubmit={handleSignup} className="space-y-6">
                                    {step === 1 ? (
                                        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] ml-2">Full Name</label>
                                                <div className="relative group">
                                                    <User className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within:text-primary transition-colors" />
                                                    <input
                                                        type="text"
                                                        required
                                                        placeholder="e.g. Alexander Pierce"
                                                        value={formData.name}
                                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                        className="w-full pl-14 pr-6 py-4 bg-white/[0.03] border border-white/5 rounded-2xl text-sm font-bold focus:outline-none focus:border-primary/50 transition-all"
                                                    />
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] ml-2">Email Address</label>
                                                <div className="relative group">
                                                    <Mail className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within:text-primary transition-colors" />
                                                    <input
                                                        type="email"
                                                        required
                                                        placeholder="ceo@enterprise.com"
                                                        value={formData.email}
                                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                                        className="w-full pl-14 pr-6 py-4 bg-white/[0.03] border border-white/5 rounded-2xl text-sm font-bold focus:outline-none focus:border-primary/50 transition-all"
                                                    />
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] ml-2">Secure Password</label>
                                                <div className="relative group">
                                                    <Lock className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within:text-primary transition-colors" />
                                                    <input
                                                        type="password"
                                                        required
                                                        placeholder="••••••••"
                                                        value={formData.password}
                                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                                        className="w-full pl-14 pr-6 py-4 bg-white/[0.03] border border-white/5 rounded-2xl text-sm font-bold focus:outline-none focus:border-primary/50 transition-all"
                                                    />
                                                </div>
                                            </div>

                                            <button
                                                type="button"
                                                disabled={loading}
                                                onClick={handleSendCode}
                                                className="w-full py-5 bg-white text-black rounded-2xl font-black uppercase tracking-widest text-sm hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-white/5 flex items-center justify-center gap-2 disabled:opacity-50"
                                            >
                                                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Continue <ArrowRight className="w-4 h-4" /></>}
                                            </button>
                                        </motion.div>
                                    ) : step === 1.5 ? (
                                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-10 py-4">
                                            <div className="text-center">
                                                <p className="text-sm text-white/40 mb-2">We sent a 6-digit code to</p>
                                                <p className="text-sm font-black text-primary">{formData.email}</p>
                                            </div>

                                            <PinInput
                                                length={6}
                                                onComplete={handleVerifyCode}
                                                disabled={verifying}
                                            />

                                            <div className="text-center">
                                                <button
                                                    type="button"
                                                    onClick={handleSendCode}
                                                    className="text-[10px] font-black uppercase tracking-widest text-white/20 hover:text-white transition-colors"
                                                >
                                                    Didn't receive code? Resend
                                                </button>
                                            </div>

                                            <button
                                                type="button"
                                                onClick={() => setStep(1)}
                                                className="w-full py-4 text-white/20 font-black uppercase tracking-widest text-[10px] hover:text-white transition-colors"
                                            >
                                                Use different email
                                            </button>
                                        </motion.div>
                                    ) : step === 2 ? (
                                        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] ml-2">Business Type</label>
                                                <select
                                                    value={formData.businessType}
                                                    onChange={(e) => setFormData({ ...formData, businessType: e.target.value })}
                                                    className="w-full px-6 py-4 bg-white/[0.03] border border-white/5 rounded-2xl text-sm font-bold focus:outline-none focus:border-primary/50 transition-all appearance-none cursor-pointer uppercase tracking-widest"
                                                >
                                                    <option value="restaurant">Restaurant / F&B</option>
                                                    <option value="retail">Retail Store</option>
                                                    <option value="service">Service Industry</option>
                                                    <option value="hotel">Hotel / Luxury</option>
                                                </select>
                                            </div>

                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] ml-2">Business Name</label>
                                                <input
                                                    type="text"
                                                    required
                                                    placeholder="e.g. Prime Steaks"
                                                    value={formData.catalogName}
                                                    onChange={(e) => setFormData({ ...formData, catalogName: e.target.value })}
                                                    className="w-full px-6 py-4 bg-white/[0.03] border border-white/5 rounded-2xl text-sm font-bold focus:outline-none focus:border-primary/50 transition-all"
                                                />
                                            </div>

                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] ml-2">Custom URL Slug</label>
                                                <div className="relative group">
                                                    <Globe className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within:text-primary transition-colors" />
                                                    <input
                                                        type="text"
                                                        required
                                                        placeholder="prime-steaks"
                                                        value={formData.catalogSlug}
                                                        onChange={handleSlugChange}
                                                        className="w-full pl-14 pr-6 py-4 bg-white/[0.03] border border-white/5 rounded-2xl text-sm font-bold focus:outline-none focus:border-primary/50 transition-all font-mono lowercase"
                                                    />
                                                </div>
                                                <p className="text-[9px] font-bold text-white/20 uppercase tracking-widest mt-2 ml-2">
                                                    Your catalog will live at: <span className="text-white/40">coredex.com/c/{formData.catalogSlug || "..."}</span>
                                                </p>
                                            </div>

                                            <div className="flex gap-4">
                                                <button
                                                    type="button"
                                                    onClick={() => setStep(1)}
                                                    className="flex-shrink-0 px-8 py-5 bg-white/5 border border-white/10 text-white/40 rounded-2xl font-black uppercase tracking-widest text-xs hover:text-white transition-all"
                                                >
                                                    Back
                                                </button>
                                                <button
                                                    type="button"
                                                    disabled={!formData.catalogName || !formData.catalogSlug}
                                                    onClick={() => setStep(3)}
                                                    className="flex-1 py-5 bg-white text-black rounded-2xl font-black uppercase tracking-widest text-sm hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-white/5 flex items-center justify-center gap-2"
                                                >
                                                    Continue <ArrowRight className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </motion.div>
                                    ) : (
                                        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
                                            <div className="grid grid-cols-1 gap-4">
                                                {CATALOG_THEMES.map((theme) => (
                                                    <button
                                                        key={theme.id}
                                                        type="button"
                                                        onClick={() => setFormData({ ...formData, themeId: theme.id })}
                                                        className={`p-6 rounded-3xl border transition-all text-left group relative overflow-hidden ${formData.themeId === theme.id
                                                            ? "bg-white/5 border-primary shadow-[0_0_20px_rgba(var(--color-primary-rgb),0.1)]"
                                                            : "bg-white/[0.02] border-white/5 hover:border-white/10"
                                                            }`}
                                                    >
                                                        <div className="flex items-center justify-between mb-2">
                                                            <span className={`text-sm font-black uppercase tracking-widest ${formData.themeId === theme.id ? "text-primary" : "text-white/60"}`}>
                                                                {theme.name}
                                                            </span>
                                                            {formData.themeId === theme.id && <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />}
                                                        </div>
                                                        <p className="text-[10px] text-white/30 font-medium mb-4 leading-relaxed line-clamp-1">{theme.description}</p>

                                                        {/* Preview Rectangles */}
                                                        <div className="flex gap-2">
                                                            <div className="flex -space-x-1">
                                                                <div className="w-6 h-6 rounded-full border border-black/20" style={{ backgroundColor: theme.light.primary }} />
                                                                <div className="w-6 h-6 rounded-full border border-black/20" style={{ backgroundColor: theme.light.background }} />
                                                                <div className="w-6 h-6 rounded-full border border-black/20" style={{ backgroundColor: theme.dark.background }} />
                                                            </div>
                                                        </div>

                                                        {formData.themeId === theme.id && (
                                                            <div className="absolute inset-0 border-2 border-primary rounded-3xl pointer-events-none" />
                                                        )}
                                                    </button>
                                                ))}
                                            </div>

                                            <div className="flex gap-4">
                                                <button
                                                    type="button"
                                                    onClick={() => setStep(2)}
                                                    className="flex-shrink-0 px-8 py-5 bg-white/5 border border-white/10 text-white/40 rounded-2xl font-black uppercase tracking-widest text-xs hover:text-white transition-all"
                                                >
                                                    Back
                                                </button>
                                                <button
                                                    type="submit"
                                                    disabled={loading}
                                                    className="flex-1 py-5 bg-primary text-white rounded-2xl font-black uppercase tracking-widest text-sm hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-primary/20 flex items-center justify-center gap-3 disabled:opacity-50"
                                                >
                                                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Launch Your Catalog <Zap className="w-4 h-4 fill-white" /></>}
                                                </button>
                                            </div>
                                        </motion.div>
                                    )}
                                </form>

                                <div className="mt-12 pt-8 border-t border-white/5">
                                    <div className="flex items-center gap-6 justify-center">
                                        <div className="flex items-center gap-2 text-[9px] font-black text-white/20 uppercase tracking-widest">
                                            <ShieldCheck className="w-4 h-4 text-green-500/40" />
                                            Secure & Encrypted
                                        </div>
                                        <div className="flex items-center gap-2 text-[9px] font-black text-white/20 uppercase tracking-widest">
                                            <Sparkles className="w-4 h-4 text-primary/40" />
                                            AI Engine Ready
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="success"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="glass-card p-12 rounded-[3rem] border border-green-500/20 text-center animate-pulse shadow-[0_0_80px_rgba(34,197,94,0.1)]"
                        >
                            <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-8 shadow-[0_0_30px_rgba(34,197,94,0.4)]">
                                <Check className="w-10 h-10 text-white stroke-[4]" />
                            </div>
                            <h2 className="text-4xl font-black tracking-tighter mb-4 italic">CATALOG READY</h2>
                            <p className="text-white/40 text-sm font-black uppercase tracking-[0.2em] mb-10 leading-relaxed">
                                Environment ready for {formData.catalogName}.<br />
                                Relocating to admin dashboard...
                            </p>
                            <Loader2 className="w-8 h-8 text-green-500 animate-spin mx-auto" />
                        </motion.div>
                    )}
                </AnimatePresence>

                <p className="mt-12 text-center text-[10px] font-black text-white/10 uppercase tracking-[0.4em]">
                    Coredex Solutions © 2026
                </p>
            </div>
        </main>
    );
}
