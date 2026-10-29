// Runde 12: Hastigheden (Web Analytics), Danmark lige nu (Radar) og Tal din sag (Whisper).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { byggRadar, byggHastighed, hastighedForespoergsler, opdaterRadar, opdaterHastighed, hastighedEnabled, radarEnabled, KV_RADAR, KV_HAST, RADAR } from '../src/features/maaling.js';
import { sniffLyd, renTekst, tale, MAX_LYD } from '../src/features/tale.js';

const NU = Date.parse('2026-10-29T07:00:00Z');
// Svarformer som Radar faktisk sender (set 29. oktober 2026)
const R = {
  bots: { summary_0: { human: '65.018144', bot: '34.981856' } },
  aiDK: { summary_0: { 'ChatGPT-User': '79.392772', Googlebot: '13.356746', other: '0.634418' } },
  verificerede: { top_0: [{ botName: 'kb.dk_bot', botCategory: 'Academic Research', botOwner: 'Netarkivet', value: '3.188815' }] },
  angrebFra: { top_0: [{ originCountryAlpha2: 'US', originCountryName: 'United States', value: '21.053985', rank: 1 }] },
  vaernProdukter: { summary_0: { WAF: '86.43422', DDOS: '7.073633', DATA_LOSS_PREVENTION: '0.0' } },
  kvante: { summary_0: { SUPPORTED: '73.876041', NOT_SUPPORTED: '26.123959' } },
  hastighed: { summary_0: { bandwidthDownload: '276.699745', bandwidthUpload: '136.709506', latencyIdle: '16.729574', latencyLoaded: '89.289169', jitterIdle: '8.392555', packetLoss: '0.010174' }, meta: { totalTests: [12058] } },
  netvaerk: { top_0: [{ clientASN: 3292, clientASName: 'TDC Holding A/S', value: '20.541045' }] },
  rytme: { serie_0: { timestamps: ['2026-10-22T06:00:00Z', '2026-10-22T07:00:00Z'], values: ['0.5', '1.0'] } },
  botsDage: { serie_0: { timestamps: ['2026-10-28T00:00:00Z'], human: ['65.5'], bot: ['34.5'] } },
  udfald: { annotations: [] },
};

test('Radar: svarene bliver til én oversigt', () => {
  const o = byggRadar(R, NU, ['domaener: 403']);
  assert.deepEqual(o.bots, { menneske: 65, bot: 35 });
  assert.equal(o.aiDK[0].navn, 'ChatGPT-User'); assert.equal(o.aiDK[0].pct, 79.39);
  assert.deepEqual(o.verificerede[0], { navn: 'kb.dk_bot', firma: 'Netarkivet', kat: 'Academic Research', pct: 3.19 });
  assert.deepEqual(o.angrebFra[0], { kode: 'US', pct: 21.05 });
  assert.ok(!o.vaernProdukter.some(p => p.navn === 'DATA_LOSS_PREVENTION'), 'nul-andele udelades');
  assert.deepEqual(o.kvante, { ja: 73.9, nej: 26.1 });
  assert.equal(o.hastighed.ned, 277); assert.equal(o.hastighed.tests, 12058);
  assert.equal(o.netvaerk[0].navn, 'TDC Holding A/S');
  assert.deepEqual(o.rytme[1], { t: '2026-10-22T07', v: 1 });
  assert.deepEqual(o.botsDage, [{ dag: '2026-10-28', bot: 34.5 }]);
  assert.deepEqual(o.udfald, []); assert.deepEqual(o.fejl, ['domaener: 403']);
  assert.equal(o.domaener, undefined, 'en del, der fejlede, mangler bare');
});

