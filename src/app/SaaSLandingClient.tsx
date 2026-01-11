"use client";

import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
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
  Check
} from "lucide-react";
import { useState, useRef } from "react";
import Link from "next/link";

const FEATURE_CARDS = [
  {
    title: "Instant Multi-Tenancy",
    desc: "Deploy unique digital environments for thousands of businesses on a single infrastructure.",
    icon: Globe,
    color: "from-blue-500 to-cyan-400",
    stats: "0.1s Deploy Time"
  },
  {
    title: "AI Image Engine",
    desc: "Automatically optimize and generate high-fidelity product visuals for every catalog.",
    icon: Sparkles,
    color: "from-purple-500 to-pink-500",
    stats: "4K Resolution"
  },
  {
    title: "Universal QR Access",
    desc: "Zero-latency menu access. No apps, no downloads, just seamless digital interaction.",
    icon: QrCode,
    color: "from-orange-500 to-amber-400",
    stats: "100% Native"
  },
  {
    title: "Enterprise Security",
    desc: "Military-grade encryption for all tenant data and manual subscription logic.",
    icon: ShieldCheck,
    color: "from-emerald-500 to-teal-400",
    stats: "SOC2 Ready"
  },
  {
    title: "Real-time Analytics",
    desc: "Track meaningful conversion metrics and user behavior across all catalogs instantly.",
    icon: BarChart3,
    color: "from-indigo-500 to-violet-500",
    stats: "Live Data"
  },
  {
    title: "Edge Distribution",
    desc: "Content delivered via global edge networks for sub-millisecond load times anywhere.",
    icon: Cpu,
    color: "from-rose-500 to-red-500",
    stats: "Global CDN"
  },
  {
    title: "Dynamic Pricing",
    desc: "Algorithmic pricing adjustments based on demand, time, and inventory levels.",
    icon: CreditCard,
    color: "from-lime-500 to-green-400",
    stats: "+15% Revenue"
  },
  {
    title: "API First",
    desc: "Full headless capabilities to integrate your catalog into any existing mobile app or kiosk.",
    icon: Layers,
    color: "from-sky-500 to-blue-400",
    stats: "GraphQL/REST"
  }
];

