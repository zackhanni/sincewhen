# Sincewhen — roadmap

One branch and one PR per phase, reviewed by CodeRabbit. Keep the stack at most one deep: the
next phase may branch from an unmerged phase, but never further than that.

## Phase 0 — Scaffold

- [x] Next.js + TypeScript + Tailwind + shadcn + Vitest
- [x] Docs: plan, roadmap, pitfalls, pwa, AGENTS.md
- [x] Deploy the empty shell to Vercel and open it on the phone

## Phase 1 — Core logic (test-first, no UI)

- [x] Node types and zod schemas
- [x] `dueDate`, `progress`, `status` — edge cases: Jan 31 + 1 month, leap day, never completed
- [x] Room score with the rollup rules (descendants, severe = 2, overdue parent counts once)
- [x] Sort comparator: tasks by progress, then folders by score, `sortOrder` as tie-break
- [x] Tree operations: add, move (depth + cycle guards), duplicate subtree, delete subtree
- [x] Complete, cascade to due children, auto-complete parent, undo

## Phase 2 — Store

- [x] zustand store with persist, `schemaVersion`, migration hook
- [x] Storage behind zustand's `StateStorage`, so another backend can replace localStorage

## Phase 3 — UI

- [x] Rooms view: drill-in, breadcrumb, colored cards, badges
- [x] Location filter (chips on the Due tab; shown once there are two locations)
- [x] Task row: color, due text, one-tap complete, severe "!" mark
- [x] Item menu (drawer): edit, frequency, move, duplicate, add sub-task, delete with confirm
- [x] Add / edit form (TanStack Form) with frequency picker and "last done"
- [x] Due tab
- [x] Empty states and undo toast

## Phase 4 — PWA

- [x] Manifest, icons, hand-written service worker (`public/sw.js`), offline
- [x] `navigator.storage.persist()` and an install hint
- [x] App icon badge with the overdue count (updates when the app opens)

## Phase 5 — Settings and backup

- [x] JSON file export
- [x] Share-sheet export
- [x] Import: zod validation, preview with counts, replace
- [x] Backup-age nudge

## Next steps, right after PR #7 merges

PR #7 (`landing-page` → `main`) carries `launch-prep` too: round 2, the landing page and both
rounds of CodeRabbit fixes. Once it is merged and deployed:

- [ ] `git switch main && git pull` (local `main` was behind GitHub).
- [ ] The old address forwards: `curl -sI https://sincewhen-ruby.vercel.app/rooms` shows 308 to
      `https://sincewhen.webwizarddev.com/rooms`.
- [ ] `https://sincewhen.webwizarddev.com/about` answers 200 and its page source has
      `<link rel="canonical" href="https://sincewhen.webwizarddev.com/about">`.
- [ ] Settings > About shows a version like `2026.9.26 (a698c9e)`. If the date is the build day
      instead of the commit day, git was not available in Vercel's build (see pwa.md).
- [ ] Re-measure accessibility on the live site, light and dark, with tasks loaded (see the
      contrast item below and pitfalls.md > Accessibility).
- [ ] Open the installed app once with internet so it picks up the new version, then work
      through "Still to verify on a real phone" and "Still to decide or check" below.

## Launch (owner: Zack)

- [x] Serve at `sincewhen.webwizarddev.com` (live 2026-09-24). A new domain is an empty app,
      so back up on the old address and restore on the new one.
- [ ] Old address redirects to the new one: `next.config.ts` sends `sincewhen-ruby.vercel.app`
      to `sincewhen.webwizarddev.com`, permanently (308), keeping the path. Deploys when merged;
      until then the live old address still answers 200. Safe: Zack is the only person with
      data on the old address, and it is backed up (confirmed 2026-09-26). From then on,
      `sincewhen.webwizarddev.com` is the only address to use, until the app gets its own site.
- [x] Small-text contrast with tasks loaded: gray text on long-overdue rows and the orange and
      red room badges were under 4.5:1. Lighthouse accessibility 96 → 100 on the 3 affected
      screens (local production build with sample tasks, 2026-09-25; branch `launch-prep`).
      Re-measure on the live site after it deploys.
- [ ] Add the entry and 5 screenshots to the `/portfolio` page of `web-wizard-dev-v2`. Refresh
      the write-up first (`/portfolio-writeup`): round 2 and the landing page are not in it, and
      the draft in `ai-skills/knowledge/repos/sincewhen/` still describes v1.
- [ ] Reddit post for outside testers, after the phone checks below.

## Still to verify on a real phone

Headless Chromium cannot exercise these, so they are built but unproven:

- [ ] Install from Safari, launch from the icon, relaunch in airplane mode.
- [ ] "Share backup" opens the iOS share sheet and the file arrives in Messages / Files.
- [x] "Save backup file" then "Choose a backup file" on an iPhone: saves to Files, the picker
      opens where it was saved, and the restore works (Zack, 2026-09-19). A second device is untested.
- [ ] The overdue count shows on the home-screen icon. Expected to fail as built: iOS shows a
      web app's badge only after notification permission, which the app never asks for, and
      Chrome on Android doesn't support badges (see `pitfalls.md`). Needs a permission prompt
      first. The app icon itself is a placeholder until a new one is designed.

## Launch prep, round 2

Agreed with Zack on 2026-09-26. Built the same day on `launch-prep`, reviewed by CodeRabbit on
PR #7, and shipped with it. Checked in a headless browser and with axe-core; the items under
"Still to decide or check" need Zack and a real device.

### Built

- [x] **Stop calling everything "Rooms".** The top of the tree is titled "Sincewhen" (heading,
      breadcrumb, "Back to Sincewhen"); the tab is "Folders"; "Add a location or category"; the
      move picker and empty states match. Code names (`activeLocationId`, `/rooms`) stay.
