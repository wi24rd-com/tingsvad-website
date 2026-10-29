// Gudruns GitHub-issues (runde 10, trin 4d): når revisionen har fejl, opretter Gudrun ét issue pr. dato i sitets repo;
// når en senere revision består helt, lukker hun sine åbne issues med en kommentar.
// Token: fint-scopet (kun Issues: write på ét repo) i Secrets Store (binding GITHUB_TOKEN_STORE) eller som Worker-secret
// GITHUB_TOKEN (runde 12: lib/hemmelighed.js); repoet står i var GITHUB_REPO.
// Idempotent: issuet bærer en usynlig markør <!-- gudrun:revision:YYYY-MM-DD -->, og åbne issues listes (ikke søges –
// søge-API'et er forsinket) før oprettelse. Teksten er på engelsk som alt andet på GitHub og nævner kun offentlige ting:
// sti, HTTP-status, hvilke nøgleelementer der manglede og antal JS-fejl. Aldrig fejltekster fra Workeren eller Browser Run.
import { tael } from '../lib/tael.js';
import { revisionsliste } from './revision.js';
import { harHemmelighed, hemmelighed } from '../lib/hemmelighed.js';

export const GH_API = 'https://api.github.com', GH_LABEL = 'gudrun', SITE = 'https://tingsvad.dk';
export const githubEnabled = env => !!(harHemmelighed(env, 'GITHUB_TOKEN') && /^[\w.-]+\/[\w.-]+$/.test(env.GITHUB_REPO || ''));
export const markoer = dateKey => `<!-- gudrun:revision:${dateKey} -->`;
const MARK_RE = /<!-- gudrun:revision:(\d{4}-\d{2}-\d{2}) -->/;

const ren = s => String(s == null ? '' : s).replace(/[`|<>\r\n]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 80);

/** Issue-titel og -tekst ud fra dagens fejlede sider (rækker fra revision_sider). Ren funktion – testes uden netværk. */
export function issueTekst(dateKey, fejlede, i_alt) {
  const n = fejlede.length;
  const title = `Audit ${dateKey}: ${n} of ${i_alt} page${i_alt === 1 ? '' : 's'} failed`;
  const raekker = fejlede.slice(0, 40).map(r => {
    const mangler = (() => { try { return JSON.parse(r.mangler_json || '[]'); } catch (e) { return []; } })().map(ren).filter(Boolean);
    const fejl = (() => { try { return JSON.parse(r.fejl_json || '[]'); } catch (e) { return []; } })();
    const intern = fejl.some(f => /^revision:/.test(String(f))); // registrerFejl: tjekket kunne ikke gennemføres
    const js = intern ? 0 : fejl.length;
    const hvad = intern ? 'check could not be completed' : [mangler.length ? `missing: ${mangler.join(', ')}` : '', js ? `${js} JS error${js === 1 ? '' : 's'}` : ''].filter(Boolean).join('; ') || 'see the audit page';
    return `| \`${ren(r.side)}\` | [${ren(r.path)}](${SITE}${encodeURI(ren(r.path))}) | ${+r.http || '–'} | ${hvad} |`;
  });
  const body = [
    markoer(dateKey),
    `Gudrun went through every page this morning and put her pencil down on ${n} of them.`,
    '',
    '| Page | Path | HTTP | What went wrong |',
    '|---|---|---|---|',
    ...raekker,
    n > 40 ? `\n…and ${n - 40} more.` : '',
    '',
    `Screenshots and the full table: ${SITE}/maskinrummet/revisionen/ (English: ${SITE}/en/machine-room/audit/).`,
    '',
    '_Opened automatically by the daily audit (Cloudflare Workflow → GitHub REST). Gudrun closes it herself when a later audit passes in full._',
  ].filter(x => x !== null).join('\n');
  return { title, body };
}

