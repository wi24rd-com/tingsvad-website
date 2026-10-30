// Runde 10, trin 3: Markdown til agenter, fejltavlen, tælleværket (Analytics Engine) og kant-kortet.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { naegl, htmlTilMarkdown } from '../../functions/_lib/markdown.js';
import { fejlFormat, struktureretFejl, fejlData } from '../../functions/_lib/fejl.js';
import { tael, apiNavn, statusKlasse } from '../../shared/tael.js';
import { formTaelle, sql, getTaelle } from '../src/features/taelle.js';

const rod = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const fil = f => readFileSync(join(rod, f), 'utf8');
const KANDIDATER = ['text/html', 'text/markdown', 'application/problem+json', 'application/json'];

test('naegl: browsers always get HTML, agents that prefer Markdown get Markdown', () => {
  assert.equal(naegl('text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'), 'text/html');
  assert.equal(naegl('*/*'), 'text/html');
  assert.equal(naegl(''), 'text/html');
  assert.equal(naegl(null), 'text/html');
  assert.equal(naegl('text/markdown'), 'text/markdown');
  assert.equal(naegl('text/markdown, text/html;q=0.9'), 'text/markdown');
  assert.equal(naegl('text/html, text/markdown'), 'text/html');
  assert.equal(naegl('text/markdown;q=0'), 'text/html');
  assert.equal(naegl('application/problem+json', KANDIDATER), 'application/problem+json');
  assert.equal(naegl('application/json, text/markdown;q=0.9', KANDIDATER), 'application/json');
});

