import { test } from 'node:test';
import assert from 'node:assert/strict';
import { verificerAccess, _nulstilCache } from '../../shared/access.js';

const b64u = b => Buffer.from(b).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const TEAM = 'tingsvad.cloudflareaccess.com', AUD = 'aud-123';
const env = { ACCESS_TEAM_DOMAIN: TEAM, ACCESS_AUD: AUD, ADMIN_EMAILS: 'admin@example.dk' };

async function opsaet() {
  const par = await crypto.subtle.generateKey({ name: 'RSASSA-PKCS1-v1_5', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' }, true, ['sign', 'verify']);
  const jwk = { ...(await crypto.subtle.exportKey('jwk', par.publicKey)), kid: 'k1' };
  const hent = async () => new Response(JSON.stringify({ keys: [jwk] }));
  const signer = async (krop, hoved = { alg: 'RS256', kid: 'k1' }) => {
    const h = b64u(JSON.stringify(hoved)), p = b64u(JSON.stringify(krop));
    const sig = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', par.privateKey, new TextEncoder().encode(h + '.' + p));
    return h + '.' + p + '.' + b64u(new Uint8Array(sig));
  };
  return { hent, signer };
}
const req = (token, viaCookie) => new Request('https://tingsvad.dk/admin/', { headers: viaCookie ? { cookie: 'x=1; CF_Authorization=' + token } : { 'cf-access-jwt-assertion': token } });
const nu = Date.UTC(2026, 9, 27, 10);
const gyldig = { aud: [AUD], iss: 'https://' + TEAM, exp: nu / 1000 + 600, email: 'Admin@Example.dk' };

test('access: gyldigt token (header og cookie) giver admin', async () => {
  _nulstilCache(); const { hent, signer } = await opsaet(); const t = await signer(gyldig);
  assert.deepEqual(await verificerAccess(req(t), env, { hent, nu }), { email: 'admin@example.dk' });
  assert.deepEqual(await verificerAccess(req(t, true), env, { hent, nu }), { email: 'admin@example.dk' });
});

test('access: forkert aud, udløbet, fremmed e-mail, forkert udsteder, manipuleret eller manglende konfiguration afvises', async () => {
  _nulstilCache(); const { hent, signer } = await opsaet();
  for (const krop of [{ ...gyldig, aud: ['andet'] }, { ...gyldig, exp: nu / 1000 - 1 }, { ...gyldig, email: 'ukendt@example.dk' }, { ...gyldig, iss: 'https://ond.cloudflareaccess.com' }])
    assert.equal(await verificerAccess(req(await signer(krop)), env, { hent, nu }), null);
  const t = await signer(gyldig), [h, , s] = t.split('.');
  assert.equal(await verificerAccess(req(h + '.' + b64u(JSON.stringify({ ...gyldig, email: 'admin@example.dk', exp: 9e9 })) + '.' + s), env, { hent, nu }), null);
  assert.equal(await verificerAccess(req(await signer(gyldig, { alg: 'none', kid: 'k1' })), env, { hent, nu }), null);
  assert.equal(await verificerAccess(req(t), { ...env, ACCESS_AUD: '' }, { hent, nu }), null);
  assert.equal(await verificerAccess(req(''), env, { hent, nu }), null);
});
