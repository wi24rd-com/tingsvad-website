// GET /api/ting-ai/topologi — Infrastrukturkortet (runde 12): hvor kører delene af tinget lige nu?
// Måler med rigtige kald: hvilket datacenter Workeren kører i, hvor D1 svarer fra, hvor de to Durable Objects bor
// (de slår selv op, hvilket datacenter deres udgående kald forlader nettet fra), og svartider for D1, R2, KV og Vectorize.
// Ingen IP, ingen cookie, intet gemmes. Resultatet gemmes 20 sekunder i isolatet, så siden ikke bliver til mange kald.
import { ok } from '../lib/http.js';

const CACHE_MS = 20 * 1000;
const TIMEOUT_MS = 2500;
let gemt = null; // { t, colo, data }

const iata = v => (typeof v === 'string' && /^[A-Z]{3}$/.test(v) ? v : null);
const kort = (v, n = 24) => (typeof v === 'string' ? v.slice(0, n) : null);

/** Kører én måling med tidsgrænse. Fejl og timeout bliver til {ok:false}, så resten af kortet stadig kan tegnes. */
export async function maal(fn, timeout = TIMEOUT_MS) {
  const t0 = Date.now();
  let timer;
  try {
    const v = await Promise.race([fn(), new Promise((_, rej) => { timer = setTimeout(() => rej(new Error('timeout')), timeout); })]);
    return { ok: true, ms: Date.now() - t0, ...(v && typeof v === 'object' ? v : {}) };
  } catch (e) {
    return { ok: false, ms: Date.now() - t0, fejl: String(e && e.message || e).slice(0, 40) };
  } finally { clearTimeout(timer); }
}

/** colo=XXX fra Cloudflares trace-svar (bruges af Durable Objects til at finde deres eget datacenter). */
export function coloFraTrace(tekst) {
  const m = /(?:^|\n)colo=([A-Z]{3})(?:\n|$)/.exec(String(tekst || ''));
  return m ? m[1] : null;
}
export async function egetColo(fetcher = fetch) {
  const r = await fetcher('https://www.cloudflare.com/cdn-cgi/trace', { cf: { cacheTtl: 0 } });
  return coloFraTrace(await r.text());
}

/** Samler målingerne. env-bindinger, der mangler, bliver markeret som ikke konfigureret i stedet for at fejle. */
export async function maalTopologi(env, workerColo) {
  const ikke = { ok: false, konfigureret: false };
  const [d1, kv, r2, vectorize, ting, stol] = await Promise.all([
    env.DB ? maal(async () => {
      const r = await env.DB.prepare('SELECT 1 AS ok').all();
      const m = (r && r.meta) || {};
      return { region: kort(m.served_by_region, 8), primaer: typeof m.served_by_primary === 'boolean' ? m.served_by_primary : null, colo: iata(m.served_by_colo), sqlMs: Number.isFinite(+(m.timings && m.timings.sql_duration_ms)) ? Math.round(+m.timings.sql_duration_ms * 100) / 100 : null };
    }) : ikke,
    env.SAGER ? maal(async () => { await env.SAGER.get('__topologi'); return {}; }) : ikke,
    env.MEDIA ? maal(async () => { await env.MEDIA.head('__topologi'); return {}; }) : ikke,
    env.VECTORS && typeof env.VECTORS.describe === 'function' ? maal(async () => {
      const d = await env.VECTORS.describe();
      const n = d && (d.vectorCount ?? d.vectorsCount);
      const dim = d && ((d.config && d.config.dimensions) ?? d.dimensions);
      return { vektorer: Number.isFinite(+n) ? +n : null, dimensioner: Number.isFinite(+dim) ? +dim : null };
    }) : ikke,
    env.TING_ROOM ? maal(async () => ({ colo: iata(await env.TING_ROOM.get(env.TING_ROOM.idFromName('vadestedet')).topologi()) }), 4000) : ikke,
    env.CHAIR_ROOM ? maal(async () => ({ colo: iata(await env.CHAIR_ROOM.get(env.CHAIR_ROOM.idFromName('vadestedet')).topologi()) }), 4000) : ikke,
  ]);
  return {
    worker: { colo: iata(workerColo), navn: 'tingsvad-ting-ai' },
    d1, kv, r2, vectorize,
    durableObjects: { tingmoedet: ting, stolen: stol },
    tjenester: { // konfigureret lige nu (uden at kalde de dyre tjenester)
      workersAi: !!env.AI, aiGateway: !!String(env.AI_GATEWAY_ID || '').trim(), aiSearch: !!env.AI_SEARCH, browser: !!env.BROWSER, images: !!env.IMAGES,
      workflows: !!(env.CHAIR_CASES || env.RAVN || env.REVISION), queues: !!(env.RAVN_QUEUE || env.FORGE_QUEUE), analytics: !!env.TAEL, analyticsSql: !!env.ANALYTICS_SQL, rateLimiting: !!env.RL,
    },
    hentet: new Date().toISOString(),
  };
}

export async function getTopologi(request, env) {
  const colo = (request.cf && request.cf.colo) || request.headers.get('x-tingsvad-colo') || '';
  if (gemt && Date.now() - gemt.t < CACHE_MS) return ok({ ...gemt.data, gemt: true }, 'cached');
  const data = await maalTopologi(env, colo);
  gemt = { t: Date.now(), data };
  return ok(data, 'server');
}
