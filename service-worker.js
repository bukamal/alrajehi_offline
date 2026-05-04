const CACHE_NAME = 'alrajhi-offline-v2';
const urlsToCache = [
  '/alrajehi_offline/',
  '/alrajehi_offline/index.html',
  '/alrajehi_offline/style.css',
  '/alrajehi_offline/manifest.json',
  '/alrajehi_offline/icons/icon-192.png',
  '/alrajehi_offline/icons/icon-512.png',
  '/alrajehi_offline/js/db.js',
  '/alrajehi_offline/js/api-offline.js',
  '/alrajehi_offline/js/auth.js',
  '/alrajehi_offline/js/sync.js',
  '/alrajehi_offline/js/app-offline.js'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    caches.match(event.request).then(cached => {
      const fetchPromise = fetch(event.request).then(response => {
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      }).catch(() => cached);
      return cached || fetchPromise;
    })
  );
});
