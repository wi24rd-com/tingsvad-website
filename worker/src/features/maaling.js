// Hastigheden og Danmark lige nu (runde 12): to oversigter mere i familien med Værnet og Crawlerne.
// Hastigheden: Web Analytics' egne målinger fra rigtige gæster (Core Web Vitals og sideindlæsning), hentet fra GraphQL
// Analytics API for sitets Web Analytics-site (konto-niveau, RUM_SITE_TAG). Danmark lige nu: Cloudflare Radar for Danmark
// (trafik, bots, AI-crawlere, angreb, kvantesikre forbindelser, internethastighed), så tingets egne tal kan ses ved siden af
// landets. Begge hentes af Cron hver time og lægges færdige i KV; siderne henter dem gennem Workers Cache.
// Hver del hentes for sig og fejler for sig: mangler en tilladelse eller et felt, står resten stadig, og fejlen kan ses i
// oversigten (`fejl`), uden hemmeligheder. Der hentes ingen IP-adresser.
import { ok, fail, msg } from '../lib/http.js';
import { hemmelighed, harHemmelighed } from '../lib/hemmelighed.js';

const API = 'https://api.cloudflare.com/client/v4';
export const KV_HAST = 'vagt:hastighed:v1', KV_RADAR = 'vagt:radar:v1';

export const hastighedEnabled = env => !!((env.CF_ACCOUNT_ID || '').trim() && (env.RUM_SITE_TAG || '').trim() && harHemmelighed(env, 'CF_ANALYTICS_TOKEN') && env.SAGER);
export const radarEnabled = env => !!(harHemmelighed(env, 'CF_ANALYTICS_TOKEN') && env.SAGER && env.RADAR_ENABLED !== 'false');

const tal = v => { const n = typeof v === 'number' ? v : parseFloat(v); return Number.isFinite(n) ? n : null; };
const rund = (n, d = 1) => n == null ? null : Math.round(n * 10 ** d) / 10 ** d;
const renFejl = e => String(e && e.message || e).replace(/Bearer\s+\S+/gi, 'Bearer …').slice(0, 160);

// ── Radar ────────────────────────────────────────────────────────────────────────────────────────────────────────────
export const RADAR = {
  bots: 'http/summary/bot_class?location=DK&dateRange=7d',
  botsDage: 'http/timeseries_groups/bot_class?location=DK&dateRange=7d&aggInterval=1d',
  aiDK: 'ai/bots/summary/user_agent?location=DK&dateRange=7d',
  aiVerden: 'ai/bots/summary/user_agent?dateRange=7d',
  verificerede: 'verified_bots/top/bots?location=DK&dateRange=7d&limit=10',
  angrebFra: 'attacks/layer7/top/locations/origin?location=DK&dateRange=7d&limit=10',
  vaernProdukter: 'attacks/layer7/summary/mitigation_product?location=DK&dateRange=7d',
  angrebMetoder: 'attacks/layer7/summary/http_method?location=DK&dateRange=7d',
  l3: 'attacks/layer3/summary/vector?location=DK&dateRange=7d',
  kvante: 'http/summary/post_quantum?location=DK&dateRange=7d',
  enheder: 'http/summary/device_type?location=DK&dateRange=7d',
  hastighed: 'quality/speed/summary?location=DK',
  netvaerk: 'http/top/ases?location=DK&dateRange=7d&limit=6',
  rytme: 'http/timeseries?location=DK&dateRange=7d&aggInterval=1h',
  udfald: 'annotations/outages?location=DK&dateRange=30d&limit=10',
  domaener: 'ranking/top?location=DK&limit=10',
};
const pctListe = (o, n = 10) => Object.entries(o || {}).map(([k, v]) => ({ navn: k, pct: rund(tal(v), 2) })).filter(x => x.pct != null).sort((a, b) => b.pct - a.pct).slice(0, n);

