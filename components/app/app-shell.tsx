"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense, useEffect, type ReactNode } from "react";
import { FolderTreeIcon, ListChecksIcon, SettingsIcon } from "lucide-react";
import { Toaster } from "@/components/ui/sonner";
import { isOverdue, listAttentionItems } from "@/lib/core";
import { useDisplaySettings } from "@/lib/hooks/use-display-settings";
import { useToday } from "@/lib/hooks/use-today";
import { useTreeIndex } from "@/lib/hooks/use-tree-index";
import { registerServiceWorker, updateAppBadge } from "@/lib/pwa/pwa";
import { cn } from "@/lib/utils";
import { appStore, useAppStore } from "@/lib/store/use-app-store";
import { Intro, showIntroOnLaunch } from "./intro";
import { NodeSheet } from "./node-sheet";
import { SheetProvider } from "./sheet-context";

const TABS = [
  { href: "/due", label: "Due", icon: ListChecksIcon, isActive: (path: string) => path === "/due" },
  { href: "/rooms", label: "Folders", icon: FolderTreeIcon, isActive: (path: string) => path.startsWith("/rooms") },
  { href: "/settings", label: "Settings", icon: SettingsIcon, isActive: (path: string) => path === "/settings" },
];

/**
 * The frame around every app screen: loads saved data, then shows the page above a bottom tab bar.
 * The landing page (/about) has its own layout in app/(marketing).
 */
export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const hasHydrated = useAppStore((state) => state.hasHydrated);
  const loadError = useAppStore((state) => state.loadError);
  const hasUnreadableBackup = useAppStore((state) => state.hasUnreadableBackup);
  const { theme } = useDisplaySettings();

  // Saved data is read here, after the first render, because the server has no device storage
  // to read from. See `skipHydration` in app-store.ts.
  useEffect(() => {
    void appStore.persist.rehydrate();
    registerServiceWorker();
  }, []);

  // The intro decides whether to open only once saved data has loaded: its last page offers the
  // examples, which only make sense on an empty app.
  useEffect(() => {
    if (hasHydrated) showIntroOnLaunch();
  }, [hasHydrated]);

  // Keep the number on the home-screen icon in step with what the Due tab would show for all
  // locations. `today` is included so the count rolls over when a new day starts.
  const index = useTreeIndex();
  const today = useToday();
  useEffect(() => {
    if (!hasHydrated) return;
    const overdue = listAttentionItems(index, null, today).filter((item) => isOverdue(item.timing.status));
    updateAppBadge(overdue.length);
  }, [hasHydrated, index, today]);

  return (
    <SheetProvider>
      {/* `viewportFit: "cover"` lets the page run under the status bar and notch, so the top needs
          the same safe-area padding the tab bar has at the bottom. It is 0 where not needed. */}
      {/* Phone width by default. Wider screens get more room, which the lists fill with columns
          (see ROW_LIST); 64rem stops lines getting too long to read on a desktop. */}
      <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col pt-[env(safe-area-inset-top)] sm:max-w-5xl">
        {(loadError || hasUnreadableBackup) && (
          <Link href="/settings" role="alert" className="block border-b border-red-300 bg-red-50 p-3 text-sm text-red-900 dark:border-red-800 dark:bg-red-950 dark:text-red-100">
            <p className="font-semibold">Some saved data could not be read.</p>
            <p>
              Nothing was deleted: the original was kept on this device.
              {loadError && ` Reason: ${loadError}`} <span className="underline">Open Settings to save it.</span>
            </p>
          </Link>
        )}

        {/* Until saved data has loaded, `data` is the empty default. Showing a page now would
            flash "nothing here yet" at someone who has tasks. */}
        <main className="flex-1 px-4 pt-4 pb-24">{hasHydrated ? children : null}</main>

        <nav className="fixed inset-x-0 bottom-0 z-40 border-t bg-background pb-[env(safe-area-inset-bottom)]">
          <div className="mx-auto flex max-w-md">
            {TABS.map(({ href, label, icon: Icon, isActive }) => (
              <Link
                key={href}
                href={href}
                aria-current={isActive(pathname) ? "page" : undefined}
                className={cn(
                  "flex flex-1 flex-col items-center gap-0.5 py-2 text-xs",
                  isActive(pathname) ? "font-semibold text-foreground" : "text-muted-foreground",
                )}
              >
                <Icon className="size-5" />
                {label}
              </Link>
            ))}
          </div>
        </nav>
      </div>

      {/* The sheet reads the URL's query string, which needs a Suspense boundary (see rooms/page). */}
      <Suspense>
        <NodeSheet />
      </Suspense>
      <Intro />
      {/* At the top, so the Undo button is never hidden behind the tab bar. The toast colors follow
          the app's own choice, not only the device's. */}
      <Toaster position="top-center" theme={theme} />
    </SheetProvider>
  );
}
