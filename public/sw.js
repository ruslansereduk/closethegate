const CACHE_NAME = 'ctg-v3';
const STATIC_CACHE = 'ctg-static-v3';

// Файлы для кеширования
const STATIC_FILES = [
  '/',
  '/manifest.webmanifest',
  '/favicon.ico',
  '/favicon.svg'
];

// Файлы, которые НЕ должны кешироваться
const NO_CACHE_PATTERNS = [
  '/api/',
  '/_next/',
  'chrome-extension://',
  'moz-extension://',
  'localhost:3000/_next/',
  '127.0.0.1:3000/_next/'
];

self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      console.log('Service Worker: Caching static files');
      return cache.addAll(STATIC_FILES);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== STATIC_CACHE) {
            console.log('Service Worker: Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      // Очищаем все кеши, связанные с Next.js файлами
      return caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName.includes('ctg-') && cacheName !== CACHE_NAME && cacheName !== STATIC_CACHE) {
              console.log('Service Worker: Deleting outdated cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      });
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Проверяем, нужно ли кешировать этот запрос
  const shouldCache = !NO_CACHE_PATTERNS.some(pattern => 
    request.url.includes(pattern)
  );

  // Логируем для отладки
  if (request.url.includes('_next/')) {
    console.log('Service Worker: Skipping Next.js file:', request.url);
  }

  if (!shouldCache) {
    // Для API и Next.js файлов - всегда свежие данные, не перехватываем
    return;
  }

  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        // Если есть кешированная версия, возвращаем её, но обновляем в фоне
        fetch(request).then((networkResponse) => {
          if (networkResponse.ok) {
            caches.open(STATIC_CACHE).then((cache) => {
              cache.put(request, networkResponse.clone());
            });
          }
        }).catch(() => {
          // Игнорируем ошибки сети при обновлении кеша
        });
        return cachedResponse;
      }

      // Если нет кешированной версии, загружаем из сети
      return fetch(request).then((networkResponse) => {
        if (networkResponse.ok && shouldCache) {
          const responseClone = networkResponse.clone();
          caches.open(STATIC_CACHE).then((cache) => {
            cache.put(request, responseClone);
          });
        }
        return networkResponse;
      }).catch(() => {
        // Если сеть недоступна, показываем оффлайн страницу
        if (request.destination === 'document') {
          return caches.match('/').then((cachedPage) => {
            return cachedPage || new Response('Оффлайн: проверьте соединение', { 
              status: 200, 
              headers: { 'Content-Type': 'text/plain; charset=utf-8' } 
            });
          });
        }
        return new Response('Оффлайн: проверьте соединение', { 
          status: 200, 
          headers: { 'Content-Type': 'text/plain; charset=utf-8' } 
        });
      });
    })
  );
});


