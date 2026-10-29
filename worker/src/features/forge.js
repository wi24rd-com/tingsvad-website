// C05 — Lav et falsk historisk bevis. Kun godkendte enum-værdier; prompt bygges på serveren; cache i R2 + D1; parallelle identiske requests låses.
import { ok, ApiError, readJson, langOf, msg } from '../lib/http.js';
import { oneOf } from '../lib/validate.js';
import { runImage, runJson } from '../lib/ai.js';
import { withQuota, quotaLimit, rateLimitEnv } from '../lib/quota.js';
import { systemBase } from '../lib/canon.js';
import { cphDateKey } from '../lib/dates.js';
import { sha256Hex, randomId } from '../lib/crypto.js';
import { begin, finish, abort } from '../lib/idempotency.js';

export const OBJECTS = ['skjold', 'stol', 'ske'], SITES = ['vad', 'birk', 'arkiv'], CONDITIONS = ['sodet', 'mosgroet', 'velbevaret'];
const EN = { skjold: 'round wooden Viking shield with iron boss', stol: 'three-legged oak stool', ske: 'carved wooden spoon', vad: 'at a misty river ford with moss-grown stepping stones at dawn', birk: 'in a birch grove with pale trunks and soft morning light', arkiv: 'on a wooden archive table among scrolls and a lantern', sodet: 'soot-blackened, charred edges', mosgroet: 'moss-grown, damp, green patina', velbevaret: 'unusually well preserved, almost new, suspiciously polished' };
const DA = { skjold: 'skjold', stol: 'stol', ske: 'ske', vad: 'vadestedet', birk: 'birkelunden', arkiv: 'arkivet', sodet: 'sodet', mosgroet: 'mosgroet', velbevaret: 'usædvanligt velbevaret' };
const PROV_SCHEMA = { type: 'object', required: ['provenance'], properties: { provenance: { type: 'string', minLength: 30, maxLength: 420 } } };
const LEASE_MS = 90_000;

function prompt(o, s, c) { return `Painterly Nordic illustration in warm dawn light, soft fog, museum object study: a ${EN[o]}, ${EN[c]}, ${EN[s]}. No text, no letters, no people, no modern objects. Muted earth tones, moss green, gold morning light.`; }
function editorialProvenance(lang, o, s, c) { return lang === 'da' ? `Fundet ved ${DA[s]} af en ukendt tingmand, der ikke ville have det med hjem. Genstanden, en ${DA[o]}, er ${DA[c]} og har ingen dokumenteret ejer. Gudrun har bedt om bilag. Bilaget er dette fund. (Redaktionel proveniens.)` : `Found at ${DA[s]} by an unknown member of the thing who did not want it at home. The object, a ${DA[o]}, is ${DA[c]} and has no documented owner. Gudrun has asked for documents. The document is this find. (Editorial provenance.)`; }

