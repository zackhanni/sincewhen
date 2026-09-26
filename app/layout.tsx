import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AppShell } from "@/components/app/app-shell";
import { DISPLAY_SETTINGS_SCRIPT } from "@/lib/display/display-settings";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
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
  // The browser bar colour. Light here; switched to dark on the device by applyDisplaySettings.
  themeColor: "#ffffff",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      // The script below adds the theme and size to <html> before React loads, so the server's
      // HTML and the page React finds differ on purpose. This tells React to accept that.
      suppressHydrationWarning
    >
      <head>
        {/* Applies this device's theme and size before the first paint: no white flash in dark mode. */}
        <script dangerouslySetInnerHTML={{ __html: DISPLAY_SETTINGS_SCRIPT }} />
      </head>
      <body className="min-h-full flex flex-col">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
