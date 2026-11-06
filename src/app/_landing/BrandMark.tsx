// The Core Commerce logo: a shopfront (awning over a shop with a door) in white on the brand
// gradient square. The same drawing is in src/app/icon.svg and the PNG app icons.

/** The shopfront drawn in a 100×100 box, for use on the gradient square */
export function ShopfrontGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden="true" focusable="false">
      {/* Awning: a bar with three scallops */}
      <path d="M24 16 H76 L84 34 H16 Z" fill="#FFFFFF" />
      <path d="M16 34 a11.33 11.33 0 0 0 22.67 0 a11.33 11.33 0 0 0 22.67 0 a11.33 11.33 0 0 0 22.66 0 Z" fill="#FFFFFF" opacity="0.85" />
      {/* Shop and door */}
      <rect x="22" y="52" width="56" height="34" rx="6" fill="#FFFFFF" />
      <rect x="42" y="62" width="16" height="24" rx="4" fill="#4028C9" />
    </svg>
  );
}

/** The logo square used next to the name in headers and footers */
export function BrandMark({ className = "" }: { className?: string }) {
  return (
    <span className={`items-center justify-center rounded-control bg-brand-gradient ${className || "flex h-8 w-8"}`} aria-hidden="true">
      <ShopfrontGlyph className="h-[70%] w-[70%]" />
    </span>
  );
}
