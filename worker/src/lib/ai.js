// Serveradapter til Workers AI (og ekstern TTS). Modelnavne er konfigurerbare i wrangler.toml.
// Al AI-tekst valideres mod et skema (validate.conform) og escapes ved rendering i browseren. Den bliver aldrig kode, SQL eller HTML.
import { conform } from './validate.js';
import { ApiError, msg } from './http.js';
import { medLoft } from './budget.js';

const TIMEOUT_MS = 45_000;
/** AI Gateway-option (logs, cache, rate limits i dashboardet). Tom AI_GATEWAY_ID = direkte kald. */
export function gw(env, { cacheTtl, skipCache = true, feature } = {}) {
  const id = (env.AI_GATEWAY_ID || '').trim(); if (!id) return undefined;
  const g = { id, skipCache: cacheTtl ? false : skipCache }; if (cacheTtl) g.cacheTtl = cacheTtl; if (feature) g.metadata = { feature };
  return { gateway: g };
}
export function withTimeout(p, ms = TIMEOUT_MS) { // eksporteret, så nødøvelserne bruger præcis samme timeout-kode
  let t; const timeout = new Promise((_, rej) => { t = setTimeout(() => rej(new ApiError('provider_error', 'provider timeout', 504)), ms); });
  return Promise.race([p, timeout]).finally(() => clearTimeout(t));
}
function extractJson(text) {
  if (text && typeof text === 'object') return text;
  const s = String(text || '').trim();
  try { return JSON.parse(s); } catch (e) { }
  const i = s.indexOf('{'), j = s.lastIndexOf('}');
  if (i >= 0 && j > i) { try { return JSON.parse(s.slice(i, j + 1)); } catch (e) { } }
  throw new ApiError('invalid_output', 'model returned no JSON', 503, 30);
}

/** Ét tekstkald med JSON-mode og skema-godkendelse. Returnerer {data, model, ms}. */
export async function runJson(env, { system, user, schema, maxTokens = 700, lang = 'da', log }) {
  if (!env.AI) throw new ApiError('not_configured', msg(lang, 'notconf'), 503);
  const model = env.TEXT_MODEL;
  const t0 = Date.now();
  let out;
  try {
    out = await withTimeout(env.AI.run(model, {
      messages: [{ role: 'system', content: system }, { role: 'user', content: user }],
      max_tokens: maxTokens, temperature: 0.8,
      response_format: { type: 'json_schema', json_schema: schema },
    }, gw(env, { feature: 'text' })));
  } catch (e) {
    if (e instanceof ApiError) throw e;
    log && log({ event: 'provider_error', model, ms: Date.now() - t0, error: String(e && e.message || e).slice(0, 200) });
    throw new ApiError('provider_error', msg(lang, 'provider'), 503, 60);
  }
  let data;
  try { data = conform(extractJson(out && (out.response ?? out.result ?? out)), schema); }
  catch (e) { log && log({ event: 'invalid_output', model, ms: Date.now() - t0, error: String(e.message).slice(0, 200) }); throw new ApiError('invalid_output', msg(lang, 'invalid'), 503, 30); }
  log && log({ event: 'ai_text', model, ms: Date.now() - t0 });
  return { data, model, ms: Date.now() - t0 };
}

/** Billedbeskrivelse: image som ArrayBuffer/Uint8Array → kort, nøgtern tekst (model-afhængigt input). */
export async function runVision(env, { imageBytes, contentType, prompt, lang = 'da', log }) {
  if (!env.AI) throw new ApiError('not_configured', msg(lang, 'notconf'), 503);
  const model = env.VISION_MODEL; const t0 = Date.now();
  const b64 = bytesToBase64(imageBytes);
  try {
    const out = await withTimeout(env.AI.run(model, {
      messages: [{ role: 'system', content: 'You describe images soberly and briefly. No speculation about people. Answer in plain text.' }, { role: 'user', content: prompt }],
      image: `data:${contentType};base64,${b64}`, max_tokens: 300,
    }, gw(env, { cacheTtl: 86400, feature: 'vision' }))); // samme billede + prompt rammer gatewayens cache
    const text = String(out && (out.response ?? out.description ?? out.result ?? '')).trim();
    if (!text) throw new Error('empty');
    log && log({ event: 'ai_vision', model, ms: Date.now() - t0 });
    return { text: text.slice(0, 1200), model };
  } catch (e) {
    if (e instanceof ApiError) throw e;
    log && log({ event: 'provider_error', model, ms: Date.now() - t0, error: String(e && e.message || e).slice(0, 200) });
    throw new ApiError('provider_error', msg(lang, 'provider'), 503, 60);
  }
}

