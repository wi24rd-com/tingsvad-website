/* tingsvad.dk — runde 10: Maskinparken som katalog over alle 16 maskiner (filter efter Cloudflare-produkt),
   Maskinrummets arkitekturdiagram ud fra GET /api/ting-ai/health, resuméet af Gudruns revision,
   kant-kortet (GET /api/kant, request.cf) og tingets tælleværk (GET /api/ting-ai/taelle, Analytics Engine).
   Kataloget herunder er den eneste liste over maskinerne. Runde 6-kortenes navne og tekster står i maskinpark-tekst.js
   (de åbner deres panel her på siden); runde 9-maskinerne har eget rum og linker dertil. */
(function () {
  const lang = document.documentElement.lang === 'en' ? 'en' : 'da', da = lang === 'da';
  const $ = (s, r) => (r || document).querySelector(s), $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const fmt = (s, o) => String(s).replace(/\{(\w+)\}/g, (m, k) => (o && k in o ? o[k] : m));
  const tal = n => Number(n).toLocaleString(da ? 'da-DK' : 'en-GB');
  const kl = iso => { try { return new Date(iso).toLocaleTimeString(da ? 'da-DK' : 'en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Copenhagen' }); } catch (e) { return ''; } };
  const dato = d => { try { return new Date(d + 'T12:00:00Z').toLocaleDateString(da ? 'da-DK' : 'en-GB', { day: 'numeric', month: 'long', year: 'numeric' }); } catch (e) { return d; } };

  /* ── Lag og produkter. flag: 'side' = tændt, fordi du læser siden · 'svar' = tændt, hvis Workeren svarer ·
        [nøgler] = health.configured · null = ingen måler i health ── */
  const LAG = {
    browser: { da: ['Din browser', 'Det, der aldrig forlader din maskine.'], en: ['Your browser', 'What never leaves your machine.'] },
    kant: { da: ['Kanten', 'Navn, værn og adgang foran alt andet.'], en: ['The edge', 'Name, shields and access in front of everything.'] },
    levering: { da: ['Levering', 'Sitet selv: statiske filer og en Worker, der kun vågner, når der er brug for den.'], en: ['Delivery', 'The site itself: static files and a Worker that only wakes up when it is needed.'] },
    beregning: { da: ['Beregning', 'Tingets maskiner i en Worker uden egen adresse.'], en: ['Compute', 'The thing’s machines in a Worker with no address of its own.'] },
    data: { da: ['Data', 'Hvor tinget husker, så godt det kan.'], en: ['Data', 'Where the thing remembers, as well as it can.'] },
    ai: { da: ['AI og browsere på kanten', 'Modeller og en headless browser, alle bag bindings.'], en: ['AI and browsers at the edge', 'Models and a headless browser, all behind bindings.'] },
    vaerktoej: { da: ['Værktøj og kvalitet', 'Det, der holder resten ærligt.'], en: ['Tooling and quality', 'What keeps the rest honest.'] },
  };
  const P = {
    browser: ['browser', 'Din browser', 'Your browser', 'side'],
    'web-worker': ['browser', 'Web Workers', 'Web Workers', 'side'],
    dns: ['kant', 'DNS + DNSSEC', 'DNS + DNSSEC', 'side'],
    waf: ['kant', 'DDoS + WAF', 'DDoS + WAF', 'side'],
    turnstile: ['kant', 'Turnstile', 'Turnstile', ['turnstile']],
    'rate-limiting': ['kant', 'Rate Limiting', 'Rate Limiting', ['ratelimit']],
    access: ['kant', 'Zero Trust Access', 'Zero Trust Access', null],
    'workers-assets': ['levering', 'Workers Static Assets', 'Workers Static Assets', 'side'],
    'run-worker-first': ['levering', 'run_worker_first', 'run_worker_first', 'side'],
    'service-binding': ['levering', 'Service Binding', 'Service Binding', 'svar'],
    workers: ['beregning', 'Workers', 'Workers', 'svar'],
    'durable-objects': ['beregning', 'Durable Objects', 'Durable Objects', ['room', 'chair_room']],
    workflows: ['beregning', 'Workflows', 'Workflows', ['cases', 'ravn', 'revision']],
    cron: ['beregning', 'Cron Triggers', 'Cron Triggers', null],
    queues: ['beregning', 'Queues', 'Queues', ['ravn_queue']],
    email: ['beregning', 'Email Routing', 'Email Routing', null],
    kv: ['data', 'Workers KV', 'Workers KV', null],
    'analytics-engine': ['data', 'Analytics Engine', 'Analytics Engine', ['taelle']],
    d1: ['data', 'D1', 'D1', ['db']],
    r2: ['data', 'R2', 'R2', ['media']],
    vectorize: ['data', 'Vectorize', 'Vectorize', ['archive', 'hittegods']],
    'workers-ai': ['ai', 'Workers AI', 'Workers AI', ['ai']],
    'ai-search': ['ai', 'AI Search', 'AI Search', ['arkiv']],
    'ai-gateway': ['ai', 'AI Gateway', 'AI Gateway', ['gateway']],
    'browser-run': ['ai', 'Browser Run', 'Browser Run', ['render']],
    images: ['ai', 'Images', 'Images', ['images']],
  };
  const navnP = k => P[k] ? P[k][da ? 1 : 2] : k;

  /* ── Kataloget: 16 maskiner. r6 = åbner panel på maskinparken; ellers eget rum (href). ── */
  const ai = ['workers-ai', 'ai-gateway'];
  const M = [
    { id: 'retssal', r6: 1, p: ['workers', 'service-binding', ...ai, 'd1', 'rate-limiting'] },
    { id: 'afstemning', r6: 1, p: ['workers', 'durable-objects', 'd1'] },
    { id: 'avis', r6: 1, p: ['workers', 'cron', ...ai, 'd1'] },
    { id: 'billedbevis', r6: 1, p: ['workers', ...ai, 'images', 'turnstile', 'd1'] },
    { id: 'vaerksted', r6: 1, p: ['workers', ...ai, 'r2', 'd1'] },
    { id: 'sagskontor', r6: 1, p: ['workers', 'workflows', 'turnstile', 'd1'] },
    { id: 'brian', r6: 1, p: ['workers', 'vectorize', ...ai, 'd1'] },
    { id: 'radio', r6: 1, p: ['workers', 'cron', ...ai, 'r2', 'd1'] },
    { id: 'ravnecentralen', href: ['/oplevelser/sagsmappen/#ravnecentralen', '/en/experiences/case-file/#ravnecentralen'], p: ['workers', 'queues', 'workflows', 'browser-run', 'r2', 'd1', 'turnstile'],
      da: ['Ravnecentralen', 'Bestil et bilag, og følg ravnen trin for trin, også efter du har lukket siden.'], en: ['The raven exchange', 'Order a document and follow the raven step by step, even after you close the page.'] },
    { id: 'sagsmappen', href: ['/oplevelser/sagsmappen/', '/en/experiences/case-file/'], p: ['browser', 'workers', 'browser-run', 'r2'],
      da: ['Sagsmappen', 'Dine fund, dit certifikat og dine sager i én mappe, og som PDF.'], en: ['The case file', 'Your finds, certificate and cases in one folder, and as a PDF.'] },
    { id: 'stolen', href: ['/oplevelser/stolen/', '/en/experiences/the-stool/'], p: ['workers', 'durable-objects'],
      da: ['Den fælles stol', 'Én stol for hele internettet. Serveren ejer positionen.'], en: ['The shared stool', 'One stool for the whole internet. The server owns its position.'] },
    { id: 'hittegods', href: ['/oplevelser/hittegods/', '/en/experiences/lost-property/'], p: ['workers', 'vectorize', ...ai, 'd1', 'rate-limiting'],
      da: ['Hittegodskontoret', 'Beskriv, hvad du har mistet. Kataloget finder det nærmeste.'], en: ['Lost property', 'Describe what you lost. The catalogue finds the closest match.'] },
    { id: 'kodegryden', href: ['/oplevelser/kodegryden/', '/en/experiences/the-cauldron/'], p: ['browser', 'web-worker'],
      da: ['Kodegryden', 'Små programmeringsopgaver, der kører i din egen browser.'], en: ['The cauldron', 'Small programming tasks that run in your own browser.'] },
    { id: 'ravnepost', href: ['/oplevelser/gaestebog/#ravnepost-sektion', '/en/experiences/guestbook/#ravnepost-sektion'], p: ['email', 'workers', 'd1', 'access'],
      da: ['Ravnepost', 'Skriv et brev til tinget. Ravnen hænger det op, hvis du beder om det.'], en: ['Raven post', 'Write a letter to the thing. The raven puts it up if you ask.'] },
    { id: 'revisionen', href: ['/maskinrummet/revisionen/', '/en/machine-room/audit/'], p: ['workers', 'cron', 'workflows', 'browser-run', 'r2', 'd1'],
      da: ['Revisionen', 'Gudrun gennemgår hver morgen alle sider på begge sprog. Resultatet er ikke sjovt.'], en: ['The audit', 'Every morning Gudrun goes through every page in both languages. The result is not a joke.'] },
    { id: 'spoerg-arkivet', href: ['/arkivet/#arkiv-spoerg', '/en/archive/#arkiv-spoerg'], p: ['workers', 'ai-search', 'workers-ai', 'd1', 'kv', 'rate-limiting'],
      da: ['Spørg arkivet', 'Mímir har læst hele sitet og svarer med kildelinks. Sammenlign med det håndbyggede arkiv.'], en: ['Ask the archive', 'Mímir has read the whole site and answers with source links. Compare with the hand-built archive.'] },
    { id: 'mcp', href: ['/maskinrummet/#mcp', '/en/machine-room/#mcp'], p: ['workers', 'service-binding', 'durable-objects', 'd1', 'kv', 'rate-limiting'],
      da: ['Tinget som MCP-server', 'Forbind din AI-assistent til tinget. Den kan slå op, stemme og flytte stolen.'], en: ['The thing as an MCP server', 'Connect your AI assistant to the thing. It can look things up, vote and move the stool.'] },
    { id: 'noedoevelser', href: ['/maskinrummet/noedoevelser/', '/en/machine-room/emergency-drills/'], p: ['workers'],
      da: ['Nødøvelserne', 'Timeout, dobbeltlevering og mistet forbindelse, som tydelige simulationer.'], en: ['Emergency drills', 'Timeout, duplicate delivery and a dropped connection, as clearly labelled simulations.'] },
  ];
  const BRUGT = {}; M.forEach(m => m.p.forEach(k => { BRUGT[k] = (BRUGT[k] || 0) + 1; }));
  window.TV_MASKINER = { M, P, LAG }; // til testsuiten

  const T = {
    da: { alle: 'Alle', filter: 'Filtrér maskinerne efter Cloudflare-produkt', viserAlle: 'Viser alle {i} maskiner. Hver har sit eget rum (→).', viser: 'Viser {n} af {i} maskiner, der bruger {p}.',
      maskiner: n => n === 1 ? '1 maskine' : `${n} maskiner`, infra: 'infrastruktur', kort: 'Kortene om laget',
      t: { til: 'tændt', fra: 'slukket', ingen: 'ingen måler', venter: 'måler …', tavs: 'svarer ikke' },
      maalt: 'Målt nu', kilde: 'Bindingerne er læst fra', miljoe: 'miljø', tavs: 'Workeren svarede ikke. Diagrammet viser kun det, siden selv kan se; resten står som »svarer ikke«.',
      forklaring: 'Tændt: bindingen findes i Workeren lige nu. Ingen måler: produktet bruges, men health kan ikke se det. Tryk på et produkt for at se de maskiner, der bruger det.',
      pile: ['HTTPS · HTTP/3', 'proxy · cache · CSP', 'service binding · /api/ting-ai/', 'bindings'],
      rev: { henter: 'Henter Gudruns seneste revision …', ingen: 'Revisionen er ikke tilsluttet. Gudrun reviderer i hånden, hvilket vil sige slet ikke.', ikke: 'Revisionen er ikke kørt endnu. Gudrun venter på morgenen.',
        linje: '{dato} kl. {kl}', tal: '<b>{ok}</b> bestået · <b>{fejl}</b> fejlet · <b>{ikke}</b> ikke kørt', browser: 'Browser Run brugte {s}. {g} uændrede sider blev ikke åbnet igen.', se: 'Se hele revisionen', n: ['bestået', 'fejlet', 'ikke kørt'], fordeling: 'Fordeling af siderne i seneste revision' } },
    en: { alle: 'All', filter: 'Filter the machines by Cloudflare product', viserAlle: 'Showing all {i} machines. Each has a room of its own (→).', viser: 'Showing {n} of {i} machines that use {p}.',
      maskiner: n => n === 1 ? '1 machine' : `${n} machines`, infra: 'infrastructure', kort: 'The cards for this layer',
      t: { til: 'on', fra: 'off', ingen: 'no meter', venter: 'measuring …', tavs: 'not answering' },
      maalt: 'Measured now', kilde: 'The bindings are read from', miljoe: 'environment', tavs: 'The Worker did not answer. The diagram shows only what the page can see for itself; the rest is marked “not answering”.',
      forklaring: 'On: the binding exists in the Worker right now. No meter: the product is used, but health cannot see it. Press a product to see the machines that use it.',
      pile: ['HTTPS · HTTP/3', 'proxy · cache · CSP', 'service binding · /api/ting-ai/', 'bindings'],
      rev: { henter: 'Fetching Gudrun’s latest audit …', ingen: 'The audit is not connected. Gudrun audits by hand, which is to say not at all.', ikke: 'The audit has not run yet. Gudrun is waiting for the morning.',
        linje: '{dato} at {kl}', tal: '<b>{ok}</b> passed · <b>{fejl}</b> failed · <b>{ikke}</b> not run', browser: 'Browser Run used {s}. {g} unchanged pages were not opened again.', se: 'See the whole audit', n: ['passed', 'failed', 'not run'], fordeling: 'Share of pages in the latest audit' } },
  }[lang];

  /* ═══════════ Maskinparken: kataloget ═══════════ */
  const kortEl = $('#paafund #r6-kort'), T6 = (window.TV6 || {})[lang];
  if (kortEl && T6) {
    kortEl.classList.add('r10-katalog');
    for (const m of M) {
      let el;
      if (m.r6) { el = $('#r6-k-' + m.id, kortEl); if (!el) continue; }
      else {
        const [navn, tekst] = m[lang];
        kortEl.insertAdjacentHTML('beforeend', `<a class="r6-kortknap r10-lenke" id="r10-k-${m.id}" href="${esc(m.href[da ? 0 : 1])}"><img class="r6-ik r10-ik" src="/assets/pak/maskinpark/${m.ik || m.id}-128.webp" alt="" width="40" height="40" loading="lazy" decoding="async"><b>${esc(navn)}</b><span>${esc(tekst)}</span></a>`);
        el = kortEl.lastElementChild;
      }
      el.dataset.p = m.p.join(' ');
      el.insertAdjacentHTML('beforeend', `<small class="r10-p">${m.p.map(k => esc(navnP(k))).join(' · ')}</small>`);
    }
    const noegler = Object.keys(BRUGT).sort((a, b) => BRUGT[b] - BRUGT[a] || navnP(a).localeCompare(navnP(b), lang));
    kortEl.insertAdjacentHTML('beforebegin', `<div class="r10-filter" role="group" aria-label="${esc(T.filter)}"><button type="button" class="r10-chip" data-p="" aria-pressed="true">${esc(T.alle)} <i>${M.length}</i></button>${noegler.map(k => `<button type="button" class="r10-chip" data-p="${esc(k)}" aria-pressed="false">${esc(navnP(k))} <i>${BRUGT[k]}</i></button>`).join('')}</div><p class="note r10-viser" id="r10-viser" aria-live="polite"></p>`);
    const chips = $$('.r10-chip'), viser = $('#r10-viser');
    const vaelg = (k, gem) => {
      if (k && !BRUGT[k]) k = '';
      chips.forEach(b => b.setAttribute('aria-pressed', String(b.dataset.p === k)));
      let n = 0;
      $$('.r6-kortknap', kortEl).forEach(el => { const vis = !k || (el.dataset.p || '').split(' ').includes(k); el.hidden = !vis; if (vis) n++; });
      viser.textContent = k ? fmt(T.viser, { n, i: M.length, p: navnP(k) }) : fmt(T.viserAlle, { i: M.length, a: M.filter(m => m.r6).length, b: M.filter(m => !m.r6).length });
      if (gem) { try { const u = new URL(location.href); if (k) u.searchParams.set('produkt', k); else u.searchParams.delete('produkt'); history.replaceState(history.state, '', u); } catch (e) { } }
    };
    chips.forEach(b => b.addEventListener('click', () => vaelg(b.getAttribute('aria-pressed') === 'true' ? '' : b.dataset.p, true)));
    vaelg(new URLSearchParams(location.search).get('produkt') || '', false);
  }

  /* ═══════════ Maskinrummet: arkitekturdiagrammet ═══════════ */
  const ark = $('#arkitektur');
  if (ark) {
    const park = da ? '/oplevelser/maskinparken/' : '/en/experiences/machine-park/';
    const tilstand = (k, h, fase) => {
      const f = P[k][3];
      if (f === 'side') return 'til';
      if (fase === 'venter') return 'venter';
      if (!h) return f === null ? 'ingen' : 'tavs';
      if (f === 'svar') return 'til';
      if (f === null) return 'ingen';
      return f.some(x => h.configured && h.configured[x]) ? 'til' : 'fra';
    };
    const lagHtml = (lag, h, fase) => {
      const [navn, tekst] = LAG[lag][lang];
      const noder = Object.keys(P).filter(k => P[k][0] === lag).map(k => {
        const t = tilstand(k, h, fase), n = BRUGT[k] || 0;
        return `<li><a class="r10-node" data-t="${t}" href="${n ? `${park}?produkt=${encodeURIComponent(k)}` : `#lag-${lag}`}"><span class="r10-prik" aria-hidden="true"></span><b>${esc(navnP(k))}</b> <i>${esc(n ? T.maskiner(n) : T.infra)}</i><span class="sr-only">, ${esc(T.t[t])}</span></a></li>`;
      }).join('');
      return `<div class="r10-lag" data-lag="${lag}" role="group" aria-labelledby="ark-${lag}"><div class="r10-lag-hoved"><b id="ark-${lag}">${esc(navn)}</b><span>${esc(tekst)}</span><a href="#lag-${lag}">${esc(T.kort)}</a></div><ul class="r10-noder">${noder}</ul></div>`;
    };
    const pil = i => `<div class="r10-pil" aria-hidden="true"><span>${esc(T.pile[i])}</span></div>`;
    const tegn = (h, fase, ms) => {
      const linje = fase === 'venter' ? `<span class="r6-kilde">${esc(T.t.venter)}</span>`
        : h ? `<span class="r6-kilde r6-kilde-server">${esc(T.maalt)}</span> ${esc(T.kilde)} <code>GET /api/ting-ai/health</code> · <b>${esc(Math.round(ms))} ms</b> · ${esc(T.miljoe)} <code>${esc(h.miljoe || 'production')}</code>`
        : `<span class="r6-kilde r6-kilde-offline">${esc(T.t.tavs)}</span> ${esc(T.tavs)}`;
      ark.innerHTML = `<p class="r6-kildelinje r10-ark-kilde" aria-live="polite">${linje}</p><div class="r10-ark">${lagHtml('browser', h, fase)}${pil(0)}${lagHtml('kant', h, fase)}${pil(1)}${lagHtml('levering', h, fase)}${pil(2)}${lagHtml('beregning', h, fase)}${pil(3)}<div class="r10-par">${lagHtml('data', h, fase)}${lagHtml('ai', h, fase)}</div></div><p class="note">${esc(T.forklaring)}</p>`;
    };
    tegn(null, 'venter', 0);
    const t0 = performance.now();
    fetch('/api/ting-ai/health', { credentials: 'same-origin' }).then(r => r.json()).then(b => tegn(b && b.ok ? b.data : null, 'ok', performance.now() - t0)).catch(() => tegn(null, 'fejl', 0));

  }

  // Et link til et lag (diagrammet, »Til maskinerne«) eller en adresse med #lag-… folder netop det lag ud (foldningen bor i site.js)
  const aabnLag = id => { const l = document.getElementById(id); if (l && l.classList.contains('mr-lag') && window.tvFold) window.tvFold.saetLag(l, true); };
  document.addEventListener('click', e => { const a = e.target.closest && e.target.closest('a[href^="#lag-"]'); if (a) aabnLag(a.getAttribute('href').slice(1)); });
  if (/^#lag-/.test(location.hash)) { aabnLag(location.hash.slice(1)); requestAnimationFrame(() => { const m = document.getElementById(location.hash.slice(1)); if (m) m.scrollIntoView(); }); }

  /* ═══════════ Maskinrummet: resumé af revisionen ═══════════ */
  const rr = $('#revision-resume');
  if (rr) {
    const R = T.rev, G = ((window.TV_R9 || {})[lang] || {}).rev || {}, GG = G.gudrun || {};
    rr.innerHTML = `<p class="r6-status venter">${esc(R.henter)}</p>`;
    const side = da ? '/maskinrummet/revisionen/' : '/en/machine-room/audit/';
    const knap = `<p class="r11-handling"><a class="r11-knap" href="${side}">${esc(R.se)}</a></p>`;
    fetch(`/api/ting-ai/revision?lang=${lang}`, { credentials: 'same-origin' }).then(r => r.json()).then(b => {
      if (!b || !b.ok || !b.data) throw new Error('ikke tilsluttet');
      const d = b.data, s = d.pages || [];
      const n = { ok: s.filter(p => p.status === 'bestaaet').length, fejl: s.filter(p => p.status === 'fejlet').length, ikke: s.filter(p => p.status === 'ikke_koert').length };
      const genbrugt = s.filter(p => p.genbrugt).length, sek = s.reduce((a, p) => a + (+p.browserMs || 0), 0) / 1000;
      const varighed = sek >= 90 ? `${tal(Math.round(sek / 6) / 10)} min` : `${tal(Math.round(sek))} s`;
      const gud = !d.date ? R.ikke : !n.fejl ? GG.alle : n.fejl > s.length / 2 ? GG.mange : fmt(GG.nogle || '', { n: n.fejl });
      rr.innerHTML = (d.date ? `<p class="r6-kildelinje"><span class="r6-kilde r6-kilde-server">${esc(G.seneste || '')}</span> ${esc(fmt(R.linje, { dato: dato(d.date), kl: d.finishedAt ? kl(d.finishedAt) : '–' }))}</p>
        <div class="r11-rev-tal">${[['ok', n.ok], ['fejl', n.fejl], ['ikke', n.ikke]].map(([k, v], i) => `<div data-k="${k}"><b>${tal(v)}</b><span>${esc(R.n[i])}</span></div>`).join('')}</div>
        <div class="r11-rev-bar" role="img" aria-label="${esc(R.fordeling)}: ${fmt(R.tal, { ok: tal(n.ok), fejl: tal(n.fejl), ikke: tal(n.ikke) }).replace(/<\/?b>/g, '')}">${[['ok', n.ok], ['fejl', n.fejl], ['ikke', n.ikke]].filter(([, v]) => v).map(([k, v]) => `<span data-k="${k}" style="flex-grow:${v}"></span>`).join('')}</div>
        <p class="note">${esc(fmt(R.browser, { s: varighed, g: tal(genbrugt) }))}</p>` : '') + `<p class="r9-gudrun">${esc(gud || '')}</p>${knap}`;
    }).catch(() => { rr.innerHTML = `<p class="note">${esc(R.ingen)}</p>${knap}`; });
  }
  /* ═══════════ Maskinrummet: din vej hertil (request.cf) og tælleværket (Analytics Engine) ═══════════ */
  const V = {
    da: { henter: 'Spørger kanten …', kantTavs: 'Kanten svarede ikke. Siden kom alligevel frem, så den var der.',
      kant: 'Siden, du læser, blev sendt fra Cloudflares datacenter i <b>{by}</b> ({colo}).', kantUkendt: 'Siden, du læser, blev sendt fra Cloudflares datacenter <b>{colo}</b>.',
      forb: ['Protokol', 'Kryptering', 'Tur-retur målt af kanten', 'Dette kald, målt i din browser'], ukendt: 'ukendt',
      kantNote: 'Tallene kommer fra <code>request.cf</code>, som Cloudflare hæfter på hver forespørgsel. Endpointet læser datacenter, protokol, TLS-version og tur-retur-tid og intet andet: ingen IP, by, land eller udbyder, og intet gemmes.',
      tHenter: 'Tæller …', tIngen: 'Tælleværket er ikke tilsluttet endnu. Tinget tæller på fingrene, og det har kun ti.', tSkriver: 'Tælleværket skriver, men kan ikke læses fra Workeren endnu (Analytics SQL-bindingen mangler). Tallene samles alligevel.',
      tFejl: 'Tælleværket svarede ikke lige nu. Prøv igen om lidt.', fliser: [['side', 'sider vist'], ['md', 'sider læst som Markdown'], ['api', 'kald til maskinerne'], ['fejl', 'sider ikke fundet']],
      sidste: 'Seneste døgn', timer: 'Sidevisninger og maskinkald pr. time, seneste døgn', colos: 'Datacentre, der svarede', h: 'Hændelser, seneste uge',
      hn: { 'stol-flyttet': 'stolen flyttet', 'stemme-afgivet': 'stemmer afgivet', 'revision-bestaaet': 'sider bestod revisionen', 'revision-fejlet': 'sider dumpede revisionen', 'gudrun-issue-oprettet': 'GitHub-issues oprettet af Gudrun', 'gudrun-issue-lukket': 'GitHub-issues lukket af Gudrun', 'mcp-protokol': 'MCP-opslag i protokollen', 'mcp-hittegods': 'MCP-søgninger i hittegods', 'mcp-sag-rejst': 'sager rejst via MCP', 'mcp-stemme': 'stemmer via MCP', 'mcp-stol': 'stolen flyttet via MCP', 'mcp-afgoer': 'afgørelser forsøgt via MCP', 'arkiv-spoergsmaal': 'spørgsmål til arkivet', 'arkiv-synk': 'sider lagt i arkivet' },
      api: 'Travleste maskiner', ms: 'ms i snit', tom: 'Intet talt endnu. Tælleværket blev sat i gang for nylig.', live: 'Målt nu', gemt: 'Gemt resultat',
      kilde: 'Fra Analytics Engine via Analytics SQL · svartid {ms} ms · data er stikprøvevægtede.', aeld: 'Tallene er højst fem minutter gamle.' },
    en: { henter: 'Asking the edge …', kantTavs: 'The edge did not answer. The page arrived anyway, so it was there.',
      kant: 'The page you are reading was sent from Cloudflare’s data centre in <b>{by}</b> ({colo}).', kantUkendt: 'The page you are reading was sent from Cloudflare’s data centre <b>{colo}</b>.',
      forb: ['Protocol', 'Encryption', 'Round trip measured by the edge', 'This call, measured in your browser'], ukendt: 'unknown',
      kantNote: 'The numbers come from <code>request.cf</code>, which Cloudflare attaches to every request. The endpoint reads the data centre, protocol, TLS version and round-trip time and nothing else: no IP, city, country or provider, and nothing is stored.',
      tHenter: 'Counting …', tIngen: 'The counting works are not connected yet. The thing counts on its fingers, and it only has ten.', tSkriver: 'The counting works are writing, but cannot be read from the Worker yet (the Analytics SQL binding is missing). The numbers are still being collected.',
      tFejl: 'The counting works did not answer just now. Try again in a moment.', fliser: [['side', 'pages viewed'], ['md', 'pages read as Markdown'], ['api', 'calls to the machines'], ['fejl', 'pages not found']],
      sidste: 'Last 24 hours', timer: 'Page views and machine calls per hour, last 24 hours', colos: 'Data centres that answered', h: 'Events, last week',
      hn: { 'stol-flyttet': 'stool moves', 'stemme-afgivet': 'votes cast', 'revision-bestaaet': 'pages passed the audit', 'revision-fejlet': 'pages failed the audit', 'gudrun-issue-oprettet': 'GitHub issues opened by Gudrun', 'gudrun-issue-lukket': 'GitHub issues closed by Gudrun', 'mcp-protokol': 'MCP look-ups in the minutes', 'mcp-hittegods': 'MCP lost property searches', 'mcp-sag-rejst': 'cases raised via MCP', 'mcp-stemme': 'votes via MCP', 'mcp-stol': 'stool moves via MCP', 'mcp-afgoer': 'decisions attempted via MCP', 'arkiv-spoergsmaal': 'questions to the archive', 'arkiv-synk': 'pages put in the archive' },
      api: 'Busiest machines', ms: 'ms on average', tom: 'Nothing counted yet. The counting works were started recently.', live: 'Measured now', gemt: 'Saved result',
      kilde: 'From Analytics Engine via Analytics SQL · response time {ms} ms · data are sample-weighted.', aeld: 'The numbers are at most five minutes old.' },
  }[lang];
  let byer = null;
  const hentByer = () => byer ? Promise.resolve(byer) : fetch('/assets/colo.json').then(r => r.ok ? r.json() : {}).catch(() => ({})).then(j => (byer = j));
  const byAf = k => (byer && Array.isArray(byer[k]) ? byer[k][da ? 0 : 1] : k);

  const kk = $('#kant-kort');
  if (kk) {
    kk.innerHTML = `<p class="r6-status venter">${esc(V.henter)}</p>`;
    const t0 = performance.now();
    fetch('/api/kant', { credentials: 'same-origin', cache: 'no-store' }).then(r => r.json()).then(b => {
      const ms = performance.now() - t0;
      if (!b || !b.ok || !b.data) throw new Error('nej');
      const d = b.data, by = d.by ? d.by[lang] : null;
      const hoved = d.colo ? fmt(by ? V.kant : V.kantUkendt, { by: esc(by), colo: esc(d.colo) }) : esc(V.kantTavs);
      const raekke = (k, v) => `<div><dt>${esc(k)}</dt><dd>${v}</dd></div>`;
      kk.innerHTML = `<p class="r6-kildelinje"><span class="r6-kilde r6-kilde-server">${esc(V.live)}</span> <code>GET /api/kant</code></p>
        <p class="r10-kant-hoved">${hoved}</p>
        <dl class="r10-dl">${raekke(V.forb[0], esc(d.protokol || V.ukendt))}${raekke(V.forb[1], esc(d.tls || V.ukendt))}${raekke(V.forb[2], d.rttMs != null ? `${tal(d.rttMs)} ms` : esc(V.ukendt))}${raekke(V.forb[3], `${tal(Math.round(ms))} ms`)}</dl>
        <p class="note">${V.kantNote}</p>`;
    }).catch(() => { kk.innerHTML = `<p class="note">${esc(V.kantTavs)}</p>`; });
  }

  const tv = $('#taelle');
  if (tv) {
    tv.innerHTML = `<p class="r6-status venter">${esc(V.tHenter)}</p>`;
    const soejler = timer0 => {
      if (!timer0.length) return '';
      // Altid hele døgnet: 24 timepladser til og med den aktuelle time, også dem uden data (tælleværket kan være nyt).
      const slut = Math.floor(Date.now() / 3600e3) * 3600e3, efter = new Map(timer0.map(t => [Math.floor(Date.parse(t.t) / 3600e3) * 3600e3, t]));
      const timer = Array.from({ length: 24 }, (_, i) => { const ms = slut - (23 - i) * 3600e3; return efter.get(ms) || { t: new Date(ms).toISOString(), side: 0, md: 0, api: 0 }; });
      const W = 480, H = 96, n = timer.length, bw = W / Math.max(n, 1), max = Math.max(1, ...timer.map(t => t.side + t.md + t.api));
      const bar = timer.map((t, i) => {
        const hs = (t.side + t.md) / max * (H - 14), ha = t.api / max * (H - 14), x = i * bw + 1, w = Math.max(1, bw - 2);
        return `<rect class="r10-s-side" x="${x.toFixed(1)}" y="${(H - hs).toFixed(1)}" width="${w.toFixed(1)}" height="${hs.toFixed(1)}"><title>${esc(kl(t.t))}: ${tal(t.side + t.md)}</title></rect><rect class="r10-s-api" x="${x.toFixed(1)}" y="${(H - hs - ha).toFixed(1)}" width="${w.toFixed(1)}" height="${ha.toFixed(1)}"><title>${esc(kl(t.t))}: ${tal(t.api)}</title></rect>`;
      }).join('');
      const sum = timer.reduce((a, t) => a + t.side + t.md, 0), sumA = timer.reduce((a, t) => a + t.api, 0);
      const akse = [0, 6, 12, 18, 23].map(i => `<span style="left:${((i + .5) / n * 100).toFixed(2)}%">${esc(kl(timer[i].t))}</span>`).join('');
      return `<figure class="r10-soejler"><svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" role="img" aria-label="${esc(V.timer)}: ${tal(sum)} / ${tal(sumA)}"><line class="r11-akse" x1="0" x2="${W}" y1="${H - .5}" y2="${H - .5}"></line>${bar}</svg><div class="r11-tidsakse" aria-hidden="true">${akse}</div><figcaption>${esc(V.timer)} <span class="r10-lg r10-lg-side"></span>${esc(V.fliser[0][1])} <span class="r10-lg r10-lg-api"></span>${esc(V.fliser[2][1])}</figcaption></figure>`;
    };
    fetch(`/api/ting-ai/taelle?lang=${lang}`, { credentials: 'same-origin' }).then(r => r.json().then(b => [r.status, b])).then(async ([st, b]) => {
      if (st === 503 && b && b.code === 'not_configured') { tv.innerHTML = `<p class="note">${esc(V.tIngen)}</p>`; return; }
      if (!b || !b.ok || !b.data) throw new Error('nej');
      const d = b.data;
      if (d.tilstand === 'skriver') { tv.innerHTML = `<p class="note">${esc(V.tSkriver)}</p>`; return; }
      await hentByer();
      const tot = d.totaler || {}, tom = !Object.values(tot).some(Boolean);
      const fliser = V.fliser.map(([k, t]) => `<div class="r10-flise" data-k="${k}"><b>${tal(tot[k] || 0)}</b><span>${esc(t)}</span></div>`).join('');
      const colos = (d.colos || []).map(c => `<li><b>${esc(byAf(c.colo))}</b> <code>${esc(c.colo)}</code> <i>${tal(c.n)}</i></li>`).join('');
      const h = (d.haendelser || []).filter(x => V.hn[x.navn]).map(x => `<li><b>${tal(x.n)}</b> ${esc(V.hn[x.navn])}</li>`).join('');
      const api = (d.api || []).map(x => `<li><code>${esc(x.navn)}</code> <i>${tal(x.n)} · ${tal(x.ms)} ${esc(V.ms)}</i></li>`).join('');
      const s = d.statistik || {};
      tv.innerHTML = `<p class="r6-kildelinje"><span class="r6-kilde ${b.source === 'cached' ? 'r6-kilde-cached' : 'r6-kilde-server'}">${esc(b.source === 'cached' ? V.gemt : V.live)}</span> <code>GET /api/ting-ai/taelle</code> · ${esc(V.sidste)}</p>
        ${tom ? `<p class="note">${esc(V.tom)}</p>` : ''}
        <div class="r10-fliser">${fliser}</div>${soejler(d.timer || [])}
        <div class="r10-par r10-lister">${colos ? `<div><h4>${esc(V.colos)}</h4><ol class="r10-liste">${colos}</ol></div>` : ''}${api ? `<div><h4>${esc(V.api)}</h4><ol class="r10-liste">${api}</ol></div>` : ''}</div>
        ${h ? `<h4>${esc(V.h)}</h4><ul class="r10-liste r10-haendelser">${h}</ul>` : ''}
        <p class="note">${esc(fmt(V.kilde, { ms: tal(Math.round(s.elapsed_ms || 0)) }))} ${esc(V.aeld)}</p>`;
    }).catch(() => { tv.innerHTML = `<p class="note">${esc(V.tFejl)}</p>`; });
  }
})();
