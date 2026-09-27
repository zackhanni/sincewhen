# Sincewhen — roadmap

Open work only. Finished phases and features are in [changelog.md](changelog.md). When this file
and another doc disagree about status, this file wins.

## Next steps

After PR #8 (`skill-pass`) is merged and deployed:

- [x] `git switch main && git pull` (local `main` matches GitHub, checked 2026-09-27).
- [x] The old address forwards: `curl -sI https://sincewhen-ruby.vercel.app/rooms` shows 308 to
      `https://sincewhen.webwizarddev.com/rooms` (checked 2026-09-27).
- [x] `https://sincewhen.webwizarddev.com/about` answers 200 with its canonical link (checked
      2026-09-27).
- [x] Settings > About shows the commit's date, not the build day, so git is available in Vercel's
      build (live `2026.9.26` for a build made 2026-09-27 UTC; see pwa.md).
- [ ] **Confirm the merge deploys as Production by itself.** From 2026-09-24 every merge to `main`
      deployed as Preview until 8370aa7 was promoted by hand on 2026-09-27. Vercel keeps the
      production branch under Settings → Environments → Production → Branch Tracking, not under
      Git. Check: `gh api repos/zackhanni/sincewhen/deployments --jq '.[0] | .environment'`.
- [ ] The security headers and Content-Security-Policy answer on the live site:
      `curl -sI https://sincewhen.webwizarddev.com/` (docs/security-audit.md).
- [ ] Re-measure accessibility on the live site, light and dark, with tasks loaded. Measured
      2026-09-27 on a local production build: 100 on 8 screens (docs/pagespeed-audit.md).
- [ ] Submit `https://sincewhen.webwizarddev.com/sitemap.xml` in Google Search Console, and check
      `/about` in the Rich Results Test and a link-preview tool (docs/seo.md).
- [ ] Open the installed app once with internet so it picks up the new version, then work through
      "Still to verify on a real phone" and "Still to decide or check" below.

## Launch (owner: Zack)

- [ ] Add the entry and 5 screenshots to the `/portfolio` page of `web-wizard-dev-v2`. Refresh
      the write-up first (`/portfolio-writeup`): round 2, the landing page and the skill pass are
      not in it, and the draft in `ai-skills/knowledge/repos/sincewhen/` still describes v1.
- [ ] Reddit post for outside testers, after the phone checks below. Link `/about`.

## Still to verify on a real phone

Headless Chromium cannot exercise these, so they are built but unproven:

- [ ] Install from Safari, launch from the icon, relaunch in airplane mode.
- [ ] "Share backup" opens the iOS share sheet and the file arrives in Messages / Files. Also
      under the Content-Security-Policy, once it is live.
- [x] "Save backup file" then "Choose a backup file" on an iPhone: saves to Files, the picker
      opens where it was saved, and the restore works (2026-09-19). A second device is untested.
- [ ] The overdue count shows on the home-screen icon. Expected to fail as built: iOS shows a
      web app's badge only after notification permission, which the app never asks for, and
      Chrome on Android doesn't support badges (see `pitfalls.md`). Needs a permission prompt
      first. The app icon itself is a placeholder until a new one is designed.

## Still to decide or check (Zack)

- [ ] Folders or Due as the default start screen: Zack is testing with other users. The choice
      is in Settings; the default is `DEFAULT_DISPLAY_SETTINGS.startOn` in `lib/display`.
- [ ] The intro and Settings say the app works without internet. Proven in a headless browser;
      confirm with the airplane-mode check under "Still to verify on a real phone".
- [ ] The edge swipe on a real iPhone, in the installed app. If iOS ever adds its own back
      swipe to home-screen apps, both would fire and this one should go.
- [ ] Tab name: "Folders" for now. "All" was the first idea but clashes with the "All" chip on
      the Due tab.
- [ ] On the iPhone: the status bar in dark mode in the installed app (`layout.tsx` sets
      `statusBarStyle: "default"`; untested in dark), Large size, the intro, and the install
      steps as written.
