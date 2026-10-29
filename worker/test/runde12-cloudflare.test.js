// Runde 12: de rene dele af Cloudflare-funktionerne (live-radio, kvantesikkert bevis, udlandsrubrik, Workers Cache,
// Secrets Store, kørselsfejl til Gudrun og SQL-dagbogen i Durable Objects).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { pakke, monoTilStereo, varighedMs, kunPcm, gyldigSessionId, MONO_BYTES_PR_PAKKE } from '../src/lib/sfu.js';
import { kanonisk, tjekPayload, renNavn, fraB64url } from '../src/features/bevis.js';
import { vaelgEmner, vaelgPositive, websearchEnabled } from '../src/features/udland.js';
import { cachebar, invalider, erOffentlig } from '../src/lib/kantcache.js';
import { hemmelighed, harHemmelighed } from '../src/lib/hemmelighed.js';
import { renFejltekst, runtimeMarkoer } from '../src/features/gudrun-github.js';
import { Dagbog, cphDagTime } from '../src/lib/dagbog.js';

test('pakke: protobuf Packet med seq, ts og payload', () => {
  const p = pakke(1, 300, new Uint8Array([9, 8, 7]));
  assert.deepEqual([...p], [0x08, 1, 0x10, 0xac, 0x02, 0x2a, 3, 9, 8, 7]);
  const stor = pakke(0, 0, new Uint8Array(MONO_BYTES_PR_PAKKE * 2));
  assert.ok(stor.byteLength < 32 * 1024, 'under 32 KB');
  assert.deepEqual([...stor.subarray(4, 7)], [0x2a, 0x80, 0x3c]); // 7680 som varint
});

test('monoTilStereo dublerer hver sample, varighedMs og kunPcm', () => {
  const mono = new Uint8Array(new Int16Array([1, -2, 300]).buffer);
  const st = new Int16Array(monoTilStereo(mono).buffer);
  assert.deepEqual([...st], [1, 1, -2, -2, 300, 300]);
  assert.equal(varighedMs(96000), 1000);
  const wav = new Uint8Array(60); wav.set([0x52, 0x49, 0x46, 0x46], 0); wav.set([0x64, 0x61, 0x74, 0x61], 36); wav[44] = 42;
  assert.equal(kunPcm(wav).length, 16); assert.equal(kunPcm(wav)[0], 42);
  const raa = new Uint8Array(100); assert.equal(kunPcm(raa), raa);
  assert.ok(gyldigSessionId('abcDEF123_-xyz')); assert.ok(!gyldigSessionId('../x')); assert.ok(!gyldigSessionId(42));
});

test('bevis: kanonisk form er stabil, og tjekPayload afviser manipulation', () => {
  const p = { nr: '980-1234', navn: 'Brian', dato: '2026-10-28', lang: 'da' };
  assert.equal(kanonisk(p), '{"v":1,"type":"tingsvad-fremmoede","nr":"980-1234","navn":"Brian","dato":"2026-10-28","status":"udsat","lang":"da"}');
  assert.equal(kanonisk({ ...p, ekstra: 'x', lang: 'fr' }), kanonisk(p));
  assert.ok(tjekPayload(p));
  assert.equal(tjekPayload({ ...p, nr: '981-1234' }), null);
  assert.equal(tjekPayload({ ...p, navn: '<b>Brian</b>' }), null);
  assert.equal(tjekPayload({ ...p, dato: 'i går' }), null);
  assert.equal(tjekPayload(null), null);
  assert.equal(renNavn('  Gu\u0000drun \n <x>  '), 'Gudrun x');
  assert.equal(renNavn('a'.repeat(80)).length, 40);
  assert.deepEqual([...fraB64url('AQID')], [1, 2, 3]);
  assert.throws(() => fraB64url('ab$'));
});

test('udland: kun https, intet alvorligt, ét pr. domæne, højst tre', () => {
  const ud = vaelgEmner([
    { title: 'Giant pumpkin breaks village record', url: 'https://www.a.dk/x?y=1' },
    { title: 'Another pumpkin story from same site', url: 'https://a.dk/z' },
    { title: 'Three killed in crash on motorway', url: 'https://b.dk/' },
    { title: 'Owl moves into town hall for winter', url: 'http://c.dk/' },
    { title: 'Kort', url: 'https://d.dk/' },
    { title: 'Scientists find singing mice in Jutland', url: 'https://e.dk/' },
    { title: 'Cows prefer jazz, says farmers union', url: 'https://f.dk/' },
    { title: 'Fourth harmless story about a goose', url: 'https://g.dk/' },
  ]);
  assert.deepEqual(ud.map(x => x.kilde), ['a.dk', 'e.dk', 'f.dk']);
  assert.deepEqual(vaelgEmner(null), []);
  assert.deepEqual(vaelgEmner([{ title: 'Hospital reopens after flood damage', url: 'https://h.dk/' }, { title: 'Minister opens new bridge today', url: 'https://i.dk/' }]), []);
  const emner = [{}, {}, {}];
  const pos = vaelgPositive([{ i: 0, positiv: true, titel: 'Ugle flytter ind', kommentar: 'Noteret.' }, { i: 1, positiv: false, titel: 'x', kommentar: 'y' }, { i: 2, positiv: true, titel: 'Politi finder ko', kommentar: 'Udsat.' }, { i: 7, positiv: true, titel: 'z', kommentar: 'z' }], emner);
  assert.deepEqual(pos.map(x => x.i), [0]);
  assert.equal(websearchEnabled({ WEBSEARCH_ENABLED: 'true', AI: {}, AI_GATEWAY_ID: 'g' }), false);
  assert.equal(websearchEnabled({ WEBSEARCH_ENABLED: 'true', AI: { websearch() { } }, AI_GATEWAY_ID: 'g' }), true);
});

