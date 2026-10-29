import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as C from '../src/lib/chairlogic.js';
import { existsSync } from 'node:fs';
import { KATALOG, genstande } from '../src/lib/hittegods.js';
import { tekstTilIndeks } from '../src/features/hittegods.js';

test('stol: one step at a time, not into the river, not off the edge, not too fast', () => {
  const st = C.freshState(), rate = {};
  assert.equal(C.move(st, rate, 'a', 1, 1, 1000).code, 'one_step');
  assert.equal(C.move(st, rate, 'a', 1, 0, 1000).ok, true);               // (3,3)
  assert.equal(C.move(st, rate, 'a', 1, 0, 1100).code, 'too_fast');
  assert.equal(C.move(st, rate, 'b', 1, 0, 1100).ok, true);               // en anden gæst må godt: (4,3)
  assert.equal(C.move(st, rate, 'b', 1, 0, 2000).event, 'wobble');       // den løse sten (5,3)
  st.x = 4; st.y = 2;
  assert.equal(C.move(st, rate, 'a', 1, 0, 3000).code, 'river');          // (5,2) er vand
  st.x = 0; st.y = 0;
  assert.equal(C.move(st, rate, 'a', -1, 0, 4000).code, 'edge');
  assert.deepEqual([st.x, st.y], [0, 0]);
});

test('stol: the ford can be crossed on the stones, and Toke can be reached', () => {
  const st = C.freshState(), rate = {}; let t = 0;
  st.x = 4; st.y = 3;
  for (const [dx, dy] of [[1,0],[1,0],[1,0],[1,0],[1,0],[1,0]]) { t += 1000; const r = C.move(st, rate, 'a', dx, dy, t); assert.equal(r.ok, true, `${st.x},${st.y}`); }
  assert.deepEqual([st.x, st.y], [10, 3]);
  assert.equal(st.visits, 1);
  const snap = C.snapshot(st, 'a', 3, t + 5);
  assert.equal(snap.lastWasYou, true); assert.equal(C.snapshot(st, 'b', 3, t).lastWasYou, false);
  assert.ok(!JSON.stringify(snap).includes('"a"')); // ejer-id afsløres ikke
});

test('hittegods: catalog complete in both languages, ids unique, no puzzle solutions', () => {
  const ids = KATALOG.map(k => k[0]);
  assert.equal(new Set(ids).size, ids.length);
  assert.ok(ids.length >= 40);
  for (const g of genstande('da')) { assert.match(g.billede, /^\/assets\/pak\/[a-z0-9/-]+\.webp$/); assert.ok(existsSync(new URL('../..' + g.billede, import.meta.url)), g.billede); }
  for (const lang of ['da', 'en']) for (const g of genstande(lang)) { assert.ok(g.titel && g.tekst && g.sted && g.aar); assert.ok(tekstTilIndeks(g).length < 400); }
  const alt = JSON.stringify(KATALOG).toLowerCase();
  for (const forbudt of ['stykke a', 'piece a', 'læderrem', 'leather strap', 'overstregning', 'redaction', 'side 2']) assert.ok(!alt.includes(forbudt), forbudt);
});
