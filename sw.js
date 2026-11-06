// The app moved to https://codequality.app — this worker clears the old cache and sends open windows there.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.map((k) => caches.delete(k)));
    await self.registration.unregister();
    const wins = await self.clients.matchAll({ type: 'window' });
    for (const w of wins) {
      const u = new URL(w.url);
      const p = u.pathname.replace(/^\/code-quality/, '') || '/';
      try { await w.navigate('https://codequality.app' + p + u.search + u.hash); } catch (err) {}
    }
  })());
});
self.addEventListener('fetch', () => {});
