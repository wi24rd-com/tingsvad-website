// Browser Run (Quick Actions via binding): og-billede pr. sag (/sag/:nr) og protokollen som PDF. Resultater caches i R2.
import { ok, fail, ApiError, langOf } from '../lib/http.js';
import { sha256Hex } from '../lib/crypto.js';
import { cphDateKey } from '../lib/dates.js';
import { browserAction } from '../lib/budget.js';

const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const renderEnabled = env => !!(env.BROWSER && typeof env.BROWSER.quickAction === 'function' && env.MEDIA);

async function hentSag(env, nr) {
  if (!env.SAGER) return null;
  const liste = (await env.SAGER.get('liste', 'json')) || [];
  const fast = { '980-0003': { navn: 'Toke den Yngre', sag: 'Jeg vil gerne sidde ned. Stolen står lige der.', dato: '1010' }, '980-0002': { navn: 'Mímir', sag: 'Jeg vil gerne have en ny protokol. Den gamle er våd.', dato: '1943' }, '980-0001': { navn: 'Ragnhild Tingsvad', sag: 'Jeg har løsningen på sagen om koen. Den tager tredive sekunder. Jeg har også to økser, hvis tinget vil have det overstået hurtigere.', dato: '1000' } };
  return liste.find(s => s.nr === nr) || (fast[nr] ? { nr, ...fast[nr] } : null);
}

function ogHtml(sag, lang) {
  const da = lang !== 'en';
  const titel = sag ? `Sag ${sag.nr}` : (da ? 'Sagen findes ikke' : 'Case not found');
  const tekst = sag ? sag.sag : (da ? 'Sagen findes ikke i protokollen. Den er muligvis udsat.' : 'The case is not in the minutes. It may be adjourned.');
  const stempel = da ? 'UDSAT' : 'ADJOURNED';
  return `<!doctype html><html lang="${da ? 'da' : 'en'}"><head><meta charset="utf-8"><style>
  html,body{margin:0;width:1200px;height:630px;background:#111417;color:#d6d9d4;font-family:Georgia,'Iowan Old Style',serif}
  .k{position:absolute;inset:0;padding:64px 72px;box-sizing:border-box;display:flex;flex-direction:column;justify-content:space-between;border:14px solid #2c3238}
  .top{font:600 20px 'Courier New',monospace;letter-spacing:.14em;text-transform:uppercase;color:#d9a441}
  h1{margin:18px 0 0;font:500 56px/1.05 Arial,Helvetica,sans-serif;letter-spacing:-.02em;color:#fff}
  p{font-size:30px;line-height:1.35;margin:22px 0 0;max-width:980px}
  .bund{display:flex;justify-content:space-between;align-items:flex-end;font:18px 'Courier New',monospace;letter-spacing:.1em;text-transform:uppercase;color:#8d948f}
  .st{transform:rotate(-7deg);border:6px solid #8c4a2f;color:#8c4a2f;font:700 44px Arial,sans-serif;letter-spacing:.2em;padding:6px 22px}
  </style></head><body><div class="k"><div><div class="top">tingsvad.dk · ${da ? 'Rejst sag' : 'Case raised'}</div><h1>${esc(titel)} · ${esc(sag ? sag.navn : '')}</h1><p>${esc(tekst.slice(0, 260))}</p></div>
  <div class="bund"><span>${da ? 'Vadestedet hvor tinget mødtes' : 'The ford where the thing met'} · ${esc(sag ? sag.dato : '')}</span><span class="st">${stempel}</span></div></div></body></html>`;
}