test('markdown: the machine room becomes front matter + text without navigation, scripts or decoration', () => {
  const { markdown, meta, tokens } = htmlTilMarkdown(fil('maskinrummet/index.html'), 'https://tingsvad.dk/maskinrummet/');
  assert.ok(markdown.startsWith('---\ntitle: "Maskinrummet – sådan er tingsvad.dk bygget på Cloudflare · Tingsvad"\n'));
  assert.match(markdown, /\nurl: "https:\/\/tingsvad\.dk\/maskinrummet\/"\n/);
  assert.match(markdown, /\n {2}en: "https:\/\/tingsvad\.dk\/en\/machine-room\/"\n/);
  assert.match(markdown, /\n# Maskinrummet\n/);
  assert.match(markdown, /\[GitHub\]\(https:\/\/github\.com\/wi24rd-com\/tingsvad-website\)/);
  assert.ok(!/<script|<svg|ᛏᛁᚾᚴ|data-tv-del/.test(markdown), 'no scripts, svg, runes or placeholders');
  assert.ok(markdown.includes('### Tingets tælleværk'), 'the folded cards are included');
  assert.equal(meta.lang, 'da');
  assert.ok(tokens > 500 && tokens < fil('maskinrummet/index.html').length / 4);
});

test('markdown: tables, lists, code and entities', () => {
  const html = `<html lang="en"><head><title>T</title><link rel="canonical" href="https://tingsvad.dk/x/"></head><body><nav>menu</nav><main>
    <h2>A &amp; B</h2><p>One <strong>two</strong> <em>three</em> <code>four</code> <a href="/y/">link</a> <a href="#">x</a></p>
    <ul><li>first</li><li>second<ul><li>nested</li></ul></li></ul><ol><li>a</li><li>b</li></ol>
    <table><thead><tr><th>Year</th><th>Item</th></tr></thead><tbody><tr><td>980</td><td>The cow | still</td></tr></tbody></table>
    <pre><code>curl -H "Accept: text/markdown"\n  https://tingsvad.dk/</code></pre>
    <span aria-hidden="true">HIDDEN</span><button>Press</button><img src="/a.webp" alt="A cow"><img src="/b.webp" alt="">
  </main></body></html>`;
  const { markdown } = htmlTilMarkdown(html, 'https://tingsvad.dk/x/');
  assert.match(markdown, /## A & B/);
  assert.match(markdown, /One \*\*two\*\* _three_ `four` \[link\]\(https:\/\/tingsvad\.dk\/y\/\) \[x\]\(https:\/\/tingsvad\.dk\/x\/#\)/);
  assert.match(markdown, /- first\n- second\n {2}- nested\n/);
  assert.match(markdown, /1\. a\n2\. b/);
  assert.match(markdown, /\| Year \| Item \|\n\| --- \| --- \|\n\| 980 \| The cow \\\| still \|/);
  assert.match(markdown, /```\ncurl -H "Accept: text\/markdown"\n {2}https:\/\/tingsvad\.dk\/\n```/);
  assert.match(markdown, /!\[A cow\]\(https:\/\/tingsvad\.dk\/a\.webp\)/);
  assert.ok(!/HIDDEN|Press|menu|b\.webp/.test(markdown));
});

test('markdown: every page in both languages converts without placeholders and with a heading', () => {
  const sider = ['index.html', 'en/index.html', 'historien/index.html', 'en/history/index.html', 'arkivet/index.html', 'oplevelser/index.html', 'maskinrummet/revisionen/index.html'];
  for (const s of sider) {
    const { markdown } = htmlTilMarkdown(fil(s), 'https://tingsvad.dk/');
    assert.match(markdown, /\n# \S/, s);
    assert.ok(!markdown.includes('{{'), s);
  }
});

const req = (url, accept) => new Request(url, { headers: accept ? { accept } : {} });

test('fejltavle: problem+json, json, markdown and html follow Accept; /api/ is always JSON', async () => {
  assert.equal(fejlFormat(req('https://tingsvad.dk/x/', 'application/problem+json'), '/x/'), 'problem');
  assert.equal(fejlFormat(req('https://tingsvad.dk/x/', 'text/html,*/*;q=0.8'), '/x/'), 'html');
  assert.equal(fejlFormat(req('https://tingsvad.dk/api/nej', 'text/html'), '/api/nej'), 'json');
  assert.equal(struktureretFejl(req('https://tingsvad.dk/x/', 'text/html'), 404), null);

  const p = struktureretFejl(req('https://tingsvad.dk/en/nope/', 'application/problem+json'), 404);
  assert.equal(p.status, 404);
  assert.match(p.headers.get('content-type'), /^application\/problem\+json/);
  const pj = await p.json();
  assert.equal(pj.title, 'Adjourned'); assert.equal(pj.instance, '/en/nope/'); assert.equal(pj.retryable, false); assert.equal(pj.lang, 'en');
  assert.equal(pj.type, 'https://tingsvad.dk/maskinrummet/#fejltavle');
  assert.equal(pj.suggestions.length, 5);

  const j = await struktureretFejl(req('https://tingsvad.dk/api/nej', 'application/json'), 404).json();
  assert.equal(j.ok, false); assert.equal(j.code, 'not_found'); assert.ok(j.message);

  const m = struktureretFejl(req('https://tingsvad.dk/findes-ikke/', 'text/markdown'), 503);
  assert.equal(m.headers.get('retry-after'), '30');
  const mt = await m.text();
  assert.match(mt, /^---\nhttp_status: 503\nerror_code: unavailable\n/);
  assert.match(mt, /retryable: true\nretry_after: 30/);
  assert.match(mt, /## Hvad du kan gøre/);
  assert.equal(fejlData(418, '/', 'da').code, 'not_found', 'unknown 4xx falls back to 404');
});

test('404.html: both languages (header, hero, content and closing per language), one h1 each, placeholders for the shared parts', () => {
  const h = fil('404.html');
  assert.equal((h.match(/data-fejl-sprog="da"/g) || []).length, 4);
  assert.equal((h.match(/data-fejl-sprog="en"/g) || []).length, 4);
  assert.equal((h.match(/<h1>/g) || []).length, 2);
  for (const d of ['topbar', 'footer']) assert.ok(h.includes(`data-tv-del="${d}"`), d);
});

test('tael: writes one data point with a fixed schema and nothing else; silent without the binding', () => {
  const punkter = [];
  const env = { TAEL: { writeDataPoint: p => punkter.push(p) } };
  assert.equal(tael(env, 'api', 'court', { lang: 'da', colo: 'CPH', detalje: '2xx', ms: 41.7 }), true);
  assert.deepEqual(punkter[0], { indexes: ['api'], blobs: ['court', 'da', 'CPH', '2xx'], doubles: [1, 42] });
  assert.equal(tael(env, 'ukendt', 'x'), false, 'unknown kinds are refused');
  assert.equal(tael({}, 'side', '/'), false);
  assert.equal(tael({ TAEL: { writeDataPoint() { throw new Error('nej'); } } }, 'side', '/'), false, 'a failing write never throws');
  assert.equal(apiNavn('ravn/R-20261027-ABCDEF/fil'), 'ravn/fil');
  assert.equal(apiNavn('forge/abc123'), 'forge/*');
  assert.equal(apiNavn('radio/audio/2026-10-27/en'), 'radio/audio');
  assert.equal(apiNavn('health'), 'health');
  assert.equal(statusKlasse(503), '5xx'); assert.equal(statusKlasse(101), '101');
});

test('taelle: SQL reads only the configured dataset, always with a lower time bound and no tenancy predicate', () => {
  const q = sql('events.analyticsEngine.tingsvad_taelle');
  for (const [k, s] of Object.entries(q)) {
    assert.match(s, /FROM events\.analyticsEngine\.tingsvad_taelle WHERE timestamp >= NOW\(\) - INTERVAL/, k);
    assert.ok(!/accountTag|zoneTag|FORMAT/i.test(s), k);
    if (/ORDER BY/.test(s) && k !== 'timer') assert.match(s, /LIMIT \d+$/, k);
  }
});

test('taelle: formTaelle rounds sampled numbers and drops what it cannot use', () => {
  const d = formTaelle({
    totaler: { data: [{ art: 'side', n: 41.6 }, { art: 'md', n: 3 }, { art: 'hack', n: 9 }], statistics: { rows_read: 10, elapsed_ms: 4 } },
    timer: { data: [{ t: '2026-10-27 15:00:00', art: 'side', n: 7 }, { t: '2026-10-27 15:00:00', art: 'api', n: 2 }, { t: '2026-10-27 14:00:00', art: 'md', n: 1 }], statistics: { rows_read: 5, elapsed_ms: 3 } },
    haendelser: { data: [{ navn: 'stol-flyttet', n: 12 }, { navn: '', n: 3 }] },
    colos: { data: [{ colo: 'cph', n: 30 }, { colo: 'X1', n: 2 }] },
    api: { data: [{ navn: 'health', n: 20, ms: 3.4 }] },
  });
  assert.deepEqual(d.totaler, { side: 42, md: 3, fejl: 0, api: 0, haendelse: 0 });
  assert.deepEqual(d.timer, [{ t: '2026-10-27T14:00:00.000Z', side: 0, md: 1, api: 0 }, { t: '2026-10-27T15:00:00.000Z', side: 7, md: 0, api: 2 }]);
  assert.deepEqual(d.haendelser, [{ navn: 'stol-flyttet', n: 12 }]);
  assert.deepEqual(d.colos, [{ colo: 'CPH', n: 30 }]);
  assert.deepEqual(d.api, [{ navn: 'health', n: 20, ms: 3 }]);
  assert.equal(d.statistik.rows_read, 15);
});

test('taelle: states — not configured, writing only, live and cached', async () => {
  const c = { log() { } };
  const r = u => new Request('https://x/api/ting-ai/taelle' + u);
  assert.equal((await getTaelle(r(''), {}, c)).status, 503);
  const skriver = await (await getTaelle(r(''), { TAEL: {} }, c)).json();
  assert.equal(skriver.data.tilstand, 'skriver');
  let kald = 0;
  const env = { TAEL: {}, TAELLE_DATASET: 'tingsvad_taelle', ANALYTICS_SQL: { async query({ query }) { kald++; assert.ok(query.includes('tingsvad_taelle')); return { data: [], rows: 0, statistics: { rows_read: 1, elapsed_ms: 1 } }; } } };
  const a = await (await getTaelle(r('?lang=en'), env, c)).json();
  assert.equal(a.source, 'server'); assert.equal(a.data.tilstand, 'live'); assert.equal(kald, 5);
  const b = await (await getTaelle(r(''), env, c)).json();
  assert.equal(b.source, 'cached'); assert.equal(kald, 5, 'second call within five minutes reads nothing');
});

test('kant + colo.json: the endpoint reads only four request.cf fields', () => {
  const k = fil('functions/api/kant.js');
  for (const f of ['ip', 'city', 'country', 'asOrganization', 'latitude', 'postalCode']) assert.ok(!new RegExp(`cf\\.${f}\\b`).test(k), f);
  const byer = JSON.parse(fil('assets/colo.json'));
  assert.deepEqual(byer.CPH, ['København', 'Copenhagen']);
  for (const [kode, v] of Object.entries(byer)) if (kode !== '_') { assert.match(kode, /^[A-Z]{3}$/); assert.equal(v.length, 2); }
});

test('topbar partials: the mobile menu has the same five pages as the side navigation', () => {
  for (const l of ['da', 'en']) {
    const top = fil(`partials/topbar.${l}.html`), nav = fil(`partials/sidenav.${l}.html`);
    const hrefs = s => [...s.matchAll(/href="(\/[^"]*)" data-side/g)].map(m => m[1]);
    assert.deepEqual(hrefs(top), hrefs(nav), l);
    assert.equal(hrefs(top).length, 5);
  }
});
