import Link from "next/link";
import { ArrowLeft, QrCode } from "lucide-react";
import { SiteLanguageToggle } from "../_landing/SiteLanguageToggle";
import { resolveSiteLang } from "../_landing/site-lang";
import { getAccountCopy } from "./_copy";

// Sign-in, forgot-password and reset-password: one calm card, in the visitor's language
export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const lang = await resolveSiteLang();
  const t = getAccountCopy(lang);

  return (
    <div lang={lang} dir={lang === "ar" ? "rtl" : "ltr"} className={`platform flex min-h-screen flex-col`}>
      <div aria-hidden className="h-[3px] bg-brand-gradient" />
      <header className="mx-auto flex h-16 w-full max-w-5xl items-center gap-3 px-4 sm:px-6">
        <Link href="/" aria-label={t.back} className="flex h-11 w-11 items-center justify-center rounded-control hover:bg-ui-subtle">
          <ArrowLeft className="h-5 w-5 rtl:-scale-x-100" aria-hidden />
        </Link>
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <span className="flex h-8 w-8 items-center justify-center rounded-control bg-brand-gradient text-white" aria-hidden>
            <QrCode className="h-4 w-4" />
          </span>
          <span dir="ltr" className="text-ui-primary">Coredex</span>
        </Link>
        <div className="ms-auto">
          <SiteLanguageToggle current={lang} label={t.language} />
        </div>
      </header>
      <main className="flex flex-1 items-start justify-center px-4 pb-16 pt-6 sm:items-center sm:pt-0">
        <div className="w-full max-w-md">{children}</div>
      </main>
    </div>
  );
}
