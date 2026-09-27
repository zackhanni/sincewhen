import { execFileSync } from "node:child_process";
import type { NextConfig } from "next";
import { RETIRED_HOSTS, SITE_URL } from "./lib/site";

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

/**
 * The Content-Security-Policy: which sources the page may load from. Everything the app uses is
 * its own (fonts are self-hosted by next/font at build time), so almost everything is 'self'.
 *
 * Scripts need 'unsafe-inline' because every page is static: Next.js' inline bootstrap scripts
 * and our theme script (app/layout.tsx) are baked in at build time. The stricter nonce form only
 * works on pages rendered per request, which would end offline use (the service worker caches
 * these static pages). What still counts: no script can be loaded from anywhere else, and with
 * `connect-src`, `img-src` and `form-action` on 'self', injected code has no fetch, beacon, image
 * or form to send data to another site. No CSP can stop a script navigating the page away with
 * data in the address, so the real protection stays upstream: React renders user text as text,
 * never as HTML. Hashes instead of 'unsafe-inline' were weighed and declined: see
 * docs/security-audit.md.
 * Development adds 'unsafe-eval', which the dev server's hot reload needs.
 */
const CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${process.env.NODE_ENV === "development" ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  // data: and blob: cover inline images and the temporary link a backup download uses.
  "img-src 'self' data: blob:",
  "font-src 'self'",
  "connect-src 'self'",
  "worker-src 'self'",
  "manifest-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join("; ");

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
    // Old addresses send every visitor to the real one, keeping the path and query.
    //
    // Permanent (308), so browsers and search engines drop the old address for good. That
    // also locks away anything still saved in a browser at the old address (storage belongs
    // to one address, and browsers cache a permanent redirect), so it is only safe once nobody
    // has data left there: back up at the old address and restore here first. Preview
    // deployments have their own addresses and are not affected.
    return RETIRED_HOSTS.map((host) => ({
      source: "/:path*",
      has: [{ type: "host" as const, value: host }],
      destination: `${SITE_URL}/:path*`,
      permanent: true,
    }));
  },
  async headers() {
    return [
      {
        // Standard hardening for every response. The app has no server data to protect, so these
        // are defense in depth: they stop other sites framing the app, stop the browser guessing
        // file types, keep full URLs (which carry item ids) out of the Referer header sent to other
        // sites, and switch off device features the app never uses.
        source: "/:path*",
        headers: [
          { key: "Content-Security-Policy", value: CONTENT_SECURITY_POLICY },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()" },
        ],
      },
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
