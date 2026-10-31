// Runde 13 (AP9): semaforen (samtidige pladser med udløb), Browser Run bag den, live-lytterloftet og nødstoppet.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { semaforLogik as S } from '../src/lib/semaforlogik.js';
import { browserAction, tagPlads, BROWSER_SAMTIDIG } from '../src/lib/budget.js';

test('semafor: at most maks seats, expired seats are freed, released seats come back', () => {
  const l = {}, t0 = 1000;
  assert.equal(S.tag(l, 2, 500, t0, 'a'), 'a');
  assert.equal(S.tag(l, 2, 500, t0, 'b'), 'b');
  assert.equal(S.tag(l, 2, 500, t0 + 10, 'c'), null, 'full');
  S.slip(l, 'a');
  assert.equal(S.tag(l, 2, 500, t0 + 20, 'c'), 'c');
  assert.equal(S.antal(l, t0 + 600), 0, 'all expired');
  assert.equal(S.tag(l, 2, 500, t0 + 600, 'd'), 'd');
});

function semafor(maks) { // DO-stub med samme logik
  const l = {}; let n = 0;
  return { get: () => ({ tag: async (m, ttl) => S.tag(l, m, ttl, Date.now(), 't' + (++n)), slip: async t => { S.slip(l, t); } }), idFromName: x => x, l };
}

test('browserAction: the fifth concurrent Browser Run call is refused with 503 busy, and seats are released afterwards', async () => {
  const sem = semafor();
  let i = 0; const aabne = [];
  const env = { SEMAFOR: sem, BROWSER: { quickAction: () => new Promise(r => aabne.push(r)) } };
  assert.equal(BROWSER_SAMTIDIG(env), 4);
  const kald = Array.from({ length: 4 }, () => browserAction(env, 'screenshot', {}));
  await new Promise(r => setTimeout(r, 5));
  await assert.rejects(browserAction(env, 'screenshot', {}), e => e.code === 'busy' && e.status === 503 && e.retryAfter === 10);
  aabne.forEach(r => r('ok')); await Promise.all(kald);
  assert.equal(Object.keys(sem.l).length, 0, 'all seats released');
  env.BROWSER.quickAction = async () => 'igen'; assert.equal(await browserAction(env, 'pdf', {}), 'igen'); // en plads igen: ingen fejl
});

test('tagPlads: without the binding (unit tests, local dev) there is no cap', async () => {
  assert.equal(await tagPlads({}, 'browser', 4, 1000), null);
});
