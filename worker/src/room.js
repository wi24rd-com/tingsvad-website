// Durable Object for Den Store Afstemning (C02) med WebSocket Hibernation API.
// Tilstand persisteres i DO-storage og genopbygges efter hibernation; alarms styrer frist og oprydning. Intet setInterval.
import { DurableObject } from 'cloudflare:workers';
import { tael } from '../../shared/tael.js';
import { egetColo } from './features/topologi.js';
import * as L from './lib/roomlogic.js';
import { bumpEvent } from './features/news.js';
import { Dagbog } from './lib/dagbog.js';

export class TingRoom extends DurableObject {
  constructor(ctx, env) { super(ctx, env); this.ctx = ctx; this.env = env; this.st = null; this.dagbog = new Dagbog(ctx.storage); }
  /** Dagbogen (runde 12): stemmer og afsluttede runder som SQL i objektets eget SQLite-lager. */
  async dagbogStatistik() { return this.dagbog.statistik('stemme'); }
  async state() { if (!this.st) this.st = (await this.ctx.storage.get('state')) || L.freshState(1); return this.st; }
  async save() { await this.ctx.storage.put('state', this.st); const next = L.nextAlarm(this.st, Date.now()); if (next) await this.ctx.storage.setAlarm(next); }
  hasSocket(owner) { return this.ctx.getWebSockets().some(ws => { try { return ws.deserializeAttachment()?.owner === owner; } catch (e) { return false; } }); }

  /** Infrastrukturkortet (runde 12): hvilket datacenter bor objektet i? Svaret kommer fra Cloudflares trace for objektets eget udgående kald. */
  async topologi() { try { return await egetColo(); } catch (e) { return null; } }
  async fetch(request) {
    if (request.headers.get('upgrade') !== 'websocket') return new Response('expected websocket', { status: 426 });
    const owner = request.headers.get('x-owner') || '';
    if (!/^[a-f0-9]{32}$/.test(owner)) return new Response('no session', { status: 403 });
    if (this.ctx.getWebSockets().length >= 60) return new Response('room full', { status: 503 });
    const pair = new WebSocketPair(); const [client, server] = Object.values(pair);
    this.ctx.acceptWebSocket(server);
    server.serializeAttachment({ owner, lang: request.headers.get('x-lang') === 'en' ? 'en' : 'da' });
    return new Response(null, { status: 101, webSocket: client });
  }
  async webSocketMessage(ws, raw) {
    let m; try { m = JSON.parse(typeof raw === 'string' ? raw : new TextDecoder().decode(raw)); } catch (e) { return this.send(ws, { type: 'error', code: 'bad_json' }); }
    const { owner } = ws.deserializeAttachment() || {}; if (!owner) return;
    const st = await this.state(); const now = Date.now();
    const ev = L.tick(st, now, o => this.hasSocket(o)); L.seen(st, owner, now);
    if (m.type === 'hello') { await this.save(); return this.broadcast(); } // ny forbindelse: alle får nyt forbindelsestal
    if (m.type === 'join') { const r = L.join(st, owner, m.slot | 0, now, (+this.env.ROUND_SECONDS || 30) * 1000); if (!r.ok) this.send(ws, { type: 'error', code: r.code, full: !!r.full }); }
    else if (m.type === 'vote') { const r = L.vote(st, owner, String(m.vote || ''), now); if (!r.ok) this.send(ws, { type: 'error', code: r.code }); else { this.dagbog.skriv('stemme', String(m.vote || '')); tael(this.env, 'haendelse', 'stemme-afgivet'); } }
    else if (m.type === 'leave') { L.leave(st, owner); }
    else return this.send(ws, { type: 'error', code: 'unknown_type' });
    await this.save(); this.broadcast();
  }
  async webSocketClose(ws, code, reason, wasClean) { try { ws.close(code, reason); } catch (e) { } await this.afterLeave(ws); }
  async webSocketError(ws) { await this.afterLeave(ws); }
  async afterLeave(ws) {
    const st = await this.state(); L.tick(st, Date.now(), o => this.hasSocket(o)); await this.save(); this.broadcast();
  }
  async alarm() {
    const st = await this.state(); const now = Date.now();
    const ev = L.tick(st, now, o => this.hasSocket(o));
    if (ev.includes('closed')) this.dagbog.skriv('runde');
    if (ev.includes('closed') && this.env.DB) { try { await bumpEvent(this.env.DB, 'vote_round_closed'); } catch (e) { } }
    await this.save(); this.broadcast();
  }
  /** MCP (runde 10, 4a): en agent uden WebSocket sætter sig på første ledige plads og stemmer straks. Én stemme pr. ejer pr. runde. */
  async mcpStem(owner, v) {
    if (!/^[a-f0-9]{32}$/.test(owner || '')) return { ok: false, code: 'no_session' };
    const st = await this.state(); const now = Date.now();
    L.tick(st, now, o => this.hasSocket(o));
    let slot = L.seatOf(st, owner);
    if (!slot) {
      const fri = []; for (let i = 1; i <= L.SEATS; i++) if (!st.slots[i]) fri.push(i);
      if (!fri.length) return { ok: false, code: 'full', snapshot: L.snapshot(st, owner, now, this.ctx.getWebSockets().length) };
      const j = L.join(st, owner, fri[0], now, (+this.env.ROUND_SECONDS || 30) * 1000);
      if (!j.ok) return { ok: false, code: j.code };
      slot = j.slot;
    }
    const r = L.vote(st, owner, String(v || ''), now);
    if (r.ok) { this.dagbog.skriv('stemme', String(v || '')); tael(this.env, 'haendelse', 'stemme-afgivet'); }
    await this.save(); this.broadcast();
    return { ok: r.ok, code: r.code, slot, snapshot: L.snapshot(st, owner, now, this.ctx.getWebSockets().length) };
  }
  send(ws, obj) { try { ws.send(JSON.stringify(obj)); } catch (e) { } }
  broadcast() {
    const now = Date.now(), socks = this.ctx.getWebSockets(), n = socks.length;
    for (const ws of socks) { let owner = ''; try { owner = ws.deserializeAttachment()?.owner || ''; } catch (e) { } this.send(ws, L.snapshot(this.st, owner, now, n)); }
  }
}
