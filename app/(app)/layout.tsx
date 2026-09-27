import type { ReactNode } from "react";
import { AppShell } from "@/components/app/app-shell";

/**
 * The app itself: every page in this group gets the tab bar, the saved data and the intro.
 * The folder name in brackets is a route group, so it is not part of any URL. The landing page
 * lives in `(marketing)` instead, without any of this.
 */
export default function AppLayout({ children }: { children: ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
