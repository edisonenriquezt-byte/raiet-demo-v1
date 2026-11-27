const CACHE_NAME = 'raiet-demo-web-v12-blindaje';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './acceso-esabas.js?v=20261127-demo11b',
  './raiet-native.js',
  './icon-192.png',
  './icon-512.png',
  './mejoras.js?v=20261123-demo9',
  './edicion-financiera.js?v=20261122-demo2',
  './raiet-interacciones.js?v=20261122-demo2',
  './raiet-respaldo.js?v=20261123-demo8',
  './raiet-gestion.js?v=20261127-demo11b',
  './raiet-inventario.js?v=20261127-demo11b',
  './raiet-historia-clinica.js?v=20261127-demo11b',
  'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.119.2'
];

// 1. Instalación: Descarga y guarda en caché la aplicación completa
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('📦 [Service Worker] Guardando archivos base en caché local...');
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => self.skipWaiting())
  );
});

// 2. Activación: Limpia versiones antiguas si se actualiza el Service Worker
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key.startsWith('raiet-demo-web-') && key !== CACHE_NAME) {
            console.log('🧹 [Service Worker] Eliminando caché antigua:', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// 3. Solo recursos estáticos explícitos; nunca respuestas de API ni documentos.
const recursosPermitidos = new Set(ASSETS_TO_CACHE.map(path =>
  new URL(path, self.registration.scope).href
));
self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET' || !recursosPermitidos.has(request.url)) return;

  event.respondWith((async () => {
    try {
      const response = await fetch(request);
      if (response.ok && !response.redirected &&
          !/\b(?:private|no-store)\b/i.test(response.headers.get('cache-control') || '')) {
        try {
          const cache = await caches.open(CACHE_NAME);
          await cache.put(request, response.clone());
        } catch (_) { /* No impedir la respuesta de red por fallo de caché. */ }
      }
      return response;
    } catch (error) {
      const cache = await caches.open(CACHE_NAME);
      const cached = await cache.match(request);
      if (cached) return cached;
      if (request.mode === 'navigate') {
        const fallback = await cache.match(new URL('./index.html', self.registration.scope).href);
        if (fallback) return fallback;
      }
      return Response.error();
    }
  })());
});
