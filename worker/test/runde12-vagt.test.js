// Runde 12: Værnet og Crawlerne – rensning, navngivning og oversigter ud fra Cloudflares GraphQL-data.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { renSti, renUa, botNavn, efterligning, regel, forsoegKategori, doegnRaekker, byggVaern, byggCrawlere, doegnForespoergsel, dagNoegle, vagtEnabled } from '../src/features/vagt.js';

test('rensning: stier og brugeragenter, der må stå på en offentlig side', () => {
  assert.equal(renSti('/wp-config.php?x=hemmelig'), '/wp-config.php');
  assert.equal(renSti('admin\u0000/x'), '/admin/x');
  assert.equal(renSti('/.well-known/acme-challenge/' + 'a'.repeat(43)), '/.well-known/acme-challenge/…');
  assert.ok(renSti('/' + 'x/'.repeat(100)).length <= 90);
  assert.equal(renUa('siite-research/1.0 (+https://siite.dk/bot; mb@siite.dk)'), 'siite-research/1.0 (+https://siite.dk/bot; [e-mail])');
});

test('bots: navn og firma ud fra brugeragenten, verificeret eller ej', () => {
  assert.deepEqual(botNavn('Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; ClaudeBot/1.0; +claudebot@anthropic.com)', 'AI Crawler'), { navn: 'ClaudeBot', firma: 'Anthropic' });
  assert.deepEqual(botNavn('Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)'), { navn: 'Googlebot', firma: 'Google' });
  assert.equal(botNavn('Mozilla/5.0 (Windows NT 10.0) Chrome/141', 'AI Assistant').navn, 'AI-assistent i en browser');
  assert.equal(botNavn('Mozilla/5.0 (X11) Chrome/141', 'Monitoring & Analytics').navn, 'Verificeret (Monitoring & Analytics)');
  assert.equal(botNavn('Mozilla/5.0 (compatible; DeepSeekBot/1.0)').navn, 'DeepSeekBot');
  assert.equal(botNavn('curl/8.0').navn, 'Ukendt bot');
  assert.ok(efterligning('Googlebot')); assert.ok(!efterligning('DeepSeekBot'));
});

test('regler: produkt, type og CVE ud af WAF-beskrivelsen', () => {
  assert.deepEqual(regel('React - RCE - CVE:CVE-2025-55182', 'firewallManaged'), { navn: 'React - RCE - CVE:CVE-2025-55182', produkt: 'React', type: 'RCE', cve: 'CVE-2025-55182' });
  assert.deepEqual(regel('Wordpress - Broken Access Control, File Inclusion'), { navn: 'Wordpress - Broken Access Control, File Inclusion', produkt: 'Wordpress', type: 'Broken Access Control, File Inclusion', cve: null });
  assert.equal(regel('', 'bic').navn, 'Browser Integrity Check');
});

test('forsøg: hvad 404-stierne ledte efter', () => {
  assert.equal(forsoegKategori('/.env.production'), 'hemmeligheder');
  assert.equal(forsoegKategori('/appsettings.Production.json'), 'hemmeligheder');
  assert.equal(forsoegKategori('/.git/config'), 'kildekode');
  assert.equal(forsoegKategori('/wp-login.php'), 'wordpress');
  assert.equal(forsoegKategori('/_profiler/phpinfo'), 'php');
  assert.equal(forsoegKategori('/actuator/env'), 'adgang');
  assert.equal(forsoegKategori('/favicon.ico'), null);
  assert.equal(forsoegKategori('/blog/'), 'andet');
});