/** Radar-svarene → én oversigt (ren funktion, testes). r: { nøgle: result }. */
export function byggRadar(r, nu = Date.now(), fejl = []) {
  const s = k => r[k] && r[k].summary_0;
  const out = { genereret: new Date(nu).toISOString(), fejl };
  if (s('bots')) out.bots = { menneske: rund(tal(s('bots').human), 1), bot: rund(tal(s('bots').bot), 1) };
  if (r.botsDage && r.botsDage.serie_0) { const sr = r.botsDage.serie_0; out.botsDage = (sr.timestamps || []).map((t, i) => ({ dag: String(t).slice(0, 10), bot: rund(tal((sr.bot || [])[i]), 1) })); }
  if (s('aiDK')) out.aiDK = pctListe(s('aiDK'));
  if (s('aiVerden')) out.aiVerden = pctListe(s('aiVerden'));
  if (r.verificerede && r.verificerede.top_0) out.verificerede = r.verificerede.top_0.slice(0, 10).map(b => ({ navn: String(b.botName || '').slice(0, 60), firma: String(b.botOwner || '').slice(0, 60), kat: String(b.botCategory || '').slice(0, 60), pct: rund(tal(b.value), 2) }));
  if (r.angrebFra && r.angrebFra.top_0) out.angrebFra = r.angrebFra.top_0.slice(0, 10).map(x => ({ kode: String(x.originCountryAlpha2 || 'XX').slice(0, 2), pct: rund(tal(x.value), 2) }));
  if (s('vaernProdukter')) out.vaernProdukter = pctListe(s('vaernProdukter')).filter(x => x.pct > 0);
  if (s('angrebMetoder')) out.angrebMetoder = pctListe(s('angrebMetoder'), 6);
  if (s('l3')) out.l3 = pctListe(s('l3'), 8);
  if (s('kvante')) out.kvante = { ja: rund(tal(s('kvante').SUPPORTED), 1), nej: rund(tal(s('kvante').NOT_SUPPORTED), 1) };
  if (s('enheder')) out.enheder = { desktop: rund(tal(s('enheder').desktop), 1), mobil: rund(tal(s('enheder').mobile), 1), andet: rund(tal(s('enheder').other), 1) };
  if (s('hastighed')) { const h = s('hastighed'), m = r.hastighed.meta || {}; out.hastighed = { ned: rund(tal(h.bandwidthDownload), 0), op: rund(tal(h.bandwidthUpload), 0), latens: rund(tal(h.latencyIdle), 0), latensBelastet: rund(tal(h.latencyLoaded), 0), jitter: rund(tal(h.jitterIdle), 0), tab: rund(tal(h.packetLoss), 2), tests: Array.isArray(m.totalTests) ? m.totalTests[0] : null }; }
  if (r.netvaerk && r.netvaerk.top_0) out.netvaerk = r.netvaerk.top_0.slice(0, 6).map(x => ({ asn: x.clientASN, navn: String(x.clientASName || '').slice(0, 60), pct: rund(tal(x.value), 1) }));
  if (r.rytme && r.rytme.serie_0) { const sr = r.rytme.serie_0; out.rytme = (sr.timestamps || []).map((t, i) => ({ t: String(t).slice(0, 13), v: rund(tal((sr.values || [])[i]), 3) })); }
  if (r.udfald && Array.isArray(r.udfald.annotations)) out.udfald = r.udfald.annotations.slice(0, 10).map(a => ({ start: a.startDate || a.startTime || null, slut: a.endDate || a.endTime || null, aarsag: String((a.outage && a.outage.outageCause) || a.eventType || '').slice(0, 60), beskrivelse: String(a.description || '').slice(0, 200) }));
  if (r.domaener && r.domaener.top_0) out.domaener = r.domaener.top_0.slice(0, 10).map(d => ({ rang: d.rank, domaene: String(d.domain || '').slice(0, 80) }));
  return out;
}

export async function opdaterRadar(env, log, nu = Date.now()) {
  if (!radarEnabled(env)) return 'disabled';
  const token = (await hemmelighed(env, 'CF_ANALYTICS_TOKEN')).v, r = {}, fejl = [];
  await Promise.all(Object.entries(RADAR).map(async ([k, sti]) => {
    try {
      const res = await fetch(`${API}/radar/${sti}&format=json`, { headers: { authorization: `Bearer ${token}` } });
      const j = await res.json().catch(() => null);
      if (!res.ok || !j || !j.success) throw new Error(`${res.status} ${(j && j.errors && j.errors[0] && j.errors[0].message) || ''}`);
      r[k] = j.result;
    } catch (e) { fejl.push(`${k}: ${renFejl(e)}`); }
  }));
  if (!Object.keys(r).length) { log && log({ event: 'radar_failed', fejl: fejl.slice(0, 3) }); return 'failed'; }
  await env.SAGER.put(KV_RADAR, JSON.stringify(byggRadar(r, nu, fejl)));
  log && log({ event: 'radar_ok', dele: Object.keys(r).length, fejl: fejl.length });
  return 'ok';
}

