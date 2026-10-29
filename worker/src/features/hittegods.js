// Hittegodskontoret (runde 9): semantisk søgning i et godkendt katalog med Vectorize og bge-m3-embeddings.
// Indekseres lazy i namespaces hittegods-da/-en (én gang pr. katalogversion, joblås i D1 som Mímirs arkiv).
import { ok, ApiError, readJson, langOf, msg } from '../lib/http.js';
import { str } from '../lib/validate.js';
import { rateLimitEnv } from '../lib/quota.js';
import { embed } from '../lib/ai.js';
import { sha256Hex } from '../lib/crypto.js';
import { genstande, HITTEGODS_VERSION } from '../lib/hittegods.js';

export const hittegodsEnabled = env => !!(env.VECTORS && env.AI && env.DB);
const LEASE_MS = 120_000;
export const tekstTilIndeks = g => `${g.titel}. ${g.emner.join(', ')}. ${g.tekst} Fundet: ${g.sted}, ${g.aar}.`;

export async function sikrIndeks(env, log) {
  const key = 'vectorize:hittegods:' + HITTEGODS_VERSION;
  if (await env.DB.prepare("SELECT 1 FROM generation_jobs WHERE cache_key = ? AND state = 'done'").bind(key).first()) return true;
  const now = Date.now();
  const lock = await env.DB.prepare(`INSERT INTO generation_jobs (id, kind, cache_key, owner_hash, state, lease_until, created_at) VALUES (?, 'vectorize', ?, NULL, 'running', ?, ?)
      ON CONFLICT(cache_key) DO UPDATE SET id = excluded.id, state = 'running', lease_until = excluded.lease_until WHERE generation_jobs.state != 'running' OR generation_jobs.lease_until < ?`)
    .bind((await sha256Hex(key + now)).slice(0, 8), key, now + LEASE_MS, new Date(now).toISOString(), now).run();
  if (!lock.meta || lock.meta.changes !== 1) return false;
  try {
    for (const lang of ['da', 'en']) {
      const g = genstande(lang);
      for (let i = 0; i < g.length; i += 12) {
        const b = g.slice(i, i + 12), v = await embed(env, b.map(tekstTilIndeks), log);
        await env.VECTORS.upsert(b.map((x, j) => ({ id: `hg-${lang}-${x.id}`, values: v[j], namespace: `hittegods-${lang}`, metadata: { id: x.id, version: HITTEGODS_VERSION } })));
      }
    }
    await env.DB.prepare("UPDATE generation_jobs SET state = 'done', lease_until = 0 WHERE cache_key = ?").bind(key).run();
    log && log({ event: 'hittegods_indexed', version: HITTEGODS_VERSION });
    return 'built';
  } catch (e) {
    await env.DB.prepare("UPDATE generation_jobs SET state = 'failed', lease_until = 0 WHERE cache_key = ?").bind(key).run();
    log && log({ event: 'hittegods_index_failed', error: String(e && e.message).slice(0, 160) });
    throw new ApiError('provider_error', 'index', 503, 30);
  }
}

/** POST hittegods {q, lang} → op til 4 genstande med score. Svaret kommer fra kataloget i koden, aldrig fra modellen. */
export async function soeg(request, env, ctx) {
  const body = await readJson(request, 1024);
  const lang = langOf(body.lang);
  if (!hittegodsEnabled(env)) throw new ApiError('not_configured', msg(lang, 'notconf'), 503);
  const q = str(body.q, { min: 2, max: 120, name: 'q', lang });
  await rateLimitEnv(env, 'hittegods', ctx.session.ownerHash, 8, lang);
  return ok(await soegKerne(env, q, lang, ctx.log), 'server');
}

/** Selve søgningen: {q, fund, nyIndeks?, model, namespace}. Kaster ApiError 503, mens indekset bygges. */
export async function soegKerne(env, q, lang, log) {
  const klar = await sikrIndeks(env, log);
  if (!klar) throw new ApiError('busy', lang === 'da' ? 'Hittegodskontoret er ved at sætte hylderne op. Prøv igen om et øjeblik.' : 'The lost property office is putting up its shelves. Try again in a moment.', 503, 20);
  if (klar === 'built') return { q, fund: [], nyIndeks: true, model: env.EMBED_MODEL || '@cf/baai/bge-m3', namespace: `hittegods-${lang}` }; // Vectorize er eventually consistent: nye vektorer er først søgbare efter nogle sekunder
  const [v] = await embed(env, [q], log);
  const r = await env.VECTORS.query(v, { topK: 4, namespace: `hittegods-${lang}`, returnMetadata: 'all' });
  const katalog = Object.fromEntries(genstande(lang).map(g => [g.id, g]));
  const fund = (r.matches || []).map(m => ({ g: katalog[m.metadata && m.metadata.id], score: Math.round(m.score * 100) / 100 })).filter(x => x.g).map(x => ({ ...x.g, score: x.score }));
  return { q, fund, model: env.EMBED_MODEL || '@cf/baai/bge-m3', namespace: `hittegods-${lang}` };
}
