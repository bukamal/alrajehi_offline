const CACHE_NAME = 'alrajhi-offline-v7';
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
  BASE_PATH + 'js/accounting.js',
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

// Share Target Handler
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  if (event.request.method === 'POST' && url.searchParams.has('share-target')) {
    event.respondWith(handleShareTarget(event.request));
    return;
  }

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

async function handleShareTarget(request) {
  try {
    const formData = await request.formData();
    const files = formData.getAll('import_files');

    if (files.length === 0) {
      return Response.redirect(BASE_PATH + '?share-error=no-files', 303);
    }

    const fileData = [];
    for (const file of files) {
      const arrayBuffer = await file.arrayBuffer();
      fileData.push({
        name: file.name,
        type: file.type || 'application/octet-stream',
        size: file.size,
        data: Array.from(new Uint8Array(arrayBuffer))
      });
    }

    await storeSharedFiles(fileData);

    return Response.redirect(BASE_PATH + '?share-import=pending', 303);

  } catch (e) {
    console.error('[SW] Share target failed:', e);
    return Response.redirect(BASE_PATH + '?share-error=' + encodeURIComponent(e.message), 303);
  }
}

async function storeSharedFiles(fileData) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('AlrajhiSharedFiles', 1);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('files')) {
        db.createObjectStore('files', { keyPath: 'id' });
      }
    };

    request.onsuccess = (event) => {
      const db = event.target.result;
      const tx = db.transaction('files', 'readwrite');
      const store = tx.objectStore('files');

      store.put({
        id: 'pending_import',
        files: fileData,
        timestamp: Date.now()
      });

      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    };

    request.onerror = () => reject(request.error);
  });
}
