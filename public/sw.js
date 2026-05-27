// Service Worker minimale per abilitare l'installazione della PWA
self.addEventListener('install', (e) => {
  self.skipWaiting();
});

self.addEventListener('fetch', (e) => {
  // Lascia passare le richieste normalmente
});