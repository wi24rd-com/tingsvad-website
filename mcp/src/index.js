// tingsvad-mcp: tinget ved vadestedet som MCP-server på https://mcp.tingsvad.dk/mcp (Streamable HTTP, uden login).
// Agents SDK createMcpHandler (stateless: ét McpServer pr. request, ingen Durable Object). Logikken bag værktøjerne
// ligger i tingsvad-ting-ai og nås via service binding TING (entrypoint TingMcp). Rate limit pr. klient før alt andet.
import { createMcpHandler } from 'agents/mcp/server';
import { lavServer, klientId, cphDato, VERSION } from './tools.js';

const HSTS = { 'strict-transport-security': 'max-age=31536000' }; // runde 13 (L3)
const json = (d, s = 200, h = {}) => new Response(JSON.stringify(d), { status: s, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', ...HSTS, ...h } });

const FORSIDE = `<!doctype html><html lang="da"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Tinget som MCP-server</title>
<style>body{font:17px/1.55 system-ui,sans-serif;max-width:40rem;margin:3rem auto;padding:0 1rem;background:#14110d;color:#efe6d4}a{color:#d9a441}code{background:#2a241c;padding:.1em .35em;border-radius:4px}</style>
<h1>Tinget ved vadestedet · MCP</h1>
<p>Dette er en <a href="https://modelcontextprotocol.io/">MCP-server</a>. Forbind din AI-assistent til <code>https://mcp.tingsvad.dk/mcp</code>.</p>
<p>Vejledning, værktøjer og grænser: <a href="https://tingsvad.dk/maskinrummet/#mcp">maskinrummet</a> · <a href="https://tingsvad.dk/en/machine-room/#mcp">the machine room (English)</a>.</p>
<p>Sagen om koen er udsat.</p></html>`;

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (url.pathname === '/' && request.method === 'GET') return new Response(FORSIDE, { headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'public, max-age=3600', 'content-security-policy': "default-src 'none'; style-src 'unsafe-inline'", 'x-content-type-options': 'nosniff', ...HSTS } });
    if (url.pathname === '/health') return json({ ok: true, version: VERSION, ting: !!(env.TING && typeof env.TING.status === 'function') });
    if (url.pathname !== '/mcp') return json({ ok: false, code: 'not_found', message: 'MCP endpoint: /mcp' }, 404);

    const klient = await klientId(request.headers.get('cf-connecting-ip'), cphDato(), env.MCP_SALT || '');
    if (env.MCP_RL && typeof env.MCP_RL.limit === 'function') {
      const { success } = await env.MCP_RL.limit({ key: klient });
      if (!success) return json({ jsonrpc: '2.0', error: { code: -32000, message: 'Tinget hører ét argument ad gangen. Vent lidt. / One argument at a time.' }, id: null }, 429, { 'retry-after': '60' });
    }
    try {
      return await createMcpHandler(() => lavServer(env.TING, klient), { route: '/mcp', allowedHostnames: (env.MCP_HOSTNAMES || 'mcp.tingsvad.dk').split(',').map(s => s.trim()).filter(Boolean) })(request, env, ctx);
    } catch (e) {
      console.log(JSON.stringify({ mcp: 'handler_error', error: String(e && e.message).slice(0, 160) }));
      return json({ jsonrpc: '2.0', error: { code: -32603, message: 'Maskinen svarede ikke. / The machine did not answer.' }, id: null }, 503, { 'retry-after': '30' });
    }
  },
};
