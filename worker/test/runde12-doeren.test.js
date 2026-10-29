import { test } from 'node:test';
import assert from 'node:assert/strict';
import { byggDoer, doerUdfald, doerForespoergsel } from '../src/features/vagt.js';

test('døren: statuskoder bliver til login, inde, afvist og andet', () => {
  assert.equal(doerUdfald(302), 'login'); assert.equal(doerUdfald('307'), 'login');
  assert.equal(doerUdfald(200), 'inde'); assert.equal(doerUdfald(304), 'inde');
  assert.equal(doerUdfald(403), 'afvist'); assert.equal(doerUdfald(401), 'afvist');
  assert.equal(doerUdfald(500), 'andet'); assert.equal(doerUdfald(undefined), 'andet');
});

test('døren: døgn, 7 og 30 dage tælles hver for sig, og kun antal gemmes', () => {
  const nu = Date.UTC(2026, 9, 29, 14);
  const d = byggDoer([
    { dag: '2026-10-29', noegle: '302', n: 7 }, { dag: '2026-10-29', noegle: '200', n: 1 },
    { dag: '2026-10-25', noegle: '302', n: 3 }, { dag: '2026-10-25', noegle: '403', n: 1 },
    { dag: '2026-10-10', noegle: '302', n: 5 }, { dag: '2026-09-01', noegle: '302', n: 99 },
  ], nu);
  assert.deepEqual(d.iDag, { forsoeg: 8, login: 7, inde: 1, afvist: 0, andet: 0 });
  assert.deepEqual(d.d7, { forsoeg: 12, login: 10, inde: 1, afvist: 1, andet: 0 });
  assert.equal(d.d30.forsoeg, 17, 'ældre end 30 døgn tæller ikke');
  assert.equal(d.dage.length, 30); assert.equal(d.dage[29].dag, '2026-10-29'); assert.equal(d.dage[29].login, 7);
  assert.ok(!JSON.stringify(d).match(/\d+\.\d+\.\d+\.\d+/), 'ingen IP-adresser');
});

test('døren: forespørgslen spørger kun efter /admin/ og kun om statuskoder', () => {
  const q = doerForespoergsel('z', '2026-10-29');
  assert.match(q, /clientRequestPath:"\/admin\/"/); assert.match(q, /dimensions \{ edgeResponseStatus \}/);
  assert.match(q, /datetime_lt:"2026-10-30T00:00:00Z"/);
});
