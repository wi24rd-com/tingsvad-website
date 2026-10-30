// Runde 11: site-Workerens router (site-worker/index.js) uden runtime – stubbede ASSETS, SAGER og TING_AI.
// HTMLRewriter findes ikke i Node, så HTML-siderne testes i wrangler dev/Playwright; her testes alt det, der ikke omskrives.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { haandter, find, haandtering, OMDIRIGERINGER } from '../index.js';
import { makeDb } from '../../worker/test/d1mock.js';
import { intern as tingIntern } from '../../worker/src/features/gaestebog.js';

const rod = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const fil = f => readFileSync(join(rod, f));
const O = 'https://tingsvad.dk';

function kv(start = {}) {
  const m = new Map(Object.entries(start));
  return { get: async (k, t) => (m.has(k) ? (t === 'json' ? JSON.parse(m.get(k)) : m.get(k)) : null), put: async (k, v) => { m.set(k, v); }, m };
}
function assets() {
  const kald = [];
  return {
    kald,
    async fetch(req) {
      const u = new URL(typeof req === 'string' || req instanceof URL ? req : req.url);
      kald.push(u.pathname);
      if (u.pathname === '/historien') return new Response(null, { status: 307, headers: { location: '/historien/' } });
      if (u.pathname === '/historien/') return new Response(fil('historien/index.html'), { headers: { 'content-type': 'text/html; charset=utf-8' } });
      if (u.pathname === '/assets/pak/web/ko.webp') return new Response(new Uint8Array([1, 2, 3]), { headers: { 'content-type': 'image/webp' } });
      if (u.pathname === '/assets/colo.json') return Response.json({ CPH: ['København', 'Copenhagen'] });
      return new Response('<!doctype html><title>404</title>', { status: 404, headers: { 'content-type': 'text/html; charset=utf-8' } });
    },
  };
}
// Runde 13: intern/* (gæstebog, tællere, besøgende) køres mod ting-ai's rigtige kode med en D1 i hukommelsen; alt andet stubbes.
function tingAi() {
  const kald = [], db = makeDb();
  return { kald, db, async fetch(req) { kald.push(req); const sti = new URL(req.url).pathname; if (sti.startsWith('/api/ting-ai/intern/')) return tingIntern(req, { DB: db }, {}, sti.slice('/api/ting-ai/'.length), 'da'); return Response.json({ ok: true, sti }); } };
}
const env = (x = {}) => ({ ASSETS: assets(), SAGER: kv(), TING_AI: tingAi(), TURNSTILE_SITEKEY: 'sk', ACCESS_TEAM_DOMAIN: 't.cloudflareaccess.com', ACCESS_AUD: 'aud', ADMIN_EMAILS: 'a@b.dk', ...x });
const req = (sti, init = {}) => new Request(O + sti, init);

test('find: the same routes as functions/ (trailing slash allowed, ting-ai catch-all, /sag/:nr)', () => {
  assert.equal(find('/api/kant').params && Object.keys(find('/api/kant').params).length, 0);
  assert.ok(find('/api/kant/'));
  assert.deepEqual(find('/api/ting-ai/vision').params.path, ['vision']);
  assert.deepEqual(find('/api/ting-ai').params.path, []);
  assert.equal(find('/admin/api/sager').admin, true);
  assert.equal(find('/sag/980-0001').params.nr, '980-0001');
  assert.equal(find('/sag/'), null);
  assert.equal(find('/api/findes-ikke'), null);
  assert.equal(find('/historien/'), null);
});

test('haandtering: method-specific handler first, HEAD uses GET, otherwise onRequest or null', () => {
  const mod = { onRequestGet: () => 'g', onRequestPost: () => 'p' };
  assert.equal(haandtering(mod, 'HEAD')(), 'g');
  assert.equal(haandtering(mod, 'POST')(), 'p');
  assert.equal(haandtering(mod, 'DELETE'), null);
  assert.equal(haandtering({ onRequest: () => 'a' }, 'PUT')(), 'a');
});

test('protocol redirects: 301 with the fragment and security headers (Worker code, since _redirects only covers assets)', async () => {
  for (const [fra, til] of Object.entries(OMDIRIGERINGER)) {
    const r = await haandter(req(fra), env());
    assert.equal(r.status, 301, fra);
    assert.equal(r.headers.get('location'), til);
    assert.equal(r.headers.get('x-frame-options'), 'SAMEORIGIN');
  }
  assert.equal((await haandter(req('/protokol/', { method: 'POST' }), env())).status, 404);
});

test('html_handling 307 becomes 308 as on Pages', async () => {
  const r = await haandter(req('/historien'), env());
  assert.equal(r.status, 308);
  assert.equal(r.headers.get('location'), '/historien/');
});

