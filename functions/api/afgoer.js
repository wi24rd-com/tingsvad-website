// Tæller for »Afgør sagen«-knappen. Runde 13 (AP7): tallet bor i D1 hos ting-ai (atomisk +1); KV holder kun takten pr. IP.
// GET → { ok, data: { n } } · POST → +1 (højst én pr. IP pr. minut) → { ok, data: { n } }
import { ok, fail } from '../../shared/svar.js';
import { internJson, tilsluttet } from '../_lib/ting.js';

const BASIS = 1284; // forsøg før nettet fik tæller
const svar = d => ok({ n: BASIS + ((d && d.n) | 0) });

export async function onRequestGet({ env }) {
  if (!tilsluttet(env)) return fail('not_configured', 'Tælleren er ikke tilsluttet.', 503);
  return svar(await internJson(env, 'taeller/afgoer'));
}
export async function onRequestPost({ request, env }) {
  if (!tilsluttet(env)) return fail('not_configured', 'Tælleren er ikke tilsluttet.', 503);
  if (env.SAGER) {
    const k = 'rl-afg:' + (request.headers.get('cf-connecting-ip') || 'x');
    if (await env.SAGER.get(k)) return svar(await internJson(env, 'taeller/afgoer'));
    await env.SAGER.put(k, '1', { expirationTtl: 60 }); // KV kræver mindst 60 s
  }
  return svar(await internJson(env, 'taeller/afgoer', { method: 'POST' }));
}
