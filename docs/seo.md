# SEO

> skill: seo v2.2.1 (seo-playbook 1.1.4) @ 9b1d458+dirty · mode: linked · repo: sincewhen
>
> Cumulative: each run adds a dated round. Earlier rounds record what was decided and why.

## What is meant to be found

Only **`/about`**, the landing page. Everything else is the app itself, rendered from the saved
data on the device, so to a search engine it is an empty screen:

| Route | Indexed? | How |
|---|---|---|
| `/about` | yes | canonical on `SITE_URL`, in the sitemap |
| `/`, `/rooms`, `/due`, `/settings` | no | `robots: { index: false, follow: true }` in `app/(app)/layout.tsx` |

They are **not** blocked in `robots.txt`: a crawler that cannot fetch a page never sees its
`noindex`. Share `/about` links, not the bare address: `/` only redirects in the browser.

## Round 1 — 2026-09-27 — scope: all (5 routes, robots, sitemap)

Live checks by `curl` on `https://sincewhen.webwizarddev.com` (serving `main`, 8370aa7), then on a
local production build of `skill-pass`.

**Found:** `/robots.txt` and `/sitemap.xml` answered 404. The four app routes were indexable, all
titled "Sincewhen" with one shared description and no canonical. `/about` had a canonical, a
unique title (47 characters) and description (147), Open Graph and a Twitter card, but no share
image (so a small `summary` card) and no structured data. Its headings run in order under one
`h1`, its FAQ answers are in the served HTML (native `<details>`), and `lang="en"` is set.
`www.` has no DNS record, which is fine for a subdomain; the retired address 308s to the new one.

**Applied:**

| Change | Where | Verified on the build |
|---|---|---|
| App screens `noindex, follow` | `app/(app)/layout.tsx` | `<meta name="robots" content="noindex, follow">` on `/`, `/rooms`, `/due`, `/settings`; none on `/about` |
| Sitemap with `/about` only | `app/sitemap.ts` | one `<loc>` on `SITE_URL` |
| robots.txt: allow all, point at the sitemap | `app/robots.ts` | served as a static route |
| Structured data: `WebApplication` (free, works in any browser, publisher Web Wizard Dev) | `app/(marketing)/about/page.tsx`; the maker's name and URL now live once in `content.ts` (`maker`), used by the footer too | JSON parses; description and name are the page's own constants; CSP check 0 violations |
| Share image, 1200×630, drawn at build time from the hero copy and the Folders screenshot | `app/(marketing)/about/opengraph-image.tsx` | `og:image` and `twitter:image` with width, height and alt; Twitter card became `summary_large_image` by itself; 52 KB PNG |

Gates: `pnpm typecheck`, `pnpm lint`, `pnpm test` (145), `pnpm build` all pass.

**Deliberately not done:**
- **The title keeps its voice.** "Sincewhen: for the things you do every so often" has no generic
  search phrase (such as "recurring chore tracker"). Offered; the owner kept it. The description
  already says "a free app for recurring chores".
- **No `lib/seo` toolkit** (the skill's `generateSeoMetadata` and schema helpers): with one
  indexable page it would be more code than the problem. `lib/site.ts` holds the address.
- **No per-tab titles** on the app screens: they are `noindex`, and they are client pages.
- **No `FAQPage` markup:** Google shows FAQ rich results only for government and health sites,
  and the answers are already in the HTML.
- **No `LocalBusiness`:** not a local business.
- **No rich result expected:** Google's software-app result needs ratings or reviews, which the
  app does not have. The `WebApplication` data still describes the page.

**For Zack:** once `skill-pass` is deployed, submit
`https://sincewhen.webwizarddev.com/sitemap.xml` in Google Search Console, and check `/about` in
the Rich Results Test and a link-preview tool.