test('Radar: henter hver del for sig, og én fejl stopper ikke resten', async () => {
  const kv = new Map(), SAGER = { put: async (k, v) => kv.set(k, v), get: async () => null };
  const gammel = globalThis.fetch, kald = [];
  globalThis.fetch = async (url, o) => {
    kald.push(url); assert.equal(o.headers.authorization, 'Bearer tok');
    const k = Object.keys(RADAR).find(n => url.includes(RADAR[n]));
    if (k === 'domaener') return new Response(JSON.stringify({ success: false, errors: [{ message: 'Forbidden' }] }), { status: 403 });
    return new Response(JSON.stringify({ success: true, result: R[k] || {} }), { status: 200 });
  };
  try {
    assert.equal(await opdaterRadar({ CF_ANALYTICS_TOKEN: 'tok', SAGER }, null, NU), 'ok');
    assert.equal(kald.length, Object.keys(RADAR).length);
    assert.ok(kald.every(u => u.startsWith('https://api.cloudflare.com/client/v4/radar/') && u.endsWith('&format=json')));
    const o = JSON.parse(kv.get(KV_RADAR));
    assert.equal(o.kvante.ja, 73.9); assert.ok(o.fejl[0].startsWith('domaener: 403'));
    assert.ok(!JSON.stringify(o).includes('tok'), 'tokenet står aldrig i oversigten');
  } finally { globalThis.fetch = gammel; }
});

test('Hastigheden: forespørgslerne beder om siteTag og tidsrum, aldrig IP', () => {
  const q = hastighedForespoergsler('konto', 'site', '2026-10-22T07:00:00Z', '2026-10-29T07:00:00Z');
  assert.ok(Object.keys(q).length >= 10);
  for (const s of Object.values(q)) { assert.ok(s.includes('accountTag:"konto"') && s.includes('siteTag:"site"')); assert.ok(!/clientIP|ipAddress/i.test(s)); }
  assert.equal(hastighedEnabled({}), false);
  assert.equal(hastighedEnabled({ CF_ACCOUNT_ID: 'a', RUM_SITE_TAG: 's', CF_ANALYTICS_TOKEN: 't', SAGER: {} }), true);
  assert.equal(radarEnabled({ CF_ANALYTICS_TOKEN: 't', SAGER: {} }), true);
  assert.equal(radarEnabled({ CF_ANALYTICS_TOKEN: 't', SAGER: {}, RADAR_ENABLED: 'false' }), false);
});

test('Hastigheden: mikrosekunder bliver til millisekunder, fordelinger til procent', () => {
  const r = {
    besoeg: [{ count: 420, sum: { visits: 300 } }],
    sider: [{ count: 200, sum: { visits: 150 }, dimensions: { requestPath: '/?x=1' } }],
    siderVitals: [{ count: 50, dimensions: { requestPath: '/?x=1' }, quantiles: { largestContentfulPaintP75: 1800000, interactionToNextPaintP75: 120000, cumulativeLayoutShiftP75: 0.02 } }],
    lande: [{ count: 300, dimensions: { countryName: 'DK' } }], landeTid: [{ count: 300, dimensions: { countryName: 'DK' }, quantiles: { pageLoadTimeP50: 900000 } }],
    indlaes: [{ count: 400, quantiles: { pageLoadTimeP50: 1200000, pageLoadTimeP75: 2000000, timeToFirstByteP50: 80000, timeToFirstByteP75: 150000, firstContentfulPaintP50: 600000, firstContentfulPaintP75: -1 } }],
    vitals: [{ count: 90, sum: { lcpGood: 80, lcpNeedsImprovement: 15, lcpPoor: 5, inpGood: 0, inpNeedsImprovement: 0, inpPoor: 0, clsGood: 9, clsNeedsImprovement: 1, clsPoor: 0 }, quantiles: { largestContentfulPaintP75: 2100000, interactionToNextPaintP75: 90000, cumulativeLayoutShiftP75: 30 } }],
  };
  const o = byggHastighed(r, NU, ['faser: x']);
  assert.deepEqual(o.besoeg, { visninger: 420, besoeg: 300 });
  assert.deepEqual(o.sider[0], { sti: '/', visninger: 200, lcp: 1800, inp: 120, cls: 0.02 });
  assert.deepEqual(o.lande[0], { kode: 'DK', visninger: 300, indlaes: 900 });
  assert.equal(o.indlaes.p50, 1200); assert.equal(o.indlaes.fcp75, null, 'negativ = ingen data');
  assert.equal(o.vitals.lcp, 2100); assert.equal(o.vitals.cls, 0.03, 'skaleret CLS rettes');
  assert.deepEqual(o.vitals.fordeling.lcp, { god: 80, middel: 15, daarlig: 5, n: 100 });
  assert.equal(o.vitals.fordeling.inp, null);
});

