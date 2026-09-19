import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  env: {
    // Names the service worker's cache, so each deploy gets a fresh one (see public/sw.js).
    // Vercel provides the commit SHA; a local build falls back to the time it was built.
    NEXT_PUBLIC_BUILD_ID: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 12) ?? String(Date.now()),
  },
  async headers() {
    return [
      {
        // The browser must always re-check the service worker. If sw.js itself were cached, a
        // fixed or updated worker could take a day or more to reach the phone.
        source: "/sw.js",
        headers: [
          { key: "Content-Type", value: "application/javascript; charset=utf-8" },
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
        ],
      },
    ];
  },
};

export default nextConfig;
