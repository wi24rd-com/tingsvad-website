// Runde 10, trin 4a: tingets MCP-logik bag RPC-entrypointet TingMcp (kvoter, rate limits, skrivninger, fejl i tone).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { makeDb } from './d1mock.js';
import { TingMcpLogik, MCP_KVOTER } from '../src/features/mcp.js';
import * as L from '../src/lib/roomlogic.js';
import * as C from '../src/lib/chairlogic.js';

const K1 = 'a'.repeat(32), K2 = 'b'.repeat(32), K3 = 'c'.repeat(32), K4 = 'd'.repeat(32);
function kv() { const m = new Map(); return { m, get: async (k, type) => { const v = m.get(k); return v == null ? null : type === 'json' ? JSON.parse(v) : v; }, put: async (k, v) => { m.set(k, v); } }; }
/** Durable Objects som almindelige objekter med samme rene logik som de rigtige. */
function rum() {
  const st = L.freshState(1);
  return { st, mcpStem: async (owner, v) => { const now = Date.now(); let slot = L.seatOf(st, owner); if (!slot) { const fri = [1, 2, 3, 4, 5, 6, 7].filter(i => !st.slots[i]); if (!fri.length) return { ok: false, code: 'full' }; slot = L.join(st, owner, fri[0], now, 30000).slot; } const r = L.vote(st, owner, v, now); return { ok: r.ok, code: r.code, slot, snapshot: L.snapshot(st, owner, now, 0) }; } };
}
function stol() {
  const st = C.freshState(), rate = {};
  return { st, mcpFlyt: async (o, dx, dy) => { const r = C.move(st, rate, o, dx, dy, Date.now()); return { ok: r.ok, code: r.code, event: r.event || null, snapshot: C.snapshot(st, o, 0, Date.now()) }; }, mcpStatus: async () => C.snapshot(st, '', 0, Date.now()) };
}
const ns = obj => ({ idFromName: n => n, get: () => obj });
function env(extra = {}) {
  const r = rum(), s = stol();
  return { DB: makeDb(), SAGER: kv(), TING_ROOM: ns(r), CHAIR_ROOM: ns(s), _rum: r, _stol: s, ...extra };
}

test('every call needs a well-formed client id; nothing is thrown over RPC', async () => {
  const m = new TingMcpLogik(env());
  for (const k of ['', 'x', '1.2.3.4', 'A'.repeat(32)]) {
    const r = await m.status({ klient: k });
    assert.equal(r.ok, false); assert.equal(r.code, 'bad_request');
  }
});

test('status: canon age, the stool and the cow, without a revision table', async () => {
  const r = await new TingMcpLogik(env()).status({ klient: K1, lang: 'en' });
  assert.equal(r.ok, true);
  assert.equal(r.data.koen, 'Adjourned.');
  assert.ok(r.data.tingetsAlder >= 1046);
  assert.deepEqual([r.data.stolen.x, r.data.stolen.y], [C.START.x, C.START.y]);
  assert.equal(r.data.revision, null);
});

test('rejsSag: marked as MCP, one per client per 2 minutes, three per day for all agents', async () => {
  const e = env(), m = new TingMcpLogik(e);
  const a = await m.rejsSag({ klient: K1, navn: 'Claude', sag: 'Tinget bør afgøre sagen om koen.' });
  assert.equal(a.ok, true);
  assert.equal(a.data.sag.navn, 'Claude · MCP');
  assert.equal(a.data.sag.kilde, 'mcp');
  assert.equal(a.data.sag.nr, '980-0004');
  const igen = await m.rejsSag({ klient: K1, sag: 'En sag mere.' });
  assert.equal(igen.code, 'rate_limited');
  assert.equal((await m.rejsSag({ klient: K2, sag: 'Anden sag.' })).ok, true);
  assert.equal((await m.rejsSag({ klient: K3, sag: 'Tredje sag.' })).ok, true);
  const fjerde = await m.rejsSag({ klient: K4, sag: 'Fjerde sag.' });
  assert.equal(fjerde.code, 'quota'); assert.ok(fjerde.retryAfter > 0);
  assert.equal(JSON.parse(e.SAGER.m.get('liste')).length, MCP_KVOTER.sag);
  assert.equal((await m.rejsSag({ klient: K4, sag: 'x' })).code, 'bad_request');
});

test('stem: takes the first free seat and votes; one vote per client per round', async () => {
  const e = env(), m = new TingMcpLogik(e);
  const r = await m.stem({ klient: K1, stemme: 'eventuelt' });
  assert.equal(r.ok, true); assert.equal(r.data.plads, 1); assert.equal(r.data.stemmer.eventuelt, 1); assert.equal(r.data.fase, 'voting');
  const igen = await m.stem({ klient: K1, stemme: 'ja' });
  assert.equal(igen.ok, false); assert.equal(igen.code, 'conflict'); assert.match(igen.besked, /allerede/);
  assert.equal((await m.stem({ klient: K2, stemme: 'måske' })).code, 'bad_request');
});

test('flytStol: three steps east onto the loose stone, then the river stops a step north, in tone', async () => {
  const e = env(), m = new TingMcpLogik(e);
  const r = await m.flytStol({ klient: K1, retning: 'oest', skridt: 3, lang: 'da' });
  assert.equal(r.ok, true);
  assert.equal(r.data.flyttet, 3);
  assert.deepEqual([r.data.stolen.x, r.data.stolen.y], [5, 3]);
  assert.deepEqual(r.data.haendelser, ['wobble']);
  const aa = await m.flytStol({ klient: K2, retning: 'nord' });
  assert.equal(aa.ok, false); assert.equal(aa.code, 'conflict'); assert.match(aa.besked, /åen/);
  assert.equal((await m.flytStol({ klient: K2, retning: 'op' })).code, 'bad_request');
});

test('afgoer: always adjourned; counts once per client per minute on the same counter as the button', async () => {
  const e = env(), m = new TingMcpLogik(e);
  const a = await m.afgoer({ klient: K1 }), b = await m.afgoer({ klient: K1 }), c = await m.afgoer({ klient: K2, lang: 'en' });
  assert.equal(a.data.afgoerelse, 'Udsat.'); assert.equal(c.data.afgoerelse, 'Adjourned.');
  assert.equal(a.data.forsoeg, 1285); assert.equal(b.data.forsoeg, 1285); assert.equal(c.data.forsoeg, 1286);
  assert.equal(e.SAGER.m.get('afgoer'), '2');
});

test('missing bindings give not_configured, not a crash', async () => {
  const m = new TingMcpLogik({});
  assert.equal((await m.stem({ klient: K1, stemme: 'ja' })).code, 'not_configured');
  assert.equal((await m.hittegods({ klient: K1, q: 'sok' })).code, 'not_configured');
  assert.equal((await m.protokol({ klient: K1, q: 'koen' })).code, 'not_configured');
  assert.equal((await m.gaestebog({ klient: K1 })).code, 'not_configured');
});
