// Runde 12: Det europæiske arkivskab – måling og segl i lagre låst til EU.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { maalSkab, postSegl, euEnabled } from '../src/features/euskab.js';

function lavEnv({ medLagre = true } = {}) {
  const objekter = {};
  const stub = (jur, navn) => { const k = (jur || 'fri') + ':' + navn; objekter[k] = objekter[k] || { segl: 0 }; const o = objekter[k];
    return { status: async () => ({ jurisdiktion: jur, colo: jur ? 'FRA' : 'CPH', segl: o.segl, idag: o.segl }), segl: async () => { o.segl++; return { jurisdiktion: jur, colo: jur ? 'FRA' : 'CPH', segl: o.segl, idag: o.segl }; } }; };
  const EU_SKAB = { jurisdiction: j => ({ getByName: n => stub(j, n) }), getByName: n => stub(undefined, n) };
  const rows = [], kv = new Map(), r2 = new Map();
  const EU_DB = { prepare: sql => ({ bind: (...a) => ({ run: async () => { if (/INSERT/.test(sql)) rows.push(a); return { meta: { served_by_region: 'WEUR', served_by_primary: true } }; }, all: async () => ({ results: [{ n: rows.length, idag: rows.length }], meta: { served_by_region: 'WEUR', served_by_primary: true, served_by_colo: 'AMS' } }) }), run: async () => ({ meta: {} }) }) };
  const EU_KV = { get: async (k, t) => kv.has(k) ? JSON.parse(kv.get(k)) : null, put: async (k, v) => { kv.set(k, v); } };
  const EU_R2 = { get: async k => r2.has(k) ? { json: async () => JSON.parse(r2.get(k)) } : null, put: async (k, v) => { r2.set(k, v); } };
  return { env: medLagre ? { EU_SKAB, EU_DB, EU_KV, EU_R2, RL: { limit: async () => ({ success: true }) } } : { EU_SKAB, RL: { limit: async () => ({ success: true }) } }, rows, kv, r2 };
}

test('arkivskabet: måler alle lagre og skelner låst fra ulåst', async () => {
  const { env } = lavEnv();
  assert.equal(euEnabled(env), true); assert.equal(euEnabled({}), false);
  const m = await maalSkab(env, 'CPH');
  assert.equal(m.worker, 'CPH'); assert.equal(m.jurisdiktion, 'eu');
  assert.equal(m.lagre.do.jurisdiktion, 'eu'); assert.equal(m.lagre.do.colo, 'FRA');
  assert.equal(m.uden.do.jurisdiktion, undefined); assert.equal(m.uden.do.colo, 'CPH');
  assert.equal(m.lagre.d1.region, 'WEUR'); assert.equal(m.lagre.d1.colo, 'AMS');
  assert.ok(m.lagre.kv.ok && m.lagre.r2.ok);
});

test('arkivskabet: et segl lander i alle fire lagre og gemmer kun tid og datacenter', async () => {
  const { env, rows, kv, r2 } = lavEnv();
  const req = new Request('https://x/api/ting-ai/eu/segl?lang=da', { method: 'POST', headers: { 'x-tingsvad-colo': 'CPH' } });
  const j = await (await postSegl(req, env, { session: { ownerHash: 'h' }, log: () => { } })).json();
  assert.equal(j.data.gaest, 'CPH'); assert.ok(Number.isInteger(j.data.server) && j.data.server >= 0, 'workerens egen tid til rejsen'); assert.equal(j.data.lagre.do.segl, 1); assert.equal(j.data.uden.do.segl, 1);
  assert.equal(rows.length, 1); assert.equal(rows[0].length, 3, 'tid, dag, datacenter – intet andet');
  assert.deepEqual(Object.keys(JSON.parse(kv.get('seneste'))).sort(), ['colo', 't']);
  assert.equal([...r2.values()].map(v => JSON.parse(v).n)[0], 1);
});

test('arkivskabet: lagre, der ikke er oprettet endnu, står som ikke oprettet', async () => {
  const { env } = lavEnv({ medLagre: false });
  const m = await maalSkab(env, 'CPH');
  assert.equal(m.lagre.d1.oprettet, false); assert.equal(m.lagre.kv.oprettet, false); assert.equal(m.lagre.r2.oprettet, false);
  assert.ok(m.lagre.do.ok);
});
