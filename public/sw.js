self.addEventListener('install', (event) => {
  event.waitUntil(caches.open('ctg-v1').then((cache) => cache.addAll([
    '/',
    '/manifest.webmanifest'
  ])));
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => response || fetch(event.request).catch(() => new Response('Оффлайн: проверьте соединение', { status: 200, headers: { 'Content-Type': 'text/plain; charset=utf-8' } })))
  );
});


