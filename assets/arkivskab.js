/* tingsvad.dk — Det europæiske arkivskab (runde 12): hvor ender data, når man selv vælger? Siden måler fire lagre, der
   er låst til EU-jurisdiktionen (Durable Object, D1, KV, R2), og et Durable Object uden lås, via /api/ting-ai/eu/skab,
   og tegner dem på et Europakort. Knappen lægger et segl (tid og datacenter, intet andet) i alle fire via eu/segl.
   Uden Worker (eller med ?eksempel) vises mærkede eksempeldata. */
(function () {
  'use strict';
  const rod = document.getElementById('arkivskab');
  if (!rod) return;
  const da = document.documentElement.lang !== 'en', lang = da ? 'da' : 'en', loc = da ? 'da-DK' : 'en-GB';
  const tvang = /[?&]eksempel\b/.test(location.search);
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const tal = n => Number(n || 0).toLocaleString(loc);
  const reduce = () => { try { return matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return false; } };
  const fmt = (s, v) => String(s).replace(/\{(\w+)\}/g, (m, k) => (k in v ? v[k] : m));
  const T = da ? {
    maaler: 'Måler skabet …', maalt: 'Målt nu', eksempel: 'Eksempeldata – ikke målt. Fjern ?eksempel fra adressen for at måle.', ikkeKlar: 'Skabet er ved at blive bygget. Indtil alle lagre er oprettet, viser siden eksempeldata.',
    du: 'Du blev besvaret i {by}', laas: 'Låst til EU', uden: 'Uden lås', ikkeOprettet: 'Ikke oprettet endnu', svar: 'svarede på {ms} ms', fejl: 'svarede ikke',
    lagre: { do: ['Durable Object', 'Et objekt med eget SQLite-lager. Låst med env.EU_SKAB.jurisdiction("eu").'], d1: ['D1-database', 'Oprettet med --jurisdiction=eu. Databasen kører og gemmer kun i EU.'], kv: ['Workers KV', 'Navnerum oprettet med --jurisdiction=eu. Data gemmes kun varigt i EU.'], r2: ['R2-bucket', 'Bucket oprettet med --jurisdiction=eu. Objekter gemmes og behandles kun i EU.'], fri: ['Durable Object uden lås', 'Samme klasse, almindeligt navnerum. Det bor dér, hvor det første gang blev brugt.'] },
    melder: 'melder selv', region: 'region', primaer: 'primær kopi', replika: 'replika', segl: '{n} segl', idag: '{n} i dag', ukendtSted: 'Kan ikke selv fortælle, hvor det ligger: jurisdiktionen er løftet.',
    knap: 'Læg et segl i skabet', sender: 'Seglet bæres ind i skabet …', lagt: 'Seglet er lagt i {n} lagre på {ms} ms. Kun tidspunktet og datacentret {by} blev gemt.', kvote: 'Skabet tager kun imod få segl ad gangen. Vent lidt.',
    kortTitel: 'Europakort over, hvor arkivskabets lagre svarer fra', kortDesc: 'Du blev besvaret i {du}. Det låste Durable Object bor i {eu}, det ulåste i {fri}. D1 svarer fra {d1}.',
    leg: { du: 'Dig', eu: 'Låst til EU', fri: 'Uden lås', d1: 'D1' }, verden: 'Verden', europa: 'Europa',
    pointeH: 'Samme kode, to forskellige steder', pointe: 'Det ulåste objekt bor i {fri}, fordi det første kald til det kom fra den anden side af Atlanten, og et Durable Object bliver skabt dér, hvor det først bruges. Det låste objekt fik præcis det samme kald, men bor i {eu}, fordi det er låst til EU. Forskellen er én linje kode: .jurisdiction("eu").', pointeEns: 'Begge objekter bor i Europa lige nu: det låste i {eu}, det ulåste i {fri}. Forskellen er, at kun det låste er lovet at blive dér.',
    r: { h: 'Seglets rejse', intro: 'Tryk på »Læg et segl i skabet« ovenfor, så følger diagrammet seglet hele vejen: fra knappen i din browser gennem Cloudflares kant og de to Workers, ud til de fem lagre og hjem igen. Alle tider bliver målt på dit eget segl.',
      introEfter: 'Sådan rejste dit segl. Din browser målte hele turen og forbindelsen, Workeren målte sit eget arbejde og hver enkelt skrivning, og resten er nettet frem og tilbage.',
      svgTitel: 'Diagram over seglets rejse fra knappen til lagrene og tilbage', browser: 'Knappen', klik: 'din browser', kanten: 'Kanten', opkobl: 'ny forbindelse {ms} ms', genbrugt: 'genbrugt forbindelse', router: 'router · HTMLRewriter', samme: 'samme datacenter',
      kvote: 'kvotetjek {ms} ms', kvoteU: 'kvotetjek', arbejde: 'arbejde i alt {ms} ms', ikkeMaalt: 'egen tid ikke målt', navn: { do: 'Durable Object', d1: 'D1-database', kv: 'Workers KV', r2: 'R2-bucket', fri: 'Durable Object uden lås' },
      euSkjult: 'EU · stedet vises ikke', ukendt: 'svarede ikke', udenLaas: 'uden lås', ur: 't = {ms} ms', langsom: 'Afspillet ca. {x} gange langsommere end virkeligheden. Uret viser den virkelige tid.', igen: 'Afspil igen',
      faldTitel: 'Tidslinje over seglets rejse i millisekunder', f: { ud: 'Fra knappen til kanten i {by}', binding: 'Kanten → tingsvad-site → tingsvad-ting-ai (service binding)', samme: 'samme datacenter', kvote: 'Kvotetjek og opstart i Workeren', hjem: 'Svaret tilbage til din browser', ialt: 'Hele turen, målt i din browser' },
      pakke: 'Selve pakken er et POST til /api/ting-ai/eu/segl uden indhold. Durable Objects og D1 får hver en række med {raekke}, KV får {kv}, og R2 tæller dagens segl op. Intet navn og ingen IP-adresse.' },
  } : {
    maaler: 'Measuring the cabinet …', maalt: 'Measured now', eksempel: 'Sample data – not measured. Remove ?eksempel from the address to measure.', ikkeKlar: 'The cabinet is being built. Until every store has been created, the page shows sample data.',
    du: 'You were answered in {by}', laas: 'Locked to the EU', uden: 'No lock', ikkeOprettet: 'Not created yet', svar: 'answered in {ms} ms', fejl: 'did not answer',
    lagre: { do: ['Durable Object', 'An object with its own SQLite storage. Locked with env.EU_SKAB.jurisdiction("eu").'], d1: ['D1 database', 'Created with --jurisdiction=eu. The database runs and stores only in the EU.'], kv: ['Workers KV', 'Namespace created with --jurisdiction=eu. Data is only durably stored in the EU.'], r2: ['R2 bucket', 'Bucket created with --jurisdiction=eu. Objects are stored and processed only in the EU.'], fri: ['Durable Object without a lock', 'Same class, ordinary namespace. It lives where it was first used.'] },
    melder: 'reports', region: 'region', primaer: 'primary copy', replika: 'replica', segl: '{n} seals', idag: '{n} today', ukendtSted: 'Cannot tell where it lives: the jurisdiction is the promise.',
    knap: 'Put a seal in the cabinet', sender: 'The seal is carried into the cabinet …', lagt: 'The seal was put in {n} stores in {ms} ms. Only the time and the data centre {by} were stored.', kvote: 'The cabinet only takes a few seals at a time. Wait a moment.',
    kortTitel: 'Map of Europe showing where the archive cabinet’s stores answer from', kortDesc: 'You were answered in {du}. The locked Durable Object lives in {eu}, the unlocked one in {fri}. D1 answers from {d1}.',
    leg: { du: 'You', eu: 'Locked to the EU', fri: 'No lock', d1: 'D1' }, verden: 'World', europa: 'Europe',
    pointeH: 'Same code, two different places', pointe: 'The unlocked object lives in {fri}, because the first call to it came from the other side of the Atlantic, and a Durable Object is created where it is first used. The locked object received exactly the same call, but lives in {eu}, because it is locked to the EU. The difference is one line of code: .jurisdiction("eu").', pointeEns: 'Both objects live in Europe right now: the locked one in {eu}, the unlocked one in {fri}. The difference is that only the locked one is promised to stay there.',
    r: { h: 'The seal’s journey', intro: 'Press »Put a seal in the cabinet« above, and the diagram follows the seal all the way: from the button in your browser through Cloudflare’s edge and the two Workers, out to the five stores and home again. Every time is measured on your own seal.',
      introEfter: 'This is how your seal travelled. Your browser measured the whole trip and the connection, the Worker measured its own work and every single write, and the rest is the network there and back.',
      svgTitel: 'Diagram of the seal’s journey from the button to the stores and back', browser: 'The button', klik: 'your browser', kanten: 'The edge', opkobl: 'new connection {ms} ms', genbrugt: 'reused connection', router: 'router · HTMLRewriter', samme: 'same data centre',
      kvote: 'quota check {ms} ms', kvoteU: 'quota check', arbejde: 'work in total {ms} ms', ikkeMaalt: 'own time not measured', navn: { do: 'Durable Object', d1: 'D1 database', kv: 'Workers KV', r2: 'R2 bucket', fri: 'Durable Object, no lock' },
      euSkjult: 'EU · place not shown', ukendt: 'did not answer', udenLaas: 'no lock', ur: 't = {ms} ms', langsom: 'Played about {x} times slower than reality. The clock shows real time.', igen: 'Play again',
      faldTitel: 'Timeline of the seal’s journey in milliseconds', f: { ud: 'From the button to the edge in {by}', binding: 'Edge → tingsvad-site → tingsvad-ting-ai (service binding)', samme: 'same data centre', kvote: 'Quota check and start-up in the Worker', hjem: 'The answer back to your browser', ialt: 'The whole trip, measured in your browser' },
      pakke: 'The packet itself is a POST to /api/ting-ai/eu/segl with no body. The Durable Objects and D1 each get a row with {raekke}, KV gets {kv}, and R2 counts up the day’s seals. No name and no IP address.' },
  };
  const REGION = { WEUR: [4.9, 52.4], EEUR: [21, 52.2], WNAM: [-121.9, 37.4], ENAM: [-77.5, 39], APAC: [103.8, 1.35], OC: [151.2, -33.9] };
  const proj = (lon, lat) => [500 + lon * 1000 / 360, 250 - lat * 1000 / 360];
  const VIEW = { europa: [440, 60, 220, 96], verden: [0, 28, 1000, 385] };
  const EKS = { worker: 'CPH', lagre: { do: { ok: true, ms: 41, jurisdiktion: 'eu', colo: 'FRA', segl: 128, idag: 9 }, d1: { ok: true, ms: 23, region: 'WEUR', primaer: true, colo: 'AMS', segl: 128, idag: 9 }, kv: { ok: true, ms: 6 }, r2: { ok: true, ms: 19, idag: 9 } }, uden: { do: { ok: true, ms: 12, jurisdiktion: null, colo: 'CPH', segl: 128, idag: 9 } }, jurisdiktion: 'eu' };
  let verden = null, navne = {}, visning = 'europa', sidst = null, eks = tvang, rejse = null, anim = 0;

  const xy = k => (verden && k && (verden.colo[k] || (verden.net[k] && verden.net[k].slice(0, 2)))) || null;
  const by = k => { if (!k) return '–'; const n = navne[k]; if (Array.isArray(n)) return `${n[da ? 0 : 1]} (${k})`; if (verden && verden.net[k]) return `${verden.net[k][2]} (${k})`; return k; };
  async function hentJson(url, o) { const r = await fetch(url, Object.assign({ credentials: 'same-origin' }, o || {})); let j = null; try { j = await r.json(); } catch (e) { } return { status: r.status, j }; }

  function kort(m) {
    const [vx, vy, vw, vh] = VIEW[visning], k = 1000 / vw, r = n => (n / k).toFixed(2);
    const L = m.lagre || {}, U = m.uden || {};
    const pDu = xy(m.worker), pEu = L.do && L.do.ok ? xy(L.do.colo) : null, pFri = U.do && U.do.ok ? xy(U.do.colo) : null;
    const pD1 = L.d1 && L.d1.ok ? (xy(L.d1.colo) || (REGION[L.d1.region] && proj(...REGION[L.d1.region]))) : null;
    const bue = (a, b, cls) => { if (!a || !b || (a[0] === b[0] && a[1] === b[1])) return ''; const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2 - Math.max(3, Math.hypot(b[0] - a[0], b[1] - a[1]) * .3); return `<path class="ik-bue ${cls}" d="M${a[0]} ${a[1]} Q${mx.toFixed(1)} ${my.toFixed(1)} ${b[0]} ${b[1]}" style="stroke-width:${r(1.6)};stroke-dasharray:${r(4)} ${r(4)}"/>`; };
    const et = (p, t, cls, dx, dy) => p ? `<text class="ik-etiket ${cls}" x="${(p[0] + dx / k).toFixed(2)}" y="${(p[1] + dy / k).toFixed(2)}" style="font-size:${r(12)}px;stroke-width:${r(3)}px">${esc(t)}</text>` : '';
    const net = Object.values(verden.colo).concat(Object.values(verden.net).map(a => a.slice(0, 2))).map(([x, y]) => `<circle class="ik-net" cx="${x}" cy="${y}" r="${r(1.3)}"/>`).join('');
    const ruder = (p, cls, s = 5) => p ? `<path class="${cls}" d="M${p[0]} ${(p[1] - s / k).toFixed(2)} L${(p[0] + s / k).toFixed(2)} ${p[1]} L${p[0]} ${(p[1] + s / k).toFixed(2)} L${(p[0] - s / k).toFixed(2)} ${p[1]} Z"/>` : '';
    const desc = fmt(T.kortDesc, { du: by(m.worker), eu: L.do && L.do.ok ? by(L.do.colo) : '–', fri: U.do && U.do.ok ? by(U.do.colo) : '–', d1: L.d1 && L.d1.ok ? (L.d1.colo ? by(L.d1.colo) : L.d1.region || '–') : '–' });
    return `<svg class="ik-kort" viewBox="${vx} ${vy} ${vw} ${vh}" role="img" aria-labelledby="as-kort-t as-kort-d" preserveAspectRatio="xMidYMid meet">
      <title id="as-kort-t">${esc(T.kortTitel)}</title><desc id="as-kort-d">${esc(desc)}</desc>
      <rect class="ik-hav" x="0" y="0" width="1000" height="500"/><path class="ik-land" d="${verden.land}" style="stroke-width:${r(.5)}"/>
      <g>${net}</g><g>${bue(pDu, pEu, 'as-bue-eu')}${bue(pDu, pFri, 'as-bue-fri')}${bue(pDu, pD1, 'ik-bue-d1')}</g>
      <g>${pD1 ? `<rect class="ik-d1" x="${(pD1[0] - 4 / k).toFixed(2)}" y="${(pD1[1] - 4 / k).toFixed(2)}" width="${r(8)}" height="${r(8)}" rx="${r(1.5)}"/>` : ''}${ruder(pEu, 'as-eu', 6)}${ruder(pFri, 'as-fri', 5)}
      ${pDu ? `<circle class="ik-du-ring" cx="${pDu[0]}" cy="${pDu[1]}" r="${r(9)}"/><circle class="ik-du" cx="${pDu[0]}" cy="${pDu[1]}" r="${r(3.6)}"/>` : ''}
      ${et(pDu, T.leg.du, 'ik-et-du', 9, -8)}${et(pEu, 'EU · ' + ((L.do && L.do.colo) || ''), 'as-et-eu', 8, 14)}${et(pFri, T.leg.fri, 'as-et-fri', 8, pDu && pFri[0] === pDu[0] && pFri[1] === pDu[1] ? 18 : -8)}${et(pD1, 'D1', 'ik-et-d1', 7, 14)}</g></svg>`;
  }
  function lagerkort(id, x, laast) {
    const [navn, forkl] = T.lagre[id];
    let status;
    if (!x || x.oprettet === false) status = `<span class="ik-pille">${esc(T.ikkeOprettet)}</span>`;
    else if (!x.ok) status = `<span class="ik-pille ik-fejl">${esc(T.fejl)}</span>`;
    else status = `<span class="ik-pille ik-live">${esc(fmt(T.svar, { ms: x.ms }))}</span>`;
    const linjer = [];
    if (x && x.ok) {
      if ('jurisdiktion' in x) linjer.push(`${T.melder}: <code>jurisdiction = ${esc(x.jurisdiktion == null ? 'undefined' : '"' + x.jurisdiktion + '"')}</code>`);
      if (x.colo && id !== 'd1') linjer.push(esc(by(x.colo)));
      if (id === 'd1') linjer.push(`${esc(T.region)} <b>${esc(x.region || '–')}</b>${x.colo ? ' · ' + esc(by(x.colo)) : ''}${x.primaer != null ? ' · ' + esc(x.primaer ? T.primaer : T.replika) : ''}`);
      if (id === 'kv' || id === 'r2') linjer.push(esc(T.ukendtSted));
      if (x.segl != null) linjer.push(esc(fmt(T.segl, { n: tal(x.segl) })) + (x.idag != null ? ' · ' + esc(fmt(T.idag, { n: tal(x.idag) })) : ''));
      else if (x.idag != null) linjer.push(esc(fmt(T.idag, { n: tal(x.idag) })));
    }
    return `<article class="as-lager${laast ? ' as-laast' : ' as-ulaast'}"><header><h3>${esc(navn)}</h3><span class="as-maerke">${laast ? '🔒 ' + esc(T.laas) : esc(T.uden)}</span></header><p class="as-forkl">${esc(forkl)}</p>${status}${linjer.length ? `<ul>${linjer.map(l => `<li>${l}</li>`).join('')}</ul>` : ''}</article>`;
  }

  /* ── Seglets rejse: kæden fra knappen til de fem lagre og hjem igen, med de målte tider ── */
  const LAGRE = [['do', true], ['d1', true], ['kv', true], ['r2', true], ['fri', false]];
  const lagerData = (m, id) => (id === 'fri' ? (m.uden || {}).do : (m.lagre || {})[id]) || {};
  const sted = (id, x) => { if (!x || !x.ok) return T.r.ukendt; if (id === 'd1') return [x.region, x.colo ? by(x.colo) : ''].filter(Boolean).join(' · ') || '–'; if (id === 'kv' || id === 'r2') return T.r.euSkjult; return by(x.colo); };
  const skala = R => Math.round(Math.min(25, Math.max(2, 5000 / Math.max(1, R.total))));
  /** Deler turen op: forbindelse og net (browserens Resource Timing), Workerens eget arbejde (server) og hver skrivning. */
  function byggRejse(d, total, e) {
    const L = LAGRE.map(([id, laast]) => { const x = lagerData(d, id); return { id, laast, x, ms: x.ok && Number.isFinite(x.ms) ? x.ms : null }; });
    const maks = Math.max(0, ...L.map(l => l.ms || 0));
    let opkobl = 0, venter = total, ned = 0;
    if (e && e.responseStart > 0 && e.requestStart > 0) { opkobl = Math.max(0, e.connectEnd - e.domainLookupStart) || 0; venter = Math.max(0, e.responseStart - e.requestStart); ned = Math.max(0, e.responseEnd - e.responseStart); }
    const server = Number.isFinite(d.server) ? Math.max(d.server, maks) : maks;
    const ud = Math.round(opkobl + Math.max(0, venter - server) / 2);
    return { total, ud, server, kvote: Math.max(0, server - maks), hjem: Math.max(0, total - ud - server), maalt: Number.isFinite(d.server), lagre: L, gaest: d.gaest, worker: d.worker, opkobl: Math.round(opkobl), ned: Math.round(ned), t: Date.now(), ny: true };
  }
  const lodret = () => rod.clientWidth < 720;
  function rejseSvg(R, m) {
    const V = lodret(), bh = 46, gap = 10, L = R ? R.lagre : LAGRE.map(([id, laast]) => ({ id, laast, x: lagerData(m, id), ms: null }));
    const gaest = R ? R.gaest : m.worker, wk = R ? R.worker : m.worker, til = R ? 'ik-live' : 'ik-fra';
    let W, H, C, S, ledH, sbTekst;
    if (!V) {
      const top = 40, hoej = 5 * (bh + gap) - gap, midY = top + hoej / 2; W = 1150; H = top + hoej + 22;
      C = { b: { x: 10, w: 150, h: 84 }, k: { x: 195, w: 170, h: 84 }, s: { x: 400, w: 170, h: 84 }, a: { x: 660, w: 200, h: 104 } };
      Object.values(C).forEach(c => { c.y = midY - c.h / 2; });
      S = L.map((l, i) => ({ x: 890, y: top + i * (bh + gap), w: 250 }));
      const kurve = (x1, y1, x2, y2) => { const mx = (x1 + x2) / 2; return `M${x1} ${y1.toFixed(1)} C${mx} ${y1.toFixed(1)} ${mx} ${y2.toFixed(1)} ${x2} ${y2.toFixed(1)}`; };
      ledH = { bk: kurve(C.b.x + C.b.w, midY, C.k.x, midY), ks: kurve(C.k.x + C.k.w, midY, C.s.x, midY), sa: kurve(C.s.x + C.s.w, midY, C.a.x, midY) };
      L.forEach((l, i) => { ledH[l.id] = kurve(C.a.x + C.a.w, midY, S[i].x, S[i].y + bh / 2); });
      sbTekst = ['service', 'binding'].map((o, i) => `<text class="ik-ll" x="${(C.s.x + C.s.w + C.a.x) / 2}" y="${midY - 16 + i * 13}" text-anchor="middle">${o}</text>`).join('');
    } else {
      W = 360; const x = 40, w = 300, rum = 46;
      C = { b: { h: 70 }, k: { h: 70 }, s: { h: 70 }, a: { h: 88 } }; let y = 44;
      for (const k of ['b', 'k', 's', 'a']) { Object.assign(C[k], { x, w, y }); y += C[k].h + rum; }
      S = L.map((l, i) => ({ x: 60, y: y + i * (bh + gap), w: 285 })); H = S[S.length - 1].y + bh + 18;
      const cx = x + w / 2, ned = (a, b) => `M${cx} ${a.y + a.h} L${cx} ${b.y}`;
      ledH = { bk: ned(C.b, C.k), ks: ned(C.k, C.s), sa: ned(C.s, C.a) };
      const fra = [C.a.x + 24, C.a.y + C.a.h];
      L.forEach((l, i) => { const ym = S[i].y + bh / 2, bx = 14 + i * 2; ledH[l.id] = `M${fra[0]} ${fra[1]} C${fra[0]} ${fra[1] + 20} ${bx} ${fra[1] + 10} ${bx} ${Math.min(ym, fra[1] + 40)} L${bx} ${ym - 8} Q${bx} ${ym} ${bx + 10} ${ym} L${S[i].x} ${ym}`; });
      sbTekst = `<text class="ik-ll" x="${cx + 10}" y="${C.s.y + C.s.h + rum / 2 + 4}">service binding</text>`;
    }
    const node = (key, c, titel, linjer) => `<g class="ik-node as-rn ${til}" data-n="${key}" transform="translate(${c.x} ${c.y.toFixed(1)})"><rect width="${c.w}" height="${c.h}" rx="10"/><circle class="ik-lys" cx="${c.w - 14}" cy="14" r="5"/><text class="ik-nt" x="12" y="22">${esc(titel)}</text>${linjer.filter(Boolean).map((l, i) => `<text class="ik-nl" x="12" y="${40 + i * (V ? 14 : 16)}">${esc(l)}</text>`).join('')}</g>`;
    const cls = id => (id === 'bk' || id === 'ks' || id === 'sa') ? 'as-rled-net' : (L.find(l => l.id === id) || {}).laast ? 'as-rled-eu' : 'as-rled-fri';
    const p = Object.entries(ledH).map(([id, d]) => `<path id="as-rp-${id}" class="as-rled ${cls(id)}" d="${d}"/>`);
    p.push(sbTekst);
    p.push(node('b', C.b, T.r.browser, [T.r.klik, 'POST /eu/segl']));
    p.push(node('k', C.k, T.r.kanten, [by(gaest), R ? (R.opkobl ? fmt(T.r.opkobl, { ms: R.opkobl }) : T.r.genbrugt) : '']));
    p.push(node('s', C.s, 'tingsvad-site', [T.r.router, wk && wk === gaest ? T.r.samme : '']));
    p.push(node('a', C.a, 'tingsvad-ting-ai', [by(wk), R && R.maalt ? fmt(T.r.kvote, { ms: R.kvote }) : T.r.kvoteU, R ? (R.maalt ? fmt(T.r.arbejde, { ms: R.server }) : T.r.ikkeMaalt) : '']));
    L.forEach((l, i) => p.push(`<g class="ik-node as-rn ${til} ${l.laast ? 'as-rn-eu' : 'as-rn-fri'}" data-n="${l.id}" transform="translate(${S[i].x} ${S[i].y})"><rect width="${S[i].w}" height="${bh}" rx="8"/><circle class="ik-lys" cx="${S[i].w - 13}" cy="13" r="4.5"/><text class="ik-nt" x="12" y="19">${esc(T.r.navn[l.id] + (l.laast ? ' · EU' : ''))}</text><text class="ik-nl" x="12" y="36">${esc([sted(l.id, l.x), l.ms != null ? l.ms + ' ms' : ''].filter(Boolean).join(' · '))}</text></g>`));
    p.push(`<text class="as-ur" id="as-ur" x="14" y="26">${R ? esc(fmt(T.r.ur, { ms: R.total })) : ''}</text><g id="as-pakker"></g>`);
    return `<svg class="ik-kaede as-rejse-svg${V ? ' as-lodret' : ''}" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(T.r.svgTitel)}">${p.join('')}</svg>`;
  }
  function fald(R) {
    const tot = Math.max(1, R.total), pct = v => Math.min(100, 100 * v / tot).toFixed(2);
    const rk = [[fmt(T.r.f.ud, { by: by(R.gaest) }), 0, R.ud, 'net', R.ud + ' ms'], [T.r.f.binding, R.ud, 0, 'net', R.worker && R.worker === R.gaest ? T.r.f.samme : '–'], [T.r.f.kvote, R.ud, R.kvote, 'wk', R.maalt ? R.kvote + ' ms' : T.r.ikkeMaalt]]
      .concat(R.lagre.map(l => [`${T.r.navn[l.id]}${l.laast ? ' · EU' : ''}${l.id === 'kv' || l.id === 'r2' ? '' : ' · ' + sted(l.id, l.x)}`, R.ud + R.kvote, l.ms || 0, l.laast ? 'eu' : 'fri', l.ms == null ? '–' : l.ms + ' ms']))
      .concat([[T.r.f.hjem, R.ud + R.server, R.hjem, 'net', R.hjem + ' ms']]);
    return `<ol class="as-fald" aria-label="${esc(T.r.faldTitel)}">${rk.map(([n, st, d, c, v]) => `<li><span class="as-fald-n">${esc(n)}</span><span class="as-spor" aria-hidden="true"><i class="as-bar as-bar-${c}" style="left:${pct(st)}%;width:max(3px, ${pct(d)}%)"></i></span><span class="as-fald-ms">${esc(v)}</span></li>`).join('')}<li class="as-fald-sum"><span class="as-fald-n">${esc(T.r.f.ialt)}</span><span class="as-spor" aria-hidden="true"></span><span class="as-fald-ms">${R.total} ms</span></li></ol>`;
  }
  function rejseHtml() {
    const R = rejse, dag = R ? new Date(R.t).toISOString().slice(0, 10) : '';
    const pakke = R ? esc(T.r.pakke).replace('{raekke}', `<code>{ "t": ${R.t}, "dag": "${dag}", "colo": "${esc(R.gaest || '')}" }</code>`).replace('{kv}', `<code>{ "t": ${R.t}, "colo": "${esc(R.gaest || '')}" }</code>`) : '';
    return `<section class="as-rejse" aria-labelledby="as-rejse-h"><h3 id="as-rejse-h">${esc(T.r.h)}</h3><p class="as-rejse-intro">${esc(R ? T.r.introEfter : T.r.intro)}</p>
      <div class="ik-kaede-rul" tabindex="0" role="region" aria-label="${esc(T.r.svgTitel)}">${rejseSvg(R, sidst)}</div>
      ${R ? `<div class="as-rejse-bund"><p>${esc(fmt(T.r.langsom, { x: skala(R) }))}</p><button type="button" class="knap sek" id="as-igen">${esc(T.r.igen)}</button></div>${fald(R)}<p class="as-pakke-tekst">${pakke}</p>` : ''}</section>`;
  }
  /** Afspiller rejsen: pakken følger stierne med varigheder fra målingen (forlænget, så øjet kan følge med); uret viser virkelig tid. */
  function afspil(R) {
    const svg = rod.querySelector('.as-rejse-svg'); if (!svg || !R) return;
    cancelAnimationFrame(anim);
    if (reduce()) return;
    const nodes = {}; svg.querySelectorAll('.as-rn').forEach(g => { nodes[g.dataset.n] = g; g.classList.remove('ik-live'); g.classList.add('ik-fra'); });
    const lys = k => { const g = nodes[k]; if (g) { g.classList.remove('ik-fra'); g.classList.add('ik-live'); } };
    const pk = svg.querySelector('#as-pakker'), ur = svg.querySelector('#as-ur'), s = skala(R), A = (real, min) => Math.max(real * s, min);
    const seg = [], urKort = []; let t = 0;
    const add = (dur, r0, r1, sti, rev, ved) => { seg.push({ a0: t, a1: t + dur, sti, rev, ved }); urKort.push([t, t + dur, r0, r1]); t += dur; };
    lys('b');
    add(A(R.ud, 450), 0, R.ud, 'bk', false, () => lys('k'));
    add(280, R.ud, R.ud, 'ks', false, () => lys('s'));
    add(280, R.ud, R.ud, 'sa', false, () => lys('a'));
    if (R.kvote) add(A(R.kvote, 120), R.ud, R.ud + R.kvote, null);
    const g0 = t, r0 = R.ud + R.kvote; let gmax = 0;
    R.lagre.forEach(l => { if (l.ms == null) return; const d = A(l.ms / 2, 260); seg.push({ a0: g0, a1: g0 + d, sti: l.id, rev: false, ved: () => lys(l.id) }, { a0: g0 + d, a1: g0 + 2 * d, sti: l.id, rev: true, hjem: true }); gmax = Math.max(gmax, 2 * d); });
    urKort.push([g0, g0 + gmax, r0, R.ud + R.server]); t = g0 + gmax;
    const rr = R.ud + R.server;
    seg.push({ a0: t, a1: t + 280, sti: 'sa', rev: true, hjem: true }); urKort.push([t, t + 280, rr, rr]); t += 280;
    seg.push({ a0: t, a1: t + 280, sti: 'ks', rev: true, hjem: true }); urKort.push([t, t + 280, rr, rr]); t += 280;
    const sidsteA = A(R.hjem, 450); seg.push({ a0: t, a1: t + sidsteA, sti: 'bk', rev: true, hjem: true }); urKort.push([t, t + sidsteA, rr, R.total]); t += sidsteA;
    const slut = t;
    seg.forEach(x => { x.p = x.sti ? svg.querySelector('#as-rp-' + x.sti) : null; x.len = x.p ? x.p.getTotalLength() : 0; });
    const real = a => { for (const [a0, a1, b0, b1] of urKort) if (a < a1) return Math.round(b0 + (b1 - b0) * Math.max(0, (a - a0) / Math.max(1, a1 - a0))); return R.total; };
    const NS = 'http://www.w3.org/2000/svg'; let start = null;
    const trin = ts => {
      if (start == null) start = ts;
      const a = ts - start;
      for (const x of seg) {
        if (a >= x.a0 && a < x.a1 && x.p) {
          if (!x.c) { x.c = document.createElementNS(NS, 'circle'); x.c.setAttribute('r', '6'); x.c.setAttribute('class', 'as-pakke' + (x.hjem ? ' as-pakke-hjem' : '')); pk.appendChild(x.c); }
          const f = (a - x.a0) / (x.a1 - x.a0), pt = x.p.getPointAtLength(x.len * (x.rev ? 1 - f : f));
          x.c.setAttribute('cx', pt.x.toFixed(1)); x.c.setAttribute('cy', pt.y.toFixed(1));
        } else if (a >= x.a1 && !x.faerdig) { x.faerdig = true; if (x.c) x.c.remove(); if (x.ved) x.ved(); }
      }
      ur.textContent = fmt(T.r.ur, { ms: real(a) });
      if (a < slut) anim = requestAnimationFrame(trin); else { ur.textContent = fmt(T.r.ur, { ms: R.total }); Object.keys(nodes).forEach(lys); }
    };
    anim = requestAnimationFrame(trin);
  }
  const iEuropa = k => { const p = xy(k); return !!p && p[0] > 430 && p[0] < 625 && p[1] > 50 && p[1] < 156; };
  function pointe(eu, fri) {
    if (!eu || !eu.ok || !fri || !fri.ok || !eu.colo || !fri.colo) return '';
    const tekst = fmt(iEuropa(fri.colo) ? T.pointeEns : T.pointe, { eu: by(eu.colo), fri: by(fri.colo) });
    return `<div class="as-pointe"><b>${esc(T.pointeH)}</b><p>${esc(tekst)}</p></div>`;
  }
  function tegn(m) {
    sidst = m;
    const L = m.lagre || {}, U = m.uden || {};
    rod.innerHTML = `<div class="ik-bjaelke"><p class="ik-status">${esc(T.maalt)} · ${esc(fmt(T.du, { by: by(m.worker) }))}</p></div>${eks ? `<p class="vg-advarsel" role="note">${esc(tvang ? T.eksempel : T.ikkeKlar)}</p>` : ''}
      <div class="ik-kortramme vg-tavle"><div class="ik-zoom" role="group" aria-label="${esc(T.kortTitel)}"><button type="button" data-vis="europa" aria-pressed="${visning === 'europa'}">${esc(T.europa)}</button><button type="button" data-vis="verden" aria-pressed="${visning === 'verden'}">${esc(T.verden)}</button></div><div id="as-kort">${kort(m)}</div>
      <ul class="ik-legende"><li><i class="ik-leg-du"></i>${esc(T.leg.du)}</li><li><i class="as-leg-eu"></i>${esc(T.leg.eu)}</li><li><i class="as-leg-fri"></i>${esc(T.leg.fri)}</li><li><i class="ik-leg-d1"></i>${esc(T.leg.d1)}</li></ul></div>
      ${pointe(L.do, U.do)}
      <div class="as-handling"><button type="button" class="knap" id="as-segl"${eks ? ' disabled' : ''}>${esc(T.knap)}</button><p class="r6-status" id="as-status" aria-live="polite"></p></div>
      <div class="as-lagre">${lagerkort('do', L.do, true)}${lagerkort('d1', L.d1, true)}${lagerkort('kv', L.kv, true)}${lagerkort('r2', L.r2, true)}${lagerkort('fri', U.do, false)}</div>
      ${rejseHtml()}`;
    rod.querySelectorAll('.ik-zoom button').forEach(b => b.addEventListener('click', () => { visning = b.dataset.vis; rod.querySelectorAll('.ik-zoom button').forEach(x => x.setAttribute('aria-pressed', String(x === b))); rod.querySelector('#as-kort').innerHTML = kort(sidst); }));
    const rul = rod.querySelector('.as-rejse .ik-kaede-rul'); if (rul) rul.classList.toggle('as-rul-lodret', lodret());
    const igen = rod.querySelector('#as-igen'); if (igen) igen.addEventListener('click', () => afspil(rejse));
    if (rejse && rejse.ny) { rejse.ny = false; afspil(rejse); }
    const knap = rod.querySelector('#as-segl'), st = rod.querySelector('#as-status');
    knap.addEventListener('click', async () => {
      knap.disabled = true; st.className = 'r6-status venter'; st.textContent = T.sender; const t0 = performance.now();
      const url = new URL('/api/ting-ai/eu/segl?lang=' + lang, location.href).href;
      const r = await hentJson(url, { method: 'POST' }).catch(() => ({ status: 0, j: null }));
      const ms = Math.round(performance.now() - t0);
      let entry = null; try { entry = performance.getEntriesByName(url, 'resource').pop() || null; } catch (e) { }
      if (r.j && r.j.ok && r.j.data) {
        const d = r.j.data, n = Object.values(d.lagre).filter(x => x && x.ok).length;
        const ny = Object.assign({}, sidst, { lagre: d.lagre, uden: d.uden, worker: d.gaest || sidst.worker });
        rejse = byggRejse(d, ms, entry);
        tegn(ny); const s2 = rod.querySelector('#as-status'); s2.className = 'r6-status ok'; s2.textContent = fmt(T.lagt, { n, ms, by: by(d.gaest) });
      } else { knap.disabled = false; st.className = 'r6-status fejl'; st.textContent = (r.j && (r.j.code === 'rate_limited' || r.j.code === 'quota')) ? T.kvote : ((r.j && r.j.message) || T.fejl); }
    });
    dispatchEvent(new Event('tv:indhold'));
  }
  async function start() {
    rod.setAttribute('aria-busy', 'true'); rod.innerHTML = `<p class="ik-status">${esc(T.maaler)}</p>`;
    try { const [v, n] = await Promise.all([fetch('/assets/verden.json').then(r => r.json()), fetch('/assets/colo.json').then(r => r.json()).catch(() => ({}))]); verden = v; navne = n || {}; } catch (e) { rod.innerHTML = ''; return; }
    let m = null;
    if (!tvang) {
      const h = await hentJson('/api/ting-ai/health').catch(() => null);
      const k = h && h.j && h.j.ok && h.j.data && h.j.data.configured;
      if (k && k.eu) { const r = await hentJson('/api/ting-ai/eu/skab?lang=' + lang).catch(() => null); if (r && r.j && r.j.ok && r.j.data) m = r.j.data; }
    }
    if (!m) { m = EKS; eks = true; } else eks = false;
    if (m.uden && m.uden.do && m.uden.do.colo && !iEuropa(m.uden.do.colo)) visning = 'verden'; // så buen over Atlanten kan ses
    rod.removeAttribute('aria-busy');
    tegn(m);
  }
  let sidstV = null;
  addEventListener('resize', () => { const v = lodret(), rul = rod.querySelector('.as-rejse .ik-kaede-rul'); if (!rul || v === sidstV) return; sidstV = v; cancelAnimationFrame(anim); rul.innerHTML = rejseSvg(rejse, sidst); rul.classList.toggle('as-rul-lodret', v); }, { passive: true });
  start();
})();
