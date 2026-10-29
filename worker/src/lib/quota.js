// Atomiske døgnkvoter og korte rate limits i D1.
// Reservation sker FØR provider-kald og udløber (lease), så et nedbrud ikke låser kvoten permanent.
import { randomId } from './crypto.js';
import { ApiError, msg } from './http.js';

const LEASE_MS = 90_000;

export function quotaLimit(env, kind) {
  const map = { text: 'QUOTA_TEXT_PER_DAY', image: 'QUOTA_IMAGE_PER_DAY', audio: 'QUOTA_AUDIO_PER_DAY', edition: 'QUOTA_EDITION_TEXT_PER_DAY' };
  const n = parseInt(env[map[kind]] || '0', 10); return Number.isFinite(n) && n >= 0 ? n : 0;
}

/** Reservér én enhed af kvoten (scope = kind, bucket = dato). Returnerer reservation eller kaster quota-fejl. */
export async function reserve(db, scope, bucketKey, limit, lang = 'da', now = Date.now()) {
  const id = randomId(12), expires = now + LEASE_MS;
  await db.prepare('INSERT OR IGNORE INTO quota_buckets (scope, bucket_key, used) VALUES (?, ?, 0)').bind(scope, bucketKey).run();
  // Ét statement: indsæt kun, hvis brugt + aktive reservationer < limit. SQLite udfører det atomisk.
  const r = await db.prepare(`INSERT INTO quota_reservations (id, scope, bucket_key, expires_at)
      SELECT ?1, ?2, ?3, ?4 WHERE (
        (SELECT used FROM quota_buckets WHERE scope = ?2 AND bucket_key = ?3) +
        (SELECT COUNT(*) FROM quota_reservations WHERE scope = ?2 AND bucket_key = ?3 AND expires_at > ?5)
      ) < ?6`).bind(id, scope, bucketKey, expires, now, limit).run();
  if (!r.meta || r.meta.changes !== 1) throw new ApiError('quota', msg(lang, 'quota'), 429, secondsToMidnightUtc(now));
  return { id, scope, bucketKey };
}
export async function commit(db, res) {
  await db.batch([
    db.prepare('DELETE FROM quota_reservations WHERE id = ?').bind(res.id),
    db.prepare('UPDATE quota_buckets SET used = used + 1 WHERE scope = ? AND bucket_key = ?').bind(res.scope, res.bucketKey),
  ]);
}
export async function release(db, res) { await db.prepare('DELETE FROM quota_reservations WHERE id = ?').bind(res.id).run(); }
export async function sweep(db, now = Date.now()) { await db.prepare('DELETE FROM quota_reservations WHERE expires_at <= ?').bind(now - 10 * LEASE_MS).run(); }

/** Rate limit via Workers' ratelimit-binding (RL / RL_STRICT), ellers D1-tæller. strict = lavere grænse (sager, billedgenerering). */
export async function rateLimitEnv(env, scope, key, perMinute, lang = 'da', { strict = false } = {}) {
  const rl = strict ? (env.RL_STRICT || env.RL) : env.RL;
  if (rl && typeof rl.limit === 'function') {
    const { success } = await rl.limit({ key: `${scope}:${key}` });
    if (!success) throw new ApiError('rate_limited', msg(lang, 'rate'), 429, 60);
    return;
  }
  return rateLimit(env.DB, scope, key, perMinute, lang);
}
/** Rate limit: n kald pr. minut pr. nøgle og endpoint (D1). */
export async function rateLimit(db, scope, key, perMinute, lang = 'da', now = Date.now()) {
  const win = Math.floor(now / 60_000);
  const r = await db.prepare(`INSERT INTO rate_limits (scope, key, window_start, n) VALUES (?1, ?2, ?3, 1)
      ON CONFLICT(scope, key, window_start) DO UPDATE SET n = n + 1 RETURNING n`).bind(scope, key, win).first();
  if (r && r.n > perMinute) throw new ApiError('rate_limited', msg(lang, 'rate'), 429, 60 - Math.floor((now % 60_000) / 1000));
  if (Math.random() < 0.02) await db.prepare('DELETE FROM rate_limits WHERE window_start < ?').bind(win - 5).run();
}
export const secondsToMidnightUtc = (now = Date.now()) => Math.max(60, Math.ceil((86_400_000 - (now % 86_400_000)) / 1000));

/** Reservér kvote, kør fn (provider-kald), bogfør ved succes, frigiv ved fejl. Provider-timeout udløser ingen ny generering. */
export async function withQuota(db, scope, bucketKey, limit, lang, fn) {
  const res = await reserve(db, scope, bucketKey, limit, lang);
  try { const out = await fn(); await commit(db, res); return out; }
  catch (e) { await release(db, res).catch(() => { }); throw e; }
}
