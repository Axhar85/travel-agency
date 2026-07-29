import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

// /admin/* and /account/* are private/functional (owner content-management
// panel, customer account pages) - not content worth indexing, and not
// something search engines should be spending crawl budget on. /booking/*
// and /search are transactional/dynamic, not stable content pages either.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/account", "/booking", "/search"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
