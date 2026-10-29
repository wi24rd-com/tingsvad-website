/* tingsvad.dk — Værnet og Crawlerne (runde 12): hvad Cloudflare holdt ude, og hvem der kom for at læse.
   Tallene samles hver time af tingets Worker fra Cloudflares GraphQL Analytics API (Cron → D1 → KV) og hentes her fra
   /api/ting-ai/vaern og /api/ting-ai/crawlere. Ingen IP-adresser; stier og brugeragenter er renset på serveren.
   Indtil første indsamling (eller med ?eksempel) vises et mærket øjebliksbillede fra /assets/vagt-eksempel.json. */
(function () {
  'use strict';
  const rod = document.getElementById('vagt');
  if (!rod) return;
  const side = rod.getAttribute('data-vagt') === 'crawlere' ? 'crawlere' : 'vaern';
  const da = document.documentElement.lang !== 'en', lang = da ? 'da' : 'en', loc = da ? 'da-DK' : 'en-GB';
  const tvang = /[?&]eksempel\b/.test(location.search);
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const tal = n => Number(n || 0).toLocaleString(loc);
  const fmt = (s, v) => String(s).replace(/\{(\w+)\}/g, (m, k) => (k in v ? v[k] : m));
  let landNavn = k => k;
  try { const dn = new Intl.DisplayNames([lang], { type: 'region' }); landNavn = k => { try { return dn.of(k) || k; } catch (e) { return k; } }; } catch (e) { }

  const T = da ? {
    henter: 'Henter tallene …', opdateret: 'Opdateret {t} · samles hver time fra Cloudflare', fejl: 'Tallene kunne ikke hentes lige nu. Prøv igen om lidt.',
    eksempel: 'Indsamlingen er lige startet. Indtil den første time er gået, viser siden et øjebliksbillede fra 29. oktober 2026.', eksTvang: 'Øjebliksbillede fra 29. oktober 2026 (?eksempel). Fjern ?eksempel fra adressen for at se de aktuelle tal.',
    d1: 'Blokeret det seneste døgn', d7: 'Blokeret på 7 døgn', d30: 'Blokeret på 30 døgn', andel: '1 af hver {n} forespørgsler', forsoeg: 'Snusere, der intet fandt (7 døgn)', forsoegSub: 'forespørgsler efter filer, der ikke findes',
    kortH: 'Hvor angrebene kom fra', kortP: 'Hver bue går fra det land, angrebet kom fra, til det af Cloudflares datacentre, der stoppede det. Det sker i det datacenter, der ligger nærmest angriberen, længe før noget når tinget.',
    kortTitel: 'Verdenskort over blokerede angreb de seneste 30 døgn', kortDesc: 'Flest kom fra {lande}. Flest blev stoppet i {colos}.',
    verden: 'Verden', europa: 'Europa', leg: { land: 'Land, angrebet kom fra', colo: 'Datacenter, der stoppede det', bue: 'Et angreb på vej' },
    lande: 'Lande', netvaerk: 'Netværk', colos: 'Stoppet i', blok: n => `${tal(n)} ${n === 1 ? 'blokering' : 'blokeringer'}`,
    dageH: '30 døgn ved porten', dageP: 'Blokerede forespørgsler pr. døgn (UTC). Døgn før indsamlingen startede, står som tomme.', dageTitel: 'Søjlediagram over blokeringer pr. døgn de seneste 30 døgn', ialt: 'i alt', maks: 'flest: {n} den {d}',
    vis: 'Vis tallene', dag: 'Døgn', antal: 'Blokeret', trafik: 'Alle forespørgsler',
    reglerH: 'Reglerne, der slog til', reglerP: 'Cloudflares forvaltede regelsæt kender angrebsmønstre mod almindelig software. Her er de regler, der stoppede noget på tingsvad.dk.',
    reglerNote: 'tingsvad.dk kører hverken React på en server, WordPress eller PHP. Angrebene ville ikke have virket. Værnet stoppede dem alligevel, så de aldrig kostede Workeren et eneste millisekund.',
    n30: 'på 30 døgn', n7: '{n} på 7 døgn', foerst: 'Først set {d}, sidst {s}', stier: 'Bankede på', fra: 'Fra',
    forsoegH: 'Hvad de ledte efter', forsoegP: 'Ikke alt bliver blokeret. Mange robotter går bare rundt og prøver dørhåndtag: de spørger efter filer, som andre steder ved et uheld ligger fremme. På tingsvad.dk fandtes ingen af dem, så de fik en 404. Gudrun har ført protokol.',
    kat: {
      hemmeligheder: ['Hemmeligheder', 'Filer med adgangskoder og nøgler, som nogen har glemt at skjule (.env, appsettings).'],
      kildekode: ['Kildekode', 'Git-mapper og backupfiler, som kan afsløre et sites kode.'],
      wordpress: ['WordPress', 'Login- og adminsider på WordPress, som tinget ikke har.'],
      php: ['PHP-værktøjer', 'Fejlfindingssider som phpinfo, der viser serverens opsætning.'],
      adgang: ['Kontrolpaneler', 'Admin-, status- og styringssider til andre systemer.'],
      andet: ['Andet', 'Alt det andet, der blev spurgt efter og ikke fandtes.'],
    },
    senesteH: 'De seneste blokeringer', tid: 'Tidspunkt (UTC)', regel: 'Regel', land: 'Land', sti: 'Sti', colo: 'Datacenter', metode: 'Metode',
    type: [[/remote code execution|\brce\b/i, 'Fjernkørsel af kode: få serveren til at køre angriberens egen kode'], [/sql injection|sqli/i, 'SQL-injektion: snige databasekommandoer ind ad bagdøren'], [/broken access control/i, 'Brudt adgangskontrol: nå filer eller funktioner uden lov'], [/file inclusion|lfi|path traversal/i, 'Filinklusion: få serveren til at åbne en fil, den ikke burde'], [/xss|cross.site/i, 'Cross-site scripting: plante kode, der kører i andres browser'], [/anomal/i, 'Usædvanlig adfærd, der ligner et angreb'], [/browser integrity/i, 'Lignede ikke en rigtig browser (manglende eller falske headere)']],
    tiles: { bots7: 'Besøg fra verificerede bots (7 døgn)', navne: 'Forskellige bots', andel: 'Andel af al trafik', falske: 'Uverificerede bot-navne (7 døgn)', falskeSub: 'kalder sig en bot uden at kunne bevise det' },
    katH: 'Hvem de er', katP: 'Cloudflare verificerer en bot ved at tjekke, at den kommer fra firmaets egne netværk, og sorterer den i en kategori.',
    katDageH: '30 døgn med gæster', katDageTitel: 'Stablede søjler over verificerede bot-besøg pr. døgn og kategori', katDageP: 'Verificerede bot-besøg pr. døgn (UTC), fordelt på kategori.',
    gaesterH: 'Gæstebogen for maskiner', gaesterP: 'De verificerede bots, der var her de seneste 7 døgn, med de sider, de læste mest, og om de fandt maskinernes egne filer.',
    besoeg: n => `${tal(n)} ${n === 1 ? 'besøg' : 'besøg'}`, ok: '{p} % fik svar', laeste: 'Læste mest',
    filerH: 'Hvad de læste', filerP: 'Tinget lægger særlige filer frem til maskiner: robots.txt med reglerne, sitemap.xml med alle sider, llms.txt til sprogmodeller, hver side som Markdown og et kort over MCP-serveren. Her er, hvor meget de blev brugt, og af hvem.',
    fil: { robots: 'robots.txt', sitemap: 'sitemap.xml', llms: 'llms.txt', markdown: 'Markdown (index.md)', mcpkort: 'MCP-kort', katalog: 'API-katalog', sider: 'Sider', assets: 'Billeder, skrift og scripts', api: 'API' },
    filForkl: { robots: 'Reglerne for maskiner', sitemap: 'Listen over alle sider', llms: 'Introduktion til sprogmodeller', markdown: 'Siderne uden pynt', mcpkort: 'Kortet over MCP-serveren', katalog: '/.well-known/api-catalog', sider: 'Almindelige HTML-sider', assets: 'Det, siderne er bygget af', api: 'Tingets maskiner' },
    matrixBot: 'Bot', matrixTitel: 'Hvem der læste maskinernes filer',
    falskeH: 'Udklædte og ukendte', falskeP: 'Ingen af dem er blokeret: de får samme side som alle andre. Men ikke alle, der kalder sig en bot, er den, de siger.',
    udklaedte: 'Påstår at være en kendt bot', udklaedteP: 'Navnet er en kendt bot, men forespørgslen kom ikke fra firmaets netværk. Ofte et testværktøj eller en skraber i lånt tøj.',
    ukendte: 'Ærlige, men ukendte', ukendteP: 'Kalder sig en bot, men står ikke på Cloudflares liste over verificerede bots.',
    statusH: 'Hvad de fik som svar', statusP: 'Statuskoder for de verificerede bots de seneste 7 døgn.',
    koder: { '2': 'Svar', '3': 'Viderestillet eller uændret', '4': 'Fandtes ikke eller ikke tilladt', '5': 'Fejl undervejs' }, kode: { 101: 'skiftede til WebSocket', 200: 'svar', 301: 'flyttet', 304: 'uændret siden sidst', 404: 'findes ikke', 405: 'metode ikke tilladt', 499: 'gæsten lagde på', 522: 'forbindelsen tog for lang tid', 530: 'fejl hos Cloudflare' },
    katNavn: { 'AI Assistant': ['AI-assistenter', 'En AI henter en side, fordi et menneske bad om det.'], 'AI Crawler': ['AI-crawlere', 'Samler tekst til at træne eller opdatere sprogmodeller.'], 'AI Search': ['AI-søgning', 'Henter sider til AI-drevne søgesvar.'], 'Search Engine Crawler': ['Søgemaskiner', 'Indekserer sider, så de kan findes.'], 'Search Engine Optimization': ['SEO-værktøjer', 'Måler links og placeringer for marketingfolk.'], 'Monitoring & Analytics': ['Overvågning', 'Tjekker, om sitet svarer.'], 'Academic Research': ['Forskning', 'Indsamling til forskningsprojekter.'], 'Page Preview': ['Forhåndsvisning', 'Laver den lille boks, når et link deles.'], Aggregator: ['Samlere', 'Samler indhold fra mange sites ét sted.'], Security: ['Sikkerhed', 'Scanner efter sårbarheder og trusler.'], 'Feed Fetcher': ['Feed-læsere', 'Henter nyheder og feeds.'], 'Advertising & Marketing': ['Annoncer', 'Tjekker sider til annoncenetværk.'], Archiver: ['Arkivering', 'Gemmer sider til eftertiden.'], Accessibility: ['Tilgængelighed', 'Værktøjer, der gør nettet lettere at bruge.'], Webhooks: ['Webhooks', 'Automatiske beskeder mellem tjenester.'], Other: ['Andet', 'Verificeret, men uden kategori.'] },
  } : {
    henter: 'Fetching the figures …', opdateret: 'Updated {t} · collected every hour from Cloudflare', fejl: 'The figures could not be fetched just now. Try again in a moment.',
    eksempel: 'Collection has only just started. Until the first hour has passed, the page shows a snapshot from 29 October 2026.', eksTvang: 'Snapshot from 29 October 2026 (?eksempel). Remove ?eksempel from the address to see the current figures.',
    d1: 'Blocked in the last day', d7: 'Blocked in 7 days', d30: 'Blocked in 30 days', andel: '1 in every {n} requests', forsoeg: 'Snoopers who found nothing (7 days)', forsoegSub: 'requests for files that do not exist',
    kortH: 'Where the attacks came from', kortP: 'Each arc runs from the country an attack came from to the Cloudflare data centre that stopped it. That happens in the data centre nearest the attacker, long before anything reaches the thing.',
    kortTitel: 'World map of blocked attacks in the last 30 days', kortDesc: 'Most came from {lande}. Most were stopped in {colos}.',
    verden: 'World', europa: 'Europe', leg: { land: 'Country the attack came from', colo: 'Data centre that stopped it', bue: 'An attack under way' },
    lande: 'Countries', netvaerk: 'Networks', colos: 'Stopped in', blok: n => `${tal(n)} ${n === 1 ? 'block' : 'blocks'}`,
    dageH: '30 days at the gate', dageP: 'Blocked requests per day (UTC). Days before collection started show as empty.', dageTitel: 'Bar chart of blocks per day over the last 30 days', ialt: 'in total', maks: 'most: {n} on {d}',
    vis: 'Show the figures', dag: 'Day', antal: 'Blocked', trafik: 'All requests',
    reglerH: 'The rules that fired', reglerP: 'Cloudflare’s managed ruleset knows attack patterns against common software. These are the rules that stopped something on tingsvad.dk.',
    reglerNote: 'tingsvad.dk runs neither server-side React, WordPress nor PHP. The attacks would not have worked. The defences stopped them anyway, so they never cost the Worker a single millisecond.',
    n30: 'in 30 days', n7: '{n} in 7 days', foerst: 'First seen {d}, last {s}', stier: 'Knocked on', fra: 'From',
    forsoegH: 'What they were looking for', forsoegP: 'Not everything is blocked. Many robots simply walk around trying door handles: they ask for files that are sometimes left out by accident elsewhere. None of them existed on tingsvad.dk, so they got a 404. Gudrun kept the minutes.',
    kat: {
      hemmeligheder: ['Secrets', 'Files with passwords and keys someone forgot to hide (.env, appsettings).'],
      kildekode: ['Source code', 'Git folders and backup files that can reveal a site’s code.'],
      wordpress: ['WordPress', 'WordPress login and admin pages, which the thing does not have.'],
      php: ['PHP tools', 'Debug pages such as phpinfo that show the server’s setup.'],
      adgang: ['Control panels', 'Admin, status and management pages for other systems.'],
      andet: ['Other', 'Everything else that was asked for and did not exist.'],
    },
    senesteH: 'The latest blocks', tid: 'Time (UTC)', regel: 'Rule', land: 'Country', sti: 'Path', colo: 'Data centre', metode: 'Method',
    type: [[/remote code execution|\brce\b/i, 'Remote code execution: making the server run the attacker’s own code'], [/sql injection|sqli/i, 'SQL injection: sneaking database commands in through the back door'], [/broken access control/i, 'Broken access control: reaching files or functions without permission'], [/file inclusion|lfi|path traversal/i, 'File inclusion: making the server open a file it should not'], [/xss|cross.site/i, 'Cross-site scripting: planting code that runs in other people’s browsers'], [/anomal/i, 'Unusual behaviour that looks like an attack'], [/browser integrity/i, 'Did not look like a real browser (missing or fake headers)']],
    tiles: { bots7: 'Visits from verified bots (7 days)', navne: 'Different bots', andel: 'Share of all traffic', falske: 'Unverified bot names (7 days)', falskeSub: 'calling themselves a bot without proof' },
    katH: 'Who they are', katP: 'Cloudflare verifies a bot by checking that it comes from the company’s own networks, and sorts it into a category.',
    katDageH: '30 days of guests', katDageTitel: 'Stacked bars of verified bot visits per day and category', katDageP: 'Verified bot visits per day (UTC), by category.',
    gaesterH: 'The guestbook for machines', gaesterP: 'The verified bots that visited in the last 7 days, the pages they read most, and whether they found the files made for machines.',
    besoeg: n => `${tal(n)} ${n === 1 ? 'visit' : 'visits'}`, ok: '{p}% got an answer', laeste: 'Read most',
    filerH: 'What they read', filerP: 'The thing puts special files out for machines: robots.txt with the rules, sitemap.xml with every page, llms.txt for language models, every page as Markdown and a card for the MCP server. Here is how much they were used, and by whom.',
    fil: { robots: 'robots.txt', sitemap: 'sitemap.xml', llms: 'llms.txt', markdown: 'Markdown (index.md)', mcpkort: 'MCP card', katalog: 'API catalogue', sider: 'Pages', assets: 'Images, fonts and scripts', api: 'API' },
    filForkl: { robots: 'The rules for machines', sitemap: 'The list of all pages', llms: 'An introduction for language models', markdown: 'The pages without decoration', mcpkort: 'The card for the MCP server', katalog: '/.well-known/api-catalog', sider: 'Ordinary HTML pages', assets: 'What the pages are built from', api: 'The thing’s machines' },
    matrixBot: 'Bot', matrixTitel: 'Who read the files for machines',
    falskeH: 'Disguised and unknown', falskeP: 'None of them is blocked: they get the same page as everyone else. But not everyone calling themselves a bot is who they say.',
    udklaedte: 'Claims to be a known bot', udklaedteP: 'The name is a known bot, but the request did not come from the company’s network. Often a test tool or a scraper in borrowed clothes.',
    ukendte: 'Honest, but unknown', ukendteP: 'Calls itself a bot, but is not on Cloudflare’s list of verified bots.',
    statusH: 'What answer they got', statusP: 'Status codes for the verified bots in the last 7 days.',
    koder: { '2': 'Answered', '3': 'Redirected or unchanged', '4': 'Not found or not allowed', '5': 'Error on the way' }, kode: { 101: 'switched to WebSocket', 200: 'answer', 301: 'moved', 304: 'unchanged since last time', 404: 'not found', 405: 'method not allowed', 499: 'the guest hung up', 522: 'connection timed out', 530: 'Cloudflare error' },
    katNavn: { 'AI Assistant': ['AI assistants', 'An AI fetching a page because a person asked it to.'], 'AI Crawler': ['AI crawlers', 'Collecting text to train or update language models.'], 'AI Search': ['AI search', 'Fetching pages for AI-powered search answers.'], 'Search Engine Crawler': ['Search engines', 'Indexing pages so they can be found.'], 'Search Engine Optimization': ['SEO tools', 'Measuring links and rankings for marketers.'], 'Monitoring & Analytics': ['Monitoring', 'Checking whether the site answers.'], 'Academic Research': ['Research', 'Collection for research projects.'], 'Page Preview': ['Link previews', 'Making the little box when a link is shared.'], Aggregator: ['Aggregators', 'Collecting content from many sites in one place.'], Security: ['Security', 'Scanning for vulnerabilities and threats.'], 'Feed Fetcher': ['Feed readers', 'Fetching news and feeds.'], 'Advertising & Marketing': ['Advertising', 'Checking pages for ad networks.'], Archiver: ['Archiving', 'Saving pages for posterity.'], Accessibility: ['Accessibility', 'Tools that make the web easier to use.'], Webhooks: ['Webhooks', 'Automatic messages between services.'], Other: ['Other', 'Verified, but without a category.'] },
  };
  const KATFARVE = { 'AI Assistant': '#c79bff', 'AI Crawler': '#7cc4ff', 'AI Search': '#8fe3d0', 'Search Engine Crawler': '#e6bd68', 'Search Engine Optimization': '#ef9a62', 'Monitoring & Analytics': '#5fd38a', 'Academic Research': '#f4e3a1', 'Page Preview': '#ff8fb1' };
  const pct = (n, s) => { const p = 100 * n / (s || 1); return p > 0 && p < 1 ? '<1 %' : Math.round(p) + ' %'; };
  const katFarve = k => KATFARVE[k] || '#8aa0ad';
  const katNavn = k => (T.katNavn[k] || [k, ''])[0];
  const proj = (lon, lat) => [500 + lon * 1000 / 360, 250 - lat * 1000 / 360];
  const VIEW = { verden: [0, 28, 1000, 385], europa: [430, 50, 250, 96] };
  const datoKort = d => { const [y, m, dd] = String(d).split('-').map(Number); return da ? `${dd}/${m}` : new Date(Date.UTC(y, m - 1, dd)).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' }); };
  const datoLang = d => { const [y, m, dd] = String(d).split('-').map(Number); return new Date(Date.UTC(y, m - 1, dd)).toLocaleDateString(loc, { day: 'numeric', month: 'long', timeZone: 'UTC' }); };
  const kl = iso => { const t = new Date(iso); return isNaN(t) ? '' : t.toLocaleString(loc, { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' }); };

  let verden = null, colonavne = {};
  const xyColo = k => (verden && (verden.colo[k] || (verden.net[k] && verden.net[k].slice(0, 2)))) || null;
  const coloNavn = k => { const n = colonavne[k]; if (Array.isArray(n)) return `${n[da ? 0 : 1]} (${k})`; if (verden && verden.net[k]) return `${verden.net[k][2]} (${k})`; return k; };

  async function hentJson(url) { const r = await fetch(url, { credentials: 'same-origin' }); if (!r.ok) { const e = new Error('http ' + r.status); e.status = r.status; throw e; } return r.json(); }

  /* ── fælles byggeklodser ── */
  const flise = (n, t, sub, cls = '') => `<div class="vg-flise ${cls}"><b>${esc(n)}</b><span>${esc(t)}</span>${sub ? `<small>${esc(sub)}</small>` : ''}</div>`;
  const blok = (id, h, p, indhold) => `<section class="vg-blok" id="${id}" aria-labelledby="${id}-h"><h2 id="${id}-h">${esc(h)}</h2>${p ? `<p class="vg-intro">${esc(p)}</p>` : ''}${indhold}</section>`;
  function liste(rk, maks, tekst) {
    const m = Math.max(1, ...rk.map(r => r.n));
    return `<ol class="vg-liste">${rk.map(r => `<li><span class="vg-l-navn">${esc(r.navn)}</span><span class="vg-l-n">${tal(r.n)}</span><i style="--w:${(100 * r.n / m).toFixed(1)}%"></i></li>`).join('')}</ol>`;
  }
  function soejler(dage, opt) {
    // opt.stak: [{noegle, farve}] → stablede søjler af d.kat[noegle]; ellers d.n
    const W = 1000, H = 220, top = 18, bund = 30, venstre = 8, hojre = 8, n = dage.length, bw = (W - venstre - hojre) / n;
    const sum = d => opt.stak ? opt.stak.reduce((s, k) => s + ((d.kat || {})[k.noegle] || 0), 0) : (d.n || 0);
    const maks = Math.max(1, ...dage.map(sum));
    const y = v => top + (H - top - bund) * (1 - v / maks);
    const p = [];
    [0.5, 1].forEach(f => p.push(`<line class="vg-akse" x1="${venstre}" x2="${W - hojre}" y1="${y(maks * f).toFixed(1)}" y2="${y(maks * f).toFixed(1)}"/><text class="vg-akse-t" x="${W - hojre}" y="${(y(maks * f) - 4).toFixed(1)}" text-anchor="end">${tal(Math.round(maks * f))}</text>`));
    dage.forEach((d, i) => {
      const x = venstre + i * bw + bw * 0.14, w = bw * 0.72;
      let acc = 0; const titel = `${datoLang(d.dag)}: ${tal(sum(d))}`;
      if (opt.stak) {
        const dele = opt.stak.map(k => { const v = (d.kat || {})[k.noegle] || 0; if (!v) return ''; const y0 = y(acc), y1 = y(acc + v); acc += v; return `<rect x="${x.toFixed(1)}" y="${y1.toFixed(1)}" width="${w.toFixed(1)}" height="${Math.max(0.5, y0 - y1).toFixed(1)}" fill="${k.farve}"/>`; }).join('');
        p.push(`<g class="vg-soejle"><title>${esc(titel)}</title>${dele}</g>`);
      } else {
        const v = sum(d); p.push(`<rect class="vg-soejle${i === n - 1 ? ' vg-idag' : ''}" x="${x.toFixed(1)}" y="${y(v).toFixed(1)}" width="${w.toFixed(1)}" height="${Math.max(v ? 1 : 0, y(0) - y(v)).toFixed(1)}" rx="2"><title>${esc(titel)}</title></rect>`);
      }
      if (i % 7 === (n - 1) % 7) p.push(`<text class="vg-akse-t" x="${(x + w / 2).toFixed(1)}" y="${H - 9}" text-anchor="middle">${esc(datoKort(d.dag))}</text>`);
    });
    p.push(`<line class="vg-akse vg-nul" x1="${venstre}" x2="${W - hojre}" y1="${y(0)}" y2="${y(0)}"/>`);
    return `<div class="vg-soejler-rul" tabindex="0" role="region" aria-label="${esc(opt.titel)}"><svg class="vg-soejler" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(opt.titel)}">${p.join('')}</svg></div>`;
  }
  const tabelDetaljer = (hoved, rk) => `<details class="vg-tal"><summary>${esc(T.vis)}</summary><div class="vg-tabel-rul" tabindex="0" role="region" aria-label="${esc(T.vis)}"><table class="vg-tabel"><thead><tr>${hoved.map(h => `<th scope="col">${esc(h)}</th>`).join('')}</tr></thead><tbody>${rk.map(r => `<tr>${r.map((c, i) => i ? `<td>${esc(c)}</td>` : `<th scope="row">${esc(c)}</th>`).join('')}</tr>`).join('')}</tbody></table></div></details>`;

  /* ── Værnet ── */
  function kort(v, visning) {
    const [vx, vy, vw, vh] = VIEW[visning], k = 1000 / vw, r = n => (n / k).toFixed(2);
    const L = verden.lande || {};
    const g = [];
    for (let lon = -150; lon <= 180; lon += 30) { const x = proj(lon, 0)[0]; g.push(`<line x1="${x}" y1="0" x2="${x}" y2="500"/>`); }
    for (let lat = -60; lat <= 60; lat += 30) { const y = proj(0, lat)[1]; g.push(`<line x1="0" y1="${y}" x2="1000" y2="${y}"/>`); }
    const alle = [...Object.values(verden.colo), ...Object.values(verden.net).map(a => a.slice(0, 2))].map(([x, y]) => `<circle class="vg-net" cx="${x}" cy="${y}" r="${r(1.3)}"/>`).join('');
    const mb = Math.max(1, ...v.buer.map(b => b.n));
    const buer = v.buer.slice().sort((a, b) => a.n - b.n).map(b => {
      const a = L[b.land], c = xyColo(b.colo); if (!a || !c) return '';
      const d = Math.hypot(c[0] - a[0], c[1] - a[1]); if (d < 0.5) return '';
      const mx = (a[0] + c[0]) / 2, my = (a[1] + c[1]) / 2 - Math.max(6, d * 0.32);
      return `<path class="vg-bue" d="M${a[0]} ${a[1]} Q${mx.toFixed(1)} ${my.toFixed(1)} ${c[0]} ${c[1]}" style="stroke-width:${r(0.7 + 2.2 * Math.sqrt(b.n / mb))};stroke-dasharray:${r(3)} ${r(3)}"><title>${esc(landNavn(b.land))} → ${esc(coloNavn(b.colo))}: ${esc(T.blok(b.n))}</title></path>`;
    }).join('');
    const ml = Math.max(1, ...v.lande.map(l => l.n));
    const lande = v.lande.map(l => { const p = L[l.kode]; if (!p) return ''; return `<circle class="vg-land" cx="${p[0]}" cy="${p[1]}" r="${r(2.4 + 9 * Math.sqrt(l.n / ml))}"><title>${esc(landNavn(l.kode))}: ${esc(T.blok(l.n))}</title></circle>`; }).join('');
    const mc = Math.max(1, ...v.colos.map(c => c.n));
    const colos = v.colos.map(c => { const p = xyColo(c.kode); if (!p) return ''; const s = (1.8 + 3.2 * Math.sqrt(c.n / mc)) / k; return `<path class="vg-colo" d="M${p[0]} ${(p[1] - s).toFixed(2)} L${(p[0] + s).toFixed(2)} ${p[1]} L${p[0]} ${(p[1] + s).toFixed(2)} L${(p[0] - s).toFixed(2)} ${p[1]} Z"><title>${esc(coloNavn(c.kode))}: ${esc(T.blok(c.n))}</title></path>`; }).join('');
    const etiketter = v.lande.slice(0, visning === 'europa' ? 8 : 5).map(l => { const p = L[l.kode]; if (!p) return ''; const rr = (2.4 + 9 * Math.sqrt(l.n / ml)) / k; return `<text class="vg-etiket" x="${(p[0] + rr + 3 / k).toFixed(2)}" y="${(p[1] + 4 / k).toFixed(2)}" style="font-size:${r(11.5)}px;stroke-width:${r(3)}px">${esc(landNavn(l.kode))}</text>`; }).join('');
    const desc = fmt(T.kortDesc, { lande: v.lande.slice(0, 3).map(l => landNavn(l.kode)).join(', '), colos: v.colos.slice(0, 3).map(c => coloNavn(c.kode)).join(', ') });
    return `<svg class="vg-kort" viewBox="${vx} ${vy} ${vw} ${vh}" role="img" aria-labelledby="vg-kort-t vg-kort-d" preserveAspectRatio="xMidYMid meet">
      <title id="vg-kort-t">${esc(T.kortTitel)}</title><desc id="vg-kort-d">${esc(desc)}</desc>
      <rect class="vg-hav" x="0" y="0" width="1000" height="500"/><g class="vg-gitter" style="stroke-width:${r(.4)}">${g.join('')}</g>
      <path class="vg-landflade" d="${verden.land}" style="stroke-width:${r(.5)}"/>
      <g>${alle}</g><g>${buer}</g><g style="stroke-width:${r(.6)}">${lande}</g><g style="stroke-width:${r(.5)}">${colos}</g><g>${etiketter}</g></svg>`;
  }
  function typeTekst(navn, type) { for (const [re, t] of T.type) if (re.test(type || '') || re.test(navn || '')) return t; return type || ''; }
  function vaern(v) {
    const d7 = v.perioder.d7, alle7 = v.alle && v.alle.d7;
    const fliser = `<div class="vg-fliser">${flise(tal(v.perioder.d1), T.d1)}${flise(tal(d7), T.d7, d7 && alle7 ? fmt(T.andel, { n: tal(Math.round(alle7 / d7)) }) : '', 'vg-hoved')}${flise(tal(v.perioder.d30), T.d30)}${flise(tal(v.forsoeg && v.forsoeg.i7), T.forsoeg, T.forsoegSub, 'vg-graa')}</div>`;
    const kortBlok = `<div class="vg-tavle"><div class="vg-zoom" role="group" aria-label="${esc(T.kortH)}"><button type="button" data-vis="verden" aria-pressed="true">${esc(T.verden)}</button><button type="button" data-vis="europa" aria-pressed="false">${esc(T.europa)}</button></div><div class="vg-kortramme" tabindex="0" role="region" aria-label="${esc(T.kortTitel)}">${kort(v, 'verden')}</div>
      <ul class="vg-legende"><li><i class="vg-leg-land"></i>${esc(T.leg.land)}</li><li><i class="vg-leg-colo"></i>${esc(T.leg.colo)}</li><li><i class="vg-leg-bue"></i>${esc(T.leg.bue)}</li></ul></div>
      <div class="vg-tre"><div><h3>${esc(T.lande)}</h3>${liste(v.lande.slice(0, 8).map(l => ({ navn: landNavn(l.kode), n: l.n })))}</div><div><h3>${esc(T.netvaerk)}</h3>${liste(v.netvaerk.slice(0, 8))}</div><div><h3>${esc(T.colos)}</h3>${liste(v.colos.slice(0, 8).map(c => ({ navn: coloNavn(c.kode), n: c.n })))}</div></div>`;
    const sumD = v.dage.reduce((s, d) => s + d.n, 0), mx = v.dage.reduce((a, d) => (d.n > a.n ? d : a), v.dage[0] || { n: 0 });
    const dageBlok = `<div class="vg-tavle vg-tavle-pad"><p class="vg-tavle-top"><b>${tal(sumD)}</b> ${esc(T.ialt)}${mx && mx.n ? ` · ${esc(fmt(T.maks, { n: tal(mx.n), d: datoLang(mx.dag) }))}` : ''}</p>${soejler(v.dage, { titel: T.dageTitel })}</div>${tabelDetaljer([T.dag, T.antal, T.trafik], v.dage.slice().reverse().map(d => [datoLang(d.dag), tal(d.n), tal(d.alle)]))}`;
    const regler = `<div class="vg-regler">${v.regler.map(rg => `<article class="vg-regel"><header><span class="vg-produkt">${esc(rg.produkt || (rg.navn || '').split(' - ')[0])}</span>${rg.cve ? `<a class="vg-cve" href="https://www.cve.org/CVERecord?id=${encodeURIComponent(rg.cve)}" rel="noopener">${esc(rg.cve)}</a>` : ''}</header>
        <h3>${esc(typeTekst(rg.navn, rg.type))}</h3><p class="vg-regelnavn"><code>${esc(rg.navn)}</code></p>
        <p class="vg-regel-n"><b>${tal(rg.n30)}</b> ${esc(T.n30)}<span>${esc(fmt(T.n7, { n: tal(rg.n7) }))}</span></p>
        ${rg.stier && rg.stier.length ? `<p class="vg-regel-l"><span>${esc(T.stier)}</span> ${rg.stier.slice(0, 3).map(s => `<code>${esc(s.sti)}</code>`).join(' ')}</p>` : ''}
        ${rg.lande && rg.lande.length ? `<p class="vg-regel-l"><span>${esc(T.fra)}</span> ${esc(rg.lande.slice(0, 3).map(l => landNavn(l.kode)).join(', '))}</p>` : ''}
        ${rg.foerst ? `<p class="vg-regel-d">${esc(fmt(T.foerst, { d: datoLang(rg.foerst), s: datoLang(rg.sidst) }))}</p>` : ''}</article>`).join('')}</div><p class="vg-note">${esc(T.reglerNote)}</p>`;
    const fk = (v.forsoeg && v.forsoeg.kategorier) || [], fm = Math.max(1, ...fk.map(k => k.n));
    const forsoeg = `<ol class="vg-protokol">${fk.map((k, i) => { const [navn, forkl] = T.kat[k.id] || [k.id, '']; return `<li><div class="vg-p-hoved"><span class="vg-p-nr">§ ${i + 1}</span><h3>${esc(navn)}</h3><b>${tal(k.n)}</b></div><i style="--w:${(100 * k.n / fm).toFixed(1)}%"></i><p>${esc(forkl)}</p>${k.stier && k.stier.length ? `<p class="vg-p-stier">${k.stier.slice(0, 5).map(s => `<code>${esc(s.sti)}</code>`).join(' ')}</p>` : ''}</li>`; }).join('')}</ol>`;
    const sen = (v.seneste || []).length ? blok('vg-seneste', T.senesteH, '', `<div class="vg-tabel-rul" tabindex="0" role="region" aria-label="${esc(T.senesteH)}"><table class="vg-tabel"><thead><tr><th scope="col">${esc(T.tid)}</th><th scope="col">${esc(T.regel)}</th><th scope="col">${esc(T.land)}</th><th scope="col">${esc(T.sti)}</th><th scope="col">${esc(T.colo)}</th><th scope="col">${esc(T.metode)}</th></tr></thead><tbody>${v.seneste.map(s => `<tr><td class="vg-mono">${esc(String(s.t || '').replace('T', ' ').replace(/:\d\dZ?$/, '').replace(/Z$/, ''))}</td><td>${esc(s.cve || s.regel)}</td><td>${esc(landNavn(s.land))}</td><td><code>${esc(s.sti)}</code></td><td class="vg-mono">${esc(s.colo)}</td><td class="vg-mono">${esc(s.metode)}</td></tr>`).join('')}</tbody></table></div>`) : '';
    return fliser + blok('vg-kort', T.kortH, T.kortP, kortBlok) + blok('vg-dage', T.dageH, T.dageP, dageBlok) + blok('vg-regler', T.reglerH, T.reglerP, regler) + blok('vg-forsoeg', T.forsoegH, T.forsoegP, forsoeg) + sen;
  }

  /* ── Crawlerne ── */
  function crawlere(c) {
    const i = c.iAlt;
    const fliser = `<div class="vg-fliser">${flise(tal(i.bots7), T.tiles.bots7, '', 'vg-hoved')}${flise(tal(i.botNavne), T.tiles.navne)}${flise(i.alle7 ? (100 * i.bots7 / i.alle7).toLocaleString(loc, { maximumFractionDigits: 1 }) + ' %' : '–', T.tiles.andel)}${flise(tal(i.falske7), T.tiles.falske, T.tiles.falskeSub, 'vg-graa')}</div>`;
    const km = Math.max(1, ...c.kategorier.map(k => k.n)), ks = c.kategorier.reduce((s, k) => s + k.n, 0) || 1;
    const kat = `<ul class="vg-kat">${c.kategorier.map(k => `<li><span class="vg-prik" style="--f:${katFarve(k.kat)}"></span><div><h3>${esc(katNavn(k.kat))}</h3><p>${esc((T.katNavn[k.kat] || ['', ''])[1])}</p></div><b>${tal(k.n)}<small>${pct(k.n, ks)}</small></b><i style="--w:${(100 * k.n / km).toFixed(1)}%;--f:${katFarve(k.kat)}"></i></li>`).join('')}</ul>`;
    const stak = c.kategorier.map(k => ({ noegle: k.kat, farve: katFarve(k.kat) }));
    const dage = `<div class="vg-tavle vg-tavle-pad">${soejler(c.dage, { titel: T.katDageTitel, stak })}<ul class="vg-legende vg-legende-inde">${stak.map(s => `<li><i style="background:${s.farve}"></i>${esc(katNavn(s.noegle))}</li>`).join('')}</ul></div>${tabelDetaljer([T.dag, ...stak.map(s => katNavn(s.noegle))], c.dage.slice().reverse().map(d => [datoLang(d.dag), ...stak.map(s => tal((d.kat || {})[s.noegle] || 0))]))}`;
    const okPct = st => { let s = 0, ok = 0; for (const [k, n] of Object.entries(st || {})) { s += n; if (+k < 400) ok += n; } return s ? Math.round(100 * ok / s) : null; };
    const MASKINFILER = ['robots', 'sitemap', 'llms', 'markdown', 'mcpkort', 'katalog'];
    const gaester = `<div class="vg-gaester">${c.bots.map(b => { const p = okPct(b.status); const f = b.filer || {}; return `<article class="vg-gaest" style="--f:${katFarve(b.kat)}"><header><h3>${esc(b.navn)}</h3>${b.firma ? `<span class="vg-firma">${esc(b.firma)}</span>` : ''}</header>
        <p class="vg-kat-chip">${esc(katNavn(b.kat))}</p><p class="vg-gaest-n"><b>${tal(b.n7)}</b> ${esc(da ? 'besøg på 7 døgn' : 'visits in 7 days')}${p != null ? `<span>${esc(fmt(T.ok, { p }))}</span>` : ''}</p>
        ${b.sider && b.sider.length ? `<p class="vg-gaest-l"><span>${esc(T.laeste)}</span>${b.sider.slice(0, 3).map(s => `<code>${esc(s.sti)}</code>`).join('')}</p>` : ''}
        <ul class="vg-maerker">${MASKINFILER.filter(k => f[k]).map(k => `<li title="${esc(T.filForkl[k])}">${esc(T.fil[k])} <b>${tal(f[k])}</b></li>`).join('')}</ul></article>`; }).join('')}</div>`;
    const fo = c.filer || {}, ORDEN = ['robots', 'sitemap', 'llms', 'markdown', 'mcpkort', 'katalog', 'sider', 'assets', 'api'];
    const filkort = `<ul class="vg-filer">${ORDEN.filter(k => fo[k] || MASKINFILER.includes(k)).map(k => `<li class="${MASKINFILER.includes(k) ? 'vg-maskinfil' : ''}${fo[k] ? '' : ' vg-tom'}"><b>${tal(fo[k] || 0)}</b><span>${esc(T.fil[k])}</span><small>${esc(T.filForkl[k])}</small></li>`).join('')}</ul>`;
    const laesere = c.bots.filter(b => MASKINFILER.some(k => (b.filer || {})[k]));
    const brugte = MASKINFILER.filter(k => laesere.some(b => (b.filer || {})[k]));
    const matrix = laesere.length ? `<div class="vg-tabel-rul" tabindex="0" role="region" aria-label="${esc(T.matrixTitel)}"><table class="vg-tabel vg-matrix"><caption>${esc(T.matrixTitel)}</caption><thead><tr><th scope="col">${esc(T.matrixBot)}</th>${brugte.map(k => `<th scope="col">${esc(T.fil[k])}</th>`).join('')}</tr></thead><tbody>${laesere.map(b => `<tr><th scope="row">${esc(b.navn)}</th>${brugte.map(k => { const n = (b.filer || {})[k]; return `<td>${n ? `<span class="vg-flueben" aria-hidden="true">✓</span> ${tal(n)}` : '<span class="vg-streg">–</span>'}</td>`; }).join('')}</tr>`).join('')}</tbody></table></div>` : '';
    const nliste = rk => rk.length ? `<ol class="vg-navne">${rk.map(r => `<li><span>${esc(r.navn)}</span><b>${tal(r.n)}</b></li>`).join('')}</ol>` : '<p class="vg-note">–</p>';
    const falske = `<div class="vg-to"><div class="vg-udklaedt"><h3>${esc(T.udklaedte)}</h3><p>${esc(T.udklaedteP)}</p>${nliste(c.falske || [])}</div><div><h3>${esc(T.ukendte)}</h3><p>${esc(T.ukendteP)}</p>${nliste(c.uverificerede || [])}</div></div>`;
    const st = Object.entries(c.status || {}).map(([k, n]) => [+k, n]).sort((a, b) => a[0] - b[0]), sts = st.reduce((s, [, n]) => s + n, 0) || 1;
    const status = `<div class="vg-statusbar" role="img" aria-label="${esc(st.map(([k, n]) => `${k}: ${tal(n)}`).join(', '))}">${st.map(([k, n]) => `<span class="vg-s${String(k)[0]}" style="flex:${n}" title="${k} ${esc(T.kode[k] || '')}: ${tal(n)}"></span>`).join('')}</div>
      <ul class="vg-koder">${st.map(([k, n]) => `<li><i class="vg-s${String(k)[0]}"></i><code>${k}</code> ${esc(T.kode[k] || T.koder[String(k)[0]] || '')}<b>${tal(n)}</b><small>${(100 * n / sts) < 0.1 ? (da ? '<0,1' : '<0.1') : (100 * n / sts).toLocaleString(loc, { maximumFractionDigits: 1 })} %</small></li>`).join('')}</ul>`;
    return fliser + blok('vg-kat', T.katH, T.katP, kat) + blok('vg-katdage', T.katDageH, T.katDageP, dage) + blok('vg-gaester', T.gaesterH, T.gaesterP, gaester)
      + blok('vg-filer', T.filerH, T.filerP, filkort + matrix) + blok('vg-falske', T.falskeH, T.falskeP, falske) + blok('vg-status', T.statusH, T.statusP, status);
  }

  /* ── start ── */
  async function start() {
    rod.setAttribute('aria-busy', 'true');
    rod.innerHTML = `<p class="vg-status">${esc(T.henter)}</p>`;
    let data = null, eks = tvang;
    const hentVerden = side === 'vaern' ? Promise.all([hentJson('/assets/verden.json'), hentJson('/assets/colo.json').catch(() => ({}))]) : Promise.resolve([null, {}]);
    try {
      // Kun når Workeren melder vagt tændt (en ældre eller lokal Worker kender ikke ruten og ville svare 404).
      const h = !tvang && await hentJson('/api/ting-ai/health').catch(() => null);
      if (h && h.ok && h.data && h.data.configured && h.data.configured.vagt) { const j = await hentJson('/api/ting-ai/' + (side === 'vaern' ? 'vaern' : 'crawlere') + '?lang=' + lang); if (j && j.ok && j.data) data = j.data; }
    } catch (e) { if (e.status !== 404 && e.status !== 503) data = null; }
    try {
      if (!data) { const e = await hentJson('/assets/vagt-eksempel.json'); data = side === 'vaern' ? e.vaern : e.crawl; eks = true; }
      const [v, n] = await hentVerden; verden = v; colonavne = n || {};
    } catch (e) { rod.removeAttribute('aria-busy'); rod.innerHTML = `<p class="vg-advarsel" role="status">${esc(T.fejl)}</p>`; return; }
    const top = `<div class="vg-bjaelke"><p class="vg-status">${esc(fmt(T.opdateret, { t: kl(data.genereret) }))}</p></div>${eks ? `<p class="vg-advarsel" role="note">${esc(tvang ? T.eksTvang : T.eksempel)}</p>` : ''}`;
    rod.innerHTML = top + (side === 'vaern' ? vaern(data) : crawlere(data));
    rod.querySelectorAll('.vg-soejler-rul').forEach(r => { r.scrollLeft = r.scrollWidth; });
    rod.removeAttribute('aria-busy');
    rod.classList.toggle('vg-eksempel', eks);
    dispatchEvent(new Event('tv:indhold'));
    if (side === 'vaern') {
      const ramme = rod.querySelector('.vg-kortramme');
      const midt = () => { if (ramme.scrollWidth > ramme.clientWidth) ramme.scrollLeft = (ramme.scrollWidth - ramme.clientWidth) * 0.5; };
      midt();
      rod.querySelectorAll('.vg-zoom button').forEach(b => b.addEventListener('click', () => {
        rod.querySelectorAll('.vg-zoom button').forEach(x => x.setAttribute('aria-pressed', String(x === b)));
        ramme.innerHTML = kort(data, b.getAttribute('data-vis')); midt();
      }));
    }
  }
  start();
})();
