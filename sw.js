// tingsvad.dk service worker: assets cache-first, sider network-first, /api aldrig cachet.
const V = 'tingsvad-5ed52696'; // runde 13: sættes af bump.sh til samme hash som ?v= på filerne, så gamle assets ryddes ved hver udgave
self.addEventListener('install', e => { self.skipWaiting(); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== V).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.origin !== location.origin || u.pathname.startsWith('/api/') || u.pathname.startsWith('/sag/') || u.pathname.startsWith('/admin')) return; // runde 13: admin aldrig i Cache Storage
  if (u.pathname.startsWith('/assets/')) {
    e.respondWith(caches.open(V).then(async c => { const hit = await c.match(e.request); if (hit) return hit; const r = await fetch(e.request); if (r.ok) c.put(e.request, r.clone()); return r; }));
  } else {
    e.respondWith(fetch(e.request).then(r => { if (r.ok && !/no-store|private/i.test(r.headers.get('cache-control') || '')) caches.open(V).then(c => c.put(e.request, r.clone())); return r; }).catch(() => caches.match(e.request).then(h => h || caches.match('/'))));
  }
});
