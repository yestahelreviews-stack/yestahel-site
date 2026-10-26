'use strict';
const CACHE = 'yestahel-h1b4hl-1qjerew-2026-10-26';
const CORE = ['/', '/assets/site.css?v=h1b4hl', '/assets/icon.svg', '/manifest.webmanifest', '/assets/b/styles.css?v=1qjerew', '/assets/b/art.js?v=1qjerew', '/assets/b/ui.js?v=1qjerew'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
const keep = (req, res) => { if (res.ok && res.type === 'basic') { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); } return res; };
self.addEventListener('fetch', e => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== location.origin || url.pathname.startsWith('/go/')) return;
  if (req.mode === 'navigate') {
    e.respondWith(fetch(req).then(res => keep(req, res)).catch(() => caches.match(req).then(hit => hit || caches.match('/'))));
  } else if (url.pathname.startsWith('/assets/') || url.pathname === '/manifest.webmanifest') {
    e.respondWith(caches.match(req).then(hit => {
      const fresh = fetch(req).then(res => keep(req, res)).catch(() => hit);
      return hit || fresh;
    }));
  }
});
