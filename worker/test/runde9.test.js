import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normaliserSagsmappe, sagsmappeHtml, view, ravnToken, ravnQueue } from '../src/features/ravn.js';
import { revisionsliste, vurder, læsSnapshot, tjekScriptUrl } from '../src/features/revision.js';

test('ravn: only known ids survive, order and duplicates do not change the input', () => {
  const a = normaliserSagsmappe({ fragments: ['shield', 'archive', 'shield', 'x'], found: ['moent', '<img>'], ticket: 'K-0980-0042', chairCase: 'S-20261026-ABC123', stool: ['ryglæn', '<b>'], decideAttempts: 7, navn: 'Toke' }, 'da');
  const b = normaliserSagsmappe({ fragments: ['archive', 'shield'], found: ['moent'], ticket: 'K-0980-0042', chairCase: 'S-20261026-ABC123', stool: ['ryglæn'], decideAttempts: 7, navn: 'Toke' }, 'da');
  assert.deepEqual(a, b);
  assert.deepEqual(a.fragments, ['archive', 'shield']);
  assert.equal(normaliserSagsmappe({ ticket: 'K-1' }, 'da').ticket, null);
  assert.throws(() => normaliserSagsmappe({ navn: 'x'.repeat(41) }, 'da'));
});

test('ravn: the PDF template escapes everything from the guest', () => {
  const d = normaliserSagsmappe({ navn: '<script>alert(1)</script>', fragments: ['archive'] }, 'en');
  const html = sagsmappeHtml(d, 'en', { id: 'R-20261026-ABCDEF', created_at: '2026-10-26T20:00:00Z', attempts: 0, via: 'queue' }, 'https://tingsvad.dk');
  assert.ok(!html.includes('<script>alert'));
  assert.ok(html.includes('&lt;script&gt;'));
  assert.match(html, /Piece A/);
  assert.match(html, /Queues → Workflows → Browser Run → R2/);
});

test('ravn: the certificate of attendance is validated and escaped', () => {
  const d = normaliserSagsmappe({ cert: { navn: '<b>Toke</b>', nr: '980-4711', dato: '2026-10-27' } }, 'da');
  assert.deepEqual(d.cert, { navn: '<b>Toke</b>', nr: '980-4711', dato: '2026-10-27' });
  const html = sagsmappeHtml(d, 'da', { id: 'R-20261027-ABCDEF', created_at: '2026-10-27T06:00:00Z', attempts: 0, via: 'queue' }, 'https://tingsvad.dk');
  assert.match(html, /Bevis for fremmøde<\/th><td>&lt;b&gt;Toke&lt;\/b&gt; · 980-4711 · 27\. oktober 2026/);
  assert.equal(normaliserSagsmappe({ cert: { navn: 'X', nr: '981-1', dato: '2026-10-27' } }, 'da').cert, null);
  assert.equal(normaliserSagsmappe({ cert: { navn: 'X', nr: '980-1234', dato: '27-10-2026' } }, 'da').cert, null);
  assert.equal(normaliserSagsmappe({}, 'da').cert, null);
});

test('ravn: token is bound to job and owner; view never leaks the file without a token', async () => {
  const env = { SESSION_SECRET: 's' };
  const t1 = await ravnToken(env, 'R-20261026-ABCDEF', 'o1'), t2 = await ravnToken(env, 'R-20261026-ABCDEF', 'o2');
  assert.notEqual(t1, t2); assert.equal(t1, await ravnToken(env, 'R-20261026-ABCDEF', 'o1'));
  const row = { id: 'R-20261026-ABCDEF', kind: 'sagsmappe', state: 'fejlet', steps_json: '[]', attempts: 1, via: 'queue', result_key: 'ravn/x.pdf', error: 'boom', created_at: 'a', updated_at: 'b' };
  assert.equal(view(row, null).file, null);
  assert.equal(view(row, t1).canRetry, true);
  assert.equal(view({ ...row, attempts: 3 }, t1).canRetry, false);
});

test('ravn: queue delivered twice creates the instance once and acks both', async () => {
  const made = new Set(), acks = [];
  const env = { RAVN: { async create({ id }) { if (made.has(id)) throw new Error('instance already exists'); made.add(id); } } };
  const msg = () => ({ body: { id: 'R-20261026-ABCDEF', attempt: 0 }, attempts: 1, ack() { acks.push(1); }, retry() { throw new Error('no retry expected'); } });
  await ravnQueue({ messages: [msg(), msg()] }, env, () => {});
  assert.equal(made.size, 1); assert.equal(acks.length, 2);
});

test('revision: 62 pages, a page passes only with 200, all partials, all elements and no JS errors', () => {
  const liste = revisionsliste();
  assert.equal(liste.length, 62);
  const sel = liste[0].sel;
  const fuld = Object.fromEntries(Object.keys(sel).map(k => [k, 1]));
  assert.equal(vurder({ http: 200, dele: 'topbar,sidenav,footer', snap: { sel: fuld, fejl: [] }, sel }).status, 'bestaaet');
  assert.deepEqual(vurder({ http: 200, dele: 'topbar,footer', snap: { sel: fuld, fejl: [] }, sel }).mangler, ['partials']);
  assert.equal(vurder({ http: 200, dele: 'topbar,sidenav,footer', snap: { sel: { ...fuld, hero: 0 }, fejl: [] }, sel }).status, 'fejlet');
  assert.equal(vurder({ http: 200, dele: 'topbar,sidenav,footer', snap: { sel: fuld, fejl: ['TypeError'] }, sel }).status, 'fejlet');
  assert.equal(vurder({ http: 500, dele: 'topbar,sidenav,footer', snap: { sel: fuld, fejl: [] }, sel }).status, 'fejlet');
});

test('revision: the injected script result is read back from the serialized HTML', () => {
  const u = new URL(tjekScriptUrl('https://tingsvad.dk', { nav: '#sidenav a[aria-current]' }));
  assert.equal(u.origin + u.pathname, 'https://tingsvad.dk/assets/revision-tjek-v1.js'); // samme origin: tilladt af CSP
  assert.deepEqual(JSON.parse(decodeURIComponent(u.search.slice(3))), { nav: '#sidenav a[aria-current]' });
  const html = '<html lang="da" data-tv-revision="{&quot;sel&quot;:{&quot;nav&quot;:7},&quot;fejl&quot;:[],&quot;titel&quot;:&quot;Arkivet &amp; co&quot;}"><body></body></html>';
  assert.deepEqual(læsSnapshot(html), { sel: { nav: 7 }, fejl: [], titel: 'Arkivet & co' });
  assert.equal(læsSnapshot('<html>'), null);
});