/** GET og/sag/:nr.png → PNG 1200×630, cachet i R2 pr. (nr, sagstekst, OG_VERSION). */
export async function ogSag(request, env, ctx, nrRaw) {
  const nr = String(nrRaw || '').replace(/\.png$/, '');
  if (!/^980-\d{4}$/.test(nr)) throw new ApiError('not_found', 'no', 404);
  if (!renderEnabled(env)) throw new ApiError('not_configured', 'browser rendering not configured', 503);
  const lang = langOf(new URL(request.url).searchParams.get('lang'));
  const sag = await hentSag(env, nr);
  const key = `og/sag/${nr}-${lang}-${(await sha256Hex((sag ? sag.sag + sag.navn : 'none') + '|' + (env.OG_VERSION || '1'))).slice(0, 10)}.png`;
  const cached = await env.MEDIA.get(key);
  if (cached) return new Response(cached.body, { headers: { 'content-type': 'image/png', 'cache-control': 'public, max-age=86400', 'x-content-type-options': 'nosniff' } });
  const t0 = Date.now();
  let bytes;
  try {
    const r = await browserAction(env, 'screenshot', { html: ogHtml(sag, lang), viewport: { width: 1200, height: 630 }, screenshotOptions: { type: 'png' } });
    bytes = new Uint8Array(await (r instanceof Response ? r.arrayBuffer() : new Response(r).arrayBuffer()));
    if (bytes.length < 500) throw new Error('empty screenshot');
  } catch (e) { // ingen browser (fx lokal udvikling) eller fejl: fald tilbage til det faste og-billede, så previews stadig virker
    ctx.log({ event: 'og_render_failed', nr, error: String(e && e.message).slice(0, 160) });
    return Response.redirect(`${env.SITE_ORIGIN}/assets/vadestedet-og.jpg`, 302);
  }
  ctx.waitUntil(env.MEDIA.put(key, bytes, { httpMetadata: { contentType: 'image/png', cacheControl: 'public, max-age=31536000' } }));
  ctx.log({ event: 'og_rendered', nr, ms: Date.now() - t0, bytes: bytes.length });
  return new Response(bytes, { headers: { 'content-type': 'image/png', 'cache-control': 'public, max-age=86400', 'x-content-type-options': 'nosniff' } });
}

/** GET pdf/protokol?lang= → PDF af /arkivet/protokol/ (dansk) eller /en/archive/minutes/, én gang pr. dag pr. sprog. */
export async function pdfProtokol(request, env, ctx) {
  if (!renderEnabled(env)) throw new ApiError('not_configured', 'browser rendering not configured', 503);
  const lang = langOf(new URL(request.url).searchParams.get('lang'));
  const key = `pdf/protokol-${lang}-${cphDateKey()}.pdf`;
  const navn = lang === 'da' ? 'tingsvad-protokol.pdf' : 'tingsvad-minutes.pdf';
  const headers = { 'content-type': 'application/pdf', 'content-disposition': `inline; filename="${navn}"`, 'cache-control': 'public, max-age=3600', 'x-content-type-options': 'nosniff' };
  const cached = await env.MEDIA.get(key);
  if (cached) return new Response(cached.body, { headers });
  const url = `${env.SITE_ORIGIN}/${lang === 'en' ? 'en/archive/minutes/' : 'arkivet/protokol/'}`; // browseren henter siden selv (ingen Worker-subrequest til egen zone)
  const t0 = Date.now();
  let bytes;
  try {
    // 'load' frem for 'networkidle0': analytics-beacon og Turnstile-script holder netværket i gang, så idle nås aldrig
    const r = await browserAction(env, 'pdf', { url, gotoOptions: { waitUntil: 'load', timeout: 30000 }, pdfOptions: { format: 'a4', printBackground: true, margin: { top: '14mm', bottom: '14mm', left: '12mm', right: '12mm' } } });
    bytes = new Uint8Array(await (r instanceof Response ? r.arrayBuffer() : new Response(r).arrayBuffer()));
    if (bytes.length < 1000 || bytes[0] !== 0x25) throw new Error(`not a pdf (${r instanceof Response ? r.status : 'rpc'}): ${new TextDecoder().decode(bytes.slice(0, 200))}`);
  } catch (e) { ctx.log({ event: 'pdf_render_failed', lang, error: String(e && e.message).slice(0, 300) }); return Response.redirect(url, 302); } // fald tilbage til den printbare side
  ctx.waitUntil(env.MEDIA.put(key, bytes, { httpMetadata: { contentType: 'application/pdf' } }));
  ctx.log({ event: 'pdf_rendered', lang, ms: Date.now() - t0, bytes: bytes.length });
  return new Response(bytes, { headers });
}
