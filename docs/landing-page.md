# Sincewhen — landing page

A promotional page that says what Sincewhen is and why to use it, like a product company's
home page. This is a first draft (branch `landing-page`, 2026-09-26): the content is meant to
be close to final, and the design is a plain starting point for a later pass with Claude Design.

It lives at **`/about`**.

## Where things are

- `app/(marketing)/about/content.ts` — every word on the page, in page order. Edit copy here.
- `app/(marketing)/about/page.tsx` — the layout of the sections. Restyle here.
- `app/(marketing)/layout.tsx` — header (wordmark, section links, "Open app") and footer.
- `public/landing/` — six phone screenshots (Folders, Home, Due; light and dark), made by
  `scripts/landing-screenshots.mjs` from the real app with the example setup. Remake them
  whenever the app's look changes; the script says how.
- `public/qr-code.svg` — shared with the intro (see pwa.md).

The app and the landing page are separated by **route groups**: `app/(app)/` has the tab bar,
saved data and intro (`(app)/layout.tsx`), `app/(marketing)/` has none of it. The brackets keep
the folder names out of the URLs. The root `app/layout.tsx` holds only what both need: fonts,
the theme and size script, and `DisplaySettingsSync`. So the landing page follows the visitor's
theme, and the Large size too if they chose it in the app.

## Sections

1. **Hero** — "Since when did you last change the air filter?", the one-line pitch, "Open
   Sincewhen", and the Folders screenshot.
2. **Sound familiar?** — the three problems: forgetting when, calendar reminders that don't fit,
   everything looking equally urgent.
3. **How it works** — add with a frequency, check off, follow the colors.
4. **See where the work is** — the three screenshots with captions.
5. **Everything it does** — ten features.
6. **Made for the jobs that come around again** — eight kinds of use (home, cleaning, car, garden,
   pets, health, exercise, work) with example tasks.
7. **Your tasks stay yours** — privacy.
8. **No app store needed** — install steps (the same component as the app), the QR code on
   wider screens.
9. **Questions** — nine FAQs, as plain `<details>` (no JavaScript).
10. **Final call to action**, then the footer.

## Rules for the copy

- American spelling and phrasing throughout, in the app too (color, organized, "check off",
  "right away"). Switched from British on 2026-09-26.
- Every claim must be true of the app as shipped. Anything not built says "not yet"
  (reminders, sharing with a household, syncing between devices).
- No invented numbers and no testimonials until real users have given a quote and permission to
  use it.

## Checked

Production build, phone (390px) and desktop (1440px), light and dark: axe-core found no WCAG A/AA
issues, nothing scrolls sideways, no console errors, and "Open Sincewhen" lands in the app.

## Open questions

- **Where should it live?** `/about` for now. Options: keep it there and share that link; make
  `/` show it to first-time browser visitors (not installed, no data) while installed apps and
  returning users go straight to the app; or give it its own domain later.
- **Logo.** The three status dots beside the name are a placeholder, like the app icon.
- **Sharing preview.** Done 2026-09-27: `app/(marketing)/about/opengraph-image.tsx` draws a
  1200×630 card at build time from the hero copy and the Folders screenshot (see docs/seo.md).
  Share `/about` links: the app's own screens have no preview image.
- **Offline.** `/about` is not in the service worker's page list, so offline it falls back to the
  app. Fine for a marketing page.
- **Search engines.** Done 2026-09-27 (docs/seo.md): the page has a canonical link on
  `SITE_URL` (`lib/site.ts`), `app/sitemap.ts` lists only `/about`, `app/robots.ts` allows
  crawling, and the app's own screens (`/`, `/due`, `/rooms`, `/settings`) are `noindex` from
  `app/(app)/layout.tsx`, because they show nothing without saved data.
