import Link from "next/link";
import { ArrowLeft, QrCode } from "lucide-react";

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div lang="en" dir="ltr" className="platform min-h-screen">
      <header className="border-b border-ui-line bg-ui-bg">
        <div className="mx-auto flex h-16 max-w-3xl items-center gap-3 px-4 sm:px-6">
          <Link href="/" aria-label="Back to Coredex" className="flex h-11 w-11 items-center justify-center rounded-control hover:bg-ui-subtle">
            <ArrowLeft className="h-5 w-5" aria-hidden />
          </Link>
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <span className="flex h-8 w-8 items-center justify-center rounded-control bg-ui-primary text-ui-primary-fg" aria-hidden>
              <QrCode className="h-4 w-4" />
            </span>
            Coredex
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14 [&_h1]:text-3xl [&_h1]:font-semibold [&_h2]:mt-10 [&_h2]:text-xl [&_h2]:font-semibold [&_h3]:mt-6 [&_h3]:font-semibold [&_p]:mt-3 [&_p]:leading-relaxed [&_ul]:mt-3 [&_ul]:list-disc [&_ul]:space-y-1.5 [&_ul]:ps-6 [&_a]:font-medium [&_a]:text-ui-primary [&_a]:underline-offset-4 hover:[&_a]:underline">
        {children}
      </main>

      <footer className="border-t border-ui-line py-8 text-center text-sm text-ui-muted">
        <nav aria-label="Legal" className="flex justify-center gap-6">
          <Link href="/privacy/" className="hover:text-ui-ink">Privacy</Link>
          <Link href="/terms/" className="hover:text-ui-ink">Terms</Link>
          <a href="mailto:info@coredex.solutions" className="hover:text-ui-ink">info@coredex.solutions</a>
        </nav>
      </footer>
    </div>
  );
}