// ── Hastigheden (Web Analytics / RUM) ───────────────────────────────────────────────────────────────────────────────
const RUM = (ds, lim, f, felter) => `${ds}(limit:${lim}, filter:{${f}}, orderBy:[count_DESC]) { ${felter} }`;
/** Forespørgslerne, hver for sig, så én ukendt feltnavn ikke tager resten med sig. Tider er i mikrosekunder. */
export function hastighedForespoergsler(konto, site, fra, til) {
  const f = `siteTag:"${site}", datetime_geq:"${fra}", datetime_lt:"${til}"`, a = q => `{ viewer { accounts(filter:{accountTag:"${konto}"}) { ${q} } } }`;
  const pl = 'rumPageloadEventsAdaptiveGroups', pf = 'rumPerformanceEventsAdaptiveGroups', wv = 'rumWebVitalsEventsAdaptiveGroups';
  return {
    besoeg: a(`x: ${RUM(pl, 1, f, 'count sum { visits }')}`),
    dage: a(`x: ${pl}(limit:40, filter:{${f}}, orderBy:[date_ASC]) { count sum { visits } dimensions { date } }`),
    sider: a(`x: ${RUM(pl, 12, f, 'count sum { visits } dimensions { requestPath }')}`),
    lande: a(`x: ${RUM(pl, 10, f, 'count dimensions { countryName }')}`),
    browsere: a(`x: ${RUM(pl, 8, f, 'count dimensions { userAgentBrowser }')}`),
    enheder: a(`x: ${RUM(pl, 4, f, 'count dimensions { deviceType }')}`),
    indlaes: a(`x: ${RUM(pf, 1, f, 'count quantiles { pageLoadTimeP50 pageLoadTimeP75 firstContentfulPaintP50 firstContentfulPaintP75 }')}`),
    faser: a(`x: ${RUM(pf, 1, f, 'count quantiles { dnsTimeP50 connectionTimeWithoutTLSP50 tlsTimeP50 requestTimeP50 responseTimeP50 }')}`),
    landeTid: a(`x: ${RUM(pf, 10, f, 'count quantiles { pageLoadTimeP50 } dimensions { countryName }')}`),
    vitals: a(`x: ${RUM(wv, 1, f, 'count sum { lcpGood lcpNeedsImprovement lcpPoor inpGood inpNeedsImprovement inpPoor clsGood clsNeedsImprovement clsPoor } quantiles { largestContentfulPaintP75 interactionToNextPaintP75 cumulativeLayoutShiftP75 }')}`),
    lcpDele: a(`x: ${RUM(wv, 1, f, 'count quantiles { timeToFirstByteP75 lcpResourceLoadDelayP75 lcpResourceLoadTimeP75 lcpElementRenderDelayP75 }')}`),
    siderVitals: a(`x: ${RUM(wv, 12, f, 'count quantiles { largestContentfulPaintP75 interactionToNextPaintP75 cumulativeLayoutShiftP75 } dimensions { requestPath }')}`),
  };
}
const ms = us => { const n = tal(us); return n == null || n < 0 ? null : Math.round(n / 1000); }; // mikrosekunder → ms; negativ = ingen data
const cls = v => { const n = tal(v); return n == null || n < 0 ? null : rund(n > 5 ? n / 1000 : n, 3); }; // CLS er et tal uden enhed; store værdier er skaleret

