import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

/**
 * Crawling is allowed everywhere. The app's screens are kept out of search results with a
 * `noindex` tag instead (app/(app)/layout.tsx): a crawler blocked here could never read that tag.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