const NU = Date.parse('2026-10-29T05:00:00Z');
const DOEGN = {
  fw: [
    { action: 'block', source: 'firewallManaged', description: 'React - RCE - CVE:CVE-2025-55182', clientCountryName: 'US', clientRequestPath: '/', clientRequestHTTPMethodName: 'POST', clientASNDescription: 'Google LLC', edgeColoName: 'EWR', datetime: '2026-10-29T03:17:28Z' },
    { action: 'block', source: 'firewallManaged', description: 'React - RCE - CVE:CVE-2025-55182', clientCountryName: 'US', clientRequestPath: '/', clientRequestHTTPMethodName: 'POST', clientASNDescription: 'Google LLC', edgeColoName: 'EWR', datetime: '2026-10-29T03:17:27Z' },
    { action: 'block', source: 'firewallManaged', description: 'Wordpress - Broken Access Control, File Inclusion', clientCountryName: 'NL', clientRequestPath: '/wp-config.php.bak', clientRequestHTTPMethodName: 'GET', clientASNDescription: 'AS QualityNetwork', edgeColoName: 'AMS', datetime: '2026-10-29T01:00:00Z' },
  ],
  alle: [{ count: 32749, dimensions: { date: '2026-10-29' } }],
  probes: [{ count: 37, dimensions: { clientRequestPath: '/.env' } }, { count: 146, dimensions: { clientRequestPath: '/favicon.ico' } }, { count: 46, dimensions: { clientRequestPath: '/.git/config' } }],
  bots: [
    { count: 47, dimensions: { verifiedBotCategory: 'Search Engine Crawler', userAgent: 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)', clientRequestPath: '/robots.txt', edgeResponseStatus: 200 } },
    { count: 21, dimensions: { verifiedBotCategory: 'Search Engine Crawler', userAgent: 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)', clientRequestPath: '/oplevelser/maskinparken/', edgeResponseStatus: 200 } },
    { count: 50, dimensions: { verifiedBotCategory: 'AI Crawler', userAgent: 'Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; ClaudeBot/1.0; +claudebot@anthropic.com)', clientRequestPath: '/sitemap.xml', edgeResponseStatus: 200 } },
    { count: 3, dimensions: { verifiedBotCategory: 'AI Crawler', userAgent: 'Mozilla/5.0 (compatible; GoogleOther)', clientRequestPath: '/historien/index.md', edgeResponseStatus: 200 } },
    { count: 9, dimensions: { verifiedBotCategory: 'AI Crawler', userAgent: 'Mozilla/5.0 (compatible; GoogleOther)', clientRequestPath: '/cf-fonts/s/spectral/x.woff2', edgeResponseStatus: 200 } },
  ],
  f1: [{ count: 102, dimensions: { userAgent: 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)' } }, { count: 11, dimensions: { userAgent: 'Mozilla/5.0 (compatible; DeepSeekBot/1.0)' } }],
  f2: [{ count: 11, dimensions: { userAgent: 'Mozilla/5.0 (compatible; DeepSeekBot/1.0)' } }],
  f3: [],
};

test('døgnrækker og oversigter: Værnet', () => {
  const rows = doegnRaekker(DOEGN).map(([art, noegle, n]) => ({ dag: '2026-10-29', art, noegle, n }));
  assert.ok(!JSON.stringify(rows).includes('favicon'), 'ufarlige 404 tælles ikke som forsøg');
  const v = byggVaern(rows, NU, []);
  assert.deepEqual(v.perioder, { d1: 3, d7: 3, d30: 3 });
  assert.equal(v.dage.length, 30); assert.equal(v.dage[29].n, 3); assert.equal(v.dage[29].alle, 32749);
  assert.equal(v.regler[0].cve, 'CVE-2025-55182'); assert.equal(v.regler[0].n7, 2); assert.equal(v.regler[0].stier[0].sti, '/');
  assert.deepEqual(v.buer.find(b => b.land === 'US'), { land: 'US', colo: 'EWR', n: 2 });
  assert.equal(v.netvaerk[0].navn, 'Google LLC');
  assert.deepEqual(v.forsoeg.kategorier.map(k => k.id).sort(), ['hemmeligheder', 'kildekode']);
  assert.ok(!JSON.stringify(v).match(/\d+\.\d+\.\d+\.\d+/), 'ingen IP-adresser');
});

test('døgnrækker og oversigter: Crawlerne', () => {
  const rows = doegnRaekker(DOEGN).map(([art, noegle, n]) => ({ dag: '2026-10-29', art, noegle, n }));
  const c = byggCrawlere(rows, NU);
  assert.equal(c.iAlt.bots7, 130); assert.equal(c.iAlt.botNavne, 3);
  assert.equal(c.bots[0].navn, 'Googlebot'); assert.equal(c.bots[0].filer.robots, 47); assert.equal(c.bots[0].sider[0].sti, '/oplevelser/maskinparken/');
  assert.equal(c.filer.markdown, 3); assert.equal(c.filer.assets, 9); assert.equal(c.filer.sitemap, 50);
  assert.deepEqual(c.falske, [{ navn: 'Googlebot', n: 102 }]);
  assert.deepEqual(c.uverificerede, [{ navn: 'DeepSeekBot', n: 11 }], 'samme agent i %bot% og %Bot% tælles én gang');
});

test('forespørgsel og aktivering', () => {
  const q = doegnForespoergsel('abc', '2026-10-28');
  assert.ok(q.includes('datetime_geq:"2026-10-28T00:00:00Z"') && q.includes('datetime_lt:"2026-10-29T00:00:00Z"'));
  assert.ok(!/clientIP/.test(q), 'beder aldrig om IP-adresser');
  assert.equal(dagNoegle(NU), '2026-10-29');
  assert.equal(vagtEnabled({}), false);
  assert.equal(vagtEnabled({ CF_ZONE_ID: 'z', CF_ANALYTICS_TOKEN: 't', DB: {}, SAGER: {} }), true);
});

test('opdaterVagt: henter døgn, gemmer i D1 og bygger oversigterne i KV', async () => {
  const { makeDb } = await import('./d1mock.js');
  const { opdaterVagt, KV_VAERN, KV_CRAWL, KV_DOER } = await import('../src/features/vagt.js');
  const kv = new Map(); const SAGER = { get: async (k, t) => { const v = kv.get(k); return v == null ? null : t === 'json' ? JSON.parse(v) : v; }, put: async (k, v) => { kv.set(k, v); } };
  const env = { CF_ZONE_ID: 'zone', CF_ANALYTICS_TOKEN: 'tok', DB: makeDb(), SAGER };
  const kald = []; const gammel = globalThis.fetch;
  globalThis.fetch = async (url, o) => { kald.push({ url, auth: o.headers.authorization, q: JSON.parse(o.body).query }); return new Response(JSON.stringify({ data: { viewer: { zones: [DOEGN] } } }), { status: 200 }); };
  try {
    assert.equal(await opdaterVagt(env, null, NU), 'ok');
    const vaern = () => kald.filter(k => k.q.includes('fw:')), doer = () => kald.filter(k => k.q.includes('doer:'));
    assert.equal(vaern().length, 6, 'i dag, i går og fire ældre døgn');
    assert.equal(doer().length, 5, 'døren: i dag, i går og tre ældre døgn');
    assert.equal(JSON.parse(kv.get(KV_DOER)).uger.length, 4);
    assert.equal(kald[0].auth, 'Bearer tok'); assert.ok(kald[0].url.includes('/graphql'));
    const v = JSON.parse(kv.get(KV_VAERN)), c = JSON.parse(kv.get(KV_CRAWL));
    assert.equal(v.perioder.d1, 3); assert.equal(v.perioder.d7, 18); assert.equal(v.seneste.length, 3); assert.equal(v.seneste[0].cve, 'CVE-2025-55182');
    assert.equal(c.iAlt.bots7, 6 * 130);
    kald.length = 0; await opdaterVagt(env, null, NU);
    assert.equal(vaern().length, 6, 'næste kørsel: i dag, i går og de næste fire manglende døgn');
    assert.equal(doer().length, 4, 'døren: i dag, i går og de to sidste af ugens døgn');
  } finally { globalThis.fetch = gammel; }
});
