# Sincewhen — design

The decisions behind the app and the reason for each one. Read this before changing the data
model or the due-date logic. Phase checklists live in [roadmap.md](roadmap.md); traps we have
already hit live in [pitfalls.md](pitfalls.md).

## What the app does

You give a task a name and a frequency ("change the air filter", every 2 months). The task comes
due that long after you **last completed it**, and stays at the top of its list until you
acknowledge it. It is not a calendar reminder: if you complete a 2-month task three weeks late,
the next due date is 2 months after the day you actually did it.

Tasks are organised like folders: locations (Home, Work, a parent's house) contain rooms, rooms
can contain sub-rooms, and any task can be broken into sub-tasks.

## Data model

One flat list of nodes, each pointing at its parent. Not nested JSON.

```ts
type TaskNode = {   // not `Node`: that name is already a DOM global
  id: string
  parentId: string | null        // null = a top-level location
  name: string
  frequency: { count: number; unit: "day" | "week" | "month" | "year" } | null
  lastCompleted: string | null   // local calendar date "YYYY-MM-DD", never an instant
  createdAt: string              // local calendar date
  sortOrder: string              // fractional-indexing key
}
```

- **A node with a frequency is a task** and can be checked off. **A node without one is a
  folder** and cannot. There is no separate "room" type — any node can hold children, which is
  what lets a task like "clean the bathroom" be broken into sub-tasks.
- **Why flat:** moving a node is one field change, duplicating is a subtree copy, and each node
  maps 1:1 to a row in a future Supabase `nodes` table. The tree is built in memory by a
  selector.
- **Depth limit: 5 levels**, enforced on create and on move.
- **`sortOrder` is a fractional-indexing string from day one** so that adding drag-to-reorder
  later needs no migration, and a reorder writes one row instead of renumbering siblings.
  Manual order applies to locations, to folders (as the tie-break after colour score) and to
  sub-tasks. It does **not** apply to tasks in a room: those always sort by urgency, which is
  the core feature.
- A **completion log** (`{ nodeId, date, batchId }[]`) is kept alongside the nodes. It powers undo now
  and history / "you usually do this every 70 days" later.

## Dates

- Dates are stored as local calendar dates (`YYYY-MM-DD`), not timestamps. A timestamp shifts
  across midnight when the timezone changes and produces off-by-one due dates.
- Due dates use calendar arithmetic: `dueDate = addMonths(lastCompleted, 2)`. "2 months" is not
  60 days. A day-count threshold cannot express a calendar interval.
- A new task asks for "last done": today (default), a picked date, or never (due immediately).

## Task status and sorting

`progress = elapsed days / interval days`, where the interval is the real number of days between
`lastCompleted` and the due date.

| Status | Rule |
| --- | --- |
| green | progress < 0.8 |
| yellow | progress 0.8–1.0, or due within 1 day, whichever window is larger |
| red | progress >= 1.0 (overdue) |
| severe (red border + "!") | overdue by >= 50% of the interval, and by at least 3 days |

Tasks sort by progress, highest first. A ratio is used rather than raw days overdue because a
daily task 2 days late is worse than an air filter 5 days late. All thresholds are constants in
one file so they can be tuned without touching logic.

## Room colour

Based on a **count** of overdue items, not a percentage — a room with 1 of 1 overdue should not
look worse than a room with 3 of 10 overdue.

- The count covers all descendants, not only direct children.
- A severe item counts as 2.
- An overdue task that has sub-tasks counts as 1; its sub-tasks are not added on top.
- score 0 and nothing due soon = green; score 0 but something due soon = yellow; 1–2 = orange;
  3–5 = red; 6+ = dark red. Any severe item forces at least red.
- The badge shows the raw overdue count.

## Completing tasks

- Completing a parent task **cascades only to children that are due or due soon**. A yearly
  "regrout" inside a monthly "clean the bathroom" must not be reset by the monthly completion.
- A parent task **auto-completes** when it wants attention and, after a completion, nothing
  inside it wants attention any more — so it does not stay red after the work was done
  piecemeal. Sub-tasks that were not due do not block this (the same "regrout" reason), folders
  between the parent and the sub-task are stepped over, and the rule repeats up the tree.
- Every completion shows an undo toast. Undo restores only the nodes that completion touched
  (found by a shared `batchId` in the completion log), so other edits made meanwhile survive. A
  node completed again since is left alone. `batchId` uniqueness is the store's job (it passes a
  fresh UUID); core does not check it.
- Turning a task into a folder keeps its `lastCompleted`, so switching it back loses nothing.
- Duplicating a branch can either keep the last-completed dates or reset the copies to
  "never done"; the UI should ask when copying into a different room.

