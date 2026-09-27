#!/usr/bin/env node
/**
 * Seeds a Chrome profile with the app's example tasks, so Lighthouse can measure the app screens
 * WITH data. lh-run.mjs cannot do this: it carries cookies only, and the app keeps everything in
 * localStorage. Lighthouse then launches Chrome on this profile and is told not to clear storage.
 *
 * Needs Playwright, which is not a dependency of this repo (same as landing-screenshots.mjs):
 *   pnpm add -D playwright            # temporarily
 *
 *   node scripts/pagespeed/seed-profile.mjs <profileDir> <light|dark> [origin]
 *     → prints {"room": "<id>", "task": "<id>", "total": 19}
 *   npx -y lighthouse@12 "<origin>/due" --disable-storage-reset \
 *     --chrome-flags="--headless=new --user-data-dir=<profileDir>" --output=json --output-path=due.json
 *
 * The room is the one holding the most items; the task is one with sub-tasks. Use them as
 * `/rooms?id=<room>` and `/rooms?id=<task>`. Attaching Lighthouse to a Chrome that Playwright
 * still holds (`--port`) hung on Chrome 154, which is why the profile is closed first.
 */
import { chromium } from "playwright";

const [profile, theme, origin = "http://127.0.0.1:3471"] = process.argv.slice(2);
if (!profile || !["light", "dark"].includes(theme)) {
  console.error("usage: seed-profile.mjs <profileDir> <light|dark> [origin]");
  process.exit(1);
}

const context = await chromium.launchPersistentContext(profile, {
  executablePath: process.env.CHROME_PATH ?? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  headless: true,
});
const page = context.pages()[0] ?? (await context.newPage());
await page.goto(`${origin}/rooms`, { waitUntil: "networkidle" });
// Without this the first-launch intro covers every screen.
await page.evaluate(() => localStorage.setItem("sincewhen:intro-dismissed", "1"));
await page.reload({ waitUntil: "networkidle" });
const hasData = await page.evaluate(() => (JSON.parse(localStorage.getItem("sincewhen") ?? "null")?.state?.data?.nodes?.length ?? 0) > 0);
if (!hasData) {
  await page.getByRole("button", { name: "Start with examples" }).first().click();
  await page.waitForTimeout(500);
}
await page.evaluate(
  (chosen) => localStorage.setItem("sincewhen:display", JSON.stringify({ theme: chosen, size: "default", startOn: "folders" })),
  theme,
);
const ids = await page.evaluate(() => {
  const { nodes } = JSON.parse(localStorage.getItem("sincewhen")).state.data;
  const childCount = (id) => nodes.filter((node) => node.parentId === id).length;
  const room = nodes.filter((node) => !node.frequency && node.parentId).sort((a, b) => childCount(b.id) - childCount(a.id))[0];
  const task = nodes.filter((node) => node.frequency).find((node) => childCount(node.id) > 0);
  return { room: room.id, task: task.id, total: nodes.length };
});
console.log(JSON.stringify(ids));
await context.close();
