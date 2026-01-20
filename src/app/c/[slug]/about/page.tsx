import { getFullCatalogData } from "@/lib/catalog/queries";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import { cn } from "@/utils/helpers";
import Link from "next/link";
import { ArrowLeft, MapPin, Phone, Clock, Star, ArrowRight, LayoutGrid, MessageSquare } from "lucide-react";

interface Props {
    params: Promise<{ slug: string }>;
    searchParams: Promise<{ lang?: string }>;
}

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
    const { slug } = await params;
    const { lang = 'en' } = await searchParams;
    const data = await getFullCatalogData(slug);

    if (!data) return { title: "Not Found" };

    const { settings, catalog } = data;
    const title = (settings as any)?.[`seo_title_${lang}`] || `${catalog.name} | About`;
    const description = (settings as any)?.[`seo_description_${lang}`] || catalog.description;

    return {
        title,
        description,
        keywords: settings?.seo_keywords || "",
        openGraph: {
            title,
            description,
            images: [settings?.hero_image_url || ""],
        }
    };
}

export default async function AboutPage({ params, searchParams }: Props) {
    const { slug } = await params;
    const { lang = 'en' } = await searchParams;
    const data = await getFullCatalogData(slug);

    if (!data) notFound();

    const { catalog, settings, contact } = data;
    const aboutContent = (settings as any)?.[`about_content_${lang}`] || catalog.description;
    const dir = lang === "ar" ? "rtl" : "ltr";
    const font = lang === "ar" ? "font-cairo" : "font-inter";
    const primaryColor = settings?.color_primary || "#fead1d";

    const t = {
        back: { ar: 'الرجوع', en: 'Back', fr: 'Retour' },
        exploreMenu: { ar: 'تصفح القائمة الكاملة', en: 'Explore Full Menu', fr: 'Voir le Menu' },
        contactUs: { ar: 'اتصل بنا الآن', en: 'Contact Us Now', fr: 'Contactez-nous' },
        location: { ar: 'موقعنا', en: 'Our Location', fr: 'Notre Emplacement' },
        hours: { ar: 'ساعات العمل', en: 'Open Hours', fr: 'Heures' },
        call: { ar: 'اتصال هاتفي', en: 'Fast Call', fr: 'Appel' },
    };

    return (
        <div className={cn("min-h-screen bg-[var(--background-hex)] text-[var(--text-primary)]", font)} dir={dir}>
            {/* Visual background layers */}
            <div className="fixed inset-0 z-0 opacity-40 pointer-events-none">
                <div className="absolute top-0 right-0 w-[80%] h-[40%] bg-gradient-to-l from-primary/10 to-transparent blur-3xl" style={{ '--tw-gradient-from': `${primaryColor}1a` } as any} />
                <div className="absolute bottom-0 left-0 w-[60%] h-[30%] bg-gradient-to-r from-primary/5 to-transparent blur-3xl" style={{ '--tw-gradient-from': `${primaryColor}0d` } as any} />
            </div>

            <main className="relative z-10 max-w-2xl mx-auto px-5 pt-8 pb-32 space-y-12">
                {/* Top Navigation */}
                <header className="flex items-center justify-between py-2">
                    <Link
                        href={`/c/${slug}?lang=${lang}`}
                        className="w-12 h-12 rounded-2xl flex items-center justify-center transition-all border hover:shadow-lg"
                        style={{ backgroundColor: 'var(--surface)', borderColor: 'rgba(var(--pattern-rgb), 0.1)' }}
                    >
                        <ArrowLeft className={cn("w-5 h-5", lang === 'ar' && 'rotate-180')} />
                    </Link>
                    <div className="flex flex-col items-end">
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] leading-none mb-1 opacity-30">Brand Identity</span>
                        <p className="font-bold text-sm tracking-tight">{catalog.name}</p>
                    </div>
                </header>

                {/* Hero Section - Visual First */}
                <section className="space-y-8">
                    <div className="relative aspect-[16/10] sm:aspect-[16/8] rounded-[2.5rem] overflow-hidden border border-white/5 shadow-2xl">
                        {settings?.hero_image_url ? (
                            <img src={settings.hero_image_url} alt={catalog.name} className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full bg-white/5 animate-pulse" />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                        <div className="absolute bottom-6 left-6 right-6 flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/10 flex items-center justify-center">
                                <Star className="w-6 h-6 text-primary" style={{ color: primaryColor }} />
                            </div>
                            <h1 className="text-2xl font-black uppercase italic tracking-tighter leading-none">{catalog.name}</h1>
                        </div>
                    </div>

                    {/* Brand Story - Clear & Concise */}
                    <div className="space-y-6 px-1">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-[2px] bg-primary" style={{ backgroundColor: primaryColor }} />
                            <span className="text-[10px] font-black uppercase tracking-[0.4em] opacity-40">Our Story</span>
                        </div>
                        <div
                            className="text-lg leading-[1.6] font-medium opacity-80 whitespace-pre-wrap"
                            style={{ fontFamily: 'inherit' }}
                        >
                            {aboutContent}
                        </div>
                    </div>
                </section>

                {/* Conversion Cards - Horizontal Scroll on small, Grid on medium */}
                <section className="grid grid-cols-1 gap-4">
                    {/* Primary Conversion Link */}
                    <Link
                        href={`/c/${slug}?lang=${lang}`}
                        className="group relative flex items-center justify-between p-8 bg-primary rounded-[2rem] overflow-hidden"
                        style={{ backgroundColor: primaryColor }}
                    >
                        <div className="relative z-10">
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-black/40 mb-1">{lang === 'ar' ? 'عرض المنيو' : 'Main Menu'}</p>
                            <h3 className="text-xl font-black text-black uppercase tracking-tight italic">
                                {t.exploreMenu[lang as keyof typeof t.exploreMenu]}
                            </h3>
                        </div>
                        <ArrowRight className={cn("w-6 h-6 text-black group-hover:translate-x-2 transition-transform", lang === 'ar' && 'rotate-180 group-hover:-translate-x-2')} />
                        <LayoutGrid className="absolute -right-6 -bottom-6 w-32 h-32 text-black/5 rotate-12" />
                    </Link>

                    {/* Quick Action Grid */}
                    <div className="grid grid-cols-2 gap-4">
                        <a
                            href={`tel:${contact?.phone_primary}`}
                            className="flex flex-col p-6 rounded-[2rem] hover:shadow-lg transition-all border"
                            style={{ backgroundColor: 'var(--surface)', borderColor: 'rgba(var(--pattern-rgb), 0.05)' }}
                        >
                            <Phone className="w-8 h-8 text-primary mb-4" style={{ color: primaryColor }} />
                            <span className="text-[9px] font-black uppercase tracking-widest leading-none mb-1 opacity-30">{t.call[lang as keyof typeof t.call]}</span>
                            <p className="font-bold text-sm truncate">{contact?.phone_primary || '...'}</p>
                        </a>
                        <div
                            className="flex flex-col p-6 rounded-[2rem] border"
                            style={{ backgroundColor: 'var(--surface)', borderColor: 'rgba(var(--pattern-rgb), 0.05)' }}
                        >
                            <Clock className="w-8 h-8 text-primary mb-4" style={{ color: primaryColor }} />
                            <span className="text-[9px] font-black uppercase tracking-widest leading-none mb-1 opacity-30">{t.hours[lang as keyof typeof t.hours]}</span>
                            <p className="font-bold text-sm text-emerald-500">Open Daily</p>
                        </div>
                    </div>

                    {/* Location Card */}
                    <div className="flex items-center gap-6 p-6 rounded-[2rem] border" style={{ backgroundColor: 'var(--surface)', borderColor: 'rgba(var(--pattern-rgb), 0.05)' }}>
                        <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <MapPin className="w-6 h-6 text-primary" style={{ color: primaryColor }} />
                        </div>
                        <div className="flex-1 min-w-0">
                            <span className="text-[9px] font-black uppercase tracking-widest opacity-30 block mb-1">{t.location[lang as keyof typeof t.location]}</span>
                            <p className="font-bold text-sm truncate">{(contact as any)?.[`address_${lang}`] || catalog.name}</p>
                        </div>
                    </div>
                </section>

                {/* Dynamic CTA Footer */}
                <footer className="pt-8 pb-12 flex flex-col items-center gap-8">
                    <div className="flex items-center gap-4 opacity-10 uppercase font-black text-[9px] tracking-[0.6em]">
                        <div className="h-[1px] w-8 bg-current" />
                        {catalog.name}
                        <div className="h-[1px] w-8 bg-current" />
                    </div>

                    <p className="text-[10px] opacity-20 font-medium">© 2026 Crafted with Passion</p>
                </footer>
            </main>
        </div>
    );
}
