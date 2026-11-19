/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: '*.r2.dev',
      },
      {
        protocol: 'https',
        hostname: '*.r2.cloudflarestorage.com',
      },
    ],
    unoptimized: false, // Enable image optimization
    formats: ['image/avif', 'image/webp'], // Modern formats for better compression
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840], // Responsive breakpoints
    // Icon/thumbnail sizes. 192 and 288 fit the 96px dish photos on 2x and 3x phone screens, which
    // otherwise download at 256 or 384 (about half the bytes again).
    imageSizes: [16, 32, 48, 64, 96, 128, 192, 256, 288, 384, 512, 768],
    // 75 is the default; 60 is for the business page cover, a wide decorative banner
    qualities: [60, 75],
    minimumCacheTTL: 31536000, // Cache optimized images for 1 year (images don't change often)
    dangerouslyAllowSVG: false, // Security: don't allow SVG
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;", // Security policy
  },
  // Remove static export to enable ISR and API routes
  // output: 'export', // Commented out to enable ISR
  trailingSlash: true,
  poweredByHeader: false,
  // Basic browser protections on every response. Business pages may be shown inside an owner's
  // own website, so only the dashboards refuse to be framed by other sites.
  async headers() {
    const common = [
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      // Browsers only honour this over HTTPS, so it has no effect on local http
      { key: 'Strict-Transport-Security', value: 'max-age=31536000' },
    ];
    const noFraming = [{ key: 'X-Frame-Options', value: 'SAMEORIGIN' }];
    return [
      { source: '/:path*', headers: common },
      { source: '/c/:slug/admin/:path*', headers: noFraming },
      { source: '/superadmin/:path*', headers: noFraming },
      { source: '/superadmin', headers: noFraming },
    ];
  },
  // The app folder is the root, even when a package-lock.json sits in a parent folder
  // (otherwise Turbopack watches that whole folder and recompiles on unrelated changes)
  turbopack: { root: process.cwd() },
  // `npm run dev` opened through a Cloudflare quick tunnel (cloudflared tunnel --url ...);
  // without this, Next.js blocks the dev scripts for any address other than localhost
  allowedDevOrigins: ['*.trycloudflare.com'],
};

module.exports = nextConfig;

