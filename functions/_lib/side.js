// Tingets fælles side-middleware (runde 9–11): header/sidenav/footer via HTMLRewriter, brødkrummer, Markdown til agenter,
// fejltavlen og tælleværkets sidevisninger. Én implementering, én vært: site-Workeren (site-worker/index.js; til runde 13 også Pages Functions som tilbagefald
// i runde 11's overgangsuge) og site-Workeren med Static Assets (site-worker/index.js). Hver side har pladsholdere som
// <div data-tv-del="topbar"></div>; HTMLRewriter erstatter dem undervejs i streamen med /partials/<navn>.<sprog>.html, så
// navigationen findes ét sted. Sprogskifte-links udfyldes fra sidens egne <link rel="alternate" hreflang>, og den aktuelle side
// markeres med aria-current ud fra <body data-side>. /assets/* m.fl. går uden om (run_worker_first i site-worker/wrangler.toml).
import { SIKKERHED, MIKROFON, MIKROFON_POLITIK } from './headers.js';
import { naegl, htmlTilMarkdown } from './markdown.js';
import { struktureretFejl, noedside } from './fejl.js';
import { siteOrigin } from '../../shared/origin.js';
import { tael } from '../../shared/tael.js';

const DELE = ['topbar', 'sidenav', 'footer'];
const cache = new Map(); // pr. isolat; et nyt deploy giver nye isolater

// Brødkrummer (runde 10): ud fra sidekortet i assets/kanon.json (sider.*.da/en/navn). Kun på undersider under en
// hovedside (fx /oplevelser/runevaerkstedet/), så man altid kan gå ét eller to trin tilbage.
async function hentKanon(env, origin) {
  if (cache.has('kanon')) return cache.get('kanon');
  let k = null;
  try { const r = await env.ASSETS.fetch(new URL('/assets/kanon.json', origin)); if (r.ok) k = await r.json(); } catch {}
  if (k) cache.set('kanon', k);
  return k;
}
const escH = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
export function kaede(sider, sti, lang, min = 2) {
  const liste = Object.values(sider || {}).filter(v => v && v[lang] && v.navn);
  const her = liste.find(v => v[lang] === sti);
  if (!her) return [];
  const forfaedre = liste.filter(v => v[lang] !== sti && sti.startsWith(v[lang])).sort((a, b) => a[lang].length - b[lang].length);
  return forfaedre.length >= min ? [...forfaedre, her].map(v => ({ sti: v[lang], navn: v.navn[lang] })) : [];
}
function kruemmeHtml(k, lang) {
  const li = k.map((x, i) => i === k.length - 1 ? `<li aria-current="page">${escH(x.navn)}</li>` : `<li><a href="${escH(x.sti)}">${escH(x.navn)}</a></li>`).join('');
  return `<nav class="brodkrummer" aria-label="${lang === 'en' ? 'Breadcrumbs' : 'Brødkrummer'}"><ol>${li}</ol></nav>`;
}
function kruemmeLd(k, origin) {
  const ld = { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: k.map((x, i) => ({ '@type': 'ListItem', position: i + 1, name: x.navn, item: origin + x.sti })) };
  return `<script type="application/ld+json">${JSON.stringify(ld).replace(/</g, '\\u003c')}</script>`;
}

async function hentDel(env, origin, navn, lang) {
  const key = navn + '.' + lang;
  if (cache.has(key)) return cache.get(key);
  let r = await env.ASSETS.fetch(new URL(`/partials/${key}`, origin));
  if (r.status >= 300 && r.status < 400 && r.headers.get('location')) r = await env.ASSETS.fetch(new URL(r.headers.get('location'), origin));
  const txt = r.ok ? (await r.text()).replace(/^<!--.*?-->\s*/s, '') : '';
  if (txt) cache.set(key, txt);
  return txt;
}

const sprogAf = sti => (sti === '/en' || sti.startsWith('/en/') ? 'en' : 'da');
// Sidenøgle til tælleværket: kun kendte sider, så tilfældige stier ikke bliver til rækker (404'er tælles samlet).
const sideNoegle = sti => (/^\/sag\/[0-9-]+\/?$/.test(sti) ? '/sag/*' : sti.slice(0, 64));
const coloAf = request => (request.cf && /^[A-Z]{3}$/.test(request.cf.colo || '') ? request.cf.colo : '');
const mdHeaders = (h, tokens) => { h.set('content-type', 'text/markdown; charset=utf-8'); h.set('x-markdown-tokens', String(tokens)); h.set('vary', 'Accept'); h.delete('content-length'); h.delete('content-encoding'); h.delete('etag'); return h; };

