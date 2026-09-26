# Sincewhen — portfolio and launch write-up

Copy for the `/portfolio` page in `web-wizard-dev-v2`, plus a Reddit post draft. Everything
here describes the app as of v1 (2026-09-20). Check the numbers still hold before publishing:
`pnpm test` for the test count, `lib/core/constants.ts` for the thresholds.

## Before moving to sincewhen.webwizarddev.com

**A new domain is a new, empty app.** Browsers keep saved data per origin, so nothing stored
under the `vercel.app` address is visible at `sincewhen.webwizarddev.com`, and an installed
home-screen app keeps pointing at the address it was installed from. To move:

1. On the old address: Settings > Back up > save the file.
2. Add the domain in Vercel (Project > Settings > Domains) and the CNAME record at your DNS host.
3. Open the new address, restore the backup in Settings, then install it to the home screen.
4. Delete the old home-screen icon.

Do this **before** posting publicly. Anyone who starts using the app at the `vercel.app` address
would have to make the same move later. Nothing in the code needs to change: there are no
hard-coded URLs, and the service worker works on any origin.

---

## One-line pitch

A chore tracker that asks "how long since you last did this?" instead of "what day is it?"

## The problem

Most reminder apps work like a calendar: "change the air filter, every 2 months, on the 1st."
Real life does not. You change the filter three weeks late, and the calendar still says the next
one is due in five weeks — or it has been nagging you daily and you have learned to ignore it.
Household upkeep is not a schedule. It is a set of things that slowly become overdue, at
different speeds, in different rooms.

The things people actually want to know are:

- What in my home has been neglected the longest, relative to how often it should happen?
- Which room is in the worst shape?
- When I finally do the thing, can the clock just restart from today?

## What it does

Sincewhen tracks recurring tasks by **time since last completed**. You give a task a name and a
frequency. It comes due that long after the day you last actually did it, rises to the top of
its list, and stays there — for days or weeks if need be — until you check it off. Then the clock
restarts from that day.

