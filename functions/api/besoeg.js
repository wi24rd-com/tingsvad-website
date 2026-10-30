// Besøgende i dag: ét hash pr. gæst pr. dag. Ingen cookies, intet gemmes om personen; hashen laves her af dag + IP og
// sendes til ting-ai, som holder dagens mængde i D1 (runde 13, AP7 – før KV read-modify-write). Rækker slettes efter to døgn.
import { ok, fail } from '../../shared/svar.js';
import { internJson, tilsluttet } from '../_lib/ting.js';

// Dagen følger Europe/Copenhagen ligesom resten af universet (avis, radio, tællere).
const dagKey = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Copenhagen', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
async function hash(s) { const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s)); return [...new Uint8Array(b)].slice(0, 8).map(x => x.toString(16).padStart(2, '0')).join(''); }

export async function onRequestPost({ request, env }) {
  if (!tilsluttet(env)) return fail('not_configured', 'Tælleren er ikke tilsluttet.', 503);
  const dag = dagKey();
  const h = await hash(dag + (request.headers.get('cf-connecting-ip') || 'x')); // runde 13 (L5): kun IP – ikke user-agent
  const d = await internJson(env, 'besoeg', { method: 'POST', json: { dag, h } });
  return ok({ n: (d && d.n) | 0, dag });
}
export async function onRequestGet({ env }) {
  if (!tilsluttet(env)) return fail('not_configured', 'Tælleren er ikke tilsluttet.', 503);
  const dag = dagKey();
  const d = await internJson(env, 'besoeg?dag=' + dag);
  return ok({ n: (d && d.n) | 0, dag });
}
