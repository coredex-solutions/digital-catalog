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
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384, 512, 768], // Icon/thumbnail sizes (added larger sizes for categories)
    minimumCacheTTL: 31536000, // Cache optimized images for 1 year (images don't change often)
    dangerouslyAllowSVG: false, // Security: don't allow SVG
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;", // Security policy
  },
  // Remove static export to enable ISR and API routes
  // output: 'export', // Commented out to enable ISR
  trailingSlash: true,
};

module.exports = nextConfig;

