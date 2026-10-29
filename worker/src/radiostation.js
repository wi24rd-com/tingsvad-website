// Live-radio (runde 12): Tingsvad Radio sendes live gennem Cloudflare Realtime SFU.
// Én Durable Object (navn "en") ejer udsendelsen: den laver dagens engelske udsendelse som rå PCM (Aura-2, linear16,
// 48 kHz, mono) og gemmer den i R2. Når første lytter trykker, beder den SFU'en om en WebSocket-adapter (location
// "local"); SFU'en ringer tilbage til /api/ting-ai/radio/live/kilde?k=<engangsnøgle>, og objektet sender lyden i realtid
// som protobuf-pakker (stereo, 40 ms pr. besked). Alle lyttere abonnerer på samme spor over WebRTC og hører det samme
// sted i udsendelsen. Når den er slut, lukkes adapteren af en alarm.
import { DurableObject } from 'cloudflare:workers';
import { pakke, monoTilStereo, varighedMs, sfu, kunPcm, MONO_BYTES_PR_PAKKE, PAKKE_MS, RATE } from './lib/sfu.js';
import { hemmelighed } from './lib/hemmelighed.js';
import { randomId } from './lib/crypto.js';
import { withQuota } from './lib/quota.js';
import { gw, withTimeout, base64ToBytes } from './lib/ai.js';

export const SPOR = 'tingsvad-radio';

export class RadioStation extends DurableObject {
  constructor(ctx, env) { super(ctx, env); this.ctx = ctx; this.env = env; this.sender = null; }
  async tilstand() { return (await this.ctx.storage.get('udsendelse')) || null; }

  async status() {
    const u = await this.tilstand(), now = Date.now();
    if (!u || !u.sessionId || now > u.slut) return { aktiv: false, server: now };
    return { aktiv: true, sessionId: u.sessionId, trackName: SPOR, start: u.start, slut: u.slut, varighed: u.varighed, dato: u.dato, server: now };
  }

  async konfig() {
    const appId = (this.env.REALTIME_SFU_APP_ID || '').trim(), token = (await hemmelighed(this.env, 'REALTIME_SFU_TOKEN')).v;
    if (!appId || !token) throw new Error('sfu not configured');
    return { appId, token };
  }

  /** Starter dagens udsendelse, hvis der ikke allerede sendes. Returnerer status. */
  async start() {
    const now = Date.now(); let u = await this.tilstand();
    if (u && u.sessionId && now < u.slut - 3000) return this.status();
    if (u && u.adapterId) await this.luk(u).catch(() => { });
    const { appId, token } = await this.konfig();
    const pcm = await this.pcmFil();
    const varighed = varighedMs(pcm.bytes);
    u = { k: randomId(16), dato: pcm.dato, key: pcm.key, bytes: pcm.bytes, varighed, start: now, slut: now + varighed + 8000 };
    await this.ctx.storage.put('udsendelse', u); // nøglen skal findes, før SFU'en ringer tilbage
    const kilde = (this.env.SITE_ORIGIN || 'https://tingsvad.dk').replace(/^http/, 'ws') + '/api/ting-ai/radio/live/kilde?k=' + u.k;
    const r = await sfu(appId, token, 'POST', '/adapters/websocket/new', { tracks: [{ location: 'local', trackName: SPOR, endpoint: kilde, inputCodec: 'pcm' }] });
    const t = (r.tracks || [])[0] || {};
    if (!t.adapterId || !t.sessionId) { await this.ctx.storage.delete('udsendelse'); throw new Error('sfu adapter ' + (t.errorCode || 'missing')); }
    u = { ...(await this.tilstand()), adapterId: t.adapterId, sessionId: t.sessionId };
    await this.ctx.storage.put('udsendelse', u);
    await this.ctx.storage.setAlarm(u.slut + 5000);
    return this.status();
  }