test('Markdown twin: /historien/index.md comes from the static HTML, with front matter and canonical link', async () => {
  const e = env();
  const r = await haandter(req('/historien/index.md'), e);
  assert.equal(r.status, 200);
  assert.match(r.headers.get('content-type'), /^text\/markdown/);
  assert.equal(r.headers.get('link'), '<https://tingsvad.dk/historien/>; rel="canonical"');
  assert.match(await r.text(), /^---\ntitle: "Historien om Tingsvad – vadestedet, de syv på stenene og Ragnhild · Tingsvad"/);
  assert.equal((await haandter(req('/admin/index.md'), e)).status, 404);
});

test('error board: 404 for machines is problem+json / JSON, /api/* is always JSON, and 404 is never cached', async () => {
  const p = await haandter(req('/findes-ikke/', { headers: { accept: 'application/problem+json' } }), env());
  assert.equal(p.status, 404);
  assert.match(p.headers.get('content-type'), /^application\/problem\+json/);
  assert.equal(p.headers.get('cache-control'), 'no-store');
  const a = await haandter(req('/api/findes-ikke', { headers: { accept: 'text/html' } }), env());
  assert.equal(a.status, 404);
  assert.equal((await a.json()).code, 'not_found');
});

test('API handlers from functions/api run unchanged (turnstile, afgoer, kant, sager)', async () => {
  const e = env();
  assert.deepEqual(await (await haandter(req('/api/turnstile'), e)).json(), { sitekey: 'sk' });
  assert.equal((await (await haandter(req('/api/afgoer'), e)).json()).data.n, 1284);
  assert.equal((await (await haandter(req('/api/afgoer', { method: 'POST' }), e)).json()).data.n, 1285);
  assert.equal((await (await haandter(req('/api/afgoer', { method: 'POST' }), e)).json()).data.n, 1285, 'one per IP per minute');
  const bes = await (await haandter(req('/api/besoeg', { method: 'POST', headers: { 'cf-connecting-ip': '9.9.9.9' } }), e)).json();
  assert.equal(bes.data.n, 1);
  const k = await haandter(new Request(O + '/api/kant', { headers: { 'cf-ray': 'abc-CPH' } }), e);
  assert.equal((await k.json()).ok, true);
  assert.equal((await haandter(req('/api/kant', { method: 'POST' }), e)).status, 405);
  // Runde 13: i produktion afvises gæstebogen uden Turnstile-secret (503); lokalt/preview må den køre uden.
  const prod = await haandter(req('/api/sager', { method: 'POST', headers: { 'content-type': 'application/json', 'cf-connecting-ip': '1.2.3.4' }, body: JSON.stringify({ navn: 'Test', sag: 'En sag om koen' }) }), e);
  assert.equal(prod.status, 503);
  const e2 = env({ MILJOE: 'local' });
  const ny = await haandter(req('/api/sager', { method: 'POST', headers: { 'content-type': 'application/json', 'cf-connecting-ip': '1.2.3.4' }, body: JSON.stringify({ navn: 'Test', sag: 'En sag om koen' }) }), e2);
  assert.equal(ny.status, 201);
  assert.equal((await ny.json()).data.nr, '980-0004', 'the number comes from D1');
  const igen = await haandter(req('/api/sager', { method: 'POST', headers: { 'content-type': 'application/json', 'cf-connecting-ip': '1.2.3.4' }, body: JSON.stringify({ navn: 'Test', sag: 'En sag mere' }) }), e2);
  assert.equal(igen.status, 429); assert.equal(igen.headers.get('retry-after'), '120'); assert.equal((await igen.json()).code, 'rate_limited');
  const liste = await (await haandter(req('/api/sager'), e2)).json();
  assert.equal(liste.ok, true); assert.equal(liste.data.sager[0].navn, 'Test'); assert.equal(liste.data.sager.length, 4);
  const kort = await haandter(req('/api/sager', { method: 'POST', headers: { 'content-type': 'application/json', 'cf-connecting-ip': '5.5.5.5' }, body: JSON.stringify({ sag: 'x' }) }), e2);
  assert.equal((await kort.json()).code, 'too_short');
  // Uden ting-ai: 503 i kontrakten, ikke en KV-fejl
  const uden = await haandter(req('/api/sager'), env({ TING_AI: undefined }));
  assert.equal(uden.status, 503); assert.equal((await uden.json()).code, 'not_configured');
});

test('ting-ai proxy: intern/* is never reachable from outside, and the internal header is stripped', async () => {
  const e = env();
  const nej = await haandter(req('/api/ting-ai/intern/gaestebog', { headers: { 'x-tingsvad-intern': '1' } }), e);
  assert.equal(nej.status, 404);
  assert.equal(e.TING_AI.kald.length, 0);
  await haandter(req('/api/ting-ai/health', { headers: { 'x-tingsvad-intern': '1' } }), e);
  assert.equal(e.TING_AI.kald[0].headers.get('x-tingsvad-intern'), null);
});

