// Makes the phone screenshots on the landing page (public/landing/*.png), in light and dark.
//
// It drives the real app: an empty app, "Start with examples", then the Folders, Home and Due
// screens. The examples are dated relative to today, so the colours always look the same.
//
// Needs Playwright, which is not a dependency of the app. To run:
//   pnpm build && pnpm start --port 3462            (a production build: no dev overlay)
//   pnpm dlx playwright install chromium            (once)
//   pnpm add -D playwright && node scripts/landing-screenshots.mjs http://localhost:3462
//   pnpm remove playwright                          (if you do not want to keep it)
import { chromium } from "playwright";

const base = process.argv[2] ?? "http://localhost:3462";
const out = new URL("../public/landing/", import.meta.url).pathname;

const browser = await chromium.launch();
for (const theme of ["light", "dark"]) {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  });
  await context.addInitScript((theme) => {
    // Skip the intro and the install hint, and pin the look.
    localStorage.setItem("sincewhen:intro-dismissed", "1");
    localStorage.setItem("sincewhen:install-hint-dismissed", "1");
    localStorage.setItem("sincewhen:display", JSON.stringify({ theme, size: "default", startOn: "folders" }));
  }, theme);
  const page = await context.newPage();

  await page.goto(`${base}/rooms`, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Start with examples" }).click();
  // Reload so the "Examples added" toast is gone.
  await page.reload({ waitUntil: "networkidle" });
  await page.screenshot({ path: `${out}folders-${theme}.png` });

  await page.getByRole("link", { name: "Home" }).click();
  await page.waitForURL(/id=/);
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${out}room-${theme}.png` });

  await page.getByRole("navigation").getByRole("link", { name: "Due" }).click();
  await page.waitForURL(/\/due/);
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${out}due-${theme}.png` });

  await context.close();
}
await browser.close();
console.log(`Saved 6 screenshots to ${out}`);
