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

- [ ] JSON file export
- [ ] Share-sheet export
- [ ] Import: zod validation, preview with counts, replace
- [ ] Backup-age nudge

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
