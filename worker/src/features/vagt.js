// Værnet og Crawlerne (runde 12): hvad Cloudflare stoppede ved vadestedet, og hvilke maskiner der kom forbi.
// Én gang i timen henter Cron tal fra Cloudflares GraphQL Analytics API (zonen tingsvad.dk, kun læseadgang) og
// gemmer dem som døgnrækker i D1 (vagt_dag). Lange perioder er stikprøver i API'et, korte er ikke, så hvert døgn
// hentes for sig: i dag og i går hver time, ældre døgn én gang (op til 30 dage tilbage, nogle ad gangen).
// Ud af rækkerne bygges to færdige oversigter i KV, som siderne henter. Der gemmes ingen IP-adresser, og stier og
// brugeragenter renses og afkortes, før de gemmes.
import { ok, fail, msg } from '../lib/http.js';
import { hemmelighed, harHemmelighed } from '../lib/hemmelighed.js';

const GQL = 'https://api.cloudflare.com/client/v4/graphql';
const DAGE = 30, BAGUD_PR_KOERSEL = 4;
export const KV_VAERN = 'vagt:vaern:v1', KV_CRAWL = 'vagt:crawlere:v1', KV_DOER = 'vagt:doer:v1';

export const vagtEnabled = env => !!((env.CF_ZONE_ID || '').trim() && harHemmelighed(env, 'CF_ANALYTICS_TOKEN') && env.DB && env.SAGER);

// ── Rensning (rene funktioner, testes) ─────────────────────────────────────────────────────────────────────────────
const STYR = /[\u0000-\u001f\u007f]/g;
/** En sti, som den må stå på en offentlig side: ingen forespørgselsstreng, ingen styretegn, højst 90 tegn. */
export function renSti(s) {
  let p = String(s == null ? '' : s).split('?')[0].replace(STYR, '').replace(/\s+/g, ' ');
  p = p.replace(/[A-Za-z0-9_\-]{32,}/g, '…'); // lange token-agtige stykker
  return (p.startsWith('/') ? p : '/' + p).slice(0, 90);
}
/** En brugeragent uden e-mail, uden lange tokens og højst 160 tegn. */
export function renUa(s) {
  return String(s == null ? '' : s).replace(STYR, '').replace(/[\w.+-]+@[\w-]+\.[\w.-]+/g, '[e-mail]').replace(/[A-Za-z0-9_\-]{40,}/g, '…').trim().slice(0, 160);
}
const DATO = /^\d{4}-\d{2}-\d{2}$/;
export const dagNoegle = (t = Date.now()) => new Date(t).toISOString().slice(0, 10);

