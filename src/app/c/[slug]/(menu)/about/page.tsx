import { getFullCatalogData } from "@/lib/catalog/queries";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, MapPin, Phone } from "lucide-react";
import { getEnabledLanguages, resolveMenuLanguage } from "../../_lib/locale";
import { getDictionary, localized } from "../../_lib/i18n";
import { mapsLink, telLink } from "../../_lib/links";
import { OpenStatusBadge } from "../../_components/menu/OpenStatusBadge";

interface Props {
    params: Promise<{ slug: string }>;
}

async function load(slug: string) {
    const data = await getFullCatalogData(slug);
    if (!data) return null;
    const lang = await resolveMenuLanguage(slug, getEnabledLanguages(data.settings?.enabled_languages), data.settings?.default_language);
    return { data, lang };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { slug } = await params;
    const loaded = await load(slug);
    if (!loaded) return { title: "Not Found" };

    const { data, lang } = loaded;
    const name = localized(data.catalog, "name", lang) || data.catalog.name;
    const about = (data.settings as any)?.[`about_content_${lang}`] || localized(data.catalog, "description", lang);

    return {
        title: getDictionary(lang).about,
        description: about ? String(about).slice(0, 160) : `${name}`,
        openGraph: {
            title: name,
            description: about ? String(about).slice(0, 160) : undefined,
            images: data.settings?.hero_image_url ? [data.settings.hero_image_url] : undefined,
        },
    };
}

export default async function AboutPage({ params }: Props) {
    const { slug } = await params;
    const loaded = await load(slug);
    if (!loaded) notFound();

    const { data, lang } = loaded;
    const { catalog, settings, contact } = data;
    const t = getDictionary(lang);
    const name = localized(catalog, "name", lang) || catalog.name;
    const about = (settings as any)?.[`about_content_${lang}`] || (settings as any)?.about_content_en || localized(catalog, "description", lang);
    const address = contact ? [localized(contact, "address", lang), localized(contact, "city", lang)].filter(Boolean).join(lang === "ar" ? "، " : ", ") : "";
    const directions = mapsLink({ mapUrl: contact?.google_map_iframe_url, name, address: contact?.address_en, city: contact?.city_en });

    return (
        <main className="mx-auto max-w-xl pb-16">
            <div className="relative h-56 w-full overflow-hidden bg-brand-soft sm:rounded-b-3xl">
                {settings?.hero_image_url && (
                    <Image src={settings.hero_image_url} alt="" fill priority sizes="(max-width: 640px) 100vw, 576px" className="object-cover" />
                )}
                <Link
                    href={`/c/${slug}`}
                    className="absolute start-4 top-4 inline-flex min-h-10 items-center gap-1.5 rounded-control bg-menu-surface px-3.5 text-sm font-semibold text-menu-ink shadow-menu-sm"
                >
                    <ArrowLeft className="h-4 w-4 rtl:rotate-180" aria-hidden />
                    {t.menu}
                </Link>
            </div>

            <div className="px-4">
                <h1 className="mt-6 font-menu-display text-[2rem] font-semibold leading-tight">{name}</h1>
                <div className="mt-2">
                    <OpenStatusBadge />
                </div>

                {about && <p className="mt-6 whitespace-pre-line text-[1.0625rem] leading-relaxed">{about}</p>}

                <Link
                    href={`/c/${slug}`}
                    className="mt-8 flex min-h-12 w-full items-center justify-center rounded-control bg-brand px-4 font-semibold text-brand-fg"
                >
                    {localized(settings || {}, "cta_menu_label", lang) || t.viewMenu}
                </Link>

                {(contact?.phone_primary || directions) && (
                    <div className="mt-8 divide-y divide-[var(--menu-line)] rounded-2xl border border-menu-line bg-menu-surface">
                        {directions && (
                            <a href={directions} target="_blank" rel="noopener noreferrer" className="flex min-h-14 items-center gap-3 px-4 py-3">
                                <MapPin className="h-5 w-5 shrink-0 text-brand-ink" aria-hidden />
                                <span className="min-w-0">
                                    <span className="block font-medium">{address || t.location}</span>
                                    <span className="block text-sm text-menu-muted">{t.openInMaps}</span>
                                </span>
                            </a>
                        )}
                        {contact?.phone_primary && (
                            <a href={telLink(contact.phone_primary)} className="flex min-h-14 items-center gap-3 px-4 py-3">
                                <Phone className="h-5 w-5 shrink-0 text-brand-ink" aria-hidden />
                                <bdi dir="ltr" className="font-medium">{contact.phone_primary}</bdi>
                            </a>
                        )}
                    </div>
                )}
            </div>
        </main>
    );
}
