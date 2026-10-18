# Sincewhen — portfolio write-up

Copy for the `/portfolio` page in `web-wizard-dev-v2`, resumes and posts. It describes the app
**as of 2026-10-18, commit `cfe3c26`** (`main`, the PR #9 merge; read from branch
`done-today-check` at `9febb10`, already merged, same content, clean tree). The live site serves
`cfe3c26` (Production deploy of 2026-09-30), so `main` and the live site agree. Every number in
it has a row in [Evidence](#evidence) with the command or file to re-check it. Run
`/portfolio-writeup numbers` to refresh them.

Sincewhen is Zack's own product, not client work. v1 was built over the weekend of 2026-09-19
to 2026-09-20. After a week of the owner's own use, a second round (themes, sizes, an intro
with example chores, wider screens) and a landing page at `/about` went live on 2026-09-27. A
third round (PR #9, live 2026-09-30) added a green check on tasks done today and rewrote the
intro after a tester's notes. The portfolio entry has been published since 2026-10-05; the
Reddit post for outside testers is still open in the roadmap. The app has no analytics, by
design, so any count of users will come from feedback, not a dashboard.

## Before publishing

The site entry is already published (no `draft` flag since 2026-10-05), so these items are about
the next re-import, not about taking the entry public.

1. **Done 2026-10-18 (web-wizard PR #48): re-import the entry below into `web-wizard-dev-v2`.** The live entry says "All 9 pull
   requests went through automated code review" and "every pull request reviewed", but PR #6
   (docs only) was never reviewed, and it says the fixes came "with regression tests", which the
   two storage fixes on PR #8 did not. Its meta description is 117 characters against the
   site's 150-160 rule (web-wizard `docs/seo.md` → S12, roadmap C18). And it doesn't describe
   the "done today" check. The entry below fixes all four.
2. **Landing-page performance is measured live** (2026-10-18): PageSpeed Insights scored the
   live `/about` 99 on mobile, the best of 2 keyed runs (99, 98), and 100 on desktop (2 of 2).
   The owner publishes the best recorded run (2026-10-18). The local 94 to 99 stays in Evidence.
3. **The number on the app icon stays out of the copy until a notification prompt exists.** iOS
   shows a home-screen web app's icon number only after the user allows notifications, which the
   app never asks for, and Chrome on Android doesn't show it at all. The owner chose (2026-09-27)
   to add a notification prompt later (roadmap → Future additions) and re-test on an iPhone; only
   then can "the overdue count shows on the icon" go back in.
4. **Tick the phone checks in the project's roadmap.** The owner reported on 2026-10-05 that all
   three pass (airplane-mode relaunch of the installed app, the share sheet, a restore on a second
   device), and the copy now states them as results. `docs/roadmap.md` § Still to verify on a
   real phone still shows them open, and so do three "Next steps" boxes that were verified true
   (Production deploys by itself: `cfe3c26`; the security headers answer live; accessibility
   re-measured live with tasks loaded, light and dark; all checked 2026-10-18).
   Until the boxes are ticked, the status doc and this write-up disagree.

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
  the parent. Every completion can be undone, and a task done today keeps a green check in its
  circle until the day ends.
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
tree on 2026-10-18 (branch `main` at `bf2e9316`, clean). It **replaces** the published
`sincewhen-recurring-task-pwa` entry (the `// Sincewhen` block) and keeps its slug, its feature
icons, `sectors: []`, and its cover and gallery images. It follows that repo's copy rules: no em
dashes, arrows or curly quotes.

```ts
  // Sincewhen
  {
    slug: "sincewhen-recurring-task-pwa",
    ownProduct: true,
    title: "Sincewhen: Offline-First Recurring Task App",
    description:
      "An offline-first app, live within 2 days of its first commit, that tracks household upkeep by the time since each task was last done, not by calendar dates.",
    outcome:
      "A chore tracker that counts time since each task was last done instead of calendar dates, so the most neglected room stands out at a glance.",
    industry: "Home & productivity",
    overview:
      "Sincewhen is a progressive web app for recurring upkeep: changing filters, cleaning rooms, servicing equipment. Instead of fixed calendar reminders, each task comes due a set interval after it was last actually completed, then stays at the top of the list until it is done. Tasks are organized into locations, rooms and sub-tasks, and color-coded by urgency so the most neglected room stands out. It runs entirely in the browser with no account or server, works offline, and moves between devices through a backup file, saved to the phone or sent from its share sheet.",
    features: [
      {
        title: "Organized like folders",
        icon: "folder",
        description:
          "Locations or categories (Home, Work, Cleaning) hold rooms, rooms hold tasks and sub-rooms, and any task can be broken into sub-tasks. The same chore can have a different frequency in each room: the main bathroom monthly, the guest bathroom quarterly.",
      },
      {
        title: "Urgency is relative, not absolute",
        icon: "clock",
        description:
          "Tasks are ranked by how far through their own interval they are. A daily task two days late outranks a yearly task two weeks late.",
      },
      {
        title: "Color tells you where to look",
        icon: "palette",
        description:
          "Tasks go green, yellow, red, then a red border and \"!\" when badly neglected. Rooms roll their contents up into green, yellow, orange, red and dark red, with a count of what is overdue inside, so the worst room is obvious at a glance.",
      },
      {
        title: "A \"Due\" screen across everything",
        icon: "list-checks",
        description:
          "One flat list of what needs attention everywhere, most urgent first, filterable by location. The app can open on it, or on the folders.",
      },
      {
        title: "Smart completion",
        icon: "check",
        description:
          "Finishing \"clean the bathroom\" also finishes its sub-tasks that were due, but leaves a yearly \"regrout\" alone. Finishing the last outstanding sub-task completes the parent. Every completion can be undone, and a task done today keeps a green check in its circle until the day ends.",
      },
      {
        title: "Starts with an example setup",
        icon: "zap",
        description:
          "A short intro explains the idea, and \"Start with examples\" fills an empty app with common chores, dated so every color shows on the first day.",
      },
      {
        title: "Fits the device and the person",
        icon: "sliders",
        description:
          "Light, dark, or match the device (following it at sunset), a larger text size, and on a tablet or computer the lists spread into columns.",
      },
      {
        title: "Private by design",
        icon: "lock",
        description:
          "No account, no server, no tracking. Data lives on the device. A backup file can be saved to the phone or sent through its share sheet, and restored on another device. The Due screen suggests a backup once the last one is 30 days old.",
      },
      {
        title: "Installs like an app",
        icon: "smartphone",
        description:
          "Add it to the home screen and it opens full-screen and works with no network. The first visit caches every screen, including the ones not yet opened.",
      },
    ],
    categories: [PortfolioCategory.App, PortfolioCategory.Mvp],
    sectors: [],
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
    cover: {
      src: "/portfolio_images/sincewhen/home.jpg",
      alt: "Sincewhen landing page asking \"Since when did you last change the air filter?\" beside a phone showing three color-coded folders",
    },
    gallery: [
      {
        src: "/portfolio_images/sincewhen/screens-light.jpg",
        alt: "Three phone screens: color-coded folders, the Home folder with its tasks and rooms, and the Due list with two overdue tasks",
        caption: "Folders, a room and the Due list, colored by what is overdue (the app's example chores)",
      },
      {
        src: "/portfolio_images/sincewhen/screens-dark.jpg",
        alt: "The same three phone screens in dark mode",
        caption: "Dark mode, which can follow the phone's setting",
      },
      {
        src: "/portfolio_images/sincewhen/features.jpg",
        alt: "Landing page section listing what the app does: folders, fair urgency, sub-tasks, undo, offline use, privacy, backups, dark mode and larger text",
        caption: "The landing page explains the app before anyone opens it",
      },
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
      "Checked on a real iPhone: the installed app reopens and works in airplane mode, \"Share backup\" opens the share sheet, and a backup file saved to the Files app restores, on the same phone and on a second device.",
      "The landing page scores 100 for accessibility, best practices and SEO in Lighthouse's mobile test of the live site, and Google PageSpeed Insights scores it 99 for mobile performance (best of 2 tests) and 100 on desktop.",
      "147 automated tests cover the scheduling, ranking and completion rules, the saved-data checks and the backup format. The production build was also tested in a headless browser, including opening never-visited screens offline and upgrading between two deployments.",
      "Built for a future sync layer: storage sits behind one swappable interface, and each record maps to one database row.",
      "Every pull request that changed code went through automated code review (8 of the 9; the other changed only docs): 36 findings, 28 fixed, 7 declined and 1 withdrawn by the reviewer.",
      "Built with an AI coding assistant, with every rule covered by tests and every code change reviewed.",
    ],
  },
```

### Notes on that entry

- **Where to paste:** replace the whole `// Sincewhen` block in
  `web-wizard-dev-v2/lib/portfolio-data.ts` (branch `main` at `bf2e9316`, clean on 2026-10-18).
  Replace only this block, never the whole file. Then update the Sincewhen rows in
  `web-wizard-dev-v2/docs/portfolio.md`: the Sources table (this write-up, 2026-10-18), the
  per-project table ("Not in the copy yet: the done today check" is done), and the Evidence row
  that says "The write-up still says 142 and 30" (it no longer does). Close roadmap S12/C18 for
  Sincewhen.
- **No `draft` flag.** The entry has been published since 2026-10-05. The open Before-publishing
  items (the number on the app icon, the roadmap ticks) touch nothing in this copy.
- **`description` is 156 characters** (rule: 150-160). It is a variant of the C18 proposal
  ("live 2 days after its first commit", 152): "within 2 days" is closer to the record, since the
  complete v1 went live about 25 hours after the first commit, on its second calendar day.
- **`metrics` keeps its 2 tiles:** the accessibility before and after, and the 2 days to a live
  v1. Test and review counts are engineering numbers, so they stay in `results` (checklist E4).
  The landing page's 100 / 100 / 100 is a result line, not a tile: it is an empty marketing
  page, and the tasks-loaded accessibility tile is the stronger version of the same claim.
- **`externalLink` points at `/about`**, the landing page, which is the only page search engines
  index and the one with a share preview. The bare address opens the app itself.
- **`cover` and `gallery`** are the site's current four images (captured 2026-10-05 from `/about`
  at 1600 × 1000, the app's example chores, no real data). Keep them.
- **Changed from the current site entry:** `description` rewritten to the 150-160 rule; "Smart
  completion" gained the done-today check (PR #9); the iPhone result now includes the three
  owner-reported checks; a landing-page Lighthouse result added; the review line no longer says
  every pull request was reviewed, and no longer says the fixes came with regression tests; the
  AI line says "every code change reviewed".
- **AI help is disclosed** as the last result (owner's choice, 2026-09-27).

#### Audit of the old entry

The current site entry was re-imported on 2026-10-05 from the 2026-09-27 write-up, with two newer
counts (147 tests, 36 findings) taken in web-wizard `docs/portfolio.md` → Evidence recorded here.
Its claims, re-checked 2026-10-18:

| Old claim | Verdict | Evidence |
| --- | --- | --- |
| `description`, 117 characters | changed (breaks the site's 150-160 rule, web-wizard seo S12) | now 156 characters |
| "96 to 100" accessibility tile, "with tasks loaded, in light and dark mode" | keep | 8 screens 2026-10-05 after PR #9; 2 screens re-run 2026-10-18 on the same deploy: 100 |
| "2 days" tile, `duration: "A weekend (v1)"`, "first commit to live in one weekend" | keep | first commit 2026-09-19 13:20 EDT; v1's last production deploy 2026-09-20 18:36 UTC |
| "147 automated tests" | keep | `pnpm test`, 2026-10-18: 147 passed in 12 files |
| "All 9 pull requests went through automated code review" | false | PR #6 (docs only) was skipped: CodeRabbit's "Review skipped, auto reviews are disabled", 0 reviews. 8 of 9 were reviewed |
| "36 findings, 28 fixed, 7 declined and 1 withdrawn" | keep | re-counted from each PR's reviews and replies, 2026-10-18 |
| "(the logic fixes with regression tests)" | false as worded | PR #8's two storage fixes (`b4ffb4c`) changed no test file. Dropped |
| "every pull request reviewed" (the AI line) | false, same reason as PR #6 | now "every code change reviewed" |
| "Backup and restore verified on a real iPhone" | keep, widened | plus the three owner-reported checks of 2026-10-05 |
| "works offline", "sent through its share sheet, and restored on another device" (features, overview) | keep, now proven | owner-reported 2026-10-05 |
| "Smart completion" with no done-today check | stale | PR #9, live 2026-09-30 |
| "Safari deletes a site's data after 7 days without a visit" (challenge) | keep | WebKit blog, 2020-03-24 |

## Resume bullets

- Designed and shipped Sincewhen, an installable, offline-first web app for recurring household
  upkeep, going from first commit to a live v1 in 2 days (2026-09-19 to 2026-09-20).
- Raised Lighthouse accessibility from 96 to 100 on every screen that shows overdue tasks,
  measured on the live site with data loaded, in light and dark mode.
- Modeled due dates as local calendar dates with calendar-month arithmetic, and ranked tasks by
  the share of their own interval elapsed, covered by 147 automated tests.
- Kept all data on the device with no account or backend: every load and import passes one
  schema and tree check, and unreadable data is set aside and shown to the user, never
  overwritten.
- Triaged 36 automated code-review findings across 8 pull requests: fixed 28 and declined 7,
  and the reviewer withdrew 1 after a reply.

Stack: Next.js, React, TypeScript, Tailwind CSS, shadcn/ui (Base UI), Zustand, Zod, date-fns,
TanStack Form, a hand-written service worker, Vitest, Vercel.

## Screenshots to capture

The site already has a cover and three gallery images (2026-10-05): `home.jpg`,
`screens-light.jpg`, `screens-dark.jpg` and `features.jpg` in
`web-wizard-dev-v2/public/portfolio_images/sincewhen/`, taken from `/about` at 1600 × 1000. The
phones in them are the app's own landing screenshots, made from the example chores. The six
source screenshots are still in `sincewhen/public/landing/{folders,room,due}-{light,dark}.png`,
780 × 1688 (a 390-wide phone at 2x).

Optional additions, same rule (the example chores only):

| File | Screen | What it should show |
| --- | --- | --- |
| `done-today.png` | A room with one task checked off today | The filled green check beside a task, next to empty circles and a red overdue row (PR #9) |
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
> - A task you did today keeps a green check until the day ends
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

- The real-phone checks have passed (owner-reported, 2026-10-05: airplane-mode relaunch, share
  sheet, second-device restore). Strangers will find a broken offline launch or share sheet
  within the hour, so re-run them if a release touches `public/sw.js` or backup.
- Decide where feedback goes. The GitHub repo is private (checked 2026-10-18). Making it public
  with Issues enabled is the least effort; say so in the post. If it stays private, ask for
  comments in the thread.
- "Tested least on Android and Firefox" is accurate today: automated checks ran in headless
  Chromium, and the only real device was an iPhone. Update the line if that changes.
- The post doesn't mention the number on the app icon, and shouldn't until the notification
  prompt exists and the icon has been seen to show it on an iPhone.

## Numbers still to get

These would give the entry more user-facing numbers:

- **Your own use, a month in**: ask Zack: "On your phone, what does Settings > Back up say
  (tasks and folders), and have you used it most days since 2026-09-19?" (Owner-reported,
  aggregate only; no task names.)
- **People using it besides you**: ask Zack: "How many people other than you have Sincewhen
  on their phone now?" The roadmap says the start screen is being tested with other users, and
  PR #9's intro rewrite came from one tester's notes. A count only, no names.
- **Outside testers**: after the launch post: comments, GitHub issues, and people who say they
  installed it. There are no analytics by design. Vercel's Observability tab gives only
  aggregate request counts, which are not people.

## Evidence

| Claim | Value | Source (how to re-check) | Checked |
| --- | --- | --- | --- |
| v1 built over one weekend | 2 days: first commit Sat 2026-09-19 13:20 EDT (`5afde2c`); first production deploy the same day (`4f0fdc8`, 17:29 UTC); the complete v1's last production deploy Sun 2026-09-20 18:36 UTC (`cf48a4b`, the PR #5 merge), about 25 hours after the first commit | `git log --reverse --format='%h %ad %s' --date=iso origin/main \| head -1`; `gh api "repos/zackhanni/sincewhen/deployments?environment=Production&per_page=100"` | 2026-10-18 |
| Round 2 and landing page live | PR #7 merged 2026-09-27 01:18 UTC; production deploy `8370aa7` 2026-09-27 02:32 UTC | `gh api repos/zackhanni/sincewhen/pulls/7 --jq .merged_at`; the deployments call above | 2026-10-18 |
| Done-today check live | PR #9 merged 2026-09-30 22:03 UTC; production deploy `cfe3c26` 2026-09-30 22:04 UTC, still the latest production deploy | `gh api repos/zackhanni/sincewhen/deployments --jq '.[0:6][] \| [.sha[0:7], .environment, .created_at] \| @tsv'` | 2026-10-18 |
| Automated tests | 147 on `main` (`cfe3c26`, live), 12 files, all passing (142 on 2026-09-27) | `pnpm test` (Vitest 5.0.1), run on `done-today-check` at `9febb10`, whose tree equals `cfe3c26` (`git diff origin/main HEAD` empty) | 2026-10-18 |
| Pull requests and review findings | 9 pull requests merged, 8 reviewed. 36 findings: 8 + 5 + 2 + 2 + 3 (PRs #1 to #5) + 8 + 2 (PR #7, two rounds) + 3 + 3 (PR #8, two rounds); PR #9 reviewed with no actionable comments; PR #6 (`AGENTS.md`, `docs/portfolio-writeup.md`, `docs/roadmap.md`) not reviewed: "Review skipped: Auto reviews are disabled on this repository", 0 reviews. Outcomes: 28 fixed, 7 declined, 1 withdrawn by the reviewer. PR #8: 4 fixed (2 in `b4ffb4c`, 2 in `44c6123`), 1 declined (hashes instead of `'unsafe-inline'`, recorded in `docs/security-audit.md`), 1 withdrawn (where the zod wrapper lives) | CodeRabbit's "Actionable comments posted: N" per PR: `gh api repos/zackhanni/sincewhen/pulls/<n>/reviews`; #6 and #9 from `gh api repos/zackhanni/sincewhen/issues/<n>/comments`; outcomes from each thread's replies (`pulls/<n>/comments`). #1 to #7 as on 2026-09-27: PR #7 declined the `cn` import in `components/ui/dialog.tsx` (docs/pitfalls.md) and keeping old-domain backups reachable | 2026-10-18 |
| Regression tests with the fixes | 7 fixes on PR #1, each replied to as "with a regression test that fails on the old code"; test files also changed in `ec8a918`, `a370351`, `a698c9e`. PR #8's 2 storage fixes (`b4ffb4c`) changed no test file, so the copy no longer says the fixes came with tests | `gh api "repos/zackhanni/sincewhen/pulls/1/comments?per_page=100" --jq '[.[] \| select(.user.login=="zackhanni") \| select(.body\|test("regression test";"i"))] \| length'`; `git show --stat b4ffb4c` | 2026-10-18 |
| Accessibility with tasks loaded, live site | before: 96 on 3 of 6 screens (2026-09-24, made-up sample tasks, light only; color contrast 4.33:1 and 3.8:1). After: 100 on all 8 screens measured (`/rooms`, `/due`, a room, a task; light and dark), on 2026-09-27 and again on 2026-10-05 after PR #9 changed the task circle (web-wizard `docs/portfolio.md` → Evidence recorded here). Re-run 2026-10-18 on the same deploy: `/due` light and the Kitchen room dark, accessibility 100 and best practices 100 on both. Profiles held the example set (19 items, 13 of them tasks, theme as set); the dark room's final screenshot shows a severely overdue row, and color contrast passed. SEO on app screens is 63 by design: they are `noindex` since PR #8 and `is-crawlable` is the only failing audit, so "SEO 100" is claimed for `/about` only | Lighthouse 12.8.2, mobile, one run per screen (accessibility is not timing-dependent). Copy `scripts/pagespeed/seed-profile.mjs` into a scratch folder whose `node_modules` links to an installed Playwright (the repo has none), run it with `<profile> <light\|dark> https://sincewhen.webwizarddev.com`, then `npx -y lighthouse@12 <url> --only-categories=accessibility,best-practices,seo --disable-storage-reset --chrome-flags="--headless=new --user-data-dir=<profile>"`. Report: `docs/pagespeed-audit.md` | 2026-10-18 |
| Landing page, live | `/about`: accessibility 100, best practices 100, SEO 100 | `npx -y lighthouse@12 https://sincewhen.webwizarddev.com/about --only-categories=accessibility,best-practices,seo --form-factor=mobile --chrome-flags="--headless=new"`, Lighthouse 12.8.2, one run | 2026-10-18 |
| Landing page, PageSpeed Insights (live) | mobile performance 99 = best of 2 runs (99, 98); desktop 100 (2 of 2); accessibility, best practices and SEO 100 on all 4 | `node scripts/pagespeed/psi.mjs --url=https://sincewhen.webwizarddev.com/about --strategy=mobile` (and `desktop`) from the pfthw folder for its key, Lighthouse 13.5.0, 2026-10-18 17:22 UTC. A third mobile call returned the first run from PSI's cache (same `fetchTime`) and is not counted; the third desktop call hit the key's quota. No field data | 2026-10-18 |
| Landing page performance, local (not public) | 94 to 99, largest paint 3.10 to 2.26 s | Local production build of `skill-pass`, Lighthouse mobile, median of 3 then 5 runs (`docs/pagespeed-audit.md`). Superseded for the copy by the live PageSpeed Insights row | 2026-10-18 |
| Safari's storage limit | 7 days of Safari use without interaction, then script-written storage is deleted; home-screen web apps are exempt | https://webkit.org/blog/10218/full-third-party-cookie-blocking-and-more/ (2020-03-24), section "7-Day Cap on All Script-Writeable Storage"; `docs/pitfalls.md` § Safari deletes local data | 2026-10-18 |
| Calendar arithmetic (worked example) | "every 2 months" is `addMonths`, not 60 days | `lib/core/dates.ts` (unchanged since `bb2b6fa`); `lib/core/dates.test.ts` (leap day, daylight-saving change); the air-filter example is `docs/plan.md` § What the app does | 2026-10-18 |
| Ranking (worked example) | a daily task 2 days late has progress 3.0; a yearly task 2 weeks late has 1.04, so the daily task ranks first | progress = elapsed days / interval days (`lib/core/status.ts`, `docs/plan.md` § Task status): (1 + 2) / 1 and (365 + 14) / 365. PR #9 added only `doneToday` to `getTaskTiming` | 2026-10-18 |
| Status and backup thresholds | yellow at 80% (0.8) of the interval; severe when overdue by 50% (0.5) of it and by at least 3 days; room orange from score 1, red from 3, dark red from 6; backup nudge after 30 days (first one after 7) | `lib/core/constants.ts` (unchanged since `bb2b6fa`) | 2026-10-18 |
| Real-phone checks | save to Files, then restore on the same iPhone: passed (2026-09-19, roadmap). Installed from Safari and relaunched in airplane mode; "Share backup" opens the share sheet; a backup restores on a second device: all pass, owner-reported 2026-10-05 ("already tested and working"), with the Content-Security-Policy live since 2026-09-27. The project's roadmap still shows those three open | `docs/roadmap.md` § Still to verify on a real phone; web-wizard `docs/portfolio.md` → Evidence recorded here, "Sincewhen published"; owner-reported | 2026-10-18 |
| Live at the custom domain | `sincewhen.webwizarddev.com/about` HTTP 200; the retired `sincewhen-ruby.vercel.app` answers 308 to it | `curl -sI https://sincewhen.webwizarddev.com/about`; `curl -s -o /dev/null -w '%{http_code} %{redirect_url}' https://sincewhen-ruby.vercel.app/rooms` | 2026-10-18 |
| Security headers live (not used in the copy) | Content-Security-Policy (`connect-src 'self'`, `frame-ancestors 'none'`), HSTS, `X-Frame-Options: DENY`, `nosniff`, referrer and permissions policies | `curl -sI https://sincewhen.webwizarddev.com/about` | 2026-10-18 |
| No account, server or tracking | no API routes or server actions; no analytics package; the service worker fetches only same-origin URLs | `ls app` (route groups and metadata files only); `grep -rln "use server" app components lib` (none); `package.json`; `grep -n fetch public/sw.js` | 2026-10-18 |
| Screenshots with made-up data | site: 4 images at 1600 × 1000 from `/about` (captured 2026-10-05); source: 6 files, 780 × 1688, from the example chores | `ls web-wizard-dev-v2/public/portfolio_images/sincewhen`; `sips -g pixelWidth -g pixelHeight <file>`; `file public/landing/*.png`; `scripts/landing-screenshots.mjs` | 2026-10-18 |
| Meta description length | old 117 characters; new 156 (rule: 150-160) | `python3 -c 'print(len("<description>"))'`; the `description` doc comment in web-wizard `lib/portfolio-data.ts`; web-wizard `docs/seo.md` → Round 3, S12 | 2026-10-18 |
| Icon number support (not public) | iOS 16.4+ home-screen apps, shown only after notification permission; Chrome on Android: none; the app requests no permission | https://webkit.org/blog/13878/web-push-for-web-apps-on-ios-and-ipados/ (2023-02-16); MDN browser-compat-data `api.Navigator.setAppBadge`; `lib/pwa/pwa.ts` (unchanged since `bb2b6fa`; the external sources were last read 2026-09-27) | 2026-10-18 |
