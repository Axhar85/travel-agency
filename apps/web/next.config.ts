import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin();

const nextConfig: NextConfig = {
  images: {
    // Stock placeholder photography (hero, category cards) - a known,
    // stable host, unlike the arbitrary owner-uploaded Vercel Blob URLs
    // elsewhere in the app, which deliberately use plain <img> instead.
    remotePatterns: [{ protocol: "https", hostname: "images.unsplash.com" }],
  },
};

export default withNextIntl(nextConfig);