  /** Dagens udsendelse som rå PCM i R2 (laves én gang pr. manuskript). */
  async pcmFil() {
    const env = this.env;
    if (!env.DB || !env.MEDIA || !env.AI) throw new Error('radio not configured');
    const row = await env.DB.prepare("SELECT date_key, script, script_hash FROM radio_editions WHERE language = 'en' AND status IN ('audio', 'text') ORDER BY date_key DESC LIMIT 1").first();
    if (!row || !row.script) throw new Error('no script');
    const key = `radio-pcm/${row.date_key}/en/${row.script_hash || 'x'}-48k-mono.pcm`;
    const head = await env.MEDIA.head(key);
    if (head && head.size > 4800) return { key, bytes: head.size, dato: row.date_key };
    const out = await withQuota(env.DB, 'audio-live', row.date_key, 2, 'en', () => withTimeout(env.AI.run(env.TTS_MODEL, { text: row.script.slice(0, 2000), speaker: env.TTS_VOICE || 'luna', encoding: 'linear16', sample_rate: RATE, container: 'none' }, gw(env, { feature: 'tts-live' })), 60_000));
    let bytes = out instanceof ReadableStream ? new Uint8Array(await new Response(out).arrayBuffer()) : out && out.audio ? base64ToBytes(out.audio) : null;
    if (!bytes || bytes.length < 4800) throw new Error('empty pcm');
    bytes = kunPcm(bytes); if (bytes.length % 2) bytes = bytes.subarray(0, bytes.length - 1);
    await env.MEDIA.put(key, bytes, { httpMetadata: { contentType: 'audio/L16; rate=48000; channels=1' } });
    return { key, bytes: bytes.length, dato: row.date_key };
  }

  /** SFU'en ringer tilbage hertil (via Workeren). Engangsnøglen i URL'en er godkendelsen; adapteren sender ingen headers. */
  async fetch(request) {
    if (request.headers.get('upgrade') !== 'websocket') return new Response('expected websocket', { status: 426 });
    const u = await this.tilstand(), k = new URL(request.url).searchParams.get('k') || '';
    if (!u || !u.k || k.length !== u.k.length || k !== u.k) return new Response('no', { status: 403 });
    const [client, server] = Object.values(new WebSocketPair());
    server.accept();
    this.send(server, u).catch(() => { try { server.close(1011, 'error'); } catch (e) { } });
    return new Response(null, { status: 101, webSocket: client });
  }

  /** Sender udsendelsen i realtid: ét sekund ad gangen fra R2, 40 ms pr. pakke, med ca. 300 ms forspring. */
  async send(ws, u) {
    if (this.sender) { try { this.sender.close(1000, 'replaced'); } catch (e) { } }
    this.sender = ws;
    const t0 = Date.now(); u = { ...u, start: t0, slut: t0 + u.varighed + 4000 };
    await this.ctx.storage.put('udsendelse', u);
    const BLOK = MONO_BYTES_PR_PAKKE * 25;
    let seq = 0, ts = 0, sendt = 0;
    for (let off = 0; off < u.bytes && this.sender === ws; off += BLOK) {
      const obj = await this.env.MEDIA.get(u.key, { range: { offset: off, length: Math.min(BLOK, u.bytes - off) } });
      if (!obj) break;
      const mono = new Uint8Array(await obj.arrayBuffer());
      for (let p = 0; p < mono.byteLength && this.sender === ws; p += MONO_BYTES_PR_PAKKE) {
        ws.send(pakke(seq++, ts, monoTilStereo(mono.subarray(p, p + MONO_BYTES_PR_PAKKE))));
        ts += RATE * PAKKE_MS / 1000; sendt += PAKKE_MS;
        const vent = t0 + sendt - 300 - Date.now();
        if (vent > 0) await new Promise(r => setTimeout(r, vent));
      }
    }
    if (this.sender === ws) { await new Promise(r => setTimeout(r, 1000)); try { ws.close(1000, 'end'); } catch (e) { } this.sender = null; }
  }

  async luk(u) {
    if (!u || !u.adapterId) return;
    const { appId, token } = await this.konfig();
    await sfu(appId, token, 'POST', '/adapters/websocket/close', { tracks: [{ adapterId: u.adapterId }] });
  }

  async alarm() {
    const u = await this.tilstand();
    if (!u) return;
    if (Date.now() < u.slut) { await this.ctx.storage.setAlarm(u.slut + 5000); return; }
    try { await this.luk(u); } catch (e) { }
    await this.ctx.storage.delete('udsendelse');
  }
}
