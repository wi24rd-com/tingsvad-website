// GET /api/kant — »Hvor svarede tinget fra?« (runde 10). Viser gæsten sin egen vej til kanten ud fra request.cf:
// datacenter (colo), protokol, TLS-version og målt tur-retur-tid. Ingen IP, by, land, udbyder eller cookie; intet gemmes.
const json = (d, s = 200) => new Response(JSON.stringify(d), { status: s, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', 'x-content-type-options': 'nosniff' } });
let byer = null;

export async function onRequestGet({ request, env }) {
  const cf = request.cf || {};
  const colo = /^[A-Z]{3}$/.test(cf.colo || '') ? cf.colo : null;
  if (!byer && env.ASSETS) { try { const r = await env.ASSETS.fetch(new URL('/assets/colo.json', request.url)); if (r.ok) byer = await r.json(); } catch { } }
  const by = colo && byer && Array.isArray(byer[colo]) ? { da: byer[colo][0], en: byer[colo][1] } : null;
  const rtt = Number.isFinite(+cf.clientTcpRtt) && +cf.clientTcpRtt > 0 ? Math.round(+cf.clientTcpRtt) : null;
  return json({
    ok: true, source: 'server', requestId: (request.headers.get('cf-ray') || '').split('-')[0].slice(0, 16) || null,
    data: {
      colo, by,
      protokol: typeof cf.httpProtocol === 'string' ? cf.httpProtocol.slice(0, 12) : null,
      tls: typeof cf.tlsVersion === 'string' ? cf.tlsVersion.slice(0, 12) : null,
      rttMs: rtt,
      hentet: new Date().toISOString(),
    },
  });
}

export function onRequest() { return json({ ok: false, code: 'method_not_allowed', message: 'GET' }, 405); }
