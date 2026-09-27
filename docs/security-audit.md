# Security audit

> skill: security-audit v2.1.6 @ 9b1d458+dirty · mode: linked · repo: sincewhen
>
> Cumulative: each run adds a dated round. Earlier rounds record what was decided and why;
> do not re-file a declined finding unless something changed.

## Round 1 — 2026-09-26 — scope: whole repo

First audit, on branch `skill-pass` from `main` at 8370aa7 (PR #7 merged). Read-only review,
plus checks against a local production build and the live site. No active exploitation.

**Threat model.** Sincewhen is client-only: every task, date and completion lives in the
browser's localStorage for one address. There is no server code, no sign-in, no database, no
secrets and no CI. The asset is the user's own task list (personal, low sensitivity). The trust
boundaries are the backup file, which can arrive from anywhere through a share sheet, and
whatever sits in localStorage.

### Findings

| # | Finding | Class | Severity | Outcome |
|---|---|---|---|---|
| 1 | No security headers apart from HSTS | CWE-693 / OWASP A05 | Low | applied |
| 2 | No Content-Security-Policy | CWE-1021 / OWASP A05 | Low | applied |
| 3 | Backup import read a file of any size | CWE-770 | Low | applied |

#### 1. No security headers apart from HSTS — applied
The live site sent only `strict-transport-security` (Vercel's default). `next.config.ts` now
sends, on every response: `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`,
`Referrer-Policy: strict-origin-when-cross-origin` (full URLs carry item ids) and a
`Permissions-Policy` that switches off camera, microphone, location, payment and USB.
Framing was a small risk to begin with: a framed copy runs with partitioned storage in current
browsers, so it would show an empty app, not the user's tasks.

#### 2. No Content-Security-Policy — applied
No place was found where user data reaches HTML or script (see coverage), so the CSP is a
backstop. It is the static form: `script-src 'self' 'unsafe-inline'`, because every page is
prerendered and Next.js' bootstrap scripts and the theme script are inline. A nonce CSP was
rejected: it only works on pages rendered per request, which would end offline use (the
service worker caches the static pages). What the static form still gives: no script loads
from anywhere else; `connect-src`, `img-src` and `form-action` on `'self'` leave injected code no
fetch, beacon, image or form to send data to another site; `frame-ancestors 'none'`,
`object-src 'none'`, `base-uri 'self'`. It cannot stop a script navigating the page away with
data in the URL (no CSP can), so the real protection stays upstream: user text is rendered as
text. Development adds `'unsafe-eval'` for hot reload.

**Hashes instead of `'unsafe-inline'` — declined (PR review, 2026-09-27).** Next.js' inline
bootstrap scripts carry each page's data and change with every build, and `headers()` in
`next.config.ts` is read before the HTML exists. A hash CSP would need a second build pass or a
`proxy.ts` that runs on every request and reads a post-build manifest. For an app with no server
data and no path that renders user input as HTML, that cost buys little. Revisit if a feature
ever renders user-supplied HTML.

zod 4 probes `new Function` whenever a `z.object()` is created, which the CSP reports as a
violation on every page. zod is now imported only through `lib/core/zod.ts`, which sets
`jitless: true` first; an ESLint `no-restricted-imports` rule enforces that (a planted direct
import failed lint). Parsing behavior is unchanged: under the CSP, zod already fell back to
plain parsing in the browser. See `docs/pitfalls.md`.

Verified on a production build (`pnpm build && pnpm start`) in headless Chromium, with a
`securitypolicyviolation` listener on every page: 0 violations on `/`, `/about`, `/rooms`,
`/due`, `/settings`. The examples button and client navigation work (hydrated). The service
worker is active with 24 cached entries. "Save backup file" downloads, re-importing that file
shows the confirm step, and the theme script applies dark and large before React loads.
Framing is refused (`frame-ancestors 'none'`). The dev server (`pnpm dev`) was also checked:
0 violations, hydrated. Not checked: the share sheet (headless has none) and Safari/iOS.
Vercel's preview toolbar (`vercel.live`) will be blocked on preview deployments only.

#### 3. Backup import read a file of any size — applied
`components/app/settings-screen.tsx` read the picked file with `file.text()` and no size
check. Picking the wrong file (a video on an iPad; `accept` is only a hint) could freeze or
crash the page. Existing data was never at risk: import needs a confirm, and the data being
replaced is copied aside first. Import now refuses files over `MAX_BACKUP_FILE_BYTES` (10 MB,
`lib/core/constants.ts`) before reading them. Browsers keep about 5 MB per site, and a backup
file is 1.29 times the size of the saved data (measured: 599,152 characters saved, 770,775 in
the file), so no real backup comes near the cap. An 11 MB file was refused in the browser check.

### Not a security finding: production stopped deploying

Found during the live-header check. Every merge to `main` since 2026-09-24 deployed as
Preview; the last Production deployment is cf48a4b (2026-09-20). The live site has no `/about`
(404) and no 308 on the retired address. Tracked in `docs/roadmap.md` → "Next steps". The live
headers will only change once this is fixed.

### Coverage record

Everything below was triaged; the findings above are the only gaps.

- **Entry points:** 0 route handlers, 0 server actions, 0 webhooks, no middleware or proxy,
  0 database tables, no CI. So the checklist's auth, database, webhook, cron, CSRF and CI
  sections do not apply.
- **Inline script** (`app/layout.tsx`): `DISPLAY_SETTINGS_SCRIPT` is a constant; only
  `JSON.stringify`'d constants are put into it. No user data.
- **Links:** every `href` is a constant or `roomHref()`, which `encodeURIComponent`s the id
  into a same-site path. `?id=` is only used to look an item up.
- **Rendering:** item names are rendered as React text; toasts receive plain strings.
- **Saved data** (`lib/store/app-store.ts`): checked by `parseAppData` (zod + tree check) on
  load; unreadable data is parked, never overwritten; failed saves raise a lasting warning.
- **Backup import** (`lib/backup/backup.ts`): `JSON.parse`, then `parseAppData`, then display
  settings field by field; a confirm step; the replaced data is kept.
- **Service worker** (`public/sw.js`): same-site GET requests only; pages cached by path.
- **Build** (`next.config.ts`): `execFileSync("git", …)` with fixed arguments and no shell.
- **Public build values:** `NEXT_PUBLIC_BUILD_ID`, `_APP_VERSION`, `_COMMIT` are a build id, a
  date and a commit hash. Nothing secret exists to leak.
- **`access-control-allow-origin: *`:** Vercel's default on static files. No credentials and
  no user data on the server, so not a CORS finding.
- **Redirects:** matched on the retired host, with a fixed destination. Not an open redirect.
- **Third-party resources at runtime:** none (next/font self-hosts the fonts at build).

### Dependencies

`pnpm audit --prod` and `pnpm audit`: no known vulnerabilities (2026-09-26). `cn` (shadcn's
replacement for clsx + tailwind-merge) was checked because its name is short and old: npm
maintainer `shadcn`, repository `shadcn-ui/cn`, no install scripts. The npm name dates from
2013 and was handed over; `^0.3.0` cannot resolve to the earlier owner's versions.

### Secrets

No `.env*` files exist and `.gitignore` covers them. `git log --all -p` searched for
secret-key shapes (Stripe, JWT, AWS, GitHub, Resend, `service_role`): 0 matches, after a
planted example matched. No stash refs on the remote.

### Gates

Before and after each batch: `pnpm typecheck` ✓, `pnpm lint` ✓, `pnpm test` 142/142 ✓,
`pnpm build` ✓ (all 9 routes static).

### Open

- Live headers: re-check with `curl -sI https://sincewhen.webwizarddev.com/` once production
  deploys again.
- Share sheet and iOS Safari under the CSP: check on a real phone with the round 2 phone checks.
