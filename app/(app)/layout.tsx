import type { Metadata } from "next";
import type { ReactNode } from "react";
import { AppShell } from "@/components/app/app-shell";

/**
 * The app itself: every page in this group gets the tab bar, the saved data and the intro.
 * The folder name in brackets is a route group, so it is not part of any URL. The landing page
 * lives in `(marketing)` instead, without any of this.
 */
/**
 * Kept out of search results. To a search engine these screens are empty (everything renders from
 * the saved data on the device), and they share one title, so only the landing page (/about) is
 * meant to be found. `follow` still lets a crawler walk the links on them.
 */
export const metadata: Metadata = { robots: { index: false, follow: true } };

export default function AppLayout({ children }: { children: ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
