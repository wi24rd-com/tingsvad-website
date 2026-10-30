// /api/ting-ai/* → Worker "tingsvad-ting-ai" via service binding TING_AI (konfigureret i wrangler.toml i roden).
// Uden binding svarer vi med den fælles fejlkontrakt, så frontend kan vise mærkede redaktionelle eksempler.
// WebSocket-opgraderinger (afstemningsrummet) sendes uændret videre til Workeren.
// Prøvebakken (C04): et JSON-kald med galleryId omskrives her til multipart med selve billedfilen fra sitets statiske
// aktiver, så Workeren ikke behøver hente fra tingsvad.dk (en subrequest til egen zone gennem bindingen afvises som loop).
const json = (d, s = 200) => new Response(JSON.stringify(d), { status: s, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' } });
const GALLERY = { ko: '/assets/pak/web/ko.webp', skjold: '/assets/pak/web/skjold.webp', stol: '/assets/pak/web/stol.webp', spyd: '/assets/pak/web/spyd.webp' };

export async function onRequest({ request, env }) {
  if (!env.TING_AI || typeof env.TING_AI.fetch !== 'function') {
    return json({ ok: false, code: 'not_configured', message: 'Tingets maskiner er ikke tilsluttet (service binding TING_AI mangler).' }, 503);
  }
  try {
    const url = new URL(request.url);
    // Admin-ruterne nås kun fra /admin/* (bag Cloudflare Access), aldrig gennem den offentlige proxy.
    if (url.pathname.startsWith('/api/ting-ai/admin')) return json({ ok: false, code: 'not_found', message: 'no' }, 404);
    // intern/* (gæstebog, tællere, besøgende i D1) kaldes kun af site-Workeren selv (functions/_lib/ting.js) – aldrig udefra.
    if (url.pathname.startsWith('/api/ting-ai/intern')) return json({ ok: false, code: 'not_found', message: 'no' }, 404);
    // Kun proxyen må sætte x-gallery-id, x-tingsvad-colo og x-tingsvad-intern; fjern dem fra alt indkommende.
    const headers = new Headers(request.headers); headers.delete('x-gallery-id'); headers.delete('x-tingsvad-colo'); headers.delete('x-tingsvad-intern');
    if (request.cf && /^[A-Z]{3}$/.test(request.cf.colo || '')) headers.set('x-tingsvad-colo', request.cf.colo); // til tælleværket; service binding-kaldet har ikke selv request.cf
    if (url.pathname === '/api/ting-ai/vision' && request.method === 'POST' && (request.headers.get('content-type') || '').includes('application/json')) {
      let body = null; try { body = await request.clone().json(); } catch (e) { }
      const id = body && typeof body.galleryId === 'string' ? body.galleryId : null;
      if (id && GALLERY[id] && env.ASSETS) {
        const img = await env.ASSETS.fetch(new Request(new URL(GALLERY[id], url.origin)));
        if (img.ok) {
          const fd = new FormData();
          fd.append('file', new File([await img.arrayBuffer()], id + '.webp', { type: 'image/webp' }));
          fd.append('lang', body.lang === 'en' ? 'en' : 'da');
          headers.delete('content-type'); headers.delete('content-length'); headers.set('x-gallery-id', id);
          return await env.TING_AI.fetch(new Request(request.url, { method: 'POST', headers, body: fd }));
        }
      }
    }
    const svar = await env.TING_AI.fetch(new Request(request, { headers }));
    // Workers Cache (runde 12): maskin-Workerens kantcache siger HIT/MISS/STALE …; send det videre til »Vis maskineriet«
    const cs = svar.status !== 101 && svar.headers.get('cf-cache-status');
    if (!cs) return svar;
    const ud = new Response(svar.body, svar); ud.headers.set('x-tingsvad-kantcache', cs);
    return ud;
  } catch (e) {
    // 503 + retryAfter, aldrig 502: Cloudflare erstatter 502 med en tekstside, som frontend ville læse som »ikke tilsluttet«
    return new Response(JSON.stringify({ ok: false, code: 'upstream', message: 'Nettet svarede ikke.', retryAfter: 30 }), { status: 503, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', 'retry-after': '30' } });
  }
}
