import './globals.css'

export const metadata = {
  metadataBase: new URL('https://closethegate.eu'),
  title: "Отчет до Судного дня Закрытия границ",
  description: "Ироничный счетчик и анонимный чат о статусе границы — таймер, сводка, анонимные сообщения",
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.svg',
    apple: '/favicon.svg'
  },
  openGraph: {
    title: "Отчет до Судного дня Закрытия границ",
    description: "Счетчик до закрытия границы, статус и анонимный чат",
    images: [
      {
        url: "/api/og", width: 1200, height: 630, alt: "CloseTheGate OG"
      }
    ]
  }
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru" className="dark">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body className="min-h-screen antialiased bg-background text-foreground font-sans">
        <link rel="manifest" href="/manifest.webmanifest" />
        <script dangerouslySetInnerHTML={{__html: `
          if ('serviceWorker' in navigator && !window.location.hostname.includes('localhost')) {
            window.addEventListener('load', () => {
              // Сначала очищаем все кеши
              caches.keys().then((cacheNames) => {
                return Promise.all(
                  cacheNames.map((cacheName) => {
                    if (cacheName.includes('ctg-')) {
                      console.log('Clearing cache:', cacheName);
                      return caches.delete(cacheName);
                    }
                  })
                );
              }).then(() => {
                // Затем регистрируем новый Service Worker
                navigator.serviceWorker.register('/sw.js').catch(()=>{});
              });
            });
          } else if (window.location.hostname.includes('localhost')) {
            // На localhost отключаем Service Worker для разработки
            console.log('Service Worker disabled on localhost for development');
            if ('serviceWorker' in navigator) {
              navigator.serviceWorker.getRegistrations().then((registrations) => {
                registrations.forEach((registration) => {
                  registration.unregister();
                });
              });
            }
          }
          
          // Утилита для очистки кеша (для отладки)
          window.clearCTGCache = function() {
            return caches.keys().then((cacheNames) => {
              return Promise.all(
                cacheNames.map((cacheName) => {
                  console.log('Clearing cache:', cacheName);
                  return caches.delete(cacheName);
                })
              );
            }).then(() => {
              console.log('All caches cleared');
              if ('serviceWorker' in navigator) {
                navigator.serviceWorker.getRegistrations().then((registrations) => {
                  registrations.forEach((registration) => {
                    registration.unregister();
                  });
                });
              }
            });
          };
        `}} />
        <a href="#chat" className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 px-3 py-2 rounded-md bg-primary text-primary-foreground">К содержимому</a>
        <header className="sticky top-0 z-40 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
          <div className="container flex items-center justify-between py-3">
            <a href="/" className="font-semibold tracking-tight">CloseTheGate</a>
            <nav className="flex items-center gap-4 text-sm">
              <a href="#chat" className="text-muted-foreground hover:text-foreground">К чату</a>
              <a href="/donate" className="text-muted-foreground hover:text-foreground">Поддержать проект</a>
            </nav>
          </div>
        </header>
        {children}
        <script type="application/ld+json" dangerouslySetInnerHTML={{__html: JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'WebSite',
          name: 'CloseTheGate',
          url: 'https://closethegate.eu',
          potentialAction: {
            '@type': 'SearchAction',
            target: 'https://closethegate.eu/?q={search_term_string}',
            'query-input': 'required name=search_term_string'
          }
        })}} />
      </body>
    </html>
  );
}
