/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // Product image hosts vary across deployments (CDN, API host).
    remotePatterns: [
      { protocol: "https", hostname: "**" },
      { protocol: "http", hostname: "**" },
    ],
    formats: ["image/avif", "image/webp"],
  },
};

export default nextConfig;
