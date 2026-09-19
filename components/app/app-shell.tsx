"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense, useEffect, type ReactNode } from "react";
import { FolderTreeIcon, ListChecksIcon, SettingsIcon } from "lucide-react";
import { Toaster } from "@/components/ui/sonner";
import { isOverdue, listAttentionItems } from "@/lib/core";
import { useToday } from "@/lib/hooks/use-today";
import { useTreeIndex } from "@/lib/hooks/use-tree-index";
import { registerServiceWorker, requestPersistentStorage, updateAppBadge } from "@/lib/pwa/pwa";
import { cn } from "@/lib/utils";
import { appStore, useAppStore } from "@/lib/store/use-app-store";
import { NodeSheet } from "./node-sheet";
import { SheetProvider } from "./sheet-context";

const TABS = [
  { href: "/", label: "Due", icon: ListChecksIcon, isActive: (path: string) => path === "/" },
  { href: "/rooms", label: "Rooms", icon: FolderTreeIcon, isActive: (path: string) => path.startsWith("/rooms") },
  { href: "/settings", label: "Settings", icon: SettingsIcon, isActive: (path: string) => path === "/settings" },
];

/** The frame around every screen: loads saved data, then shows the page above a bottom tab bar. */
export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const hasHydrated = useAppStore((state) => state.hasHydrated);
  const loadError = useAppStore((state) => state.loadError);

  // Saved data is read here, after the first render, because the server has no device storage
  // to read from. See `skipHydration` in app-store.ts.
  useEffect(() => {
    void appStore.persist.rehydrate();
    registerServiceWorker();
    void requestPersistentStorage();
  }, []);

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
      <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col">
        {loadError && (
          <div role="alert" className="border-b border-red-300 bg-red-50 p-3 text-sm text-red-900">
            <p className="font-semibold">Your saved data could not be read.</p>
            <p>
              Nothing was deleted: the original was kept on this device as a backup. Reason: {loadError}
            </p>
          </div>
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
      {/* Above the tab bar, so the Undo button is never hidden behind it. */}
      <Toaster position="top-center" />
    </SheetProvider>
  );
}
