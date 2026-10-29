// Tæller for "Afgør sagen"-knappen. KV-nøgle: afgoer
const json = (d, s = 200) => new Response(JSON.stringify(d), { status: s, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' } });
const BASIS = 1284; // forsøg før nettet fik tæller
export async function onRequestGet({ env }) {
  if (!env.SAGER) return json({ n: BASIS });
  return json({ n: BASIS + ((await env.SAGER.get('afgoer', 'text')) | 0) });
}
export async function onRequestPost({ request, env }) {
  if (!env.SAGER) return json({ n: BASIS + 1 });
  const ip = request.headers.get('cf-connecting-ip') || 'x', k = 'rl-afg:' + ip;
  if (await env.SAGER.get(k)) return json({ n: BASIS + ((await env.SAGER.get('afgoer', 'text')) | 0) });
  await env.SAGER.put(k, '1', { expirationTtl: 5 });
  const n = ((await env.SAGER.get('afgoer', 'text')) | 0) + 1;
  await env.SAGER.put('afgoer', String(n));
  return json({ n: BASIS + n });
}
