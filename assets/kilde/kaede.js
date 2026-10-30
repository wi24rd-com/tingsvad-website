/* tingsvad.dk — kæden i »Vis maskineriet« (runde 12): samme tegning som infrastrukturkortet, men kun med de led,
   den enkelte maskine faktisk bruger. Efter hvert kald lyser de bindinger, kaldet rørte (læst fra Workerens
   Server-Timing: d1, ai, r2, kv, vectorize, browser), med målte millisekunder. Andet end tjenester (idempotens,
   WebSocket, CSP …) vises som små mærker under tegningen. Bruges af maskinpark.js og sagsmappe.js. */
(function () {
  'use strict';
  const da = document.documentElement.lang !== 'en';
  const T = da ? {
    browser: 'Din browser', kanten: 'Kanten', site: 'tingsvad-site', ai: 'tingsvad-ting-ai', sb: 'service binding', ws: 'WebSocket', cron: 'hver morgen',
    venter: 'venter på kald', ikkeSidst: 'ikke i sidste kald', bruges: 'bruges', kald: n => n + ' kald', lokal: 'Web Worker', lokalSub: 'i din browser', ingenServer: 'ingen server',
    teknik: 'Teknikker', titel: 'Kæden for netop denne maskine', iAlt: 'i alt', fraCache: 'svar fra kantens cache', cacheIkke: 'ikke i cachen',
  } : {
    browser: 'Your browser', kanten: 'The edge', site: 'tingsvad-site', ai: 'tingsvad-ting-ai', sb: 'service binding', ws: 'WebSocket', cron: 'every morning',
    venter: 'waiting for a call', ikkeSidst: 'not in last call', bruges: 'in use', kald: n => n + (n === 1 ? ' call' : ' calls'), lokal: 'Web Worker', lokalSub: 'in your browser', ingenServer: 'no server',
    teknik: 'Techniques', titel: 'The chain for this machine', iAlt: 'total', fraCache: 'answered from the edge cache', cacheIkke: 'not in cache',
  };
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  // produkt → led. t = navnet i Server-Timing, hvis Workeren måler det
  const LED = [
    [/^Workers AI/i, 'Workers AI', 'ai'], [/^AI Gateway/i, 'AI Gateway'], [/^AI Search/i, 'AI Search'], [/^D1/i, 'D1', 'd1'], [/^R2/i, 'R2', 'r2'],
    [/^(Workers )?KV/i, 'Workers KV', 'kv'], [/^Vectorize/i, 'Vectorize', 'vectorize'], [/^Durable Objects/i, 'Durable Objects'], [/^Workflows/i, 'Workflows'],
    [/^Queues/i, 'Queues'], [/^Images/i, 'Images'], [/^Browser Run/i, 'Browser Run', 'browser'], [/^Turnstile/i, 'Turnstile'], [/^Rate Limiting/i, 'Rate Limiting'],
    [/^Cron Triggers/i, 'Cron Triggers', null, 'cron'], [/^Analytics Engine/i, 'Analytics Engine'], [/^GitHub/i, 'GitHub', null, 'ekstern'],
    // runde 12
    [/^Workers Cache/i, 'Workers Cache', null, 'cache'], [/^Realtime SFU/i, 'Realtime SFU'], [/^Web Search( API)?/i, 'Web Search API'], [/^Secrets Store/i, 'Secrets Store'],
  ];
  const SKJUL = /^(Workers|Site-Worker → Service Binding)$/i; // står allerede i kæden
  function del(p) {
    const s = String(p);
    for (const [re, navn, t, art] of LED) if (re.test(s)) {
      const rest = s.replace(re, '').replace(/^\s*[·(]\s*/, '').replace(/\)\s*$/, '').trim();
      return { navn, t: t || null, art: art || '', sub: rest };
    }
    return null;
  }
  const timing = h => String(h || '').split(',').map(x => x.trim()).filter(Boolean).map(x => { const [n, ...r] = x.split(';'); const o = { n: n.trim() }; r.forEach(q => { const [k, v] = q.split('='); if (k && v) o[k.trim()] = v.trim().replace(/^"|"$/g, ''); }); return o; });
  const ms = x => (x < 10 ? (+x).toFixed(1) : Math.round(x)) + ' ms';

  let kant = null, kantP = null; // /api/kant hentes én gang pr. side: hvilket datacenter svarede
  function hentKant(cb) {
    if (kant) return cb(kant);
    if (!kantP) kantP = fetch('/api/kant', { credentials: 'same-origin', cache: 'no-store' }).then(r => r.json()).then(j => (kant = j && j.ok ? j.data : {})).catch(() => (kant = {}));
    kantP.then(cb);
  }
  function css() {
    if (document.querySelector('link[href*="/assets/infrakort.css"]')) return;
    const v = (document.querySelector('link[href*="/assets/site.css"]') || {}).href || '';
    const l = document.createElement('link'); l.rel = 'stylesheet'; l.href = '/assets/infrakort.css' + ((v.match(/\?v=[0-9a-z]+/) || [''])[0]);
    document.head.appendChild(l);
  }

  function svg(spec, k, kd) {
    const alle = (spec.p || []).map(p => ({ p, d: del(p) }));
    const led = alle.filter(x => x.d).map(x => x.d);
    const lokal = (spec.p || []).some(p => /^(Ingen server|No server)$/i.test(p));
    const st = k ? timing(k.timing) : [];
    const tot = st.find(x => x.n === 'total');
    const fejl = k && (k.code === 'network' || k.status >= 400);
    const node = (x, y, w, h, titel, linjer, s) => `<g class="ik-node ik-${s}" transform="translate(${x} ${y})"><rect width="${w}" height="${h}" rx="10"/><circle class="ik-lys" cx="${w - 13}" cy="13" r="4.5"/>`
      + `<text class="ik-nt" x="11" y="20">${esc(titel)}</text>${linjer.filter(Boolean).map((l, i) => `<text class="ik-nl" x="11" y="${37 + i * 15}">${esc(l)}</text>`).join('')}</g>`;
    const kurve = (x1, y1, x2, y2, s) => { const m = (x1 + x2) / 2; return `<path class="ik-led ik-led-${s}" d="M${x1} ${y1} C${m} ${y1} ${m} ${y2} ${x2} ${y2}"/>`; };
    if (lokal) {
      const W = 1000, H = 104, y = 17, h = 70;
      return `<svg class="ik-kaede ik-kaede-mini" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(T.titel)}">${kurve(180, y + h / 2, 300, y + h / 2, k ? 'live' : 'konf')}`
        + node(8, y, 172, h, T.browser, [T.ingenServer], 'live') + node(300, y, 210, h, T.lokal, [T.lokalSub, k && Number.isFinite(k.ms) ? ms(k.ms) : ''], k ? 'live' : 'konf') + '</svg>';
    }
    const n = Math.max(1, led.length), bh = 30, gap = 6, top = 16, H = Math.max(120, top * 2 + n * (bh + gap) - gap), mid = H / 2, W = 1000;
    const c1 = { x: 8, w: 122, h: 62 }, c2 = { x: 152, w: 142, h: 62 }, c3 = { x: 318, w: 146, h: 62 }, c4 = { x: 524, w: 158, h: 62 }, bx = 716, bw = 278;
    const sv = fejl ? 'fejl' : k ? 'live' : 'konf';
    const p = [];
    const nodeSt = d => {
      if (d.art === 'cache') { const c = k && k.kantcache; return c ? { s: /HIT|STALE|REVALIDATED|UPDATING/i.test(c) ? 'live' : 'konf', tekst: c.toUpperCase() } : { s: 'konf', tekst: k ? T.cacheIkke : T.venter }; }
      if (k && /^(HIT|STALE)$/i.test(k.kantcache || '') && d.t) return { s: 'konf', tekst: T.fraCache }; // Workeren kørte ikke: tallene er fra dengang svaret blev lavet
      if (d.art === 'cron') return { s: 'konf', tekst: [d.sub, T.cron].filter(Boolean).join(' · ') };
      if (d.art === 'ekstern') { const e = spec.ekstern && spec.ekstern[d.navn]; return e ? { s: e.s, tekst: e.tekst } : { s: 'konf', tekst: d.sub || T.bruges }; } // uden for Cloudflare: tilstanden sættes af siden selv
      const m = d.t && st.find(x => x.n === d.t);
      if (m && m.dur != null) return { s: 'live', tekst: [d.sub && d.sub.length < 12 ? d.sub : '', ms(+m.dur), parseInt(m.desc, 10) ? T.kald(parseInt(m.desc, 10)) : ''].filter(Boolean).join(' · ') };
      return { s: 'konf', tekst: d.sub && d.sub.length < 22 ? d.sub : (k ? (d.t ? T.ikkeSidst : T.bruges) : T.venter) };
    };
    led.forEach((d, i) => { const y = top + i * (bh + gap); const ns = nodeSt(d); p.push(kurve(c4.x + c4.w, mid, bx, y + bh / 2, ns.s)); d._ns = ns; });
    p.push(kurve(c1.x + c1.w, mid, c2.x, mid, 'live'), kurve(c2.x + c2.w, mid, c3.x, mid, sv), kurve(c3.x + c3.w, mid, c4.x, mid, sv));
    const ws = spec.ws || (spec.p || []).some(x => /WebSocket/i.test(x));
    p.push((ws ? T.ws : T.sb).split(' ').map((o, i, a) => `<text class="ik-ll" x="${(c3.x + c3.w + c4.x) / 2}" y="${mid - 8 - (a.length - 1 - i) * 12}" text-anchor="middle">${esc(o)}</text>`).join(''));
    p.push(node(c1.x, mid - c1.h / 2, c1.w, c1.h, T.browser, [k && Number.isFinite(k.ms) ? ms(k.ms) : ''], 'live'));
    p.push(node(c2.x, mid - c2.h / 2, c2.w, c2.h, T.kanten, [kd && kd.colo ? kd.colo + (kd.by ? ' · ' + (da ? kd.by.da : kd.by.en) : '') : ''], kd && kd.colo ? 'live' : 'konf'));
    p.push(node(c3.x, mid - c3.h / 2, c3.w, c3.h, T.site, ['Assets · Router'], sv));
    p.push(node(c4.x, mid - c4.h / 2, c4.w, c4.h, T.ai, [tot ? `${ms(+tot.dur)} ${T.iAlt}` : (k ? String(k.status || '') : '')], sv));
    led.forEach((d, i) => {
      const y = top + i * (bh + gap), ns = d._ns;
      p.push(`<g class="ik-node ik-${ns.s}" transform="translate(${bx} ${y})"><rect width="${bw}" height="${bh}" rx="8"/><circle class="ik-lys" cx="13" cy="${bh / 2}" r="4.5"/><text class="ik-nt" x="26" y="${bh / 2 + 4.5}">${esc(d.navn)}</text><text class="ik-nl" x="${bw - 9}" y="${bh / 2 + 4}" text-anchor="end">${esc(ns.tekst)}</text></g>`);
    });
    return `<svg class="ik-kaede ik-kaede-mini" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(T.titel)}">${p.join('')}</svg>`;
  }
  function teknikker(spec) {
    const t = (spec.p || []).filter(p => !del(p) && !SKJUL.test(p) && !/^(Ingen server|No server|Web Worker)/i.test(p));
    return t.length ? `<p class="ik-teknik"><b>${esc(T.teknik)}:</b> ${t.map(x => `<span>${esc(x)}</span>`).join('')}</p>` : '';
  }
  /** Tegner kæden i host (et tomt element inde i »Vis maskineriet«). spec: {p: [produkter], ws?}. kald: seneste kald eller null. */
  function tegn(host, spec, kald) {
    if (!host) return;
    css();
    const lav = kd => { host.innerHTML = `<div class="ik ik-mini"><div class="ik-kaede-rul" tabindex="0" role="region" aria-label="${esc(T.titel)}">${svg(spec, kald, kd)}</div>${teknikker(spec)}</div>`; };
    lav(kant); if (!kant) hentKant(lav);
  }
  /* Dagbogen (runde 12): statistik fra et Durable Objects SQLite-lager, hentet med ét GET-kald. Vises kun, når den svarer. */
  const UGEDAG = da ? ['søndag', 'mandag', 'tirsdag', 'onsdag', 'torsdag', 'fredag', 'lørdag'] : ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const D = da ? { titel: 'Dagbogen', under: 'SQL i Durable Objecten selv: hver hændelse er en række, tallene er en GROUP BY.', iAlt: 'i alt', doegn: 'seneste døgn', dag: 'travleste ugedag', time: 'travleste time', siden: 'ført siden', runder: 'afsluttede runder', svar: 'svar på', cache: 'fra kantens cache' }
    : { titel: 'The diary', under: 'SQL inside the Durable Object itself: every event is a row, the numbers are a GROUP BY.', iAlt: 'total', doegn: 'last 24 hours', dag: 'busiest weekday', time: 'busiest hour', siden: 'kept since', runder: 'closed rounds', svar: 'answered in', cache: 'from the edge cache' };
  function dagbog(host, sti, navne) {
    if (!host) return;
    let t0 = 0;
    // kun når Workeren melder, at dagbogen findes (ældre eller lokale Workers har den ikke: så intet kald og ingen 404)
    fetch('/api/ting-ai/health', { credentials: 'same-origin' }).then(r => r.json()).then(h => {
      if (!h || !h.ok || !h.data || !h.data.configured || !h.data.configured.dagbog) throw 0;
      t0 = performance.now();
      return fetch('/api/ting-ai/' + sti, { credentials: 'same-origin' });
    }).then(r => r.json().then(j => ({ j, c: r.headers.get('x-tingsvad-kantcache') }))).then(({ j, c }) => {
      const d = j && j.ok && j.data; if (!d || !d.iAlt) return;
      const maks = Math.max(1, ...Object.values(d.fordeling || {}));
      const tal = (n, l) => `<div><b>${esc(n)}</b><span>${esc(l)}</span></div>`;
      host.innerHTML = `<div class="ik-dagbog"><img class="ik-dagbog-bog" src="/assets/pak/cloudflare/dagbog-256.webp" width="96" height="85" alt="" loading="lazy"><p class="ik-dagbog-h"><b>${esc(D.titel)}</b> · <code>${esc(d.objekt)}('${esc(d.navn)}')</code></p><p class="note">${esc(D.under)}</p>
        <div class="ik-dagbog-tal">${tal(d.iAlt.toLocaleString(da ? 'da-DK' : 'en-GB'), D.iAlt)}${tal(d.doegn, D.doegn)}${d.travlesteDag != null ? tal(UGEDAG[d.travlesteDag], D.dag) : ''}${d.travlesteTime != null ? tal(String(d.travlesteTime).padStart(2, '0') + ':00', D.time) : ''}${d.runder ? tal(d.runder, D.runder) : ''}</div>
        <ul class="ik-dagbog-ford">${Object.entries(d.fordeling || {}).sort((a, b) => b[1] - a[1]).map(([k, n]) => `<li><span>${esc((navne && navne[k]) || k)}</span><i style="width:${Math.round(n / maks * 100)}%"></i><b>${esc(n)}</b></li>`).join('')}</ul>
        <pre class="ik-dagbog-sql"><code>${esc((d.sql || []).join(';\n') + ';')}</code></pre>
        <p class="note">${d.siden ? esc(D.siden) + ' ' + esc(new Date(d.siden).toLocaleDateString(da ? 'da-DK' : 'en-GB')) + ' · ' : ''}${esc(D.svar)} ${esc(ms(performance.now() - t0))}${/HIT|STALE/i.test(c || '') ? ' · ' + esc(D.cache) : (Number.isFinite(d.ms) ? ' · SQL ' + esc(ms(d.ms)) : '')}</p></div>`;
      host.hidden = false;
    }).catch(() => { });
  }
  window.tvKaede = { tegn, dagbog };
})();
