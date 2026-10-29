// Kvantesikkert bevis for fremmøde (runde 12). Runeværkstedets bevis signeres af Workeren med ML-DSA-65 (FIPS 204),
// som Workers' Web Crypto har med flaget `webcrypto_modern_algorithms`. Signaturen holder også mod en fremtidig
// kvantecomputer. Sagen om koen gør ikke.
//   POST bevis        {navn, nr, lang}  → {payload, sig, alg, kid}
//   POST bevis/tjek   {payload, sig}    → {gyldig, alg, kid}
//   GET  bevis/noegle                   → den offentlige nøgle som JWK (kty "AKP"), så alle kan verificere selv
// Nøglen: Secrets Store (binding BEVIS_NOEGLE_STORE) eller Worker-secret BEVIS_NOEGLE med en privat JWK. Findes ingen,
// laves et nøglepar første gang, og den private nøgle gemmes i Workers KV (SAGER). Hvor nøglen bor, står i nøgle-svaret.
import { ok, ApiError, readJson, langOf } from '../lib/http.js';
import { cphDateKey } from '../lib/dates.js';
import { sha256Hex, b64url } from '../lib/crypto.js';
import { hemmelighed } from '../lib/hemmelighed.js';
import { rateLimitEnv } from '../lib/quota.js';

export const ALG = 'ML-DSA-65';
const KV_NOEGLE = 'bevis:noegle:v1';
const enc = new TextEncoder();

export const bevisEnabled = env => !!(env.BEVIS_NOEGLE || env.BEVIS_NOEGLE_STORE || env.SAGER);

export function fraB64url(s) {
  s = String(s || '').replace(/-/g, '+').replace(/_/g, '/');
  if (!/^[A-Za-z0-9+/]*$/.test(s)) throw new ApiError('bad_request', 'bad signature encoding', 400);
  while (s.length % 4) s += '=';
  const b = atob(s), u = new Uint8Array(b.length);
  for (let i = 0; i < b.length; i++) u[i] = b.charCodeAt(i);
  return u;
}
/** Navnet, som det står på beviset: ingen styretegn eller vinkelparenteser, højst 40 tegn. */
export function renNavn(s) { return String(s == null ? '' : s).normalize('NFC').replace(/[\u0000-\u001f\u007f<>]/g, '').replace(/\s+/g, ' ').trim().slice(0, 40); }
/** Det, der signeres: faste felter i fast rækkefølge, så samme bevis altid giver samme bytes. Ren funktion (testes). */
export function kanonisk(p) {
  return JSON.stringify({ v: 1, type: 'tingsvad-fremmoede', nr: String(p.nr), navn: String(p.navn), dato: String(p.dato), status: 'udsat', lang: p.lang === 'en' ? 'en' : 'da' });
}
/** Et indsendt payload til verifikation: kun de kendte felter, korrekt form. */
export function tjekPayload(p) {
  if (!p || typeof p !== 'object') return null;
  const nr = String(p.nr || ''), navn = renNavn(p.navn), dato = String(p.dato || '');
  if (!/^980-\d{4}$/.test(nr) || !navn || navn !== p.navn || !/^\d{4}-\d{2}-\d{2}$/.test(dato)) return null;
  return { v: 1, nr, navn, dato, lang: p.lang === 'en' ? 'en' : 'da' };
}

let noegleCache = null; // pr. isolate: nøglen importeres én gang
async function noegler(env) {
  if (noegleCache) return noegleCache;
  let jwk = null, kilde = null;
  const h = await hemmelighed(env, 'BEVIS_NOEGLE');
  if (h.v) { try { const j = JSON.parse(h.v); if (j && j.kty === 'AKP' && j.priv) { jwk = j; kilde = h.kilde; } } catch (e) { } }
  if (!jwk && env.SAGER) { const v = await env.SAGER.get(KV_NOEGLE, 'json'); if (v && v.kty === 'AKP' && v.priv) { jwk = v; kilde = 'kv'; } }
  if (!jwk) {
    if (!env.SAGER) throw new ApiError('not_configured', 'no signing key', 503);
    const par = await crypto.subtle.generateKey({ name: ALG }, true, ['sign', 'verify']);
    jwk = JSON.parse(JSON.stringify(await crypto.subtle.exportKey('jwk', par.privateKey)));
    await env.SAGER.put(KV_NOEGLE, JSON.stringify(jwk));
    kilde = 'kv';
  }
  const priv = await crypto.subtle.importKey('jwk', { kty: 'AKP', alg: ALG, pub: jwk.pub, priv: jwk.priv }, { name: ALG }, false, ['sign']);
  const jwkPub = { kty: 'AKP', alg: ALG, pub: jwk.pub };
  const pub = await crypto.subtle.importKey('jwk', jwkPub, { name: ALG }, true, ['verify']);
  const kid = (await sha256Hex(jwk.pub)).slice(0, 16);
  noegleCache = { priv, pub, jwkPub: { ...jwkPub, kid, use: 'sig' }, kid, kilde };
  return noegleCache;
}

export async function signerBevis(request, env, c) {
  const body = await readJson(request, 2048);
  const lang = langOf(body.lang);
  await rateLimitEnv(env, 'bevis', c.session.ownerHash, 6, lang);
  const navn = renNavn(body.navn) || (lang === 'en' ? 'Unknown party' : 'Ukendt part');
  const nr = /^980-\d{4}$/.test(String(body.nr || '')) ? String(body.nr) : '980-' + String(1000 + Math.floor(Math.random() * 8999));
  const payload = { v: 1, nr, navn, dato: cphDateKey(), lang };
  const k = await noegler(env);
  const sig = new Uint8Array(await crypto.subtle.sign({ name: ALG }, k.priv, enc.encode(kanonisk(payload))));
  return ok({ payload, sig: b64url(sig), alg: ALG, kid: k.kid, bytes: sig.byteLength, noegle: '/api/ting-ai/bevis/noegle' }, 'server');
}

export async function tjekBevis(request, env, c) {
  const body = await readJson(request, 12288);
  const lang = langOf(body.lang || (body.payload && body.payload.lang));
  await rateLimitEnv(env, 'bevis-tjek', c.session.ownerHash, 20, lang);
  const p = tjekPayload(body.payload);
  const k = await noegler(env);
  if (!p) return ok({ gyldig: false, grund: 'form', alg: ALG, kid: k.kid }, 'server');
  let sig; try { sig = fraB64url(body.sig); } catch (e) { return ok({ gyldig: false, grund: 'form', alg: ALG, kid: k.kid }, 'server'); }
  if (sig.byteLength !== 3309) return ok({ gyldig: false, grund: 'form', alg: ALG, kid: k.kid }, 'server');
  const gyldig = await crypto.subtle.verify({ name: ALG }, k.pub, sig, enc.encode(kanonisk(p)));
  return ok({ gyldig, grund: gyldig ? null : 'signatur', alg: ALG, kid: k.kid }, 'server');
}

export async function bevisNoegle(request, env) {
  const k = await noegler(env);
  return ok({ alg: ALG, kid: k.kid, jwk: k.jwkPub, kilde: k.kilde, signeret: 'JSON.stringify({v:1,type:"tingsvad-fremmoede",nr,navn,dato,status:"udsat",lang})' }, 'server', 200, { 'cache-control': 'public, max-age=3600' });
}

