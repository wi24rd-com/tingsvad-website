// Admin: Tingsvad Tidendes udgaver. Avisen ligger i Workerens D1, så kaldet sendes videre gennem service-bindingen sammen med
// Access-tokenet; Workeren verificerer det selv (to låse, ikke én).
const json = (d, s = 200) => new Response(JSON.stringify(d), { status: s, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' } });

export async function onRequest({ request, env }) {
  if (!env.TING_AI || typeof env.TING_AI.fetch !== 'function') return json({ ok: false, code: 'not_configured' }, 503);
  if (!['GET', 'POST'].includes(request.method)) return json({ ok: false, code: 'method' }, 405);
  const url = new URL(request.url);
  const headers = new Headers({ 'content-type': request.headers.get('content-type') || 'application/json' }); // runde 13: videresend klientens egen type (ingen omskrivning af text/plain til JSON)
  for (const h of ['cf-access-jwt-assertion', 'cookie']) { const v = request.headers.get(h); if (v) headers.set(h, v); }
  return env.TING_AI.fetch(new Request(new URL('/api/ting-ai/admin/aviser' + url.search, url.origin), { method: request.method, headers, body: request.method === 'POST' ? await request.text() : undefined }));
}
