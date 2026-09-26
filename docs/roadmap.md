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

- [x] Rooms view: drill-in, breadcrumb, coloured cards, badges
- [x] Location filter (chips on the Due tab; shown once there are two locations)
- [x] Task row: colour, due text, one-tap complete, severe "!" mark
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

## Launch (owner: Zack)

- [x] Serve at `sincewhen.webwizarddev.com` (live 2026-09-24). A new domain is an empty app,
      so back up on the old address and restore on the new one.
- [ ] Old address redirects to the new one: `next.config.ts` sends `sincewhen-ruby.vercel.app`
      to `sincewhen.webwizarddev.com` (307) on branch `launch-prep`. Deploys when merged.
- [x] Small-text contrast with tasks loaded: grey text on long-overdue rows and the orange and
      red room badges were under 4.5:1. Lighthouse accessibility 96 → 100 on the 3 affected
      screens (local production build with sample tasks, 2026-09-25; branch `launch-prep`).
      Re-measure on the live site after it deploys.
- [ ] Add the entry and 5 screenshots to the `/portfolio` page of `web-wizard-dev-v2`.
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

## Future additions (not v1)

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
- **Dark mode.** The theme has dark tokens, but the status colours in `lib/status-styles.ts`
  are light-only and nothing sets the `.dark` class yet.
- **Automated browser tests.** Phase 3 was checked with a throwaway Playwright script; a
  committed e2e suite would make that repeatable.
- **Drag to reorder.** The `sortOrder` field is already a fractional-indexing key; only the drag
  UI is missing.
- **Snooze** a task without completing it.
- **History view** and frequency suggestions from the completion log.
- **Templates** for common rooms. Until then, duplicate a subtree and edit the frequencies.
- **Merge on import** instead of replace.
