// Hash og HMAC uden eksterne afhængigheder.
const enc = new TextEncoder();
export async function sha256Hex(s) { const b = await crypto.subtle.digest('SHA-256', enc.encode(s)); return hex(new Uint8Array(b)); }
export const hex = u8 => [...u8].map(x => x.toString(16).padStart(2, '0')).join('');
export function randomId(n = 16) { const u = new Uint8Array(n); crypto.getRandomValues(u); return hex(u); }
export function b64url(u8) { let s = ''; u8.forEach(b => s += String.fromCharCode(b)); return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); }
export async function hmacHex(secret, data) {
  const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return hex(new Uint8Array(await crypto.subtle.sign('HMAC', key, enc.encode(data))));
}
export function timingSafeEqual(a, b) { if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length) return false; let r = 0; for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i); return r === 0; }