- [ ] On the iPad: the two-column layout, portrait and landscape, and the install steps there.
- [ ] Edit the example list in `lib/core/examples.ts` if it should differ.

## Landing page

Details and open questions: [landing-page.md](landing-page.md).

- [ ] Decide where it lives: `/about`, the front door for first-time visitors, or its own domain.
- [ ] Design pass (Claude Design) and a real logo.
- [ ] Testimonials, once testers have given quotes and permission.

## Future additions (not v1)

- **Sharing.** Share the whole account, or only chosen rooms, with another person (household
  chores, for example). Show who completed a task, not only when. Later, perhaps a history of
  who has been doing what. Needs Supabase sync and login first; each completion log entry would
  gain a `completedBy` field.
- **Supabase sync and login.** Implement the storage interface against a `nodes` table (one row
  per node, plus `user_id`). Add TanStack Query for the sync layer at that point.
- **Push notifications.** Needs a server: Supabase + a cron job + Web Push. On iOS, web push
  only works for an installed PWA.
- **GPS location switching.** Store coordinates on a location and switch the active location
  when the device is near it. Needs a permission prompt and a manual override.
- **A designed app icon.** The current one is a placeholder drawn in `app/icon.svg`; the PNGs in
  `public/icons` and `app/apple-icon.png` were rendered from it and must be re-rendered together.
- **An "update available" prompt.** A new deploy is picked up on the next launch; there is no
  in-app notice yet.
- **Automated browser tests.** Phase 3 was checked with a throwaway Playwright script; a
  committed e2e suite would make that repeatable.
- **Drag to reorder.** The `sortOrder` field is already a fractional-indexing key; only the drag
  UI is missing.
- **Snooze** a task without completing it.
- **History view** and frequency suggestions from the completion log.
- **Less JavaScript on the app screens.** Two options need a decision, with measured costs, in
  docs/pagespeed-audit.md → "Needs a decision": `zod/mini` in `lib/core`, and loading the add /
  edit sheet only when it opens.
- **Room for the completion log to grow.** The log only grows (~118 saved characters per
  completion) and the browser gives the site about 5.24 million characters in all (measured in
  Chrome). About 40,000 completions fill it beside ~300 items: 4-5 years of heavy use (10 daily
  tasks plus 100 weekly), 15+ of typical use. The app warns at 4 million characters and says
  plainly when saving fails, but nothing in it can free space. Options: a compact log format
  (schema v2 with a migration; `batchId` is only needed for undo, so roughly 9 times the room),
  or IndexedDB, likely together with Supabase sync. Either changes the saved and backup format:
  old backups must still import. See `docs/scaling-and-algorithm-audit.md`.

  **Decided 2026-09-26: leave the log alone until the history view is built, then choose the
  rule it needs.** Trimming now would delete history before anything uses it, and cannot be
  undone. Options weighed:
  - *Keep the last N per task* (about 20): a good cap. Storage is bounded for good (300 tasks x
    20 is about 13% of the limit), every task keeps enough intervals for frequency suggestions,
    and undo only needs the newest entry.
  - *Keep the last N overall*: rejected. One daily task pushes every other task out in weeks.
  - *Keep the last 90 days or 1 year*: rejected. It deletes the history of rare tasks (a yearly
    task has one entry at most), the ones people most need reminding about, while keeping
    hundreds of entries for daily tasks.
  - *Compact format*: loses nothing and gives about 9 times the room; can combine with a
    per-task cap.
  - *Longer history as a paid tier*: only meaningful once data lives on Supabase; on the device
    a limit just deletes the user's own data. The data is tiny even on a server (a heavy user
    adds about 1 MB a year), so sharing, multiple users and push notifications are more natural
    paid features.
- **Templates** for common rooms. Until then, duplicate a subtree and edit the frequencies.
- **Merge on import** instead of replace.
