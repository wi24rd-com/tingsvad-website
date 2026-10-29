import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as L from '../src/lib/roomlogic.js';
import { conform } from '../src/lib/validate.js';
import { cphDateKey, cphHour } from '../src/lib/dates.js';
import { sniffImage } from '../src/features/vision.js';
import { selectHint, HINTS } from '../src/lib/canon.js';
import { buildScript } from '../src/features/radio.js';

test('afstemning: otte joins til syv pladser, én afvises; reconnect giver ikke ekstra stemme', () => {
  const st = L.freshState(1); const now = 1000;
  const results = [];
  for (let i = 1; i <= 8; i++) results.push(L.join(st, 'o' + i, Math.min(i, 7), now, 30000));
  assert.equal(results.filter(r => r.ok).length, 7);
  assert.equal(results[7].ok, false); assert.equal(results[7].code, 'taken'); assert.equal(results[7].full, true);
  assert.equal(st.phase, 'voting'); assert.equal(st.deadline, now + 30000);
  assert.equal(L.vote(st, 'o1', 'ja', now + 1).ok, true);
  assert.equal(L.vote(st, 'o1', 'nej', now + 2).code, 'already_voted');
  // reconnect: samme owner får samme plads og kan ikke stemme igen
  const re = L.join(st, 'o1', 3, now + 3, 30000); assert.equal(re.slot, 1); assert.equal(re.already, true);
  assert.equal(L.vote(st, 'o1', 'eventuelt', now + 4).code, 'already_voted');
  assert.deepEqual(st.votes, { ja: 1, nej: 0, eventuelt: 0 });
  assert.equal(L.vote(st, 'o9', 'ja', now).code, 'no_seat');
  assert.equal(L.vote(st, 'o2', 'måske', now).code, 'bad_vote');
});

test('afstemning: frist lukker runden, ny runde efter pause, forladte pladser udløber', () => {
  const st = L.freshState(1); const t0 = 0;
  L.join(st, 'a', 1, t0, 30000); L.join(st, 'b', 2, t0, 30000); L.vote(st, 'a', 'ja', t0 + 5);
  assert.deepEqual(L.tick(st, t0 + 29999, () => true), []);
  assert.deepEqual(L.tick(st, t0 + 30000, () => true), ['closed']); assert.equal(st.phase, 'closed');
  assert.equal(L.vote(st, 'b', 'nej', t0 + 30001).code, 'not_voting');
  assert.deepEqual(L.tick(st, t0 + 30000 + L.CLOSED_MS, () => true), ['new_round']);
  assert.equal(st.phase, 'lobby'); assert.equal(st.round, 2); assert.deepEqual(st.slots, {});
  L.join(st, 'c', 4, 100000, 60000); // lang runde: pladsen forlades uden stemme og uden socket
  assert.deepEqual(L.tick(st, 100000 + L.GRACE_MS + 1, () => false), ['expired', 'reset']);
  assert.equal(st.phase, 'lobby');
});

test('snapshot afslører ikke andres ejer-id', () => {
  const st = L.freshState(1); L.join(st, 'a', 1, 0, 30000);
  const s = L.snapshot(st, 'b', 1, 2);
  assert.equal(JSON.stringify(s).includes('"a"'), false); assert.equal(s.slots[0].taken, true); assert.equal(s.you, null);
});

test('conform: forkert JSON fra modellen afvises, for lang tekst klippes, enum håndhæves', () => {
  const schema = { type: 'object', required: ['speeches', 'minutes'], properties: { speeches: { type: 'array', minItems: 3, maxItems: 3, items: { type: 'object', required: ['characterId', 'text'], properties: { characterId: { type: 'string', enum: ['ulf', 'gudrun', 'ragnhild'] }, text: { type: 'string', minLength: 5, maxLength: 20 } } } }, minutes: { type: 'string', maxLength: 50 } } };
  assert.throws(() => conform({ speeches: [], minutes: 'x' }, schema), /too few/);
  assert.throws(() => conform({ speeches: [{ characterId: 'brian', text: 'hello world' }, {}, {}], minutes: 'x' }, schema), /not allowed/);
  assert.throws(() => conform('not json', schema), /object expected/);
  const out = conform({ speeches: [{ characterId: 'ulf', text: 'Dette er en meget lang tekst der skal klippes' }, { characterId: 'gudrun', text: 'Bilag mangler.' }, { characterId: 'ragnhild', text: 'Tredive sekunder.' }], minutes: 'ok ok', extra: 'dropped' }, schema);
  assert.ok(out.speeches[0].text.length <= 21); assert.equal('extra' in out, false);
});

