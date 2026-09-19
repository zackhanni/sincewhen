# Sincewhen — installing as a PWA

Installing matters here, not just for convenience: Safari deletes a site's local data after 7
days without a visit, and an installed app is exempt. Until Phase 4 ships the manifest and
service worker, "Add to Home Screen" only creates a bookmark.

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

## What is built in Phase 4

- `app/manifest.ts` — name, icons, `display: "standalone"`, theme colours.
- Icons: 192 and 512 PNG, a maskable variant, and an `apple-touch-icon`.
- A Serwist service worker that precaches the app shell so it opens offline.
- A call to `navigator.storage.persist()` on first run.
- The Badging API (`navigator.setAppBadge`) to show the overdue count on the icon. It only
  updates while the app is open; a true background update needs push.

## Alternatives, if a PWA stops being enough

- **Capacitor** wraps this same Next.js app (as a static export) in a native shell. It gives
  real local notifications without a server, native file storage that the OS will not evict,
  and App Store distribution. It is the smallest step up from a PWA.
- **Web Push** keeps the PWA but adds a server (Supabase + cron) to send reminders. On iOS it
  works only for an installed PWA.
- **React Native / Expo** is a rewrite of the UI; only worth it if the app needs deep native
  features. The pure logic in `lib/core` would carry over unchanged.
