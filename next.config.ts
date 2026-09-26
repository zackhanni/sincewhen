import { execFileSync } from "node:child_process";
import type { NextConfig } from "next";

/** Runs git with these arguments and returns its output, or null where git or the repo is not available. */
function git(...args: string[]): string | null {
  try {
    // execFileSync, not execSync: the arguments go straight to git, never through a shell.
    return execFileSync("git", args, { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
  } catch {
    return null;
  }
}

/**
 * The version shown in Settings, such as "2026.9.26". It is the date of the commit being built,
 * so it moves forward on every release without anyone bumping a number by hand. A commit count
 * would read more like a classic version, but Vercel clones only the last few commits, so the
 * count would be wrong there. Falls back to the build date (UTC) if git cannot be asked.
 */
function appVersion(): string {
  const commitDate = git("log", "-1", "--format=%cs");
  const date = commitDate && /^\d{4}-\d{2}-\d{2}$/.test(commitDate) ? commitDate : new Date().toISOString().slice(0, 10);
  const [year, month, day] = date.split("-").map(Number);
  return `${year}.${month}.${day}`;
}

const nextConfig: NextConfig = {
  env: {
    // Names the service worker's cache, so each deploy gets a fresh one (see public/sw.js).
    // Vercel provides the commit SHA; a local build falls back to the time it was built.
    NEXT_PUBLIC_BUILD_ID: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 12) ?? String(Date.now()),
    NEXT_PUBLIC_APP_VERSION: appVersion(),
    // Shown next to the version, so a bug report can be traced to the exact commit.
    NEXT_PUBLIC_COMMIT: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? git("rev-parse", "--short=7", "HEAD") ?? "",
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
