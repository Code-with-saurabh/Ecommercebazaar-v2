/* Bazaar service worker
 *
 * Strategy
 *  - Navigations ......... network first, cached app shell when offline
 *  - /assets/* (hashed) .. cache first - the file name changes when content
 *                           changes, so these are immutable
 *  - everything else ..... stale-while-revalidate
 *  - cross-origin (API) ... never cached here; the app handles that itself
 *
 * Bump VERSION to invalidate every cache at once.
 */
const VERSION = 'bazaar-v1';
const STATIC_CACHE = `${VERSION}-static`;
const RUNTIME_CACHE = `${VERSION}-runtime`;
const PRECACHE = ['/', '/index.html', '/favicon3.ico', '/manifest.json'];

self.addEventListener('install', event => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then(cache => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches
      .keys()
      .then(keys => Promise.all(keys.filter(key => !key.startsWith(VERSION)).map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      // Every navigation returns the app shell - keep it fresh in the cache
      const cache = await caches.open(RUNTIME_CACHE);
      await cache.put('/index.html', response.clone());
    }
    return response;
  } catch (err) {
    const cached = await caches.match('/index.html');
    if (cached) return cached;
    throw err;
  }
}

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok) {
    const cache = await caches.open(STATIC_CACHE);
    await cache.put(request, response.clone());
  }
  return response;
}

async function staleWhileRevalidate(request) {
  const cached = await caches.match(request);
  const network = fetch(request)
    .then(async response => {
      if (response.ok) {
        const cache = await caches.open(RUNTIME_CACHE);
        await cache.put(request, response.clone());
      }
      return response;
    })
    .catch(() => cached);
  return cached || network;
}

self.addEventListener('fetch', event => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return; // API + third parties: network only

  if (request.mode === 'navigate') {
    event.respondWith(networkFirst(request));
    return;
  }
  if (url.pathname.startsWith('/assets/')) {
    event.respondWith(cacheFirst(request));
    return;
  }
  event.respondWith(staleWhileRevalidate(request));
});