async function gh(env, method, path, body) {
  const token = (await hemmelighed(env, 'GITHUB_TOKEN')).v;
  if (!token) throw new Error('github token missing');
  const r = await fetch(GH_API + path, {
    method,
    headers: { authorization: `Bearer ${token}`, accept: 'application/vnd.github+json', 'x-github-api-version': '2022-11-28', 'user-agent': 'tingsvad-revisionen/1 (Gudrun)', ...(body ? { 'content-type': 'application/json' } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!r.ok) { await r.body?.cancel(); throw new Error(`github ${method} ${path.split('?')[0].replace(/\/repos\/[^/]+\/[^/]+/, '/repos/…')} → ${r.status}`); }
  return r.status === 204 ? null : r.json();
}

/** Gudruns åbne issues: åbne issues (ikke PR'er) med markøren. Højst 100 åbne issues i repoet forventes. */
export async function aabneGudrunIssues(env) {
  const liste = await gh(env, 'GET', `/repos/${env.GITHUB_REPO}/issues?state=open&per_page=100`);
  return (liste || []).filter(i => !i.pull_request && MARK_RE.test(i.body || '')).map(i => ({ number: i.number, dato: (i.body.match(MARK_RE) || [])[1] }));
}

/** Kaldes som sidste step i RevisionWorkflow. Returnerer et lille resultat til Workflow-loggen. Kaster ved netværksfejl (step'et genforsøger). */
export async function gudrunPaaGithub(env, dateKey) {
  if (!githubEnabled(env)) return { github: 'off' };
  const rows = (await env.DB.prepare('SELECT side, path, status, http, mangler_json, fejl_json FROM revision_sider WHERE date_key = ?').bind(dateKey).all()).results || [];
  const alle = revisionsliste(), map = Object.fromEntries(rows.map(r => [r.side, r]));
  const fejlede = alle.map(p => map[p.side] || { side: p.side, path: p.path, http: 0, mangler_json: '["not checked"]', fejl_json: '[]' }).filter(r => r.status !== 'bestaaet');
  const aabne = await aabneGudrunIssues(env);
  if (fejlede.length) {
    const fandtes = aabne.find(i => i.dato === dateKey);
    if (fandtes) return { github: 'exists', issue: fandtes.number };
    const { title, body } = issueTekst(dateKey, fejlede, alle.length);
    const ny = await gh(env, 'POST', `/repos/${env.GITHUB_REPO}/issues`, { title, body, labels: [GH_LABEL] });
    tael(env, 'haendelse', 'gudrun-issue-oprettet', { detalje: dateKey });
    return { github: 'opened', issue: ny && ny.number };
  }
  const lukket = [];
  for (const i of aabne) {
    await gh(env, 'POST', `/repos/${env.GITHUB_REPO}/issues/${i.number}/comments`, { body: `All ${alle.length} pages passed the audit on ${dateKey}. Gudrun closes the case.` });
    await gh(env, 'PATCH', `/repos/${env.GITHUB_REPO}/issues/${i.number}`, { state: 'closed', state_reason: 'completed' });
    lukket.push(i.number);
  }
  if (lukket.length) tael(env, 'haendelse', 'gudrun-issue-lukket', { antal: lukket.length, detalje: dateKey });
  return { github: lukket.length ? 'closed' : 'quiet', issues: lukket };
}

/** Gemmer GitHub-udfaldet for en revision i KV, så GET revision kan vise det. Kun tilstand og issue-numre; aldrig fejltekster eller token. */
export const githubNoegle = dateKey => `gudrun:github:${dateKey}`;
const GH_TILSTANDE = new Set(['off', 'opened', 'exists', 'closed', 'quiet', 'failed']);
export function githubUdfald(g, repo) {
  const state = GH_TILSTANDE.has(g && g.github) ? g.github : 'failed';
  const nr = x => (Number.isInteger(x) && x > 0 ? x : null);
  return { state, issue: nr(g && g.issue), issues: Array.isArray(g && g.issues) ? g.issues.map(nr).filter(Boolean).slice(0, 10) : [], repo: /^[\w.-]+\/[\w.-]+$/.test(repo || '') ? repo : null };
}
export async function gemGithubUdfald(env, dateKey, g) {
  if (!env.SAGER) return false;
  await env.SAGER.put(githubNoegle(dateKey), JSON.stringify({ ...githubUdfald(g, env.GITHUB_REPO), at: new Date().toISOString() }), { expirationTtl: 14 * 86400 });
  return true;
}
export async function hentGithubUdfald(env, dateKey) {
  if (!env.SAGER) return null;
  try { const v = await env.SAGER.get(githubNoegle(dateKey), 'json'); return v && GH_TILSTANDE.has(v.state) ? v : null; } catch (e) { return null; }
}

// ── Kørselsfejl fra Workers Issues (runde 12) ──────────────────────────────────────────────────────────────────────────
// En automation i Workers Issues sender en generisk webhook (Cloudflare Notifications, header cf-webhook-auth) hertil.
// Gudrun samler dagens kørselsfejl i ét issue med markøren <!-- gudrun:runtime:YYYY-MM-DD --> og kommenterer ved nye.
// Repoet er offentligt: kun de første 200 tegn af overskriften/teksten, og alt der ligner nøgler, tokens eller
// forespørgselsstrenge fjernes. Højst 20 webhooks pr. døgn behandles (tæller i KV).
export const runtimeMarkoer = dateKey => `<!-- gudrun:runtime:${dateKey} -->`;
export function renFejltekst(s) {
  return String(s == null ? '' : s)
    .replace(/https?:\/\/[^\s)]+/g, u => u.split('?')[0])            // ingen forespørgselsstrenge
    .replace(/\b[A-Za-z0-9_\-+/=]{28,}\b/g, '[redacted]')              // lange nøgle-/token-agtige strenge
    .replace(/\b[a-f0-9]{24,}\b/gi, '[redacted]')
    .replace(/[`|<>\r\n]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 200);
}
export async function issueWebhook(request, env, c, dateKey) {
  const { timingSafeEqual } = await import('../lib/crypto.js');
  const forventet = (await hemmelighed(env, 'GUDRUN_WEBHOOK_SECRET')).v;
  const givet = request.headers.get('cf-webhook-auth') || '';
  if (!forventet || !timingSafeEqual(givet, forventet)) return new Response(JSON.stringify({ ok: false, code: 'forbidden', message: 'no' }), { status: 403, headers: { 'content-type': 'application/json' } });
  let body = {}; try { body = await request.json(); } catch (e) { }
  const navn = renFejltekst(body.name || body.alert_type || 'Workers Issue');
  const tekst = renFejltekst(body.text || (body.data && (body.data.title || body.data.message)) || '');
  if (env.SAGER) { // højst 20 pr. døgn
    const k = `gudrun:runtime:n:${dateKey}`, n = +((await env.SAGER.get(k)) || 0);
    if (n >= 20) return new Response(JSON.stringify({ ok: true, data: { status: 'loft' } }), { headers: { 'content-type': 'application/json' } });
    await env.SAGER.put(k, String(n + 1), { expirationTtl: 3 * 86400 });
  }
  if (!githubEnabled(env)) return new Response(JSON.stringify({ ok: true, data: { status: 'github_off' } }), { headers: { 'content-type': 'application/json' } });
  const linje = `- ${new Date().toISOString().slice(11, 16)} UTC · **${navn}**${tekst ? ' · ' + tekst : ''}`;
  const liste = await gh(env, 'GET', `/repos/${env.GITHUB_REPO}/issues?state=open&per_page=100`);
  const fandtes = (liste || []).find(i => !i.pull_request && (i.body || '').includes(runtimeMarkoer(dateKey)));
  if (fandtes) { await gh(env, 'POST', `/repos/${env.GITHUB_REPO}/issues/${fandtes.number}/comments`, { body: linje }); return new Response(JSON.stringify({ ok: true, data: { status: 'kommenteret', issue: fandtes.number } }), { headers: { 'content-type': 'application/json' } }); }
  const ny = await gh(env, 'POST', `/repos/${env.GITHUB_REPO}/issues`, {
    title: `Runtime errors ${dateKey}`,
    body: [runtimeMarkoer(dateKey), 'Workers Issues reported errors from the running Workers today. Gudrun keeps the list; details stay in the Cloudflare dashboard.', '', linje, '', '_Opened automatically from a Workers Issues automation (generic webhook → Worker → GitHub REST)._'].join('\n'),
    labels: [GH_LABEL, 'runtime'],
  });
  tael(env, 'haendelse', 'gudrun-runtime-issue', { detalje: dateKey });
  return new Response(JSON.stringify({ ok: true, data: { status: 'oprettet', issue: ny && ny.number } }), { headers: { 'content-type': 'application/json' } });
}