// ── Bots: navn og firma ud fra brugeragenten ────────────────────────────────────────────────────────────────────────
const BOTS = [
  [/Googlebot-Image/i, 'Googlebot-Image', 'Google'], [/Googlebot/i, 'Googlebot', 'Google'], [/Google-InspectionTool/i, 'Google-InspectionTool', 'Google'],
  [/GoogleOther/i, 'GoogleOther', 'Google'], [/Storebot-Google/i, 'Storebot-Google', 'Google'], [/AdsBot-Google/i, 'AdsBot-Google', 'Google'],
  [/Google-Read-Aloud/i, 'Google Read Aloud', 'Google'], [/Google-Extended/i, 'Google-Extended', 'Google'], [/APIs-Google|Google-Safety/i, 'Google (tjenester)', 'Google'],
  [/bingbot/i, 'Bingbot', 'Microsoft'], [/BingPreview/i, 'BingPreview', 'Microsoft'], [/msnbot/i, 'MSNBot', 'Microsoft'],
  [/DuckAssistBot/i, 'DuckAssistBot', 'DuckDuckGo'], [/DuckDuckBot/i, 'DuckDuckBot', 'DuckDuckGo'], [/YandexBot|YandexImages/i, 'YandexBot', 'Yandex'],
  [/Baiduspider/i, 'Baiduspider', 'Baidu'], [/Applebot-Extended/i, 'Applebot-Extended', 'Apple'], [/Applebot/i, 'Applebot', 'Apple'],
  [/PetalBot/i, 'PetalBot', 'Huawei'], [/SeznamBot/i, 'SeznamBot', 'Seznam'], [/Sogou/i, 'Sogou', 'Sogou'], [/Qwantbot|Qwantify/i, 'Qwantbot', 'Qwant'],
  [/Claude-SearchBot/i, 'Claude-SearchBot', 'Anthropic'], [/Claude-User/i, 'Claude-User', 'Anthropic'], [/ClaudeBot|anthropic-ai/i, 'ClaudeBot', 'Anthropic'],
  [/OAI-SearchBot/i, 'OAI-SearchBot', 'OpenAI'], [/ChatGPT-User/i, 'ChatGPT-User', 'OpenAI'], [/OAI-AdsBot/i, 'OAI-AdsBot', 'OpenAI'], [/GPTBot/i, 'GPTBot', 'OpenAI'],
  [/Perplexity-User/i, 'Perplexity-User', 'Perplexity'], [/PerplexityBot/i, 'PerplexityBot', 'Perplexity'], [/MistralAI-User/i, 'MistralAI-User', 'Mistral'],
  [/Amazonbot/i, 'Amazonbot', 'Amazon'], [/CCBot/i, 'CCBot', 'Common Crawl'], [/Bytespider/i, 'Bytespider', 'ByteDance'], [/TikTokSpider/i, 'TikTok Spider', 'ByteDance'],
  [/meta-externalagent/i, 'Meta-ExternalAgent', 'Meta'], [/meta-externalfetcher/i, 'Meta-ExternalFetcher', 'Meta'], [/facebookexternalhit|FacebookBot/i, 'Facebook', 'Meta'],
  [/Qwenbot/i, 'Qwenbot', 'Alibaba'], [/YouBot/i, 'YouBot', 'You.com'], [/cohere-ai/i, 'Cohere', 'Cohere'], [/Timpibot/i, 'Timpibot', 'Timpi'],
  [/Twitterbot/i, 'Twitterbot', 'X'], [/LinkedInBot/i, 'LinkedInBot', 'LinkedIn'], [/Slackbot|Slack-ImgProxy/i, 'Slackbot', 'Slack'], [/Discordbot/i, 'Discordbot', 'Discord'],
  [/TelegramBot/i, 'TelegramBot', 'Telegram'], [/WhatsApp/i, 'WhatsApp', 'Meta'], [/Pinterestbot/i, 'Pinterestbot', 'Pinterest'],
  [/AhrefsBot|AhrefsSiteAudit/i, 'AhrefsBot', 'Ahrefs'], [/SemrushBot|SiteAuditBot/i, 'SemrushBot', 'Semrush'], [/MJ12bot/i, 'MJ12bot', 'Majestic'],
  [/DotBot/i, 'DotBot', 'Moz'], [/rogerbot/i, 'Rogerbot', 'Moz'], [/serpstatbot/i, 'Serpstatbot', 'Serpstat'], [/DataForSeoBot/i, 'DataForSeoBot', 'DataForSEO'],
  [/archive\.org_bot|ia_archiver/i, 'archive.org_bot', 'Internet Archive'], [/UptimeRobot/i, 'UptimeRobot', 'UptimeRobot'], [/Pingdom/i, 'Pingdom', 'SolarWinds'],
  [/Cloudflare-Healthchecks|Cloudflare-Traffic-Manager|CloudflareObservatory|Cloudflare-Radar/i, 'Cloudflare', 'Cloudflare'],
  [/HeadlessChrome/i, 'Headless Chrome', ''], [/Lighthouse|Chrome-Lighthouse/i, 'Lighthouse', 'Google'],
];
/** Kendte navne, som Cloudflare verificerer: kalder noget sig dét uden at være verificeret, udgiver det sig for at være det. */
const VERIFICERBARE = new Set(['Googlebot', 'Googlebot-Image', 'Google-InspectionTool', 'GoogleOther', 'Storebot-Google', 'AdsBot-Google', 'Bingbot', 'BingPreview', 'DuckDuckBot', 'DuckAssistBot', 'YandexBot', 'Baiduspider', 'Applebot', 'Applebot-Extended', 'PetalBot', 'ClaudeBot', 'Claude-User', 'Claude-SearchBot', 'GPTBot', 'OAI-SearchBot', 'ChatGPT-User', 'OAI-AdsBot', 'PerplexityBot', 'Perplexity-User', 'Amazonbot', 'CCBot', 'Bytespider', 'Meta-ExternalAgent', 'Facebook', 'AhrefsBot', 'SemrushBot', 'archive.org_bot']);
/** {navn, firma} for en brugeragent; kat er Cloudflares verificerede kategori ('' = ikke verificeret). Ren funktion. */
export function botNavn(ua, kat = '') {
  const s = String(ua || '');
  for (const [re, navn, firma] of BOTS) if (re.test(s)) return { navn, firma };
  if (kat) return { navn: kat === 'AI Assistant' ? 'AI-assistent i en browser' : `Verificeret (${kat})`, firma: '' };
  const m = s.match(/([A-Za-z][\w.-]{1,30}(?:bot|Bot|BOT|crawler|spider)[\w.-]{0,20})(?:\/[\d.]+)?/);
  return { navn: m ? m[1] : 'Ukendt bot', firma: '' };
}
/** Er en ikke-verificeret brugeragent en efterligning af en kendt bot, eller bare en ukendt (ærlig) bot? */
export const efterligning = navn => VERIFICERBARE.has(navn);

