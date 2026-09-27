# Sincewhen — changelog

Finished work, newest first. How things work now is in [plan.md](plan.md); traps are in
[pitfalls.md](pitfalls.md); open work is in [roadmap.md](roadmap.md).

## 2026-09-27 — Skill pass: security, scaling, readability, page speed, SEO, docs (PR #8)

**What:** one pass of the shared audit skills over the whole app, each with its own report:
[security-audit.md](security-audit.md) (security headers, a static Content-Security-Policy,
backup import size cap), [scaling-and-algorithm-audit.md](scaling-and-algorithm-audit.md)
(storage warning across all keys, compact pre-import copy, import stops without a safety copy),
[readability-review.md](readability-review.md) (stale comments, renames, nested ternaries, two
bugs: a stuck Due filter after a move, and plurals in Settings),
[pagespeed-audit.md](pagespeed-audit.md) (`/about` 94 → 99; accessibility 100 with tasks loaded,
light and dark), [seo.md](seo.md) (only `/about` indexed, sitemap, robots, structured data,
share image). Then this docs condense: the changelog, and two tiers in pitfalls.md.
**Why:** before the public launch.
**Pitfalls / don't redo:** "zod logs a CSP violation on every page unless it is imported through
`lib/core/zod.ts`", "The browser's storage for the app is about 5.24 million characters, shared
by every key", "A lazy image is requested only after layout, so the largest image on a page must
be eager", "State that points at a node must be re-checked on every change to that node, not
only delete".

## 2026-09-26 — Launch prep round 2 and the landing page (PR #7)

**What:** the top of the tree is "Sincewhen" and the tab "Folders"; wide-screen grid; theme
(Match device / Light / Dark) and size (Default / Large); "Open the app on" Folders or Due, with
`/` as a launcher and the Due tab at `/due`; display settings in backups; unit conversion when
editing; shared install steps; first-launch intro and "Start with examples"; desktop QR code;
version in Settings; back button and iPhone edge swipe; first backup nudge after a week;
small-text contrast with tasks loaded (accessibility 96 → 100); the landing page at `/about`
([landing-page.md](landing-page.md)); American spelling throughout; `SITE_URL` in `lib/site.ts`
and the old address retired behind a permanent 308. All of it is described in
[plan.md](plan.md).
**Why:** Zack's launch checklist after a week of real use.
**Pitfalls / don't redo:** "A rounded conversion can be a different schedule wearing the same
label", "Dated examples must work on every day, not just today", "`/` is a launcher, not the Due
tab", "The old address keeps its own data", "An empty app passes contrast checks that a used one
fails", "A color that passes in light mode can fail in dark".

## 2026-09-24 — Custom domain and portfolio write-up (PR #6)

**What:** the app went live at `sincewhen.webwizarddev.com` (a Vercel setting; the old address
kept serving until PR #7 retired it), and [portfolio-writeup.md](portfolio-writeup.md) holds the
portfolio entry and the Reddit draft.
**Pitfalls / don't redo:** "The old address keeps its own data".

## 2026-09-19 — v1: core, store, screens, PWA, backup (PRs #1–#5)

**What:** Phase 0 scaffold; Phase 1 core logic in `lib/core`, test-first (dates, status, room
score, sorting, tree operations, completion with cascade, auto-complete and undo); Phase 2 the
zustand store with `persist`, `schemaVersion` and a swappable `StateStorage`; Phase 3 the
screens (drill-in folders, Due tab, item sheet, add / edit form, undo toast); Phase 4 the PWA
(manifest, icons, hand-written `public/sw.js`, persistent storage, install hint, icon badge);
Phase 5 backup (file and share-sheet export, validated import with preview, backup nudge);
then fixes from the first review round (#5).
**Pitfalls / don't redo:** "One invalid node poisons the whole saved file", "Unreadable saved
data must not look like \"no data\"", "The first offline launch has HTML but no JavaScript,
unless install caches it", "A fixed cache name grows forever", "CodeRabbit silently skips
stacked PRs, and its check still says \"pass\"".
