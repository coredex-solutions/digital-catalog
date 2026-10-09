"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Drawer } from "vaul";
import { clsx } from "clsx";
import { ExternalLink, LogOut, MoreHorizontal, X } from "lucide-react";
import { getAdminNavItems, isNavItemActive, PHONE_TAB_KEYS } from "./adminNav";

interface MobileNavProps {
  slug: string;
  catalogName: string;
  features: { analytics_enabled?: boolean } | null;
}

/** Compact sticky top bar shown below lg, in place of the sidebar's brand header. */
export function CatalogAdminTopBar({ slug, catalogName }: Omit<MobileNavProps, "features">) {
  return (
    <div className="lg:hidden sticky top-0 z-30 flex h-14 items-center justify-between gap-3 border-b border-ui-line bg-ui-surface px-4">
      <p className="min-w-0 truncate text-base font-semibold text-ui-ink">{catalogName}</p>
      <a
        href={`/c/${slug}`}
        target="_blank"
        rel="noopener noreferrer"
        className="-me-2 inline-flex h-11 shrink-0 items-center gap-1.5 rounded-control px-3 text-sm font-medium text-ui-primary hover:bg-ui-subtle"
      >
        <ExternalLink className="h-4 w-4" aria-hidden />
        View menu
        <span className="sr-only">(opens in a new tab)</span>
      </a>
    </div>
  );
}

/** Fixed bottom tab bar (Home, Menu, Insights?, More) plus the "More" sheet, below lg only. */
export function CatalogAdminBottomNav({ slug, catalogName, features }: MobileNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [moreOpen, setMoreOpen] = useState(false);

  const items = getAdminNavItems(slug, features);
  const tabs = items.filter((i) => PHONE_TAB_KEYS.includes(i.key));
  const moreItems = items.filter((i) => !PHONE_TAB_KEYS.includes(i.key));
  const moreActive = moreItems.some((i) => isNavItemActive(i, pathname));

  // Close the sheet after navigating
  useEffect(() => {
    setMoreOpen(false);
  }, [pathname]);

  const handleLogout = () => {
    localStorage.removeItem(`catalog_admin_token_${slug}`);
    router.push(`/c/${slug}/admin/login`);
  };

  const tabClass = (active: boolean) =>
    clsx(
      "relative flex min-h-14 flex-1 flex-col items-center justify-center gap-0.5 px-1 pt-1.5 pb-1 text-[11px] leading-tight transition-colors",
      active ? "font-semibold text-ui-primary" : "font-medium text-ui-muted hover:text-ui-ink"
    );

  const indicator = (active: boolean) =>
    active ? <span className="absolute top-0 h-[3px] w-8 rounded-b-full bg-ui-primary" aria-hidden /> : null;

  return (
    <>
      <nav
        aria-label="Admin sections"
        className="lg:hidden fixed inset-x-0 bottom-0 z-40 border-t border-ui-line bg-ui-surface"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <ul className="mx-auto flex max-w-xl">
          {tabs.map((item) => {
            const active = isNavItemActive(item, pathname);
            return (
              <li key={item.key} className="flex flex-1">
                <Link href={item.href} aria-current={active ? "page" : undefined} className={tabClass(active)}>
                  {indicator(active)}
                  <span
                    className={clsx(
                      "flex h-7 w-12 items-center justify-center rounded-full transition-colors",
                      active && "bg-ui-subtle"
                    )}
                  >
                    <item.icon className="h-5 w-5" strokeWidth={active ? 2.5 : 2} aria-hidden />
                  </span>
                  {item.shortLabel ?? item.label}
                </Link>
              </li>
            );
          })}
          <li className="flex flex-1">
            <button
              type="button"
              onClick={() => setMoreOpen(true)}
              aria-haspopup="dialog"
              aria-expanded={moreOpen}
              aria-current={moreActive ? "page" : undefined}
              className={tabClass(moreActive)}
            >
              {indicator(moreActive)}
              <span
                className={clsx(
                  "flex h-7 w-12 items-center justify-center rounded-full transition-colors",
                  moreActive && "bg-ui-subtle"
                )}
              >
                <MoreHorizontal className="h-5 w-5" strokeWidth={moreActive ? 2.5 : 2} aria-hidden />
              </span>
              More
            </button>
          </li>
        </ul>
      </nav>

      <Drawer.Root open={moreOpen} onOpenChange={setMoreOpen} repositionInputs={false}>
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 z-[60] bg-black/40 lg:hidden" />
          {/* Portalled to <body>, so re-apply the platform scope for the ui-* tokens */}
          <Drawer.Content
            lang="en"
            dir="ltr"
            style={{ backgroundColor: "var(--ui-surface)" }}
            className="platform fixed inset-x-0 bottom-0 z-[61] mx-auto flex max-h-[90dvh] w-full max-w-xl flex-col rounded-t-panel bg-ui-surface text-ui-ink shadow-xl outline-none lg:hidden"
          >
            <div className="mx-auto mt-2.5 h-1.5 w-10 shrink-0 rounded-full bg-ui-line" aria-hidden />
            <div className="flex shrink-0 items-start gap-3 px-4 pt-3 pb-2">
              <div className="min-w-0 flex-1">
                <Drawer.Title className="text-lg font-semibold leading-tight">More</Drawer.Title>
                <Drawer.Description className="mt-0.5 truncate text-sm text-ui-muted">{catalogName}</Drawer.Description>
              </div>
              <button
                type="button"
                onClick={() => setMoreOpen(false)}
                className="-me-2 -mt-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-control text-ui-muted hover:bg-ui-subtle hover:text-ui-ink"
                aria-label="Close"
              >
                <X className="h-5 w-5" aria-hidden />
              </button>
            </div>

            <div
              className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-2"
              style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}
            >
              <ul className="space-y-0.5">
                {moreItems.map((item) => {
                  const active = isNavItemActive(item, pathname);
                  return (
                    <li key={item.key}>
                      <Link
                        href={item.href}
                        aria-current={active ? "page" : undefined}
                        onClick={() => setMoreOpen(false)}
                        className={clsx(
                          "flex min-h-12 items-center gap-3 rounded-control px-3 text-base transition-colors",
                          active ? "bg-ui-subtle font-semibold text-ui-ink" : "font-medium text-ui-ink hover:bg-ui-subtle"
                        )}
                      >
                        <item.icon
                          className={clsx("h-5 w-5", active ? "text-ui-primary" : "text-ui-muted")}
                          strokeWidth={active ? 2.5 : 2}
                          aria-hidden
                        />
                        <span className="flex-1">{item.label}</span>
                        {active && <span className="text-xs font-semibold text-ui-primary">Current</span>}
                      </Link>
                    </li>
                  );
                })}
              </ul>

              <div className="mx-3 my-2 h-px bg-ui-line" />

              <a
                href={`/c/${slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex min-h-12 items-center gap-3 rounded-control px-3 text-base font-medium text-ui-ink hover:bg-ui-subtle"
              >
                <ExternalLink className="h-5 w-5 text-ui-muted" aria-hidden />
                View live menu
                <span className="sr-only">(opens in a new tab)</span>
              </a>
              <button
                type="button"
                onClick={handleLogout}
                className="flex min-h-12 w-full items-center gap-3 rounded-control px-3 text-start text-base font-medium text-ui-danger hover:bg-ui-subtle"
              >
                <LogOut className="h-5 w-5" aria-hidden />
                Sign out
              </button>
            </div>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>
    </>
  );
}
