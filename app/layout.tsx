import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import { DisplaySettingsSync } from "@/components/app/display-settings-sync";
import { BAR_COLOR, DISPLAY_SETTINGS_SCRIPT } from "@/lib/display/display-settings";
import { SITE_URL } from "@/lib/site";
import "./globals.css";

// Only the sans face is loaded. Nothing uses a monospace font, and next/font preloads every face
// it is given on every page, so a mono face here would be downloaded for nothing (see
// docs/pagespeed-audit.md). `font-mono` falls back to Tailwind's system monospace stack.
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  // Makes relative metadata URLs (canonical, link previews) absolute on the real address, even
  // when the page is served from a preview deployment.
  metadataBase: new URL(SITE_URL),
  title: "Sincewhen",
  description: "Recurring tasks that come due based on when you last did them.",
  // Makes iOS open the installed app full-screen, with the name shown under its icon.
  appleWebApp: { capable: true, title: "Sincewhen", statusBarStyle: "default" },
};

// `viewportFit: "cover"` lets the page run under the iPhone home indicator, which is what makes
// `env(safe-area-inset-bottom)` on the tab bar report a real value.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  // The browser bar color. Light here; switched to dark on the device by applyDisplaySettings.
  themeColor: BAR_COLOR.light,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} h-full antialiased`}
      // The script below adds the theme and size to <html> before React loads, so the server's
      // HTML and the page React finds differ on purpose. This tells React to accept that.
      suppressHydrationWarning
    >
      <head>
        {/* Applies this device's theme and size before the first paint: no white flash in dark mode. */}
        <script dangerouslySetInnerHTML={{ __html: DISPLAY_SETTINGS_SCRIPT }} />
      </head>
      {/* The app's tab bar and data live in app/(app)/layout.tsx; the landing page in (marketing). */}
      <body className="min-h-full flex flex-col">
        <DisplaySettingsSync />
        {children}
      </body>
    </html>
  );
}
