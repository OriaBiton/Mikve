const cacheName = 'site-static-v1.1';
const assets = [
  '/',
  '/index.html'
];

//install service serviceWorker
self.addEventListener('install', e => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(cacheName).then(cache => {
      console.log('caching shell assets');
      cache.addAll(assets);
    })
  );
});
// Activated event
self.addEventListener('activate', e => {
  e.waitUntil(
    clients.claim().then(() => {
      caches.keys().then(keys => {
        return Promise.all(keys
          .filter(key => key !== cacheName)
          .map(key => caches.delete(key))
        )
      })
    })
  )
});
// Fetch event
self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(cacheRes => {
      return cacheRes || fetch(e.request);
    })
  )
});

self.addEventListener('notificationclose', event => {
  const notification = event.notification;
  const primaryKey = notification.data.primaryKey;

  console.log('Closed notification: ' + primaryKey);
});

self.addEventListener('notificationclick', event => {
  const notification = event.notification;
  const action = event.action;
  if (action === 'close') notification.close();
  else {
    clients.openWindow('./index.html');
    notification.close();
  }
});
