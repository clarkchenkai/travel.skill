/* Offline cache for a built roadbook. The build fills in the version and precache list. Not registered in dev. */
const VERSION = '__VERSION__';
const PRECACHE = __PRECACHE__;
const CACHE = 'roadbook-' + VERSION;
self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(PRECACHE)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k.startsWith('roadbook-') && k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== self.location.origin) return;
  // Data: network first so edits show up; fall back to cache when offline.
  if (url.pathname.endsWith('travel-data.json')) {
    e.respondWith(fetch(e.request).then((r) => { const copy = r.clone(); caches.open(CACHE).then((c) => c.put(e.request, copy)); return r; }).catch(() => caches.match(e.request)));
    return;
  }
  // Everything else: cache first, then network (and store).
  e.respondWith(caches.match(e.request, {ignoreSearch: true}).then((hit) => hit || fetch(e.request).then((r) => { if (r.ok) { const copy = r.clone(); caches.open(CACHE).then((c) => c.put(e.request, copy)); } return r; })));
});