/** RUM-svarene → én oversigt (ren funktion, testes). r: { nøgle: liste af grupper }. */
export function byggHastighed(r, nu = Date.now(), fejl = []) {
  const out = { genereret: new Date(nu).toISOString(), periode: 7, fejl };
  const g0 = k => (r[k] || [])[0];
  if (g0('besoeg')) out.besoeg = { visninger: g0('besoeg').count || 0, besoeg: (g0('besoeg').sum || {}).visits || 0 };
  if (r.dage) out.dage = r.dage.map(g => ({ dag: g.dimensions.date, visninger: g.count, besoeg: (g.sum || {}).visits || 0 }));
  const vit = new Map((r.siderVitals || []).map(g => [g.dimensions.requestPath, g]));
  if (r.sider) out.sider = r.sider.map(g => { const v = vit.get(g.dimensions.requestPath), q = v && v.quantiles || {}; return { sti: String(g.dimensions.requestPath || '/').split('?')[0].slice(0, 90), visninger: g.count, lcp: ms(q.largestContentfulPaintP75), inp: ms(q.interactionToNextPaintP75), cls: cls(q.cumulativeLayoutShiftP75) }; });
  const tid = new Map((r.landeTid || []).map(g => [g.dimensions.countryName, ms((g.quantiles || {}).pageLoadTimeP50)]));
  if (r.lande) out.lande = r.lande.map(g => ({ kode: String(g.dimensions.countryName || 'XX').slice(0, 2), visninger: g.count, indlaes: tid.get(g.dimensions.countryName) ?? null }));
  if (r.browsere) out.browsere = r.browsere.map(g => ({ navn: String(g.dimensions.userAgentBrowser || '?').slice(0, 40), visninger: g.count }));
  if (r.enheder) out.enheder = r.enheder.map(g => ({ navn: String(g.dimensions.deviceType || '?').slice(0, 20), visninger: g.count }));
  if (g0('indlaes')) { const q = g0('indlaes').quantiles || {}; out.indlaes = { p50: ms(q.pageLoadTimeP50), p75: ms(q.pageLoadTimeP75), fcp50: ms(q.firstContentfulPaintP50), fcp75: ms(q.firstContentfulPaintP75), n: g0('indlaes').count }; }
  if (g0('faser')) { const q = g0('faser').quantiles || {}; out.faser = { dns: ms(q.dnsTimeP50), tcp: ms(q.connectionTimeWithoutTLSP50), tls: ms(q.tlsTimeP50), foresp: ms(q.requestTimeP50), svar: ms(q.responseTimeP50) }; }
  if (g0('vitals')) {
    const v = g0('vitals'), s = v.sum || {}, q = v.quantiles || {}, fordel = (g, n, p) => { const t = (s[g] || 0) + (s[n] || 0) + (s[p] || 0); return t ? { god: rund(100 * (s[g] || 0) / t, 0), middel: rund(100 * (s[n] || 0) / t, 0), daarlig: rund(100 * (s[p] || 0) / t, 0), n: t } : null; };
    out.vitals = { lcp: ms(q.largestContentfulPaintP75), inp: ms(q.interactionToNextPaintP75), cls: cls(q.cumulativeLayoutShiftP75), n: v.count,
      fordeling: { lcp: fordel('lcpGood', 'lcpNeedsImprovement', 'lcpPoor'), inp: fordel('inpGood', 'inpNeedsImprovement', 'inpPoor'), cls: fordel('clsGood', 'clsNeedsImprovement', 'clsPoor') } };
  }
  if (g0('lcpDele')) { const q = g0('lcpDele').quantiles || {}; out.lcpDele = { ttfb: ms(q.timeToFirstByteP75), opdag: ms(q.lcpResourceLoadDelayP75), hent: ms(q.lcpResourceLoadTimeP75), tegn: ms(q.lcpElementRenderDelayP75) }; }
  return out;
}

async function gqlKonto(token, query) {
  const r = await fetch(`${API}/graphql`, { method: 'POST', headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' }, body: JSON.stringify({ query }) });
  const j = await r.json().catch(() => null);
  if (!r.ok || !j || (j.errors && j.errors.length)) throw new Error(`${r.status} ${String(j && j.errors && j.errors[0] && j.errors[0].message || '').slice(0, 140)}`);
  return ((j.data.viewer.accounts || [])[0] || {}).x || [];
}
export async function opdaterHastighed(env, log, nu = Date.now()) {
  if (!hastighedEnabled(env)) return 'disabled';
  const token = (await hemmelighed(env, 'CF_ANALYTICS_TOKEN')).v;
  const til = new Date(Math.floor(nu / 3600e3) * 3600e3).toISOString().replace('.000', ''), fra = new Date(Date.parse(til) - 7 * 86400e3).toISOString().replace('.000', '');
  const qs = hastighedForespoergsler(env.CF_ACCOUNT_ID.trim(), env.RUM_SITE_TAG.trim(), fra, til), r = {}, fejl = [];
  await Promise.all(Object.entries(qs).map(async ([k, q]) => { try { r[k] = await gqlKonto(token, q); } catch (e) { fejl.push(`${k}: ${renFejl(e)}`); } }));
  if (!Object.keys(r).length) { log && log({ event: 'hastighed_failed', fejl: fejl.slice(0, 3) }); await env.SAGER.put(KV_HAST, JSON.stringify({ genereret: new Date(nu).toISOString(), periode: 7, fejl, tom: true })); return 'failed'; }
  await env.SAGER.put(KV_HAST, JSON.stringify(byggHastighed(r, nu, fejl)));
  log && log({ event: 'hastighed_ok', dele: Object.keys(r).length, fejl: fejl.length });
  return 'ok';
}

// ── Ruterne ──────────────────────────────────────────────────────────────────────────────────────────────────────────
async function laes(env, noegle, lang) {
  if (!env.SAGER) return fail('not_configured', msg(lang, 'notconf'), 503);
  return ok((await env.SAGER.get(noegle, 'json')) || null, 'server'); // null = ingen tal endnu (200, så siden ikke får en 404 i konsollen)
}
export const getHastighed = (request, env, lang) => laes(env, KV_HAST, lang);
export const getDanmark = (request, env, lang) => laes(env, KV_RADAR, lang);
