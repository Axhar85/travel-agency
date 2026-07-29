import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

// Only the real, stable content pages - not /admin, /account, /booking,
// /search (transactional/private, already excluded via robots.ts), or
// /coming-soon (placeholder, not real content worth ranking).
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  return [
    {
      url: `${SITE_URL}/es`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1,
      alternates: {
        languages: {
          es: `${SITE_URL}/es`,
          en: `${SITE_URL}/en`,
        },
      },
    },
    {
      url: `${SITE_URL}/en`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1,
      alternates: {
        languages: {
          es: `${SITE_URL}/es`,
          en: `${SITE_URL}/en`,
        },
      },
    },
    {
      url: `${SITE_URL}/es/hajj-umrah`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.8,
      alternates: {
        languages: {
          es: `${SITE_URL}/es/hajj-umrah`,
          en: `${SITE_URL}/en/hajj-umrah`,
        },
      },
    },
    {
      url: `${SITE_URL}/en/hajj-umrah`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.8,
      alternates: {
        languages: {
          es: `${SITE_URL}/es/hajj-umrah`,
          en: `${SITE_URL}/en/hajj-umrah`,
        },
      },
    },
  ];
}
