const CACHE_NAME = 'teachers-management-system-v5';
const ASSETS = [
  '/',
  '/index.html',
  '/favicon.svg',
  '/icon-192.png',
  '/icon-512.png',
  '/apple-touch-icon.png'
];

self.addEventListener('install', (e) => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
});

// Drop older caches so installed apps stop serving previous versions.
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('push', (e) => {
  const data = e.data ? e.data.json() : {};
  e.waitUntil(
    self.registration.showNotification(data.title || '', {
      body: data.body || '',
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      data: { url: data.url || '/notifications' },
    })
  );
});

self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  const url = e.notification.data?.url || '/notifications';
  e.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windows) => {
      const open = windows[0];
      if (open) {
        open.navigate(url);
        return open.focus();
      }
      return self.clients.openWindow(url);
    })
  );
});

const NETWORK_WAIT = 3000;

async function openApp(e) {
  const network = fetch(e.request).then((response) => {
    if (response.ok) {
      const copy = response.clone();
      caches.open(CACHE_NAME).then((cache) => cache.put('/index.html', copy));
    }
    return response;
  });
  e.waitUntil(network.catch(() => {}));

  // Use the latest page if it arrives quickly, otherwise open the saved one.
  // The newer page is saved for next time either way.
  const fallback = new Promise((resolve) => setTimeout(resolve, NETWORK_WAIT))
    .then(async () => (await caches.match('/index.html')) || network);
  try {
    return await Promise.race([network, fallback]);
  } catch {
    return (await caches.match('/index.html')) || Response.error();
  }
}

// Built files have unique names, so a saved copy is always correct.
async function openAsset(request) {
  const saved = await caches.match(request);
  if (saved) return saved;
  const response = await fetch(request);
  if (response.ok) {
    const copy = response.clone();
    caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
  }
  return response;
}

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== self.location.origin) return;

  if (e.request.mode === 'navigate') {
    e.respondWith(openApp(e));
  } else if (url.pathname.startsWith('/assets/')) {
    e.respondWith(openAsset(e.request));
  } else {
    e.respondWith(caches.match(e.request).then((res) => res || fetch(e.request)));
  }
});
