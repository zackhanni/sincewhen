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

### A dynamic route cannot be cached as one offline page
`/rooms/[id]` renders per id on the server, so there is no single page to cache, and a copy
cached for one id may carry that id in its embedded route data (not tested; avoided instead). The id is a query parameter instead (`/rooms?id=…`), which
keeps the route static. Build links with `roomHref`, never by hand.

### The first offline launch has HTML but no JavaScript, unless install caches it
The page's scripts download before the service worker exists, so the worker never sees them.
`sw.js` reads each page's HTML on install and caches the `/_next/static/` files it names.
Tested by visiting only `/`, going offline, and opening `/rooms` for the first time.

### An offline test needs a control
Playwright's `setOffline` was checked with service workers blocked, where the load must fail. A
page that "works offline" may just be the browser's own HTTP cache.

### The service worker must not run in development
It would serve cached pages and hide the code you just changed. Registration is production-only.

### `useSearchParams` needs a Suspense boundary
Without one the production build fails, because the page can no longer be prerendered. Both
`app/rooms/page.tsx` and the `NodeSheet` in `app-shell.tsx` are wrapped.

### Stale `.next/types` after deleting a route
`tsc` reported a missing `app/rooms/[id]/page.js` after the folder was deleted. `pnpm build`
(or `pnpm dev`) regenerates the types; the error is not in the source.

A running `pnpm dev` keeps its own copy in `.next/dev/types`, and `tsc` and `pnpm build` read it
too. After routes moved into the `(app)` group, a dev server that was already running never
rewrote it, and the build failed on `app/rooms/page.js`. Restart the dev server after moving or
deleting a route (or move `.next/dev/types/validator.ts` aside; it is generated).

### A production server does not serve files added to `public/` after it started
`next start` reads `public/` once. Screenshots saved there afterwards answered 404, and
`next/image` reported "The requested resource isn't a valid image" (400). Restart the server.

### A page cannot tell whether a download was kept
`downloadTextFile` fires and forgets, so "Save backup file" marks the backup as done the moment
it starts. Sharing is different: `navigator.share` rejects with `AbortError` when the sheet is
closed, which `shareFile` treats as "not backed up", not as an error.

### `navigator.canShare` may refuse JSON
File-type support in the share sheet varies by browser. `makeShareableFile` tries
`application/json`, then `text/plain`, keeping the `.json` name. The import picker accepts both,
and reads the contents rather than trusting the type. Feature-detect; never assume sharing exists
(desktop browsers mostly lack it, and the button is hidden there).

### A new page must be added to the service worker
`/settings` had to be added to `PAGES` in `sw.js`. Forgetting means the page fails offline, with
no error during development.

### `/` is a launcher, not the Due tab
Installed icons open `start_url` (`/`), so `/` decides the start screen and replaces itself
with it. The Due tab lives at `/due`. A tab or link pointing at `/` would bounce the user to
whatever the start screen is instead of where they tapped. Link to `/due` or `/rooms`.

