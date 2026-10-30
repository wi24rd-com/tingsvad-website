import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { makeDb } from './d1mock.js';
import { revisionsliste, revisérSide, getRevision, kanGenbruge, fuldDag, htmlHash } from '../src/features/revision.js';


test('revision (round 10): the audit page and the architecture diagram are on the list', () => {
  const l = revisionsliste();
  assert.equal(l.length, 32);
  assert.ok(l.find(p => p.side === 'revisionen-en' && p.path === '/en/machine-room/audit/'));
  assert.ok(l.find(p => p.side === 'maskinrummet-da').sel.arkitektur);
});

test('revision: Mondays are full runs (date in Europe/Copenhagen)', () => {
  assert.equal(fuldDag('2026-10-26'), true);
  assert.equal(fuldDag('2026-10-27'), false);
  assert.equal(fuldDag('2026-11-01'), false);
});

test('revision: the fingerprint covers the HTML and the selectors', async () => {
  const a = await htmlHash('<html>x</html>', { nav: 'a' });
  assert.match(a, /^[0-9a-f]{64}$/);
  assert.equal(a, await htmlHash('<html>x</html>', { nav: 'a' }));
  assert.notEqual(a, await htmlHash('<html>y</html>', { nav: 'a' }));
  assert.notEqual(a, await htmlHash('<html>x</html>', { nav: 'b' }));
});

test('revision: a check is reused only for the same HTML, a passed original check, a sound fetch and within a week', () => {
  const forrige = { date_key: '2026-10-27', status: 'bestaaet', html_hash: 'h', genbrugt_fra: null };
  const base = { forrige, dateKey: '2026-10-28', hash: 'h', http: 200, dele: 'topbar,sidenav,footer,krummer', fuld: false };
  assert.equal(kanGenbruge(base), true);
  assert.equal(kanGenbruge({ ...base, hash: 'andet' }), false);
  assert.equal(kanGenbruge({ ...base, fuld: true }), false);
  assert.equal(kanGenbruge({ ...base, http: 500 }), false);
  assert.equal(kanGenbruge({ ...base, dele: 'topbar,footer' }), false);
  assert.equal(kanGenbruge({ ...base, forrige: { ...forrige, status: 'fejlet' } }), false);
  assert.equal(kanGenbruge({ ...base, forrige: { ...forrige, genbrugt_fra: '2026-10-26' } }), false);
  assert.equal(kanGenbruge({ ...base, dateKey: '2026-11-03' }), true);
  assert.equal(kanGenbruge({ ...base, dateKey: '2026-11-04' }), false);
  assert.equal(kanGenbruge({ ...base, forrige: null }), false);
});

test('revision: an unchanged page is not opened in the browser the next day, and its picture points at the original check', async () => {
  const db = makeDb(); // runde 13: makeDb kører alle migrationer
  let html = '<html lang="da"><body>samme side</body></html>', browserKald = 0;
  const gemt = {};
  const env = {
    DB: db, SITE_ORIGIN: 'https://tingsvad.test',
    MEDIA: { put: async (k) => { gemt[k] = true; } },
    BROWSER: { quickAction: async () => { browserKald++; const sel = Object.fromEntries(Object.keys(item.sel).map(k => [k, 1])); return { result: { content: `<html data-tv-revision="${JSON.stringify({ sel, fejl: [] }).replace(/"/g, '&quot;')}">`, screenshot: btoa('jpg') } }; } },
  };
  const item = revisionsliste().find(p => p.side === 'arkivet-da');
  const gammel = globalThis.fetch;
  globalThis.fetch = async () => new Response(html, { status: 200, headers: { 'x-tingsvad-dele': 'topbar,sidenav,footer' } });
  try {
    for (const d of ['2026-10-27', '2026-10-28']) await db.prepare('INSERT INTO revisioner (date_key, state, started_at) VALUES (?, ?, ?)').bind(d, 'done', d).run();
    assert.equal((await revisérSide(env, '2026-10-27', item)).browser, true);
    assert.equal(browserKald, 1);
    const r2 = await revisérSide(env, '2026-10-28', item);
    assert.deepEqual([r2.status, r2.browser, browserKald], ['bestaaet', false, 1]);
    const res = await getRevision(new Request('https://x/api/ting-ai/revision?lang=da'), env);
    const side = (await res.json()).data.pages.find(p => p.side === 'arkivet-da');
    assert.equal(side.genbrugt, '2026-10-27');
    assert.equal(side.screenshot, '/api/ting-ai/revision/billede/2026-10-27/arkivet-da');
    html = '<html lang="da"><body>ny udgave</body></html>'; // ændret side → browseren igen
    assert.equal((await revisérSide(env, '2026-10-29', item)).browser, true);
    assert.equal(browserKald, 2);
    assert.equal((await revisérSide(env, '2026-11-02', item, { fuld: true })).browser, true); // mandag: altid fuldt
    assert.equal(browserKald, 3);
  } finally { globalThis.fetch = gammel; }
});
