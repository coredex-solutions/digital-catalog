// Contact links for the diner menu.

export function telLink(phone: string): string {
  return `tel:${phone.replace(/[^\d+]/g, "")}`;
}

/**
 * A link that opens directions in the visitor's maps app. Owners often paste an embed URL
 * (google.com/maps/embed?...), which can't be opened directly, so fall back to a search for
 * the restaurant's name and address.
 */
export function mapsLink(options: { mapUrl?: string | null; name: string; address?: string | null; city?: string | null }): string | null {
  const { mapUrl, name, address, city } = options;
  if (mapUrl) {
    const iframeSrc = mapUrl.match(/src=["']([^"']+)["']/)?.[1];
    const url = iframeSrc || mapUrl;
    if (/^https?:\/\//.test(url) && !url.includes("/maps/embed")) return url;
  }
  const query = [name, address, city].filter(Boolean).join(", ");
  if (!address && !city) return mapUrl ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(name)}` : null;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}
