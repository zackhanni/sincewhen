# Sincewhen — pitfalls

Traps already hit, or known in advance. Add an entry the moment you hit a new one: what
happened, why, and what to do instead. Keep entries even after the fix ships — the point is that
the next person does not rediscover them.

## Platform

### Safari deletes local data after 7 days without a visit
Safari's tracking prevention wipes script-written storage (localStorage, IndexedDB) for a site
that has not been visited in 7 days. A PWA installed to the home screen is exempt. The app must
be installed, should call `navigator.storage.persist()`, and should nudge the user to back up.

### An installed PWA does not share storage with Safari
On iOS the home-screen app and Safari have separate storage. A link sent by text opens in
Safari, so a "tap this link to import your data" flow imports into the wrong place. Import must
happen inside the app with a file picker.

### `sms:` links cannot attach a file
Use the Web Share API (`navigator.share({ files })`) to open the share sheet instead. Check
`navigator.canShare({ files })` first and fall back to a plain download.

## Dates

### A month is not a day count
"Every 2 months" computed as 60 days drifts and is wrong on most dates. Use date-fns
`addMonths` / `addYears` on the last-completed date.

### Store calendar dates, not instants
`lastCompleted` is `YYYY-MM-DD` in the user's local time. `new Date("2026-03-01")` parses as UTC
midnight, which is the previous day in US timezones — always parse and format through the helpers
in `lib/core`, never with the `Date` constructor on a bare date string.

### A `YYYY-MM-DD` regex is a shape check, not a validity check
It accepts `2026-02-30`, which `Date` silently rolls to March 2. Validate by constructing the
date and reading the parts back.

## Data

### Fractional-indexing keys must be compared with `<`, never `localeCompare`
The keys are case-sensitive base-62 ("Zz" sorts before "a0"). `localeCompare` ignores case in
many locales and scrambles the order. Use `compareSortOrder` from `lib/core`.

### A made-up sort key is rejected
`generateKeyBetween` validates the keys it is given. A hand-written key such as `"a0000"` looks
plausible but is invalid (a key may not end in the zero digit) and throws. In tests and seed
data, generate keys with `generateKeyBetween(previousKey, null)`.

### The order of the `nodes` array means nothing
Display order comes from `sortOrder` and from urgency. Operations append to the array and
`getDescendants` walks depth-first, so array order is arbitrary. Always read children through
`buildTreeIndex` / `getChildViews`.

### A task completed today must stay green
A daily task is always "due within 1 day". Without the `progress > 0` guard in `status.ts` it
turns yellow the instant it is checked off.

## State and UI

### Render nothing until the store has loaded
The store starts with empty data and loads from the device in an effect (`skipHydration`),
because the server has no device storage and the first client render must match it. Anything
rendered before `hasHydrated` is true sees zero tasks. `AppShell` gates the page on it.

### Unreadable saved data must not look like "no data"
If loading fails and the app carries on with the empty default, the next save overwrites the
user's tasks for good. `merge` in `app-store.ts` parks the raw text under a backup key and sets
`loadError`. Keep that path, and keep the banner that shows it.

### `{ ...node, ...edit }` with an undefined value erases the field
An optional form field that is present-but-undefined wipes the stored value when spread.
`updateNode` strips undefined keys; "not provided" means "leave it alone".

### A hidden form control still validates, and still submits
Do not rely on a hidden field's validator being skipped: the value stays in form state after the
control unmounts, so a bad value in a hidden "count" field could block saving a folder. (Not
proven either way against TanStack Form; guarded regardless.) The validators in `node-form.tsx`
check whether the field currently applies. Likewise the form omits `lastCompleted` for a folder rather than
sending null, so turning a task into a folder cannot wipe its history.

### "Today" goes stale in an app that is never reloaded
A phone app is resumed, not reloaded. `useToday` re-reads the date on focus / visibility change;
do not cache `todayCalendarDate()` at module level.

### Tailwind cannot see class names built from pieces
`border-${colour}-500` is never generated. `lib/status-styles.ts` writes every class in full.

## Tooling

### `shadcn init` wrote a self-referencing font variable
It set `--font-sans: var(--font-sans)` in `globals.css`, which resolves to nothing, so the whole
app silently fell back to a serif font. It must point at the variable `next/font` defines:
`--font-sans: var(--font-geist-sans)`. Only a screenshot revealed it — typecheck, lint and tests
were all green.

### Remove shadcn components you do not use
`shadcn add` is cheap, so unused files pile up. Six were added and deleted in Phase 3. Native
`<select>` and `<input type="date">` are used on purpose: on a phone they open the system
pickers, which beat any custom dropdown.

### Vitest config must be `vitest.config.mts`
`package.json` has no `"type": "module"`, so a `.ts` config is loaded as CommonJS and Vite warns
that this stops working in a future major. With `.mts`, `__dirname` does not exist; use
`import.meta.dirname`.

### This Next.js version differs from older documentation
`AGENTS.md` carries a block generated by `next dev` pointing at the bundled docs in
`node_modules/next/dist/docs/`. Read the relevant guide there before using a Next.js API. The
block is re-created if removed, so keep it committed.

### shadcn was initialised with the `base-nova` style (Base UI, not Radix)
Components in `components/ui` are built on Base UI. Most online shadcn examples assume Radix:
`asChild` does not exist here (Base UI uses a `render` prop), and some part names differ. Check
the generated component file before copying an example. Do not edit `components/ui/*` directly;
wrap or re-theme so shadcn updates stay safe.
