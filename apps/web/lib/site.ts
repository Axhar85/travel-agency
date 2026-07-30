// Canonical site URL - used wherever an absolute URL is required (sitemap,
// robots.txt, Open Graph, hreflang alternates). Falls back to localhost so
// these all still work in local dev without extra setup.
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
