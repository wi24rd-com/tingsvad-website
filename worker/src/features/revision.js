// Revisionen (runde 9): Gudrun gennemgår hver dag alle sider på begge sprog.
// Cron starter én Workflow-instans pr. dato. Pr. side: Workeren henter siden (HTTP-status, middleware-headeren),
// og Browser Run tager et snapshot, hvor et indsprøjtet script tæller nøgleelementer og læser opsamlede JS-fejl.
// Screenshots i R2, resultater i D1. Gudruns kommentar er sjov; resultatet er faktisk.
// Runde 10: Browser Run er dyrt på gratisplanen. HTML'en hashes (SHA-256); er den uændret siden et bestået browsertjek
// inden for GENBRUG_DAGE, genbruges tjekket (genbrugt_fra), og browseren åbnes ikke. Om mandagen tjekkes alt fuldt.
import { hentGithubUdfald } from './gudrun-github.js';
import { tael } from '../lib/tael.js';
import { ok, ApiError, langOf } from '../lib/http.js';
import { cphDateKey } from '../lib/dates.js';
import { browserAction } from '../lib/budget.js';

const FÆLLES = { nav: '#sidenav a[aria-current]', footer: 'footer', indhold: 'main section' };
export const SIDER = [
  ['forside', '/', '/en/', { hero: '#hero', indgange: '.indgange' }],
  ['historien', '/historien/', '/en/history/', { personer: '#personer-sektion', slaegt: '#slaegt .tavle li' }],
  ['oplevelser', '/oplevelser/', '/en/experiences/', { oversigt: '.indgange.oversigt a' }],
  ['undersoegelsen', '/oplevelser/undersoegelsen/', '/en/experiences/investigation/', { afgoer: '#afgoer-knap', faner: '#r5-faner button' }],
  ['maskinparken', '/oplevelser/maskinparken/', '/en/experiences/machine-park/', { kort: '#r6-kort button', moede: '#moede-form' }],
  ['gaestebog', '/oplevelser/gaestebog/', '/en/experiences/guestbook/', { formular: '#gb-form' }],
  ['runevaerkstedet', '/oplevelser/runevaerkstedet/', '/en/experiences/rune-workshop/', { bevis: '#cert-form', runer: '#rune-ind' }],
  ['sagsmappen', '/oplevelser/sagsmappen/', '/en/experiences/case-file/', { mappe: '#sagsmappe' }],
  ['stolen', '/oplevelser/stolen/', '/en/experiences/the-stool/', { felt: '#st-felt .r9-felt' }],
  ['hittegods', '/oplevelser/hittegods/', '/en/experiences/lost-property/', { formular: '#hg-form' }],
  ['kodegryden', '/oplevelser/kodegryden/', '/en/experiences/the-cauldron/', { opgaver: '#kg-faner button' }],
  ['arkivet', '/arkivet/', '/en/archive/', { protokol: '.protokol table', spoerg: '#arkiv-form' }],
  ['sagsregister', '/arkivet/sagsregister/', '/en/archive/case-register/', { register: '.sagsregister tbody tr' }],
  ['maskinrummet', '/maskinrummet/', '/en/machine-room/', { kort: '#maskinrum-gitter article', nettet: '#net-svg', arkitektur: '#arkitektur' }],
  ['revisionen', '/maskinrummet/revisionen/', '/en/machine-room/audit/', { tabel: '#revisionen-ind' }],
  ['noedoevelser', '/maskinrummet/noedoevelser/', '/en/machine-room/emergency-drills/', { oevelser: '[data-oev]' }],
];
export const revisionsliste = () => SIDER.flatMap(([k, da, en, sel]) => [{ side: `${k}-da`, path: da, sel: { ...FÆLLES, ...sel } }, { side: `${k}-en`, path: en, sel: { ...FÆLLES, ...sel } }]);
export const revisionEnabled = env => !!(env.REVISION && env.DB && env.MEDIA && env.BROWSER && typeof env.BROWSER.quickAction === 'function');

export const GENBRUG_DAGE = 7, TJEK_VERSION = 'v1';
/** Fuld kørsel (alle sider i browseren) om mandagen, regnet på datoen i Europe/Copenhagen. */
export const fuldDag = dateKey => new Date(dateKey + 'T12:00:00Z').getUTCDay() === 1;
/** Fingeraftryk af det, browsertjekket afhænger af: HTML'en, selektorerne og tjekscriptets version. */
export async function htmlHash(html, sel) {
  const b = new TextEncoder().encode(`${TJEK_VERSION}\n${JSON.stringify(sel)}\n${html}`);
  return [...new Uint8Array(await crypto.subtle.digest('SHA-256', b))].map(x => x.toString(16).padStart(2, '0')).join('');
}
/** Må et tidligere browsertjek genbruges? Kun et originalt, bestået tjek af samme HTML inden for GENBRUG_DAGE, og kun hvis
    dagens hentning selv er i orden (200 og alle partials). */