test('dato: Europe/Copenhagen ved sommertidsskift og ved midnat UTC', () => {
  assert.equal(cphDateKey(new Date('2026-03-28T23:30:00Z')), '2026-03-29'); // CET +1
  assert.equal(cphDateKey(new Date('2026-03-29T22:30:00Z')), '2026-03-30'); // CEST +2 efter skift
  assert.equal(cphDateKey(new Date('2026-10-24T22:30:00Z')), '2026-10-25'); // sidste CEST-nat
  assert.equal(cphDateKey(new Date('2026-10-25T23:30:00Z')), '2026-10-26'); // tilbage til CET: 00:30 lokal
  assert.equal(cphHour(new Date('2026-07-01T03:00:00Z')), 5);
});

test('sniffImage: signaturer og dimensioner; SVG og tekst afvises', () => {
  const png = new Uint8Array(32); png.set([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 13, 0x49, 0x48, 0x44, 0x52, 0, 0, 0x04, 0x00, 0, 0, 0x03, 0x00]);
  assert.deepEqual(sniffImage(png), { type: 'image/png', width: 1024, height: 768 });
  const jpg = new Uint8Array([0xff, 0xd8, 0xff, 0xc0, 0x00, 0x11, 0x08, 0x01, 0x00, 0x02, 0x00, 0x03, 0, 0, 0, 0, 0, 0, 0, 0]);
  assert.deepEqual(sniffImage(jpg), { type: 'image/jpeg', width: 512, height: 256 });
  const webp = new Uint8Array(40); webp.set([0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50, 0x56, 0x50, 0x38, 0x4c, 0, 0, 0, 0, 0x2f]); webp[21] = 0xff; webp[22] = 0x03; webp[23] = 0x00; webp[24] = 0x10;
  assert.equal(sniffImage(webp).type, 'image/webp');
  assert.equal(sniffImage(new TextEncoder().encode('<svg xmlns="http://www.w3.org/2000/svg"></svg>')), null);
  assert.equal(sniffImage(new TextEncoder().encode('GIF89a......................')), null);
});

test('Mímir: løsningen gives kun på niveau solution; navigation svarer uden gåde', () => {
  const h = selectHint('da', 'Hvor er stykke B?', 'hint', []);
  assert.equal(h.topic, 'shield'); assert.equal(h.text.includes('Løsn'), false);
  assert.equal(selectHint('da', 'Hvor er stykke B?', 'solution', []).text, HINTS.da.shield.solution);
  assert.equal(selectHint('da', 'Hvor finder jeg gæstebogen?', 'solution', []).topic, 'nav');
  // fundet fragment → peg på et manglende
  assert.equal(selectHint('en', 'Where is piece A?', 'hint', ['archive']).topic, 'shield');
  assert.equal(selectHint('en', 'help', 'clearer', ['archive', 'shield']).topic, 'excavation');
});

test('radio: manuskript bygges deterministisk fra avisen', () => {
  const ed = { lead: { title: 'Stol fundet ledig.', body: 'x'.repeat(400) }, notice: { title: 'Notat', body: 'y' } };
  const a = buildScript('da', ed), b = buildScript('da', ed);
  assert.equal(a, b); assert.ok(a.startsWith('Godmorgen')); assert.ok(a.includes('Første nyhed: Stol fundet ledig.')); assert.ok(a.length < 900);
});
