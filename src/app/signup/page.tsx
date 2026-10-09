"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    ArrowRight,
    Check,
    Loader2,
    Globe,
    User,
    Mail,
    Lock,
    QrCode
} from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { CATALOG_THEMES, DEFAULT_THEME_ID } from "@/config/themes";
import { PinInput } from "./_components/PinInput";
import { Suspense } from "react";

function SignupForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const plan = searchParams.get("plan") || "essential";

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
        themeId: DEFAULT_THEME_ID,
        plan: plan
    });

    const [verifying, setVerifying] = useState(false);
    const [verificationToken, setVerificationToken] = useState<string | null>(null);

    const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "");
        setFormData({ ...formData, catalogSlug: value });
    };

    const handleSendCode = async () => {
        if (!formData.email || !formData.password || !formData.name) return;
        if (formData.password.length < 8) {
            setError("Password must be at least 8 characters.");
            return;
        }
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
                const data = await res.json();
                setVerificationToken(data.verificationToken);
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
                body: JSON.stringify({ ...formData, verificationToken }),
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
        <main lang="en" dir="ltr" className="platform min-h-screen relative flex items-center justify-center px-4 py-10">
            <div className="w-full max-w-xl relative z-10">
                <Link href="/" className="flex items-center gap-2 mb-8 justify-center font-semibold">
                    <span className="flex h-8 w-8 items-center justify-center rounded-control bg-ui-primary text-ui-primary-fg" aria-hidden>
                        <QrCode className="h-4 w-4" />
                    </span>
                    Coredex
                </Link>

                <AnimatePresence mode="wait">
                    {!success ? (
                        <motion.div
                            key="form"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="glass-card p-6 sm:p-10 rounded-panel border border-ui-line relative overflow-hidden"
                        >

                            <div className="relative z-10">
                                <div className="mb-10 text-center">
                                    <h1 className="text-2xl sm:text-3xl font-semibold mb-4">
                                        {step === 1 ? "Create your account" : step === 1.5 ? "Check your email" : step === 2 ? "Your restaurant" : "Choose your colours"}
                                    </h1>
                                    <div className="flex items-center justify-center gap-2 mb-4">
                                        <span className="px-3 py-1 bg-ui-subtle text-ui-primary text-xs font-semibold rounded-full border border-ui-line">
                                            <span className="capitalize">{formData.plan}</span> plan · 2-day free trial
                                        </span>
                                    </div>
                                    <p className="text-ui-muted text-sm font-medium">
                                        Step {step === 1.5 ? "1.5" : step} of 3 — {step === 1 ? "Owner verification" : step === 1.5 ? "Email Confirmation" : step === 2 ? "Environment config" : "Visual identity"}
                                    </p>
                                </div>

                                {error && (
                                    <div className="mb-8 p-4 bg-ui-subtle border border-ui-line rounded-control text-xs font-semibold text-ui-primary text-center">
                                        {error}
                                    </div>
                                )}

                                <form onSubmit={handleSignup} className="space-y-6">
                                    {step === 1 ? (
                                        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                                            <div className="space-y-2">
                                                <label className="text-xs font-semibold text-ui-muted ml-2">Full Name</label>
                                                <div className="relative group">
                                                    <User className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-ui-muted group-focus-within:text-primary transition-colors" />
                                                    <input
                                                        type="text"
                                                        required
                                                        placeholder="Your full name"
                                                        value={formData.name}
                                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                        className="w-full pl-14 pr-6 py-4 bg-ui-bg border border-ui-input rounded-control text-sm font-bold focus:outline-none focus:border-ui-primary transition-all"
                                                    />
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <label className="text-xs font-semibold text-ui-muted ml-2">Email Address</label>
                                                <div className="relative group">
                                                    <Mail className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-ui-muted group-focus-within:text-primary transition-colors" />
                                                    <input
                                                        type="email"
                                                        required
                                                        placeholder="you@restaurant.com"
                                                        value={formData.email}
                                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                                        className="w-full pl-14 pr-6 py-4 bg-ui-bg border border-ui-input rounded-control text-sm font-bold focus:outline-none focus:border-ui-primary transition-all"
                                                    />
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <label className="text-xs font-semibold text-ui-muted ml-2">Secure Password</label>
                                                <div className="relative group">
                                                    <Lock className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-ui-muted group-focus-within:text-primary transition-colors" />
                                                    <input
                                                        type="password"
                                                        required
                                                        placeholder="••••••••"
                                                        value={formData.password}
                                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                                        className="w-full pl-14 pr-6 py-4 bg-ui-bg border border-ui-input rounded-control text-sm font-bold focus:outline-none focus:border-ui-primary transition-all"
                                                    />
                                                </div>
                                            </div>

                                            <button
                                                type="button"
                                                disabled={loading}
                                                onClick={handleSendCode}
                                                className="w-full py-5 bg-ui-primary text-ui-primary-fg rounded-control font-semibold text-sm active:scale-95 transition-all shadow-xl flex items-center justify-center gap-2 disabled:opacity-50"
                                            >
                                                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Continue <ArrowRight className="w-4 h-4" /></>}
                                            </button>
                                        </motion.div>
                                    ) : step === 1.5 ? (
                                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-10 py-4">
                                            <div className="text-center">
                                                <p className="text-sm text-ui-muted mb-2">We sent a 6-digit code to</p>
                                                <p className="text-sm font-semibold text-ui-primary">{formData.email}</p>
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
                                                    className="text-xs font-semibold text-ui-muted hover:text-ui-ink transition-colors"
                                                >
                                                    Didn't receive code? Resend
                                                </button>
                                            </div>

                                            <button
                                                type="button"
                                                onClick={() => setStep(1)}
                                                className="w-full py-4 text-ui-muted font-semibold text-xs hover:text-ui-ink transition-colors"
                                            >
                                                Use different email
                                            </button>
                                        </motion.div>
                                    ) : step === 2 ? (
                                        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                                            <div className="space-y-2">
                                                <label className="text-xs font-semibold text-ui-muted ml-2">Business Type</label>
                                                <select
                                                    value={formData.businessType}
                                                    onChange={(e) => setFormData({ ...formData, businessType: e.target.value })}
                                                    className="w-full px-6 py-4 bg-ui-bg border border-ui-input rounded-control text-sm font-bold focus:outline-none focus:border-ui-primary transition-all appearance-none cursor-pointer"
                                                >
                                                    <option value="restaurant">Restaurant / F&B</option>
                                                    <option value="retail">Retail Store</option>
                                                    <option value="service">Service Industry</option>
                                                    <option value="hotel">Hotel / Luxury</option>
                                                </select>
                                            </div>

                                            <div className="space-y-2">
                                                <label className="text-xs font-semibold text-ui-muted ml-2">Business Name</label>
                                                <input
                                                    type="text"
                                                    required
                                                    placeholder="e.g. Prime Steaks"
                                                    value={formData.catalogName}
                                                    onChange={(e) => setFormData({ ...formData, catalogName: e.target.value })}
                                                    className="w-full px-6 py-4 bg-ui-bg border border-ui-input rounded-control text-sm font-bold focus:outline-none focus:border-ui-primary transition-all"
                                                />
                                            </div>

                                            <div className="space-y-2">
                                                <label className="text-xs font-semibold text-ui-muted ml-2">Custom URL Slug</label>
                                                <div className="relative group">
                                                    <Globe className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-ui-muted group-focus-within:text-primary transition-colors" />
                                                    <input
                                                        type="text"
                                                        required
                                                        placeholder="prime-steaks"
                                                        value={formData.catalogSlug}
                                                        onChange={handleSlugChange}
                                                        className="w-full pl-14 pr-6 py-4 bg-ui-bg border border-ui-input rounded-control text-sm font-bold focus:outline-none focus:border-ui-primary transition-all font-mono lowercase"
                                                    />
                                                </div>
                                                <p className="text-xs font-bold text-ui-muted mt-2 ml-2">
                                                    Your catalog will live at: <span className="text-ui-muted">coredex.com/c/{formData.catalogSlug || "..."}</span>
                                                </p>
                                            </div>

                                            <div className="flex gap-4">
                                                <button
                                                    type="button"
                                                    onClick={() => setStep(1)}
                                                    className="flex-shrink-0 px-8 py-5 bg-ui-subtle border border-ui-line text-ui-muted rounded-control font-semibold text-xs hover:text-ui-ink transition-all"
                                                >
                                                    Back
                                                </button>
                                                <button
                                                    type="button"
                                                    disabled={!formData.catalogName || !formData.catalogSlug}
                                                    onClick={() => setStep(3)}
                                                    className="flex-1 py-5 bg-ui-primary text-ui-primary-fg rounded-control font-semibold text-sm active:scale-95 transition-all shadow-xl flex items-center justify-center gap-2"
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
                                                        className={`p-6 rounded-panel border transition-all text-left group relative overflow-hidden ${formData.themeId === theme.id
                                                            ? "bg-ui-subtle border-ui-primary"
                                                            : "bg-ui-bg border-ui-line hover:border-ui-input"
                                                            }`}
                                                    >
                                                        <div className="flex items-center justify-between mb-2">
                                                            <span className={`text-sm font-semibold ${formData.themeId === theme.id ? "text-ui-primary" : "text-ui-muted"}`}>
                                                                {theme.name}
                                                            </span>
                                                            {formData.themeId === theme.id && <div className="w-2 h-2 rounded-full bg-ui-primary" />}
                                                        </div>
                                                        <p className="text-xs text-ui-muted font-medium mb-4 leading-relaxed line-clamp-1">{theme.description}</p>

                                                        {/* Preview Rectangles */}
                                                        <div className="flex gap-2">
                                                            <div className="flex -space-x-1">
                                                                <div className="w-6 h-6 rounded-full border border-ui-line" style={{ backgroundColor: theme.light.primary }} />
                                                                <div className="w-6 h-6 rounded-full border border-ui-line" style={{ backgroundColor: theme.light.background }} />
                                                                <div className="w-6 h-6 rounded-full border border-ui-line" style={{ backgroundColor: theme.dark.background }} />
                                                            </div>
                                                        </div>

                                                        {formData.themeId === theme.id && (
                                                            <div className="absolute inset-0 border-2 border-ui-primary rounded-panel pointer-events-none" />
                                                        )}
                                                    </button>
                                                ))}
                                            </div>

                                            <div className="flex gap-4">
                                                <button
                                                    type="button"
                                                    onClick={() => setStep(2)}
                                                    className="flex-shrink-0 px-8 py-5 bg-ui-subtle border border-ui-line text-ui-muted rounded-control font-semibold text-xs hover:text-ui-ink transition-all"
                                                >
                                                    Back
                                                </button>
                                                <button
                                                    type="submit"
                                                    disabled={loading}
                                                    className="flex-1 py-5 bg-ui-primary text-ui-primary-fg rounded-control font-semibold text-sm active:scale-95 transition-all shadow-xl flex items-center justify-center gap-3 disabled:opacity-50"
                                                >
                                                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Create my menu</>}
                                                </button>
                                            </div>
                                        </motion.div>
                                    )}
                                </form>

                            </div>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="success"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="glass-card p-12 rounded-panel border border-ui-line text-center"
                        >
                            <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-8">
                                <Check className="w-10 h-10 text-ui-ink stroke-[4]" />
                            </div>
                            <h1 className="text-3xl font-semibold mb-4">Your menu is ready</h1>
                            <p className="text-ui-muted text-sm font-semibold mb-10 leading-relaxed">
                                Environment ready for {formData.catalogName}.<br />
                                Relocating to admin dashboard...
                            </p>
                            <Loader2 className="w-8 h-8 text-ui-success animate-spin mx-auto" />
                        </motion.div>
                    )}
                </AnimatePresence>

                <p className="mt-12 text-center text-xs font-semibold text-ui-input">
                    Coredex Solutions © 2026
                </p>
            </div>
        </main>
    );
}

export default function SignupPage() {
    return (
        <Suspense fallback={
            <main className="platform min-h-screen flex items-center justify-center">
                <Loader2 className="w-10 h-10 text-ui-primary animate-spin" />
            </main>
        }>
            <SignupForm />
        </Suspense>
    );
}