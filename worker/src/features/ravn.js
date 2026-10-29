// Ravnecentralen (runde 9): bestil et bilag, og følg et rigtigt baggrundsjob.
// POST ravn → D1 (unik pr. ejer, bilagstype og input) → Queue → Workflow-instans → Browser Run (PDF) → R2.
// Køen leverer mindst én gang; Workflow-instansens id (ravn-<job>-<forsøg>) gør dobbeltlevering ufarlig.
// Uden kø (RAVN_QUEUE) oprettes Workflow-instansen direkte og jobbet mærkes via:"direct".
import { ok, ApiError, readJson, langOf, msg } from '../lib/http.js';
import { str } from '../lib/validate.js';
import { rateLimitEnv } from '../lib/quota.js';
import { browserAction } from '../lib/budget.js';
import { randomId, sha256Hex, hmacHex, timingSafeEqual } from '../lib/crypto.js';
import { cphDateKey } from '../lib/dates.js';
import { requireTurnstile } from '../lib/turnstile.js';

export const RAVN_STATES = ['i_koe', 'modtaget', 'flyver', 'skriver', 'leveret'];
const ID = /^R-\d{8}-[A-F0-9]{6}$/;
const MAX_FORSOEG = 3;
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export const NAVNE = {
  da: { fragments: { archive: 'Stykke A · fundet i aktindsigten', shield: 'Stykke B · fundet under skjoldets læderrem', excavation: 'Stykke C · fundet i udgravningen' }, found: { kam: 'Kam', moent: 'Mønt', runepind: 'Runepind' } },
  en: { fragments: { archive: 'Piece A · found in the file access', shield: 'Piece B · found under the shield’s leather strap', excavation: 'Piece C · found in the excavation' }, found: { kam: 'Comb', moent: 'Coin', runepind: 'Rune stick' } },
};
export const ravnEnabled = env => !!(env.RAVN && env.DB && env.MEDIA && env.BROWSER && typeof env.BROWSER.quickAction === 'function');