## Navigation

- **Drill-in**, not nested accordions: tap a room to open its own screen with a breadcrumb.
  Nested accordions lose too much width to indentation by the third level on a phone.
- The item id is a query parameter (`/rooms?id=…`, built by `roomHref`), not a path segment, so
  every route is static and one cached `/rooms` page serves every item offline.
- Within a screen, tasks are listed above sub-rooms.
- A **Due** tab is the home screen: a flat list of everything overdue or due soon, with the room
  path shown. It filters by the active location, or all locations. An overdue task hides its
  own sub-tasks here, exactly as it does in the room count, so a room's badge always equals the
  number of overdue rows the Due tab shows for it (both come from one function).
- Location filter chips on the Due tab choose the active location (or all). They appear only
  once there are two locations. The Rooms tab always lists every location.
- Every item has the same screen (`/rooms?id=…`): a room lists its tasks and sub-rooms, a task
  lists its sub-tasks. Tapping a row opens it; the check circle completes it; the ⋮ button opens
  the options sheet.

## Storage and backup

- v1 stores everything on the device through a zustand store with `persist`, a `schemaVersion`
  and a migration hook. `createAppStore(storage)` takes any zustand `StateStorage` (sync or
  async), which is the seam a Supabase implementation plugs into.
- Saved data is never trusted: it passes `parseAppData` on load. If it cannot be read, the raw
  text is copied to `sincewhen:unreadable-backup` and the app shows a banner, instead of
  starting empty and overwriting the user's tasks on the next save. The banner stays on later
  launches for as long as that copy exists; Settings can save it or discard it.
- A save that fails (private browsing, full device) raises one persistent warning toast.
- **The app must be an installed PWA.** Safari deletes script-written storage after 7 days
  without a visit; a home-screen PWA is exempt. See [pwa.md](pwa.md).
- Export is a JSON file, offered both as a download and through the Web Share API
  (`navigator.share({ files })`), which opens the share sheet — that is the "text it to myself"
  feature, with no backend.
- Exporting records `lastBackupDate`. Once there is data and the last backup is 30+ days old (or
  there has never been one), the Due tab shows a nudge linking to Settings.
- Import is an in-app file picker, validated by the same `parseAppData` used on load, with a
  preview (counts and export date) and a confirmation before replacing data. The data being
  replaced is first copied to `sincewhen:before-import` so a wrong import can be recovered by hand.
- Settings also offers the raw text kept under `sincewhen:unreadable-backup`, if there is any. **A texted import link does not work**: an installed PWA has separate storage
  from Safari, and a link opens Safari.

## Offline

`public/sw.js` is a small hand-written service worker rather than Serwist: the app is two static
pages and needs three caching rules, which is easier to read and debug than a generated worker.
On install it caches both pages and every build file their HTML refers to, so the very first
offline launch works. Pages are network-first (a deploy shows up on next launch), hashed build
files are cache-first. It registers in production only. `lib/pwa/pwa.ts` holds registration,
the persistent-storage request, the icon badge and the installed check.

## Code layout

`lib/core` holds all the rules as pure functions with tests: `dates`, `status`, `tree`,
`summary` (room colour, display order, Due list), `operations` (add / edit / move / duplicate /
delete), `complete`, `validate`. Import from `@/lib/core` only. Each operation takes the saved
data and returns a new copy; a refused operation throws a `CoreError` with a `code`.

`lib/store` wraps core in a zustand store (`app-store.ts` is framework-free and tested;
`use-app-store.ts` binds it to React and localStorage). `components/app` holds the screens:
`app-shell` (loading, tab bar), `due-screen`, `node-screen`, `node-row`, and one shared bottom
sheet (`node-sheet` + `sheet-context`) that shows the menu, the add / edit form (`node-form`,
TanStack Form), the move / duplicate picker or the delete prompt. `settings-screen` handles
backup and restore, with the file logic in `lib/backup` (`backup.ts` is pure and tested;
`send-file.ts` is the browser share / download code).

## Stack

Next.js (App Router), TypeScript, Tailwind, shadcn, zustand, zod, date-fns, fractional-indexing,
Vitest, TanStack Form for the add / edit form. Everything runs client-side.

**Why zustand and not TanStack Query for v1:** Query is a server-state cache (fetch, cache,
invalidate, retry) and v1 has no server. Wrapping localStorage in queries would add async states
and invalidation with nothing to gain. When Supabase sync arrives, Query is the right tool for
that layer; the core logic in `lib/core` is pure functions that do not depend on the store, so
the swap stays contained.
