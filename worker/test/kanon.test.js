import { test } from 'node:test';
import assert from 'node:assert/strict';
import { faktaTekst, tilladteTal, rensTal, afgjorteAntal, senesteAfgoerelse } from '../src/lib/kanon.js';

test('kanon: three rulings, the latest in the 1990s', () => {
  assert.equal(afgjorteAntal(), 3);
  const s = senesteAfgoerelse();
  assert.ok(s.aar >= 1990 && s.aar <= 1999);
});

test('kanon: FACTS carries the computed age of the case', () => {
  assert.match(faktaTekst('da', '2026-10-27'), /udsat i 1046 år/);
  assert.match(faktaTekst('en', '2027-01-02'), /adjourned for 1046 years/); // nytår ændrer intet
  assert.match(faktaTekst('en', '2027-06-20'), /adjourned for 1046 years/);
  assert.match(faktaTekst('en', '2027-06-21'), /adjourned for 1047 years/); // midsommer: et år mere
});

test('kanon: number guard drops invented numbers and wrong units', () => {
  const user = faktaTekst('da', '2026-10-26') + ' Gennemførte afstemningsrunder: 1.';
  const ok = tilladteTal(user, '1236'), siden = 1046;
  const r = rensTal('Ulf fastholder sit krav. Mímir har regnet: 1046 timer og 32 minutter siden 980. Sagen er udsat i 1046 år.', ok, siden);
  assert.equal(r.fjernet, 1);
  assert.equal(r.tekst, 'Ulf fastholder sit krav. Sagen er udsat i 1046 år.');
  assert.equal(rensTal('Gamle Ravn må tale i 5 minutter.', ok, siden).fjernet, 1);
  assert.equal(rensTal('Day 1046 of inactivity.', ok, siden).fjernet, 1);
  assert.equal(rensTal('Stillingen har været ledig siden 1236.', ok, siden).fjernet, 0);
  assert.equal(rensTal('Der blev gennemført 1 afstemningsrunde.', ok, siden).fjernet, 0);
});
