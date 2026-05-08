/** @type {import('next').NextConfig} */
const nextConfig = {
  // Produces a self-contained build under .next/standalone — required for the Docker image.
  output: "standalone",
  images: {
    // Product image hosts vary across deployments (CDN, API host).
    remotePatterns: [
      { protocol: "https", hostname: "**" },
      { protocol: "http", hostname: "**" },
    ],
    formats: ["image/avif", "image/webp"],
    // Keep optimized variants on disk for a year. Local /public assets are
    // keyed on a hash of the source file, so a re-encode invalidates the URL
    // automatically; remote URLs respect their own Cache-Control over this.
    minimumCacheTTL: 60 * 60 * 24 * 365,
    // Cap responsive variants at 2560 px. The default goes up to 3840 px, which
    // forces Sharp to generate 4K crops that almost no one renders and burns
    // CPU on cold cache hits — measurably hurts hero LCP under load.
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2560],
  },
  async headers() {
    return [
      {
        source: "/_next/static/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        source: "/:path*\\.:ext(js|css|svg|png|jpg|jpeg|webp|avif|woff|woff2)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
