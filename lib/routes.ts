/**
 * The URL of an item's screen. null is the top of the tree, the list of locations.
 *
 * The id travels in the query string (`/rooms?id=abc`) rather than the path (`/rooms/abc`) on
 * purpose. A path segment would make the route dynamic, so the server would render a different
 * page per id. With a query string there is exactly ONE static `/rooms` page for every item,
 * and the service worker can keep that one page for offline use. Items live on the device, so
 * the server never had anything to render per id anyway.
 */
export function roomHref(id: string | null): string {
  return id === null ? "/rooms" : `/rooms?id=${encodeURIComponent(id)}`;
}

/** The screen for each "Open the app on" choice in Settings. See app/page.tsx. */
export const START_SCREEN_HREF = { folders: "/rooms", due: "/due" } as const;
