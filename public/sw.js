const cacheName = 'site-static-v1';
const assets = [
  '/',
  '/index.html',
  '/styles.css',
  '/script.js',
  '/assets/notyf/notyf.min.js',
  '/assets/js/auth.js',
  '/assets/js/database.js',
  '/assets/js/helper.js',
  '/assets/js/map.js',
  '/assets/js/render.js',
  '/assets/js/validate.js',
  '/assets/js/listeners.js',
  'assets/components/appartment-button.js',
  'assets/components/appartment-info.js',
  'assets/components/address-table.js',
  'assets/components/user-items-ol.js',
  'assets/components/star-btn.js',
  'assets/components/contact-btn.js',
  'https://fonts.googleapis.com/css2?family=Rubik&display=swap',
  '/images/favicon.ico'
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


self.addEventListener('push', event => {
  let body;
  if (event.data) body = event.data.text();
  else body = 'התראה מאפליקציית ערבות';
  const options = {
    body: body,
    icon: 'images/favicon.ico',
    lang: 'he',
    dir: 'rtl',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now()
    },
    actions: [
      {action: 'explore', title: 'כניסה ללובי',
        icon: 'images/checkmark.png'},
      {action: 'close', title: 'סגור',
        icon: 'images/xmark.png'},
    ]
  };
  event.waitUntil(
    self.registration.showNotification('ערבות', options)
  );
});
