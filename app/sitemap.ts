import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

/** Only the landing page: every app screen is `noindex` (app/(app)/layout.tsx). */
export default function sitemap(): MetadataRoute.Sitemap {
  return [{ url: `${SITE_URL}/about` }];
}