// ── Regler: "React - RCE - CVE:CVE-2025-55182" → {produkt, type, cve} ─────────────────────────────────────────────
export function regel(description, source) {
  const d = String(description || '').trim();
  if (!d) return { navn: source === 'bic' ? 'Browser Integrity Check' : (source || 'Ukendt regel'), produkt: '', type: source === 'bic' ? 'bic' : '', cve: null };
  const cve = (d.match(/CVE-\d{4}-\d{4,7}/i) || [null])[0];
  const dele = d.replace(/\s*-?\s*CVE:CVE-\d{4}-\d{4,7}/i, '').split(/\s+-\s+/).map(x => x.trim()).filter(Boolean);
  return { navn: d.slice(0, 90), produkt: dele[0] || '', type: dele.slice(1).join(' – ') || '', cve: cve ? cve.toUpperCase() : null };
}
// ── Forsøg, der bare fik 404: hvad ledte de efter? ─────────────────────────────────────────────────────────────────
const UFARLIG = /^\/(favicon\.ico|apple-touch-icon[\w.-]*\.png|robots\.txt|sitemap\.xml|ads\.txt|browserconfig\.xml)$/i;
export function forsoegKategori(sti) {
  const s = String(sti || '').toLowerCase();
  if (UFARLIG.test(s)) return null;
  if (/\.env|appsettings|secrets?|credentials|config\.(json|ya?ml|php|js)|\.aws|\.ssh|id_rsa|\.npmrc|docker-compose|web\.config|\.htpasswd|wp-config/.test(s)) return 'hemmeligheder';
  if (/\.git\b|\.git\/|\.svn|\.hg\/|\.ds_store/.test(s)) return 'kildekode';
  if (/wp-|wordpress|xmlrpc|\/wp\//.test(s)) return 'wordpress';
  if (/phpinfo|_profiler|phpmyadmin|adminer|\.php\b/.test(s)) return 'php';
  if (/admin|login|signin|manager|console|actuator|cgi-bin|\/shell|boaform|hnap|\.cgi/.test(s)) return 'adgang';
  return 'andet';
}

// ── GraphQL ──────────────────────────────────────────────────────────────────────────────────────────────────────────
async function gql(token, query) {
  const r = await fetch(GQL, { method: 'POST', headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' }, body: JSON.stringify({ query }) });
  const j = await r.json().catch(() => null);
  if (!r.ok || !j || (j.errors && j.errors.length)) throw new Error('graphql ' + r.status + ' ' + String(j && j.errors && j.errors[0] && j.errors[0].message || '').slice(0, 120));
  return j.data;
}
const grp = (lim, fra, til, ekstra, dims) => `httpRequestsAdaptiveGroups(limit:${lim}, filter:{datetime_geq:"${fra}", datetime_lt:"${til}"${ekstra}}, orderBy:[count_DESC]) { count dimensions { ${dims} } }`;
/** Ét døgn (UTC) i én forespørgsel. */
export function doegnForespoergsel(zone, dag) {
  const fra = `${dag}T00:00:00Z`, til = new Date(Date.parse(fra) + 86400e3).toISOString().replace('.000', '');
  return `{ viewer { zones(filter:{zoneTag:"${zone}"}) {
    fw: firewallEventsAdaptive(limit:10000, filter:{datetime_geq:"${fra}", datetime_lt:"${til}"}, orderBy:[datetime_DESC]) { action source description clientCountryName clientRequestPath clientRequestHTTPMethodName clientASNDescription edgeColoName datetime }
    alle: ${grp(1, fra, til, '', 'date')}
    probes: ${grp(400, fra, til, ', edgeResponseStatus:404', 'clientRequestPath')}
    bots: ${grp(1500, fra, til, ', verifiedBotCategory_neq:""', 'verifiedBotCategory userAgent clientRequestPath edgeResponseStatus')}
    f1: ${grp(300, fra, til, ', verifiedBotCategory:"", userAgent_like:"%bot%"', 'userAgent')}
    f2: ${grp(300, fra, til, ', verifiedBotCategory:"", userAgent_like:"%Bot%"', 'userAgent')}
    f3: ${grp(200, fra, til, ', verifiedBotCategory:"", userAgent_like:"%crawler%"', 'userAgent')}
  } } }`;
}

/** Laver et døgns GraphQL-svar om til rækker [art, noegle, n]. Ren funktion (testes). */
export function doegnRaekker(z) {
  const rk = new Map();
  const add = (art, noegle, n) => { const k = art + '\u0001' + noegle; rk.set(k, (rk.get(k) || 0) + (n || 0)); };
  for (const e of z.fw || []) {
    const r = regel(e.description, e.source);
    add('fw', [r.navn, e.clientCountryName || 'XX', (e.clientASNDescription || '').slice(0, 60), renSti(e.clientRequestPath), e.edgeColoName || '', e.clientRequestHTTPMethodName || '', e.source || '', e.action || ''].join('\t'), 1);
  }
  add('alle', '', ((z.alle || [])[0] || {}).count || 0);
  for (const g of z.probes || []) { const s = renSti(g.dimensions.clientRequestPath); if (forsoegKategori(s)) add('probe', s, g.count); }
  for (const g of z.bots || []) {
    const d = g.dimensions, b = botNavn(d.userAgent, d.verifiedBotCategory);
    add('bot', [b.navn, b.firma, d.verifiedBotCategory, renSti(d.clientRequestPath), d.edgeResponseStatus || 0].join('\t'), g.count);
  }
  const set = new Map(); // samme agent kan stå i både %bot% og %Bot%
  for (const g of [...(z.f1 || []), ...(z.f2 || []), ...(z.f3 || [])]) set.set(g.dimensions.userAgent, g.count);
  for (const [ua, n] of set) { const b = botNavn(ua, ''); add('falsk', [b.navn, efterligning(b.navn) ? 'efterligning' : 'uverificeret'].join('\t'), n); }
  return [...rk].map(([k, n]) => { const [art, noegle] = k.split('\u0001'); return [art, noegle, n]; });
}

// ── D1 ───────────────────────────────────────────────────────────────────────────────────────────────────────────────
const OPRET = 'CREATE TABLE IF NOT EXISTS vagt_dag (dag TEXT NOT NULL, art TEXT NOT NULL, noegle TEXT NOT NULL, n INTEGER NOT NULL, PRIMARY KEY (dag, art, noegle))';
async function gemDoegn(db, dag, raekker) {
  const st = [db.prepare("DELETE FROM vagt_dag WHERE dag = ? AND art NOT LIKE 'doer%'").bind(dag)]; // dørens tal har deres egen kørsel
  for (const [art, noegle, n] of raekker) st.push(db.prepare('INSERT INTO vagt_dag (dag, art, noegle, n) VALUES (?, ?, ?, ?)').bind(dag, art, noegle, n));
  for (let i = 0; i < st.length; i += 90) await db.batch(st.slice(i, i + 90));
}

/** Cron: opdaterer i dag og i går, henter nogle manglende ældre døgn, og bygger de to oversigter. */
export async function opdaterVagt(env, log, nu = Date.now()) {
  if (!vagtEnabled(env)) return 'disabled';
  const token = (await hemmelighed(env, 'CF_ANALYTICS_TOKEN')).v, zone = env.CF_ZONE_ID.trim(), db = env.DB;
  await db.prepare(OPRET).run();
  const iDag = dagNoegle(nu), dage = Array.from({ length: DAGE }, (_, i) => dagNoegle(nu - i * 86400e3));
  const har = new Set(((await db.prepare("SELECT DISTINCT dag FROM vagt_dag WHERE art = 'alle'").all()).results || []).map(r => r.dag));
  const mangler = dage.slice(2).filter(d => !har.has(d)).slice(0, BAGUD_PR_KOERSEL);
  let seneste = null;
  for (const dag of [dage[0], dage[1], ...mangler]) {
    const z = (await gql(token, doegnForespoergsel(zone, dag))).viewer.zones[0];
    await gemDoegn(db, dag, doegnRaekker(z));
    if (dag === iDag) seneste = (z.fw || []).slice(0, 12);
  }
  await db.prepare('DELETE FROM vagt_dag WHERE dag < ?').bind(dagNoegle(nu - 95 * 86400e3)).run();
  const rows = ((await db.prepare('SELECT dag, art, noegle, n FROM vagt_dag WHERE dag >= ?').bind(dage[DAGE - 1]).all()).results || []);
  const forrige = await env.SAGER.get(KV_VAERN, 'json').catch(() => null);
  const vaern = byggVaern(rows, nu, seneste ? seneste.map(senesteRaekke) : (forrige && forrige.seneste) || []);
  const crawl = byggCrawlere(rows, nu);
  await env.SAGER.put(KV_VAERN, JSON.stringify(vaern));
  await env.SAGER.put(KV_CRAWL, JSON.stringify(crawl));
  log && log({ event: 'vagt_ok', dage: 2 + mangler.length, blokeret7: vaern.perioder.d7, bots7: crawl.iAlt.bots7 });
  try { await opdaterDoer(env, token, zone, db, nu, log); } catch (e) { log && log({ event: 'doer_fejl', fejl: String(e && e.message || e).slice(0, 160) }); } // døren må aldrig vælte Værnet
  return 'ok';
}
const senesteRaekke = e => { const r = regel(e.description, e.source); return { t: e.datetime, regel: r.navn, cve: r.cve, land: e.clientCountryName || 'XX', sti: renSti(e.clientRequestPath), colo: e.edgeColoName || '', metode: e.clientRequestHTTPMethodName || '' }; };

// ── Oversigterne (rene funktioner, testes) ──────────────────────────────────────────────────────────────────────────
const top = (m, n) => [...m].sort((a, b) => b[1] - a[1]).slice(0, n);
const inc = (m, k, n) => m.set(k, (m.get(k) || 0) + n);
export function byggVaern(rows, nu = Date.now(), seneste = []) {
  const d1 = dagNoegle(nu), d7 = dagNoegle(nu - 6 * 86400e3);
  const dageListe = Array.from({ length: DAGE }, (_, i) => dagNoegle(nu - (DAGE - 1 - i) * 86400e3));
  const perDag = new Map(dageListe.map(d => [d, 0])), alleDag = new Map(dageListe.map(d => [d, 0]));
  const regler = new Map(), lande = new Map(), net = new Map(), stier = new Map(), colos = new Map(), par = new Map(), metoder = new Map(), kilder = new Map(), probes = new Map();
  let p1 = 0, p7 = 0, p30 = 0, probe7 = 0, alle7 = 0, alle30 = 0;
  for (const r of rows) {
    if (r.art === 'alle') { if (alleDag.has(r.dag)) alleDag.set(r.dag, r.n); alle30 += r.n; if (r.dag >= d7) alle7 += r.n; continue; }
    if (r.art === 'probe') { if (r.dag >= d7) { inc(probes, r.noegle, r.n); probe7 += r.n; } continue; }
    if (r.art !== 'fw') continue;
    const [navn, land, asn, sti, colo, metode, kilde] = r.noegle.split('\t'), n = r.n;
    p30 += n; if (r.dag >= d7) p7 += n; if (r.dag === d1) p1 += n;
    if (perDag.has(r.dag)) perDag.set(r.dag, perDag.get(r.dag) + n);
    const bic = navn === 'Browser Integrity Check';
    const rg = regler.get(navn) || { ...regel(bic ? '' : navn, bic ? 'bic' : ''), navn, n7: 0, n30: 0, foerst: r.dag, sidst: r.dag, stier: new Map(), lande: new Map() };
    rg.n30 += n; if (r.dag >= d7) rg.n7 += n; if (r.dag < rg.foerst) rg.foerst = r.dag; if (r.dag > rg.sidst) rg.sidst = r.dag; inc(rg.stier, sti, n); inc(rg.lande, land, n); regler.set(navn, rg);
    inc(lande, land, n); if (asn) inc(net, asn, n); inc(stier, sti, n); if (colo) inc(colos, colo, n); if (colo) inc(par, land + '>' + colo, n); if (metode) inc(metoder, metode, n); inc(kilder, kilde || '?', n);
  }
  const kat = new Map();
  for (const [sti, n] of probes) { const k = forsoegKategori(sti); if (!k) continue; const o = kat.get(k) || { id: k, n: 0, stier: [] }; o.n += n; o.stier.push([sti, n]); kat.set(k, o); }
  return {
    genereret: new Date(nu).toISOString(), perioder: { d1: p1, d7: p7, d30: p30 }, alle: { d7: alle7, d30: alle30 },
    dage: dageListe.map(d => ({ dag: d, n: perDag.get(d), alle: alleDag.get(d) })),
    regler: [...regler.values()].sort((a, b) => b.n30 - a.n30).slice(0, 12).map(r => ({ navn: r.navn, produkt: r.produkt, type: r.type, cve: r.cve, n7: r.n7, n30: r.n30, foerst: r.foerst, sidst: r.sidst, stier: top(r.stier, 3).map(([s, n]) => ({ sti: s, n })), lande: top(r.lande, 3).map(([k, n]) => ({ kode: k, n })) })),
    lande: top(lande, 15).map(([kode, n]) => ({ kode, n })), netvaerk: top(net, 8).map(([navn, n]) => ({ navn, n })), stier: top(stier, 12).map(([sti, n]) => ({ sti, n })),
    colos: top(colos, 20).map(([kode, n]) => ({ kode, n })), buer: top(par, 60).map(([k, n]) => { const [land, colo] = k.split('>'); return { land, colo, n }; }),
    metoder: Object.fromEntries(metoder), kilder: Object.fromEntries(kilder),
    forsoeg: { i7: probe7, kategorier: [...kat.values()].sort((a, b) => b.n - a.n).map(k => ({ id: k.id, n: k.n, stier: top(k.stier, 6).map(([sti, n]) => ({ sti, n })) })) },
    seneste: (seneste || []).slice(0, 12),
  };
}
const FILER = { '/robots.txt': 'robots', '/sitemap.xml': 'sitemap', '/llms.txt': 'llms', '/.well-known/api-catalog': 'katalog', '/.well-known/mcp/server-card.json': 'mcpkort' };
const filArt = sti => FILER[sti] || (/\/index\.md$/.test(sti) ? 'markdown' : /^\/(assets|cf-fonts)\//.test(sti) || /\.(woff2?|js|css|png|jpe?g|webp|avif|gif|svg|ico|webmanifest|mp3|pcm)$/i.test(sti) ? 'assets' : /^\/api\//.test(sti) ? 'api' : 'sider');
export function byggCrawlere(rows, nu = Date.now()) {
  const d7 = dagNoegle(nu - 6 * 86400e3);
  const dageListe = Array.from({ length: DAGE }, (_, i) => dagNoegle(nu - (DAGE - 1 - i) * 86400e3));
  const dagKat = new Map(dageListe.map(d => [d, {}]));
  const bots = new Map(), kat = new Map(), filer = new Map(), status = new Map(), falske = new Map(), uverif = new Map();
  let bots7 = 0, bots30 = 0, alle7 = 0;
  for (const r of rows) {
    if (r.art === 'alle') { if (r.dag >= d7) alle7 += r.n; continue; }
    if (r.art === 'falsk') { if (r.dag < d7) continue; const [navn, type] = r.noegle.split('\t'); inc(type === 'efterligning' ? falske : uverif, navn, r.n); continue; }
    if (r.art !== 'bot') continue;
    const [navn, firma, k, sti, st] = r.noegle.split('\t'), n = r.n;
    bots30 += n; const dk = dagKat.get(r.dag); if (dk) dk[k] = (dk[k] || 0) + n;
    if (r.dag < d7) continue;
    bots7 += n; inc(kat, k, n); inc(filer, filArt(sti), n); inc(status, String(st), n);
    const b = bots.get(navn) || { navn, firma, kat: k, n7: 0, sider: new Map(), status: new Map(), filer: new Map() };
    b.n7 += n; if (filArt(sti) === 'sider') inc(b.sider, sti, n); inc(b.status, String(st), n); inc(b.filer, filArt(sti), n); bots.set(navn, b);
  }
  return {
    genereret: new Date(nu).toISOString(), iAlt: { bots7, bots30, alle7, botNavne: bots.size, falske7: [...falske.values()].reduce((a, b) => a + b, 0) },
    kategorier: top(kat, 20).map(([k, n]) => ({ kat: k, n })), dage: dageListe.map(d => ({ dag: d, kat: dagKat.get(d) })),
    bots: [...bots.values()].sort((a, b) => b.n7 - a.n7).slice(0, 24).map(b => ({ navn: b.navn, firma: b.firma, kat: b.kat, n7: b.n7, sider: top(b.sider, 3).map(([sti, n]) => ({ sti, n })), status: Object.fromEntries(b.status), filer: Object.fromEntries(b.filer) })),
    filer: Object.fromEntries(filer), status: Object.fromEntries(status),
    falske: top(falske, 10).map(([navn, n]) => ({ navn, n })), uverificerede: top(uverif, 10).map(([navn, n]) => ({ navn, n })),
  };
}

// ── Ruterne ──────────────────────────────────────────────────────────────────────────────────────────────────────────
async function laes(env, noegle, lang) {
  if (!env.SAGER) return fail('not_configured', msg(lang, 'notconf'), 503);
  const v = await env.SAGER.get(noegle, 'json');
  // Ingen tal endnu: 200 med data null (ikke 404), så siden kan vise sit øjebliksbillede uden en fejl i konsollen.
  if (!v) return ok(null, 'server');
  return ok(v, 'server');
}
export const getVaern = (request, env, lang) => laes(env, KV_VAERN, lang);
export const getCrawlere = (request, env, lang) => laes(env, KV_CRAWL, lang);

// ── Tingets dør: hvor mange gange /admin/ blev prøvet ───────────────────────────────────────────────────────────────
// Kun antal pr. statuskode pr. døgn, aldrig hvem. Cloudflare Access står foran /admin/, så en gæst uden login sendes videre
// til login-siden (3xx), administratoren kommer ind (200/304), og slipper noget forbi Access, afviser Workeren selv (401/403).
export const doerForespoergsel = (zone, dag) => {
  const fra = `${dag}T00:00:00Z`, til = new Date(Date.parse(fra) + 86400e3).toISOString().replace('.000', '');
  return `{ viewer { zones(filter:{zoneTag:"${zone}"}) { doer: httpRequestsAdaptiveGroups(limit:50, filter:{datetime_geq:"${fra}", datetime_lt:"${til}", clientRequestPath:"/admin/"}) { count dimensions { edgeResponseStatus } } } } }`;
};
export const doerUdfald = status => { const s = +status || 0; if (s >= 300 && s < 400 && s !== 304) return 'login'; if ((s >= 200 && s < 300) || s === 304) return 'inde'; if (s === 401 || s === 403) return 'afvist'; return 'andet'; };
/** Rækker [dag, status, n] → dag for dag og samlet for i dag, 7 og 30 døgn. Ren funktion (testes). */
/** Runde 13: kun uge- og periodesummer (7/30 døgn) – ikke pr. døgn, så siden ikke viser hvornår administratoren logger ind. */
export function byggDoer(rows, nu = Date.now()) {
  const d7 = dagNoegle(nu - 6 * 86400e3), d30 = dagNoegle(nu - 27 * 86400e3);
  const tom = () => ({ forsoeg: 0, login: 0, inde: 0, afvist: 0, andet: 0 });
  const uger = Array.from({ length: 4 }, (_, i) => ({ fra: dagNoegle(nu - (27 - i * 7) * 86400e3), til: dagNoegle(nu - (21 - i * 7) * 86400e3), ...tom() }));
  const sum = { d7: tom(), d30: tom() };
  for (const r of rows) {
    if (r.dag < d30) continue;
    const u = doerUdfald(r.noegle), n = r.n || 0, uge = uger.find(w => r.dag >= w.fra && r.dag <= w.til);
    if (uge) { uge[u] += n; uge.forsoeg += n; }
    for (const [k, fra] of [['d7', d7], ['d30', d30]]) if (r.dag >= fra) { sum[k][u] += n; sum[k].forsoeg += n; }
  }
  return { opdateret: new Date(nu).toISOString(), ...sum, uger };
}
async function opdaterDoer(env, token, zone, db, nu, log) {
  const dage = Array.from({ length: 7 }, (_, i) => dagNoegle(nu - i * 86400e3));
  const har = new Set(((await db.prepare("SELECT DISTINCT dag FROM vagt_dag WHERE art = 'doer-k'").all()).results || []).map(r => r.dag));
  for (const dag of [dage[0], dage[1], ...dage.slice(2).filter(d => !har.has(d)).slice(0, 3)]) {
    const grupper = (await gql(token, doerForespoergsel(zone, dag))).viewer.zones[0].doer || [];
    const st = [db.prepare("DELETE FROM vagt_dag WHERE dag = ? AND art IN ('doer', 'doer-k')").bind(dag), db.prepare("INSERT INTO vagt_dag (dag, art, noegle, n) VALUES (?, 'doer-k', '', 1)").bind(dag)];
    for (const g of grupper) st.push(db.prepare("INSERT INTO vagt_dag (dag, art, noegle, n) VALUES (?, 'doer', ?, ?)").bind(dag, String(g.dimensions.edgeResponseStatus || 0), g.count || 0));
    await db.batch(st);
  }
  const rows = (await db.prepare("SELECT dag, noegle, n FROM vagt_dag WHERE art = 'doer' AND dag >= ?").bind(dagNoegle(nu - 29 * 86400e3)).all()).results || [];
  const d = byggDoer(rows, nu);
  await env.SAGER.put(KV_DOER, JSON.stringify(d));
  log && log({ event: 'doer_ok', d7: d.d7.forsoeg, d30: d.d30.forsoeg });
}
export const getDoer = (request, env, lang) => laes(env, KV_DOER, lang);
