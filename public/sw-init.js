// sw-init.js  –  Placed in /public, registered by the app.
// This file adds a cache-invalidation listener on top of the generated sw.js.
// It runs before the workbox precache so stale assets never block a new deploy.

const CACHE_VERSION = 'faminance-v3';

self.addEventListener('install', () => {
  // Skip waiting so the new SW activates immediately.
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_VERSION)
          .map((name) => {
            console.log('[SW] Deleting old cache:', name);
            return caches.delete(name);
          })
      )
    ).then(() => self.clients.claim())
  );
});
