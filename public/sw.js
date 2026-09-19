// Sincewhen service worker: makes the app open with no network.
//
// Hand-written on purpose. The app is a few static pages and needs only three rules, which is
// easier to read and debug than a generated worker. If the app outgrows this (many routes, push
// notifications, background sync), switch to Serwist — see docs/pwa.md.
//
// This file is plain JavaScript served as-is from /public: it is not bundled or type-checked.

// One cache per deployment. The page registers this file as `/sw.js?v=<build id>` (see
// lib/pwa/pwa.ts), so every deploy looks like a new worker to the browser: it installs, fills a
// fresh cache, and `activate` deletes the old one. Without this, build files from every past
// deploy would pile up in a single cache for the life of the install, until the browser's quota
// ran out. The old cache is only deleted after the new one is complete, so an update that fails
// halfway (say, the network drops) leaves the working version in place.
const BUILD_ID = new URL(self.location.href).searchParams.get("v") ?? "dev";
const CACHE = `sincewhen-${BUILD_ID}`;

// Every page of the app. `/rooms` serves every item (`/rooms?id=...`), see lib/routes.ts.
const PAGES = ["/", "/rooms", "/settings"];

// --- install: download the pages and the files they need, before the worker takes over -------
self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE);
      await Promise.all(PAGES.map((page) => cachePageWithAssets(cache, page)));
      // Take over straight away instead of waiting for every open tab to close.
      await self.skipWaiting();
    })(),
  );
});

/**
 * Caches a page plus the scripts, styles and fonts its HTML refers to. Without this the first
 * offline launch would find the HTML but none of the JavaScript: those files were downloaded
 * before this worker existed, so it never saw them go by.
 */
async function cachePageWithAssets(cache, page) {
  const response = await fetch(page, { cache: "reload" });
  if (!response.ok) throw new Error(`Could not fetch ${page}: ${response.status}`);
  const html = await response.clone().text();
  await cache.put(page, response);

  const assetUrls = new Set(html.match(/\/_next\/static\/[^"'\\ )]+/g) ?? []);
  // One missing asset must not fail the whole install; it will be cached on first use instead.
  await Promise.allSettled([...assetUrls].map((url) => cache.add(url)));
}

// --- activate: clear out caches left by older versions of this file --------------------------
self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const names = await caches.keys();
      await Promise.all(names.filter((name) => name !== CACHE).map((name) => caches.delete(name)));
      await self.clients.claim();
    })(),
  );
});

// --- fetch: decide, per request, between the network and the cache ---------------------------
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);
  if (request.method !== "GET" || url.origin !== self.location.origin) return;

  // Rule 1 — opening a page: try the network so a new deploy shows up, fall back to the cache.
  if (request.mode === "navigate") {
    event.respondWith(pageFromNetworkThenCache(request, url));
    return;
  }

  // Rule 2 — build files: their names contain a content hash, so a cached copy is never stale.
  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(fromCacheThenNetwork(request));
    return;
  }

  // Rule 3 — icons and the manifest: network first, cache as the fallback.
  if (url.pathname.startsWith("/icons/") || url.pathname === "/manifest.webmanifest") {
    event.respondWith(fromNetworkThenCache(request));
  }

  // Everything else is left to the browser. That includes Next.js' in-app navigation requests
  // (`?_rsc=`): offline they fail, Next.js falls back to a full page load, and Rule 1 answers it.
});

async function pageFromNetworkThenCache(request, url) {
  const cache = await caches.open(CACHE);
  // Pages are stored by path alone, so `/rooms?id=abc` is answered by the one `/rooms` page.
  const key = PAGES.includes(url.pathname) ? url.pathname : null;
  try {
    const response = await fetch(request);
    if (response.ok && key) await tryToCache(cache, key, response.clone());
    return response;
  } catch (error) {
    const cached = key ? await cache.match(key) : await cache.match("/");
    if (cached) return cached;
    throw error;
  }
}

/**
 * Saving to the cache is a bonus, never a requirement. `cache.put` rejects when storage is full;
 * letting that escape would fail a request whose network fetch had already succeeded.
 */
async function tryToCache(cache, key, response) {
  try {
    await cache.put(key, response);
  } catch (error) {
    console.warn("Sincewhen could not cache", key, error);
  }
}

async function fromCacheThenNetwork(request) {
  const cache = await caches.open(CACHE);
  const cached = await cache.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok) await tryToCache(cache, request, response.clone());
  return response;
}

async function fromNetworkThenCache(request) {
  const cache = await caches.open(CACHE);
  try {
    const response = await fetch(request);
    if (response.ok) await tryToCache(cache, request, response.clone());
    return response;
  } catch (error) {
    const cached = await cache.match(request);
    if (cached) return cached;
    throw error;
  }
}
