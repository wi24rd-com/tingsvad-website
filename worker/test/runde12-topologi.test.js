// Runde 12: infrastrukturkortets målinger (/api/ting-ai/topologi) uden rigtige bindinger.
import test from 'node:test';
import assert from 'node:assert/strict';
import { coloFraTrace, maal, maalTopologi } from '../src/features/topologi.js';

test('coloFraTrace læser colo-linjen og afviser alt andet', () => {
  assert.equal(coloFraTrace('fl=1\nh=www.cloudflare.com\ncolo=CPH\nhttp=http/2\n'), 'CPH');
  assert.equal(coloFraTrace('colo=ams\n'), null);
  assert.equal(coloFraTrace('xcolo=CPH\n'), null);
  assert.equal(coloFraTrace(''), null);
});

test('maal fanger fejl og timeout uden at kaste', async () => {
  const a = await maal(async () => ({ x: 1 }));
  assert.equal(a.ok, true); assert.equal(a.x, 1); assert.ok(a.ms >= 0);
  const b = await maal(async () => { throw new Error('nej'); });
  assert.equal(b.ok, false); assert.equal(b.fejl, 'nej');
  const c = await maal(() => new Promise(() => { }), 20);
  assert.equal(c.ok, false); assert.equal(c.fejl, 'timeout');
});

test('maalTopologi samler alle målinger og tåler manglende bindinger', async () => {
  const stub = colo => ({ get: () => ({ topologi: async () => colo }), idFromName: n => n });
  const env = {
    DB: { prepare: () => ({ all: async () => ({ meta: { served_by_region: 'WEUR', served_by_primary: true, served_by_colo: 'AMS', timings: { sql_duration_ms: 0.123 } } }) }) },
    SAGER: { get: async () => null },
    MEDIA: { head: async () => null },
    VECTORS: { describe: async () => ({ vectorCount: 412, config: { dimensions: 1024 } }) },
    TING_ROOM: stub('CPH'), CHAIR_ROOM: stub('nope'),
    AI: {}, AI_GATEWAY_ID: ' tingsvad ', TAEL: {},
  };
  const d = await maalTopologi(env, 'CPH');
  assert.deepEqual(d.worker, { colo: 'CPH', navn: 'tingsvad-ting-ai' });
  assert.equal(d.d1.ok, true); assert.equal(d.d1.region, 'WEUR'); assert.equal(d.d1.primaer, true); assert.equal(d.d1.colo, 'AMS'); assert.equal(d.d1.sqlMs, 0.12);
  assert.equal(d.kv.ok, true); assert.equal(d.r2.ok, true);
  assert.equal(d.vectorize.vektorer, 412); assert.equal(d.vectorize.dimensioner, 1024);
  assert.equal(d.durableObjects.tingmoedet.colo, 'CPH');
  assert.equal(d.durableObjects.stolen.colo, null, 'ugyldig kode bliver til null');
  assert.equal(d.tjenester.workersAi, true); assert.equal(d.tjenester.aiGateway, true); assert.equal(d.tjenester.browser, false);

  const tom = await maalTopologi({}, 'xx');
  assert.equal(tom.worker.colo, null);
  for (const k of ['d1', 'kv', 'r2', 'vectorize']) assert.deepEqual(tom[k], { ok: false, konfigureret: false });
});