export async function forge(request, env, ctx) {
  const body = await readJson(request, 2048);
  const lang = langOf(body.lang);
  const o = oneOf(body.object, OBJECTS, 'object'), s = oneOf(body.site, SITES, 'site'), c = oneOf(body.condition, CONDITIONS, 'condition');
  if (!env.AI || !env.MEDIA) throw new ApiError('not_configured', msg(lang, 'notconf'), 503);
  await rateLimitEnv(env, 'forge', ctx.session.ownerHash, Math.max(2, Math.floor((+env.RATE_PER_MINUTE || 8) / 2)), lang, { strict: true });
  const key = (await sha256Hex(['forge', o, s, c, lang, env.PROMPT_VERSION, env.IMAGE_MODEL].join('|'))).slice(0, 24);
  const idem = await begin(env.DB, { key: request.headers.get('idempotency-key'), ownerHash: ctx.session.ownerHash, endpoint: 'forge', input: { o, s, c, lang }, lang });
  if (idem && idem.replay) return new Response(idem.replay.body, { status: idem.replay.status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', 'x-tingsvad-cache': 'replay' } });
  try {
    const done = await lookup(env, key, lang);
    if (done) { const r = ok(done, 'ai', 200, { 'x-tingsvad-cache': 'hit' }); await finish(env.DB, idem, 200, await r.clone().json()); return r; }
    const now = Date.now(), jobId = randomId(8);
    const lock = await env.DB.prepare(`INSERT INTO generation_jobs (id, kind, cache_key, owner_hash, state, lease_until, created_at) VALUES (?, 'forge', ?, ?, 'running', ?, ?)
        ON CONFLICT(cache_key) DO UPDATE SET id = excluded.id, owner_hash = excluded.owner_hash, state = 'running', lease_until = excluded.lease_until WHERE generation_jobs.state != 'running' OR generation_jobs.lease_until < ?`).bind(jobId, key, ctx.session.ownerHash, now + LEASE_MS, new Date(now).toISOString(), now).run();
    if (!lock.meta || lock.meta.changes !== 1) { await abort(env.DB, idem); return ok({ jobRef: key, state: 'queued' }, 'ai', 202); }
    if (env.FORGE_QUEUE) { // asynkront via Queues: svar 202, consumer genererer, frontend poller forge/:ref
      await env.FORGE_QUEUE.send({ key, o, s, c, lang });
      await abort(env.DB, idem);
      return ok({ jobRef: key, state: 'queued' }, 'ai', 202);
    }
    try {
      const meta = await runForgeJob(env, { key, o, s, c, lang }, ctx.log);
      const r = ok(result(key, meta, lang), 'ai'); await finish(env.DB, idem, 200, await r.clone().json()); return r;
    } catch (e) { throw e; }
  } catch (e) { await abort(env.DB, idem); throw e; }
}
/** Selve genereringen (synkront eller fra kø-consumer). Låsen i generation_jobs er allerede taget af kalderen (eller tages i consumeren). */
export async function runForgeJob(env, { key, o, s, c, lang }, log) {
  try {
    const img = await withQuota(env.DB, 'image', cphDateKey(), quotaLimit(env, 'image'), lang, () => runImage(env, { prompt: prompt(o, s, c), lang, log }));
    const r2key = `forge/${key}.${img.contentType === 'image/png' ? 'png' : 'jpg'}`;
    await env.MEDIA.put(r2key, img.bytes, { httpMetadata: { contentType: img.contentType, cacheControl: 'public, max-age=31536000, immutable' } });
    let provenance, provSource = 'ai';
    try {
      const system = systemBase(lang) + (lang === 'da' ? '\nSkriv en kort, morsom og tydeligt opdigtet proveniens (2–3 sætninger) til et falsk historisk fund fra Tingsvad. Nævn fundsted og tilstand. Ingen virkelige museer, personer eller årstal før 980. Svar kun med JSON: {"provenance":"..."}' : '\nWrite a short, amusing and clearly fictional provenance (2–3 sentences) for a fake historical find from Tingsvad. Mention the site and condition. No real museums, people or years before 980. Answer only with JSON: {"provenance":"..."}');
      const user = lang === 'da' ? `Genstand: ${DA[o]}. Fundsted: ${DA[s]}. Tilstand: ${DA[c]}.` : `Object: ${DA[o]}. Site: ${DA[s]}. Condition: ${DA[c]}.`;
      provenance = (await withQuota(env.DB, 'text', cphDateKey(), quotaLimit(env, 'text'), lang, () => runJson(env, { system, user, schema: PROV_SCHEMA, lang, maxTokens: 260, log }))).data.provenance;
    } catch (e) { provenance = editorialProvenance(lang, o, s, c); provSource = 'editorial'; }
    const meta = { object: o, site: s, condition: c, lang, provenance, provSource, r2key };
    await env.DB.batch([
      env.DB.prepare('INSERT OR REPLACE INTO media_assets (key, content_type, prompt_version, model, meta_json, created_at) VALUES (?, ?, ?, ?, ?, ?)').bind(key, img.contentType, env.PROMPT_VERSION, img.model, JSON.stringify(meta), new Date().toISOString()),
      env.DB.prepare('UPDATE generation_jobs SET state = ?, lease_until = 0 WHERE cache_key = ?').bind('done', key),
    ]);
    return meta;
  } catch (e) {
    await env.DB.prepare('UPDATE generation_jobs SET state = ?, error_code = ?, lease_until = 0 WHERE cache_key = ?').bind('failed', (e && e.code) || 'error', key).run();
    throw e;
  }
}
/** Kø-consumer: én besked = ét fund. Er fundet allerede lavet (dublet/retry), springes det over. */
export async function forgeQueue(batch, env, log) {
  for (const m of batch.messages) {
    const job = m.body || {};
    try {
      if (!/^[a-f0-9]{24}$/.test(job.key || '')) { m.ack(); continue; }
      if (await env.DB.prepare('SELECT 1 FROM media_assets WHERE key = ?').bind(job.key).first()) { m.ack(); continue; }
      await env.DB.prepare("UPDATE generation_jobs SET state = 'running', lease_until = ? WHERE cache_key = ?").bind(Date.now() + LEASE_MS, job.key).run();
      await runForgeJob(env, job, log); m.ack();
    } catch (e) { log({ event: 'forge_queue_failed', key: job.key, code: e && e.code, error: String(e && e.message).slice(0, 160) }); if (e && e.code === 'quota') m.ack(); else m.retry({ delaySeconds: 30 }); }
  }
}
function result(key, meta, lang) { return { jobRef: key, state: 'done', key, imageUrl: `/api/ting-ai/forge/image/${key}`, provenance: meta.provenance, provenanceSource: meta.provSource, alt: lang === 'da' ? `Opdigtet fund: ${DA[meta.object]}, ${DA[meta.condition]}, fundet ved ${DA[meta.site]}.` : `Fictional find: ${DA[meta.object]}, ${DA[meta.condition]}, found at ${DA[meta.site]}.`, label: lang === 'da' ? 'Opdigtet fund fra Tingsvad' : 'Fictional find from Tingsvad' }; }
async function lookup(env, key, lang) {
  const row = await env.DB.prepare('SELECT meta_json FROM media_assets WHERE key = ?').bind(key).first();
  return row ? result(key, JSON.parse(row.meta_json), lang) : null;
}
export async function forgeStatus(request, env, ctx, ref) {
  const lang = langOf(new URL(request.url).searchParams.get('lang'));
  if (!/^[a-f0-9]{24}$/.test(ref)) throw new ApiError('not_found', msg(lang, 'notfound'), 404);
  const done = await lookup(env, ref, lang); if (done) return ok(done, 'ai', 200, { 'x-tingsvad-cache': 'hit' });
  const job = await env.DB.prepare('SELECT state, lease_until FROM generation_jobs WHERE cache_key = ?').bind(ref).first();
  if (!job) throw new ApiError('not_found', msg(lang, 'notfound'), 404);
  const state = job.state === 'running' && job.lease_until > Date.now() ? 'queued' : job.state === 'done' ? 'done' : 'failed';
  return ok({ jobRef: ref, state }, 'ai', state === 'queued' ? 202 : 200);
}
export async function forgeImage(request, env, ctx, key) {
  if (!/^[a-f0-9]{24}$/.test(key) || !env.MEDIA) throw new ApiError('not_found', 'no', 404);
  const row = await env.DB.prepare('SELECT content_type, meta_json FROM media_assets WHERE key = ?').bind(key).first();
  if (!row) throw new ApiError('not_found', 'no', 404);
  const obj = await env.MEDIA.get(JSON.parse(row.meta_json).r2key);
  if (!obj) throw new ApiError('not_found', 'no', 404);
  return new Response(obj.body, { headers: { 'content-type': row.content_type, 'cache-control': 'public, max-age=31536000, immutable', 'x-content-type-options': 'nosniff', 'content-disposition': 'inline' } });
}
