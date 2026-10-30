// Gæstebogen for tingsvad.dk (site-Workeren).
// GET  /api/sager  → { ok, data: { sager } } – de seneste 50 sager, nyeste først, grundsagerne til sidst
// POST /api/sager  → { navn, sag, hp, turnstile } → { ok, data: { nr, navn, sag, dato } }
// Runde 13 (AP7): listen og sagsnumrene bor i D1 hos ting-ai (atomisk INSERT … RETURNING), nået gennem service bindingen.
// Her bor det, der hører til gæsten: honeypot, Turnstile, validering og én sag pr. IP pr. 2 minutter (KV SAGER).
import { ren } from '../../shared/gaestebog.js';
import { fail } from '../../shared/svar.js';
import { internSvar } from '../_lib/ting.js';

const MAX = 50;
const sprog = request => ((request.headers.get('accept-language') || '').startsWith('en') ? 'en' : 'da');

export async function onRequestGet({ request, env }) {
  return internSvar(env, 'gaestebog?max=' + MAX, {}, sprog(request));
}

export async function onRequestPost({ request, env }) {
  const lang = sprog(request);
  let body;
  try { body = await request.json(); } catch { return fail('bad_request', lang === 'en' ? 'The thing could not read the submission.' : 'Tinget kunne ikke læse indsendelsen.', 400); }
  if (!body || typeof body !== 'object') return fail('bad_request', 'json', 400);
  if (body.hp) return Response.json({ ok: true, source: 'server', requestId: 'hp', data: { nr: '980-0000' } }); // honeypot: lad botten tro den vandt
  // Turnstile (når TURNSTILE_SECRET er sat som secret på site-Workeren og dens previews): tokenet valideres mod siteverify; tokens er engangs.
  if (!env.TURNSTILE_SECRET && (env.MILJOE || 'production') === 'production') return fail('not_configured', lang === 'en' ? 'The guestbook is closed: no Turnstile.' : 'Gæstebogen er lukket: ingen Turnstile.', 503); // runde 13: ingen gæstebog uden Turnstile i produktion
  if (env.TURNSTILE_SECRET) {
    const token = typeof body.turnstile === 'string' ? body.turnstile.slice(0, 2048) : '';
    let ok = false;
    try {
      const r = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ secret: env.TURNSTILE_SECRET, response: token, remoteip: request.headers.get('cf-connecting-ip') || '' }) });
      const v = r.ok ? await r.json() : null;
      const hosts = new Set(String(env.TURNSTILE_HOSTNAMES || 'tingsvad.dk,www.tingsvad.dk').split(',').map(s => s.trim()).filter(Boolean)); // runde 13 (M3): eksakt liste; previews sætter deres egen
      ok = !!(v && v.success && v.action === 'gaestebog' && hosts.has(v.hostname || ''));
    } catch (e) { ok = false; }
    if (!ok) return fail('turnstile', lang === 'en' ? 'The gate did not open. Try again.' : 'Lågen gik ikke op. Prøv igen.', 403);
  }

  // Parentesen er nødvendig: uden den blev »navn || sprog ? A : B« læst som »(navn || sprog) ? A : B«, og alle hed »Unknown party«.
  const navn = ren(body.navn).slice(0, 60) || (lang === 'en' ? 'Unknown party' : 'Ukendt part');
  const sag = ren(body.sag).slice(0, 400);
  if (sag.length < 4) return fail('too_short', lang === 'en' ? 'Too short. Say at least four characters.' : 'For kort. Sig mindst fire tegn.', 400);

  // Simpel takt: én sag pr. IP pr. 2 minutter (KV, udløber selv)
  if (env.SAGER) {
    const noegle = 'rl:' + (request.headers.get('cf-connecting-ip') || 'x');
    if (await env.SAGER.get(noegle)) return fail('rate_limited', lang === 'en' ? 'The thing hears one case at a time. Wait two minutes.' : 'Tinget hører én sag ad gangen. Vent to minutter.', 429, { retryAfter: 120 });
    await env.SAGER.put(noegle, '1', { expirationTtl: 120 });
  }
  return internSvar(env, 'gaestebog', { method: 'POST', json: { navn, sag } }, lang);
}
