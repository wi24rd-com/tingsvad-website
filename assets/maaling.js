/* tingsvad.dk — Hastigheden og Danmark lige nu (runde 12): to sider mere i familien med Værnet og Crawlerne, med samme
   tavle og samme stil (vagt.css). Hastigheden viser Web Analytics' målinger fra rigtige gæster (/api/ting-ai/hastighed).
   Danmark lige nu viser Cloudflare Radar for Danmark (/api/ting-ai/danmark) ved siden af tingets egne tal fra Værnet og
   Crawlerne. Tallene samles hver time af tingets Worker. Indtil første indsamling (eller med ?eksempel) viser Danmark
   lige nu et mærket øjebliksbillede fra /assets/vagt-eksempel.json; Hastigheden har intet øjebliksbillede. */
(function () {
  'use strict';
  // Runde 13: Hastigheden og Danmark lige nu bor på samme side (/maskinrummet/tal/) som to faner, så scriptet kører pr. rod.
  document.querySelectorAll('[data-maaling]').forEach(koer);
  function koer(rod) {
  const side = rod.getAttribute('data-maaling') === 'danmark' ? 'danmark' : 'hastighed';
  const da = document.documentElement.lang !== 'en', lang = da ? 'da' : 'en', loc = da ? 'da-DK' : 'en-GB';
  const tvang = /[?&]eksempel\b/.test(location.search);
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const tal = (n, d = 0) => n == null ? '–' : Number(n).toLocaleString(loc, { maximumFractionDigits: d, minimumFractionDigits: 0 });
  const pct = (n, d = 0) => n == null ? '–' : tal(n, d) + ' %';
  const fmt = (s, v) => String(s).replace(/\{(\w+)\}/g, (m, k) => (k in v ? v[k] : m));
  let landNavn = k => k;
  try { const dn = new Intl.DisplayNames([lang], { type: 'region' }); landNavn = k => { try { return dn.of(k) || k; } catch (e) { return k; } }; } catch (e) { }
  const kl = iso => { const t = new Date(iso); return isNaN(t) ? '' : t.toLocaleString(loc, { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' }); };
  const datoKort = d => { const [y, m, dd] = String(d).split('-').map(Number); return da ? `${dd}/${m}` : new Date(Date.UTC(y, m - 1, dd)).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' }); };

  const T = da ? {
    henter: 'Henter tallene …', opdateret: 'Opdateret {t} · samles hver time fra Cloudflare', fejl: 'Tallene kunne ikke hentes lige nu. Prøv igen om lidt.',
    eksempel: 'Indsamlingen er ikke startet endnu. Indtil da viser siden et øjebliksbillede fra Cloudflare Radar 29. oktober 2026.', eksTvang: 'Øjebliksbillede fra 29. oktober 2026 (?eksempel). Fjern ?eksempel fra adressen for at se de aktuelle tal.',
    vis: 'Vis tallene', mangler: 'Nogle tal mangler', manglerP: 'Disse dele svarede ikke ved seneste indsamling. Resten er aktuelt.',
    // Hastigheden
    tom: 'Ingen målinger endnu. Web Analytics måler kun gæster med JavaScript, der ikke blokerer Cloudflares lille beacon, og tallene kommer, efterhånden som gæster besøger siden.',
    vitalNavn: { lcp: 'Største indhold (LCP)', inp: 'Svar på klik (INP)', cls: 'Stabilt layout (CLS)' },
    vitalForkl: { lcp: 'Hvor længe der går, før det største billede eller den største tekst står på skærmen.', inp: 'Hvor hurtigt siden reagerer, når man klikker eller trykker.', cls: 'Hvor meget siden hopper rundt, mens den bliver tegnet.' },
    vurd: { god: 'God', middel: 'Kan forbedres', daarlig: 'Dårlig' }, p75: '3 ud af 4 gæster havde det mindst så godt',
    fliser: { indlaes: 'Hele siden indlæst (median)', ttfb: 'Første byte (75 %)', besoeg: 'Besøg på 7 døgn', visninger: '{n} sidevisninger' },
    fordH: 'Core Web Vitals', fordP: 'Googles tre mål for, hvordan en side føles. Søjlerne viser, hvor stor en del af målingerne der var gode, kunne forbedres eller var dårlige.',
    tidH: 'Hvor tiden går', tidP: 'Medianen for hvert trin, fra gæsten slår navnet op, til siden er tegnet.',
    fase: { dns: 'DNS-opslag', tcp: 'Forbindelse', tls: 'Kryptering (TLS)', foresp: 'Forespørgsel', svar: 'Svar' }, lcpDele: { ttfb: 'Første byte', opdag: 'Find billedet', hent: 'Hent billedet', tegn: 'Tegn det' },
    lcpDeleH: 'LCP skilt ad (75 %-fraktil)', siderH: 'Siderne', siderP: 'De mest besøgte sider de seneste 7 døgn, med deres Core Web Vitals.', sti: 'Side', visn: 'Visninger',
    landeH: 'Lande', landeT: 'indlæst på {ms}', browsereH: 'Browsere', enhederH: 'Enheder', dageH: '7 døgn med gæster', dageTitel: 'Søjlediagram over sidevisninger pr. døgn',
    enhed: { desktop: 'Computer', mobile: 'Mobil', tablet: 'Tablet' },
    // Danmark
    fl: { bots: 'af trafikken i Danmark er bots', kvante: 'af de danske forbindelser er kvantesikre', ned: 'Mbit/s median download', latens: 'ms svartid i hvile (median)' },
    rytmeH: 'Danmarks døgnrytme', rytmeP: 'HTTP-trafik i Danmark time for time de seneste 7 døgn, i forhold til den travleste time. Om natten falder den til en femtedel.', rytmeTitel: 'Kurve over dansk internettrafik time for time',
    botH: 'Bots i Danmark og ved vadestedet', botP: 'Hvem crawler mest? AI-crawlere i Danmark og i hele verden, og de bots der faktisk kom til tingsvad.dk.',
    aiDK: 'AI-bots i Danmark', aiVerden: 'AI-bots i verden', aiTing: 'Verificerede bots hos tinget', andel: 'andel',
    verifH: 'Danmarks mest aktive verificerede bots', verifP: 'Netarkivet er Det Kgl. Biblioteks robot, der gemmer det danske internet til eftertiden.',
    angrebH: 'Angreb mod Danmark og mod tinget', angrebP: 'Hvor kommer angrebene på danske sites fra, og hvordan ser det ud for tingsvad.dk? Lande, der står på begge lister, er markeret.',
    angrebDK: 'Angreb mod Danmark (andel)', angrebTing: 'Angreb mod tingsvad.dk (antal)', begge: 'på begge lister',
    produktH: 'Hvad der stoppede dem', produkt: { WAF: 'WAF-regler', DDOS: 'DDoS-beskyttelse', ACCESS_RULES: 'Adgangsregler', IP_REPUTATION: 'IP-omdømme', BOT_MANAGEMENT: 'Bot-styring', API_SHIELD: 'API Shield' },
    l3H: 'DDoS-angreb på netværket', l3P: 'Angreb mod danske netværk på lag 3 og 4, målt i datamængde.',
    netH: 'Danmarks net', netP: 'De største netværk, enheder og hastighed i Danmark.', netvaerk: 'Største netværk', enheder: 'Enheder', hast: 'Hastighed (Cloudflares speedtest)',
    hastF: { ned: 'Download', op: 'Upload', latens: 'Svartid i hvile', latensBelastet: 'Svartid under belastning', jitter: 'Jitter', tab: 'Pakketab' }, tests: '{n} målinger de seneste 90 dage',
    kvanteH: 'Kvantesikre forbindelser', kvanteP: 'En forbindelse er kvantesikker, når browseren og serveren aftaler nøglen med en algoritme (ML-KEM), som heller ikke en fremtidig kvantecomputer kan bryde. Cloudflare tilbyder det til alle sites, også tingsvad.dk, og tingets bevis i Runeværkstedet er underskrevet med ML-DSA.',
    kvanteJa: 'Kvantesikker', kvanteNej: 'Ikke kvantesikker',
    udfaldH: 'Udfald i Danmark', udfaldIngen: 'Cloudflare Radar har ikke registreret nogen udfald i Danmark de seneste 30 dage.',
    domaenerH: 'Mest brugte domæner i Danmark', kilde: 'Kilde: Cloudflare Radar (radar.cloudflare.com), CC BY-NC 4.0.',
  } : {
    henter: 'Fetching the figures …', opdateret: 'Updated {t} · collected every hour from Cloudflare', fejl: 'The figures could not be fetched just now. Try again in a moment.',
    eksempel: 'Collection has not started yet. Until then, the page shows a snapshot from Cloudflare Radar on 29 October 2026.', eksTvang: 'Snapshot from 29 October 2026 (?eksempel). Remove ?eksempel from the address to see the current figures.',
    vis: 'Show the figures', mangler: 'Some figures are missing', manglerP: 'These parts did not answer at the latest collection. The rest is current.',
    tom: 'No measurements yet. Web Analytics only measures guests with JavaScript who do not block Cloudflare’s small beacon, and the figures arrive as guests visit the site.',
    vitalNavn: { lcp: 'Largest content (LCP)', inp: 'Response to clicks (INP)', cls: 'Stable layout (CLS)' },
    vitalForkl: { lcp: 'How long until the largest image or text is on the screen.', inp: 'How quickly the page reacts when you click or tap.', cls: 'How much the page jumps around while it is drawn.' },
    vurd: { god: 'Good', middel: 'Needs improvement', daarlig: 'Poor' }, p75: '3 in 4 guests had it at least this good',
    fliser: { indlaes: 'Whole page loaded (median)', ttfb: 'First byte (75%)', besoeg: 'Visits in 7 days', visninger: '{n} page views' },
    fordH: 'Core Web Vitals', fordP: 'Google’s three measures of how a page feels. The bars show how many measurements were good, needed improvement or were poor.',
    tidH: 'Where the time goes', tidP: 'The median of each step, from the guest looking up the name to the page being drawn.',
    fase: { dns: 'DNS lookup', tcp: 'Connection', tls: 'Encryption (TLS)', foresp: 'Request', svar: 'Response' }, lcpDele: { ttfb: 'First byte', opdag: 'Find the image', hent: 'Fetch the image', tegn: 'Draw it' },
    lcpDeleH: 'LCP taken apart (75th percentile)', siderH: 'The pages', siderP: 'The most visited pages in the last 7 days, with their Core Web Vitals.', sti: 'Page', visn: 'Views',
    landeH: 'Countries', landeT: 'loaded in {ms}', browsereH: 'Browsers', enhederH: 'Devices', dageH: '7 days of guests', dageTitel: 'Bar chart of page views per day',
    enhed: { desktop: 'Computer', mobile: 'Mobile', tablet: 'Tablet' },
    fl: { bots: 'of traffic in Denmark is bots', kvante: 'of Danish connections are quantum-safe', ned: 'Mbit/s median download', latens: 'ms idle latency (median)' },
    rytmeH: 'Denmark’s daily rhythm', rytmeP: 'HTTP traffic in Denmark hour by hour over the last 7 days, relative to the busiest hour. At night it drops to a fifth.', rytmeTitel: 'Curve of Danish internet traffic hour by hour',
    botH: 'Bots in Denmark and at the ford', botP: 'Who crawls the most? AI crawlers in Denmark and worldwide, and the bots that actually came to tingsvad.dk.',
    aiDK: 'AI bots in Denmark', aiVerden: 'AI bots worldwide', aiTing: 'Verified bots at the thing', andel: 'share',
    verifH: 'Denmark’s most active verified bots', verifP: 'Netarkivet is the Royal Danish Library’s robot that keeps the Danish internet for posterity.',
    angrebH: 'Attacks on Denmark and on the thing', angrebP: 'Where do attacks on Danish sites come from, and what does it look like for tingsvad.dk? Countries on both lists are marked.',
    angrebDK: 'Attacks on Denmark (share)', angrebTing: 'Attacks on tingsvad.dk (count)', begge: 'on both lists',
    produktH: 'What stopped them', produkt: { WAF: 'WAF rules', DDOS: 'DDoS protection', ACCESS_RULES: 'Access rules', IP_REPUTATION: 'IP reputation', BOT_MANAGEMENT: 'Bot management', API_SHIELD: 'API Shield' },
    l3H: 'DDoS attacks on the network', l3P: 'Attacks on Danish networks at layers 3 and 4, measured in volume.',
    netH: 'Denmark’s internet', netP: 'The largest networks, devices and speed in Denmark.', netvaerk: 'Largest networks', enheder: 'Devices', hast: 'Speed (Cloudflare’s speed test)',
    hastF: { ned: 'Download', op: 'Upload', latens: 'Idle latency', latensBelastet: 'Latency under load', jitter: 'Jitter', tab: 'Packet loss' }, tests: '{n} measurements over the last 90 days',
    kvanteH: 'Quantum-safe connections', kvanteP: 'A connection is quantum-safe when browser and server agree on the key with an algorithm (ML-KEM) that not even a future quantum computer can break. Cloudflare offers it to every site, including tingsvad.dk, and the thing’s certificate in the Rune workshop is signed with ML-DSA.',
    kvanteJa: 'Quantum-safe', kvanteNej: 'Not quantum-safe',
    udfaldH: 'Outages in Denmark', udfaldIngen: 'Cloudflare Radar has recorded no outages in Denmark in the last 30 days.',
    domaenerH: 'Most used domains in Denmark', kilde: 'Source: Cloudflare Radar (radar.cloudflare.com), CC BY-NC 4.0.',
  };

  async function hentJson(url) { const r = await fetch(url, { credentials: 'same-origin' }); if (!r.ok) { const e = new Error('http ' + r.status); e.status = r.status; throw e; } return r.json(); }
  const flise = (n, t, sub, cls = '') => `<div class="vg-flise ${cls}"><b>${esc(n)}</b><span>${esc(t)}</span>${sub ? `<small>${esc(sub)}</small>` : ''}</div>`;
  const blok = (id, h, p, indhold) => indhold ? `<section class="vg-blok" id="${id}" aria-labelledby="${id}-h"><h2 id="${id}-h">${esc(h)}</h2>${p ? `<p class="vg-intro">${esc(p)}</p>` : ''}${indhold}</section>` : '';
  function liste(rk, valg = {}) {
    if (!rk || !rk.length) return '';
    const m = Math.max(1e-9, ...rk.map(r => r.n));
    return `<ol class="vg-liste${valg.cls ? ' ' + valg.cls : ''}">${rk.map(r => `<li${r.mark ? ' class="vg-mark"' : ''}><span class="vg-l-navn">${esc(r.navn)}${r.sub ? ` <small>${esc(r.sub)}</small>` : ''}</span><span class="vg-l-n">${esc(r.vis != null ? r.vis : tal(r.n))}</span><i style="--w:${(100 * r.n / m).toFixed(1)}%"></i></li>`).join('')}</ol>`;
  }
  const tabelDetaljer = (hoved, rk) => `<details class="vg-tal"><summary>${esc(T.vis)}</summary><div class="vg-tabel-rul" tabindex="0" role="region" aria-label="${esc(T.vis)}"><table class="vg-tabel"><thead><tr>${hoved.map(h => `<th scope="col">${esc(h)}</th>`).join('')}</tr></thead><tbody>${rk.map(r => `<tr>${r.map((c, i) => i ? `<td>${esc(c)}</td>` : `<th scope="row">${esc(c)}</th>`).join('')}</tr>`).join('')}</tbody></table></div></details>`;
  const mangler = f => f && f.length ? `<details class="vg-tal vg-mangler"><summary>${esc(T.mangler)}</summary><p class="vg-note">${esc(T.manglerP)}</p><ul>${f.map(x => `<li><code>${esc(x)}</code></li>`).join('')}</ul></details>` : '';
  /** En vandret stablet bjælke af dele {navn, v, farve}; procent eller ms. */
  function bjaelke(dele, enhed) {
    const d = dele.filter(x => x.v != null && x.v > 0), s = d.reduce((a, x) => a + x.v, 0); if (!s) return '';
    return `<div class="mg-bjaelke" role="img" aria-label="${esc(d.map(x => `${x.navn}: ${tal(x.v)} ${enhed}`).join(', '))}">${d.map(x => `<span style="flex:${x.v};background:${x.farve}" title="${esc(x.navn)}: ${esc(tal(x.v))} ${enhed}"></span>`).join('')}</div>
      <ul class="mg-forklaring">${d.map(x => `<li><i style="background:${x.farve}"></i>${esc(x.navn)} <b>${esc(tal(x.v))} ${esc(enhed)}</b></li>`).join('')}</ul>`;
  }
  function soejler(dage, titel, felt) {
    const W = 1000, H = 200, top = 18, bund = 30, n = dage.length; if (!n) return '';
    const bw = (W - 16) / n, maks = Math.max(1, ...dage.map(d => d[felt] || 0)), y = v => top + (H - top - bund) * (1 - v / maks);
    const p = dage.map((d, i) => { const x = 8 + i * bw + bw * 0.18, w = bw * 0.64, v = d[felt] || 0; return `<rect class="vg-soejle mg-soejle" x="${x.toFixed(1)}" y="${y(v).toFixed(1)}" width="${w.toFixed(1)}" height="${(y(0) - y(v)).toFixed(1)}" rx="3"><title>${esc(datoKort(d.dag))}: ${esc(tal(v))}</title></rect><text class="vg-akse-t" x="${(x + w / 2).toFixed(1)}" y="${H - 9}" text-anchor="middle">${esc(datoKort(d.dag))}</text>`; }).join('');
    return `<svg class="vg-soejler" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(titel)}"><line class="vg-akse vg-nul" x1="8" x2="${W - 8}" y1="${y(0)}" y2="${y(0)}"/>${p}<text class="vg-akse-t" x="${W - 8}" y="${top - 4}" text-anchor="end">${esc(tal(maks))}</text></svg>`;
  }

  /* ── Hastigheden ── */
  const GRAENSE = { lcp: [2500, 4000], inp: [200, 500], cls: [0.1, 0.25] };
  const vurder = (k, v) => v == null ? null : v <= GRAENSE[k][0] ? 'god' : v <= GRAENSE[k][1] ? 'middel' : 'daarlig';
  const vVis = (k, v) => v == null ? '–' : k === 'cls' ? tal(v, 2) : v >= 1000 ? tal(v / 1000, 1) + ' s' : tal(v) + ' ms';
  const msVis = v => v == null ? '–' : v >= 1000 ? tal(v / 1000, 1) + ' s' : tal(v) + ' ms';
  const FARVE = { god: '#3fb46c', middel: '#d9a441', daarlig: '#d4583f' };
  function hastighed(h) {
    if (!h || h.tom || !(h.vitals || h.indlaes || h.besoeg)) return `<p class="vg-advarsel" role="note">${esc(T.tom)}</p>${mangler(h && h.fejl)}`;
    const v = h.vitals || {};
    const vflise = k => { const r = vurder(k, v[k]); return `<div class="vg-flise mg-vital${r ? ' mg-' + r : ''}"><b>${esc(vVis(k, v[k]))}</b><span>${esc(T.vitalNavn[k])}</span><small>${r ? esc(T.vurd[r]) + ' · ' : ''}${esc(T.p75)}</small></div>`; };
    const fliser = `<div class="vg-fliser">${vflise('lcp')}${vflise('inp')}${vflise('cls')}${h.indlaes ? flise(msVis(h.indlaes.p50), T.fliser.indlaes, h.lcpDele && h.lcpDele.ttfb != null ? `${T.fliser.ttfb}: ${msVis(h.lcpDele.ttfb)}` : `FCP: ${msVis(h.indlaes.fcp50)}`, 'vg-hoved') : ''}${h.besoeg ? flise(tal(h.besoeg.besoeg), T.fliser.besoeg, fmt(T.fliser.visninger, { n: tal(h.besoeg.visninger) }), 'vg-graa') : ''}</div>`;
    const ford = v.fordeling ? `<div class="mg-vitals">${['lcp', 'inp', 'cls'].map(k => { const f = v.fordeling[k]; return `<article class="mg-vitalkort"><h3>${esc(T.vitalNavn[k])}</h3><p>${esc(T.vitalForkl[k])}</p>${f ? bjaelke([{ navn: T.vurd.god, v: f.god, farve: FARVE.god }, { navn: T.vurd.middel, v: f.middel, farve: FARVE.middel }, { navn: T.vurd.daarlig, v: f.daarlig, farve: FARVE.daarlig }], '%') : '<p class="vg-note">–</p>'}</article>`; }).join('')}</div>` : '';
    const FF = ['#7cc4ff', '#8fe3d0', '#c79bff', '#e6bd68', '#ef9a62'];
    const faser = h.faser ? bjaelke(Object.keys(T.fase).map((k, i) => ({ navn: T.fase[k], v: h.faser[k], farve: FF[i] })), 'ms') : '';
    const lcpd = h.lcpDele ? `<h3 class="mg-h3">${esc(T.lcpDeleH)}</h3>${bjaelke(Object.keys(T.lcpDele).map((k, i) => ({ navn: T.lcpDele[k], v: h.lcpDele[k], farve: FF[i] })), 'ms')}` : '';
    const celle = (k, x) => { const r = vurder(k, x); return `<td class="mg-c${r ? ' mg-' + r : ''}">${esc(vVis(k, x))}</td>`; };
    const sider = h.sider && h.sider.length ? `<div class="vg-tabel-rul" tabindex="0" role="region" aria-label="${esc(T.siderH)}"><table class="vg-tabel mg-sider"><thead><tr><th scope="col">${esc(T.sti)}</th><th scope="col">${esc(T.visn)}</th><th scope="col">LCP</th><th scope="col">INP</th><th scope="col">CLS</th></tr></thead><tbody>${h.sider.map(s => `<tr><th scope="row"><a href="${esc(s.sti)}"><code>${esc(s.sti)}</code></a></th><td>${esc(tal(s.visninger))}</td>${celle('lcp', s.lcp)}${celle('inp', s.inp)}${celle('cls', s.cls)}</tr>`).join('')}</tbody></table></div>` : '';
    const tre = `<div class="vg-tre">${h.lande ? `<div><h3>${esc(T.landeH)}</h3>${liste(h.lande.map(l => ({ navn: landNavn(l.kode), sub: l.indlaes != null ? fmt(T.landeT, { ms: msVis(l.indlaes) }) : '', n: l.visninger })))}</div>` : ''}${h.browsere ? `<div><h3>${esc(T.browsereH)}</h3>${liste(h.browsere.map(b => ({ navn: b.navn, n: b.visninger })))}</div>` : ''}${h.enheder ? `<div><h3>${esc(T.enhederH)}</h3>${liste(h.enheder.map(e => ({ navn: T.enhed[e.navn] || e.navn, n: e.visninger })))}</div>` : ''}</div>`;
    const dage = h.dage && h.dage.length ? `<div class="vg-tavle vg-tavle-pad">${soejler(h.dage, T.dageTitel, 'visninger')}</div>` : '';
    return fliser + blok('mg-ford', T.fordH, T.fordP, ford) + blok('mg-tid', T.tidH, T.tidP, faser + lcpd) + blok('mg-sider', T.siderH, T.siderP, sider) + (tre.length > 30 ? `<section class="vg-blok">${tre}</section>` : '') + blok('mg-dage', T.dageH, '', dage) + mangler(h.fejl);
  }

  /* ── Danmark lige nu ── */
  function rytme(r) {
    if (!r || r.length < 2) return '';
    const W = 1000, H = 210, top = 14, bund = 30, n = r.length, x = i => 8 + (W - 16) * i / (n - 1), y = v => top + (H - top - bund) * (1 - (v || 0));
    const linje = r.map((p, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)} ${y(p.v).toFixed(1)}`).join(' ');
    const dage = r.map((p, i) => [p, i]).filter(([p]) => p.t.endsWith('T00')).map(([p, i]) => `<line class="vg-akse" x1="${x(i).toFixed(1)}" x2="${x(i).toFixed(1)}" y1="${top}" y2="${H - bund}"/><text class="vg-akse-t" x="${(x(i) + 4).toFixed(1)}" y="${H - 9}">${esc(datoKort(p.t.slice(0, 10)))}</text>`).join('');
    return `<svg class="vg-soejler mg-rytme" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(T.rytmeTitel)}">${dage}<path class="mg-flade" d="${linje} L${x(n - 1).toFixed(1)} ${y(0)} L${x(0)} ${y(0)} Z"/><path class="mg-linje" d="${linje}"/></svg>`;
  }
  const katNavn = k => ({ 'Page Preview': da ? 'forhåndsvisning' : 'link preview', 'AI Assistant': da ? 'AI-assistent' : 'AI assistant', 'Monitoring & Analytics': da ? 'overvågning' : 'monitoring', 'Academic Research': da ? 'forskning/arkiv' : 'research/archive', 'Advertising & Marketing': da ? 'annoncer' : 'advertising', 'Search Engine Optimization': 'SEO', 'Search Engine Crawler': da ? 'søgemaskine' : 'search engine', 'AI Crawler': da ? 'AI-crawler' : 'AI crawler' }[k] || k);
  function danmark(d, crawl, vaern) {
    const fl = `<div class="vg-fliser">${d.bots ? flise(pct(d.bots.bot), T.fl.bots, '', 'vg-hoved') : ''}${d.kvante ? flise(pct(d.kvante.ja), T.fl.kvante) : ''}${d.hastighed ? flise(tal(d.hastighed.ned), T.fl.ned) : ''}${d.hastighed ? flise(tal(d.hastighed.latens), T.fl.latens, '', 'vg-graa') : ''}</div>`;
    const ry = d.rytme ? `<div class="vg-tavle vg-tavle-pad">${rytme(d.rytme)}</div>` : '';
    const andel = l => (l || []).filter(x => x.navn !== 'other').map(x => ({ navn: x.navn, n: x.pct, vis: pct(x.pct, x.pct < 1 ? 1 : 0) }));
    const ting = crawl && crawl.bots ? crawl.bots.filter(b => b.firma).slice(0, 9).map(b => ({ navn: b.navn, sub: b.firma, n: b.n7 })) : [];
    const bots = (d.aiDK || d.aiVerden || ting.length) ? `<div class="vg-tre"><div><h3>${esc(T.aiDK)}</h3>${liste(andel(d.aiDK))}</div><div><h3>${esc(T.aiVerden)}</h3>${liste(andel(d.aiVerden))}</div>${ting.length ? `<div><h3>${esc(T.aiTing)}</h3>${liste(ting)}</div>` : ''}</div>` : '';
    const verif = d.verificerede ? liste(d.verificerede.map(b => ({ navn: b.navn, sub: `${b.firma} · ${katNavn(b.kat)}`, n: b.pct, vis: pct(b.pct, b.pct < 1 ? 1 : 0), mark: /kb\.dk/.test(b.navn) }))) : '';
    const tingLande = new Set(((vaern && vaern.lande) || []).map(l => l.kode));
    const dkLande = new Set((d.angrebFra || []).map(l => l.kode));
    const angreb = d.angrebFra ? `<div class="vg-tre mg-to"><div><h3>${esc(T.angrebDK)}</h3>${liste(d.angrebFra.map(l => ({ navn: landNavn(l.kode), sub: tingLande.has(l.kode) ? T.begge : '', n: l.pct, vis: pct(l.pct, 1), mark: tingLande.has(l.kode) })))}</div>${vaern && vaern.lande ? `<div><h3>${esc(T.angrebTing)}</h3>${liste(vaern.lande.slice(0, 10).map(l => ({ navn: landNavn(l.kode), sub: dkLande.has(l.kode) ? T.begge : '', n: l.n, mark: dkLande.has(l.kode) })))}</div>` : ''}</div>`
      + (d.vaernProdukter ? `<h3 class="mg-h3">${esc(T.produktH)}</h3>${bjaelke(d.vaernProdukter.filter(p => p.pct >= 0.01).map((p, i) => ({ navn: T.produkt[p.navn] || p.navn, v: p.pct, farve: ['#ef7a62', '#e6bd68', '#7cc4ff', '#c79bff', '#5fd38a', '#8aa0ad'][i % 6] })), '%')}` : '') : '';
    const l3 = d.l3 ? liste(d.l3.map(x => ({ navn: x.navn === 'other' ? (da ? 'Andet' : 'Other') : x.navn, n: x.pct, vis: pct(x.pct, 1) }))) : '';
    const hs = d.hastighed;
    const net = `<div class="vg-tre">${d.netvaerk ? `<div><h3>${esc(T.netvaerk)}</h3>${liste(d.netvaerk.map(x => ({ navn: x.navn, sub: 'AS' + x.asn, n: x.pct, vis: pct(x.pct, 1) })))}</div>` : ''}${d.enheder ? `<div><h3>${esc(T.enheder)}</h3>${liste([[T.enhed.desktop, d.enheder.desktop], [T.enhed.mobile, d.enheder.mobil]].map(([n, v]) => ({ navn: n, n: v, vis: pct(v) })))}</div>` : ''}${hs ? `<div><h3>${esc(T.hast)}</h3><dl class="mg-dl">${[['ned', hs.ned, 'Mbit/s'], ['op', hs.op, 'Mbit/s'], ['latens', hs.latens, 'ms'], ['latensBelastet', hs.latensBelastet, 'ms'], ['jitter', hs.jitter, 'ms'], ['tab', hs.tab, '%']].map(([k, v, e]) => `<div><dt>${esc(T.hastF[k])}</dt><dd>${esc(tal(v, k === 'tab' ? 2 : 0))} ${esc(e)}</dd></div>`).join('')}</dl>${hs.tests ? `<p class="vg-note">${esc(fmt(T.tests, { n: tal(hs.tests) }))}</p>` : ''}</div>` : ''}</div>`;
    const kv = d.kvante ? bjaelke([{ navn: T.kvanteJa, v: d.kvante.ja, farve: '#c79bff' }, { navn: T.kvanteNej, v: d.kvante.nej, farve: '#5c666d' }], '%') : '';
    const udfald = d.udfald ? (d.udfald.length ? `<ul class="mg-udfald">${d.udfald.map(u => `<li><b>${esc(kl(u.start))}</b>${u.aarsag ? ` · ${esc(u.aarsag)}` : ''}${u.beskrivelse ? `<br><span class="vg-note">${esc(u.beskrivelse)}</span>` : ''}</li>`).join('')}</ul>` : `<p class="vg-note">${esc(T.udfaldIngen)}</p>`) : '';
    const dom = d.domaener ? `<ol class="mg-domaener">${d.domaener.map(x => `<li><code>${esc(x.domaene)}</code></li>`).join('')}</ol>` : '';
    return fl + blok('mg-rytme', T.rytmeH, T.rytmeP, ry) + blok('mg-bots', T.botH, T.botP, bots) + blok('mg-verif', T.verifH, T.verifP, verif) + blok('mg-angreb', T.angrebH, T.angrebP, angreb)
      + blok('mg-l3', T.l3H, T.l3P, l3) + blok('mg-kvante', T.kvanteH, T.kvanteP, kv) + blok('mg-net', T.netH, T.netP, net) + blok('mg-udfald', T.udfaldH, '', udfald) + blok('mg-domaener', T.domaenerH, '', dom)
      + `<p class="vg-note">${esc(T.kilde)}</p>` + mangler(d.fejl);
  }

  /* ── start ── */
  async function start() {
    rod.setAttribute('aria-busy', 'true');
    rod.innerHTML = `<p class="vg-status">${esc(T.henter)}</p>`;
    let data = null, eks = tvang, crawl = null, vaern = null, konf = {};
    try {
      const h = !tvang && await hentJson('/api/ting-ai/health').catch(() => null);
      konf = (h && h.ok && h.data && h.data.configured) || {};
      const hent = sti => hentJson('/api/ting-ai/' + sti + '?lang=' + lang).then(j => (j && j.ok ? j.data : null)).catch(() => null);
      if (side === 'hastighed' && konf.hastighed) data = await hent('hastighed');
      if (side === 'danmark') {
        [data, crawl, vaern] = await Promise.all([konf.radar ? hent('danmark') : null, konf.vagt ? hent('crawlere') : null, konf.vagt ? hent('vaern') : null]);
      }
    } catch (e) { data = null; }
    if (side === 'danmark' && (!data || !data.genereret)) {
      try { const e = await hentJson('/assets/vagt-eksempel.json'); data = e.danmark; crawl = crawl || e.crawl; vaern = vaern || e.vaern; eks = true; }
      catch (e) { rod.removeAttribute('aria-busy'); rod.innerHTML = `<p class="vg-advarsel" role="status">${esc(T.fejl)}</p>`; return; }
    }
    const top = data && data.genereret ? `<div class="vg-bjaelke"><p class="vg-status">${esc(fmt(T.opdateret, { t: kl(data.genereret) }))}</p></div>` : '';
    rod.innerHTML = top + (eks ? `<p class="vg-advarsel" role="note">${esc(tvang ? T.eksTvang : T.eksempel)}</p>` : '') + (side === 'danmark' ? danmark(data, crawl, vaern) : hastighed(data));
    rod.removeAttribute('aria-busy');
    rod.classList.toggle('vg-eksempel', eks);
    dispatchEvent(new Event('tv:indhold'));
  }
  start();
  }
})();