/** /<sti>/index.md → sidens HTML hentet fra de statiske filer og konverteret. Admin er udelukket. */
async function mdFil(ctx, url) {
  const { request, env } = ctx;
  const sti = url.pathname.slice(0, -'index.md'.length) || '/';
  if (sti.startsWith('/admin') || sti.startsWith('/api/') || sti.startsWith('/partials/')) return struktureretFejl(new Request(request.url, { headers: { accept: 'text/markdown' } }), 404, {}, env);
  const r = await env.ASSETS.fetch(new Request(new URL(sti, url.origin), { headers: { accept: 'text/html' } }));
  if (!r.ok || !(r.headers.get('content-type') || '').includes('text/html')) return struktureretFejl(new Request(request.url, { headers: { accept: 'text/markdown' } }), 404, {}, env);
  const { markdown, tokens, meta } = htmlTilMarkdown(await r.text(), url.origin + sti);
  tael(env, 'md', sideNoegle(sti), { lang: sprogAf(sti), colo: coloAf(request) });
  const h = mdHeaders(new Headers(SIKKERHED), tokens);
  h.set('cache-control', 'public, max-age=300'); h.set('link', `<${meta.url || url.origin + sti}>; rel="canonical"`);
  return new Response(request.method === 'HEAD' ? null : markdown, { status: 200, headers: h });
}