- [x] The name placeholder follows the "Repeats" switch: "Change the air filter" for a task,
      "Home, Work, or Cleaning" at the top level, "Kitchen" inside another item.
- [x] **Wide screens.** From 640px the page widens to 64rem and lists become a grid of 20rem
      columns (one on a phone, two on a fold or iPad, three on a desktop; fewer with Large).
- [x] **Theme: Match device / Light / Dark**, Match device by default, following the device live
      while open. Dark versions of every hard-coded color; no white flash on launch (head
      script); browser bar color follows. axe-core: 0 WCAG A/AA issues on every screen, both
      themes, both sizes.
- [x] **Interface size: Default / Large** (125%, everything scales). Saved per device.
- [x] **Export: "Include display settings" checkbox.** Import applies them and says so in the
      preview. Backups stay readable both ways (tested): the field sits beside the data, and an
      unreadable one is ignored rather than failing the import.
- [x] **Convert the number when the unit changes** (only when editing a saved task, always
      from the saved value: 2 weeks → 14 days, 2 months → 61 days). When no count from 1 to
      999 is within 5% (3 years in days, a daily task in years, 8 months in years), the number
      is cleared and a note asks for one, instead of saving a different interval.
- [x] **Install steps** in one component, used by the install hint (now folded behind "Show me
      how"), Settings and the intro: iOS 26 Safari path, Android, and "open in Safari" for Brave.
- [x] **Intro for first-time users**: 6 pages (welcome, folders, check-off, colors, free,
      private and offline, then install on a phone or the QR code on a desktop). "Don't show this again";
      reading to the end also counts; Settings > About > "Show the intro".
- [x] **Desktop QR code** (`public/qr-code.svg`, decodes to the live address; see pwa.md to remake).
- [x] **Example setup**: "Start with examples" at the end of the intro and on both empty
      screens. Dates relative to today, every color shows on any day (tested over two years).
- [x] **Version in Settings > About**: the date of the built commit plus its short hash, set
      automatically in `next.config.ts`.

- [x] **The first backup nudge waits a week** after the oldest item was added (Zack,
      2026-09-26), so a new user who adds the examples is not asked on day one.
- [x] **"Open the app on" Folders or Due** in Settings > Display, Folders by default. `/` is now
      a launcher; the Due tab moved to `/due` (added to the service worker, offline launch
      tested for both choices). Included in the display settings a backup can carry.
- [x] **Back navigation beyond the breadcrumb:** a ‹ button beside the title on every inner
      screen, and an edge swipe in the installed iPhone/iPad app. Both go one level up.

### Still to decide or check (Zack)

- [ ] Folders or Due as the default start screen: Zack is testing with other users. The choice
      is in Settings; the default is `DEFAULT_DISPLAY_SETTINGS.startOn` in `lib/display`.
- [ ] The intro and Settings now say the app works without internet. Proven in a headless
      browser; confirm with the airplane-mode check under "Still to verify on a real phone".
- [ ] The edge swipe on a real iPhone, in the installed app. If iOS ever adds its own back
      swipe to home-screen apps, both would fire and this one should go.
- [ ] Tab name: "Folders" for now. "All" was the first idea but clashes with the "All" chip on
      the Due tab.
- [ ] On the iPhone: the status bar in dark mode in the installed app (`layout.tsx` sets
      `statusBarStyle: "default"`; untested in dark), Large size, the intro, and the install
      steps as written.
- [ ] On the iPad: the two-column layout, portrait and landscape, and the install steps there.
- [ ] Edit the example list in `lib/core/examples.ts` if it should differ.

## Landing page (PR #7)

A promotional page at `/about`, first draft 2026-09-26. Details and open questions are in
[landing-page.md](landing-page.md).

- [x] Content for every section, in `app/(marketing)/about/content.ts`.
- [x] A plain layout, phone to desktop, light and dark (axe-core: no issues).
- [x] Real screenshots of the app from the example setup (`scripts/landing-screenshots.mjs`).
- [x] Linked from Settings > About.
- [ ] Decide where it lives: `/about`, the front door for first-time visitors, or its own domain.
- [x] American spelling and phrasing, across the app, the page and the docs (2026-09-26).
- [ ] Design pass (Claude Design), a real logo, an Open Graph image.
- [ ] Testimonials, once testers have given quotes and permission.

## Future additions (not v1)

- **Sharing.** Share the whole account, or only chosen rooms, with another person (household
  chores, for example). Show who completed a task, not only when. Later, perhaps a history of
  who has been doing what. Needs Supabase sync and login first; each completion log entry would
  gain a `completedBy` field.

- **Supabase sync and login.** Implement the storage interface against a `nodes` table (one row
  per node, plus `user_id`). Add TanStack Query for the sync layer at that point.
- **Push notifications.** Needs a server: Supabase + a cron job + Web Push. On iOS, web push
  only works for an installed PWA.
- **GPS location switching.** Store coordinates on a location and switch the active location
  when the device is near it. Needs a permission prompt and a manual override.
- **A designed app icon.** The current one is a placeholder drawn in `app/icon.svg`; the PNGs in
  `public/icons` and `app/apple-icon.png` were rendered from it and must be re-rendered together.
- **An "update available" prompt.** A new deploy is picked up on the next launch; there is no
  in-app notice yet.
- **Automated browser tests.** Phase 3 was checked with a throwaway Playwright script; a
  committed e2e suite would make that repeatable.
- **Drag to reorder.** The `sortOrder` field is already a fractional-indexing key; only the drag
  UI is missing.
- **Snooze** a task without completing it.
- **History view** and frequency suggestions from the completion log.
- **Templates** for common rooms. Until then, duplicate a subtree and edit the frequencies.
- **Merge on import** instead of replace.
