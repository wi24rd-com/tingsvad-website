// Offentlig Turnstile-sitekey (ingen hemmelighed). Tom = Turnstile ikke sat op; formularerne virker da uden widget.
export async function onRequestGet({ env }) {
  return new Response(JSON.stringify({ sitekey: (env.TURNSTILE_SITEKEY || '').trim() || null }), { headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'public, max-age=300' } });
}