- **Organized like folders.** Locations (Home, Work, a parent's house) hold rooms, rooms hold
  tasks and sub-rooms, and any task can be broken into sub-tasks. The same chore can have a
  different frequency in each room: the main bathroom monthly, the guest bathroom quarterly.
- **Urgency is relative, not absolute.** Tasks are ranked by how far through their own interval
  they are. A daily task two days late outranks a yearly task two weeks late.
- **Color tells you where to look.** Tasks go green, yellow, red, then a red border and "!"
  when badly neglected. Rooms roll their contents up into green, yellow, orange, red and dark
  red, with a count of what is overdue inside, so the worst room is obvious at a glance.
- **A "Due" screen across everything.** One flat list of what needs attention in every room,
  most urgent first, filterable by location.
- **Smart completion.** Finishing "clean the bathroom" also finishes its sub-tasks that were
  due — but leaves a yearly "regrout" alone. Finishing the last outstanding sub-task completes
  the parent. Every completion can be undone.
- **Private by design.** No account, no server, no tracking. Data lives on the device. A backup
  file can be saved or sent through the phone's share sheet, and restored on another device.
- **Installs like an app.** Add it to the home screen and it opens full-screen, works with no
  network, and shows the overdue count on its icon.

## Ready-to-paste portfolio entry

Matches the `Project` interface in `web-wizard-dev-v2/lib/portfolio-data.ts`. Add the screenshot
files first (see "Screenshots to capture" below) and adjust `externalLink` once the domain is live.

```ts
  // Sincewhen
  {
    slug: "sincewhen-recurring-task-pwa",
    title: "Sincewhen — Offline-First Recurring Task App",
    description:
      "An installable, offline-first app that tracks household upkeep by how long it has been since each task was last done.",
    cardDescription:
      "A chore tracker built around time-since-last-done instead of calendar dates. Works offline, installs to the home screen, and keeps all data on the device.",
    fullDescription:
      "Sincewhen is a progressive web app for recurring upkeep: changing filters, cleaning rooms, servicing equipment. Instead of fixed calendar reminders, each task comes due a set interval after it was last actually completed, then stays at the top of the list until it is done. Tasks are organized into locations, rooms and sub-tasks, and color-coded by urgency so the most neglected room stands out. It runs entirely in the browser with no account or server, works offline, and moves between devices through a backup file shared from the phone's share sheet.",
    categories: [PortfolioCategory.App, PortfolioCategory.Mvp],
    technologies: [
      "Next.js",
      "TypeScript",
      "Tailwind CSS",
      "shadcn/ui",
      "Zustand",
      "Zod",
      "TanStack Form",
      "Service Worker (PWA)",
      "Vitest",
      "Vercel",
    ],
    image: "/portfolio_images/sincewhen/due-screen.png",
    additionalImages: [
      "/portfolio_images/sincewhen/room-screen.png",
      "/portfolio_images/sincewhen/rooms-overview.png",
      "/portfolio_images/sincewhen/add-task.png",
      "/portfolio_images/sincewhen/settings-backup.png",
    ],
    externalLink: "https://sincewhen.webwizarddev.com/",
    year: "2026",
    mobileAvailable: true,
    challenges: [
      "Calendar-style reminders fit upkeep badly: a task done late should restart its clock from the day it was done, and '2 months' is not 60 days. Dates also had to survive time zones and daylight saving without shifting by a day.",
      "Ranking had to be fair across very different tasks. Sorting by days overdue buries a neglected daily task under a slightly late yearly one, and coloring rooms by percentage makes a room with one overdue task look worse than a room with three.",
      "With no server, the browser is the database. Safari deletes a site's data after 7 days without a visit, storage can fail or be corrupted, and one bad record could make the whole save file unreadable.",
      "The app had to open and work with no network, including pages the user had never visited, and keep working across deployments without piling up old cached files.",
      "Nested data gets awkward on a phone: folders within folders, tasks that are also folders, and moving or duplicating whole branches without breaking the tree.",
    ],
    solutions: [
      "Modeled time as local calendar dates with calendar arithmetic, never timestamps or day counts. A task's urgency is elapsed time divided by its own interval, which makes every frequency comparable.",
      "Rooms are colored by a count of overdue tasks (a badly neglected task counts double, and a parent task counts once for its sub-tasks), and one function feeds both the room badge and the Due list so they can never disagree.",
      "Treated saved data as untrusted input: every load and every import passes the same schema and tree-integrity checks, every write is validated before it is stored, and unreadable data is preserved and surfaced to the user instead of being silently overwritten.",
      "Wrote a small, readable service worker: pages are network-first, hashed build files are cache-first, and each deployment gets its own cache that replaces the previous one only after it is complete. Every route is static, with the item id in the query string, so one cached page serves every item offline.",
      "Stored the tree as a flat list of nodes linked by parent id, with fractional-index sort keys. Moving an item is a one-field change, the picker offers only legal destinations, and the structure maps directly onto database rows for a future sync layer.",
      "Kept all rules as pure, framework-free functions with 142 unit tests, and verified the real app in a headless browser: full offline use, upgrade between two deployments, backup and restore, and storage failure.",
    ],
    results: [
      "A complete, installable v1 shipped in a weekend: works offline, no account, no backend costs.",
      "All scheduling, ranking and completion rules covered by 142 automated tests; every bug fix landed with a test proven to fail on the old code.",
      "Backup and restore verified on a real iPhone, with a file that moves through Messages, Mail, AirDrop or Files.",
      "20 automated code-review findings triaged: 16 fixed, 4 declined with recorded reasons.",
      "Architecture ready for cloud sync: the storage layer is a single swappable interface and the data model maps 1:1 to database rows.",
    ],
    caseSummary:
      "Sincewhen started from a personal annoyance: reminder apps that nag on a fixed schedule regardless of when the job was really done. The result is a private, offline-first PWA that treats upkeep as things slowly becoming overdue, shows at a glance which room needs attention, and takes data safety seriously even though all of it lives in the browser.",
  },
```

Notes on that entry:

- `client` is left out on purpose: it is a personal project.
- "shipped in a weekend" is true of v1 (2026-09-19 to 20). Drop it if you would rather not date it.
- If you want to be open about the build process, add a line such as "Built in collaboration
  with an AI coding assistant, with every rule covered by tests and every change reviewed."
  That is a selling point for a consultancy, and Reddit readers tend to ask.

## Screenshots to capture

Take them on a phone (or at 390px wide) from an installed copy with realistic data — two
locations, six or so rooms, a mix of green, yellow, red and one long-overdue task.
Save under `web-wizard-dev-v2/public/portfolio_images/sincewhen/`.

| File | Screen | What it should show |
| --- | --- | --- |
| `due-screen.png` | Due tab | A severe task with the "!" on top, a few red and yellow below, room paths visible, location chips |
| `room-screen.png` | A room | Tasks sorted by urgency above sub-rooms, breadcrumb, at least one orange or red sub-room badge |
| `rooms-overview.png` | Folders tab | Several locations or rooms in different colors, including a dark red one |
| `add-task.png` | Add form | Name, "every 2 months", the "last done" choices |
| `settings-backup.png` | Settings | The share and save backup buttons, last-backup line |

## Reddit post draft

Good fits: r/SideProject, r/webdev (Showoff Saturday only), r/PWA, r/selfhosted-adjacent
productivity subs such as r/productivity or r/organization. Read each sub's self-promotion
rules first; several require a flair or a specific day.

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
> - Works offline and installs to your home screen
> - No account, no server, no tracking: your data never leaves your device. You can save or
>   share a backup file and restore it on another phone
>
> Try it: https://sincewhen.webwizarddev.com
>
> Tip: install it (Share > Add to Home Screen on iPhone, menu > Install app on Android).
> Browsers can wipe a site's saved data after a week of not visiting; installed apps are exempt.
>
> I would love feedback on:
>
> 1. Do the colors and ordering match your sense of what is urgent? (A task turns yellow at 80%
>    of its interval and "severe" once it is overdue by half its interval.)
> 2. Is folders-within-folders clear, or is it too much?
> 3. What is missing for you? I am weighing snooze, drag-to-reorder, dark mode, and optional
>    cloud sync.
> 4. Anything that breaks, especially on Android or in Firefox, which I have tested least.
>
> Stack, for the curious: Next.js, TypeScript, Tailwind, Zustand, a hand-written service worker,
> everything stored in localStorage behind a validated schema.

Before posting, make sure of these:

- The custom domain is live and you have moved your own data to it (see the top of this file).
- You have done the real-phone checks still open in `roadmap.md`: offline launch of the
  installed app, the share sheet, and the icon badge. Strangers will find these within the hour.
- Decide where feedback goes. A public GitHub repo with Issues enabled is the least effort; say
  so in the post. If the repo stays private, ask for comments in the thread.
- "Tested least on Android and Firefox" is accurate today: automated checks ran in headless
  Chromium and the only real device was an iPhone. Update the line if that changes.

## Short versions

**Tweet-length:** Sincewhen: a chore tracker that counts time since you last did the thing,
not calendar dates. Rooms turn red as they get neglected. Offline, installable, no account,
data stays on your phone.

**Two sentences:** Sincewhen tracks recurring upkeep by how long it has been since each task was
last done, so a task finished late simply restarts its clock. It organizes tasks by room,
color-codes what is most neglected, works offline as an installable app, and keeps all data on
the device.
