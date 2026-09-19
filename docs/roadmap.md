# Sincewhen — roadmap

One branch and one PR per phase, reviewed by CodeRabbit. Keep the stack at most one deep: the
next phase may branch from an unmerged phase, but never further than that.

## Phase 0 — Scaffold

- [x] Next.js + TypeScript + Tailwind + shadcn + Vitest
- [x] Docs: plan, roadmap, pitfalls, pwa, AGENTS.md
- [ ] Deploy the empty shell to Vercel and open it on the phone

## Phase 1 — Core logic (test-first, no UI)

- [x] Node types and zod schemas
- [x] `dueDate`, `progress`, `status` — edge cases: Jan 31 + 1 month, leap day, never completed
- [x] Room score with the rollup rules (descendants, severe = 2, overdue parent counts once)
- [x] Sort comparator: tasks by progress, then folders by score, `sortOrder` as tie-break
- [x] Tree operations: add, move (depth + cycle guards), duplicate subtree, delete subtree
- [x] Complete, cascade to due children, auto-complete parent, undo

## Phase 2 — Store

- [ ] zustand store with persist, `schemaVersion`, migration hook
- [ ] Storage interface in front of the localStorage implementation

## Phase 3 — UI

- [ ] Rooms view: drill-in, breadcrumb, coloured cards, badges
- [ ] Location switcher
- [ ] Task row: colour, due text, one-tap complete, severe "!" mark
- [ ] Item menu (drawer): edit, frequency, move, duplicate, add sub-task, delete with confirm
- [ ] Add / edit form (TanStack Form) with frequency picker and "last done"
- [ ] Due tab
- [ ] Empty states and undo toast

## Phase 4 — PWA

- [ ] Manifest, icons, Serwist service worker, offline
- [ ] `navigator.storage.persist()` and an install hint
- [ ] App icon badge with the overdue count (updates when the app opens)

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
- **Drag to reorder.** The `sortOrder` field is already a fractional-indexing key; only the drag
  UI is missing.
- **Snooze** a task without completing it.
- **History view** and frequency suggestions from the completion log.
- **Templates** for common rooms. Until then, duplicate a subtree and edit the frequencies.
- **Merge on import** instead of replace.
