"use client";

import { useState, useSyncExternalStore } from "react";
import { XIcon } from "lucide-react";
import { isInstalled } from "@/lib/pwa/pwa";

const DISMISSED_KEY = "sincewhen:install-hint-dismissed";

// Whether the app is installed never changes while it is open, so there is nothing to subscribe to.
const subscribeToNothing = () => () => {};

function wasDismissed(): boolean {
  try {
    return window.localStorage.getItem(DISMISSED_KEY) === "1";
  } catch {
    return false;
  }
}

/**
 * A one-time nudge to install the app, shown only in a browser tab.
 *
 * Installing is not cosmetic here: Safari deletes a site's saved data after 7 days without a
 * visit, and an installed app is exempt. iOS offers no install button a page can trigger, so
 * the hint has to describe the Share-menu steps instead.
 */
export function InstallHint() {
  // useSyncExternalStore reads a browser-only value without a server/client mismatch: the
  // server (third argument) assumes "hide it", and the browser corrects that after loading.
  const shouldHide = useSyncExternalStore(
    subscribeToNothing,
    () => isInstalled() || wasDismissed(),
    () => true,
  );
  const [dismissedNow, setDismissedNow] = useState(false);
  if (shouldHide || dismissedNow) return null;

  const dismiss = () => {
    setDismissedNow(true);
    try {
      window.localStorage.setItem(DISMISSED_KEY, "1");
    } catch {
      // Storage unavailable: the hint will simply come back next time.
    }
  };

  return (
    <aside className="flex items-start gap-2 rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-950">
      <div className="flex-1">
        <p className="font-semibold">Install Sincewhen to keep your data safe</p>
        <p>
          In a browser tab, your phone may erase saved tasks after a week away. On iPhone: tap Share,
          then &ldquo;Add to Home Screen&rdquo;. On Android: open the menu, then &ldquo;Install
          app&rdquo;. Then use the app from its icon.
        </p>
      </div>
      <button type="button" aria-label="Dismiss" onClick={dismiss} className="-m-1 p-2">
        <XIcon className="size-4" />
      </button>
    </aside>
  );
}
