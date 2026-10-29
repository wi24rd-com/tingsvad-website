// Fælles API-kontrakt under /api/ting-ai/
// succes: {ok:true, source:"ai"|"editorial"|"demo"|"server", requestId, data}  (server = ægte tilstand uden AI, fx sager og afstemning)
// fejl:   {ok:false, code, message, retryAfter?}
export const requestId = () => (crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2)).replace(/-/g, '').slice(0, 16);

const HEADERS = { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', 'x-content-type-options': 'nosniff' };

export function ok(data, source = 'ai', status = 200, extra = {}) {
  return new Response(JSON.stringify({ ok: true, source, requestId: requestId(), data }), { status, headers: { ...HEADERS, ...extra } });
}
export function fail(code, message, status = 400, extra = {}) {
  const body = { ok: false, code, message };
  if (extra.retryAfter) body.retryAfter = extra.retryAfter;
  const headers = { ...HEADERS };
  if (extra.retryAfter) headers['retry-after'] = String(extra.retryAfter);
  if (extra.setCookie) headers['set-cookie'] = extra.setCookie;
  return new Response(JSON.stringify(body), { status, headers });
}
export class ApiError extends Error {
  constructor(code, message, status = 400, retryAfter) { super(message); this.code = code; this.status = status; this.retryAfter = retryAfter; }
}
export const MESSAGES = {
  da: { quota: 'Dagens bevilling er gået til blæk.', rate: 'Tinget hører ét argument ad gangen. Vent lidt.', bad: 'Tinget kunne ikke læse indsendelsen.', long: 'For langt. Tinget læser højst {n} tegn.', provider: 'Maskinen svarede ikke. Det er ført til protokols.', invalid: 'Maskinen svarede uden for scenen. Svaret er kasseret.', notfound: 'Findes ikke i protokollen.', forbidden: 'Ikke din sag.', conflict: 'Samme nøgle, andet indhold. Afvist.', notconf: 'Denne del af tinget er ikke tilsluttet.' },
  en: { quota: 'Today’s allowance has gone to ink.', rate: 'The thing hears one argument at a time. Wait a moment.', bad: 'The thing could not read the submission.', long: 'Too long. The thing reads at most {n} characters.', provider: 'The machine did not answer. It has been minuted.', invalid: 'The machine answered off-stage. The answer was discarded.', notfound: 'Not in the minutes.', forbidden: 'Not your case.', conflict: 'Same key, different content. Rejected.', notconf: 'This part of the thing is not connected.' },
};
export const msg = (lang, key, vars) => String((MESSAGES[lang] || MESSAGES.da)[key] || key).replace(/\{(\w+)\}/g, (m, k) => vars && k in vars ? vars[k] : m);

export async function readJson(request, maxBytes = 8192) {
  const ct = request.headers.get('content-type') || '';
  if (!ct.includes('application/json')) throw new ApiError('bad_request', 'content-type must be application/json', 415);
  const len = +(request.headers.get('content-length') || 0);
  if (len > maxBytes) throw new ApiError('too_long', 'body too large', 413);
  const text = await request.text();
  if (text.length > maxBytes) throw new ApiError('too_long', 'body too large', 413);
  try { const v = JSON.parse(text); if (!v || typeof v !== 'object' || Array.isArray(v)) throw 0; return v; } catch (e) { throw new ApiError('bad_request', 'invalid json', 400); }
}
export const langOf = v => (v === 'en' ? 'en' : 'da');
export const nowIso = () => new Date().toISOString();
