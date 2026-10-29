// Idempotency keys på kostbare POST-kald. Nøglen bindes til session, endpoint og inputhash:
// samme nøgle + samme input → gensend gemt svar; samme nøgle + andet input → 409.
import { sha256Hex } from './crypto.js';
import { ApiError, msg } from './http.js';

const TTL_MS = 24 * 3600 * 1000;

export async function begin(db, { key, ownerHash, endpoint, input, lang = 'da', now = Date.now() }) {
  if (!key) return null;
  const k = `${ownerHash}:${endpoint}:${String(key).slice(0, 120)}`;
  const inputHash = (await sha256Hex(JSON.stringify(input))).slice(0, 32);
  const ins = await db.prepare('INSERT OR IGNORE INTO idempotency_keys (key, owner_hash, endpoint, input_hash, status, response_json, created_at) VALUES (?, ?, ?, ?, NULL, NULL, ?)').bind(k, ownerHash, endpoint, inputHash, now).run();
  if (ins.meta && ins.meta.changes === 1) return { k, replay: null };
  const row = await db.prepare('SELECT input_hash, status, response_json, created_at FROM idempotency_keys WHERE key = ?').bind(k).first();
  if (!row) return { k, replay: null };
  if (row.input_hash !== inputHash) throw new ApiError('conflict', msg(lang, 'conflict'), 409);
  if (row.status == null) {
    if (now - row.created_at > 120_000) { await db.prepare('UPDATE idempotency_keys SET created_at = ? WHERE key = ?').bind(now, k).run(); return { k, replay: null }; }
    throw new ApiError('in_progress', msg(lang, 'rate'), 409, 3);
  }
  return { k, replay: { status: row.status, body: row.response_json } };
}
export async function finish(db, idem, status, bodyObj) {
  if (!idem) return;
  await db.prepare('UPDATE idempotency_keys SET status = ?, response_json = ? WHERE key = ?').bind(status, JSON.stringify(bodyObj), idem.k).run();
}
export async function abort(db, idem) { if (idem) await db.prepare('DELETE FROM idempotency_keys WHERE key = ? AND status IS NULL').bind(idem.k).run(); }
export async function sweep(db, now = Date.now()) { await db.prepare('DELETE FROM idempotency_keys WHERE created_at < ?').bind(now - TTL_MS).run(); }
