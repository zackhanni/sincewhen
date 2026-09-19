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
type Node = {
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
- A **completion log** (`{ nodeId, date }[]`) is kept alongside the nodes. It powers undo now
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
- When every child task of a parent has been completed in the parent's current cycle, the
  **parent auto-completes**, so it does not stay red after the work was done piecemeal.
- Every completion shows an undo toast.

## Navigation

- **Drill-in**, not nested accordions: tap a room to open its own screen with a breadcrumb.
  Nested accordions lose too much width to indentation by the third level on a phone.
- Within a screen, tasks are listed above sub-rooms.
- A **Due** tab is the home screen: a flat list of everything overdue or due soon, with the room
  path shown. It filters by the active location, or all locations.
- A location switcher in the header changes the active location.

## Storage and backup

- v1 stores everything on the device through a zustand store with `persist`, a `schemaVersion`
  and a migration hook. Storage sits behind a small interface so a Supabase implementation can
  replace it in one file.
- **The app must be an installed PWA.** Safari deletes script-written storage after 7 days
  without a visit; a home-screen PWA is exempt. See [pwa.md](pwa.md).
- Export is a JSON file, offered both as a download and through the Web Share API
  (`navigator.share({ files })`), which opens the share sheet — that is the "text it to myself"
  feature, with no backend.
- Import is an in-app file picker, validated with zod, with a preview and a confirmation before
  replacing data. **A texted import link does not work**: an installed PWA has separate storage
  from Safari, and a link opens Safari.

## Stack

Next.js (App Router), TypeScript, Tailwind, shadcn, zustand, zod, date-fns, fractional-indexing,
Vitest, Serwist (PWA). Everything runs client-side.

**Why zustand and not TanStack Query for v1:** Query is a server-state cache (fetch, cache,
invalidate, retry) and v1 has no server. Wrapping localStorage in queries would add async states
and invalidation with nothing to gain. When Supabase sync arrives, Query is the right tool for
that layer; the core logic in `lib/core` is pure functions that do not depend on the store, so
the swap stays contained.
