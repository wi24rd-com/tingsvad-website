import { test } from 'node:test';
import assert from 'node:assert/strict';
import { makeDb } from './d1mock.js';
import { adminAviser, getNewsArkiv } from '../src/features/news.js';
import { _nulstilCache } from '../../functions/_lib/access.js';
import { ApiError } from '../src/lib/http.js';

const b64u = b => Buffer.from(b).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const TEAM = 'tingsvad.cloudflareaccess.com', AUD = 'aud-123';
async function adminToken() {
  const par = await crypto.subtle.generateKey({ name: 'RSASSA-PKCS1-v1_5', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' }, true, ['sign', 'verify']);
  const jwk = { ...(await crypto.subtle.exportKey('jwk', par.publicKey)), kid: 'k1' };
  const h = b64u(JSON.stringify({ alg: 'RS256', kid: 'k1' })), p = b64u(JSON.stringify({ aud: [AUD], iss: 'https://' + TEAM, exp: Math.floor(Date.now() / 1000) + 600, email: 'admin@example.dk' }));
  const sig = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', par.privateKey, new TextEncoder().encode(h + '.' + p));
  return { token: h + '.' + p + '.' + b64u(new Uint8Array(sig)), certs: async () => new Response(JSON.stringify({ keys: [jwk] })) };
}
function lavDb() {
  const db = makeDb();
  const krop = t => JSON.stringify({ lead: { title: t, body: 'B'.repeat(60) }, notice: { title: 'N', body: 'N'.repeat(40) }, ad: { title: 'A', body: 'A'.repeat(30) } });
  return Promise.all([['2026-10-26', 'da', 'Anden'], ['2026-10-27', 'da', 'Tredje'], ['2026-10-27', 'en', 'Third']].map(([d, l, t]) =>
    db.prepare('INSERT INTO daily_editions (date_key, language, status, body_json, source, published_at) VALUES (?, ?, ?, ?, ?, ?)').bind(d, l, 'published', krop(t), 'ai', d + 'T05:00:00Z').run())).then(() => db);
}
const ctx = { log: () => { } };

test('avis-admin: uden Access-login afvises både liste og sletning', async () => {
  const env = { DB: await lavDb(), ACCESS_TEAM_DOMAIN: TEAM, ACCESS_AUD: AUD, ADMIN_EMAILS: 'admin@example.dk' };
  await assert.rejects(adminAviser(new Request('https://x/api/ting-ai/admin/aviser'), env, ctx, null), e => e instanceof ApiError && e.status === 403);
  await assert.rejects(adminAviser(new Request('https://x/api/ting-ai/admin/aviser', { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{"date":"2026-10-26","lang":"da","handling":"slet"}' }), env, ctx, null), e => e.status === 403);
});

test('avis-admin: administratoren ser alle udgaver og kan slette én; cachen ryddes, og arkivet viser den ikke mere', async () => {
  _nulstilCache(); const { token, certs } = await adminToken();
  const gl = globalThis.fetch; globalThis.fetch = certs;
  try {
    const env = { DB: await lavDb(), ACCESS_TEAM_DOMAIN: TEAM, ACCESS_AUD: AUD, ADMIN_EMAILS: 'admin@example.dk' };
    const h = { 'cf-access-jwt-assertion': token, 'content-type': 'application/json' };
    const liste = await (await adminAviser(new Request('https://x/api/ting-ai/admin/aviser', { headers: h }), env, ctx, null)).json();
    assert.equal(liste.data.udgaver.length, 3); assert.equal(liste.data.admin, 'admin@example.dk');
    let ryddet = null; const rå = { cache: { invalidate: async o => { ryddet = o.tags; } } };
    const svar = await (await adminAviser(new Request('https://x/api/ting-ai/admin/aviser', { method: 'POST', headers: h, body: JSON.stringify({ date: '2026-10-26', lang: 'da', handling: 'slet' }) }), env, ctx, rå)).json();
    assert.equal(svar.ok, true); assert.deepEqual(ryddet, ['avis-da']);
    const arkiv = await (await getNewsArkiv(new Request('https://x/api/ting-ai/news/arkiv?lang=da'), env, {})).json();
    assert.deepEqual(arkiv.data.udgaver.map(u => u.date), ['2026-10-27']);
    await assert.rejects(adminAviser(new Request('https://x/api/ting-ai/admin/aviser', { method: 'POST', headers: h, body: JSON.stringify({ date: '2026-10-26', lang: 'da', handling: 'slet' }) }), env, ctx, rå), e => e.status === 404);
    await assert.rejects(adminAviser(new Request('https://x/api/ting-ai/admin/aviser', { method: 'POST', headers: h, body: JSON.stringify({ date: '26/10', lang: 'da', handling: 'slet' }) }), env, ctx, rå), e => e.status === 400);
  } finally { globalThis.fetch = gl; }
});
