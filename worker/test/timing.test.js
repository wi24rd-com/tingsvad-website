import { test } from 'node:test';
import assert from 'node:assert/strict';
import { timer, instrument, medTiming } from '../src/lib/timing.js';

test('timing: D1 statements, batch with real statements, AI and untouched bindings', async () => {
  const seen = [];
  const stmt = sql => ({ sql, bind(...a) { return stmt(sql + ':' + a.join(',')); }, async first() { return { sql }; }, async run() { return { meta: { changes: 1 } }; } });
  const DB = { prepare: sql => stmt(sql), async batch(list) { seen.push(...list.map(x => Object.getPrototypeOf(x) === Object.prototype && typeof x.sql === 'string')); return list.map(() => ({})); } };
  const room = { idFromName: n => 'id-' + n };
  const t = timer(), env = instrument({ DB, AI: { async run() { return { response: 'ok' }; } }, TING_ROOM: room, TEXT_MODEL: 'm' }, t);
  assert.equal((await env.DB.prepare('SELECT 1').bind(2).first()).sql, 'SELECT 1:2');
  await env.DB.batch([env.DB.prepare('A').bind(1), env.DB.prepare('B')]);
  assert.deepEqual(seen, [true, true]); // batch fik de ægte statements, ikke proxies
  await env.AI.run('m', {});
  assert.equal(env.TING_ROOM, room); assert.equal(env.TEXT_MODEL, 'm');
  const h = t.header();
  assert.match(h, /d1;dur=[\d.]+;desc="2 calls"/);
  assert.match(h, /ai;dur=[\d.]+;desc="1 call"/);
  assert.match(h, /total;dur=/);
  const r = medTiming(new Response('{}', { headers: { 'content-type': 'application/json' } }), t);
  assert.match(r.headers.get('server-timing'), /^d1;/);
});
