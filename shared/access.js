// Cloudflare Access: verificerer den JWT, Access sætter på hver forespørgsel bag en Access-applikation
// (header Cf-Access-Jwt-Assertion, ellers cookien CF_Authorization). Bruges af /admin/* (Pages Functions) og af Workerens
// admin-ruter, så ingen kan nå admin-funktionerne uden om Access – heller ikke via previews eller den offentlige proxy.
// Kræver vars: ACCESS_TEAM_DOMAIN (fx »tingsvad.cloudflareaccess.com«), ACCESS_AUD (applikationens Audience-tag)
// og ADMIN_EMAILS (kommasepareret). Mangler én af dem, afvises alt.

let certCache = { team: '', at: 0, keys: [] };
const b64u = s => Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((s.length + 3) % 4)), c => c.charCodeAt(0));
const json = s => JSON.parse(new TextDecoder().decode(b64u(s)));

function tokenFra(request) {
  const h = request.headers.get('cf-access-jwt-assertion');
  if (h) return h;
  const m = (request.headers.get('cookie') || '').match(/(?:^|;\s*)CF_Authorization=([^;]+)/);
  return m ? m[1] : '';
}

async function noegler(team, hent = fetch, nu = Date.now()) {
  if (certCache.team === team && nu - certCache.at < 10 * 60_000 && certCache.keys.length) return certCache.keys;
  const r = await hent(`https://${team}/cdn-cgi/access/certs`);
  if (!r.ok) throw new Error('certs ' + r.status);
  const d = await r.json();
  certCache = { team, at: nu, keys: d.keys || [] };
  return certCache.keys;
}

/** Returnerer { email } for en gyldig admin, ellers null. hent og nu kan udskiftes i tests. */
export async function verificerAccess(request, env, { hent = fetch, nu = Date.now() } = {}) {
  const team = String(env.ACCESS_TEAM_DOMAIN || '').trim(), aud = String(env.ACCESS_AUD || '').trim();
  const admins = String(env.ADMIN_EMAILS || '').toLowerCase().split(',').map(s => s.trim()).filter(Boolean);
  if (!team || !aud || !admins.length) return null;
  const token = tokenFra(request);
  const dele = token.split('.');
  if (dele.length !== 3) return null;
  try {
    const hoved = json(dele[0]), krop = json(dele[1]);
    if (hoved.alg !== 'RS256') return null;
    const jwk = (await noegler(team, hent, nu)).find(k => k.kid === hoved.kid);
    if (!jwk) return null;
    const noegle = await crypto.subtle.importKey('jwk', jwk, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['verify']);
    const ok = await crypto.subtle.verify('RSASSA-PKCS1-v1_5', noegle, b64u(dele[2]), new TextEncoder().encode(dele[0] + '.' + dele[1]));
    if (!ok) return null;
    const auds = Array.isArray(krop.aud) ? krop.aud : [krop.aud];
    const sek = Math.floor(nu / 1000);
    if (!auds.includes(aud) || krop.iss !== `https://${team}` || !(krop.exp > sek) || (krop.nbf && krop.nbf > sek + 60)) return null;
    const email = String(krop.email || '').toLowerCase();
    if (!admins.includes(email)) return null;
    return { email };
  } catch (e) { return null; }
}

export const _nulstilCache = () => { certCache = { team: '', at: 0, keys: [] }; };
