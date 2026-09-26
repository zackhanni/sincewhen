# Sincewhen — installing as a PWA

Installing matters here, not just for convenience: Safari deletes a site's local data after 7
days without a visit, and an installed app is exempt. The app shows a one-time hint about this
when it is opened in a browser tab.

## Install

**iPhone / iPad (Safari):** open the site, tap Share, then "Add to Home Screen". On iOS 26 Share
is inside the ••• menu, and "Add to Home Screen" is under View More: ••• → Share → View More →
Add to Home Screen → Add (Zack, 2026-09-26). Open the app from the home-screen icon from then on
— data created in the Safari tab does not carry over, because the installed app has its own
storage. Export first if you already have data in Safari.

**Other iPhone browsers:** Brave has no "Add to Home Screen" at all, not even under Share (Zack,
2026-09-26), and it does not name itself to the page, so the app cannot detect it and point to
Safari. The steps (`components/app/install-steps.tsx`, shown in the install hint, Settings and
the intro) therefore end with a general "Can't find it? Open this page in Safari".

**Android (Chrome):** open the site, then menu, then "Install app" (or "Add to Home screen").

**Desktop (Chrome / Edge):** the install icon at the right of the address bar.

## The QR code

On a computer, the intro's last page shows `public/qr-code.svg`, a QR code for
`https://sincewhen.webwizarddev.com`. It is a static file made once with the `qrcode` npm
package. If the address ever changes, remake it:

```sh
npx -y qrcode -t svg -o public/qr-code.svg "https://new.address"
```

Then check it scans. It is always drawn black on white, dark mode included.

## Verify it worked

- The app opens without browser chrome (no address bar).
- It opens with the network off.
- Settings > This device says "Installed as an app".
- Storage persistence is requested but browsers may refuse silently (Safari usually does).

## What actually protects the data

Only a backup file kept somewhere else (Settings > Back up). Everything on the device is
best-effort:

- Installing avoids Safari's 7-day cleanup, but the browser can still evict storage under
  pressure, and `navigator.storage.persist()` is a request the browser may ignore.
- The "Time to back up" nudge on the Due tab only works while the data is still there: it reads
  `lastBackupDate` from the same storage. If that storage is wiped, the nudge is wiped with it —
  it can remind you a backup is old, but it cannot warn you after a loss.

So export on a schedule of your own, and always before changing phones or clearing site data.

## How it is built

- `app/manifest.ts` — name, icons, `display: "standalone"`. Served at `/manifest.webmanifest`.
- Icons — `app/icon.svg` (browser tab), `app/apple-icon.png` (iOS home screen, 180px, square:
  iOS rounds it), `public/icons/icon-192.png`, `icon-512.png` and `icon-maskable-512.png`
  (artwork shrunk to the middle 72% so Android can crop it to any shape).
- `public/sw.js` — the service worker. Read its comments first; the rules are in plan.md.
- `next.config.ts` — serves `sw.js` with `no-store`, so a fixed worker reaches phones at once.
- `lib/pwa/pwa.ts` — registers the worker (production only), asks for persistent storage (from
  a user action: adding an item or restoring a backup — never on page load), and sets the icon badge to the overdue count. The badge only
  updates while the app is open; a background update needs push.
- `components/app/install-hint.tsx` — the install nudge.

## Testing it

The worker does not run under `pnpm dev`. Use `pnpm build && pnpm start`, open the site, then in
Chrome DevTools: Application > Service workers to see it, and Network > Offline to test.
`localhost` counts as secure, so no HTTPS is needed locally. To start clean, use Application >
Storage > Clear site data (this also deletes your tasks on that origin).

## Updates and the cache

Each deploy gets its own cache. `next.config.ts` sets `NEXT_PUBLIC_BUILD_ID` (the Vercel commit
SHA, or the build time locally) and the page registers `/sw.js?v=<build id>`. A new URL is a new
worker to the browser: it installs, fills `sincewhen-<build id>`, and only then does `activate`
delete the previous cache. There is nothing to bump by hand, and old build files cannot pile up.

Adding a page to the app still means adding it to `PAGES` in `sw.js`, or it will not open offline.

The version in Settings > About (`NEXT_PUBLIC_APP_VERSION`) is the date of the built commit, read
with `git log` in `next.config.ts`. If git is not available in Vercel's build, it falls back to the
build date, which on a deploy-on-merge setup is the same day (UTC). Check the live Settings screen
after the first deploy to see which one it used.

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
