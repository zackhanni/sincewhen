# PageSpeed & Lighthouse Audit — Sincewhen

> skill: pagespeed v2.0.8 @ 9b1d458+dirty · mode: linked · repo: sincewhen
>
> Every number below is from a run made for this report: Lighthouse 12, mobile preset (simulated
> throttling), on a local production build (`pnpm build && pnpm start`) of branch `skill-pass`,
> 2 warmup loads, median of 3 runs unless stated. Noise floor: ±5 perf points, ±10% LCP.

## Round 1 — 2026-09-27 — scope: Standard + tasks-loaded sweep

### Scoreboard (mobile)

| Page | Tier | Perf | A11y | BP | SEO | LCP | CLS | TBT |
| ---- | ---- | ---- | ---- | -- | --- | --- | --- | --- |
| `/about` | 1 | 94 → **99** | 100 | 100 | 100 | 3.10 s → **2.26 s** | 0 | 14 → 10 ms |
| `/rooms` | 2 | 87 → 89 | 100 | 100 | 100 | 4.14 s → 3.84 s | 0 | 34 → 32 ms |
| `/due` | 2 | 87 → 89 | 100 | 100 | 100 | 4.07 s → 3.76 s | 0 | 7 → 16 ms |
| `/settings` | 2 | 90 → 91 | 100 | 100 | 100 | 3.61 s → 3.46 s | 0 | 7 → 20 ms |

`/about` after is the median of 5 runs. The app pages' changes are cumulative and each step was
inside the noise floor (the runs agreed within a few ms, so the direction is real but small).
Those tier-2 runs measure the **empty** app, whose first launch shows the intro.

**With tasks loaded** (the 19 example items), 1 run each: accessibility and best-practices audits
don't depend on timing, so one run is valid. `/rooms`, `/due`, a room (Kitchen) and a task with
sub-tasks, each in light and in dark: **a11y 100 · BP 100 · SEO 100 on all 8**. The final
screenshots show the tasks and the dark theme, including a severe (red) row. The a11y 96
recorded on 2026-09-24 (contrast on the pale-red row and room badges) no longer reproduces.

**Console** (`console-check.mjs`): 0 errors, 0 warnings on all 4 pages, both on the live site
(which serves `main`, 8370aa7, without this branch's CSP) and on the local build (with the CSP).

**Field data** (PSI, live `/about`): CrUX has **no data** at URL or origin level, because the site
has too little traffic. That means unmeasured, not passing. PSI's own lab run: perf 96,
a11y 100, BP 100, SEO 100 (a single run on Google's hardware; not comparable to the local runs).

### Diagnosis

- **`/about`:** the largest paint is the hero screenshot. It was `loading="lazy"` with a high fetch
  priority, a deliberate choice so that only the visible light or dark twin downloads. A lazy
  image is requested only after layout, so both `lcp-lazy-loaded` and `lcp-discovery-insight`
  failed. The page also loaded zod before its first paint (83 KB), only because the root layout's
  display-settings check used zod for three fields.
- **App pages:** the largest paint is text that renders only once JavaScript runs and the saved
  data has loaded. That is by design (`docs/pitfalls.md` → "Render nothing until the store has
  loaded"). Every script (~355 KB) is requested before it, so less JavaScript is the only lever.
- **Every page:** the Geist Mono font was declared and preloaded at high priority on every page,
  though nothing uses a monospace font.

### Applied (verified)

| Change | Before → after | Verified |
| ------ | -------------- | -------- |
| Dropped Geist Mono (`app/layout.tsx`, `app/globals.css`) | one font preload fewer on every page; LCP −4% on `/rooms` and `/due` (inside the noise floor, kept as independently correct) | typecheck · lint · test · build |
| Display settings checked without zod (`lib/display/display-settings.ts`) | `/about` perf 94 → 96, LCP 3.08 → 2.69 s (−12.6%). Zod now loads at 70 ms, after the first paint at 56 ms, as the "Open the app" link's prefetch. App pages −4% more LCP (inside noise). New test: only the exact words are accepted, as the zod enums did | typecheck · lint · test (145) · build |
| Hero screenshot pair `loading="eager"` (`app/(marketing)/about/page.tsx`) | `/about` perf 96 → **99**, LCP 2.69 → **2.26 s** (−16%, median of 5). Both LCP audits pass. Cost: the hidden theme twin downloads too (13 KB, requested alongside at 14 ms) | typecheck · lint · test · build |

### Reverted

None.

### Needs a decision

| Idea | Trade-off | Measured cost today | Options |
| ---- | --------- | ------------------- | ------- |
| zod → `zod/mini` in `lib/core` | The largest chunk (120 KB transfer, zod plus app code) is on every app page's critical path. `zod/mini` is much smaller, but its API differs, and its default error messages need `z.config(z.locales.en())`, or a bad import shows zod's generic wording (no test asserts that wording today) | app pages 89–91, LCP 3.5–3.8 s | (a) leave; (b) migrate `lib/core/types.ts` and re-check every import message |
| Load the add/edit sheet only when opened | The Base UI dialog/drawer chunk (44 KB) loads before first paint on app pages; the intro needs the dialog on first launch anyway | not measured separately | (a) leave; (b) `next/dynamic` for `NodeSheet` only, then measure |

### Budgets (proposed, from these numbers)

| Metric | `/about` | App pages |
| ------ | -------- | --------- |
| Performance | ≥ 94 | ≥ 84 |
| Accessibility / BP / SEO | 100 | 100 |
| LCP | ≤ 2.48 s | ≤ 4.2 s |
| CLS | ≤ 0.05 | ≤ 0.05 |

### Deliberately out of scope

- `/` — only redirects in the browser (to `/rooms` or `/due`); nothing of its own to measure.
- Desktop preset — not run this round.
- Rendering app pages before saved data loads — a design decision, not a performance fix.
- Field data — none exists yet; re-check once the site has traffic.
- INP — Lighthouse measures load only; not probed.
- Security headers and CSP are covered in `docs/security-audit.md`.

### How to reproduce

```bash
pnpm build
pnpm start -p 3471 &
for i in $(seq 60); do curl -sf -o /dev/null http://127.0.0.1:3471/about && break; sleep 1; done
curl -sf -o /dev/null http://127.0.0.1:3471/about || echo "nothing answers on :3471 after 60s"
export CHROME_PATH="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
node scripts/pagespeed/lh-run.mjs --preset=mobile --runs=3            # empty app, 4 pages
node scripts/pagespeed/console-check.mjs --deployed                     # needs Playwright
# With tasks loaded: see the header of scripts/pagespeed/seed-profile.mjs (needs Playwright).
# Field data needs a PSI key; psi.mjs reads it from the current folder's .env.local.
```

### History

| Date | Round | What changed | `/about` perf | `/about` LCP |
| ---- | ----- | ------------ | ------------- | ------------ |
| 2026-09-27 | baseline | — | 94 | 3.10 s |
| 2026-09-27 | 1 | Geist Mono dropped | 94 | 3.08 s |
| 2026-09-27 | 1 | display settings without zod | 96 | 2.69 s |
| 2026-09-27 | 1 | hero screenshot eager | 99 | 2.26 s |
