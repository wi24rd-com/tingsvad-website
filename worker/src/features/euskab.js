// Det europæiske arkivskab (runde 12): hvor ender data, når man selv vælger? Fire lagre er låst til EU-jurisdiktionen
// (Durable Object, D1, KV og R2), og et Durable Object uden lås står ved siden af til sammenligning. GET eu/skab måler,
// hvor hvert lager svarer fra, og hvad det selv melder; POST eu/segl lægger et segl (tid + datacenter, intet andet) i alle
// fire og viser, hvor skrivningerne landede. D1 måler sin region og primære kopi; KV og R2 kan ikke selv fortælle, hvor de
// ligger, så for dem vises den jurisdiktion, de er oprettet med, og svartiden.
import { ok, ApiError, langOf, msg } from '../lib/http.js';
import { rateLimitEnv } from '../lib/quota.js';
import { maal } from './topologi.js';

const iata = v => (typeof v === 'string' && /^[A-Z]{3}$/.test(v) ? v : null);
const DAG = t => new Date(t).toISOString().slice(0, 10);
export const euEnabled = env => !!(env.EU_SKAB && typeof env.EU_SKAB.jurisdiction === 'function');
const OPRET = 'CREATE TABLE IF NOT EXISTS segl (t INTEGER NOT NULL, dag TEXT NOT NULL, colo TEXT)';

const doEu = env => env.EU_SKAB.jurisdiction('eu').getByName('skabet');
const doFri = env => env.EU_SKAB.getByName('skabet-uden-laas');
const d1meta = r => { const m = (r && r.meta) || {}; return { region: typeof m.served_by_region === 'string' ? m.served_by_region.slice(0, 8) : null, primaer: typeof m.served_by_primary === 'boolean' ? m.served_by_primary : null, colo: iata(m.served_by_colo) }; };

/** Måler alle lagre (læsning). Mangler en binding, står den som ikke oprettet. */
export async function maalSkab(env, workerColo) {
  const ikke = { ok: false, oprettet: false };
  const [eu, fri, d1, kv, r2] = await Promise.all([
    euEnabled(env) ? maal(() => doEu(env).status(), 4000) : ikke,
    euEnabled(env) ? maal(() => doFri(env).status(), 4000) : ikke,
    env.EU_DB ? maal(async () => { await env.EU_DB.prepare(OPRET).run(); const r = await env.EU_DB.prepare('SELECT COUNT(*) AS n, SUM(dag = ?) AS idag FROM segl').bind(DAG(Date.now())).all(); const row = (r.results || [])[0] || {}; return { ...d1meta(r), segl: row.n || 0, idag: row.idag || 0 }; }, 4000) : ikke,
    env.EU_KV ? maal(async () => { const s = await env.EU_KV.get('seneste', 'json'); return { seneste: s && s.t ? s.t : null }; }) : ikke,
    env.EU_R2 ? maal(async () => { const o = await env.EU_R2.get(`dage/${DAG(Date.now())}.json`); const j = o ? await o.json() : null; return { idag: j ? j.n : 0 }; }) : ikke,
  ]);
  return { worker: iata(workerColo), lagre: { do: eu, d1, kv, r2 }, uden: { do: fri }, jurisdiktion: 'eu' };
}

export async function getSkab(request, env, ctx) {
  return ok(await maalSkab(env, request.headers.get('x-tingsvad-colo') || (request.cf && request.cf.colo)), 'server', 200, { 'cache-control': 'no-store' });
}

export async function postSegl(request, env, ctx) {
  const start = Date.now(); // Workerens egen tid (kvotetjek + alle fem skrivninger), så siden kan skille nettet fra arbejdet
  const lang = langOf(new URL(request.url).searchParams.get('lang'));
  if (!euEnabled(env)) throw new ApiError('not_configured', msg(lang, 'notconf'), 503);
  await rateLimitEnv(env, 'eu-segl', ctx.session.ownerHash, 6, lang, { strict: true });
  const nu = Date.now(), gaest = iata(request.headers.get('x-tingsvad-colo')), dag = DAG(nu);
  const [eu, fri, d1, kv, r2] = await Promise.all([
    maal(() => doEu(env).segl(gaest, nu), 4000),
    maal(() => doFri(env).segl(gaest, nu), 4000),
    env.EU_DB ? maal(async () => { await env.EU_DB.prepare(OPRET).run(); const r = await env.EU_DB.prepare('INSERT INTO segl (t, dag, colo) VALUES (?, ?, ?)').bind(nu, dag, gaest).run(); return d1meta(r); }, 4000) : { ok: false, oprettet: false },
    env.EU_KV ? maal(async () => { await env.EU_KV.put('seneste', JSON.stringify({ t: nu, colo: gaest })); return {}; }) : { ok: false, oprettet: false },
    env.EU_R2 ? maal(async () => { const k = `dage/${dag}.json`, o = await env.EU_R2.get(k), j = o ? await o.json().catch(() => ({ n: 0 })) : { n: 0 }; await env.EU_R2.put(k, JSON.stringify({ dag, n: (j.n || 0) + 1 }), { httpMetadata: { contentType: 'application/json' } }); return { idag: (j.n || 0) + 1 }; }) : { ok: false, oprettet: false },
  ]);
  ctx.log({ event: 'eu_segl', gaest, eu: eu.ok && eu.colo, d1: d1.ok && d1.region });
  return ok({ gaest, worker: iata(request.cf && request.cf.colo), server: Date.now() - start, lagre: { do: eu, d1, kv, r2 }, uden: { do: fri }, jurisdiktion: 'eu' }, 'server', 200, { 'cache-control': 'no-store' });
}
