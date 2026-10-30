// Interne ruter (runde 13, AP7): gæstebog, tællere og dagens besøgende i D1 for site-Workeren.
// Nås kun gennem service bindingen TING_AI (den offentlige proxy /api/ting-ai/* svarer 404 på intern/*, og headeren
// x-tingsvad-intern fjernes der). Turnstile, honeypot, validering og IP-takt bor fortsat i site-Workeren (functions/api/).
import { ok, fail, ApiError, msg, readJson } from '../lib/http.js';
import { ren, NR } from '../../../shared/gaestebog.js';
import { laesSager, laesGaester, grundsagerEfter, skrivSag, sletSag, adminListe, taeller, besoeg } from '../lib/gaestebog.js';

export const INTERN_HEADER = 'x-tingsvad-intern';
const TAELLERE = new Set(['afgoer']);

export async function intern(request, env, c, path, lang) {
  if (request.headers.get(INTERN_HEADER) !== '1') return fail('not_found', msg(lang, 'notfound'), 404);
  const url = new URL(request.url), m = request.method;
  if (path === 'intern/gaestebog' && m === 'GET') {
    const max = Math.max(1, Math.min(500, +url.searchParams.get('max') || 50));
    const cursor = url.searchParams.get('cursor'); // sagsnummer at fortsætte efter (grundsagerne kommer, når gæstesagerne er brugt op)
    if (cursor && NR.test(cursor)) { const g = await laesGaester(env, max, cursor); return ok({ sager: g.length < max ? [...g, ...grundsagerEfter(cursor)] : g }, 'server'); }
    return ok({ sager: await laesSager(env, max) }, 'server');
  }
  if (path === 'intern/gaestebog' && m === 'POST') {
    const b = await readJson(request, 4096);
    const navn = ren(b.navn).slice(0, 64), sag = ren(b.sag).slice(0, 400);
    if (!navn || sag.length < 4) throw new ApiError('bad_request', msg(lang, 'bad'), 400);
    return ok(await skrivSag(env, { navn, sag, kilde: b.kilde === 'mcp' ? 'mcp' : null }), 'server', 201);
  }
  if (path === 'intern/gaestebog' && m === 'DELETE') {
    const nr = url.searchParams.get('nr') || '';
    if (!NR.test(nr)) throw new ApiError('bad_request', msg(lang, 'bad'), 400);
    if (!(await sletSag(env, nr, request.headers.get('x-tingsvad-admin') || ''))) throw new ApiError('not_found', msg(lang, 'notfound'), 404);
    return ok({ nr }, 'server');
  }
  if (path === 'intern/gaestebog/admin' && m === 'GET') return ok(await adminListe(env), 'server');
  const t = /^intern\/taeller\/([a-z]+)$/.exec(path);
  if (t && TAELLERE.has(t[1]) && (m === 'GET' || m === 'POST')) return ok({ navn: t[1], n: await taeller(env, t[1], m === 'POST' ? 1 : 0) }, 'server');
  if (path === 'intern/besoeg' && (m === 'GET' || m === 'POST')) {
    const b = m === 'POST' ? await readJson(request, 512) : Object.fromEntries(url.searchParams);
    const dag = /^\d{4}-\d{2}-\d{2}$/.test(b.dag || '') ? b.dag : null, h = /^[0-9a-f]{16}$/.test(b.h || '') ? b.h : null;
    if (!dag || (m === 'POST' && !h)) throw new ApiError('bad_request', msg(lang, 'bad'), 400);
    return ok({ dag, n: await besoeg(env, dag, m === 'POST' ? h : null) }, 'server');
  }
  return fail('not_found', msg(lang, 'notfound'), 404);
}
