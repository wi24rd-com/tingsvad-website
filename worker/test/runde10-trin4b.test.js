// Runde 10, trin 4b: Spørg arkivet (AI Search, indbygget lager). Synk kun ved ændret indhold; kvote; kildelinks; Mímir kun fra uddrag.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { makeDb } from './d1mock.js';
import { synkArkiv, cronArkiv, spoergKerne, arkivSider, mdTitel, instansNavn } from '../src/features/arkiv.js';

function kv() { const m = new Map(); return { m, get: async (k, t) => { const v = m.get(k); return v == null ? null : t === 'json' ? JSON.parse(v) : v; }, put: async (k, v) => { m.set(k, v); } }; }
function aiSearch() {
  const inst = {}, kald = [];
  const lav = id => inst[id] || (inst[id] = { id, filer: new Map(), n: 0,
    items: { upload: async (key, md) => { const it = { id: `${id}:${++inst[id].n}`, key }; inst[id].filer.set(key, md); kald.push(['upload', id, key]); return it; }, delete: async iid => { kald.push(['delete', id, iid]); } },
    search: async ({ query }) => { kald.push(['search', id, query]); return { chunks: [...inst[id].filer.entries()].slice(0, 2).map(([key, md], i) => ({ item: { key }, text: md, score: 0.8 - i / 10 })) }; } });
  return { inst, kald, create: async ({ id }) => { if (inst[id]) throw new Error('instance already exists'); return lav(id); }, get: id => lav(id) };
}
const md = (titel, tekst) => `---\ntitle: "${titel} · Tingsvad"\nlang: "da"\n---\n\n# ${titel}\n\n${tekst}\n`;
function siteFetch(over = {}) {
  globalThis.fetch = async url => {
    const p = new URL(url).pathname.replace(/index\.md$/, '');
    const body = over[p] ?? md(p === '/' ? 'Vadestedet' : p.split('/').filter(Boolean).pop(), 'Koen er udsat siden 980.');
    return new Response(body, { status: 200, headers: { 'content-type': 'text/markdown; charset=utf-8' } });
  };
}

test('mdTitel and the page list: both languages, one file per page, ARKIV_UDELAD respected', () => {
  assert.equal(mdTitel(md('Historien', 'x')), 'Historien');
  const alle = arkivSider({});
  assert.ok(alle.length === 62 && alle.every(s => /^[a-z0-9-]+-(da|en)\.md$/.test(s.noegle)));
  assert.equal(arkivSider({ ARKIV_UDELAD: 'kodegryden-da,kodegryden-en' }).length, alle.length - 2);
  assert.equal(instansNavn({}, 'en'), 'tingsvad-arkiv-en');
});

test('synk: first run uploads every page into two instances; second run uploads nothing; a changed page replaces its old item', async () => {
  const env = { AI_SEARCH: aiSearch(), SAGER: kv(), ARKIV_SYNK_MAX: '100' }; // runde 13: 62 sider; standarden er 40 pr. kørsel
  siteFetch();
  const r1 = await synkArkiv(env, null);
  assert.equal(r1.uploadet, arkivSider({}).length); assert.equal(r1.fejl.length, 0);
  assert.deepEqual(Object.keys(env.AI_SEARCH.inst).sort(), ['tingsvad-arkiv-da', 'tingsvad-arkiv-en']);
  const r2 = await synkArkiv(env, null);
  assert.equal(r2.uploadet, 0); assert.equal(r2.uaendret, r1.uploadet);
  siteFetch({ '/historien/': md('Historien', 'Ny tekst om Ragnhild.') });
  const r3 = await synkArkiv(env, null);
  assert.equal(r3.uploadet, 1);
  assert.ok(env.AI_SEARCH.kald.some(k => k[0] === 'delete' && k[1] === 'tingsvad-arkiv-da'));
});

test('synk skips non-Markdown answers (e.g. an HTML error page) and reports them', async () => {
  const env = { AI_SEARCH: aiSearch(), SAGER: kv() };
  globalThis.fetch = async () => new Response('<html>', { status: 200, headers: { 'content-type': 'text/html' } });
  const r = await synkArkiv(env, null);
  assert.equal(r.uploadet, 0); assert.equal(r.fejl.length, arkivSider({}).length);
});

test('cron: once per date and not before 07', async () => {
  const env = { AI_SEARCH: aiSearch(), SAGER: kv() }; siteFetch();
  assert.equal(await cronArkiv(env, null, '2026-10-28', 6), 'skipped');
  assert.equal((await cronArkiv(env, null, '2026-10-28', 7)).status, 'ok');
  assert.equal(await cronArkiv(env, null, '2026-10-28', 8), 'done');
});

test('spoergKerne: sources with links and titles, Mímir silent without AI, and the daily quota holds', async () => {
  const env = { AI_SEARCH: aiSearch(), SAGER: kv(), DB: makeDb(), ARKIV_PER_DAY: '2' }; siteFetch();
  await synkArkiv(env, null);
  const r = await spoergKerne(env, 'Hvad med koen?', 'da');
  assert.equal(r.svar, null);
  assert.equal(r.kilder.length, 2);
  assert.match(r.kilder[0].url, /^https:\/\/tingsvad\.dk\//);
  assert.ok(r.kilder[0].titel && !r.kilder[0].uddrag.startsWith('---'), 'front matter stripped');
  await spoergKerne(env, 'Igen?', 'da');
  await assert.rejects(spoergKerne(env, 'Tredje?', 'da'), e => e.code === 'quota' && e.status === 429);
});

test('spoergKerne: not configured without the binding', async () => {
  await assert.rejects(spoergKerne({ DB: makeDb() }, 'koen', 'da'), e => e.code === 'not_configured');
});

test('udsnit: the excerpt centres on the question words; renChunk strips front matter and Markdown noise', async () => {
  const { udsnit, renChunk } = await import('../src/features/arkiv.js');
  const lang = 'Stedet ved vadestedet. '.repeat(30) + 'Ragnhild har med andre ord nøglerne, jorden, retten og økserne. ' + 'Mere tekst. '.repeat(30);
  const u = udsnit(lang, 'Hvem er Ragnhild?');
  assert.ok(u.includes('Ragnhild har'), u); assert.ok(u.startsWith('… ') && u.endsWith(' …')); assert.ok(u.length <= 330);
  assert.equal(renChunk('---\ntitle: "x"\n---\n\n## Overskrift | a | **b**'), 'Overskrift a b');
  assert.ok(udsnit('kort tekst', 'x') === 'kort tekst');
});