### A fixed cache name grows forever
`sw.js` does not change between deploys, so with a constant cache name `install` and `activate`
never re-ran and every deploy's hashed build files piled up in one cache until quota ran out. The
cache is now named after the build id passed in the registration URL. Also: `cache.put` rejects
when storage is full, so every write goes through `tryToCache` — a failed cache write must not
fail a request whose network fetch succeeded. (Found by CodeRabbit on PR #3.)

### Playwright's `waitForFunction` passes instantly on an async predicate
The returned Promise is truthy. A cache-upgrade check written that way "passed" while the old
cache was still there, under a log line claiming it was deleted. Poll from Node instead, and make
the script throw when the expected state never arrives.

### The old address keeps its own data
Browser storage belongs to one address. Moving from `sincewhen-ruby.vercel.app` to
`sincewhen.webwizarddev.com` started an empty app, and an installed home-screen icon keeps
opening the address it was installed from. `next.config.ts` redirects the old address. It was
a temporary 307 at first, so the old data stayed reachable by removing the rule. Since
2026-09-26 it is a permanent 308: the only data there (Zack's) was backed up and moved, and
the old address is retired. Browsers cache a permanent redirect, so from then on anything
saved at the old address is out of reach in that browser. Old addresses are listed in
`RETIRED_HOSTS` in `lib/site.ts`; never link to them.

### The icon badge needs notification permission on iOS
`navigator.setAppBadge` runs without error, but iOS shows a home-screen web app's badge only
after the user grants notification permission, which the app never asks for. Chrome on
Android has no Badging API support at all. Don't describe the badge as working until a phone
shows it (WebKit blog, 2023-02-16; MDN browser-compat-data).

### Brave on iPhone cannot install the app, and Safari moved the button
Brave on iPhone has no "Add to Home Screen", not even under Share, and it does not name itself
to the page, so it cannot be detected. On iOS 26 Safari's Share is inside the ••• menu, with "Add
to Home Screen" under View More. The old hint ("tap Share") was wrong in both. The steps now live
in one place (`install-steps.tsx`) and end with "Can't find it? Open this page in Safari".
(Zack, on his iPhone, 2026-09-26.)

### Do not ask for persistent storage on page load
Firefox answers `navigator.storage.persist()` with a permission prompt. It is now requested after
the user adds an item or restores a backup. (Found by CodeRabbit on PR #3.)

## Dates

### A month is not a day count
"Every 2 months" computed as 60 days drifts and is wrong on most dates. Use date-fns
`addMonths` / `addYears` on the last-completed date.

### Store calendar dates, not instants
`lastCompleted` is `YYYY-MM-DD` in the user's local time. `new Date("2026-03-01")` parses as UTC
midnight, which is the previous day in US timezones — always parse and format through the helpers
in `lib/core`, never with the `Date` constructor on a bare date string.

### Converting a frequency from its last conversion piles up rounding
Switching a saved "every 2 weeks" to days, then months, then weeks gave 14 days, 1 month, then 4
weeks: each step rounded the previous one. `node-form.tsx` now always converts from the saved
frequency, so going back to the original unit restores the original number.

### A rounded conversion can be a different schedule wearing the same label
Rounding to a bigger unit hides large errors: 8 months becomes "1 year" (50% off), 18 months
"2 years". Even the bounds check passed those. `convertFrequency` accepts a whole number only
within `CONVERSION_TOLERANCE` (5%) of the exact value; anything else asks the user. Months
never divide into days or weeks exactly, which is why there is a tolerance at all.

### Dated examples must work on every day, not just today
The examples are dated "N days ago", and whether 35 days ago is overdue for a monthly task
depends on how long the month was. `examples.test.ts` builds them for every day of two years
(one a leap year) and checks every color appears. It was seen to fail when one date was moved.

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

### One invalid node poisons the whole saved file
`parseAppData` rejects a file if any node fails the schema, so a single bad write (an empty name,
a frequency of 0, a duplicate id, a malformed sort key) turns every task into "unreadable data"
on the next launch. `addNode`, `updateNode` and `duplicateSubtree` therefore validate what they
are about to write and throw `INVALID_DATA` (copies included: an injected `newId` is untrusted
input too). Any new operation that creates or edits a node must
do the same. (Found by CodeRabbit on PR #1.)

### Undo must not rewind past a later completion
If a task is completed twice and the first toast's Undo is pressed, restoring the old date would
contradict the second completion still in the log. `undoCompletion` only restores a node whose
newest log entry belongs to the batch being undone. This relies on the log being in time order:
always append to `completions`, never sort or prepend.

### The order of the `nodes` array means nothing
Display order comes from `sortOrder` and from urgency. Operations append to the array and
`getDescendants` walks depth-first, so array order is arbitrary. Always read children through
`buildTreeIndex` / `getChildViews`.

### A task completed today must stay green
A daily task is always "due within 1 day". Without the `progress > 0` guard in `status.ts` it
turns yellow the instant it is checked off.

## Accessibility

### An empty app passes contrast checks that a used one fails
The colored rows and room badges only appear once tasks are overdue, so Lighthouse on a fresh
install scores 100 while the same screens with data scored 96: gray secondary text on a
long-neglected row's pale-red background (4.33:1) and white on the orange and red room badges
(about 2.8:1 and 3.8:1), all under the 4.5:1 minimum for small text. Fixed in
`lib/status-styles.ts` and `components/app/node-row.tsx`. Measure accessibility with made-up
tasks loaded (seed `localStorage["sincewhen"]` in a throwaway browser profile, then run
Lighthouse against that browser with `--disable-storage-reset`), including a long-overdue task
and rooms at every badge level.

### A color that passes in light mode can fail in dark
`text-yellow-700` is fine on a white card and unreadable on a near-black one. Every hard-coded
text color needs a `dark:` partner (see `lib/status-styles.ts`). Checked with axe-core in
Playwright on every screen in both themes and both sizes, with data covering every status and
room level; a control run with the old yellow on a dark card was flagged, so the zero is real.

## State and UI

### Render nothing until the store has loaded
The store starts with empty data and loads from the device in an effect (`skipHydration`),
because the server has no device storage and the first client render must match it. Anything
rendered before `hasHydrated` is true sees zero tasks. `AppShell` gates the page on it.

### Unreadable saved data must not look like "no data"
If loading fails and the app carries on with the empty default, the next save overwrites the
user's tasks for good. `merge` in `app-store.ts` parks the raw text under a backup key and sets
`loadError`. Keep that path, and keep the banner that shows it.

`loadError` alone is not enough: it lasts one session. Once the user adds a task, the next launch
loads cleanly, the banner would vanish, and the parked copy would be stranded. So the banner also
follows `hasUnreadableBackup`, which is read from the parked copy itself on every launch (derived,
not a second saved flag that could disagree). It clears only when the user discards the copy in
Settings. (Found by CodeRabbit on PR #2.)

### A failed save must be shown, not only logged
localStorage writes throw in private browsing and when the device is full. Logging to the console
left the app looking healthy while every change was lost. `use-app-store.ts` shows one persistent
toast per run of failures, and dismisses it by id when a save succeeds again — a warning that
never times out must be taken down by hand, or it keeps saying something untrue. (Found by
CodeRabbit on PR #2 and #5.)

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

### React's development remount wipes what the head script set on `<html>`
The script in `layout.tsx` sets the `dark` class and `data-size` before the first paint. In
development, Strict Mode remounts once and resets `<html>` to its JSX attributes, removing both.
`DisplaySettingsSync`, mounted by the root layout, re-applies them in a `useLayoutEffect`;
production does not need it but it is harmless. `<html>` also carries `suppressHydrationWarning`, because the server's HTML and the
page React finds differ on purpose. (From the Next.js guide "Preventing flash before hydration".)

### The intro covers every screen on a fresh launch
It opens on every page load until dismissed, and a modal makes the rest of the page unclickable.
A browser test that loads a page must seed `localStorage["sincewhen:intro-dismissed"] = "1"`, or
close the intro first. `page.goto` counts as a new launch; clicking a tab does not.

### Tailwind cannot see class names built from pieces
`border-${color}-500` is never generated. `lib/status-styles.ts` writes every class in full.

## Tooling

### CodeRabbit silently skips stacked PRs, and its check still says "pass"
It reviews only PRs whose base is the default branch. PRs #3-#5 reported "Review skipped: reviews
are disabled for this base branch" and #2 "Review rate limited" — all with a green check and zero
comments, which looks exactly like a clean review. Read the check's description, not its color.
A stacked PR gets reviewed only after the one below merges and it is retargeted; then comment
`@coderabbitai review`. The plan allows 3 reviews per hour, re-reviews included.

### A stale server makes a good build look broken
`pkill -f "next start --port N"` did not match the real process (it runs as `next-server`), so an
old server kept the port, the new one died with EADDRINUSE unnoticed, and every request returned
500 from a half-replaced build. Stop servers by port — `lsof -ti :3457 | xargs kill` — and check
who is answering before trusting a failure.

### `shadcn init` wrote a self-referencing font variable
It set `--font-sans: var(--font-sans)` in `globals.css`, which resolves to nothing, so the whole
app silently fell back to a serif font. It must point at the variable `next/font` defines:
`--font-sans: var(--font-geist-sans)`. Only a screenshot revealed it — typecheck, lint and tests
were all green.

### Preloading a light/dark image pair downloads both
`priority` (deprecated in Next.js 16 for `preload`) adds a preload link per image, so the hidden
theme's screenshot downloaded too: two preload links and both files, measured. Leave both
variants lazy (a hidden lazy image is never fetched) and give the visible one
`fetchPriority="high"`, as the Next.js image docs say under "Theme detection".

### `cn` from the `cn` package is the project's helper
`lib/utils.ts` is `export { cn } from "cn"`, and the shadcn CLI (base-nova style) writes
`import { cn } from "cn"` into every `components/ui` file. The package is a clsx +
tailwind-merge replacement: `cn("sm:max-w-sm", "sm:max-w-md")` gives `"sm:max-w-md"`. A review
suggested switching `dialog.tsx` to `@/lib/utils` as if they were different; they are not, and
the ui files must stay as generated.

### A link styled as a button needs `cn(buttonVariants(...))`
`buttonVariants` returns the base style's `border-transparent` and the outline style's
`border-border` together, and in the generated CSS the transparent one wins. A `<Link>` given
the bare string had no border in light mode and looked like plain text (the white background
matches the card). `Button` runs its classes through `cn`, which drops the losing one; a link
must do the same: `className={cn(buttonVariants({ variant: "outline" }))}`.

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

### A touch test that passes on the old code proves nothing
Checks for the swipe's second-finger and open-sheet cases passed against the code they were
meant to catch. Chrome DevTools' `Input.dispatchTouchEvent` did not produce the multi-finger
`touchend` (with the second finger in `changedTouches`) that the bug needs. Synthetic
`TouchEvent`s dispatched on `document`, with explicit `touches` and `changedTouches`, did: the
old code navigated, the fixed code stayed. Run a new gesture test against the old code once.

### Next.js will not start a second dev server in the same folder
`pnpm dev --port 3461` exited with "You can access the existing server at http://localhost:3001"
because Zack's own `pnpm dev` was already running. Find it with `lsof -ti :3001` and check its
folder (`lsof -a -p <pid> -d cwd`) before trusting it; it hot-reloads, so it serves the current
code. Do not stop someone else's server to start your own.

### shadcn was initialised with the `base-nova` style (Base UI, not Radix)
Components in `components/ui` are built on Base UI. Most online shadcn examples assume Radix:
`asChild` does not exist here (Base UI uses a `render` prop), and some part names differ. Check
the generated component file before copying an example. Do not edit `components/ui/*` directly;
wrap or re-theme so shadcn updates stay safe.
