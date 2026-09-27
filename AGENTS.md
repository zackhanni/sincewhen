<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Sincewhen

Recurring tasks that come due based on when they were last completed, organized as
locations > rooms > tasks > sub-tasks. Client-only for now: data lives on the device.

## Read first

- `docs/plan.md` — the design and the reason behind each decision. Read before touching the data
  model, due-date logic or completion rules.
- `docs/pitfalls.md` — traps already hit. **Add an entry whenever you hit a new one.**
- `docs/roadmap.md` — phase checklists and future additions. Tick items as they land.
- `docs/pwa.md` — install steps and alternatives.
- `docs/landing-page.md` — the promotional page at `/about`: where its copy lives, how its
  screenshots are made, and its open questions.
- `docs/security-audit.md` — security review rounds: what was found, fixed or declined, and why
  the Content-Security-Policy has the shape it does.
- `docs/scaling-and-algorithm-audit.md` — measured costs at realistic sizes, and the storage
  limit the completion log grows toward.
- `docs/pagespeed-audit.md` — Lighthouse numbers per page (empty and with tasks, light and dark),
  what moved them, and how to re-measure (`scripts/pagespeed/`, targets in `pagespeed-targets.json`).
- `docs/seo.md` — what search engines may index (only `/about`) and why, its structured data and
  share image, and what was deliberately left out.
- `docs/readability-review.md` — review rounds, the words the code uses for folder / room /
  location / item, and small duplication deliberately left alone.
- `docs/portfolio-writeup.md` — public-facing copy (portfolio entry, Reddit post) and the
  domain-move checklist. Keep its numbers (tests, review findings) true when they change.

## Rules

- Never `git commit` or `git push`. Leave changes in the working tree for Zack to review.
- One branch and one PR per roadmap phase.
- `lib/core` is pure functions: no React, no store, no `window`. Everything in it has tests.
- Dates are local calendar dates (`YYYY-MM-DD`). Never call `new Date()` on a bare date string;
  use the helpers in `lib/core`.
- Never edit `components/ui/*`. Wrap or re-theme instead, so shadcn updates stay safe.
- Tunable thresholds (status, room color, depth limit, unit conversion) live in one constants file.
- The app's address is `SITE_URL` in `lib/site.ts`. Never hard-code it, and never link the
  retired `sincewhen-ruby.vercel.app`.
- Keep explanatory "why" comments; write so the purpose is obvious on first read.

## Commands

`pnpm dev` · `pnpm test` · `pnpm typecheck` · `pnpm lint` · `pnpm build`