const PRICING_PLANS = [
  {
    name: "Essential",
    price: { monthly: 24, yearly: 19 },
    desc: "Everything you need to go digital.",
    features: [
      "1 Digital Catalog",
      "Unlimited Menu Items",
      "Basic Theme Customization",
      "Standard QR Code",
      "Weekly Analytics Report"
    ],
    highlight: false
  },
  {
    name: "Pro",
    price: { monthly: 59, yearly: 49 },
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
    name: "Autonomous",
    price: { monthly: 129, yearly: 99 },
    desc: "AI-powered automation & growth.",
    features: [
      "AI Image Generation Engine",
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

  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"]
  });

  const heroY = useTransform(scrollYProgress, [0, 0.5], [0, -100]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.3], [1, 0]);

  return (
    <div ref={containerRef} className="relative overflow-hidden font-outfit">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 md:px-12 backdrop-blur-md bg-black/20 border-b border-white/5 transition-all duration-300">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary to-purple-400 flex items-center justify-center shadow-lg shadow-primary/20">
            <Zap className="text-white w-6 h-6 fill-white" />
          </div>
          <span className="text-xl font-bold tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60">
            COREDEX
          </span>
        </div>

        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-white/60">
          <Link href="#features" className="hover:text-white transition-colors">Features</Link>
          <Link href="#pricing" className="hover:text-white transition-colors">Pricing</Link>
          <Link href="/login" className="px-5 py-2 rounded-full glass hover:bg-white/10 transition-all border border-white/10 group">
            <span className="group-hover:text-white transition-colors">Terminal Access</span>
          </Link>
        </div>

        <button className="md:hidden text-white" onClick={() => setIsMenuOpen(!isMenuOpen)}>
          {isMenuOpen ? <X /> : <Menu />}
        </button>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex flex-col items-center justify-center pt-20 px-6">
        <motion.div 
          style={{ y: heroY, opacity: heroOpacity }}
          className="text-center z-10"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold mb-6 tracking-widest uppercase"
          >
            <Sparkles className="w-3 h-3" />
            The Future of Digital Commerce
          </motion.div>

          <h1 className="text-6xl md:text-8xl lg:text-9xl font-bold tracking-tighter mb-8 bg-gradient-to-b from-white via-white to-white/20 bg-clip-text text-transparent pb-4">
            Catalogs<br />Redefined.
          </h1>

          <p className="max-w-2xl mx-auto text-lg md:text-xl text-white/50 mb-10 leading-relaxed font-light">
            Elevate your business with hyper-dynamic digital catalogs. 
            A SaaS platform engineered for the next decade of retail and hospitality.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link 
              href="/superadmin" 
              className="group relative px-8 py-4 bg-white text-black font-bold rounded-2xl overflow-hidden hover:scale-105 transition-transform"
            >
              <span className="relative z-10 flex items-center gap-2">
                Launch Platform <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-primary to-purple-400 opacity-0 group-hover:opacity-10 transition-opacity" />
            </Link>
            
            <Link 
              href="#demo" 
              className="px-8 py-4 glass text-white font-bold rounded-2xl hover:bg-white/10 transition-all border border-white/5"
            >
              Watch 2030 Demo
            </Link>
          </div>
        </motion.div>

        {/* Abstract 3D Element (Simulated) */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full pointer-events-none opacity-40">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/20 rounded-full blur-[120px] mix-blend-screen animate-pulse" />
          <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-blue-500/10 rounded-full blur-[100px] mix-blend-screen" />
        </div>
      </section>

      {/* Extended Features Grid */}
      <section id="features" className="py-32 px-6 md:px-12 relative bg-black/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-end justify-between mb-20 gap-8">
            <div className="max-w-xl">
              <h2 className="text-4xl md:text-7xl font-bold tracking-tight mb-6 bg-gradient-to-r from-white to-white/40 bg-clip-text text-transparent">
                Capabilities
              </h2>
              <p className="text-white/40 text-lg font-light">
                Engineering a new standard for digital interaction. Every pixel is optimized for performance.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {FEATURE_CARDS.map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05, duration: 0.5 }}
                viewport={{ once: true }}
                className="glass-card p-8 group hover:-translate-y-2 relative overflow-hidden h-full flex flex-col justify-between"
              >
                <div>
                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-6 shadow-lg shadow-black/20 group-hover:scale-110 transition-transform duration-500`}>
                    <feature.icon className="text-white w-7 h-7" />
                  </div>
                  <h3 className="text-xl font-bold mb-4 group-hover:text-primary transition-colors">{feature.title}</h3>
                  <p className="text-white/40 leading-relaxed text-sm mb-8">{feature.desc}</p>
                </div>
                
                <div className="pt-6 border-t border-white/5 flex items-center justify-between">
                   <span className="text-xs font-bold uppercase tracking-widest text-white/20 group-hover:text-white/60 transition-colors">
                     {feature.stats}
                   </span>
                   <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <ArrowUpRight className="w-4 h-4 text-white" />
                   </div>
                </div>
                
                {/* Glow effect */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-[50px] -translate-y-1/2 translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-32 px-6 md:px-12 relative overflow-hidden">
        {/* Background Mesh for Pricing */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent pointer-events-none" />
        
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-20">
            <h2 className="text-5xl md:text-7xl font-bold tracking-tighter mb-6">Transparent Pricing</h2>
            <p className="text-white/40 text-lg max-w-2xl mx-auto mb-10">
              Start small and scale infinitely. No hidden fees. No surprises.
            </p>
            
            {/* Toggle */}
            <div className="inline-flex items-center p-1 rounded-full glass border border-white/10">
              <button 
                onClick={() => setBillingCycle('monthly')}
                className={`px-6 py-2 rounded-full text-sm font-bold transition-all ${billingCycle === 'monthly' ? 'bg-white text-black shadow-lg scale-105' : 'text-white/60 hover:text-white'}`}
              >
                Monthly
              </button>
              <button 
                onClick={() => setBillingCycle('yearly')}
                className={`px-6 py-2 rounded-full text-sm font-bold transition-all ${billingCycle === 'yearly' ? 'bg-white text-black shadow-lg scale-105' : 'text-white/60 hover:text-white'}`}
              >
                Yearly <span className="ml-1 text-[10px] text-green-600 bg-green-100 px-1.5 py-0.5 rounded-full uppercase">Save 20%</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {PRICING_PLANS.map((plan, i) => (
              <motion.div
                key={i}
                layout
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
                className={`relative p-8 rounded-[2rem] border transition-all duration-300 ${plan.highlight ? 'glass border-primary/50 shadow-2xl shadow-primary/10 scale-105 z-10' : 'bg-white/[0.02] border-white/5 hover:border-white/10'}`}
              >
                {plan.highlight && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-primary to-purple-500 text-white text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-widest shadow-lg">
                    Most Popular
                  </div>
                )}
                
                <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
                <p className="text-white/40 text-sm mb-6">{plan.desc}</p>
                
                <div className="flex items-baseline gap-1 mb-6 h-12">
                   {String(plan.price.monthly) === 'Custom' ? (
                     <span className="text-4xl font-bold tracking-tighter">Custom</span>
                   ) : (
                    <>
                      <span className="text-sm text-white/40">$</span>
                      <motion.span 
                        key={billingCycle}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-5xl font-bold tracking-tighter"
                      >
                        {billingCycle === 'monthly' ? plan.price.monthly : plan.price.yearly}
                      </motion.span>
                      <span className="text-white/40 text-sm">/mo</span>
                    </>
                   )}
                </div>
                
                <button className={`w-full py-4 rounded-xl font-bold mb-8 transition-all ${plan.highlight ? 'bg-white text-black hover:scale-[1.02]' : 'glass hover:bg-white/10'}`}>
                  Get Started
                </button>
                
                <div className="space-y-4">
                  {plan.features.map((feature, j) => (
                    <div key={j} className="flex items-start gap-3 text-sm text-white/70">
                      <div className={`mt-0.5 w-4 h-4 rounded-full flex items-center justify-center ${plan.highlight ? 'bg-green-500/20 text-green-400' : 'bg-white/10 text-white/40'}`}>
                        <Check className="w-2.5 h-2.5" />
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

      {/* Footer */}
      <footer className="py-20 px-6 md:px-12 border-t border-white/5 bg-black">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start gap-12">
          <div className="max-w-xs">
            <div className="flex items-center gap-2 mb-6">
               <Zap className="text-primary w-6 h-6 fill-primary" />
               <span className="text-xl font-bold tracking-tighter">COREDEX</span>
            </div>
            <p className="text-white/40 text-sm leading-relaxed">
              Engineering the infrastructure for digital catalogs. Part of the Dynamicord ecosystem. Built for the next era of business.
            </p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-16">
            <div>
              <h4 className="font-bold mb-6 text-sm uppercase tracking-widest text-primary">Platform</h4>
              <ul className="space-y-4 text-sm text-white/40">
                <li className="hover:text-white transition-colors cursor-pointer">Admin Login</li>
                <li className="hover:text-white transition-colors cursor-pointer">Superadmin</li>
                <li className="hover:text-white transition-colors cursor-pointer">Pricing</li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-6 text-sm uppercase tracking-widest text-primary">Resources</h4>
              <ul className="space-y-4 text-sm text-white/40">
                <li className="hover:text-white transition-colors cursor-pointer">API Docs</li>
                <li className="hover:text-white transition-colors cursor-pointer">Showcase</li>
                <li className="hover:text-white transition-colors cursor-pointer">Support</li>
              </ul>
            </div>
          </div>
        </div>
        
        <div className="max-w-7xl mx-auto mt-20 pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-white/20 font-bold uppercase tracking-widest">
          <div>© 2030 COREDEX AUTOMATION LTD.</div>
          <div className="flex gap-8">
            <span className="hover:text-white cursor-pointer">Privacy</span>
            <span className="hover:text-white cursor-pointer">Terms</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
