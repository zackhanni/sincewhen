# Scaling & Algorithm Audit

> skill: scaling-audit v2.0.3 @ 9b1d458+dirty · mode: linked · repo: sincewhen
>
> Cumulative: each run adds a dated round. Earlier rounds record what was decided and why.

## Round 1 — 2026-09-26 — scope: whole repo, measured

First audit, on branch `skill-pass` at af958be.

**Scale.** There is no server and no database. Everything is two arrays saved as one JSON
string in localStorage (key `sincewhen`): `nodes` (every location, room, task and sub-task) and
`completions` (the log). The limit that matters is the browser's storage for the site: about
5.24 million characters in Chromium (measured: see `docs/pitfalls.md`), shared by every key.

**Benchmark** (vitest in Node on an M-series laptop; a phone is roughly 3-5 times slower):

| Shape | Items | Log entries | Saved chars | Load (parse + check) | Due tab | Folders tab | Complete | Save |
|---|---|---|---|---|---|---|---|---|
| typical | 309 | 2,000 | 312,240 | 3.4 ms | 1.6 ms | 1.0 ms | 0.06 ms | 0.4 ms |
| large | 1,055 | 20,000 | 2,634,140 | 26.9 ms | 5.3 ms | 3.1 ms | 0.22 ms | 3.3 ms |
| extreme | 12,210 | 40,000 | 7,726,456 (over the limit) | 105 ms | 65 ms | 28.7 ms | 2.4 ms | 10 ms |

Every in-memory path is O(n) or O(n log n) and fast at any size a person would reach. Storage is
the only limit that bites. A log entry costs about 118 saved characters (two UUIDs and a date).

### Findings

| # | Finding | Severity | Active now? | Outcome |
|---|---|---|---|---|
| 1 | The completion log grows toward the storage limit; at the limit every save fails | Medium | no: ~4-5 years of heavy use | 1a applied, 1b deferred |
| 2 | The copy kept before an import was indented and kept forever | Low | only after an import | applied (compact) |
| 3 | The Due tab renders every row, with no virtualization | Low | no | no action |

#### 1. The completion log grows toward the storage limit
`lib/core/complete.ts` appends one entry per completed item, and entries are only removed
when their item is deleted. That is deliberate (`docs/plan.md`: undo now, history later).
About 40,000 entries fill the storage beside ~300 items. Heavy use (10 daily tasks plus 100
weekly) adds ~8,850 a year, so about 4-5 years; typical use (~50 a week) takes 15+ years.
Past the limit, every save throws. The app already showed a lasting warning, but it blamed
"a full device", and nothing in the app can free space.

- **1a — applied.** `lib/store/use-app-store.ts` now shows a one-time warning per launch once
  everything the site stores passes `STORAGE_WARNING_CHARS` (4,000,000, `lib/core/constants.ts`;
  all keys together since the PR review, see below), asking for
  a backup while one still captures everything. When a save fails with `QuotaExceededError`,
  the message now says the browser's storage for the app is full; other failures still mention
  private browsing. Verified on a production build in headless Chromium: seeding 4,284,739
  characters and completing a task shows the warning (and no failure message); filling the rest
  of storage exactly and completing another shows the new "full" message.
- **1b — deferred.** Making room for growth changes the saved and backup format: a compact log
  (schema v2 with a migration; `batchId` is only needed for undo, so roughly 9 times the room)
  or IndexedDB, most naturally together with Supabase sync. Recorded in `docs/roadmap.md` →
  Future additions, with the numbers above. Old backups must keep importing.

#### 2. The copy kept before an import — applied
`components/app/settings-screen.tsx` saves the data being replaced to
`sincewhen:before-import` on every import, for recovery by hand, and never removes it. It was
indented (1.29 times the saved size) in the same storage the app needs. It is now written with
`buildCompactBackupText` (`lib/backup/backup.ts`), 23% smaller and still readable as a
backup (new test: it round-trips through `readBackupText`). Whether it should expire is a
product question and was not changed.

#### Follow-up from the PR review (2026-09-27)
- **The warning counted only the saved data.** The pre-import copy shares the same storage, so
  after one import the real total was about twice what the warning saw. `warnIfStorageNearlyFull`
  (`lib/store/use-app-store.ts`) now totals every key and runs after the main save and after the
  copy is written. Verified: 2,264,310 characters of data plus a 2,264,251-character copy now
  warns; reading the other keys costs about 0.02 ms per save.
- **An import went ahead when the copy could not be saved.** With storage nearly full, the copy
  fails while the main save (which replaces a value of about the same size) succeeds, so the old
  tasks were gone with no copy. The import now stops unless the device is empty or a backup file
  was saved today, and says to save one first; saving a file needs no storage, so it is never a
  dead end. Verified in all three cases on a production build.

#### 3. The Due tab renders every row — no action
`components/app/due-screen.tsx` maps every item that wants attention to a row. The large
shape produced 490 rows, computed in 5.3 ms; the DOM cost on a phone was not measured.
Revisit if normal use reaches ~300 or more rows on the Due tab.

### Coverage record

- **`lib/core`:** the tree index (Map lookups, built once per change to the nodes and memoized
  in `useTreeIndex`), status, summary (one walk shared by room colors and the Due tab),
  operations, complete and undo, placement, validate. All O(n) or O(n log n); timed above.
- **Store:** the whole state is stringified and written on every change (3.3 ms at 2.6 million
  characters). Fine at any size that fits in storage.
- **Screens:** Due, Folders and room screens, Settings, the move/duplicate sheet (placement
  list, 0.08 ms), and the app shell's badge count. All read the memoized index.
- **Bundle:** no data set ships to the client (the examples are 4 KB of source). Total client
  JavaScript is fixed-size and belongs to `/pagespeed`.
- **Server and database checks** (pagination, row caps, N+1, indexes): there is no server
  and no database.

### Gates

Before and after each batch: `pnpm typecheck` ✓, `pnpm lint` ✓, `pnpm test` 142 → 143 ✓,
`pnpm build` ✓.
