/* tingsvad.dk — Infrastrukturkortet (runde 12): hele tinget, som det svarer lige nu.
   Måler fire ting fra din browser: /api/kant (hvilket datacenter svarede dig), Workerens health (hvilke bindinger er tændt),
   /api/ting-ai/topologi (hvor D1 og de to Durable Objects bor, svartider for D1/KV/R2/Vectorize) og tælleværket
   (hvilke datacentre der har betjent gæster det seneste døgn). Tegner et verdenskort og et diagram over hele kæden som SVG,
   og samme tal som tabel. Ingen lagring. ?eksempel viser mærkede eksempeldata (til test uden Worker). */
(function () {
  'use strict';
  const rod = document.getElementById('infrakort');
  if (!rod) return;
  const lang = document.documentElement.lang === 'en' ? 'en' : 'da', da = lang === 'da';
  const eksempel = /[?&]eksempel\b/.test(location.search);
  const T = da ? {
    maaler: 'Måler …', maaltKl: 'Målt kl. {t}', igen: 'Mål igen', auto: 'Mål hvert 30. sekund', eksempel: 'Eksempeldata – ikke målt. Fjern ?eksempel fra adressen for at måle.',
    verden: 'Verden', europa: 'Europa', du: 'Dig', duSvar: 'Du blev besvaret i {by}', ukendt: 'ukendt',
    kortTitel: 'Verdenskort over tingets infrastruktur lige nu', kortDesc: 'Cloudflares datacentre som prikker. {du} D1-databasen svarer fra {d1}. Tingmødet bor i {ting}, stolen i {stol}.',
    leg: { net: 'Cloudflare-datacenter', besog: 'Har betjent gæster i dag', du: 'Svarede dig nu', d1: 'D1-database', do: 'Durable Object', bue: 'Kald, der går derhen' },
    kaedeTitel: 'Diagram over kæden fra din browser til tingets bindinger', browser: 'Din browser', kanten: 'Kanten', site: 'Worker: tingsvad-site', ai: 'Worker: tingsvad-ting-ai',
    siteDele: ['Static Assets', 'HTMLRewriter', 'Router'], serviceBinding: 'service binding', samme: 'samme datacenter',
    status: { live: 'Målt nu', konf: 'Tændt', fra: 'Ikke tændt', fejl: 'Svarede ikke', ukendt: 'Ukendt' },
    tabel: { komp: 'Komponent', hvor: 'Hvor', ms: 'Målt', status: 'Status' },
    tingm: 'Tingmødet (DO)', stol: 'Stolen (DO)', region: { WNAM: 'det vestlige Nordamerika', ENAM: 'det østlige Nordamerika', WEUR: 'Vesteuropa', EEUR: 'Østeuropa', APAC: 'Asien–Stillehavet', OC: 'Oceanien' },
    primaer: 'primær', replika: 'replika', vektorer: '{n} vektorer', ingenData: 'Tingets Worker svarede ikke lige nu. Kortet viser det, kanten kunne måle.',
    rtt: 'tur-retur', proto: 'Protokol', bes: '{n} sidevisninger i døgnet',
  } : {
    maaler: 'Measuring …', maaltKl: 'Measured at {t}', igen: 'Measure again', auto: 'Measure every 30 seconds', eksempel: 'Sample data – not measured. Remove ?eksempel from the address to measure.',
    verden: 'World', europa: 'Europe', du: 'You', duSvar: 'You were answered in {by}', ukendt: 'unknown',
    kortTitel: 'World map of the thing’s infrastructure right now', kortDesc: 'Cloudflare data centres as dots. {du} The D1 database answers from {d1}. The thing meeting lives in {ting}, the stool in {stol}.',
    leg: { net: 'Cloudflare data centre', besog: 'Served guests today', du: 'Answered you now', d1: 'D1 database', do: 'Durable Object', bue: 'Calls going there' },
    kaedeTitel: 'Diagram of the chain from your browser to the thing’s bindings', browser: 'Your browser', kanten: 'The edge', site: 'Worker: tingsvad-site', ai: 'Worker: tingsvad-ting-ai',
    siteDele: ['Static Assets', 'HTMLRewriter', 'Router'], serviceBinding: 'service binding', samme: 'same data centre',
    status: { live: 'Measured now', konf: 'On', fra: 'Not on', fejl: 'No answer', ukendt: 'Unknown' },
    tabel: { komp: 'Component', hvor: 'Where', ms: 'Measured', status: 'Status' },
    tingm: 'Meeting (DO)', stol: 'Stool (DO)', region: { WNAM: 'western North America', ENAM: 'eastern North America', WEUR: 'western Europe', EEUR: 'eastern Europe', APAC: 'Asia-Pacific', OC: 'Oceania' },
    primaer: 'primary', replika: 'replica', vektorer: '{n} vectors', ingenData: 'The thing’s Worker did not answer just now. The map shows what the edge could measure.',
    rtt: 'round trip', proto: 'Protocol', bes: '{n} page views in the last day',
  };
  const fmt = (s, v) => String(s).replace(/\{(\w+)\}/g, (m, k) => (k in v ? v[k] : m));
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const reduce = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
  const REGION = { WNAM: [-121.9, 37.4], ENAM: [-77.5, 39], WEUR: [4.9, 52.4], EEUR: [21, 52.2], APAC: [103.8, 1.35], OC: [151.2, -33.9] };
  const proj = (lon, lat) => [500 + lon * 1000 / 360, 250 - lat * 1000 / 360];
  const VIEW = { verden: [0, 28, 1000, 385], europa: [420, 48, 260, 100] };

  let verden = null, navne = {}, sidst = null, visning = 'verden', timer = null;

  async function hent(url) {
    const t0 = performance.now();
    try {
      const r = await fetch(url, { credentials: 'same-origin', cache: 'no-store' });
      const ms = Math.round(performance.now() - t0);
      let j = null; try { j = await r.json(); } catch (e) { }
      return { ok: !!(r.ok && j && j.ok), ms, data: j && j.data, kilde: j && j.source };
    } catch (e) { return { ok: false, ms: Math.round(performance.now() - t0) }; }
  }
  const EKS = {
    kant: { ok: true, ms: 38, data: { colo: 'CPH', by: { da: 'København', en: 'Copenhagen' }, protokol: 'HTTP/3', tls: 'TLSv1.3', rttMs: 9 } },
    health: { ok: true, ms: 61, data: { configured: { ai: true, db: true, media: true, room: true, chair_room: true, archive: true, gateway: true, ratelimit: true, render: true, images: true, taelle: true, taelle_laes: true, turnstile: true, ravn_queue: true, cases: true, arkiv: true } } },
    topo: { ok: true, ms: 142, data: { worker: { colo: 'CPH', navn: 'tingsvad-ting-ai' }, d1: { ok: true, ms: 19, region: 'WEUR', primaer: true, colo: 'AMS', sqlMs: 0.11 }, kv: { ok: true, ms: 5 }, r2: { ok: true, ms: 24 }, vectorize: { ok: true, ms: 37, vektorer: 412, dimensioner: 1024 }, durableObjects: { tingmoedet: { ok: true, ms: 44, colo: 'AMS' }, stolen: { ok: true, ms: 39, colo: 'FRA' } }, tjenester: { workersAi: true, aiGateway: true, aiSearch: true, browser: true, images: true, workflows: true, queues: true, analytics: true, analyticsSql: true, rateLimiting: true } } },
    taelle: { ok: true, ms: 88, data: { colos: [{ colo: 'CPH', n: 214 }, { colo: 'AMS', n: 41 }, { colo: 'FRA', n: 33 }, { colo: 'ARN', n: 19 }, { colo: 'LHR', n: 15 }, { colo: 'EWR', n: 9 }, { colo: 'OSL', n: 7 }, { colo: 'SIN', n: 3 }] } },
  };

  function xy(kode) {
    if (!kode || !verden) return null;
    if (verden.colo[kode]) return verden.colo[kode];
    if (verden.net[kode]) return verden.net[kode].slice(0, 2);
    return null;
  }
  function by(kode) {
    if (!kode) return T.ukendt;
    const n = navne[kode]; if (Array.isArray(n)) return `${n[da ? 0 : 1]} (${kode})`;
    if (verden && verden.net[kode]) return `${verden.net[kode][2]} (${kode})`;
    return kode;
  }
  function d1Sted(d1) {
    if (!d1 || !d1.ok) return { p: null, tekst: T.ukendt };
    if (d1.colo && xy(d1.colo)) return { p: xy(d1.colo), tekst: by(d1.colo) + (d1.region ? ` · ${d1.region}` : '') };
    if (d1.region && REGION[d1.region]) return { p: proj(...REGION[d1.region]), tekst: `${T.region[d1.region]} (${d1.region})` };
    return { p: null, tekst: d1.region || T.ukendt };
  }

  /* ── Verdenskortet ── */
  function kort(m) {
    const [vx, vy, vw, vh] = VIEW[visning], k = 1000 / vw;
    const r = (n) => (n / k).toFixed(2), fs = (n) => (n / k).toFixed(2);
    const du = m.kant.ok && m.kant.data && m.kant.data.colo, pDu = xy(du);
    const topo = m.topo.ok ? m.topo.data : null;
    const d1 = d1Sted(topo && topo.d1);
    const dos = topo ? [['ting', T.tingm, topo.durableObjects.tingmoedet], ['stol', T.stol, topo.durableObjects.stolen]] : [];
    const besog = (m.taelle.ok && m.taelle.data && Array.isArray(m.taelle.data.colos)) ? m.taelle.data.colos : [];
    const maxN = Math.max(1, ...besog.map(b => b.n));
    const g = [];
    for (let lon = -150; lon <= 180; lon += 30) { const x = proj(lon, 0)[0]; g.push(`<line x1="${x}" y1="0" x2="${x}" y2="500"/>`); }
    for (let lat = -60; lat <= 60; lat += 30) { const y = proj(0, lat)[1]; g.push(`<line x1="0" y1="${y}" x2="1000" y2="${y}"/>`); }
    const net = Object.entries(verden.net).map(([kode, [x, y, c]]) => `<circle class="ik-net" cx="${x}" cy="${y}" r="${r(1.5)}"><title>${esc(c)} (${kode})</title></circle>`).join('');
    const kendt = Object.entries(verden.colo).map(([kode, [x, y]]) => `<circle class="ik-kendt" cx="${x}" cy="${y}" r="${r(1.8)}"><title>${esc(by(kode))}</title></circle>`).join('');
    const bes = besog.map(b => { const p = xy(b.colo); if (!p) return ''; const rr = 2.2 + 7 * Math.sqrt(b.n / maxN); return `<circle class="ik-besog" cx="${p[0]}" cy="${p[1]}" r="${r(rr)}"><title>${esc(by(b.colo))}: ${esc(fmt(T.bes, { n: b.n }))}</title></circle>`; }).join('');
    const bue = (a, b, cls) => { if (!a || !b || (a[0] === b[0] && a[1] === b[1])) return ''; const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2 - Math.max(8, Math.hypot(b[0] - a[0], b[1] - a[1]) * .35); return `<path class="ik-bue ${cls}" d="M${a[0]} ${a[1]} Q${mx.toFixed(1)} ${my.toFixed(1)} ${b[0]} ${b[1]}" style="stroke-width:${r(1.4)};stroke-dasharray:${r(4)} ${r(4)}"/>`; };
    const buer = [bue(pDu, d1.p, 'ik-bue-d1'), ...dos.map(([, , o]) => bue(pDu, o && o.ok ? xy(o.colo) : null, 'ik-bue-do'))].join('');
    const etiket = (p, tekst, cls, dx = 6, dy = -6) => p ? `<text class="ik-etiket ${cls}" x="${(p[0] + dx / k).toFixed(2)}" y="${(p[1] + dy / k).toFixed(2)}" style="font-size:${fs(12)}px;stroke-width:${fs(3)}px">${esc(tekst)}</text>` : '';
    const d1Mark = d1.p ? `<rect class="ik-d1" x="${(d1.p[0] - 4 / k).toFixed(2)}" y="${(d1.p[1] - 4 / k).toFixed(2)}" width="${r(8)}" height="${r(8)}" rx="${r(1.5)}"/>${etiket(d1.p, 'D1', 'ik-et-d1', 7, 13)}` : '';
    const doMark = dos.map(([id, navn, o], i) => { const p = o && o.ok ? xy(o.colo) : null; if (!p) return ''; const s = 5 / k; return `<path class="ik-do" d="M${p[0]} ${(p[1] - s).toFixed(2)} L${(p[0] + s).toFixed(2)} ${p[1]} L${p[0]} ${(p[1] + s).toFixed(2)} L${(p[0] - s).toFixed(2)} ${p[1]} Z"/>${etiket(p, navn.replace(/ \(DO\)$/, ''), 'ik-et-do', 7, i ? 16 : -7)}`; }).join('');
    const duMark = pDu ? `<circle class="ik-du-ring" cx="${pDu[0]}" cy="${pDu[1]}" r="${r(9)}"/><circle class="ik-du" cx="${pDu[0]}" cy="${pDu[1]}" r="${r(3.6)}"/>${etiket(pDu, fmt(T.duSvar, { by: by(du) }), 'ik-et-du', 9, -9)}` : '';
    const desc = fmt(T.kortDesc, { du: pDu ? fmt(T.duSvar, { by: by(du) }) + '.' : '', d1: d1.tekst, ting: dos[0] && dos[0][2].ok ? by(dos[0][2].colo) : T.ukendt, stol: dos[1] && dos[1][2].ok ? by(dos[1][2].colo) : T.ukendt });
    return `<svg class="ik-kort" viewBox="${vx} ${vy} ${vw} ${vh}" role="img" aria-labelledby="ik-kort-t ik-kort-d" preserveAspectRatio="xMidYMid meet">
      <title id="ik-kort-t">${esc(T.kortTitel)}</title><desc id="ik-kort-d">${esc(desc)}</desc>
      <rect class="ik-hav" x="0" y="0" width="1000" height="500"/>
      <g class="ik-gitter" style="stroke-width:${r(.4)}">${g.join('')}</g>
      <path class="ik-land" d="${verden.land}" style="stroke-width:${r(.5)}"/>
      <g>${net}${kendt}</g><g>${bes}</g><g>${buer}</g><g>${d1Mark}${doMark}${duMark}</g>
    </svg>`;
  }

  /* ── Kæden: browser → kant → Worker → Worker → bindinger ── */
  function model(m) {
    const topo = m.topo.ok ? m.topo.data : null, kon = m.health.ok && m.health.data ? m.health.data.configured || {} : {};
    const tj = topo ? topo.tjenester : {};
    const fra = (maalt, tændt) => maalt && maalt.ok ? 'live' : maalt && maalt.konfigureret === false ? 'fra' : maalt && !maalt.ok ? 'fejl' : tændt ? 'konf' : 'fra';
    const d1 = d1Sted(topo && topo.d1);
    const ms = o => o && o.ok && Number.isFinite(o.ms) ? o.ms : null;
    const b = [
      { id: 'd1', navn: 'D1', hvor: d1.tekst + (topo && topo.d1 && topo.d1.ok && topo.d1.primaer != null ? ` · ${topo.d1.primaer ? T.primaer : T.replika}` : ''), kort: topo && topo.d1 && topo.d1.ok ? (topo.d1.colo || topo.d1.region || '') : '', ms: ms(topo && topo.d1), st: topo ? fra(topo.d1) : (kon.db ? 'konf' : 'fra') },
      { id: 'kv', navn: 'Workers KV', hvor: '', ms: ms(topo && topo.kv), st: topo ? fra(topo.kv) : 'konf' },
      { id: 'r2', navn: 'R2', hvor: '', ms: ms(topo && topo.r2), st: topo ? fra(topo.r2) : (kon.media ? 'konf' : 'fra') },
      { id: 'vec', navn: 'Vectorize', kort: '', hvor: topo && topo.vectorize && topo.vectorize.vektorer != null ? fmt(T.vektorer, { n: topo.vectorize.vektorer.toLocaleString(da ? 'da-DK' : 'en-GB') }) : '', ms: ms(topo && topo.vectorize), st: topo ? fra(topo.vectorize) : (kon.archive ? 'konf' : 'fra') },
      { id: 'dot', navn: T.tingm, hvor: topo && topo.durableObjects.tingmoedet.ok ? by(topo.durableObjects.tingmoedet.colo) : '', kort: topo && topo.durableObjects.tingmoedet.ok ? topo.durableObjects.tingmoedet.colo || '' : '', ms: ms(topo && topo.durableObjects.tingmoedet), st: topo ? fra(topo.durableObjects.tingmoedet) : (kon.room ? 'konf' : 'fra') },
      { id: 'dos', navn: T.stol, hvor: topo && topo.durableObjects.stolen.ok ? by(topo.durableObjects.stolen.colo) : '', kort: topo && topo.durableObjects.stolen.ok ? topo.durableObjects.stolen.colo || '' : '', ms: ms(topo && topo.durableObjects.stolen), st: topo ? fra(topo.durableObjects.stolen) : (kon.chair_room ? 'konf' : 'fra') },
      { id: 'ai', navn: 'Workers AI', hvor: '', ms: null, st: (tj.workersAi ?? kon.ai) ? 'konf' : 'fra' },
      { id: 'gw', navn: 'AI Gateway', hvor: '', ms: null, st: (tj.aiGateway ?? kon.gateway) ? 'konf' : 'fra' },
      { id: 'as', navn: 'AI Search', hvor: '', ms: null, st: (tj.aiSearch ?? kon.arkiv) ? 'konf' : 'fra' },
      { id: 'wf', navn: 'Workflows', hvor: '', ms: null, st: (tj.workflows ?? kon.cases) ? 'konf' : 'fra' },
      { id: 'q', navn: 'Queues', hvor: '', ms: null, st: (tj.queues ?? kon.ravn_queue) ? 'konf' : 'fra' },
      { id: 'ae', navn: 'Analytics Engine', hvor: '', ms: null, st: (tj.analytics ?? kon.taelle) ? 'konf' : 'fra' },
      { id: 'rl', navn: 'Rate Limiting', hvor: '', ms: null, st: (tj.rateLimiting ?? kon.ratelimit) ? 'konf' : 'fra' },
      { id: 'br', navn: 'Browser Run', hvor: '', ms: null, st: (tj.browser ?? kon.render) ? 'konf' : 'fra' },
      { id: 'im', navn: 'Images', hvor: '', ms: null, st: (tj.images ?? kon.images) ? 'konf' : 'fra' },
      { id: 'ts', navn: 'Turnstile', hvor: '', ms: null, st: kon.turnstile ? 'konf' : (m.health.ok ? 'fra' : 'konf') },
    ];
    if (!topo && !m.health.ok) b.forEach(x => { x.st = 'ukendt'; x.ms = null; });
    const kantD = m.kant.ok ? m.kant.data : null;
    return {
      browser: { st: 'live', hvor: kantD ? [kantD.protokol, kantD.tls].filter(Boolean).join(' · ') : '' },
      kant: { st: m.kant.ok ? 'live' : 'fejl', hvor: kantD ? by(kantD.colo) : '', ms: m.kant.ok ? m.kant.ms : null, rtt: kantD && kantD.rttMs },
      site: { st: m.kant.ok ? 'live' : 'fejl', hvor: kantD && kantD.colo ? kantD.colo : '' },
      ai: { st: m.topo.ok || m.health.ok ? 'live' : 'fejl', hvor: topo && topo.worker.colo ? topo.worker.colo + ' · ' + T.samme : '', ms: m.health.ok ? m.health.ms : (m.topo.ok ? m.topo.ms : null) },
      bindinger: b,
    };
  }
  function kaede(M) {
    const n = M.bindinger.length, bh = 30, gap = 6, top = 22, W = 1150, H = top * 2 + n * (bh + gap) - gap;
    const midY = H / 2;
    const node = (x, y, w, h, titel, linjer, st) => `<g class="ik-node ik-${st}" transform="translate(${x} ${y})"><rect width="${w}" height="${h}" rx="10"/><circle class="ik-lys" cx="${w - 14}" cy="14" r="5"/>`
      + `<text class="ik-nt" x="12" y="21">${esc(titel)}</text>${linjer.filter(Boolean).map((l, i) => `<text class="ik-nl" x="12" y="${39 + i * 16}">${esc(l)}</text>`).join('')}</g>`;
    const bnode = (x, y, w, b) => `<g class="ik-node ik-${b.st}" transform="translate(${x} ${y})"><rect width="${w}" height="${bh}" rx="8"/><circle class="ik-lys" cx="14" cy="${bh / 2}" r="4.5"/>`
      + `<text class="ik-nt" x="28" y="${bh / 2 + 4.5}">${esc(b.navn)}</text><text class="ik-nl" x="${w - 10}" y="${bh / 2 + 4}" text-anchor="end">${esc([b.kort != null ? b.kort : b.hvor, b.ms == null ? '' : b.ms + ' ms'].filter(Boolean).join(' · ') || T.status[b.st])}</text></g>`;
    const led = (x1, y1, x2, y2, st) => { const mx = (x1 + x2) / 2; return `<path class="ik-led ik-led-${st}" d="M${x1} ${y1} C${mx} ${y1} ${mx} ${y2} ${x2} ${y2}"/>`; };
    const msT = ms => (ms == null ? '' : `${ms} ms`);
    const c1 = { x: 10, w: 140, h: 76 }, c2 = { x: 185, w: 170, h: 92 }, c3 = { x: 390, w: 190, h: 140 }, c4 = { x: 650, w: 205, h: 92 }, bx = 895, bw = 245;
    const y = h => midY - h / 2;
    const p = [];
    M.bindinger.forEach((b, i) => p.push(led(c4.x + c4.w, midY, bx, top + i * (bh + gap) + bh / 2, b.st)));
    p.push(led(c1.x + c1.w, midY, c2.x, midY, 'live'), led(c2.x + c2.w, midY, c3.x, midY, M.kant.st), led(c3.x + c3.w, midY, c4.x, midY, M.ai.st));
    p.push(T.serviceBinding.split(' ').map((o, i) => `<text class="ik-ll" x="${(c3.x + c3.w + c4.x) / 2}" y="${midY - 22 + i * 13}" text-anchor="middle">${esc(o)}</text>`).join(''));
    p.push(node(c1.x, y(c1.h), c1.w, c1.h, T.browser, [M.browser.hvor], 'live'));
    p.push(node(c2.x, y(c2.h), c2.w, c2.h, T.kanten, [M.kant.hvor, [msT(M.kant.ms), M.kant.rtt ? `${M.kant.rtt} ms ${T.rtt}` : ''].filter(Boolean).join(' · ')], M.kant.st));
    p.push(node(c3.x, y(c3.h), c3.w, c3.h, T.site, [M.site.hvor, ...T.siteDele.map(d => '· ' + d)], M.site.st));
    p.push(node(c4.x, y(c4.h), c4.w, c4.h, T.ai, [M.ai.hvor, msT(M.ai.ms)], M.ai.st));
    M.bindinger.forEach((b, i) => p.push(bnode(bx, top + i * (bh + gap), bw, b)));
    return `<svg class="ik-kaede" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(T.kaedeTitel)}">${p.join('')}</svg>`;
  }
  function tabel(M) {
    const rk = [[T.browser, M.browser.hvor, '', M.browser.st], [T.kanten, M.kant.hvor + (M.kant.rtt ? ` · ${M.kant.rtt} ms ${T.rtt}` : ''), M.kant.ms, M.kant.st], [T.site, M.site.hvor, '', M.site.st], [T.ai, M.ai.hvor, M.ai.ms, M.ai.st],
      ...M.bindinger.map(b => [b.navn, b.hvor, b.ms, b.st])];
    return `<table class="ik-tabel"><thead><tr><th scope="col">${esc(T.tabel.komp)}</th><th scope="col">${esc(T.tabel.hvor)}</th><th scope="col">${esc(T.tabel.ms)}</th><th scope="col">${esc(T.tabel.status)}</th></tr></thead><tbody>`
      + rk.map(([n, h, ms, st]) => `<tr><th scope="row">${esc(n)}</th><td>${esc(h || '–')}</td><td>${ms == null || ms === '' ? '–' : esc(ms) + ' ms'}</td><td><span class="ik-pille ik-${st}">${esc(T.status[st])}</span></td></tr>`).join('') + '</tbody></table>';
  }

  const $ = s => rod.querySelector(s);
  function tegn() {
    if (!sidst || !verden) return;
    const M = model(sidst);
    $('#ik-kort').innerHTML = kort(sidst);
    // På smalle skærme kan kortet skubbes; start med dit datacenter i midten
    const boks = $('#ik-kort'), du = sidst.kant.ok && sidst.kant.data && xy(sidst.kant.data.colo);
    if (du && boks.scrollWidth > boks.clientWidth + 20) { const [vx, , vw] = VIEW[visning]; boks.scrollLeft = Math.max(0, (du[0] - vx) / vw * boks.scrollWidth - boks.clientWidth / 2); }
    $('#ik-kaede').innerHTML = kaede(M);
    $('#ik-tabel').innerHTML = tabel(M);
    const ingen = !sidst.topo.ok && !sidst.health.ok;
    $('#ik-advarsel').hidden = !ingen; $('#ik-advarsel').textContent = ingen ? T.ingenData : '';
    rod.classList.toggle('ik-stille', reduce());
  }
  async function maal() {
    const st = $('#ik-status'); st.textContent = T.maaler; rod.setAttribute('aria-busy', 'true');
    let m;
    if (eksempel) m = EKS;
    else {
      const [kant, health, topo, taelle] = await Promise.all([hent('/api/kant'), hent('/api/ting-ai/health?lang=' + lang), hent('/api/ting-ai/topologi?lang=' + lang), hent('/api/ting-ai/taelle?lang=' + lang)]);
      m = { kant, health, topo, taelle };
    }
    sidst = m; tegn();
    st.textContent = fmt(T.maaltKl, { t: new Date().toLocaleTimeString(da ? 'da-DK' : 'en-GB') });
    rod.removeAttribute('aria-busy');
  }
  async function start() {
    rod.innerHTML = `<div class="ik-bjaelke">
        <p class="ik-status" id="ik-status" role="status" aria-live="polite">${esc(T.maaler)}</p>
        <div class="ik-knapper"><button type="button" class="knap sek" id="ik-igen">${esc(T.igen)}</button>
        <label class="ik-auto"><input type="checkbox" id="ik-auto"> ${esc(T.auto)}</label></div></div>
      ${eksempel ? `<p class="ik-eksempel">${esc(T.eksempel)}</p>` : ''}
      <p class="ik-advarsel" id="ik-advarsel" hidden></p>
      <div class="ik-kortramme">
        <div class="ik-zoom" role="group" aria-label="${esc(T.verden)} / ${esc(T.europa)}"><button type="button" data-vis="verden" aria-pressed="true">${esc(T.verden)}</button><button type="button" data-vis="europa" aria-pressed="false">${esc(T.europa)}</button></div>
        <div id="ik-kort" tabindex="0" role="region" aria-label="${esc(T.kortTitel)}"></div>
        <ul class="ik-legende">${['net', 'besog', 'du', 'd1', 'do', 'bue'].map(k => `<li><i class="ik-leg-${k}" aria-hidden="true"></i>${esc(T.leg[k])}</li>`).join('')}</ul>
      </div>
      <div class="ik-kaede-rul" tabindex="0" role="region" aria-label="${esc(T.kaedeTitel)}"><div id="ik-kaede"></div></div>
      <div class="ik-tabel-rul" tabindex="0" role="region" aria-label="${esc(T.tabel.komp)}"><div id="ik-tabel"></div></div>`;
    $('#ik-igen').addEventListener('click', maal);
    $('#ik-auto').addEventListener('change', e => { clearInterval(timer); timer = e.target.checked ? setInterval(() => { if (!document.hidden) maal(); }, 30000) : null; });
    rod.querySelectorAll('[data-vis]').forEach(b => b.addEventListener('click', () => { visning = b.dataset.vis; rod.querySelectorAll('[data-vis]').forEach(x => x.setAttribute('aria-pressed', String(x === b))); tegn(); }));
    try {
      const [v, n] = await Promise.all([fetch('/assets/verden.json').then(r => r.json()), fetch('/assets/colo.json').then(r => r.json()).catch(() => ({}))]);
      verden = v; navne = n;
    } catch (e) { $('#ik-status').textContent = T.ingenData; return; }
    // Kommer gæsten fra Europa, starter kortet zoomet ind; resten af verden er ét tryk væk
    maal().then(() => { const c = sidst && sidst.kant.ok && sidst.kant.data && xy(sidst.kant.data.colo); if (c && c[0] > 420 && c[0] < 680 && c[1] > 48 && c[1] < 148) rod.querySelector('[data-vis="europa"]').click(); });
  }
  start();
})();
