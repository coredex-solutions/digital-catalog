"use client";

import { motion, useScroll, useTransform, AnimatePresence, useSpring } from "framer-motion";
import {
  QrCode,
  Sparkles,
  Globe,
  Zap,
  ShieldCheck,
  ChevronRight,
  ArrowUpRight,
  Menu,
  X,
  CreditCard,
  Cpu,
  Layers,
  BarChart3,
  Check,
  Star,
  Smartphone,
  MousePointer2,
  Terminal,
  Infinity as InfinityIcon,
  MessageCircle,
  Mail
} from "lucide-react";
import { useState, useRef, useEffect } from "react";
import Link from "next/link";

const FEATURE_CARDS = [
  {
    title: "Instant Multi-Tenancy",
    desc: "Deploy unique digital environments for thousands of businesses on a single infrastructure.",
    icon: Globe,
    color: "from-violet-500/20 to-violet-400/20",
    stats: "0.1s Deploy Time",
    textColor: "text-violet-400"
  },
  {
    title: "AI Image Engine",
    desc: "Automatically optimize and generate high-fidelity product visuals for every catalog.",
    icon: Sparkles,
    color: "from-purple-500/20 to-purple-500/20",
    stats: "4K Resolution",
    textColor: "text-purple-400"
  },
  {
    title: "Universal QR Access",
    desc: "Zero-latency menu access. No apps, no downloads, just seamless digital interaction.",
    icon: QrCode,
    color: "from-violet-500/20 to-violet-400/20",
    stats: "100% Native",
    textColor: "text-violet-400"
  },
  {
    title: "Enterprise Security",
    desc: "Military-grade encryption for all tenant data and manual subscription logic.",
    icon: ShieldCheck,
    color: "from-violet-500/20 to-violet-400/20",
    stats: "Fully Encrypted",
    textColor: "text-violet-400"
  },
  {
    title: "Real-time Analytics",
    desc: "Track meaningful conversion metrics and user behavior across all catalogs instantly.",
    icon: BarChart3,
    color: "from-violet-500/20 to-violet-500/20",
    stats: "Live Data",
    textColor: "text-violet-400"
  },
  {
    title: "Edge Distribution",
    desc: "Content delivered via global edge networks for sub-millisecond load times anywhere.",
    icon: Cpu,
    color: "from-purple-500/20 to-purple-500/20",
    stats: "Global CDN",
    textColor: "text-purple-400"
  },
  {
    title: "AI Business Intelligence",
    desc: "Algorithmic pricing adjustments based on demand, time, and inventory levels.",
    icon: InfinityIcon,
    color: "from-violet-500/20 to-violet-400/20",
    stats: "+15% Revenue",
    textColor: "text-violet-400"
  },
  {
    title: "API First Architecture",
    desc: "Full headless capabilities to integrate your catalog into any existing mobile app or kiosk.",
    icon: Layers,
    color: "from-purple-500/20 to-violet-400/20",
    stats: "GraphQL/REST",
    textColor: "text-purple-400"
  }
];

const PRICING_PLANS = [
  {
    name: "Essential",
    price: { monthly: 10.30, yearly: 8.25 },
    desc: "Everything you need to go digital.",
    features: [
      "2-Day Free Trial",
      "1 Digital Catalog",
      "Unlimited Menu Items",
      "Basic Theme Customization",
      "Standard QR Code",
      "Free Subdomain Access"
    ],
    highlight: false
  },
  {
    name: "Pro",
    price: { monthly: 31.15, yearly: 24.91 },
    desc: "Maximize revenue with smart features.",
    features: [
      "WhatsApp Ordering Integration",
      "Remove 'Powered By' Branding",
      "Real-time Analytics Dashboard",
      "Multi-Language (EN/AR/FR)",
      "Custom Domain Connection",
      "Smart Search"
    ],
    highlight: true
  },
  {
    name: "Enterprise",
    price: { monthly: 41.55, yearly: 33.25 },
    desc: "AI-powered automation & growth.",
    features: [
      "AI Image Engine (100 /mo)",
      "Auto-Translation (50+ Langs)",
      "Smart Upselling Engine",
      "Customer CRM & Remarketing",
      "Staff Management (5 Users)",
      "Dedicated Success Manager"
    ],
    highlight: false
  }
];

