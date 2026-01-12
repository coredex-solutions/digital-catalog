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
  MessageCircle
} from "lucide-react";
import { useState, useRef, useEffect } from "react";
import Link from "next/link";

const FEATURE_CARDS = [
  {
    title: "Instant Multi-Tenancy",
    desc: "Deploy unique digital environments for thousands of businesses on a single infrastructure.",
    icon: Globe,
    color: "from-blue-500/20 to-cyan-400/20",
    stats: "0.1s Deploy Time",
    textColor: "text-blue-400"
  },
  {
    title: "AI Image Engine",
    desc: "Automatically optimize and generate high-fidelity product visuals for every catalog.",
    icon: Sparkles,
    color: "from-purple-500/20 to-pink-500/20",
    stats: "4K Resolution",
    textColor: "text-purple-400"
  },
  {
    title: "Universal QR Access",
    desc: "Zero-latency menu access. No apps, no downloads, just seamless digital interaction.",
    icon: QrCode,
    color: "from-orange-500/20 to-amber-400/20",
    stats: "100% Native",
    textColor: "text-orange-400"
  },
  {
    title: "Enterprise Security",
    desc: "Military-grade encryption for all tenant data and manual subscription logic.",
    icon: ShieldCheck,
    color: "from-emerald-500/20 to-teal-400/20",
    stats: "SOC2 Ready",
    textColor: "text-emerald-400"
  },
  {
    title: "Real-time Analytics",
    desc: "Track meaningful conversion metrics and user behavior across all catalogs instantly.",
    icon: BarChart3,
    color: "from-indigo-500/20 to-violet-500/20",
    stats: "Live Data",
    textColor: "text-indigo-400"
  },
  {
    title: "Edge Distribution",
    desc: "Content delivered via global edge networks for sub-millisecond load times anywhere.",
    icon: Cpu,
    color: "from-rose-500/20 to-red-500/20",
    stats: "Global CDN",
    textColor: "text-rose-400"
  },
  {
    title: "AI Business Intelligence",
    desc: "Algorithmic pricing adjustments based on demand, time, and inventory levels.",
    icon: InfinityIcon,
    color: "from-lime-500/20 to-green-400/20",
    stats: "+15% Revenue",
    textColor: "text-lime-400"
  },
  {
    title: "API First Architecture",
    desc: "Full headless capabilities to integrate your catalog into any existing mobile app or kiosk.",
    icon: Layers,
    color: "from-sky-500/20 to-blue-400/20",
    stats: "GraphQL/REST",
    textColor: "text-sky-400"
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
    name: "Enterprise",
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
            background: `radial-gradient(circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(124, 58, 237, 0.1) 0%, transparent 60%)`
          }}
        />
        <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-primary/20 rounded-full blur-[160px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-600/10 rounded-full blur-[160px]" />
      </div>

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-[100] transition-all duration-300">
        <div className="max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3 group cursor-pointer"
          >
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-primary to-purple-400 flex items-center justify-center shadow-lg shadow-primary/20 group-hover:rotate-12 transition-transform duration-500 relative">
               <div className="absolute inset-0 rounded-2xl bg-white/20 animate-ping opacity-20 group-hover:opacity-40" />
               <Zap className="text-white w-6 h-6 fill-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-2xl font-black tracking-tighter leading-none">
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
            <Link href="/login" className="px-6 py-2.5 rounded-xl text-sm font-bold bg-white text-black hover:scale-105 transition-all active:scale-95 flex items-center gap-2">
              <Terminal className="w-4 h-4" />
              Portal Access
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
                { label: 'Admin Portal', href: '/login', highlight: true }
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
            SaaS Infrastructure Engineered for 2030
            <ChevronRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
          </motion.div>

          <h1 className="text-6xl md:text-[8rem] lg:text-[10rem] font-black tracking-tighter mb-10 leading-[0.85] bg-gradient-to-b from-white via-white to-white/20 bg-clip-text text-transparent italic">
            DIGITAL<br />
            <span className="text-primary not-italic">CATALOGS</span>
          </h1>

          <p className="max-w-2xl mx-auto text-lg md:text-2xl text-white/50 mb-14 leading-relaxed font-medium">
            Deploy hyper-dynamic digital experiences. The next-gen multi-tenant platform for premium hospitality and retail.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
            <Link 
              href="/superadmin" 
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
             className="absolute top-1/4 right-[15%] w-24 h-24 bg-gradient-to-br from-primary/40 to-indigo-500/40 blur-3xl rounded-full"
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
              initial={{ opacity:0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              className="text-5xl md:text-8xl font-black tracking-tighter mb-8 leading-none"
            >
              BUILT FOR THE<br />
              <span className="text-primary">ELITE.</span>
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
            <h2 className="text-5xl md:text-[6rem] font-black tracking-tighter mb-8 italic">SCALE WITHOUT<br /><span className="not-italic text-primary">FRICTION.</span></h2>
            
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
                
                <div className="flex items-baseline gap-2 mb-10">
                   <span className="text-sm font-black text-white/20">$</span>
                   <span className="text-7xl font-black tracking-tighter leading-none">
                     {billingCycle === 'monthly' ? plan.price.monthly : plan.price.yearly}
                   </span>
                   <span className="text-white/20 text-sm font-black uppercase tracking-widest">/ Month</span>
                </div>
                
                <button className={`w-full py-5 rounded-2xl font-black uppercase tracking-widest text-sm mb-12 transition-all shadow-xl ${plan.highlight ? 'bg-primary text-white hover:scale-105 shadow-primary/20' : 'bg-white/[0.05] text-white hover:bg-white/10'}`}>
                  Deploy Instance
                </button>
                
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
              The world's most advanced infrastructure for digital commerce. Engineering pixel-perfect experiences for the premium sector.
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
          <div>© 2026 COREDEX SYSTEMS. ALL RIGHTS RESERVED.</div>
          <div className="flex gap-16">
            <span className="hover:text-white cursor-pointer transition-colors">Privacy</span>
            <span className="hover:text-white cursor-pointer transition-colors">Terms of Service</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