export function kanGenbruge({ forrige, dateKey, hash, http, dele, fuld }) {
  if (fuld || !forrige || !hash || http !== 200) return false;
  if (forrige.status !== 'bestaaet' || forrige.genbrugt_fra || forrige.html_hash !== hash) return false;
  if (!['topbar', 'sidenav', 'footer'].every(d => String(dele || '').split(',').includes(d))) return false;
  const dage = (Date.parse(dateKey + 'T12:00:00Z') - Date.parse(forrige.date_key + 'T12:00:00Z')) / 864e5;
  return dage > 0 && dage <= GENBRUG_DAGE;
}

const unesc = s => String(s).replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
/** Læser resultatet, som det indsprøjtede script har skrevet i <html data-tv-revision="…">. */
export function læsSnapshot(content) {
  const m = String(content || '').match(/data-tv-revision="([^"]*)"/);
  if (!m) return null;
  try { return JSON.parse(unesc(m[1])); } catch (e) { return null; }
}
/** Vurderer én side: HTTP 200, alle tre partials sat ind, alle nøgleelementer fundet, ingen JS-fejl. */
export function vurder({ http, dele, snap, sel }) {
  const mangler = [];
  if (!snap) mangler.push('snapshot');
  else for (const k of Object.keys(sel)) if (!(snap.sel && snap.sel[k] > 0)) mangler.push(k);
  const delOk = ['topbar', 'sidenav', 'footer'].every(d => String(dele || '').split(',').includes(d));
  if (!delOk) mangler.push('partials');
  const fejl = snap && Array.isArray(snap.fejl) ? snap.fejl.slice(0, 5).map(x => String(x).slice(0, 160)) : [];
  return { status: http === 200 && !mangler.length && !fejl.length ? 'bestaaet' : 'fejlet', mangler, fejl };
}

/** Sitets CSP (script-src 'self') blokerer inline-scripts – også dem, Browser Run indsprøjter. Derfor et eget, versioneret script fra sitet. */
export function tjekScriptUrl(origin, sel) { return `${origin}/assets/revision-tjek-v1.js?s=${encodeURIComponent(JSON.stringify(sel))}`; }

