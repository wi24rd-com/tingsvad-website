// Runde 13 (AP7): gæstebogen, tællerne og dagens besøgende i D1 – atomiske numre, engangsimport fra KV, cursor, sletning,
// og de interne ruter, som site-Workeren kalder gennem service bindingen.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { makeDb } from './d1mock.js';
import { laesSager, laesGaester, grundsagerEfter, skrivSag, sletSag, adminListe, taeller, besoeg, rydBesoeg, importerFraKv } from '../src/lib/gaestebog.js';
import { intern, INTERN_HEADER } from '../src/features/gaestebog.js';
import { GRUNDSAGER, nummer, idAf } from '../../shared/gaestebog.js';

function kv(start = {}) { const m = new Map(Object.entries(start)); return { m, get: async (k, type) => { const v = m.get(k); return v == null ? null : type === 'json' ? JSON.parse(v) : v; }, put: async (k, v) => { m.set(k, v); } }; }
const env = (extra = {}) => ({ DB: makeDb(), SAGER: kv(), ...extra });

test('nummer/idAf: the three base cases are 0001–0003, the first guest is 0004', () => {
  assert.equal(nummer(1), '980-0004');
  assert.equal(idAf('980-0004'), 1);
  assert.equal(idAf('980-0003'), null);
  assert.equal(idAf('x'), null);
});

test('20 concurrent cases get 20 different numbers (ChatGPT T2: KV read-modify-write gave duplicates)', async () => {
  const e = env();
  const alle = await Promise.all(Array.from({ length: 20 }, (_, i) => skrivSag(e, { navn: 'Gæst ' + i, sag: 'Sag nummer ' + i })));
  const numre = new Set(alle.map(s => s.nr));
  assert.equal(numre.size, 20);
  assert.ok(numre.has('980-0004') && numre.has('980-0023'));
  const liste = await laesSager(e, 50);
  assert.equal(liste.length, 23, 'guest cases + base cases');
  assert.deepEqual(liste.slice(-3), GRUNDSAGER);
  assert.equal(liste[0].nr, '980-0023', 'newest first');
});

test('first write imports the old KV list once, and the counter continues after deleted numbers', async () => {
  const e = env({ SAGER: kv({ liste: JSON.stringify([{ nr: '980-0006', navn: 'C', sag: 'tre', dato: '2026-10-01' }, { nr: '980-0004', navn: 'A', sag: 'en', dato: '2026-09-30' }]), taeller: '3' }) });
  assert.equal(await importerFraKv(e), 2);
  assert.equal(await importerFraKv(e), 0, 'idempotent');
  const liste = await laesSager(e, 10);
  assert.deepEqual(liste.map(s => s.nr), ['980-0006', '980-0004', '980-0003', '980-0002', '980-0001']);
  const ny = await skrivSag(e, { navn: 'D', sag: 'fire' });
  assert.equal(ny.nr, '980-0007', '980-0005 was deleted in KV and must not be reused');
});

test('cursor: pages through guest cases; the base cases follow once the guests are used up', async () => {
  const e = env();
  for (let i = 0; i < 5; i++) await skrivSag(e, { navn: 'G', sag: 'sag ' + i });
  assert.deepEqual((await laesGaester(e, 2)).map(s => s.nr), ['980-0008', '980-0007']);
  assert.deepEqual((await laesGaester(e, 2, '980-0007')).map(s => s.nr), ['980-0006', '980-0005']);
  assert.deepEqual((await laesGaester(e, 2, '980-0005')).map(s => s.nr), ['980-0004']);
  assert.deepEqual((await laesGaester(e, 2, '980-0004')), []);
  assert.deepEqual(grundsagerEfter('980-0002').map(s => s.nr), ['980-0001']);
  assert.equal((await laesSager(e, 2)).length, 5, 'the site always gets the base cases after the page');
});

test('delete keeps number, time and who, drops the text; base cases cannot be deleted', async () => {
  const e = env();
  await skrivSag(e, { navn: 'X', sag: 'slet mig' });
  assert.equal(await sletSag(e, '980-0004', 'jan@example.test'), true);
  assert.equal(await sletSag(e, '980-0004', 'jan@example.test'), false);
  assert.equal(await sletSag(e, '980-0001', 'jan@example.test'), false);
  const adm = await adminListe(e);
  assert.equal(adm.sager.length, 0);
  assert.equal(adm.slettet[0].nr, '980-0004'); assert.equal(adm.slettet[0].af, 'jan@example.test');
  assert.equal((await laesSager(e, 10)).length, 3);
  assert.equal((await skrivSag(e, { navn: 'Y', sag: 'næste' })).nr, '980-0005');
});

test('counters and visitors are atomic and keyed per day', async () => {
  const e = env();
  await Promise.all([taeller(e, 'afgoer', 1), taeller(e, 'afgoer', 1), taeller(e, 'afgoer', 1)]);
  assert.equal(await taeller(e, 'afgoer'), 3);
  assert.equal(await besoeg(e, '2026-10-30', 'a'.repeat(16)), 1);
  assert.equal(await besoeg(e, '2026-10-30', 'a'.repeat(16)), 1, 'same guest once');
  assert.equal(await besoeg(e, '2026-10-30', 'b'.repeat(16)), 2);
  assert.equal(await besoeg(e, '2026-10-31'), 0);
  await rydBesoeg(e, '2026-10-31');
  assert.equal(await besoeg(e, '2026-10-30'), 0);
});

test('intern routes: only with the internal header; create → 201 with the number; bad input → 400', async () => {
  const e = env();
  const kald = (sti, init = {}, header = true) => intern(new Request('https://ting-ai/api/ting-ai/' + sti, { ...init, headers: { ...(header ? { [INTERN_HEADER]: '1' } : {}), ...(init.headers || {}) } }), e, {}, sti.split('?')[0], 'da');
  assert.equal((await kald('intern/gaestebog', {}, false)).status, 404);
  const ny = await kald('intern/gaestebog', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ navn: 'Test', sag: 'En sag om koen', kilde: 'snyd' }) });
  assert.equal(ny.status, 201);
  const j = await ny.json();
  assert.equal(j.ok, true); assert.equal(j.data.nr, '980-0004'); assert.equal(j.data.kilde, undefined, 'kilde is only mcp or nothing');
  const liste = await (await kald('intern/gaestebog?max=10')).json();
  assert.equal(liste.data.sager[0].navn, 'Test');
  await assert.rejects(kald('intern/gaestebog', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ navn: 'T', sag: 'x' }) }), e => e.code === 'bad_request');
  assert.equal((await (await kald('intern/taeller/afgoer', { method: 'POST' })).json()).data.n, 1);
  const b = await (await kald('intern/besoeg', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ dag: '2026-10-30', h: 'c'.repeat(16) }) })).json();
  assert.equal(b.data.n, 1);
  assert.equal((await kald('intern/taeller/hemmelig')).status, 404);
});
