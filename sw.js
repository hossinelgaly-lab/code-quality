// Code - Quality | Service Worker: بيستقبل الإشعارات والتطبيق مقفول
const CACHE = 'cq-shell-v2';
const SHELL = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png'];
self.addEventListener('install', (e) => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).catch(() => {}));
});
self.addEventListener('activate', (e) => e.waitUntil((async () => {
  for (const k of await caches.keys()) if (k !== CACHE) await caches.delete(k);
  await self.clients.claim();
})()));

// network first for the app shell, cache as offline fallback (also needed for "Install app" on Android)
self.addEventListener('fetch', (e) => {
  const r = e.request;
  if (r.method !== 'GET') return;
  const u = new URL(r.url);
  if (u.origin !== self.location.origin) return;
  e.respondWith((async () => {
    try {
      const res = await fetch(r);
      if (res && res.ok && (r.mode === 'navigate' || SHELL.some((p) => u.pathname.endsWith(p.replace('./', '/'))))) {
        const c = await caches.open(CACHE); c.put(r.mode === 'navigate' ? './' : r, res.clone());
      }
      return res;
    } catch (err) {
      const hit = await caches.match(r.mode === 'navigate' ? './' : r);
      if (hit) return hit;
      throw err;
    }
  })());
});

self.addEventListener('push', (e) => {
  let d = {};
  try { d = e.data ? e.data.json() : {}; } catch (_) { d = { body: e.data ? e.data.text() : '' }; }
  e.waitUntil(self.registration.showNotification(d.title || 'كود - كواليتي', {
    body: d.body || '',
    icon: 'icon-192.png',
    badge: 'icon-192.png',
    tag: d.tag || undefined,
    data: { url: d.url || './' },
    dir: 'auto',
  }));
});

self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  const url = (e.notification.data && e.notification.data.url) || './';
  e.waitUntil((async () => {
    const list = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const c of list) {
      if ('focus' in c) { await c.focus(); c.postMessage({ type: 'open', url }); return; }
    }
    await self.clients.openWindow(url);
  })());
});