/** Normaliserer og validerer gæstens sagsmappe. Kun kendte id'er; alt tekstindhold escapes senere i skabelonen. */
export function normaliserSagsmappe(d, lang) {
  d = d && typeof d === 'object' ? d : {};
  const mængde = (v, tilladt) => [...new Set((Array.isArray(v) ? v : []).filter(x => typeof x === 'string' && tilladt.includes(x)))].sort();
  const fragments = mængde(d.fragments, Object.keys(NAVNE.da.fragments));
  const found = mængde(d.found, Object.keys(NAVNE.da.found));
  const ticket = typeof d.ticket === 'string' && /^K-0980-\d{4}$/.test(d.ticket) ? d.ticket : null;
  const chairCase = typeof d.chairCase === 'string' && /^S-\d{8}-[A-F0-9]{6}$/.test(d.chairCase) ? d.chairCase : null;
  const stool = [...new Set((Array.isArray(d.stool) ? d.stool : []).map(x => String(x).trim().slice(0, 40)).filter(x => /^[\p{L}\p{N} .,'’-]{1,40}$/u.test(x)))].slice(0, 8);
  const attempts = Number.isInteger(d.decideAttempts) && d.decideAttempts >= 0 ? Math.min(d.decideAttempts, 100000) : 0;
  const navn = d.navn == null || d.navn === '' ? '' : str(d.navn, { max: 40, name: 'navn', lang }).replace(/[\u0000-\u001f]/g, '');
  const c = d.cert && typeof d.cert === 'object' ? d.cert : null;
  const cert = c && typeof c.nr === 'string' && /^980-\d{4}$/.test(c.nr) && typeof c.dato === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(c.dato) && typeof c.navn === 'string' && c.navn.trim()
    ? { navn: str(c.navn, { max: 40, name: 'cert', lang }).replace(/[\u0000-\u001f]/g, ''), nr: c.nr, dato: c.dato } : null;
  return { fragments, found, ticket, chairCase, stool, decideAttempts: attempts, navn, cert };
}

export async function ravnToken(env, id, ownerHash) {
  const secret = env.SESSION_SECRET || ((env.MILJOE || 'production') !== 'production' ? 'tingsvad-dev' : null); // runde 13 (L1): ingen kendt nødnøgle i produktion
  if (!secret) throw new ApiError('not_configured', 'SESSION_SECRET missing', 503);
  return (await hmacHex(secret, `ravn|${id}|${ownerHash}`)).slice(0, 40);
}
async function tjekToken(env, row, token) { return typeof token === 'string' && timingSafeEqual(await ravnToken(env, row.id, row.owner_hash), token); }

export function view(row, token) {
  const steps = JSON.parse(row.steps_json || '[]');
  return { id: row.id, kind: row.kind, state: row.state, steps, attempts: row.attempts, maxAttempts: MAX_FORSOEG, via: row.via, error: row.state === 'fejlet' ? (row.error || 'error') : null,
    canRetry: row.state === 'fejlet' && row.attempts < MAX_FORSOEG, file: row.result_key && token ? `/api/ting-ai/ravn/${row.id}/fil?token=${token}` : null, createdAt: row.created_at, updatedAt: row.updated_at };
}

async function afsend(env, id, attempt) {
  if (env.RAVN_QUEUE) { await env.RAVN_QUEUE.send({ id, attempt }); return 'queue'; }
  await opretInstans(env, id, attempt); return 'direct';
}
async function opretInstans(env, id, attempt) {
  try { await env.RAVN.create({ id: `ravn-${id}-${attempt}`, params: { id } }); }
  catch (e) { if (!/exist/i.test(String(e && e.message))) throw e; } // dobbeltlevering: instansen findes allerede
}

/** POST ravn {kind:'sagsmappe', lang, data, turnstile} */
export async function bestil(request, env, ctx) {
  const body = await readJson(request, 4096);
  const lang = langOf(body.lang);
  if (!ravnEnabled(env)) throw new ApiError('not_configured', msg(lang, 'notconf'), 503);
  if (body.kind !== 'sagsmappe') throw new ApiError('bad_request', msg(lang, 'bad'), 400);
  const data = normaliserSagsmappe(body.data, lang);
  const inputHash = (await sha256Hex(JSON.stringify({ kind: body.kind, lang, data }))).slice(0, 32);
  const owner = ctx.session.ownerHash;
  const fundet = await env.DB.prepare('SELECT * FROM ravn_jobs WHERE owner_hash = ? AND kind = ? AND input_hash = ?').bind(owner, body.kind, inputHash).first();
  if (fundet) { const t = await ravnToken(env, fundet.id, owner); return ok({ ...view(fundet, t), token: t }, 'server', 200, { 'x-tingsvad-cache': 'hit' }); } // samme bestilling: samme ravn
  await requireTurnstile(env, { token: body.turnstile, ip: request.headers.get('cf-connecting-ip'), action: 'ravn', lang });
  await rateLimitEnv(env, 'ravn', owner, 3, lang, { strict: true });
  const idag = await env.DB.prepare('SELECT COUNT(*) AS n FROM ravn_jobs WHERE owner_hash = ? AND created_at >= ?').bind(owner, new Date(Date.now() - 86_400_000).toISOString()).first();
  if (idag && idag.n >= 5) throw new ApiError('rate_limited', lang === 'da' ? 'Ravnen har fløjet fem gange for dig i dag. Den sidder nu og ser på dig.' : 'The raven has flown five times for you today. It is now sitting and looking at you.', 429, 3600);
  const id = `R-${cphDateKey().replace(/-/g, '')}-${randomId(3).toUpperCase()}`, now = new Date().toISOString();
  const via = env.RAVN_QUEUE ? 'queue' : 'direct';
  const ins = await env.DB.prepare('INSERT OR IGNORE INTO ravn_jobs (id, owner_hash, kind, input_hash, input_json, language, state, steps_json, attempts, via, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?)')
    .bind(id, owner, body.kind, inputHash, JSON.stringify(data), lang, 'i_koe', JSON.stringify([{ s: 'i_koe', at: now }]), via, now, now).run();
  if (!ins.meta || ins.meta.changes !== 1) { // to samtidige bestillinger med samme input: den anden får den første
    const r2 = await env.DB.prepare('SELECT * FROM ravn_jobs WHERE owner_hash = ? AND kind = ? AND input_hash = ?').bind(owner, body.kind, inputHash).first();
    const t = await ravnToken(env, r2.id, owner); return ok({ ...view(r2, t), token: t }, 'server', 200, { 'x-tingsvad-cache': 'hit' });
  }
  await afsend(env, id, 0);
  const row = await env.DB.prepare('SELECT * FROM ravn_jobs WHERE id = ?').bind(id).first();
  const token = await ravnToken(env, id, owner);
  ctx.log({ event: 'ravn_ordered', id, via });
  return ok({ ...view(row, token), token }, 'server', 201);
}

async function hentMedToken(request, env, id) {
  const url = new URL(request.url), lang = langOf(url.searchParams.get('lang')), token = url.searchParams.get('token') || '';
  if (!ID.test(id)) throw new ApiError('not_found', msg(lang, 'notfound'), 404);
  const row = await env.DB.prepare('SELECT * FROM ravn_jobs WHERE id = ?').bind(id).first();
  if (!row) throw new ApiError('not_found', msg(lang, 'notfound'), 404);
  if (!(await tjekToken(env, row, token))) throw new ApiError('forbidden', msg(lang, 'forbidden'), 403);
  return { row, token, lang };
}

/** GET ravn/:id?token= */
export async function status(request, env, ctx, id) { const { row, token } = await hentMedToken(request, env, id); return ok(view(row, token), 'server'); }

/** GET ravn/:id/fil?token= → PDF fra R2 */
export async function fil(request, env, ctx, id) {
  const { row } = await hentMedToken(request, env, id);
  if (!row.result_key) throw new ApiError('not_found', 'not delivered', 404);
  const obj = await env.MEDIA.get(row.result_key);
  if (!obj) throw new ApiError('not_found', 'not delivered', 404);
  return new Response(obj.body, { headers: { 'content-type': 'application/pdf', 'content-disposition': `inline; filename="tingsvad-${row.kind}-${row.id}.pdf"`, 'cache-control': 'private, max-age=3600', 'x-content-type-options': 'nosniff' } });
}

/** POST ravn/:id/igen?token= → kontrolleret genstart af et fejlet job */
export async function igen(request, env, ctx, id) {
  const { row, token, lang } = await hentMedToken(request, env, id);
  if (row.state !== 'fejlet') return ok(view(row, token), 'server'); // intet at genstarte; ingen ny ravn
  if (row.attempts >= MAX_FORSOEG) throw new ApiError('rate_limited', lang === 'da' ? 'Ravnen er sendt tre gange. Den nægter nu.' : 'The raven has been sent three times. It now refuses.', 429, 86400);
  await rateLimitEnv(env, 'ravn', row.owner_hash, 3, lang, { strict: true });
  const now = new Date().toISOString(), attempt = row.attempts + 1;
  const u = await env.DB.prepare(`UPDATE ravn_jobs SET state = 'i_koe', attempts = ?, error = NULL, steps_json = json_insert(steps_json, '$[#]', json_object('s', 'i_koe', 'at', ?, 'retry', ?)), updated_at = ? WHERE id = ? AND state = 'fejlet' AND attempts = ?`)
    .bind(attempt, now, attempt, now, id, row.attempts).run();
  if (u.meta && u.meta.changes === 1) await afsend(env, id, attempt);
  const ny = await env.DB.prepare('SELECT * FROM ravn_jobs WHERE id = ?').bind(id).first();
  return ok(view(ny, token), 'server');
}

/** Idempotent overgang: kun fra de forventede tilstande; gentaget step ændrer intet. */
export async function overgang(db, id, fra, til, extra = {}) {
  const now = new Date().toISOString(), ph = fra.map(() => '?').join(',');
  const r = await db.prepare(`UPDATE ravn_jobs SET state = ?, steps_json = json_insert(steps_json, '$[#]', json_object('s', ?, 'at', ?)), updated_at = ?${extra.result_key ? ', result_key = ?' : ''}${extra.error ? ', error = ?' : ''} WHERE id = ? AND state IN (${ph})`)
    .bind(til, til, now, now, ...(extra.result_key ? [extra.result_key] : []), ...(extra.error ? [extra.error] : []), id, ...fra).run();
  return !!(r.meta && r.meta.changes === 1);
}

/** Queue-consumer: én Workflow-instans pr. (job, forsøg). */
export async function ravnQueue(batch, env, log) {
  for (const m of batch.messages) {
    const b = m.body || {};
    if (!ID.test(String(b.id || ''))) { m.ack(); continue; }
    try { await opretInstans(env, b.id, Number(b.attempt) || 0); m.ack(); log({ event: 'ravn_dispatched', id: b.id, attempt: b.attempt, deliveries: m.attempts }); }
    catch (e) { log({ event: 'ravn_dispatch_failed', id: b.id, error: String(e && e.message).slice(0, 160) }); m.retry({ delaySeconds: 10 }); }
  }
}

/** Skriver bilaget: fast skabelon, Browser Run → PDF → R2. Idempotent: findes filen, genbruges den. */
export async function skrivBilag(env, id) {
  const row = await env.DB.prepare('SELECT * FROM ravn_jobs WHERE id = ?').bind(id).first();
  if (!row) throw new Error('job missing');
  const key = `ravn/${row.id}.pdf`;
  if (await env.MEDIA.head(key)) return key;
  const html = sagsmappeHtml(JSON.parse(row.input_json), row.language, row, env.SITE_ORIGIN || 'https://tingsvad.dk');
  const r = await browserAction(env, 'pdf', { html, gotoOptions: { waitUntil: 'load', timeout: 30000 }, pdfOptions: { format: 'a4', printBackground: true, margin: { top: '14mm', bottom: '16mm', left: '14mm', right: '14mm' } } });
  const bytes = new Uint8Array(await (r instanceof Response ? r.arrayBuffer() : new Response(r).arrayBuffer()));
  if (bytes.length < 1000 || bytes[0] !== 0x25) throw new Error('not a pdf: ' + new TextDecoder().decode(bytes.slice(0, 120)));
  await env.MEDIA.put(key, bytes, { httpMetadata: { contentType: 'application/pdf' } });
  return key;
}

/** Den faste skabelon. Al tekst fra gæsten er escapet; kun kendte id'er får navne. */
export function sagsmappeHtml(d, lang, row, origin) {
  const da = lang !== 'en', N = NAVNE[da ? 'da' : 'en'];
  const dato = new Date(row.created_at).toLocaleDateString(da ? 'da-DK' : 'en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Europe/Copenhagen' });
  const linje = (k, v) => `<tr><th>${esc(k)}</th><td>${v}</td></tr>`;
  const tom = `<span class="tom">${da ? 'Intet ført til protokols' : 'Nothing minuted'}</span>`;
  const frag = d.fragments.length ? d.fragments.map(f => esc(N.fragments[f])).join('<br>') : tom;
  const fund = d.found.length ? d.found.map(f => esc(N.found[f])).join(', ') : tom;
  const side2 = d.fragments.length === 3 ? (da ? 'Samlet. Den siger: udsat.' : 'Assembled. It says: adjourned.') : (da ? `${d.fragments.length} af 3 stykker` : `${d.fragments.length} of 3 pieces`);
  return `<!doctype html><html lang="${da ? 'da' : 'en'}"><head><meta charset="utf-8"><title>${da ? 'Sagsmappe' : 'Case file'} ${esc(row.id)}</title><style>
  @page{size:A4}body{font-family:Georgia,'Iowan Old Style',serif;color:#1d1f21;margin:0;font-size:12.5pt;line-height:1.45}
  header{display:flex;gap:18px;align-items:center;border-bottom:3px double #8c4a2f;padding-bottom:12px;margin-bottom:16px}
  header img{width:150px;height:auto}h1{font:700 26pt Arial,Helvetica,sans-serif;margin:0;letter-spacing:-.01em}
  .k{font:600 9pt 'Courier New',monospace;letter-spacing:.14em;text-transform:uppercase;color:#8c4a2f}
  table{width:100%;border-collapse:collapse;margin-top:8px}th{width:34%;text-align:left;vertical-align:top;font:600 9.5pt 'Courier New',monospace;letter-spacing:.06em;text-transform:uppercase;color:#555;padding:8px 10px 8px 0;border-bottom:1px solid #ddd}
  td{padding:8px 0;border-bottom:1px solid #ddd}.tom{color:#888;font-style:italic}
  .stempel{margin:28px 0 0 auto;width:max-content;transform:rotate(-6deg);border:5px solid #8c4a2f;color:#8c4a2f;font:700 26pt Arial,sans-serif;letter-spacing:.2em;padding:4px 18px}
  footer{margin-top:26px;font:9pt 'Courier New',monospace;color:#777;border-top:1px solid #ccc;padding-top:8px}
  </style></head><body>
  <header><img src="${esc(origin)}/assets/pak/maskinpark/sagsmappen-600.webp" alt=""><div><div class="k">Tingsvad Ting · ${da ? 'Ravnecentralen' : 'The raven exchange'}</div><h1>${da ? 'Sagsmappe' : 'Case file'}${d.navn ? ' · ' + esc(d.navn) : ''}</h1><div class="k">${esc(row.id)} · ${esc(dato)}</div></div></header>
  <table>
   ${linje(da ? 'Side 2 af afgørelsen' : 'Page 2 of the decision', esc(side2))}
   ${linje(da ? 'Fundne stykker' : 'Pieces found', frag)}
   ${linje(da ? 'Fund i udgravningen' : 'Finds in the excavation', fund)}
   ${linje(da ? 'Kønummer' : 'Queue number', d.ticket ? esc(d.ticket) : tom)}
   ${linje(da ? 'Stolansøgning' : 'Stool application', d.chairCase ? esc(d.chairCase) + (d.stool.length ? ' · ' + d.stool.map(esc).join(', ') : '') : (d.stool.length ? (da ? 'Ønsker noteret, ikke indsendt: ' : 'Wishes noted, not submitted: ') + d.stool.map(esc).join(', ') : tom))}
   ${linje(da ? 'Bevis for fremmøde' : 'Certificate of attendance', d.cert ? esc(d.cert.navn) + ' · ' + esc(d.cert.nr) + ' · ' + esc(new Date(d.cert.dato + 'T12:00:00Z').toLocaleDateString(da ? 'da-DK' : 'en-GB', { day: 'numeric', month: 'long', year: 'numeric' })) : tom)}
   ${linje(da ? 'Forsøg på at afgøre sagen' : 'Attempts to decide the case', esc(d.decideAttempts) + (d.decideAttempts ? (da ? ' · alle udsat' : ' · all adjourned') : ''))}
  </table>
  <div class="stempel">${da ? 'UDSAT' : 'ADJOURNED'}</div>
  <footer>${da ? 'Udstedt af Ravnecentralen på tingsvad.dk. Bilaget er fiktion og har ingen retsvirkning, hvilket det deler med alt andet, tinget har udstedt.' : 'Issued by the raven exchange at tingsvad.dk. The document is fiction and has no legal effect, which it shares with everything else the thing has issued.'}<br>${da ? 'Leveret efter' : 'Delivered after'} ${esc(row.attempts + 1)} ${da ? (row.attempts ? 'forsøg' : 'forsøg') : (row.attempts ? 'attempts' : 'attempt')} · ${row.via === 'queue' ? 'Queues → Workflows → Browser Run → R2' : 'Workflows → Browser Run → R2'}</footer>
  </body></html>`;
}