test('ting-ai proxy: admin is refused, client-set internal headers are stripped, colo is set from request.cf', async () => {
  const e = env();
  const nej = await haandter(req('/api/ting-ai/admin/ravnepost'), e);
  assert.equal(nej.status, 404);
  assert.equal(e.TING_AI.kald.length, 0);
  const r = new Request(O + '/api/ting-ai/health', { headers: { 'x-gallery-id': 'snyd', 'x-tingsvad-colo': 'XXX' } });
  Object.defineProperty(r, 'cf', { value: { colo: 'CPH' } });
  const ok = await haandter(r, e);
  assert.equal((await ok.json()).sti, '/api/ting-ai/health');
  const sendt = e.TING_AI.kald[0];
  assert.equal(sendt.headers.get('x-gallery-id'), null);
  assert.equal(sendt.headers.get('x-tingsvad-colo'), 'CPH');
});

test('ting-ai proxy: galleryId becomes multipart with the image from the static assets', async () => {
  const e = env();
  await haandter(req('/api/ting-ai/vision', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ galleryId: 'ko', lang: 'en' }) }), e);
  const sendt = e.TING_AI.kald[0];
  assert.equal(sendt.headers.get('x-gallery-id'), 'ko');
  const fd = await sendt.formData();
  assert.equal(fd.get('lang'), 'en');
  assert.equal(fd.get('file').size, 3);
});

test('ting-ai proxy: without the binding 503 not_configured; a throwing binding gives 503 upstream, never 502', async () => {
  const a = await haandter(req('/api/ting-ai/health'), env({ TING_AI: undefined }));
  assert.equal(a.status, 503);
  assert.equal((await a.json()).code, 'not_configured');
  const b = await haandter(req('/api/ting-ai/health'), env({ TING_AI: { fetch: async () => { throw new Error('nede'); } } }));
  assert.equal(b.status, 503);
  assert.equal(b.headers.get('retry-after'), '30');
});

test('admin: without a valid Access JWT both the API and the admin page are 403 and nothing reaches KV or ting-ai', async () => {
  const e = env();
  const api = await haandter(req('/admin/api/sager'), e);
  assert.equal(api.status, 403);
  assert.equal((await api.json()).code, 'forbidden');
  const rav = await haandter(req('/admin/api/ravnepost', { headers: { 'cf-access-jwt-assertion': 'a.b.c' } }), e);
  assert.equal(rav.status, 403);
  assert.equal(e.TING_AI.kald.length, 0);
  const side = await haandter(req('/admin/'), e);
  assert.equal(side.status, 403);
  assert.equal(side.headers.get('x-robots-tag'), 'noindex, nofollow');
  assert.ok(!e.ASSETS.kald.includes('/admin/'), 'the admin page is never fetched without Access');
});

test('shareable case /sag/:nr: og tags and refresh to the guest book', async () => {
  // HTML går gennem side-middlewarens HTMLRewriter; i Node erstattes den af en gennemsigtig stub.
  globalThis.HTMLRewriter ??= class { on() { return this; } transform(r) { return r; } };
  const r = await haandter(req('/sag/980-0001'), env());
  assert.equal(r.status, 200);
  const html = await r.text();
  assert.match(html, /og:title" content="Sag 980-0001 · Ragnhild Tingsvad · Udsat"/);
  assert.match(html, /\/api\/ting-ai\/og\/sag\/980-0001\.png/);
});

test('.assetsignore keeps the repo out of the published site but never _headers or _redirects', () => {
  const linjer = readFileSync(join(rod, '.assetsignore'), 'utf8').split('\n').map(s => s.trim()).filter(s => s && !s.startsWith('#'));
  for (const skal of ['worker/', '/mcp/', 'tests/', 'functions/', 'site-worker/', 'shared/', '.github/', '*.md', '*.toml', '.git', 'node_modules/']) assert.ok(linjer.includes(skal), skal);
  assert.ok(!linjer.some(l => /_headers|_redirects/.test(l)));
  // /mcp/ er forankret i roden, så /.well-known/mcp/server-card.json stadig udgives (runde 12)
  assert.ok(!linjer.includes('mcp/'));
});

test('run_worker_first: the static paths are served from the edge, and previews have their own ting-ai', () => {
  const toml = readFileSync(join(rod, 'site-worker', 'wrangler.toml'), 'utf8');
  for (const ex of ['/assets/*', '/partials/*', '/sw.js', '/manifest.webmanifest', '/robots.txt', '/sitemap.xml', '/llms.txt', '/favicon.ico', '/arkivet/protokol/*', '/en/archive/minutes/*']) assert.ok(toml.includes(`"!${ex}"`), ex);
  assert.match(toml, /\[\[previews\.services\]\]\nbinding = "TING_AI"\nservice = "tingsvad-ting-ai-preview"/);
});
