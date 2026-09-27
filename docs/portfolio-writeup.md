# Sincewhen — portfolio write-up

Copy for the `/portfolio` page in `web-wizard-dev-v2`, resumes and posts. It describes the app
**as of 2026-09-27, commit `bb2b6fa`** (branch `skill-pass`, clean tree, PR #8 open). The live
site serves `main` at `8370aa7` (PR #7), so public numbers come from `main` and the live site;
figures that exist only on `skill-pass` wait in Before publishing. Every number in it has a row
in [Evidence](#evidence) with the command or file to re-check it. Run `/portfolio-writeup
numbers` to refresh them.

Sincewhen is Zack's own product, not client work. v1 was built over the weekend of 2026-09-19
to 2026-09-20. After a week of the owner's own use, a second round (themes, sizes, an intro
with example chores, wider screens) and a landing page at `/about` went live on 2026-09-27. It
has not been announced yet. The app has no analytics, by design, so any count of users will come
from feedback, not a dashboard.

## Before publishing

1. **Merge PR #8 (`skill-pass`) and confirm it deploys as Production.** Until 2026-09-27 merges
   were landing as Preview (docs/roadmap.md → Next steps). After the deploy, update three
   figures everywhere they appear: tests 142 to 145, review findings 30 to 33 across 7 pull
   requests (26 fixed, 7 declined), and the landing page's performance. Performance was 94 to
   99 on a local production build (Evidence, not public); publish it only from PageSpeed
   Insights on the live `/about`, as the median of 3 mobile runs.
2. **The real-phone checks** (`docs/roadmap.md` § Still to verify on a real phone). Headless
   Chromium can't run these, so the copy describes each one as something the app does, never
   as a result:
   - **Install from Safari, open from the icon, relaunch in airplane mode.** Proves "works with
     no network" for the installed app. Until then, the offline claim rests on a headless
     Chromium test of a browser tab.
   - **"Share backup" opens the iOS share sheet, and the file arrives in Messages or Files.**
     Proves "sent through its share sheet". Only save-to-Files and restore were tested on an
     iPhone (2026-09-19).
   - **Restore the backup on a second device.** Proves "restored on another device". The
     roadmap says a second device is untested.
   When all three pass, "works offline" and the share sheet can move into `results`, and
   `draft: true` can go.
3. **The number on the app icon stays out of the copy until a notification prompt exists.** iOS
   shows a home-screen web app's icon number only after the user allows notifications, which the
   app never asks for, and Chrome on Android doesn't show it at all. The owner chose (2026-09-27)
   to add a notification prompt later (roadmap → Future additions) and re-test on an iPhone; only
   then can "the overdue count shows on the icon" go back in.
4. **Screenshots use made-up data** (checklist P2). The six phone screenshots in
   `sincewhen/public/landing/` already qualify: they were made from the app's example chores.

---

## One-line pitch

A chore tracker that asks "how long since you last did this?" instead of "what day is it?"

## The problem

Most reminder apps work like a calendar: "change the air filter, every 2 months, on the 1st."
Real life does not. You change the filter three weeks late, and the calendar still says the next
one is due in five weeks, or it has been nagging you daily and you have learned to ignore it.
Household upkeep is not a schedule. It is a set of things that slowly become overdue, at
different speeds, in different rooms.

The things people actually want to know are:

- What in my home has been neglected the longest, relative to how often it should happen?
- Which room is in the worst shape?
- When I finally do the thing, can the clock just restart from today?

## What it does

Sincewhen tracks recurring tasks by **time since last completed**. You give a task a name and a
frequency. It comes due that long after the day you last actually did it, rises to the top of
its list, and stays there, for days or weeks if need be, until you check it off. Then the clock
restarts from that day.

- **Organized like folders.** Locations or categories (Home, Work, Cleaning) hold rooms, rooms
  hold tasks and sub-rooms, and any task can be broken into sub-tasks. The same chore can have a
  different frequency in each room: the main bathroom monthly, the guest bathroom quarterly.
- **Urgency is relative, not absolute.** Tasks are ranked by how far through their own interval
  they are. A daily task two days late outranks a yearly task two weeks late.
- **Color tells you where to look.** Tasks go green, yellow, red, then a red border and "!"
  when badly neglected. Rooms roll their contents up into green, yellow, orange, red and dark
  red, with a count of what is overdue inside, so the worst room is obvious at a glance.
- **A "Due" screen across everything.** One flat list of what needs attention everywhere, most
  urgent first, filterable by location. The app can open on it, or on the folders.
- **Smart completion.** Finishing "clean the bathroom" also finishes its sub-tasks that were
  due, but leaves a yearly "regrout" alone. Finishing the last outstanding sub-task completes
  the parent. Every completion can be undone.
- **Starts with an example setup.** A short intro explains the idea, and "Start with examples"
  fills an empty app with common chores, dated so every color shows on the first day.
- **Fits the device and the person.** Light, dark, or match the device (following it at
  sunset), a larger text size, and on a tablet or computer the lists spread into columns.
- **Private by design.** No account, no server, no tracking. Data lives on the device. A backup
  file can be saved to the phone or sent through its share sheet, and restored on another
  device. The Due screen suggests a backup once the last one is 30 days old.
- **Installs like an app.** Add it to the home screen and it opens full-screen and works with no
  network. The first visit caches every screen, including the ones not yet opened.

## Ready-to-paste portfolio entry

Matches the `Project` interface in `web-wizard-dev-v2/lib/portfolio-data.ts` as of its working
tree on 2026-09-27 (branch `main`, clean). It **replaces** the existing
`sincewhen-recurring-task-pwa` entry (the `// Sincewhen` block) and keeps its slug. It follows
that repo's copy rules: no em dashes, arrows or curly quotes.

```ts
  // Sincewhen
  {
    slug: "sincewhen-recurring-task-pwa",
    draft: true,
    ownProduct: true,
    title: "Sincewhen: Offline-First Recurring Task App",
    description:
      "An installable, offline-first app that tracks household upkeep by how long it has been since each task was last done.",
    outcome:
      "A chore tracker that counts time since each task was last done instead of calendar dates, so the most neglected room stands out at a glance.",
    industry: "Home & productivity",
    overview:
      "Sincewhen is a progressive web app for recurring upkeep: changing filters, cleaning rooms, servicing equipment. Instead of fixed calendar reminders, each task comes due a set interval after it was last actually completed, then stays at the top of the list until it is done. Tasks are organized into locations, rooms and sub-tasks, and color-coded by urgency so the most neglected room stands out. It runs entirely in the browser with no account or server, works offline, and moves between devices through a backup file, saved to the phone or sent from its share sheet.",
    features: [
      {
        title: "Organized like folders",
        description:
          "Locations or categories (Home, Work, Cleaning) hold rooms, rooms hold tasks and sub-rooms, and any task can be broken into sub-tasks. The same chore can have a different frequency in each room: the main bathroom monthly, the guest bathroom quarterly.",
      },
      {
        title: "Urgency is relative, not absolute",
        description:
          "Tasks are ranked by how far through their own interval they are. A daily task two days late outranks a yearly task two weeks late.",
      },
      {
        title: "Color tells you where to look",
        description:
          "Tasks go green, yellow, red, then a red border and \"!\" when badly neglected. Rooms roll their contents up into green, yellow, orange, red and dark red, with a count of what is overdue inside, so the worst room is obvious at a glance.",
      },
      {
        title: "A \"Due\" screen across everything",
        description:
          "One flat list of what needs attention everywhere, most urgent first, filterable by location. The app can open on it, or on the folders.",
      },
      {
        title: "Smart completion",
        description:
          "Finishing \"clean the bathroom\" also finishes its sub-tasks that were due, but leaves a yearly \"regrout\" alone. Finishing the last outstanding sub-task completes the parent. Every completion can be undone.",
      },
      {
        title: "Starts with an example setup",
        description:
          "A short intro explains the idea, and \"Start with examples\" fills an empty app with common chores, dated so every color shows on the first day.",
      },
      {
        title: "Fits the device and the person",
        description:
          "Light, dark, or match the device (following it at sunset), a larger text size, and on a tablet or computer the lists spread into columns.",
      },
      {
        title: "Private by design",
        description:
          "No account, no server, no tracking. Data lives on the device. A backup file can be saved to the phone or sent through its share sheet, and restored on another device. The Due screen suggests a backup once the last one is 30 days old.",
      },
      {
        title: "Installs like an app",
        description:
          "Add it to the home screen and it opens full-screen and works with no network. The first visit caches every screen, including the ones not yet opened.",
      },
    ],
    categories: [PortfolioCategory.App, PortfolioCategory.Mvp],
    services: ["prototype-mvp-development", "mobile-app-development", "software-development"],
    scope: [
      "Product design",
      "Installable, offline-first web app",
      "Scheduling and ranking rules",
      "Nested data model",
      "Backup & restore",
      "Accessibility",
      "Landing page",
      "Automated testing",
    ],
    platforms: ["Web"],
    technologies: [
      "Next.js",
      "React",
      "TypeScript",
      "Tailwind CSS",
      "shadcn/ui",
      "Zustand",
      "Zod",
      "date-fns",
      "TanStack Form",
      "Service Worker (PWA)",
      "Vitest",
      "Vercel",
    ],
    metrics: [
      { value: "96 to 100", label: "Accessibility score with tasks loaded" },
      { value: "2 days", label: "From first commit to a live v1" },
    ],
    externalLink: "https://sincewhen.webwizarddev.com/about",
    year: "2026",
    duration: "A weekend (v1)",
    challenges: [
      "Calendar-style reminders fit upkeep badly: a task done late should restart its clock from the day it was done, and \"2 months\" is not 60 days. Dates also had to survive time zones and daylight saving without shifting by a day.",
      "Ranking had to be fair across very different tasks. Sorting by days overdue buries a neglected daily task under a slightly late yearly one, and coloring rooms by percentage makes a room with one overdue task look worse than a room with three.",
      "With no server, the browser is the database. Safari deletes a site's data after 7 days without a visit, storage can fail or be corrupted, and one bad record could make the whole save file unreadable.",
      "The app had to open and work with no network, including pages the user had never visited, and keep working across deployments without piling up old cached files.",
      "The colors carry the meaning, so they had to stay readable: an empty app passes contrast checks that a real one, full of overdue tasks, fails.",
    ],
    solutions: [
      "Modeled time as local calendar dates with calendar arithmetic, never timestamps or day counts. A task's urgency is elapsed time divided by its own interval, which makes every frequency comparable.",
      "Rooms are colored by a count of overdue tasks (a badly neglected task counts double, and a parent task counts once for its sub-tasks), and one function feeds both the room badge and the Due list so they can never disagree.",
      "Treated saved data as untrusted input: every load and every import passes the same schema and tree-integrity checks, every new or edited record is validated before it is stored, and unreadable data is preserved and surfaced to the user instead of being silently overwritten.",
      "Wrote a small, readable service worker: pages are network-first, hashed build files are cache-first, and each deployment gets its own cache that replaces the previous one only after it is complete. Every route is static, with the item id in the query string, so one cached page serves every item offline.",
      "Measured accessibility with realistic data loaded, in both light and dark mode, and fixed the colors until every screen passed.",
    ],
    results: [
      "A complete v1 went from first commit to live in one weekend (2026-09-19 to 2026-09-20), with no account to create and no backend to run or pay for.",
      "Accessibility went from 96 to 100 on the screens that show overdue tasks, measured on the live site with tasks loaded, in light and dark mode.",
      "Backup and restore verified on a real iPhone: the backup file saves to the Files app and restores from it.",
      "142 automated tests cover the scheduling, ranking and completion rules, the saved-data checks and the backup format. The production build was also tested in a headless browser, including opening never-visited screens offline and upgrading between two deployments.",
      "Built for a future sync layer: storage sits behind one swappable interface, and each record maps to one database row.",
      "Every pull request went through automated code review: 30 findings across 6 pull requests, 24 fixed (the logic fixes with regression tests) and 6 declined.",
      "Built with an AI coding assistant, with every rule covered by tests and every pull request reviewed.",
    ],
  },
```

### Notes on that entry

- **Where to paste:** replace the whole `// Sincewhen` block in
  `web-wizard-dev-v2/lib/portfolio-data.ts` (branch `main`, clean on 2026-09-27). Replace only
  this block, never the whole file.
- **`draft: true` stays** until Before publishing 1 and 2 are done. Then update the Sincewhen
  rows in `web-wizard-dev-v2/docs/portfolio.md` (Drafts, the per-project table and "What I need
  from you"): the accessibility re-measure is done, and the screenshots exist.
- **`metrics` now has 2 real tiles:** the accessibility before and after (live, 2026-09-27) and
  the 2 days to a live v1. Test and review counts are engineering numbers, so they stay in
  `results` (checklist E4).
- **`externalLink` points at `/about`**, the landing page, which is the only page search engines
  index and the one with a share preview. The bare address opens the app itself.
- **`cover` and `gallery`:** the six phone screenshots in `sincewhen/public/landing/` (Folders,
  a room, Due; light and dark; 780 × 1688, made from the example chores) can go straight into
  `gallery`. The site's cover is 1600 × 1000, which a phone screenshot doesn't fill (see
  Screenshots to capture).
- **Changed from the current site entry:** two features added (the example setup, and themes,
  size and columns); the Due screen can be the start screen; "Organized like folders" names
  categories as well as locations; the nested-data challenge and its solution are replaced by
  the accessibility pair, which now has a live, measured result; results gained the
  accessibility line; tests 120 to 142; the review line now counts 6 pull requests; `scope`
  gained Accessibility and Landing page; `externalLink` points at `/about`.
- **AI help is disclosed** as the last result (owner's choice, 2026-09-27).

#### Audit of the old entry

The current site entry is the 2026-09-24 draft's entry (re-imported 2026-09-25, title changed
to a colon since). Its claims, re-checked 2026-09-27:

| Old claim | Verdict | Evidence |
| --- | --- | --- |
| "shipped in a weekend", `duration: "A weekend (v1)"` | keep | First commit Sat 2026-09-19 13:20 EDT; v1's last production deploy Sun 2026-09-20 |
| "120 automated tests" | changed, now 142 | `pnpm test` on `main`: 142 passed (145 on `skill-pass`, not yet live) |
| "Each of v1's 5 pull requests … 20 findings, 16 fixed … 4 declined" | changed, now 6 pull requests, 30 findings, 24 fixed, 6 declined | PR #7 added 10 findings (8 fixed, 2 declined); PR #6 had none |
| "works offline" (What it does) | keep as a capability | still untested on an installed phone app |
| "sent through its share sheet, and restored on another device" | keep as a capability | still unchecked in the roadmap |
| "Backup and restore verified on a real iPhone" | keep | roadmap, 2026-09-19 |
| The nested-data challenge and solution | dropped for space | still true; the sync-layer result keeps the one-row-per-record point |
| The project's own write-up: "30 findings … declined with recorded reasons" | false as worded | 1 of the 6 declined (a file-picker race, PR #2 to #5) has no recorded reason |
| `externalLink` to the bare address | changed to `/about` | the landing page is the indexed page with a share preview |

## Resume bullets

- Designed and shipped Sincewhen, an installable, offline-first web app for recurring household
  upkeep, going from first commit to a live v1 in 2 days (2026-09-19 to 2026-09-20).
- Raised Lighthouse accessibility from 96 to 100 on every screen that shows overdue tasks,
  measured on the live site with data loaded, in light and dark mode.
- Modeled due dates as local calendar dates with calendar-month arithmetic, and ranked tasks by
  the share of their own interval elapsed, covered by 142 automated tests.
- Kept all data on the device with no account or backend: every load and import passes one
  schema and tree check, and unreadable data is set aside and shown to the user, never
  overwritten.
- Triaged 30 automated code-review findings across 6 pull requests: fixed 24, adding
  regression tests for the logic fixes, and declined 6.

Stack: Next.js, React, TypeScript, Tailwind CSS, shadcn/ui (Base UI), Zustand, Zod, date-fns,
TanStack Form, a hand-written service worker, Vitest, Vercel.

## Screenshots to capture

The six landing-page screenshots already exist and use made-up data (the app's example chores):
`sincewhen/public/landing/{folders,room,due}-{light,dark}.png`, 780 × 1688 (a 390-wide phone at
2x). Copy them to `web-wizard-dev-v2/public/portfolio_images/sincewhen/` for `gallery`, each
with an `alt` that says what is on screen.

Still to make:

| File | Screen | What it should show |
| --- | --- | --- |
| `cover.png` (1600 × 1000) | Composite | The Folders screenshot on a plain background with the name, like the landing page's share image (`app/(marketing)/about/opengraph-image.tsx`), or the app in a desktop browser at 1600 × 1000 |
| `add-task.png` | Add form | Name, "every 2 months", the "last done" choices |
| `settings-backup.png` | Settings | The share and save backup buttons, the last-backup line, and "Installed as an app" |

Nothing personal in any shot: no real names, addresses or anything else that identifies a place
or a person.

## Short versions

**Tweet-length:** Sincewhen: a chore tracker that counts time since you last did the thing, not
calendar dates. Rooms turn red as they get neglected. Installable, works offline, no account,
and your data stays on your phone.

**Two sentences:** Sincewhen tracks recurring upkeep by how long it has been since each task was
last done, so a task finished late simply restarts its clock. It organizes tasks by room,
color-codes what is most neglected, installs as an offline app with no account, and went from
first commit to live in one weekend.

## Launch post

Good fits: r/SideProject, r/webdev (Showoff Saturday only), r/PWA, and productivity subs such as
r/productivity or r/organization. Read each sub's self-promotion rules first; several require
a flair or a specific day.

**Title:** I built a chore tracker that counts time *since you last did it*, not calendar dates
(free, offline, no account)

**Body:**

> Reminder apps kept failing me for home upkeep. "Change the air filter every 2 months" is not
> really a calendar event. If I do it three weeks late, I want the next one 2 months from
> *then*, not a reminder that has been nagging me for three weeks and another in five.
>
> So I built Sincewhen. You give a task a frequency, and it comes due that long after the day
> you last actually did it. It then sits at the top of the list until you check it off, and the
> clock restarts from that day.
>
> What it does:
>
> - Organize by location > room > task > sub-task (folders within folders)
> - Tasks are ranked by how overdue they are *relative to their own frequency*, so a daily task
>   2 days late beats a yearly one 2 weeks late
> - Rooms change color (green to dark red) with a count of what is overdue inside
> - One "Due" screen across every room
> - Completing a parent task completes the sub-tasks that were due, and leaves the rest alone
> - Light and dark mode, a larger text size, and a set of example chores to start from
> - Works offline and installs to your home screen
> - No account, no server, no tracking: your data never leaves your device. You can save or
>   share a backup file and restore it on another phone
>
> Try it: https://sincewhen.webwizarddev.com/about
>
> Tip: install it. The app shows the steps for your phone, and Safari can wipe a site's saved
> data after a week of not visiting; installed apps are exempt.
>
> I would love feedback on:
>
> - Do the colors and ordering match your sense of what is urgent? (A task turns yellow at 80%
>   of its interval, and "severe" once it is overdue by half its interval and by at least 3
>   days.)
> - Is folders-within-folders clear, or is it too much?
> - What is missing for you? I am weighing snooze, drag-to-reorder and optional cloud sync.
> - Anything that breaks, especially on Android or in Firefox, which I have tested least.
>
> Stack, for the curious: Next.js, TypeScript, Tailwind, Zustand, a hand-written service worker,
> everything stored in localStorage behind a validated schema.

Before posting, make sure of these:

- The real-phone checks in Before publishing have passed. Strangers will find a broken offline
  launch or share sheet within the hour.
- Decide where feedback goes. The GitHub repo is private (checked 2026-09-27). Making it public
  with Issues enabled is the least effort; say so in the post. If it stays private, ask for
  comments in the thread.
- "Tested least on Android and Firefox" is accurate today: automated checks ran in headless
  Chromium, and the only real device was an iPhone. Update the line if that changes.
- The post doesn't mention the number on the app icon, and shouldn't until the notification
  prompt exists and the icon has been seen to show it on an iPhone.

## Numbers still to get

These would give the entry more user-facing numbers:

- **Your own use, after the test week**: ask Zack: "On your phone, what does Settings > Back up
  say (tasks and folders), and how many days in a row have you used it?" (Owner-reported,
  aggregate only; no task names.)
- **Outside testers**: after the launch post: comments, GitHub issues, and people who say they
  installed it. There are no analytics by design. Vercel's Observability tab gives only
  aggregate request counts, which are not people.
- **Landing page performance**: after PR #8 deploys, PageSpeed Insights on the live `/about`,
  mobile, median of 3 runs (Before publishing 1). A single local run is not reliable for
  performance.
- **Real-phone check results**: not numbers, but each one turns a capability into a result
  (Before publishing 2).

## Evidence

| Claim | Value | Source (how to re-check) | Checked |
| --- | --- | --- | --- |
| v1 built over one weekend | 2 days: first commit Sat 2026-09-19 13:20 EDT; last v1 production deploy Sun 2026-09-20 18:36 UTC (`cf48a4b`, the PR #5 merge) | `git log --reverse --format='%ad %s' --date=iso \| head -1`; `gh api "repos/zackhanni/sincewhen/deployments?environment=Production"` | 2026-09-27 |
| Round 2 and landing page live | PR #7 merged 2026-09-27 01:18 UTC; production deploy `8370aa7` 2026-09-27 02:32 UTC; `/about` HTTP 200 | `gh pr view 7 --json mergedAt`; `gh api "repos/zackhanni/sincewhen/deployments?per_page=100" --jq '[.[] \| select(.environment=="Production")][0]'`; `curl -s -o /dev/null -w '%{http_code}' https://sincewhen.webwizarddev.com/about` | 2026-09-27 |
| Automated tests | 142 on `main` (live), 12 files, all passing; 145 on `skill-pass` (not yet live) | `pnpm test` on each branch (a `git worktree` of `main`, with `node_modules` linked) | 2026-09-27 |
| Pull requests and review findings | 30 findings across 6 pull requests: 8 + 5 + 2 + 2 + 3 (PRs #1 to #5) + 10 (PR #7); 24 fixed, 6 declined. PR #6 had none. PR #8 (open): 3 more, 2 fixed, 1 declined, giving 33 across 7 pull requests, 26 fixed, 7 declined after it merges | CodeRabbit's "Actionable comments posted: N" per PR: `gh api repos/zackhanni/sincewhen/pulls/<n>/reviews`. Fixed vs declined: #1 to #5 as in the 2026-09-24 audit; PR #7 declined the `cn` import in `components/ui/dialog.tsx` (docs/pitfalls.md) and keeping old-domain backups reachable (roadmap: the only data was backed up), the other 8 fixed in `7883882` (round 1) and `a698c9e` (round 2); PR #8's threads (2 fixed in `b4ffb4c`, 1 withdrawn by the reviewer) | 2026-09-27 |
| Regression tests with the logic fixes | 7 fixes on PR #1, each replied to as "with a regression test that fails on the old code"; test files also changed in `ec8a918`, `a370351`, `a698c9e` | `gh api repos/zackhanni/sincewhen/pulls/1/comments`; `git show --stat <sha>` | 2026-09-27 |
| Accessibility with tasks loaded, live site | before: 96 on 3 of 6 screens (2026-09-24, made-up sample tasks, light only; color contrast 4.33:1 and 3.8:1). After: 100 on all 8 screens measured (`/rooms`, `/due`, a room, a task; light and dark), best practices and SEO 100 too (2026-09-27, the app's example chores) | Lighthouse 12.8.2, mobile, one run per screen (accessibility is not timing-dependent). `scripts/pagespeed/seed-profile.mjs <profile> <light\|dark> https://sincewhen.webwizarddev.com`, then `npx -y lighthouse@12 <url> --disable-storage-reset --chrome-flags="--headless=new --user-data-dir=<profile>"`. Screenshots in the reports confirm the tasks and the theme. Report: `docs/pagespeed-audit.md` | 2026-09-27 |
| Landing page performance (not public) | 94 to 99, largest paint 3.10 to 2.26 s | Local production build of `skill-pass`, Lighthouse mobile, median of 3 then 5 runs (`docs/pagespeed-audit.md`). Not live until PR #8 deploys; publish only from PageSpeed Insights on the live site | 2026-09-27 |
| Safari's storage limit | 7 days of Safari use without interaction, then script-written storage is deleted; home-screen web apps are exempt | https://webkit.org/blog/10218/full-third-party-cookie-blocking-and-more/ (2020-03-24); `docs/pitfalls.md` § Safari deletes local data | 2026-09-27 |
| Calendar arithmetic (worked example) | "every 2 months" is `addMonths`, not 60 days | `lib/core/dates.ts`; `lib/core/dates.test.ts` (leap day, daylight-saving change); the air-filter example is `docs/plan.md` § What the app does | 2026-09-27 |
| Ranking (worked example) | a daily task 2 days late has progress 3.0; a yearly task 2 weeks late has 1.04, so the daily task ranks first | progress = elapsed days / interval days (`lib/core/status.ts`, `docs/plan.md` § Task status): (1 + 2) / 1 and (365 + 14) / 365 | 2026-09-27 |
| Status and backup thresholds | yellow at 80% (0.8) of the interval; severe when overdue by 50% (0.5) of it and by at least 3 days; room orange from score 1, red from 3, dark red from 6; backup nudge after 30 days (first one after 7) | `lib/core/constants.ts` | 2026-09-27 |
| Backup and restore on a real iPhone | save to Files, then restore: passed (2026-09-19); share sheet and a second device untested | `docs/roadmap.md` § Still to verify on a real phone | 2026-09-27 |
| Live at the custom domain | `sincewhen.webwizarddev.com` HTTP 200; the retired `sincewhen-ruby.vercel.app` answers 308 to it | `curl -sI https://sincewhen-ruby.vercel.app/rooms` | 2026-09-27 |
| No account, server or tracking | no API routes or server actions; no analytics package; the service worker fetches only same-origin URLs | `ls app`; `grep -rln "use server" app components lib` (none); `package.json`; `grep -n fetch public/sw.js` | 2026-09-27 |
| Screenshots with made-up data | 6 files, 780 × 1688, from the example chores | `ls public/landing`; `file public/landing/*.png`; `scripts/landing-screenshots.mjs` | 2026-09-27 |
| Icon number support (not public) | iOS 16.4+ home-screen apps, shown only after notification permission; Chrome on Android: none; the app requests no permission | https://webkit.org/blog/13878/web-push-for-web-apps-on-ios-and-ipados/ (2023-02-16); MDN browser-compat-data `api.Navigator.setAppBadge`; `lib/pwa/pwa.ts` | 2026-09-27 |
