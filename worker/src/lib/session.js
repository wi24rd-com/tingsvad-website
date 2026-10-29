// Session: en HttpOnly-cookie med et tilfældigt id, signeret med SESSION_SECRET.
// Bruges til rate limits, idempotency og ejerskab af retssalsrunder. En session er en deltager, ikke en person.
import { randomId, hmacHex, timingSafeEqual, sha256Hex } from './crypto.js';
const COOKIE = 'tv_sid';

export async function getSession(request, env) {
  const raw = parseCookie(request.headers.get('cookie') || '')[COOKIE];
  const secret = env.SESSION_SECRET || '';
  if (!secret && (env.MILJOE || 'production') === 'production') throw new Error('SESSION_SECRET missing'); // runde 13 (L1): aldrig usignerede sessioner i produktion
  let sid = null;
  if (raw) {
    const [id, sig] = raw.split('.');
    if (id && /^[a-f0-9]{32}$/.test(id)) {
      if (!secret) sid = id;
      else if (sig && timingSafeEqual(sig, (await hmacHex(secret, id)).slice(0, 32))) sid = id;
    }
  }
  let setCookie = null;
  if (!sid) {
    sid = randomId(16);
    const sig = secret ? (await hmacHex(secret, sid)).slice(0, 32) : 'x';
    const secure = new URL(request.url).protocol === 'https:' ? '; Secure' : '';
    setCookie = `${COOKIE}=${sid}.${sig}; Path=/api/ting-ai; HttpOnly; SameSite=Lax; Max-Age=2592000${secure}`;
  }
  const ip = request.headers.get('cf-connecting-ip') || '0';
  // Runde 13: IP-hashen saltes med SESSION_SECRET (HMAC), så den ikke kan brute-forces fra en KV/D1-dump; uden secret (lokalt) ren hash.
  const ipHash = (secret ? await hmacHex(secret, 'ip:' + ip) : await sha256Hex('ip:' + ip)).slice(0, 24);
  return { sid, ownerHash: (await sha256Hex('owner:' + sid)).slice(0, 32), ipHash, setCookie };
}
export function withCookie(response, session) {
  if (!session || !session.setCookie) return response;
  const r = new Response(response.body, response); r.headers.append('set-cookie', session.setCookie); return r;
}
function parseCookie(s) { const o = {}; s.split(';').forEach(p => { const i = p.indexOf('='); if (i > 0) o[p.slice(0, i).trim()] = p.slice(i + 1).trim(); }); return o; }

// Capability-token til sager: tilfældigt, uforudsigeligt; kun hash gemmes i D1.
export async function newCapability() { const token = randomId(24); return { token, tokenHash: await sha256Hex('cap:' + token) }; }
export async function capabilityHash(token) { return /^[a-f0-9]{48}$/.test(token || '') ? sha256Hex('cap:' + token) : null; }