/** Billedgenerering: returnerer {bytes, contentType, model}. flux-1-schnell svarer med base64-JPEG. */
export async function runImage(env, { prompt, lang = 'da', log }) { // flux-1-schnell afviser 'seed' (5006); resultatet caches i R2 pr. valg, så det er stadig fast pr. kombination
  if (!env.AI) throw new ApiError('not_configured', msg(lang, 'notconf'), 503);
  const model = env.IMAGE_MODEL; const t0 = Date.now();
  try {
    const out = await withTimeout(env.AI.run(model, { prompt: prompt.slice(0, 2000), steps: 6 }, gw(env, { cacheTtl: 86400, feature: 'image' })), 60_000);
    let bytes, contentType = 'image/jpeg';
    if (out && typeof out.image === 'string') bytes = base64ToBytes(out.image);
    else if (out instanceof ReadableStream) bytes = new Uint8Array(await new Response(out).arrayBuffer()), contentType = 'image/png';
    else if (out instanceof ArrayBuffer || ArrayBuffer.isView(out)) bytes = new Uint8Array(out.buffer || out);
    if (!bytes || bytes.length < 1000) throw new Error('empty image');
    log && log({ event: 'ai_image', model, ms: Date.now() - t0, bytes: bytes.length });
    return { bytes, contentType, model };
  } catch (e) {
    if (e instanceof ApiError) throw e;
    log && log({ event: 'provider_error', model, ms: Date.now() - t0, error: String(e && e.message || e).slice(0, 200) });
    throw new ApiError('provider_error', msg(lang, 'provider'), 503, 60);
  }
}

/** TTS-adapter. 'none' → null (tekstudgave). 'workers-ai' er kun engelsk (aura-2-en) og bruges aldrig til dansk.
 *  'external' kalder TTS_ENDPOINT med Bearer TTS_API_KEY og forventer audio/mpeg eller audio/wav tilbage. */
export async function runTts(env, { text, lang = 'da', log }) {
  const provider = env.TTS_PROVIDER || 'none';
  if (provider === 'none') return null;
  const t0 = Date.now();
  if (provider === 'workers-ai') {
    if (lang !== 'en') return null; // aura-2-en er en engelsk model; ingen dansk uden kvalitetstest
    if (!env.AI) return null;
    try {
      const out = await withTimeout(env.AI.run(env.TTS_MODEL, { text: text.slice(0, 2000), speaker: env.TTS_VOICE || 'luna', encoding: 'mp3' }, gw(env, { cacheTtl: 86400, feature: 'tts' })), 60_000);
      const bytes = out instanceof ReadableStream ? new Uint8Array(await new Response(out).arrayBuffer()) : out && out.audio ? base64ToBytes(out.audio) : null;
      if (!bytes || bytes.length < 500) throw new Error('empty audio');
      log && log({ event: 'ai_tts', model: env.TTS_MODEL, ms: Date.now() - t0 });
      return { bytes, contentType: 'audio/mpeg', voice: `${env.TTS_MODEL}:${env.TTS_VOICE || 'luna'}` };
    } catch (e) { log && log({ event: 'provider_error', model: env.TTS_MODEL, ms: Date.now() - t0, error: String(e.message).slice(0, 200) }); return null; }
  }
  if (provider === 'external') {
    if (!env.TTS_API_KEY || !env.TTS_ENDPOINT) return null;
    try {
      const r = await withTimeout(fetch(env.TTS_ENDPOINT, { method: 'POST', headers: { authorization: 'Bearer ' + env.TTS_API_KEY, 'content-type': 'application/json' }, body: JSON.stringify({ text: text.slice(0, 2000), language: lang === 'da' ? 'da-DK' : 'en-GB', voice: env.TTS_VOICE || '' }) }), 60_000);
      if (!r.ok) throw new Error('tts http ' + r.status);
      const ct = (r.headers.get('content-type') || '').split(';')[0];
      if (!/^audio\/(mpeg|wav|ogg|mp4)$/.test(ct)) throw new Error('tts content-type ' + ct);
      const bytes = new Uint8Array(await r.arrayBuffer()); if (bytes.length < 500) throw new Error('empty audio');
      log && log({ event: 'ai_tts', model: 'external', ms: Date.now() - t0 });
      return { bytes, contentType: ct, voice: 'external:' + (env.TTS_VOICE || 'default') };
    } catch (e) { log && log({ event: 'provider_error', model: 'external-tts', ms: Date.now() - t0, error: String(e.message).slice(0, 200) }); return null; }
  }
  return null;
}

export function bytesToBase64(u8) { let s = ''; const CH = 0x8000; for (let i = 0; i < u8.length; i += CH) s += String.fromCharCode.apply(null, u8.subarray(i, i + CH)); return btoa(s); }
export function base64ToBytes(b64) { const s = atob(b64.replace(/^data:[^,]*,/, '')); const u = new Uint8Array(s.length); for (let i = 0; i < s.length; i++) u[i] = s.charCodeAt(i); return u; }

/** Embeddings til Vectorize (bge-m3, 1024 dim). Returnerer array af vektorer i samme rækkefølge som teksterne. */
export async function embed(env, texts, log) {
  if (!env.AI) throw new ApiError('not_configured', 'no AI', 503);
  const model = env.EMBED_MODEL || '@cf/baai/bge-m3'; const t0 = Date.now();
  const out = await medLoft(env, 'embed', () => withTimeout(env.AI.run(model, { text: texts }, gw(env, { cacheTtl: 86400, feature: 'embed' })), 30_000)); // døgnloft (budget.js)
  const data = out && out.data; if (!Array.isArray(data) || data.length !== texts.length) throw new ApiError('provider_error', 'bad embedding response', 503, 60);
  log && log({ event: 'ai_embed', model, n: texts.length, ms: Date.now() - t0 });
  return data;
}
