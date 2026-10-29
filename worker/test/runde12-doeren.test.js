import { test } from 'node:test';
import assert from 'node:assert/strict';
import { byggDoer, doerUdfald, doerForespoergsel } from '../src/features/vagt.js';

test('døren: statuskoder bliver til login, inde, afvist og andet', () => {
  assert.equal(doerUdfald(302), 'login'); assert.equal(doerUdfald('307'), 'login');
  assert.equal(doerUdfald(200), 'inde'); assert.equal(doerUdfald(304), 'inde');
  assert.equal(doerUdfald(403), 'afvist'); assert.equal(doerUdfald(401), 'afvist');
  assert.equal(doerUdfald(500), 'andet'); assert.equal(doerUdfald(undefined), 'andet');
});

test('døren: 7 og 30 dage tælles hver for sig som ugesummer, og kun antal gemmes', () => {
  const nu = Date.UTC(2026, 9, 29, 14);
  const d = byggDoer([
    { dag: '2026-10-29', noegle: '302', n: 7 }, { dag: '2026-10-29', noegle: '200', n: 1 },
    { dag: '2026-10-25', noegle: '302', n: 3 }, { dag: '2026-10-25', noegle: '403', n: 1 },
    { dag: '2026-10-10', noegle: '302', n: 5 }, { dag: '2026-09-01', noegle: '302', n: 99 },
  ], nu);
  assert.equal(d.iDag, undefined, 'ingen døgntal (runde 13: intet dagsmønster)');
  assert.deepEqual(d.d7, { forsoeg: 12, login: 10, inde: 1, afvist: 1, andet: 0 });
  assert.equal(d.d30.forsoeg, 17, 'ældre end fire uger tæller ikke');
  assert.equal(d.uger.length, 4); assert.equal(d.uger[3].til, '2026-10-29'); assert.equal(d.uger[3].fra, '2026-10-23'); assert.equal(d.uger[3].forsoeg, 12);
  assert.equal(d.uger[1].forsoeg, 5); assert.ok(!('dage' in d), 'ingen døgnrækker');
  assert.ok(!JSON.stringify(d).match(/\d+\.\d+\.\d+\.\d+/), 'ingen IP-adresser');
});

test('døren: forespørgslen spørger kun efter /admin/ og kun om statuskoder', () => {
  const q = doerForespoergsel('z', '2026-10-29');
  assert.match(q, /clientRequestPath:"\/admin\/"/); assert.match(q, /dimensions \{ edgeResponseStatus \}/);
  assert.match(q, /datetime_lt:"2026-10-30T00:00:00Z"/);
});
