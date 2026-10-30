// Site-Workeren `tingsvad-site` (runde 11): tingsvad.dk som én Worker med Static Assets i stedet for Cloudflare Pages.
// Router uden afhængigheder, der dækker alt det, Pages Functions gjorde (functions/), og genbruger de samme moduler:
//   – side-middlewaren (functions/_lib/side.js) omkring alt: partials, brødkrummer, Markdown, fejltavlen, tælleværket,
//   – /admin/* bag Access-tjekket (functions/_lib/admin.js),
//   – /api/{afgoer,besoeg,kant,sager,turnstile}, /api/ting-ai/* (proxy via service binding TING_AI) og /sag/:nr.
// Hvad der ikke matcher en håndtering, hentes fra de statiske filer via env.ASSETS (html_handling + 404.html som på Pages).
// Kun stier i run_worker_first (site-worker/wrangler.toml) når hertil; /assets/* m.fl. serveres direkte og gratis.
import { sideMiddleware } from '../functions/_lib/side.js';
import { adminVagt } from '../functions/_lib/admin.js';
import { SIKKERHED } from '../functions/_lib/headers.js';
import * as afgoer from '../functions/api/afgoer.js';
import * as besoeg from '../functions/api/besoeg.js';
import * as kant from '../functions/api/kant.js';
import * as sager from '../functions/api/sager.js';
import * as turnstile from '../functions/api/turnstile.js';
import * as tingAi from '../functions/api/ting-ai/[[path]].js';
import * as adminRavnepost from '../functions/admin/api/ravnepost.js';
import * as adminAviser from '../functions/admin/api/aviser.js';
import * as adminSager from '../functions/admin/api/sager.js';
import * as sag from '../functions/sag/[nr].js';

// _redirects gælder kun svar fra de statiske filer, ikke svar fra Worker-koden; de fire protokol-adresser står derfor også her.
// Fragmentet sendes med i Location, ligesom Pages gjorde.
export const OMDIRIGERINGER = {
  '/protokol/': '/arkivet/#protokol', '/protokol': '/arkivet/#protokol',
  '/en/protokol/': '/en/archive/#protokol', '/en/protokol': '/en/archive/#protokol',
  // Runde 13 (AP8): fire statistiksider blev til én med faner.
  '/maskinrummet/vaernet/': '/maskinrummet/tal/#vaernet', '/maskinrummet/crawlerne/': '/maskinrummet/tal/#crawlerne',
  '/maskinrummet/hastigheden/': '/maskinrummet/tal/#hastigheden', '/maskinrummet/danmark/': '/maskinrummet/tal/#danmark',
  '/en/machine-room/defences/': '/en/machine-room/numbers/#vaernet', '/en/machine-room/crawlers/': '/en/machine-room/numbers/#crawlerne',
  '/en/machine-room/speed/': '/en/machine-room/numbers/#hastigheden', '/en/machine-room/denmark/': '/en/machine-room/numbers/#danmark',
};

const API = { '/api/afgoer': afgoer, '/api/besoeg': besoeg, '/api/kant': kant, '/api/sager': sager, '/api/turnstile': turnstile };
const ADMIN_API = { '/admin/api/ravnepost': adminRavnepost, '/admin/api/sager': adminSager, '/admin/api/aviser': adminAviser };

/** Pages-semantik: onRequestGet/Post/… før onRequest; HEAD bruger GET-håndteringen. Ingen håndtering → null (videre til filerne). */
export function haandtering(mod, method) {
  const m = method === 'HEAD' ? 'Get' : method.charAt(0) + method.slice(1).toLowerCase();
  return mod['onRequest' + m] || mod.onRequest || null;
}

/** Finder modul + params for en sti, eller null. Afsluttende skråstreg accepteres som på Pages. */
export function find(sti) {
  const s = sti.length > 1 ? sti.replace(/\/$/, '') : sti;
  if (s === '/api/ting-ai' || s.startsWith('/api/ting-ai/')) return { mod: tingAi, params: { path: s.split('/').slice(3).filter(Boolean) } };
  if (API[s]) return { mod: API[s], params: {} };
  if (ADMIN_API[s]) return { mod: ADMIN_API[s], params: {}, admin: true };
  const m = /^\/sag\/([^/]+)$/.exec(s);
  if (m) { try { return { mod: sag, params: { nr: decodeURIComponent(m[1]) } }; } catch { return null; } }
  return null;
}

/** Statiske filer. html_handling svarer med 307 – Pages brugte 308 til de samme kanoniske omdirigeringer (/historien → /historien/). */
async function filer(env, request) {
  const r = await env.ASSETS.fetch(request);
  if (r.status === 307 && r.headers.has('location')) return new Response(null, { status: 308, headers: r.headers });
  const html = r.headers.get('content-type') === 'text/html';
  if (!html && r.status !== 404) return r;
  const x = new Response(r.body, r);
  // Workers' asset-server sender »text/html« uden charset; Pages sendte utf-8 (siderne har også <meta charset>).
  if (html) x.headers.set('content-type', 'text/html; charset=utf-8');
  // 404.html må ikke caches (Pages sendte no-store; Workers sender »max-age=0, must-revalidate«); side-middlewaren tegner den videre med det rigtige sprog.
  if (r.status === 404) x.headers.set('cache-control', 'no-store');
  return x;
}

export async function haandter(request, env, ectx = {}) {
  const url = new URL(request.url);
  const sti = url.pathname;
  const om = OMDIRIGERINGER[sti] || OMDIRIGERINGER[sti + '/']; // med og uden afsluttende skråstreg
  if ((request.method === 'GET' || request.method === 'HEAD') && om) {
    return new Response(null, { status: 301, headers: { ...SIKKERHED, location: om } });
  }
  const data = {};
  const waitUntil = p => (typeof ectx.waitUntil === 'function' ? ectx.waitUntil(p) : undefined);
  const hit = find(sti);
  const admin = sti === '/admin' || sti.startsWith('/admin/');

  // Det inderste lag: en Functions-håndtering, ellers de statiske filer.
  const indre = async () => {
    const h = hit && haandtering(hit.mod, request.method);
    if (h) return h({ request, env, params: hit.params, data, waitUntil, next: () => filer(env, request) });
    return filer(env, request);
  };
  // /admin/* (både admin-API og selve admin-siden) går gennem Access-tjekket, som på Pages (functions/admin/_middleware.js).
  const midt = admin ? () => adminVagt({ request, env, data, waitUntil, next: indre }) : indre;
  return sideMiddleware({ request, env, data, waitUntil, next: midt });
}

export default {
  fetch: (request, env, ectx) => haandter(request, env, ectx),
};