test('Hastigheden: gemmer det, der lykkedes, og fejlene for resten', async () => {
  const kv = new Map(), SAGER = { put: async (k, v) => kv.set(k, v), get: async () => null };
  const gammel = globalThis.fetch;
  globalThis.fetch = async (url, o) => {
    const q = JSON.parse(o.body).query;
    if (q.includes('dnsTimeP50')) return new Response(JSON.stringify({ errors: [{ message: 'unknown field dnsTimeP50' }] }), { status: 200 });
    return new Response(JSON.stringify({ data: { viewer: { accounts: [{ x: [{ count: 7, sum: { visits: 5 }, quantiles: {}, dimensions: { date: '2026-10-28', requestPath: '/', countryName: 'DK', userAgentBrowser: 'Firefox', deviceType: 'desktop' } }] }] } } }), { status: 200 });
  };
  try {
    assert.equal(await opdaterHastighed({ CF_ACCOUNT_ID: 'a', RUM_SITE_TAG: 's', CF_ANALYTICS_TOKEN: 't', SAGER }, null, NU), 'ok');
    const o = JSON.parse(kv.get(KV_HAST));
    assert.deepEqual(o.besoeg, { visninger: 7, besoeg: 5 }); assert.equal(o.faser, undefined);
    assert.ok(o.fejl.some(f => f.startsWith('faser:') && f.includes('dnsTimeP50')));
  } finally { globalThis.fetch = gammel; }
});

const WEBM = new Uint8Array([0x1a, 0x45, 0xdf, 0xa3, 0, 0, 0, 0, 0, 0, 0, 0, 1, 2, 3]);
test('Tal din sag: lyden kendes på de første bytes, teksten renses', () => {
  assert.equal(sniffLyd(WEBM), 'webm');
  assert.equal(sniffLyd(new TextEncoder().encode('OggS0000000000')), 'ogg');
  assert.equal(sniffLyd(new TextEncoder().encode('0000ftypM4A 0000')), 'mp4');
  assert.equal(sniffLyd(new TextEncoder().encode('<html>hej</html>')), null);
  assert.equal(renTekst('  Koen\u0000 er   min. \n'), 'Koen er min.');
  assert.equal(renTekst('x'.repeat(900)).length, 500);
});

test('Tal din sag: Whisper får lyden som base64 og sproget; lyden gemmes ikke', async () => {
  const kaldt = [];
  const env = { RL: { limit: async () => ({ success: true }) }, AI: { run: async (model, inp) => { kaldt.push({ model, inp }); return { text: '  Koen har altid været min. ' }; } } };
  const ctx = { session: { ownerHash: 'h' }, log: () => { } };
  const req = new Request('https://x/api/ting-ai/court/tale?lang=da', { method: 'POST', headers: { 'content-type': 'audio/webm;codecs=opus' }, body: WEBM });
  const res = await tale(req, env, ctx); const j = await res.json();
  assert.equal(j.data.tekst, 'Koen har altid været min.');
  assert.equal(kaldt[0].model, '@cf/openai/whisper-large-v3-turbo'); assert.equal(kaldt[0].inp.language, 'da');
  assert.equal(typeof kaldt[0].inp.audio, 'string');
  await assert.rejects(tale(new Request('https://x/api/ting-ai/court/tale', { method: 'POST', headers: { 'content-type': 'text/plain' }, body: 'hej' }), env, ctx), e => e.status === 415);
  await assert.rejects(tale(new Request('https://x/api/ting-ai/court/tale', { method: 'POST', headers: { 'content-type': 'audio/webm' }, body: new Uint8Array(MAX_LYD + 10) }), env, ctx), e => e.status === 413);
});
