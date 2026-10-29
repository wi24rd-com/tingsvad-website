import test from 'node:test';
import assert from 'node:assert/strict';
import { buildScript } from '../src/features/radio.js';

test('radio script: hele sætninger, punktum efter titel, ingen »..« eller pointe', () => {
  const ed = { lead: { title: 'Kosagen fortsætter', body: 'Høvdingen har udskudt. Ulf fastholder. Gamle Ravn har igen set på med interesse. Tingsvad-pointe: Stilheden er historien.' }, notice: { title: 'Notat.', body: 'Ingen afgørelse. ' + 'Lang sætning uden ende '.repeat(20) + 'slut.' } };
  const s = buildScript('da', ed);
  assert.match(s, /Første nyhed: Kosagen fortsætter\. Høvdingen/);
  assert.ok(!s.includes('..'));
  assert.ok(!s.includes('Tingsvad-pointe'));
  assert.match(s, /Anden nyhed: Notat\. Ingen afgørelse\.\n/);
});
