/* DEEPFLIX PWA Service Worker */
const CACHE_NAME = 'deepflix-pwa-v12';
const STATIC_ASSETS = [
  '/',
  '/manifest.webmanifest',
  '/icon.svg',
];

self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(STATIC_ASSETS).catch(() => {}))
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);

  // Só intercepta requisições de mesma origem (assets do app local)
  if (url.origin !== self.location.origin) {
    return;
  }

  // Não intercepta chamadas de API, streams de vídeo/HLS ou m3u8
  if (
    url.pathname.startsWith('/api/') ||
    url.pathname.endsWith('.m3u8') ||
    url.pathname.endsWith('.ts') ||
    url.pathname.endsWith('.mp4') ||
    url.searchParams.has('token')
  ) {
    return;
  }

  // Network-first com fallback para cache e suporte offline a rotas SPA
  event.respondWith(
    fetch(request)
      .then(response => {
        if (response && response.status === 200) {
          const isStatic = (
            url.pathname.endsWith('.svg') ||
            url.pathname.endsWith('.webmanifest') ||
            url.pathname.endsWith('.css') ||
            url.pathname.endsWith('.js') ||
            url.pathname === '/'
          );
          if (isStatic) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(request, clone)).catch(() => {});
          }
        }
        return response;
      })
      .catch(async () => {
        const cached = await caches.match(request);
        if (cached) return cached;
        // Se for navegação de página (SPA) e estiver sem internet, retorna o index do app
        if (request.mode === 'navigate') {
          const fallbackShell = await caches.match('/');
          if (fallbackShell) return fallbackShell;
        }
        return new Response('Offline - DEEPFLIX', {
          status: 503,
          headers: { 'Content-Type': 'text/plain; charset=utf-8' },
        });
      })
  );
});