test('kantcache: public Cache-Control, Cache-Tag, ETag og 304', async () => {
  const svar = () => new Response('{"a":1}', { status: 200, headers: { 'content-type': 'application/json' } });
  const r = await cachebar(new Request('https://x/'), svar(), { maxAge: 300, swr: 3600, tags: ['avis', 'avis-da'] });
  assert.equal(r.headers.get('cache-control'), 'public, max-age=300, stale-while-revalidate=3600');
  assert.equal(r.headers.get('cache-tag'), 'avis,avis-da');
  assert.ok(erOffentlig(r)); assert.equal(await r.text(), '{"a":1}');
  const etag = r.headers.get('etag');
  const r2 = await cachebar(new Request('https://x/', { headers: { 'if-none-match': 'W/' + etag } }), svar());
  assert.equal(r2.status, 304);
  const medId = id => new Response(`{"ok":true,"requestId":"${id}","data":1}`, { status: 200 });
  const e1 = (await cachebar(new Request('https://x/'), medId('a1'))).headers.get('etag');
  assert.equal((await cachebar(new Request('https://x/'), medId('b2'))).headers.get('etag'), e1, 'requestId påvirker ikke ETag');
  const fejl = new Response('x', { status: 503 });
  assert.equal(await cachebar(new Request('https://x/'), fejl), fejl);
  assert.equal(await invalider({}, ['avis']), false);
  let fik; assert.equal(await invalider({ cache: { invalidate: async o => { fik = o; } } }, ['avis']), true);
  assert.deepEqual(fik, { tags: ['avis'] });
});

test('hemmelighed: Secrets Store først, Worker-secret som reserve', async () => {
  assert.deepEqual(await hemmelighed({ X_STORE: { get: async () => 'fra-store' }, X: 'fra-secret' }, 'X'), { v: 'fra-store', kilde: 'secrets-store' });
  assert.deepEqual(await hemmelighed({ X_STORE: { get: async () => { throw new Error('nej'); } }, X: 'fra-secret' }, 'X'), { v: 'fra-secret', kilde: 'worker-secret' });
  assert.deepEqual(await hemmelighed({}, 'X'), { v: null, kilde: null });
  assert.ok(harHemmelighed({ X: 'y' }, 'X')); assert.ok(!harHemmelighed({}, 'X'));
});

test('kørselsfejl: renset tekst til et offentligt issue', () => {
  const t = renFejltekst('TypeError at https://tingsvad.dk/api?token=hemmelig `x`\n' + 'A'.repeat(40) + ' ' + 'deadbeef'.repeat(4));
  assert.ok(!t.includes('hemmelig')); assert.ok(!t.includes('`')); assert.ok(!t.includes('\n'));
  assert.equal((t.match(/\[redacted\]/g) || []).length, 2);
  assert.ok(renFejltekst('x'.repeat(500)).length <= 200);
  assert.equal(runtimeMarkoer('2026-10-28'), '<!-- gudrun:runtime:2026-10-28 -->');
});

test('dagbog: SQL-historik i et Durable Object-lager', () => {
  const db = new DatabaseSync(':memory:');
  const sql = { exec: (q, ...a) => { const st = db.prepare(q); const rows = /^\s*select/i.test(q) ? st.all(...a) : (st.run(...a), []); return { toArray: () => rows.map(r => ({ ...r })) }; } };
  const d = new Dagbog({ sql });
  const t0 = Date.parse('2026-10-27T09:30:00Z'); // tirsdag 10:30 i København
  assert.deepEqual(cphDagTime(t0), { dag: 2, time: 10 });
  for (const v of ['ja', 'ja', 'nej']) d.skriv('stemme', v, t0);
  d.skriv('runde', null, t0);
  const s = d.statistik('stemme', t0 + 3600_000);
  assert.equal(s.iAlt, 3); assert.deepEqual(s.fordeling, { ja: 2, nej: 1 }); assert.equal(s.runder, 1);
  assert.equal(s.doegn, 3); assert.equal(s.travlesteDag, 2); assert.equal(s.travlesteTime, 10);
  assert.equal(new Dagbog({}).skriv('x'), false);
  assert.equal(new Dagbog({ sql: { exec() { throw new Error('fuld'); } } }).skriv('x'), false);
});

test('nødbremser: døgnloft fra vars med fornuftige standarder', async () => {
  const { loft, medLoft } = await import('../src/lib/budget.js');
  assert.equal(loft({}, 'browser'), 120); assert.equal(loft({ BROWSER_PER_DAY: '7' }, 'browser'), 7);
  assert.equal(loft({ EMBED_PER_DAY: 'x' }, 'embed'), 400);
  assert.equal(await medLoft({}, 'embed', async () => 42), 42); // uden D1 køres kaldet direkte
});