/** Ét step: én side. Kaldes fra RevisionWorkflow. */
export async function revisérSide(env, dateKey, item, { fuld = false } = {}) {
  const origin = env.SITE_ORIGIN || 'https://tingsvad.dk', url = origin + item.path;
  let http = 0, dele = '', hash = null;
  try { const r = await fetch(url, { redirect: 'manual', headers: { 'user-agent': 'tingsvad-revisionen/1 (Gudrun)' } }); http = r.status; dele = r.headers.get('x-tingsvad-dele') || ''; if (http === 200) hash = await htmlHash(await r.text(), item.sel); else await r.body?.cancel(); } catch (e) { http = 0; }
  const forrige = await env.DB.prepare("SELECT date_key, status, html_hash, genbrugt_fra, screenshot_key FROM revision_sider WHERE side = ? AND date_key < ? AND genbrugt_fra IS NULL ORDER BY date_key DESC LIMIT 1").bind(item.side, dateKey).first();
  if (kanGenbruge({ forrige, dateKey, hash, http, dele, fuld })) {
    await env.DB.prepare('INSERT OR REPLACE INTO revision_sider (date_key, side, path, status, http, dele, mangler_json, fejl_json, screenshot_key, browser_ms, checked_at, html_hash, genbrugt_fra) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
      .bind(dateKey, item.side, item.path, 'bestaaet', http, dele, '[]', '[]', forrige.screenshot_key || null, 0, new Date().toISOString(), hash, forrige.date_key).run();
    return { side: item.side, status: 'bestaaet', browser: false };
  }
  const t0 = Date.now();
  const res = await browserAction(env, 'snapshot', { url, gotoOptions: { waitUntil: 'load', timeout: 30000 }, viewport: { width: 1280, height: 900 }, addScriptTag: [{ url: tjekScriptUrl(origin, item.sel) }], screenshotOptions: { type: 'jpeg', quality: 55 } });
  const j = res instanceof Response ? await res.json() : res;
  const out = (j && j.result) || j || {};
  const browserMs = res instanceof Response ? +(res.headers.get('x-browser-ms-used') || 0) || (Date.now() - t0) : Date.now() - t0;
  const snap = læsSnapshot(out.content);
  const v = vurder({ http, dele, snap, sel: item.sel });
  let screenshotKey = null;
  if (out.screenshot) {
    screenshotKey = `revision/${dateKey}/${item.side}.jpg`;
    const bin = Uint8Array.from(atob(out.screenshot), c => c.charCodeAt(0));
    await env.MEDIA.put(screenshotKey, bin, { httpMetadata: { contentType: 'image/jpeg' } });
  }
  await env.DB.prepare('INSERT OR REPLACE INTO revision_sider (date_key, side, path, status, http, dele, mangler_json, fejl_json, screenshot_key, browser_ms, checked_at, html_hash, genbrugt_fra) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL)')
    .bind(dateKey, item.side, item.path, v.status, http, dele, JSON.stringify(v.mangler), JSON.stringify(v.fejl), screenshotKey, browserMs, new Date().toISOString(), hash).run();
  return { side: item.side, status: v.status, browser: true };
}

/** En side, hvis step gav op efter alle forsøg (fx Browser Run-fejl): skriv den som fejlet, så den ikke forsvinder af optællingen. */
export async function registrerFejl(env, dateKey, item, besked) {
  await env.DB.prepare("INSERT OR IGNORE INTO revision_sider (date_key, side, path, status, http, dele, mangler_json, fejl_json, screenshot_key, browser_ms, checked_at) VALUES (?, ?, ?, 'fejlet', 0, '', '[]', ?, NULL, NULL, ?)")
    .bind(dateKey, item.side, item.path, JSON.stringify(['revision: ' + String(besked || 'ukendt fejl').slice(0, 120)]), new Date().toISOString()).run();
  return { side: item.side, status: 'fejlet', browser: true };
}

export async function afslut(env, dateKey) {
  const r = await env.DB.prepare("SELECT SUM(status = 'bestaaet') AS ok FROM revision_sider WHERE date_key = ?").bind(dateKey).first();
  const n = revisionsliste().length, okN = r ? (r.ok || 0) : 0; // altid hele listen: en side uden række tæller som fejlet
  await env.DB.prepare('UPDATE revisioner SET state = ?, pages = ?, passed = ?, failed = ?, finished_at = ? WHERE date_key = ?').bind('done', n, okN, n - okN, new Date().toISOString(), dateKey).run();
  tael(env, 'haendelse', 'revision-bestaaet', { antal: okN }); tael(env, 'haendelse', 'revision-fejlet', { antal: n - okN });
  return { n, ok: okN };
}

/** Kaldes af Cron: én revision pr. dato, tidligst kl. 06 lokal tid. */
export async function startRevision(env, log, dateKey = cphDateKey(), hour = 6) {
  if (!revisionEnabled(env) || hour < 6) return 'skipped';
  const ins = await env.DB.prepare('INSERT OR IGNORE INTO revisioner (date_key, state, started_at) VALUES (?, ?, ?)').bind(dateKey, 'running', new Date().toISOString()).run();
  if (!ins.meta || ins.meta.changes !== 1) return 'exists';
  try { await env.REVISION.create({ id: `revision-${dateKey}-${Date.now().toString(36)}`, params: { dateKey } }); } // D1-rækken sikrer én pr. dag; unikt id gør det muligt at køre en dag om
  catch (e) { if (!/exist/i.test(String(e && e.message))) { await env.DB.prepare('DELETE FROM revisioner WHERE date_key = ?').bind(dateKey).run(); throw e; } }
  log({ event: 'revision_started', dateKey, pages: revisionsliste().length });
  return 'started';
}

/** GET revision?lang= → seneste revision med alle sider (også dem, der ikke er kørt). */
export async function getRevision(request, env, ctx) {
  const lang = langOf(new URL(request.url).searchParams.get('lang'));
  const rev = await env.DB.prepare('SELECT * FROM revisioner ORDER BY date_key DESC LIMIT 1').first();
  if (!rev) return ok({ date: null, pages: revisionsliste().map(p => ({ side: p.side, path: p.path, status: 'ikke_koert' })) }, 'server');
  const rows = (await env.DB.prepare('SELECT * FROM revision_sider WHERE date_key = ?').bind(rev.date_key).all()).results || [];
  const map = Object.fromEntries(rows.map(r => [r.side, r]));
  const pages = revisionsliste().map(p => { const r = map[p.side]; return r ? { side: p.side, path: p.path, status: r.status, http: r.http, mangler: JSON.parse(r.mangler_json || '[]'), fejl: JSON.parse(r.fejl_json || '[]'), browserMs: r.browser_ms, checkedAt: r.checked_at, genbrugt: r.genbrugt_fra || undefined, screenshot: r.screenshot_key ? `/api/ting-ai/revision/billede/${r.genbrugt_fra || rev.date_key}/${p.side}` : null } : { side: p.side, path: p.path, status: 'ikke_koert' }; });
  const github = await hentGithubUdfald(env, rev.date_key);
  return ok({ date: rev.date_key, github, full: fuldDag(rev.date_key), browserMs: pages.reduce((a, p) => a + (+p.browserMs || 0), 0), reused: pages.filter(p => p.genbrugt).length, state: rev.state, startedAt: rev.started_at, finishedAt: rev.finished_at, passed: pages.filter(p => p.status === 'bestaaet').length, failed: pages.filter(p => p.status === 'fejlet').length, pages, lang }, 'server');
}

/** GET revision/billede/:dato/:side → screenshot fra R2 */
export async function revisionBillede(request, env, ctx, dateKey, side) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKey) || !/^[a-z]+-(da|en)$/.test(side)) throw new ApiError('not_found', 'no', 404);
  const obj = await env.MEDIA.get(`revision/${dateKey}/${side}.jpg`);
  if (!obj) throw new ApiError('not_found', 'no', 404);
  return new Response(obj.body, { headers: { 'content-type': 'image/jpeg', 'cache-control': 'public, max-age=86400', 'x-content-type-options': 'nosniff' } });
}
