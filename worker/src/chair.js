// Den fælles stol (runde 9): Durable Object med WebSocket Hibernation. Én stol for hele internettet; serveren ejer positionen.
// Klienter sender {type:'move', dx, dy}; serveren validerer, rate-limiter pr. session og sender et snapshot til alle.
import { DurableObject } from 'cloudflare:workers';
import { tael } from './lib/tael.js';
import { egetColo } from './features/topologi.js';
import * as C from './lib/chairlogic.js';
import { Dagbog } from './lib/dagbog.js';

export class ChairRoom extends DurableObject {
  constructor(ctx, env) { super(ctx, env); this.ctx = ctx; this.env = env; this.st = null; this.rate = {}; this.dagbog = new Dagbog(ctx.storage); }
  /** Dagbogen (runde 12): stolens historik som SQL i objektets eget SQLite-lager. */
  async dagbogStatistik() { return this.dagbog.statistik('flyt'); }
  async state() { if (!this.st) this.st = (await this.ctx.storage.get('stol')) || C.freshState(); return this.st; }
  /** Infrastrukturkortet (runde 12): hvilket datacenter bor objektet i? Svaret kommer fra Cloudflares trace for objektets eget udgående kald. */
  async topologi() { try { return await egetColo(); } catch (e) { return null; } }
  async fetch(request) {
    if (request.headers.get('upgrade') !== 'websocket') return new Response('expected websocket', { status: 426 });
    const owner = request.headers.get('x-owner') || '';
    if (!/^[a-f0-9]{32}$/.test(owner)) return new Response('no session', { status: 403 });
    if (this.ctx.getWebSockets().length >= 100) return new Response('room full', { status: 503 });
    const [client, server] = Object.values(new WebSocketPair());
    this.ctx.acceptWebSocket(server);
    server.serializeAttachment({ owner });
    return new Response(null, { status: 101, webSocket: client });
  }
  async webSocketMessage(ws, raw) {
    let m; try { m = JSON.parse(typeof raw === 'string' ? raw : new TextDecoder().decode(raw)); } catch (e) { return this.send(ws, { type: 'error', code: 'bad_json' }); }
    const { owner } = ws.deserializeAttachment() || {}; if (!owner) return;
    const st = await this.state(), now = Date.now();
    if (m.type === 'hello') return await this.broadcast();
    if (m.type !== 'move') return this.send(ws, { type: 'error', code: 'unknown_type' });
    const r = C.move(st, this.rate, owner, m.dx, m.dy, now);
    if (!r.ok) { this.send(ws, { type: 'error', code: r.code }); return this.send(ws, C.snapshot(st, owner, this.ctx.getWebSockets().length, now)); }
    await this.ctx.storage.put('stol', st);
    this.dagbog.skriv('flyt', retning(m.dx, m.dy));
    tael(this.env, 'haendelse', 'stol-flyttet');
    await this.broadcast(r.event);
  }
  async webSocketClose(ws, code, reason) { try { ws.close(code, reason); } catch (e) { } await this.broadcast(); }
  async webSocketError() { await this.broadcast(); }
  /** MCP (runde 10, 4a): ét skridt uden WebSocket. Samme regler og rate limit som gæsterne. */
  async mcpFlyt(owner, dx, dy) {
    if (!/^[a-f0-9]{32}$/.test(owner || '')) return { ok: false, code: 'no_session' };
    const st = await this.state(), now = Date.now();
    const r = C.move(st, this.rate, owner, dx, dy, now);
    if (r.ok) { await this.ctx.storage.put('stol', st); this.dagbog.skriv('flyt', retning(dx, dy)); tael(this.env, 'haendelse', 'stol-flyttet'); await this.broadcast(r.event); }
    return { ok: r.ok, code: r.code, event: r.event || null, snapshot: C.snapshot(st, owner, this.ctx.getWebSockets().length, now) };
  }
  /** Læs stolens position (MCP-status). */
  async mcpStatus() { const st = await this.state(); return C.snapshot(st, '', this.ctx.getWebSockets().length, Date.now()); }
  send(ws, o) { try { ws.send(JSON.stringify(o)); } catch (e) { } }
  async broadcast(event) { // efter hibernation er this.st tom: hent altid tilstanden først
    const st = await this.state();
    const socks = this.ctx.getWebSockets(), n = socks.length, now = Date.now();
    for (const ws of socks) { let owner = ''; try { owner = ws.deserializeAttachment()?.owner || ''; } catch (e) { } const s = C.snapshot(st, owner, n, now); if (event) s.event = event; this.send(ws, s); }
  }
}

const retning = (dx, dy) => (Math.abs(+dx || 0) >= Math.abs(+dy || 0) ? ((+dx || 0) >= 0 ? 'øst' : 'vest') : ((+dy || 0) >= 0 ? 'syd' : 'nord'));
