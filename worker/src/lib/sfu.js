// Realtime SFU (runde 12): små, rene hjælpere til live-radioen.
// WebSocket-adapteren tager imod lyd som Protocol Buffers-pakker: message Packet { uint32 sequenceNumber = 1;
// uint32 timestamp = 2; bytes payload = 5; }. Payload er PCM: signed 16-bit little-endian, 48 kHz, stereo (L/R flettet).
// Hver WebSocket-besked skal holde sig under 32 KB inkl. protobuf-overhead.
export const RATE = 48000, KANALER = 2, BYTES_PR_SAMPLE = 2;
export const PAKKE_MS = 40;                                                        // 40 ms pr. besked
export const MONO_BYTES_PR_PAKKE = RATE * PAKKE_MS / 1000 * BYTES_PR_SAMPLE;        // 3.840 bytes mono → 7.680 bytes stereo
export const API = 'https://rtc.live.cloudflare.com/v1/apps/';

function varint(n, ud) { n = n >>> 0; while (n > 127) { ud.push((n & 127) | 128); n >>>= 7; } ud.push(n); }
/** Koder én Packet. Ren funktion (testes mod en håndkodet protobuf). */
export function pakke(seq, ts, payload) {
  const hoved = [];
  hoved.push(0x08); varint(seq, hoved);              // felt 1, varint
  hoved.push(0x10); varint(ts, hoved);               // felt 2, varint
  hoved.push(0x2a); varint(payload.byteLength, hoved); // felt 5, length-delimited
  const ud = new Uint8Array(hoved.length + payload.byteLength);
  ud.set(hoved, 0); ud.set(payload, hoved.length);
  return ud;
}
/** Mono 16-bit PCM → stereo (samme sample i begge kanaler). */
export function monoTilStereo(mono) {
  const n = mono.byteLength >> 1, ind = new DataView(mono.buffer, mono.byteOffset, n * 2);
  const ud = new Uint8Array(n * 4), dv = new DataView(ud.buffer);
  for (let i = 0; i < n; i++) { const s = ind.getInt16(i * 2, true); dv.setInt16(i * 4, s, true); dv.setInt16(i * 4 + 2, s, true); }
  return ud;
}
/** Fjerner en evt. WAV-header, så kun rå PCM er tilbage. Ren funktion (testes). */
export function kunPcm(u8) {
  if (u8.length > 44 && u8[0] === 0x52 && u8[1] === 0x49 && u8[2] === 0x46 && u8[3] === 0x46) { // "RIFF"
    for (let i = 12; i < Math.min(u8.length - 8, 4096); i++) if (u8[i] === 0x64 && u8[i + 1] === 0x61 && u8[i + 2] === 0x74 && u8[i + 3] === 0x61) return u8.subarray(i + 8); // "data"
  }
  return u8;
}
/** Varighed i ms for mono 16-bit PCM ved 48 kHz. */
export const varighedMs = monoBytes => Math.round(monoBytes / (RATE * BYTES_PR_SAMPLE) * 1000);

/** Et kald til Realtime SFU-API'et med app-hemmeligheden (kun på serveren). */
export async function sfu(appId, token, metode, sti, body) {
  const r = await fetch(API + encodeURIComponent(appId) + sti, {
    method: metode,
    headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  let j = null; try { j = await r.json(); } catch (e) { }
  if (!r.ok) { const e = new Error(`sfu ${metode} ${sti.replace(/[0-9a-f]{16,}/gi, '…')} → ${r.status}${j && j.errorCode ? ' ' + j.errorCode : ''}`); e.status = r.status; throw e; }
  return j || {};
}
export const gyldigSessionId = s => typeof s === 'string' && /^[A-Za-z0-9_-]{8,128}$/.test(s);
