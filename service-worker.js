const CACHE_NAME = 'alrajhi-offline-v5';
const BASE_PATH = self.location.pathname.replace(/service-worker\.js$/, '');

const urlsToCache = [
  BASE_PATH,
  BASE_PATH + 'index.html',
  BASE_PATH + 'style.css',
  BASE_PATH + 'manifest.json',
  BASE_PATH + 'icons/icon-192.png',
  BASE_PATH + 'icons/icon-512.png',
  BASE_PATH + 'js/app.js',
  BASE_PATH + 'js/constants.js',
  BASE_PATH + 'js/utils.js',
  BASE_PATH + 'js/db.js',
  BASE_PATH + 'js/units.js',
  BASE_PATH + 'js/items.js',
  BASE_PATH + 'js/invoices.js',
  BASE_PATH + 'js/payments.js',
  BASE_PATH + 'js/expenses.js',
  BASE_PATH + 'js/reports.js',
  BASE_PATH + 'js/navigation.js',
  BASE_PATH + 'js/generic.js',
  BASE_PATH + 'js/accounting.js',          // <-- السطر الجديد
  'https://fonts.googleapis.com/css2?family=Tajawal:wght@300;400;500;700;800;900&display=swap',
  'https://unpkg.com/dexie@3.2.4/dist/dexie.min.js'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(urlsToCache).catch(err => {
        console.warn('[SW] Some resources failed to cache:', err);
        return Promise.resolve();
      });
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  
  event.respondWith(
    caches.match(event.request).then(cached => {
      const fetchPromise = fetch(event.request)
        .then(response => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(event.request, clone);
            });
          }
          return response;
        })
        .catch(() => {
          return cached;
        });
      
      return cached || fetchPromise;
    })
  );
});
