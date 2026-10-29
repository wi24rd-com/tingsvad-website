// C06 — Bureaukratiet arbejder videre. POST jobs opretter en sag (idempotent); en Workflow-instans sover og flytter sagen ét trin ad gangen.
// GET jobs/:id kræver den private capability (token). Løbenumre giver ingen adgang.
import { ok, ApiError, readJson, langOf, msg } from '../lib/http.js';
import { str } from '../lib/validate.js';
import { rateLimitEnv } from '../lib/quota.js';
import { newCapability, capabilityHash } from '../lib/session.js';
import { randomId } from '../lib/crypto.js';
import { cphDateKey } from '../lib/dates.js';
import { begin, finish, abort } from '../lib/idempotency.js';
import { bumpEvent } from './news.js';
import { requireTurnstile } from '../lib/turnstile.js';

export const STEPS = 4; // 0 Modtaget → 1 Afventer kontrol → 2 Sendt tilbage til begyndelsen → 3 Stol muligvis ledig
export function delays(env) { const d = String(env.CASE_DELAYS_SECONDS || '60,7200,86400').split(',').map(x => Math.max(5, parseInt(x, 10) || 0)); while (d.length < STEPS - 1) d.push(d[d.length - 1] || 60); return d.slice(0, STEPS - 1); }

export function view(row) {
  const history = JSON.parse(row.history_json || '[]');
  return { caseId: row.id, stateIndex: row.state, history, nextAt: row.state >= STEPS - 1 ? null : row.next_at, done: row.state >= STEPS - 1, updatedAt: row.updated_at, wishes: row.wishes || '' };
}

export async function createJob(request, env, ctx) {
  const body = await readJson(request, 2048);
  const lang = langOf(body.lang);
  if (!env.CHAIR_CASES) throw new ApiError('not_configured', msg(lang, 'notconf'), 503);
  const wishes = str(body.wishes, { max: 120, name: 'wishes', lang });
  await requireTurnstile(env, { token: body.turnstile, ip: request.headers.get('cf-connecting-ip'), action: 'stol', lang });
  await rateLimitEnv(env, 'jobs', ctx.session.ownerHash, 3, lang, { strict: true });
  const idem = await begin(env.DB, { key: request.headers.get('idempotency-key'), ownerHash: ctx.session.ownerHash, endpoint: 'jobs', input: { wishes, lang }, lang });
  if (idem && idem.replay) return new Response(idem.replay.body, { status: idem.replay.status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', 'x-tingsvad-cache': 'replay' } });
  try {
    const open = await env.DB.prepare('SELECT COUNT(*) AS n FROM chair_cases WHERE owner_hash = ? AND state < ?').bind(ctx.session.ownerHash, STEPS - 1).first();
    if (open && open.n >= 3) throw new ApiError('rate_limited', lang === 'da' ? 'Tre sager i behandling er rigeligt. Også for tinget.' : 'Three cases in progress is plenty. Also for the thing.', 429, 3600);
    const id = `S-${cphDateKey().replace(/-/g, '')}-${randomId(3).toUpperCase()}`;
    const cap = await newCapability();
    const now = new Date(), d = delays(env), nextAt = new Date(now.getTime() + d[0] * 1000).toISOString();
    await env.DB.prepare('INSERT INTO chair_cases (id, owner_hash, token_hash, state, wishes, language, history_json, next_at, updated_at, created_at) VALUES (?, ?, ?, 0, ?, ?, ?, ?, ?, ?)')
      .bind(id, ctx.session.ownerHash, cap.tokenHash, wishes, lang, JSON.stringify([now.toISOString()]), nextAt, now.toISOString(), now.toISOString()).run();
    await env.CHAIR_CASES.create({ id: `case-${id}`, params: { caseId: id } });
    ctx.waitUntil(bumpEvent(env.DB, 'chair_application'));
    const row = await env.DB.prepare('SELECT * FROM chair_cases WHERE id = ?').bind(id).first();
    const r = ok({ ...view(row), token: cap.token, retrievalCode: `${id}.${cap.token}` }, 'server', 201);
    await finish(env.DB, idem, 201, await r.clone().json());
    return r;
  } catch (e) { await abort(env.DB, idem); throw e; }
}

export async function getJob(request, env, ctx, id) {
  const url = new URL(request.url); const lang = langOf(url.searchParams.get('lang'));
  const tokenHash = await capabilityHash(url.searchParams.get('token') || '');
  if (!/^S-\d{8}-[A-F0-9]{6}$/.test(id) || !tokenHash) throw new ApiError('forbidden', msg(lang, 'forbidden'), 403);
  const row = await env.DB.prepare('SELECT * FROM chair_cases WHERE id = ?').bind(id).first();
  if (!row) throw new ApiError('not_found', msg(lang, 'notfound'), 404);
  if (row.token_hash !== tokenHash) throw new ApiError('forbidden', msg(lang, 'forbidden'), 403);
  return ok(view(row), 'server');
}

/** Idempotent statusovergang: kun fra forventet state, og kun én gang pr. step_key. Gentaget step flytter aldrig sagen to trin. */
export async function transition(db, caseId, fromState, delaySecondsNext) {
  const stepKey = `to-${fromState + 1}`;
  const now = new Date();
  const row = await db.prepare('SELECT history_json FROM chair_cases WHERE id = ? AND state = ?').bind(caseId, fromState).first();
  if (!row) return 'skipped';
  const marked = await db.prepare('INSERT OR IGNORE INTO chair_transitions (case_id, step_key, done_at) VALUES (?, ?, ?)').bind(caseId, stepKey, now.toISOString()).run();
  if (!marked.meta || marked.meta.changes !== 1) return 'already';
  const history = JSON.parse(row.history_json || '[]'); history[fromState + 1] = now.toISOString();
  const nextAt = delaySecondsNext ? new Date(now.getTime() + delaySecondsNext * 1000).toISOString() : null;
  const r = await db.prepare('UPDATE chair_cases SET state = ?, history_json = ?, next_at = ?, updated_at = ? WHERE id = ? AND state = ?').bind(fromState + 1, JSON.stringify(history), nextAt, now.toISOString(), caseId, fromState).run();
  return r.meta && r.meta.changes === 1 ? 'moved' : 'skipped';
}
