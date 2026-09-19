# Sincewhen — installing as a PWA

Installing matters here, not just for convenience: Safari deletes a site's local data after 7
days without a visit, and an installed app is exempt. The app shows a one-time hint about this
when it is opened in a browser tab.

## Install

**iPhone / iPad (Safari):** open the site, tap Share, then "Add to Home Screen". Open the app
from the home-screen icon from then on — data created in the Safari tab does not carry over,
because the installed app has its own storage. Export first if you already have data in Safari.

**Android (Chrome):** open the site, then menu, then "Install app" (or "Add to Home screen").

**Desktop (Chrome / Edge):** the install icon at the right of the address bar.

## Verify it worked

- The app opens without browser chrome (no address bar).
- It opens with the network off.
- Settings shows storage as persistent (`navigator.storage.persisted()` returns true). iOS may
  not report this reliably; the backup nudge is the real safety net.

## How it is built

- `app/manifest.ts` — name, icons, `display: "standalone"`. Served at `/manifest.webmanifest`.
- Icons — `app/icon.svg` (browser tab), `app/apple-icon.png` (iOS home screen, 180px, square:
  iOS rounds it), `public/icons/icon-192.png`, `icon-512.png` and `icon-maskable-512.png`
  (artwork shrunk to the middle 72% so Android can crop it to any shape).
- `public/sw.js` — the service worker. Read its comments first; the rules are in plan.md.
- `next.config.ts` — serves `sw.js` with `no-store`, so a fixed worker reaches phones at once.
- `lib/pwa/pwa.ts` — registers the worker (production only), calls
  `navigator.storage.persist()`, and sets the icon badge to the overdue count. The badge only
  updates while the app is open; a background update needs push.
- `components/app/install-hint.tsx` — the install nudge.

## Testing it

The worker does not run under `pnpm dev`. Use `pnpm build && pnpm start`, open the site, then in
Chrome DevTools: Application > Service workers to see it, and Network > Offline to test.
`localhost` counts as secure, so no HTTPS is needed locally. To start clean, use Application >
Storage > Clear site data (this also deletes your tasks on that origin).

## Changing the worker

Bump `CACHE` in `sw.js` whenever the caching rules change; old caches are deleted on activate.
Adding a page to the app means adding it to `PAGES`, or it will not open offline.

## Alternatives, if a PWA stops being enough

- **Serwist** (`@serwist/turbopack`) generates the worker and a precise precache list from the
  build. Worth it once there are many routes, or when adding push or background sync. It
  replaces `public/sw.js`; everything else here stays.
- **Capacitor** wraps this same Next.js app (as a static export) in a native shell. It gives
  real local notifications without a server, native file storage that the OS will not evict,
  and App Store distribution. It is the smallest step up from a PWA.
- **Web Push** keeps the PWA but adds a server (Supabase + cron) to send reminders. On iOS it
  works only for an installed PWA.
- **React Native / Expo** is a rewrite of the UI; only worth it if the app needs deep native
  features. The pure logic in `lib/core` would carry over unchanged.
