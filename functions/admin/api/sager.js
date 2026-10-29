// Admin: gæstebogen. GET → alle sager (de faste grundsager kan ikke slettes og vises ikke her).
// DELETE ?nr=980-0004 → sagen fjernes fra listen; et kort spor (nr, dato, hvem) gemmes i KV-nøglen »slettet«, ikke selve teksten.
const json = (d, s = 200) => new Response(JSON.stringify(d), { status: s, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' } });

export async function onRequestGet({ env }) {
  if (!env.SAGER) return json({ ok: false, code: 'not_configured' }, 503);
  const liste = (await env.SAGER.get('liste', 'json')) || [];
  const slettet = (await env.SAGER.get('slettet', 'json')) || [];
  return json({ ok: true, data: { sager: liste, slettet: slettet.slice(0, 20) } });
}

export async function onRequestDelete({ request, env, data }) {
  if (!env.SAGER) return json({ ok: false, code: 'not_configured' }, 503);
  const nr = new URL(request.url).searchParams.get('nr') || '';
  if (!/^980-\d{4}$/.test(nr)) return json({ ok: false, code: 'bad_request', message: 'Ugyldigt sagsnummer.' }, 400);
  const liste = (await env.SAGER.get('liste', 'json')) || [];
  const rest = liste.filter(s => s.nr !== nr);
  if (rest.length === liste.length) return json({ ok: false, code: 'not_found', message: 'Sagen findes ikke (eller er en af de faste grundsager).' }, 404);
  const slettet = (await env.SAGER.get('slettet', 'json')) || [];
  slettet.unshift({ nr, slettet: new Date().toISOString(), af: data.admin.email });
  await Promise.all([env.SAGER.put('liste', JSON.stringify(rest)), env.SAGER.put('slettet', JSON.stringify(slettet.slice(0, 200)))]);
  return json({ ok: true, data: { nr, tilbage: rest.length } });
}
