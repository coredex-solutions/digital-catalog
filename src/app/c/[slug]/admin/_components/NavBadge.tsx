"use client";

/** Small count next to a navigation link (e.g. new orders). Hidden at zero. */
export function NavBadge({ count, lang }: { count: number; lang: "en" | "ar" }) {
  if (count <= 0) return null;
  const label = lang === "ar" ? `${count} جديد` : `${count} new`;
  return (
    <span
      className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-ui-primary px-1.5 text-[11px] font-semibold leading-none text-white"
      aria-label={label}
      title={label}
    >
      {count > 99 ? "99+" : count}
    </span>
  );
}