export function SaaSLandingClient() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"]
  });

  const smoothProgress = useSpring(scrollYProgress, { stiffness: 100, damping: 30 });
  const heroY = useTransform(smoothProgress, [0, 0.4], [0, -150]);
  const heroScale = useTransform(smoothProgress, [0, 0.4], [1, 0.8]);
  const heroOpacity = useTransform(smoothProgress, [0, 0.3], [1, 0]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <div ref={containerRef} className="relative bg-[#020203] text-white selection:bg-primary/30 selection:text-primary overflow-x-hidden font-outfit">

      {/* Dynamic Background Noise/Mesh */}
      <div className="fixed inset-0 pointer-events-none opacity-40 z-0">
        <div
          className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] mix-blend-overlay"
        />
        <div
          className="absolute top-0 left-0 w-full h-full"
          style={{
            background: `radial-gradient(circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(139, 92, 246, 0.1) 0%, transparent 60%)`
          }}
        />
        <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-primary/20 rounded-full blur-[160px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-secondary/10 rounded-full blur-[160px]" />
      </div>

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-[100] transition-all duration-300">
        <div className="max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3 group cursor-pointer"
          >
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-primary to-secondary flex items-center justify-center shadow-lg shadow-primary/20 group-hover:rotate-12 transition-transform duration-500 relative">
              <div className="absolute inset-0 rounded-2xl bg-white/20 animate-ping opacity-20 group-hover:opacity-40" />
              <Zap className="text-white w-6 h-6 fill-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-2xl font-black tracking-tighter leading-none flex bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                COREDEX
              </span>
              <span className="text-[10px] font-black tracking-[0.3em] text-white/40 uppercase">Digital Catalog</span>
            </div>
          </motion.div>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1.5 p-1 rounded-2xl bg-white/[0.03] border border-white/5 backdrop-blur-xl">
            <Link href="#features" className="px-6 py-2.5 rounded-xl text-sm font-bold text-white/60 hover:text-white hover:bg-white/5 transition-all">Features</Link>
            <Link href="#pricing" className="px-6 py-2.5 rounded-xl text-sm font-bold text-white/60 hover:text-white hover:bg-white/5 transition-all">Pricing</Link>
            <Link href="#demo" className="px-6 py-2.5 rounded-xl text-sm font-bold text-white/60 hover:text-white hover:bg-white/5 transition-all">Showcase</Link>
            <div className="w-px h-4 bg-white/10 mx-2" />
            <Link href="#contact" className="px-6 py-2.5 rounded-xl text-sm font-bold bg-white text-black hover:scale-105 transition-all active:scale-95 flex items-center gap-2">
              <MessageCircle className="w-4 h-4" />
              Contact Us
            </Link>
          </div>

          {/* Mobile Toggle */}
          <button
            className="md:hidden w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white z-[110]"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu Overlay */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              className="fixed inset-0 bg-[#020203]/95 backdrop-blur-3xl z-[105] flex flex-col pt-32 px-10 gap-8"
            >
              {[
                { label: 'Capabilities', href: '#features' },
                { label: 'Pricing Engine', href: '#pricing' },
                { label: 'Live Showcase', href: '#demo' },
                { label: 'Contact Us', href: '#contact', highlight: true }
              ].map((link, i) => (
                <motion.div
                  key={link.label}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                >
                  <Link
                    href={link.href}
                    onClick={() => setIsMenuOpen(false)}
                    className={`text-4xl font-black tracking-tighter ${link.highlight ? 'text-primary' : 'text-white'}`}
                  >
                    {link.label}
                  </Link>
                </motion.div>
              ))}

              <div className="mt-12 pt-12 border-t border-white/5">
                <p className="text-white/20 text-xs font-black uppercase tracking-[0.3em] mb-4">Engineering the future</p>
                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center"><Globe className="w-5 h-5" /></div>
                  <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center"><Smartphone className="w-5 h-5" /></div>
                  <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center"><Cpu className="w-5 h-5" /></div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-[110vh] flex flex-col items-center justify-center pt-20 px-6 overflow-hidden">
        <motion.div
          style={{ y: heroY, scale: heroScale, opacity: heroOpacity }}
          className="text-center z-10 max-w-6xl"
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-3 px-5 py-2 rounded-full bg-white/[0.03] border border-white/10 text-[10px] font-black mb-10 tracking-[0.3em] uppercase text-white/60 hover:border-primary/40 transition-colors group cursor-pointer shadow-[0_0_20px_rgba(0,0,0,0.5)]"
          >
            <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse shadow-[0_0_8px_var(--color-primary)]" />
            SaaS Platform Engineered for 2030
            <ChevronRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
          </motion.div>

          <h1 className="text-6xl md:text-[8rem] lg:text-[10rem] font-black tracking-tighter mb-10 leading-[0.85] bg-gradient-to-b from-white via-white to-white/20 bg-clip-text text-transparent italic">
            DIGITAL<br />
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent not-italic">CATALOGS</span>
          </h1>

          <p className="max-w-2xl mx-auto text-lg md:text-2xl text-white/50 mb-14 leading-relaxed font-medium">
            Deploy hyper-dynamic digital experiences. The next-gen multi-tenant platform for premium hospitality and retail.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
            <Link
              href="/signup"
              className="group relative px-10 py-5 bg-white text-black font-black text-lg rounded-[1.5rem] overflow-hidden hover:scale-105 active:scale-95 transition-all shadow-[0_20px_40px_-10px_rgba(255,255,255,0.2)]"
            >
              <span className="relative z-10 flex items-center gap-3">
                BUILD YOURS <ArrowUpRight className="w-5 h-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
              </span>
            </Link>

            <Link
              href="#demo"
              className="px-10 py-5 bg-white/[0.03] backdrop-blur-xl border border-white/10 text-white font-black text-lg rounded-[1.5rem] hover:bg-white/10 transition-all hover:scale-105 active:scale-95"
            >
              EXPLORE TECH
            </Link>
          </div>
        </motion.div>

        {/* Abstract Floating Data Nodes */}
        <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
          <div className="absolute top-[20%] left-[10%] w-[30vw] h-[30vw] border border-white/[0.03] rounded-full" />
          <div className="absolute top-[20%] left-[10%] w-[45vw] h-[45vw] border border-white/[0.02] rounded-full" />
          <div className="absolute -bottom-20 -right-20 w-[60vw] h-[60vw] bg-primary/5 rounded-full blur-[120px]" />

          {/* Moving Orbs */}
          <motion.div
            animate={{
              y: [0, -20, 0],
              rotate: [0, 45, 0]
            }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-1/4 right-[15%] w-24 h-24 bg-gradient-to-br from-primary/40 to-violet-500/40 blur-3xl rounded-full"
          />
        </div>
      </section>

      {/* Trust Line */}
      <div className="py-20 border-y border-white/5 bg-white/[0.01]">
        <div className="max-w-7xl mx-auto px-6 overflow-hidden flex flex-col items-center">
          <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.5em] mb-12">Powering the worlds most elite establishments</p>
          <div className="flex flex-wrap justify-center gap-x-20 gap-y-10 opacity-30 grayscale hover:grayscale-0 transition-all duration-700">
            <div className="text-3xl font-black tracking-tighter">LUXURY</div>
            <div className="text-3xl font-black tracking-tighter italic">VOGUE</div>
            <div className="text-3xl font-black tracking-tighter">PRIME</div>
            <div className="text-3xl font-black tracking-tighter italic underline decoration-primary underline-offset-8">CORE</div>
            <div className="text-3xl font-black tracking-tighter">QUANTUM</div>
          </div>
        </div>
      </div>

      {/* Capabilities Section */}
      <section id="features" className="py-40 px-6 md:px-12 relative overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="text-center md:text-left mb-24">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              className="text-5xl md:text-8xl font-black tracking-tighter mb-8 leading-none"
            >
              BUILT FOR THE<br />
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">ELITE.</span>
            </motion.h2>
            <p className="max-w-xl text-white/40 text-xl font-medium leading-relaxed">
              We didn't just build a catalog. We built a high-performance engine designed to convert every visitor into a loyal customer.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {FEATURE_CARDS.map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05 }}
                viewport={{ once: true }}
                className="group relative p-10 rounded-[2.5rem] bg-white/[0.02] border border-white/5 hover:bg-white/[0.05] hover:border-white/10 transition-all duration-500 overflow-hidden h-full flex flex-col"
              >
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-8 shadow-2xl transition-transform group-hover:scale-110 duration-700`}>
                  <feature.icon className={`w-8 h-8 ${feature.textColor}`} />
                </div>

                <h3 className="text-2xl font-bold mb-4 tracking-tight group-hover:text-primary transition-colors">{feature.title}</h3>
                <p className="text-white/40 leading-relaxed font-medium mb-12 flex-grow">{feature.desc}</p>

                <div className="mt-auto pt-8 border-t border-white/5 flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-[9px] font-black text-white/20 uppercase tracking-widest leading-none mb-1">Performance Index</span>
                    <span className={`text-sm font-black uppercase tracking-widest ${feature.textColor}`}>{feature.stats}</span>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-500 hover:bg-primary hover:scale-110">
                    <ArrowUpRight className="w-5 h-5 text-white" />
                  </div>
                </div>

                {/* Corner Gradient Glow */}
                <div className={`absolute -top-10 -right-10 w-32 h-32 bg-gradient-to-br ${feature.color} blur-[60px] opacity-0 group-hover:opacity-40 transition-opacity duration-1000`} />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-40 px-6 md:px-12 relative">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-24">
            <h2 className="text-5xl md:text-[6rem] font-black tracking-tighter mb-8 italic">SCALE WITHOUT<br /><span className="not-italic bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">FRICTION.</span></h2>

            {/* Toggle */}
            <div className="inline-flex items-center p-2 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-xl">
              <button
                onClick={() => setBillingCycle('monthly')}
                className={`px-8 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${billingCycle === 'monthly' ? 'bg-white text-black shadow-2xl scale-105' : 'text-white/40 hover:text-white'}`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingCycle('yearly')}
                className={`px-8 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${billingCycle === 'yearly' ? 'bg-white text-black shadow-2xl scale-105' : 'text-white/40 hover:text-white'}`}
              >
                Annual <span className="ml-2 px-2 py-0.5 rounded-md bg-green-500/20 text-green-400">Save 20%</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
            {PRICING_PLANS.map((plan, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
                className={`relative p-10 rounded-[3rem] border transition-all duration-700 ${plan.highlight ? 'bg-[#0a0a0c] border-primary shadow-[0_40px_100px_-20px_rgba(124,58,237,0.15)] scale-105 z-10' : 'bg-white/[0.01] border-white/5 hover:border-white/10'}`}
              >
                {plan.highlight && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-white text-[10px] font-black px-6 py-2 rounded-full uppercase tracking-[0.2em] shadow-lg shadow-primary/30">
                    Recommended
                  </div>
                )}

                <h3 className="text-2xl font-black mb-2 uppercase tracking-tight italic">{plan.name}</h3>
                <p className="text-white/40 text-sm font-medium mb-10">{plan.desc}</p>

                <div className="flex flex-col mb-10">
                  <div className="flex items-baseline gap-1">
                    <span className="text-sm font-black text-white/20 mb-2">$</span>
                    <span className="text-7xl font-black leading-none flex items-baseline">
                      {Math.floor(billingCycle === 'monthly' ? plan.price.monthly : plan.price.yearly)}
                      <span className="text-2xl ml-1 font-normal">
                        .{((billingCycle === 'monthly' ? plan.price.monthly : plan.price.yearly) % 1).toFixed(2).split('.')[1]}
                      </span>
                    </span>
                    <span className="text-white/20 text-[10px] font-black uppercase tracking-widest ml-2">/ Month</span>
                  </div>
                  {billingCycle === 'yearly' && (
                    <div className="text-[10px] font-black text-primary uppercase tracking-widest mt-3 ml-1 flex items-center gap-2">
                      <div className="w-1 h-1 rounded-full bg-primary" />
                      ${plan.name === "Essential" ? "99" : plan.name === "Pro" ? "299" : "399"} Billed Yearly
                    </div>
                  )}
                </div>

                <Link
                  href={`/signup?plan=${plan.name.toLowerCase()}`}
                  className={`w-full py-5 rounded-2xl font-black uppercase tracking-widest text-sm mb-12 transition-all shadow-xl flex items-center justify-center ${plan.highlight ? 'bg-primary text-white hover:scale-105 shadow-primary/20' : 'bg-white/[0.05] text-white hover:bg-white/10'}`}>
                  Deploy Instance
                </Link>

                <div className="space-y-5">
                  <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] mb-6">Stack includes:</p>
                  {plan.features.map((feature, j) => (
                    <div key={j} className="flex items-center gap-4 text-sm font-medium text-white/60">
                      <div className={`w-5 h-5 rounded-lg flex items-center justify-center ${plan.highlight ? 'bg-primary/20 text-primary' : 'bg-white/5 text-white/40'}`}>
                        <Check className="w-3 h-3" />
                      </div>
                      {feature}
                    </div>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Live Showcase Section */}
      <section id="demo" className="py-40 relative overflow-hidden bg-gradient-to-b from-[#020203] via-[#0a0614] to-[#020203]">
        {/* Background Effects */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/10 rounded-full blur-[150px]" />
          <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-purple-500/10 rounded-full blur-[120px]" />
        </div>

        <div className="max-w-7xl mx-auto px-6 relative z-10">
          {/* Section Header */}
          <div className="text-center mb-24">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-3 px-5 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-black uppercase tracking-[0.3em] mb-10"
            >
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              Live Preview
            </motion.div>
            <h2 className="text-5xl md:text-[6rem] font-black tracking-tighter mb-8 italic leading-[0.9]">
              SEE IT IN<br />
              <span className="not-italic bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">ACTION.</span>
            </h2>
            <p className="max-w-2xl mx-auto text-white/40 text-xl font-medium leading-relaxed">
              Scan the QR code or explore the interactive preview. Your customers get instant access to your entire catalog.
            </p>
          </div>

          <div className="flex flex-col lg:flex-row items-center justify-center gap-20">
            {/* Phone Mockup with Real Content */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="relative"
            >
              {/* Floating Stats */}
              <motion.div
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -top-6 -left-16 p-5 rounded-2xl bg-[#0a0a0c]/90 backdrop-blur-xl border border-white/10 shadow-2xl z-20"
              >
                <div className="text-[9px] font-black text-green-400 uppercase tracking-widest mb-1 flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                  Live Orders
                </div>
                <div className="text-2xl font-black italic text-white">+127</div>
              </motion.div>

              <motion.div
                animate={{ y: [0, 8, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                className="absolute -bottom-4 -left-12 p-5 rounded-2xl bg-[#0a0a0c]/90 backdrop-blur-xl border border-white/10 shadow-2xl z-20"
              >
                <div className="text-[9px] font-black text-primary uppercase tracking-widest mb-1">Response Time</div>
                <div className="text-2xl font-black italic text-white">0.3<span className="text-sm">ms</span></div>
              </motion.div>

              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                className="absolute top-20 -right-16 p-5 rounded-2xl bg-[#0a0a0c]/90 backdrop-blur-xl border border-primary/20 shadow-2xl z-20"
              >
                <div className="text-[9px] font-black text-primary uppercase tracking-widest mb-1">Conversion</div>
                <div className="text-2xl font-black italic text-white">89%</div>
              </motion.div>

              {/* iPhone Frame */}
              <div className="relative w-[320px] h-[680px] bg-[#0a0a0c] rounded-[3.5rem] border-[10px] border-[#1a1a1c] p-2 shadow-[0_0_80px_rgba(139,92,246,0.2),0_0_120px_rgba(0,0,0,0.8)]">
                {/* Notch */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-7 bg-[#0a0a0c] rounded-b-2xl z-30 flex items-center justify-center">
                  <div className="w-16 h-4 bg-[#1a1a1c] rounded-full" />
                </div>

                {/* Screen Content */}
                <div className="w-full h-full rounded-[2.5rem] overflow-hidden bg-gradient-to-b from-[#0f0f12] to-[#080809]">
                  {/* Header */}
                  <div className="p-6 pb-4">
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <div className="text-[9px] font-black text-white/30 uppercase tracking-widest">Welcome to</div>
                        <div className="text-xl font-black italic uppercase tracking-tight text-white">Prime Steaks</div>
                      </div>
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center shadow-lg shadow-primary/30">
                        <Star className="w-5 h-5 text-white fill-white" />
                      </div>
                    </div>

                    {/* Search Bar */}
                    <div className="flex items-center gap-3 px-4 py-3 bg-white/5 rounded-xl border border-white/5">
                      <MousePointer2 className="w-4 h-4 text-white/30" />
                      <span className="text-sm text-white/30 font-medium">Search menu...</span>
                    </div>
                  </div>

                  {/* Categories */}
                  <div className="px-6 mb-4">
                    <div className="flex gap-2 overflow-hidden">
                      {['All', 'Steaks', 'Sides', 'Drinks'].map((cat, i) => (
                        <div
                          key={cat}
                          className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap ${i === 1 ? 'bg-primary text-white' : 'bg-white/5 text-white/50'}`}
                        >
                          {cat}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Menu Items */}
                  <div className="px-6 space-y-3 overflow-hidden">
                    {[
                      { name: 'Wagyu A5 Ribeye', price: '$189', img: '🥩', tag: 'Chef Pick' },
                      { name: 'Prime Filet Mignon', price: '$145', img: '🍖', tag: 'Popular' },
                      { name: 'Tomahawk 32oz', price: '$225', img: '🥩', tag: null },
                    ].map((item, i) => (
                      <motion.div
                        key={item.name}
                        initial={{ opacity: 0, x: 20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 + i * 0.1 }}
                        className="flex items-center gap-4 p-4 rounded-2xl bg-white/[0.03] border border-white/5 hover:border-primary/30 transition-all group"
                      >
                        <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-primary/20 to-purple-600/20 flex items-center justify-center text-2xl">
                          {item.img}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-bold text-white">{item.name}</span>
                            {item.tag && (
                              <span className="px-2 py-0.5 rounded-md bg-primary/20 text-primary text-[8px] font-black uppercase">{item.tag}</span>
                            )}
                          </div>
                          <div className="text-lg font-black text-primary">{item.price}</div>
                        </div>
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
                          <ChevronRight className="w-4 h-4 text-primary" />
                        </div>
                      </motion.div>
                    ))}
                  </div>

                  {/* Bottom Nav */}
                  <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-[#080809] to-transparent">
                    <div className="flex items-center justify-around p-3 rounded-2xl bg-white/5 border border-white/5">
                      {[QrCode, BarChart3, MessageCircle].map((Icon, i) => (
                        <div key={i} className={`w-10 h-10 rounded-xl flex items-center justify-center ${i === 0 ? 'bg-primary text-white' : 'text-white/30'}`}>
                          <Icon className="w-5 h-5" />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Right Side Content */}
            <div className="lg:max-w-md text-center lg:text-left">
              <h3 className="text-3xl md:text-4xl font-black tracking-tight mb-8 italic">
                Your <span className="text-primary not-italic">entire menu</span> in their pocket.
              </h3>
              <p className="text-white/40 text-lg font-medium leading-relaxed mb-12">
                Customers scan a QR code and instantly access your beautifully designed digital catalog. No apps to download, no waiting.
              </p>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-4 mb-12">
                {[
                  { value: '0.3s', label: 'Load Time' },
                  { value: '100%', label: 'Mobile Ready' },
                  { value: '50+', label: 'Languages' },
                  { value: '24/7', label: 'Availability' },
                ].map((stat, i) => (
                  <div key={i} className="p-6 rounded-2xl bg-white/[0.02] border border-white/5">
                    <div className="text-2xl font-black italic text-primary mb-1">{stat.value}</div>
                    <div className="text-[10px] font-black text-white/30 uppercase tracking-widest">{stat.label}</div>
                  </div>
                ))}
              </div>

              {/* CTA */}
              <Link
                href="/c/demo"
                className="inline-flex items-center gap-3 px-10 py-5 bg-white text-black font-black text-lg rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-xl shadow-white/10"
              >
                <Smartphone className="w-5 h-5" />
                Try Live Demo
                <ArrowUpRight className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-32 relative overflow-hidden bg-[#010101]">
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            <div>
              <h2 className="text-5xl md:text-7xl font-black tracking-tighter mb-10 italic leading-[0.9]">
                INITIATE <br />
                <span className="text-primary not-italic">CONTACT</span>
              </h2>
              <p className="text-white/40 text-xl font-medium leading-relaxed mb-12">
                Ready to deploy your digital infrastructure? Use the secure channel below or contact our global support node.
              </p>

              <div className="flex flex-col gap-6">
                <div className="flex items-center gap-6 p-8 rounded-3xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-all">
                  <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
                    <MessageCircle className="w-6 h-6 text-primary fill-primary" />
                  </div>
                  <div>
                    <div className="text-[10px] font-black text-white/20 uppercase tracking-widest mb-1">WhatsApp Support</div>
                    <div className="text-lg font-black text-white tracking-tight">+966 54 067 9669</div>
                  </div>
                </div>

                <div className="flex items-center gap-6 p-8 rounded-3xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-all">
                  <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center">
                    <Mail className="w-6 h-6 text-white/40" />
                  </div>
                  <div>
                    <div className="text-[10px] font-black text-white/20 uppercase tracking-widest mb-1">Official Inquiry</div>
                    <div className="text-lg font-black text-white tracking-tight">ops@coredex.solutions</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="glass-card p-12 rounded-[3.5rem] border border-white/5 relative overflow-hidden shadow-2xl">
              <div className="absolute top-0 right-0 p-10 text-white/[0.02]">
                <MessageCircle className="w-40 h-40" />
              </div>
              <div className="relative z-10 space-y-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-white/20 uppercase tracking-widest ml-2">Your Name</label>
                  <input type="text" placeholder="Alexander Pierce" className="w-full px-8 py-5 bg-white/[0.03] border border-white/5 rounded-2xl text-sm font-bold focus:outline-none focus:border-primary/50 transition-all" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-white/20 uppercase tracking-widest ml-2">Email Address</label>
                  <input type="email" placeholder="ceo@enterprise.com" className="w-full px-8 py-5 bg-white/[0.03] border border-white/5 rounded-2xl text-sm font-bold focus:outline-none focus:border-primary/50 transition-all" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-white/20 uppercase tracking-widest ml-2">Message Channel</label>
                  <textarea rows={4} placeholder="Briefly describe your requirements..." className="w-full px-8 py-5 bg-white/[0.03] border border-white/5 rounded-2xl text-sm font-bold focus:outline-none focus:border-primary/50 transition-all resize-none"></textarea>
                </div>
                <button className="w-full py-5 bg-white text-black rounded-2xl font-black uppercase tracking-widest text-sm hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-white/5">
                  Send Transmission
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-32 px-6 md:px-12 border-t border-white/5 bg-[#010101]">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start gap-20">
          <div className="max-w-md">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
                <Zap className="text-white w-5 h-5 fill-white" />
              </div>
              <span className="text-2xl font-black tracking-tighter">COREDEX</span>
            </div>
            <p className="text-white/30 text-lg leading-relaxed font-medium mb-10">
              The world's most advanced platform for digital commerce. Engineering pixel-perfect experiences for the premium sector.
            </p>
            <div className="flex gap-4">
              {[Globe, MessageCircle, Smartphone].map((Icon, i) => (
                <div key={i} className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center border border-white/5 hover:bg-primary transition-all cursor-pointer group">
                  <Icon className="w-5 h-5 text-white/40 group-hover:text-white" />
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-3 gap-20">
            <div>
              <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-primary mb-10">The Platform</h4>
              <ul className="space-y-6 text-sm font-bold text-white/40">
                <li className="hover:text-white transition-all cursor-pointer">Catalog Engine</li>
                <li className="hover:text-white transition-all cursor-pointer">AI Logic</li>
                <li className="hover:text-white transition-all cursor-pointer">Pricing</li>
                <li className="hover:text-white transition-all cursor-pointer">Enterprise</li>
              </ul>
            </div>
            <div>
              <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-primary mb-10">Systems</h4>
              <ul className="space-y-6 text-sm font-bold text-white/40">
                <li className="hover:text-white transition-all cursor-pointer">Admin Node</li>
                <li className="hover:text-white transition-all cursor-pointer">API Stack</li>
                <li className="hover:text-white transition-all cursor-pointer">Uptime</li>
                <li className="hover:text-white transition-all cursor-pointer">Edge Status</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto mt-40 pt-10 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6 text-[10px] font-black uppercase tracking-[0.5em] text-white/10">
          <div>© 2026 COREDEX SOLUTIONS. ALL RIGHTS RESERVED.</div>
          <div className="flex gap-16">
            <span className="hover:text-white cursor-pointer transition-colors">Privacy</span>
            <span className="hover:text-white cursor-pointer transition-colors">Terms of Service</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
