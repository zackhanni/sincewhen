import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  env: {
    // Names the service worker's cache, so each deploy gets a fresh one (see public/sw.js).
    // Vercel provides the commit SHA; a local build falls back to the time it was built.
    NEXT_PUBLIC_BUILD_ID: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 12) ?? String(Date.now()),
  },
  async redirects() {
    return [
      {
        // The app's first address now sends visitors to the real domain, keeping the path and
        // query. Browser storage belongs to one address, so anything saved on the old one has to
        // be backed up there and restored here first (Settings > Back up). Temporary (307) on
        // purpose: browsers cache a permanent redirect, which would lock the old address's data
        // away for good if it is ever needed again. Remove this rule to reach it.
        source: "/:path*",
        has: [{ type: "host", value: "sincewhen-ruby.vercel.app" }],
        destination: "https://sincewhen.webwizarddev.com/:path*",
        permanent: false,
      },
    ];
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
