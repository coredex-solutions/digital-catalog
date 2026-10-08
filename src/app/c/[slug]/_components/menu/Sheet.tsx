"use client";

import type { ReactNode } from "react";
import { Drawer } from "vaul";
import { X } from "lucide-react";
import { useCatalog } from "../../_providers/CatalogProvider";
import { cn } from "@/utils/helpers";

interface SheetProps {
  open: boolean;
  onClose: () => void;
  title: string;
  /** Visually hide the title (it stays available to screen readers) */
  hideTitle?: boolean;
  description?: string;
  children: ReactNode;
  /** Sticky area under the scrolling content, e.g. the main action button */
  footer?: ReactNode;
  /** Full-height sheet (search) instead of fitting its content */
  full?: boolean;
  className?: string;
}

/**
 * Bottom sheet used for every overlay on the diner menu. Built on vaul (Radix Dialog), so it
 * traps focus, closes on Escape or swipe-down, and is portalled inside the themed `.menu`
 * wrapper to keep the restaurant's colours, fonts and text direction.
 */
export function Sheet({ open, onClose, title, hideTitle, description, children, footer, full, className }: SheetProps) {
  const { portalContainer, t } = useCatalog();

  return (
    <Drawer.Root
      open={open}
      onOpenChange={(next) => !next && onClose()}
      container={portalContainer}
      repositionInputs={false}
    >
      <Drawer.Portal container={portalContainer}>
        <Drawer.Overlay className="fixed inset-0 z-40 bg-black/45" />
        <Drawer.Content
          className={cn(
            "fixed inset-x-0 bottom-0 z-50 mx-auto flex w-full max-w-xl flex-col rounded-t-panel bg-menu-surface text-menu-ink shadow-menu-lg outline-none",
            full ? "h-[94dvh]" : "max-h-[92dvh]",
            className
          )}
        >
          <div className="mx-auto mt-2.5 h-1.5 w-10 shrink-0 rounded-full bg-menu-line" aria-hidden />

          <div className={cn("flex shrink-0 items-start gap-3 px-4 pt-3", hideTitle ? "pb-0" : "pb-3")}>
            <div className="min-w-0 flex-1">
              <Drawer.Title className={cn("font-menu-display text-xl font-semibold leading-tight", hideTitle && "sr-only")}>
                {title}
              </Drawer.Title>
              {description ? (
                <Drawer.Description className="mt-1 text-sm text-menu-muted">{description}</Drawer.Description>
              ) : (
                <Drawer.Description className="sr-only">{title}</Drawer.Description>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="-me-2 -mt-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-control text-menu-muted transition-colors hover:bg-menu-raised hover:text-menu-ink"
              aria-label={t.close}
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-5">{children}</div>

          {footer && <div className="shrink-0 border-t border-menu-line bg-menu-surface px-4 pt-3 pb-safe">{footer}</div>}
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