/** ctx = { request, env, next } – site-Workerens ctx (site-worker/index.js), samme form som Pages Functions' i sin tid. */
export async function sideMiddleware(ctx) {
  const { request, env } = ctx;
  const url0 = new URL(request.url);
  if ((request.method === 'GET' || request.method === 'HEAD') && url0.pathname.endsWith('/index.md') && env.ASSETS) return mdFil(ctx, url0);
  let res;
  try { res = await ctx.next(); }
  catch (e) { // noget under middlewaren faldt: aldrig en tom 500, altid tingets fejltavle
    return struktureretFejl(request, 503, {}, env) || new Response(noedside(503, sprogAf(url0.pathname)), { status: 503, headers: { ...SIKKERHED, 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store', 'retry-after': '30', vary: 'Accept' } });
  }
  const type = res.headers.get('content-type') || '';
  if (request.method !== 'GET' || !type.includes('text/html')) return res;

  // Fejl (404 fra de statiske filer, 5xx): struktureret svar til maskiner; HTML-404'en tegnes videre herunder.
  if (res.status === 404 || res.status >= 500) {
    const s = struktureretFejl(request, res.status >= 500 ? 503 : 404, {}, env);
    if (s) { tael(env, 'fejl', String(res.status), { lang: sprogAf(url0.pathname), colo: coloAf(request), detalje: 'struktureret' }); return s; }
  }

  const headers = new Headers(res.headers);
  for (const [k, v] of Object.entries(SIKKERHED)) if (!headers.has(k)) headers.set(k, v);
  if (MIKROFON.test(url0.pathname)) headers.set('Permissions-Policy', MIKROFON_POLITIK); // Tal din sag: kun retssalen må bede om mikrofonen
  if (!headers.has('Cache-Control')) headers.set('Cache-Control', 'public, max-age=0, must-revalidate');
  headers.set('Vary', 'Accept'); // samme URL giver HTML eller Markdown efter Accept
  const fejlside = res.status === 404;
  if (!res.body || (res.status !== 200 && !fejlside)) return new Response(res.body, { status: res.status, statusText: res.statusText, headers });

  // Markdown til agenter: kun når klienten udtrykkeligt foretrækker det (browsere sender aldrig text/markdown).
  if (!fejlside && naegl(request.headers.get('accept')) === 'text/markdown') {
    const { markdown, tokens } = htmlTilMarkdown(await res.text(), url0.origin + url0.pathname);
    tael(env, 'md', sideNoegle(url0.pathname), { lang: sprogAf(url0.pathname), colo: coloAf(request) });
    return new Response(markdown, { status: 200, headers: mdHeaders(headers, tokens) });
  }
  if (!request.headers.has('x-tingsvad-hent')) tael(env, fejlside ? 'fejl' : 'side', fejlside ? '404' : sideNoegle(url0.pathname), { lang: sprogAf(url0.pathname), colo: coloAf(request), detalje: fejlside ? 'html' : '' });
  const harMd = !fejlside && url0.pathname.endsWith('/') && !url0.pathname.startsWith('/admin'); // statiske sider har en /index.md-tvilling
  if (harMd) headers.append('Link', `<${url0.pathname}index.md>; rel="alternate"; type="text/markdown"`);
  if (!fejlside) headers.append('Link', '</.well-known/api-catalog>; rel="api-catalog"'); // RFC 9727: API-kataloget for agenter (runde 12)

  const url = new URL(request.url);
  const lang = url.pathname === '/en' || url.pathname.startsWith('/en/') ? 'en' : 'da';
  const [dele, kanon] = await Promise.all([
    Promise.all(DELE.map(async n => [n, await hentDel(env, url.origin, n, lang)])).then(Object.fromEntries),
    hentKanon(env, url.origin),
  ]);
  const krummer = kanon ? kaede(kanon.sider, url.pathname, lang) : [];
  // Til søgemaskiner (runde 12): BreadcrumbList allerede fra første niveau (Vadestedet › Historien), også hvor siden ikke viser den gamle krumme
  const krummerLd = kanon ? kaede(kanon.sider, url.pathname, lang, 1) : [];
  const alt = { da: '/', en: '/en/' };
  let side = '';

  const rw = new HTMLRewriter()
    .on('link[rel="alternate"][hreflang]', { element(el) { const h = el.getAttribute('hreflang'), href = el.getAttribute('href'); if ((h === 'da' || h === 'en') && href) { try { alt[h] = new URL(href).pathname; } catch {} } } })
    .on('body', { element(el) {
      side = el.getAttribute('data-side') || '';
      // Skip-link (runde 13, WCAG 2.4.1): første fokuserbare element på hver side, før logo og menu.
      el.prepend(`<a class="spring-til" href="#indhold">${lang === 'en' ? 'Skip to content' : 'Spring til indhold'}</a>`, { html: true });
      // Web Analytics (runde 11): Pages indsatte beaconen selv; site-Workeren gør det kun, når WEB_ANALYTICS_TOKEN er sat
      // (produktion – ikke previews og ikke Pages, så den aldrig kommer to gange). Tokenet er offentligt og står i HTML'en.
      if (!fejlside && /^[a-f0-9]{32}$/.test(String(env.WEB_ANALYTICS_TOKEN || ''))) el.append(`<script defer src="https://static.cloudflareinsights.com/beacon.min.js" data-cf-beacon='{"token":"${env.WEB_ANALYTICS_TOKEN}"}'></script>`, { html: true });
    } })
    .on('head', { element(el) {
      if (krummerLd.length) el.append(kruemmeLd(krummerLd, siteOrigin(env, request)), { html: true });
      if (harMd) el.append(`<link rel="alternate" type="text/markdown" href="${escH(url.pathname)}index.md">`, { html: true });
    } })
    // 404-siden findes én gang med begge sprog; den forkerte halvdel fjernes her.
    .on('[data-fejl-sprog]', { element(el) { if (el.getAttribute('data-fejl-sprog') !== lang) el.remove(); } })
    .on('html', { element(el) { if (fejlside) el.setAttribute('lang', lang); } })
    .on('title', { element(el) { if (fejlside && lang === 'en') el.setInnerContent('Adjourned · Tingsvad'); } })
    .on('.side-hoved-tekst', { element(el) { if (krummer.length) el.prepend(kruemmeHtml(krummer, lang), { html: true }); } })
    .on('[data-tv-del]', {
      element(el) {
        const navn = el.getAttribute('data-tv-del');
        let html = dele[navn];
        if (!html) return; // pladsholderen bliver stående tom; siden virker stadig
        html = html.replaceAll('{{alt-da}}', alt.da).replaceAll('{{alt-en}}', alt.en);
        if (side && html.includes(`data-side="${side}"`)) html = html.replace(`data-side="${side}"`, `data-side="${side}" aria-current="page"`);
        else if (!fejlside && (navn === 'sidenav' || navn === 'topbar')) { const far = url.pathname.replace(/[^/]+\/$/, ''); html = html.replace(`href="${far}"`, `href="${far}" aria-current="true"`); } // underside uden eget menupunkt: marker forælderen (også i mobilmenuen i topbaren)
        el.replace(html, { html: true });
      },
    });
  headers.delete('content-length');
  headers.set('x-tingsvad-dele', DELE.filter(n => dele[n]).concat(krummer.length ? ['krummer'] : []).join(','));
  return rw.transform(new Response(res.body, { status: res.status, statusText: res.statusText, headers }));
}
