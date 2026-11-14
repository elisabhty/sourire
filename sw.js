// Réseau d'abord (pour toujours avoir la dernière version), cache en secours hors ligne.
const CACHE = 'sourire-v5';
const SHELL = ['./', 'index.html', 'styles.css?v=5', 'app.js?v=5', 'icon-512.png', 'mascot.webp', 'mascot-34.webp', 'mascot-hello.webp', 'mascot-selfie.webp', 'mascot-timer.webp', 'mascot-worried.webp', 'mascot-sleep.webp', 'mascot-party.webp', 'manifest.webmanifest'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL))); self.skipWaiting(); });
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET' || new URL(e.request.url).origin !== location.origin) return;
  e.respondWith(
    fetch(e.request).then(r => { const copy = r.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); return r; })
      .catch(() => caches.match(e.request).then(r => r || caches.match('index.html')))
  );
});
