<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Sincewhen

Recurring tasks that come due based on when they were last completed, organised as
locations > rooms > tasks > sub-tasks. Client-only for now: data lives on the device.

## Read first

- `docs/plan.md` — the design and the reason behind each decision. Read before touching the data
  model, due-date logic or completion rules.
- `docs/pitfalls.md` — traps already hit. **Add an entry whenever you hit a new one.**
- `docs/roadmap.md` — phase checklists and future additions. Tick items as they land.
- `docs/pwa.md` — install steps and alternatives.

## Rules

- Never `git commit` or `git push`. Leave changes in the working tree for Zack to review.
- One branch and one PR per roadmap phase.
- `lib/core` is pure functions: no React, no store, no `window`. Everything in it has tests.
- Dates are local calendar dates (`YYYY-MM-DD`). Never call `new Date()` on a bare date string;
  use the helpers in `lib/core`.
- Never edit `components/ui/*`. Wrap or re-theme instead, so shadcn updates stay safe.
- Tunable thresholds (status, room colour, depth limit) live in one constants file.
- Keep explanatory "why" comments; write so the purpose is obvious on first read.

## Commands

`pnpm dev` · `pnpm test` · `pnpm typecheck` · `pnpm lint` · `pnpm build`
