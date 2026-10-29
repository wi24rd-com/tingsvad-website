// Besøgende i dag: unikke IP-hashes pr. dag i KV (udløber efter 2 døgn). Ingen cookies, intet gemmes om personen.
const json = (d, s = 200) => new Response(JSON.stringify(d), { status: s, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' } });
// Dagen følger Europe/Copenhagen ligesom resten af universet (avis, radio, tællere).
const dagKey = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Copenhagen', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
async function hash(s) { const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s)); return [...new Uint8Array(b)].slice(0, 8).map(x => x.toString(16).padStart(2, '0')).join(''); }
export async function onRequestPost({ request, env }) {
  if (!env.SAGER) return json({ n: 1 });
  const dag = dagKey();
  const ip = request.headers.get('cf-connecting-ip') || 'x';
  const h = await hash(dag + ip + (request.headers.get('user-agent') || ''));
  const set = (await env.SAGER.get('besoeg:' + dag, 'json')) || [];
  if (!set.includes(h)) { set.push(h); await env.SAGER.put('besoeg:' + dag, JSON.stringify(set.slice(-5000)), { expirationTtl: 172800 }); }
  return json({ n: set.length, dag });
}
export async function onRequestGet({ env }) {
  if (!env.SAGER) return json({ n: 0 });
  const dag = dagKey();
  const set = (await env.SAGER.get('besoeg:' + dag, 'json')) || [];
  return json({ n: set.length, dag });
}
