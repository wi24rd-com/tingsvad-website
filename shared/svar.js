// Én svarkontrakt for alle JSON-ruter (runde 13, AP7) – site-Workerens /api/* og ting-ai's /api/ting-ai/* svarer ens:
//   succes: { ok: true,  source: 'server' | 'ai' | 'editorial' | 'demo', requestId, data }
//   fejl:   { ok: false, code, message, requestId, retryAfter? }   (+ header Retry-After når retryAfter er sat)
// Fejltavlens RFC 9457-udgave (functions/_lib/fejl.js) lægger problem-felterne oven på samme kontrakt.
export const requestId = () => (crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2)).replace(/-/g, '').slice(0, 16);
export const JSON_HEADERS = { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', 'x-content-type-options': 'nosniff' };

export function ok(data, source = 'server', status = 200, extra = {}) {
  return new Response(JSON.stringify({ ok: true, source, requestId: requestId(), data }), { status, headers: { ...JSON_HEADERS, ...extra } });
}
export function fail(code, message, status = 400, extra = {}) {
  const body = { ok: false, code, message, requestId: requestId() };
  const headers = { ...JSON_HEADERS };
  if (extra.retryAfter) { body.retryAfter = extra.retryAfter; headers['retry-after'] = String(extra.retryAfter); }
  if (extra.setCookie) headers['set-cookie'] = extra.setCookie;
  return new Response(JSON.stringify(body), { status, headers });
}
/** Sender et svar fra ting-ai videre uændret i krop og status, men med sitets egne headers (ingen cookie, ingen cache). */
export async function videre(res, extra = {}) {
  const h = { ...JSON_HEADERS, ...extra };
  if (res.headers.get('retry-after')) h['retry-after'] = res.headers.get('retry-after');
  return new Response(await res.text(), { status: res.status, headers: h });
}
