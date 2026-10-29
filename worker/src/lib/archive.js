// Mímirs arkiv i Vectorize: lazy indeksering af korpus (én gang pr. version) og semantisk opslag pr. sprog (namespace).
import { CORPUS, CORPUS_VERSION } from './corpus.js';
import { embed } from './ai.js';
import { sha256Hex } from './crypto.js';

const LEASE_MS = 120_000;

export function archiveEnabled(env) { return !!(env.VECTORS && env.AI && env.DB); }

/** Sørger for, at korpusset er indekseret i den aktuelle version. Joblås i D1, så to samtidige kald ikke indekserer dobbelt. */
export async function ensureIndexed(env, log) {
  const key = 'vectorize:' + CORPUS_VERSION;
  const done = await env.DB.prepare("SELECT state FROM generation_jobs WHERE cache_key = ? AND state = 'done'").bind(key).first();
  if (done) return true;
  const now = Date.now();
  const lock = await env.DB.prepare(`INSERT INTO generation_jobs (id, kind, cache_key, owner_hash, state, lease_until, created_at) VALUES (?, 'vectorize', ?, NULL, 'running', ?, ?)
      ON CONFLICT(cache_key) DO UPDATE SET id = excluded.id, state = 'running', lease_until = excluded.lease_until WHERE generation_jobs.state != 'running' OR generation_jobs.lease_until < ?`)
    .bind((await sha256Hex(key + now)).slice(0, 8), key, now + LEASE_MS, new Date(now).toISOString(), now).run();
  if (!lock.meta || lock.meta.changes !== 1) return false; // en anden instans indekserer; svar uden arkiv denne gang
  try {
    for (const lang of ['da', 'en']) {
      const docs = CORPUS.filter(d => d.lang === lang);
      for (let i = 0; i < docs.length; i += 16) {
        const batch = docs.slice(i, i + 16);
        const vectors = await embed(env, batch.map(d => d.text), log);
        await env.VECTORS.upsert(batch.map((d, j) => ({ id: d.id, values: vectors[j], namespace: lang, metadata: { source: d.source, text: d.text.slice(0, 1200), version: CORPUS_VERSION } })));
      }
    }
    await env.DB.prepare("UPDATE generation_jobs SET state = 'done', lease_until = 0 WHERE cache_key = ?").bind(key).run();
    log && log({ event: 'vectorize_indexed', version: CORPUS_VERSION, n: CORPUS.length });
    return true;
  } catch (e) {
    await env.DB.prepare("UPDATE generation_jobs SET state = 'failed', error_code = ?, lease_until = 0 WHERE cache_key = ?").bind(String(e && e.code || 'error'), key).run();
    log && log({ event: 'vectorize_index_failed', error: String(e && e.message).slice(0, 160) });
    return false;
  }
}

/** Finder de mest relevante arkivuddrag til et spørgsmål. Returnerer [] hvis arkivet ikke er klar. */
export async function search(env, question, lang, log, topK = 3) {
  if (!archiveEnabled(env)) return [];
  try {
    const ready = await ensureIndexed(env, log);
    if (!ready) return [];
    const [q] = await embed(env, [question], log);
    const r = await env.VECTORS.query(q, { topK, namespace: lang, returnMetadata: 'all' });
    return (r.matches || []).filter(m => m.score >= 0.45 && m.metadata && m.metadata.text).map(m => ({ source: m.metadata.source, text: m.metadata.text, score: Math.round(m.score * 100) / 100 }));
  } catch (e) { log && log({ event: 'vectorize_query_failed', error: String(e && e.message).slice(0, 160) }); return []; }
}
