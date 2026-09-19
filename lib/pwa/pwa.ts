// Browser features that make the web app behave like an installed one. Every function here is
// safe to call anywhere: if the browser lacks the feature it quietly does nothing.

/**
 * Starts the service worker (public/sw.js), which lets the app open offline.
 * Production only: in development it would cache pages and hide the code you just changed.
 */
export function registerServiceWorker(): void {
  if (process.env.NODE_ENV !== "production") return;
  if (!("serviceWorker" in navigator)) return;
  navigator.serviceWorker.register("/sw.js").catch((error) => {
    console.error("Service worker registration failed", error);
  });
}

/**
 * Asks the browser not to evict this site's storage when space runs low. Browsers decide on
 * their own whether to grant it (Chrome mostly grants installed apps; Safari rarely says yes),
 * so this is a request, not a guarantee — backups are the real safety net.
 */
export async function requestPersistentStorage(): Promise<boolean> {
  if (!navigator.storage?.persist) return false;
  if (await navigator.storage.persisted()) return true;
  return navigator.storage.persist();
}

/**
 * Shows the overdue count on the home-screen icon, like an unread-mail count. It can only be
 * updated while the app is open; changing it in the background would need push notifications.
 */
export function updateAppBadge(overdueCount: number): void {
  if (!("setAppBadge" in navigator)) return;
  const update = overdueCount > 0 ? navigator.setAppBadge(overdueCount) : navigator.clearAppBadge();
  // Rejects when the app is not installed or permission was refused. Nothing to do about either.
  update.catch(() => {});
}

/** True when running from the home screen rather than in a browser tab. */
export function isInstalled(): boolean {
  const iosStandalone = (navigator as Navigator & { standalone?: boolean }).standalone === true;
  return iosStandalone || window.matchMedia("(display-mode: standalone)").matches;
}
