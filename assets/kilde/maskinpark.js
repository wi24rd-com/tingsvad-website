/* tingsvad.dk — runde 6: Tingets maskinpark (C01–C08). Tekster i maskinpark-tekst.js, stil nederst i site.css.
   Taler med Worker-laget under /api/ting-ai/. Uden tilsluttet backend vises mærkede redaktionelle eksempler;
   intet redaktionelt vises som et AI-svar, og ingen demo ligner andre gæster. */
(function () {
  const lang = document.documentElement.lang === 'en' ? 'en' : 'da', da = lang === 'da';
  const T = window.TV6 && window.TV6[lang]; if (!T) return;
  const sek = document.getElementById('paafund'); if (!sek) return;
  const $ = (s, r) => (r || document).querySelector(s), $$ = (s, r) => [...(r || document).querySelectorAll(s)];
  const reduce = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
  const base = ($('link[rel="stylesheet"][href*="site.css"]').getAttribute('href').split('site.css')[0]);
  const AI = base + 'pak/ai/', PAK = base + 'pak/';
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const fmt = (s, o) => String(s).replace(/\{(\w+)\}/g, (m, k) => (o && k in o) ? o[k] : m);
  const img = (src, alt, w, h, cls, extra) => `<img src="${src}" alt="${esc(alt || '')}" width="${w}" height="${h}" decoding="async"${cls ? ` class="${cls}"` : ''}${alt ? '' : ' aria-hidden="true"'}${extra || ''}>`;
  /* SVG-ikoner fra byggepakken (grafik/*.svg), inlinet så de kan farves med currentColor. Originalerne ligger i assets/pak/ikon/. */
  const IKONER = {
    'afstemning': '<path d="M14 27h36v28H14zM23 34h18M24 9l19 8-8 18-19-8z"/>',
    'avis': '<path d="M12 10h34v42a5 5 0 0 0 10 0V22H46M12 10v42a5 5 0 0 0 5 5h34M20 20h18M20 28h18M20 37h7v10h-7zM33 37h6M33 45h6"/>',
    'bevisvaerksted': '<path d="M12 54h40M19 54V37h26v17M17 37h30M23 37l3-13h12l3 13M27 24V13h10v11M45 12v10M40 17h10"/>',
    'billedbevis': '<rect x="10" y="10" width="36" height="36" rx="3"/><circle cx="21" cy="21" r="4"/><path d="m14 41 11-11 9 7 8-9M46 46l10 10"/><circle cx="43" cy="43" r="9"/>',
    'brian-guide': '<path d="m15 29-3-17 16 10h8l16-10-3 17 3 12-20 15-20-15zM23 33h1M40 33h1M27 42l5 5 5-5zM32 47v5"/>',
    'radio': '<rect x="9" y="27" width="46" height="27" rx="4"/><path d="m17 27 29-15M16 35h17M16 42h17M16 48h17"/><circle cx="44" cy="41" r="6"/>',
    'retssal': '<path d="M10 54h44M16 50V25h32v25M12 25l20-15 20 15M24 32v12M40 32v12"/>',
    'sagsgang': '<path d="M10 15h30v12H10zM24 37h30v15H24zM39 21h11v11M46 28l4 4 4-4M17 27v18h7M18 41l6 4-6 4M30 44h17"/>',
    'stemme-eventuelt': '<circle cx="32" cy="32" r="24"/><path d="M24 24a8 8 0 0 1 16 0c0 7-8 7-8 14M32 45h.01"/>',
    'stemme-ja': '<circle cx="32" cy="32" r="24"/><path d="m20 32 8 9 17-19"/>',
    'stemme-nej': '<circle cx="32" cy="32" r="24"/><path d="m23 23 18 18M41 23 23 41"/>',
  };
  const ikonId = id => id === 'vaerksted' ? 'bevisvaerksted' : id === 'brian' ? 'brian-guide' : id === 'sagskontor' ? 'sagsgang' : id;
  const ikon = id => `<svg class="r6-ik" aria-hidden="true" viewBox="0 0 64 64" width="28" height="28" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">${IKONER[ikonId(id)] || ''}</svg>`;
  /* Ravnen taler, når lyden spiller; stille ved pause, slut, buffering og reduced motion. Ingen lyd genereres her. */
  function ravnTilLyd(audio, bird) {
    if (!audio || !bird) return;
    const reduce = matchMedia('(prefers-reduced-motion: reduce)');
    const opdater = () => { const aktiv = !audio.paused && !audio.ended && audio.readyState >= 3; const next = aktiv && !reduce.matches ? bird.dataset.talking : bird.dataset.still; if (bird.getAttribute('src') !== next) bird.setAttribute('src', next); };
    for (const n of ['playing', 'pause', 'ended', 'waiting', 'stalled', 'emptied', 'error', 'seeking', 'seeked']) audio.addEventListener(n, opdater);
    reduce.addEventListener('change', opdater); opdater();
  }
  const scene = (fil, alt) => `<figure class="r6-scene">${img(AI + fil + '.webp', alt, 1279, 720, '', ' loading="lazy"')}</figure>`;
  const avatar = (id, stor) => `<img class="r6-avatar" src="${PAK}portraetter/${id}${stor ? '' : '-128'}.webp" alt="" width="128" height="128" loading="lazy" decoding="async">`;
  const navn = id => T.figurer[id] || id;
  const datoDK = iso => { try { return new Date(iso + 'T12:00:00Z').toLocaleDateString(da ? 'da-DK' : 'en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Europe/Copenhagen' }); } catch (e) { return iso; } };

  /* ── Kilde-mærke: vises altid, så ingen tekst kan forveksles ── */
  const kilde = (src) => `<span class="r6-kilde r6-kilde-${esc(src)}">${esc(T.kilde[src] || src)}</span>`;

  /* ── Lokal hukommelse for runde 6 (adskilt fra round5's nøgle) ── */
  const KEY = 'tingsvad.ai.v1';
  const defaults = () => ({ schemaVersion: 1, chairCase: null, pendingStool: null, lastRoom: null });
  function load() { try { const o = JSON.parse(localStorage.getItem(KEY) || 'null'); if (o && o.schemaVersion === 1) return Object.assign(defaults(), o); } catch (e) { } return defaults(); }
  let S = load();
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { } };
  // round5's fund læses kun til personalisering af Mímir
  function kendteFragmenter() { try { const o = JSON.parse(localStorage.getItem('tingsvad.experience.v1') || 'null'); return o && Array.isArray(o.fragments) ? o.fragments.filter(x => typeof x === 'string').slice(0, 8) : []; } catch (e) { return []; } }

  /* ── API-klient ── */
  const API = '/api/ting-ai/';
  let konfig = null; // fra /health; null = ukendt
  async function api(path, opts) {
    const o = Object.assign({ method: 'GET', headers: {} }, opts || {});
    if (o.json) { o.body = JSON.stringify(o.json); o.headers['content-type'] = 'application/json'; delete o.json; }
    o.credentials = 'same-origin';
    const t0 = performance.now();
    let r; try { r = await fetch(API + path, o); } catch (e) { logKald({ method: o.method, path, status: 0, ms: performance.now() - t0, code: 'network' }); return { ok: false, code: 'network', message: T.drift.fejl }; }
    let body = null; try { body = await r.json(); } catch (e) { }
    if (path !== 'health') logKald({ method: o.method, path, status: r.status, ms: performance.now() - t0, timing: r.headers.get('server-timing'), cache: r.headers.get('x-tingsvad-cache'), kantcache: r.headers.get('x-tingsvad-kantcache'), source: body && body.source, code: body && !body.ok ? body.code : null });
    if (!body || typeof body.ok !== 'boolean') return { ok: false, code: 'not_configured', message: T.drift.offline, status: r.status }; // ikke-JSON = ingen funktion bag stien
    body.status = r.status; return body;
  }
  function fejlTekst(res) {
    if (!res || res.ok) return '';
    if (res.code === 'quota' || res.code === 'rate_limited') return res.message || T.drift.kvote;
    if (res.code === 'not_configured') return T.drift.offline;
    return res.message || T.drift.fejl;
  }
  async function hentKonfig() { if (konfig) return konfig; const r = await api('health'); konfig = r.ok && r.data ? r.data : { configured: {} }; return konfig; }
  const har = (k) => !!(konfig && konfig.configured && konfig.configured[k]);

  /* ── Vis maskineriet (runde 9): produkter, faktisk kald, målt svartid, Server-Timing, kildefil ── */
  const GH = 'https://github.com/wi24rd-com/tingsvad-website/blob/main/';
  const MASKINERI = {
    retssal: { p: ['Site-Worker → Service Binding', 'Workers', 'Workers AI · Llama 3.3 70B (JSON)', 'Workers AI · Whisper large v3 turbo', 'AI Gateway', 'D1', 'Rate Limiting'], f: ['worker/src/features/court.js', 'worker/src/features/tale.js', 'worker/src/lib/ai.js'] },
    afstemning: { p: ['Durable Objects (SQLite)', 'WebSocket Hibernation', 'D1', 'Workers Cache'], f: ['worker/src/room.js', 'worker/src/lib/roomlogic.js', 'worker/src/lib/dagbog.js'], ws: true },
    avis: { p: ['Cron Triggers', 'Workers AI · Llama 3.3 70B', 'D1', 'Workers Cache'], f: ['worker/src/features/news.js', 'worker/src/lib/kanon.js', 'assets/kanon.json', 'worker/src/lib/kantcache.js'] },
    billedbevis: { p: ['Workers AI · Llama 3.2 Vision', 'Images', 'Turnstile', 'D1'], f: ['worker/src/features/vision.js'] },
    vaerksted: { p: ['Workers AI · FLUX.1 schnell', 'R2', 'D1', 'Idempotency'], f: ['worker/src/features/forge.js'] },
    sagskontor: { p: ['Workflows', 'D1', 'Idempotency'], f: ['worker/src/features/jobs.js', 'worker/src/workflow.js'] },
    brian: { p: ['Vectorize', 'Workers AI · bge-m3 + Llama 3.3', 'D1'], f: ['worker/src/features/guide.js', 'worker/src/lib/archive.js'] },
    radio: { p: ['Cron Triggers', 'Workers AI · Deepgram Aura-2', 'R2 (Range)', 'D1', 'Workers Cache'], f: ['worker/src/features/radio.js', 'worker/src/lib/kantcache.js'] },
  };
  const MN = T.maskineri;
  let kald = [];
  const ms = x => (x < 10 ? x.toFixed(1) : Math.round(x)) + ' ms';
  function parseTiming(h) { return String(h || '').split(',').map(x => x.trim()).filter(Boolean).map(x => { const [navn, ...rest] = x.split(';'); const o = { navn: navn.trim() }; rest.forEach(r => { const [k, v] = r.split('='); if (k && v) o[k.trim()] = v.trim().replace(/^"|"$/g, ''); }); return o; }); }
  const antalKald = desc => { const n = parseInt(desc, 10); return isNaN(n) ? desc : n + ' ' + (da ? 'kald' : (n === 1 ? 'call' : 'calls')); };
  function logKald(k) { k.at = new Date(); kald.unshift(k); kald = kald.slice(0, 5); tegnMaskineri(); }
  function tegnMaskineri() {
    const box = $('#r6-maskineri-ind', sek); if (!box || !aktivt) return;
    if (window.tvKaede && MASKINERI[aktivt]) window.tvKaede.tegn($('#r6-mk-kaede', sek), MASKINERI[aktivt], kald[0] || null); // runde 12: kæden som på infrastrukturkortet
    box.innerHTML = kald.length ? kald.map(k => {
      const st = parseTiming(k.timing), tot = st.find(x => x.navn === 'total'), dele = st.filter(x => x.navn !== 'total' && x.dur != null); // Cloudflare tilføjer egne poster uden dur (fx cfExtPri)
      const tag = k.code === 'network' || k.status >= 400 ? `<span class="r6-kilde r6-kilde-offline">${esc(MN.fejl)} ${esc(k.code || k.status)}</span>` : (k.source ? kilde(k.source) : '') + (k.cache ? ' ' + kilde(k.cache === 'replay' ? 'replay' : 'cached') : '') + (k.kantcache ? ` <span class="r6-kilde r6-kilde-kant">Workers Cache · ${esc(k.kantcache)}</span>` : '');
      return `<li><code>${esc(k.method)} /api/ting-ai/${esc(k.path.split('?')[0])}</code> <span class="r6-mk-status">${esc(k.status || '—')}</span> ${tag}
        <div class="r6-mk-tal"><b>${esc(ms(k.ms))}</b> ${esc(MN.browser)}${tot ? ` · <b>${esc(ms(+tot.dur))}</b> ${esc(MN.total)}` : ''} · ${esc(MN.tid)} ${esc(k.at.toLocaleTimeString(da ? 'da-DK' : 'en-GB'))}</div>
        ${dele.length ? `<div class="r6-mk-dele" aria-label="${esc(MN.server)}">${dele.map(d => `<span><code>${esc(d.navn)}</code> ${esc(ms(+d.dur || 0))}${d.desc ? ` <i>${esc(antalKald(d.desc))}</i>` : ''}</span>`).join('')}</div>` : ''}</li>`;
    }).join('') : `<li class="note">${esc(MN.ingen)}</li>`;
  }
  function monterMaskineri(id) {
    const m = MASKINERI[id]; if (!m) return '';
    return `<details class="r6-maskineri" id="r6-maskineri"><summary>${esc(MN.titel)}</summary><p class="note">${esc(MN.under)}</p>
      <div class="r6-mk-kaede" id="r6-mk-kaede"></div>
      ${m.ws ? `<p class="note">${esc(MN.ws)}</p>` : ''}
      <p><b>${esc(MN.kald)}</b></p><ul class="r6-mk-kald" id="r6-maskineri-ind" aria-live="polite"></ul>
      <p class="note">${esc(MN.note)}</p>
      <p class="r6-mk-kode"><b>${esc(MN.kode)}:</b> ${m.f.map(x => `<a href="${GH}${x}" rel="noopener">${esc(x)}</a>`).join(' · ')}</p></details>`;
  }

  /* ── Sektionens kort og panel ── */
  const kortEl = $('#r6-kort', sek), panelEl = $('#r6-panel', sek), driftEl = $('#r6-drift', sek);
  let aktivt = null, cleanup = [];
  const onCleanup = f => cleanup.push(f);
  /* Runde 12: hver maskine har sit eget rum. Oversigten viser kort, der linker dertil; på rummets side
     (<section id="paafund" data-maskine="…">) åbner maskinen af sig selv, uden panelhoved og luk-knap. */
  const RUM = {
    retssal: ['retssalen', 'courtroom'], afstemning: ['afstemningen', 'the-vote'], avis: ['tidende', 'the-paper'], billedbevis: ['billedbevis', 'image-evidence'],
    vaerksted: ['bevisvaerkstedet', 'evidence-workshop'], sagskontor: ['sagskontoret', 'case-office'], brian: ['mimirs-guide', 'mimirs-guide'], radio: ['radio', 'radio'],
  };
  const rum = id => RUM[id] ? (da ? '/oplevelser/maskinparken/' : '/en/experiences/machine-park/') + RUM[id][da ? 0 : 1] + '/' : null;
  const egen = sek.dataset.maskine || '';
  if (kortEl && !egen) kortEl.innerHTML = T.kort.map(k => `<a class="r6-kortknap" id="r6-k-${k[0]}" data-id="${k[0]}" href="${rum(k[0])}">${ikon(k[0])}<b>${esc(k[1])} <span aria-hidden="true">→</span></b><span>${esc(k[2])}</span></a>`).join('');
  const mounts = {};
  function aabn(id, rolig) {
    if (id !== egen) { const u = rum(id); if (u) location.href = u; return; } // en anden maskine: gå til dens rum
    if (egen) {
      cleanup.forEach(f => { try { f(); } catch (e) { } }); cleanup = [];
      aktivt = id; sek.classList.add('r6-eget-rum'); panelEl.hidden = false;
      panelEl.innerHTML = `<div class="r6-ind" id="r6-ind"></div>${monterMaskineri(id)}`;
      kald = []; tegnMaskineri();
      const ind = $('#r6-ind', panelEl);
      hentKonfig().then(() => { if (aktivt === id) mounts[id](ind); });
      return;
    }
    cleanup.forEach(f => { try { f(); } catch (e) { } }); cleanup = [];
    if (aktivt === id) { aktivt = null; panelEl.innerHTML = ''; panelEl.hidden = true; $$('.r6-kortknap', kortEl).forEach(b => b.setAttribute('aria-expanded', 'false')); return; }
    aktivt = id; const k = T.kort.find(x => x[0] === id);
    $$('.r6-kortknap', kortEl).forEach(b => b.setAttribute('aria-expanded', String(b.dataset.id === id)));
    panelEl.hidden = false;
    panelEl.innerHTML = `<div class="r6-panelhoved"><h3>${ikon(id)}${esc(k[1])}</h3><button type="button" class="knap sek r6-luk" id="r6-luk">${esc(T.luk)}</button></div><div class="r6-ind" id="r6-ind"></div>${monterMaskineri(id)}`;
    kald = []; tegnMaskineri();
    $('#r6-luk', panelEl).addEventListener('click', () => { aabn(id); $('#r6-k-' + id, kortEl)?.focus(); });
    const ind = $('#r6-ind', panelEl);
    hentKonfig().then(() => { if (aktivt !== id) return; mounts[id](ind); if (!rolig) panelEl.scrollIntoView?.({ block: 'start', behavior: reduce() ? 'auto' : 'smooth' }); });
  }
  hentKonfig().then(c => { if (!driftEl) return; const alle = ['ai', 'db']; const nogen = alle.some(k => c.configured && c.configured[k]); driftEl.textContent = nogen ? '' : T.drift.offline; driftEl.hidden = nogen; });

  /* ── Fælles små hjælpere ── */
  const status = (el, tekst, cls) => { el.className = 'r6-status' + (cls ? ' ' + cls : ''); el.textContent = tekst || ''; };
  const taleKort = (id, tekst) => `<article class="r6-tale"><header>${avatar(id)}<b>${esc(navn(id))}</b></header><p>${esc(tekst)}</p></article>`;

  /* ═══════════ C01 — AI-retssalen ═══════════ */
  mounts.retssal = function (el) {
    const R = T.retssal; let roundRef = null, replikBrugt = false, travl = false;
    el.innerHTML = `<div class="r6-split">${scene('ai-retssal', R.scene)}<div class="r6-txt">
      <p class="lead">${esc(T.kort[0][2])}</p>
      <form id="rs-form" class="r6-form"><label for="rs-arg">${esc(R.label)}</label><textarea id="rs-arg" maxlength="500" rows="4" placeholder="${esc(R.placeholder)}" required></textarea>
      <div class="r6-rk"><span class="note" id="rs-taeller">${esc(fmt(R.taeller, { n: 0 }))}</span><span class="r6-rs-knapper"><button type="button" class="knap sek r6-mik" id="rs-mik" hidden aria-pressed="false"><span aria-hidden="true">🎙</span> <span id="rs-mik-t">${esc(R.tale.knap)}</span></button><button type="submit" class="knap" id="rs-send">${esc(R.send)}</button></span></div><p class="note" id="rs-mik-note" hidden>${esc(R.tale.note)}</p></form>
      <p class="r6-status" id="rs-status" aria-live="polite"></p><p class="note">${esc(R.note)}</p></div></div>
      <div class="r6-taler" id="rs-taler" aria-live="polite"></div>
      <form id="rs-replik" class="r6-form r6-replik" hidden><label for="rs-rep">${esc(R.replik)}</label><div class="r6-rk"><input id="rs-rep" type="text" maxlength="200"><button type="submit" class="knap sek">${esc(R.replikSend)}</button></div></form>`;
    const arg = $('#rs-arg', el), tael = $('#rs-taeller', el), st = $('#rs-status', el), taler = $('#rs-taler', el), rep = $('#rs-replik', el);
    arg.addEventListener('input', () => tael.textContent = fmt(R.taeller, { n: arg.value.length }));
    function vis(data, src) {
      taler.innerHTML = `<div class="r6-kildelinje">${kilde(src)}</div>${data.speeches.map(s => taleKort(s.characterId, s.text)).join('')}<article class="r6-tale r6-referat"><header>${avatar('brian')}<b>${esc(navn('brian'))} · ${esc(R.referat)}</b></header><p>${esc(data.minutes)}</p></article>`;
      rep.hidden = replikBrugt || !roundRef;
    }
    async function send(tekst, erReplik) {
      if (travl) return; travl = true; status(st, R.sender, 'venter'); $('#rs-send', el).disabled = true;
      const res = await api('court', { method: 'POST', json: erReplik ? { roundRef, reply: tekst, lang } : { argument: tekst, lang } });
      travl = false; $('#rs-send', el).disabled = false;
      if (res.ok && res.data && Array.isArray(res.data.speeches)) { roundRef = erReplik ? null : (res.data.roundRef || null); status(st, ''); vis(res.data, res.source || 'ai'); if (erReplik) { replikBrugt = true; rep.hidden = true; } return; }
      if (res.code === 'not_configured' || res.code === 'network') { roundRef = null; status(st, T.kilde.offline, 'fejl'); vis(R.eksempel, 'editorial'); return; }
      status(st, fejlTekst(res), 'fejl');
    }
    $('#rs-form', el).addEventListener('submit', e => { e.preventDefault(); const t = arg.value.trim(); if (!t) { status(st, R.tomt, 'fejl'); return; } if (t.length > 500) { status(st, R.forkort, 'fejl'); return; } replikBrugt = false; send(t, false); });
    rep.addEventListener('submit', e => { e.preventDefault(); const t = $('#rs-rep', el).value.trim(); if (!t || !roundRef) return; send(t, true); });
    // Tal din sag (runde 12): kun på retssalens egen side (Permissions-Policy tillader mikrofonen dér) og kun når Workeren melder tale
    const mik = $('#rs-mik', el), mikT = $('#rs-mik-t', el);
    if (har('tale') && /\/(retssalen|courtroom)\/$/.test(location.pathname) && navigator.mediaDevices && navigator.mediaDevices.getUserMedia && window.MediaRecorder) {
      mik.hidden = false; $('#rs-mik-note', el).hidden = false;
      let opt = null, stroem = null, bidder = [], tid = 0, ur = null;
      const slut = () => { clearInterval(ur); ur = null; mik.setAttribute('aria-pressed', 'false'); mikT.textContent = R.tale.knap; if (stroem) stroem.getTracks().forEach(t => t.stop()); stroem = null; };
      mik.addEventListener('click', async () => {
        if (opt && opt.state === 'recording') { opt.stop(); return; }
        if (travl) return;
        try { stroem = await navigator.mediaDevices.getUserMedia({ audio: true }); } catch (e) { status(st, R.tale.nej, 'fejl'); return; }
        const type = ['audio/webm;codecs=opus', 'audio/ogg;codecs=opus', 'audio/mp4'].find(t => MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(t)) || '';
        opt = new MediaRecorder(stroem, type ? { mimeType: type, audioBitsPerSecond: 64000 } : undefined); bidder = []; tid = 60;
        opt.ondataavailable = ev => { if (ev.data && ev.data.size) bidder.push(ev.data); };
        opt.onstop = async () => {
          slut(); const blob = new Blob(bidder, { type: (opt.mimeType || type || 'audio/webm') }); bidder = [];
          if (!blob.size) return;
          travl = true; mik.disabled = true; status(st, R.tale.skriver, 'venter');
          const res = await api('court/tale?lang=' + lang, { method: 'POST', headers: { 'content-type': blob.type.split(';')[0] || 'audio/webm' }, body: blob });
          travl = false; mik.disabled = false;
          if (res.ok && res.data && res.data.tekst) { arg.value = (arg.value.trim() ? arg.value.trim() + ' ' : '') + res.data.tekst; arg.value = arg.value.slice(0, 500); arg.dispatchEvent(new Event('input')); arg.focus(); status(st, R.tale.klar, 'ok'); }
          else status(st, fejlTekst(res), 'fejl');
        };
        opt.start(); mik.setAttribute('aria-pressed', 'true'); status(st, R.tale.lytter, 'venter'); mikT.textContent = fmt(R.tale.stop, { s: tid });
        ur = setInterval(() => { tid--; mikT.textContent = fmt(R.tale.stop, { s: tid }); if (tid <= 0 && opt.state === 'recording') opt.stop(); }, 1000);
      });
      cleanup.push(() => { if (opt && opt.state === 'recording') { opt.onstop = null; opt.stop(); } slut(); });
    }
  };

  /* ═══════════ C02 — Den Store Afstemning ═══════════ */
  mounts.afstemning = function (el) {
    const A = T.afstemning; const N = 7;
    el.innerHTML = `<div class="r6-split r6-split-bred">${scene('faelles-afstemning', A.scene)}<div class="r6-txt"><p class="lead">${esc(A.lead)}</p>
      <p class="r6-status" id="af-status" aria-live="polite">${esc(A.forbinder)}</p><p class="note" id="af-aktive"></p></div></div>
      <div class="r6-rum" id="af-rum"><div class="r6-pladser" id="af-pladser" role="group" aria-label="${esc(da ? 'Pladser' : 'Seats')}"></div>
      <div class="r6-stem" id="af-stem" hidden><p><b>${esc(A.stem)}</b></p><div class="r6-stemknapper">${[['ja', A.ja], ['nej', A.nej], ['eventuelt', A.eventuelt]].map(v => `<button type="button" class="r6-brik" data-v="${v[0]}">${ikon('stemme-' + v[0])}<span>${esc(v[1])}</span></button>`).join('')}</div></div>
      <div class="r6-tavle" id="af-tavle" aria-live="polite"></div></div>
      <div class="r6-rk r6-proeve"><button type="button" class="knap sek" id="af-proeve">${esc(A.proeve)}</button><span class="note">${esc(A.proeveNote)}</span></div><p class="note">${esc(A.aktiveNote)}</p>`;
    const st = $('#af-status', el), aktive = $('#af-aktive', el), pladser = $('#af-pladser', el), stem = $('#af-stem', el), tavle = $('#af-tavle', el);
    let snap = null, mySlot = null, myVote = null, ws = null, tik = 0, skew = 0, lukket = false, proeve = false, retry = 0;
    function tegn() {
      if (!snap) return;
      pladser.innerHTML = Array.from({ length: N }, (_, i) => { const n = i + 1, s = (snap.slots || []).find(x => x.n === n) || {}; const min = mySlot === n; const taget = !!s.taken && !min;
        return `<button type="button" class="r6-plads${min ? ' min' : ''}${taget ? ' optaget' : ''}" data-n="${n}" ${taget || mySlot ? 'disabled' : ''} aria-pressed="${min}" aria-label="${esc(fmt(A.tag, { n }))}"><b>${n}</b><span>${esc(min ? A.din : taget ? A.optaget : A.ledig)}</span></button>`; }).join('');
      const faseT = A.fase[snap.phase] || snap.phase; const rest = snap.deadline ? Math.max(0, Math.round((snap.deadline - (Date.now() + skew)) / 1000)) : null;
      status(st, `${proeve ? A.proeveTitel + ' · ' : ''}${faseT}${snap.phase === 'voting' && rest != null ? ' · ' + fmt(A.frist, { s: rest }) : ''}`);
      aktive.textContent = proeve ? '' : fmt(A.aktive, { n: snap.connections || 0 });
      stem.hidden = !(mySlot && snap.phase === 'voting' && !myVote);
      const v = snap.votes || { ja: 0, nej: 0, eventuelt: 0 };
      let h = `<p>${esc(fmt(A.resultat, { ja: v.ja || 0, nej: v.nej || 0, ev: v.eventuelt || 0 }))}</p>`;
      if (myVote) h += `<p class="note">${esc(fmt(A.stemt, { v: A[myVote] }))}</p>`;
      if (snap.phase === 'closed') h += `<p class="r6-slutning">${esc(fmt(A.slutning, { n: (v.ja || 0) + (v.nej || 0) + (v.eventuelt || 0) }))}</p>`;
      if (snap.full && !mySlot) h += `<p class="note">${esc(A.fuldt)}</p>`;
      tavle.innerHTML = h;
    }
    function tikker() { clearInterval(tik); tik = setInterval(() => { if (snap && snap.phase === 'voting') tegn(); }, 1000); }
    function send(m) { if (proeve) return proeveBesked(m); if (ws && ws.readyState === 1) ws.send(JSON.stringify(m)); }
    pladser.addEventListener('click', e => { const b = e.target.closest('.r6-plads'); if (!b || b.disabled) return; send({ type: 'join', slot: +b.dataset.n }); });
    stem.addEventListener('click', e => { const b = e.target.closest('.r6-brik'); if (!b || !mySlot || myVote) return; send({ type: 'vote', vote: b.dataset.v }); });
    function modtag(m) {
      if (m.type === 'snapshot') { snap = m; if (typeof m.now === 'number') skew = m.now - Date.now(); if (m.you) { mySlot = m.you.slot || null; myVote = m.you.vote || null; } if (m.phase !== 'voting' && m.round !== (snap && snap.round)) { } tegn(); }
      else if (m.type === 'error') status(st, m.message || T.drift.fejl, 'fejl');
    }
    function forbind() {
      if (lukket || proeve) return;
      const url = (location.protocol === 'https:' ? 'wss://' : 'ws://') + location.host + API + 'room/ws?room=vadestedet&lang=' + lang;
      try { ws = new WebSocket(url); } catch (e) { offline(); return; }
      ws.addEventListener('open', () => { retry = 0; status(st, A.fase.idle); send({ type: 'hello' }); });
      ws.addEventListener('message', e => { try { modtag(JSON.parse(e.data)); } catch (x) { } });
      ws.addEventListener('close', ev => { if (lukket || proeve) return; if (ev.code === 1008 || ev.code === 4404 || retry >= 4) { offline(); return; } status(st, retry ? A.genforbinder : A.afbrudt, 'fejl'); retry++; setTimeout(forbind, 1500 * retry); });
      ws.addEventListener('error', () => { });
    }
    function offline() { snap = null; pladser.innerHTML = ''; stem.hidden = true; tavle.innerHTML = ''; aktive.textContent = ''; status(st, A.offline, 'fejl'); }
    /* Prøverunde: kun lokalt, kun figurer, tydeligt mærket */
    let pt = [];
    function proeveBesked(m) {
      if (m.type === 'join' && !mySlot) { mySlot = m.slot; snap.slots = snap.slots.map(s => s.n === m.slot ? { n: s.n, taken: true } : s); snap.phase = 'voting'; snap.deadline = Date.now() + 30000;
        const ledige = snap.slots.filter(s => !s.taken).map(s => s.n); A.figurerStemmer.slice(0, Math.min(5, ledige.length)).forEach((linje, i) => pt.push(setTimeout(() => { const n = ledige[i]; snap.slots = snap.slots.map(s => s.n === n ? { n, taken: true } : s); const v = /Nej|No/.test(linje) ? 'nej' : /Ja|Yes/.test(linje) ? 'ja' : /afstår|abstains/.test(linje) ? null : 'eventuelt'; if (v) snap.votes[v]++; tavle.insertAdjacentHTML('beforeend', `<p class="note">${esc(linje)}</p>`); tegn(); }, 2500 + i * 3200)));
        pt.push(setTimeout(() => { snap.phase = 'closed'; snap.deadline = null; tegn(); }, 30000)); tegn(); }
      if (m.type === 'vote' && mySlot && !myVote) { myVote = m.vote; snap.votes[m.vote]++; tegn(); }
    }
    $('#af-proeve', el).addEventListener('click', () => { proeve = true; if (ws) { try { ws.close(); } catch (e) { } ws = null; } pt.forEach(clearTimeout); pt = []; mySlot = null; myVote = null; snap = { slots: Array.from({ length: N }, (_, i) => ({ n: i + 1, taken: false })), votes: { ja: 0, nej: 0, eventuelt: 0 }, phase: 'lobby', deadline: null, connections: 0 }; tegn(); tikker(); });
    onCleanup(() => { lukket = true; clearInterval(tik); pt.forEach(clearTimeout); if (ws) { try { ws.close(1000); } catch (e) { } } });
    if (har('room')) { forbind(); tikker(); } else offline();
    // runde 12: dagbogen fra Durable Objectens eget SQLite-lager
    el.insertAdjacentHTML('beforeend', '<div class="r6-dagbog" id="af-dagbog" hidden></div>');
    if (har('room') && window.tvKaede && window.tvKaede.dagbog) window.tvKaede.dagbog($('#af-dagbog', el), 'room/dagbog?room=vadestedet&lang=' + lang, { ja: A.ja, nej: A.nej, eventuelt: A.eventuelt });
  };

  /* ═══════════ C03 — Tingsvad Tidende ═══════════ */
  mounts.avis = function (el) {
    const V = T.avis;
    el.innerHTML = `<div class="r6-avis" id="av-avis"><div class="r6-avis-papir" aria-hidden="true"></div><header class="r6-avis-hoved"><h3>${esc(V.titel)}</h3><p>${esc(V.under)}</p><p class="r6-avis-dato" id="av-dato"></p><p class="r6-avis-stempel" id="av-stempel" hidden></p><div id="av-kilde"></div></header>
      <nav class="r6-avis-blad" id="av-blad" aria-label="${esc(V.bladLabel)}" hidden></nav>
      <p class="r6-status" id="av-status" aria-live="polite">${esc(V.henter)}</p><div class="r6-avis-spalter" id="av-spalter"></div><aside class="r6-avis-tal" id="av-tal" hidden></aside></div>
      <section class="r6-avis-arkiv" id="av-arkiv" aria-labelledby="av-arkiv-h" hidden><h3 id="av-arkiv-h">${esc(V.arkivH)}</h3><p class="note">${esc(V.arkivNote)}</p><ol id="av-arkiv-liste"></ol></section>`;
    const st = $('#av-status', el), sp = $('#av-spalter', el), dato = $('#av-dato', el), ki = $('#av-kilde', el), tal = $('#av-tal', el), stempel = $('#av-stempel', el), blad = $('#av-blad', el), arkiv = $('#av-arkiv', el), liste = $('#av-arkiv-liste', el);
    const DATO = /^\d{4}-\d{2}-\d{2}$/;
    let nu = null; // datoen på den udgave, der vises
    const link = (d, tekst, cls) => `<a class="${cls}" href="${d ? '?dato=' + d : location.pathname}" data-dato="${d || ''}">${tekst}</a>`;
    function vis(u, src, besked) {
      dato.textContent = u.date ? fmt(V.dato, { d: datoDK(u.date) }) : ''; ki.innerHTML = kilde(src);
      nu = u.date || null;
      stempel.hidden = !(u.arkiv && u.date); if (!stempel.hidden) stempel.textContent = fmt(V.stempel, { d: datoDK(u.date) });
      blad.hidden = !(u.prev || u.next);
      if (!blad.hidden) blad.innerHTML = (u.prev ? link(u.prev, `<span aria-hidden="true">←</span> ${esc(V.forrige)}`, 'r6-blad-forrige') : '<span></span>') + (u.arkiv ? link(null, esc(V.idag), 'r6-blad-idag') : '') + (u.next ? link(u.next, `${esc(V.naeste)} <span aria-hidden="true">→</span>`, 'r6-blad-naeste') : '<span></span>');
      const gl = $('#av-udland', el); if (gl) gl.remove();
      marker();
      status(st, besked || '', besked ? 'fejl' : '');
      const spalte = (titel, a, vignet) => `<article class="r6-artikel">${vignet ? img(AI + vignet + '.webp', '', 768, 768, 'r6-vignet', ' loading="lazy"') : ''}<span class="kicker">${esc(titel)}</span><h4>${esc(a.title)}</h4><p>${esc(a.body)}</p></article>`;
      sp.innerHTML = spalte(V.spalter[0], u.lead, 'avis-ko-vignet') + spalte(V.spalter[1], u.notice, 'avis-gaas-vignet') + spalte(V.spalter[2], u.ad, null);
      const ud = Array.isArray(u.udland) ? u.udland.filter(x => x && x.titel && /^https:\/\//.test(x.url || '')) : [];
      if (ud.length) sp.insertAdjacentHTML('afterend', `<section class="r6-udland" id="av-udland"><div class="r6-udland-hoved"><span class="kicker">${esc(da ? 'Udefra · rigtige overskrifter' : 'From abroad · real headlines')}</span><img class="r6-udland-ravn" src="/assets/pak/cloudflare/udefra-256.webp" width="96" height="93" alt="" loading="lazy"></div>
        <ul>${ud.map(x => `<li><h4>${esc(x.titel)}</h4><p>${esc(x.kommentar || '')}</p><a href="${esc(x.url)}" rel="noopener nofollow">${esc(x.kilde || new URL(x.url).hostname)} <span aria-hidden="true">↗</span></a></li>`).join('')}</ul>
        <p class="note">${esc(da ? 'Fundet med Cloudflares Web Search API, da avisen blev trykt. Overskriften og linket er den rigtige kildes; kommentaren er Tingsvads, skrevet af en sprogmodel.' : 'Found with Cloudflare’s Web Search API when the paper went to press. The headline and link belong to the real source; the comment is Tingsvad’s, written by a language model.')}</p></section>`);
      if (u.numbers) { tal.hidden = false; tal.innerHTML = `<b>${esc(V.tal)}</b><ul>${Object.entries(u.numbers).map(([k, v]) => `<li>${esc(k)}: <code>${esc(v)}</code></li>`).join('')}</ul><p class="note">${esc(V.talNote)}</p>`; } else tal.hidden = true;
    }
    hentKonfig().then(() => { if (har('websearch') && !MASKINERI.avis.p.includes('Web Search API')) { MASKINERI.avis.p.push('Web Search API'); MASKINERI.avis.f.push('worker/src/features/udland.js'); tegnMaskineri(); } });
    function marker() { liste.querySelectorAll('a[data-dato]').forEach(a => { if (a.dataset.dato === nu) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); }); }
    function adresse(d) { const u = new URL(location.href); if (d) u.searchParams.set('dato', d); else u.searchParams.delete('dato'); return u.pathname + u.search + u.hash; }
    function hent(d, skub) {
      status(st, V.henter, '');
      api('news?lang=' + lang + (d ? '&date=' + d : '')).then(res => {
        if (res.ok && res.data && res.data.lead) {
          const u = res.data; vis(u, res.source || 'ai', !d && u.isLatest === false && u.date ? fmt(V.senest, { d: datoDK(u.date) }) : '');
          if (skub) history.pushState({ avis: d || null }, '', adresse(d && u.arkiv ? d : null));
          return;
        }
        if (d && (res.code === 'not_found' || res.code === 'bad_request')) { hent(null, false); history.replaceState(history.state, '', adresse(null)); setTimeout(() => status(st, V.ikkeFundet, 'fejl'), 900); return; }
        if (res.code === 'not_configured' || res.code === 'network' || res.code === 'not_found') { vis(V.eksempel, 'editorial', V.saer + ' · ' + V.saerNote); return; }
        status(st, fejlTekst(res), 'fejl');
      });
    }
    el.addEventListener('click', e => {
      const a = e.target.closest('a[data-dato]'); if (!a || e.metaKey || e.ctrlKey || e.shiftKey || e.button) return;
      e.preventDefault(); hent(a.dataset.dato || null, true);
      const top = $('#av-avis', el); if (top) top.scrollIntoView({ block: 'start', behavior: reduce() ? 'auto' : 'smooth' });
    });
    if (!el.dataset.avisPop) { el.dataset.avisPop = '1'; addEventListener('popstate', () => { const d = new URL(location.href).searchParams.get('dato'); hent(d && DATO.test(d) ? d : null, false); }); }
    const start = new URL(location.href).searchParams.get('dato');
    hent(start && DATO.test(start) ? start : null, false);
    api('news/arkiv?lang=' + lang).then(res => {
      const ud = res.ok && res.data && Array.isArray(res.data.udgaver) ? res.data.udgaver : [];
      if (ud.length < 2) return;
      liste.innerHTML = ud.map(x => `<li>${link(x.date, `<time datetime="${esc(x.date)}">${esc(datoDK(x.date))}</time><span>${esc(x.title)}</span>`, 'r6-arkiv-udgave')}</li>`).join('');
      arkiv.hidden = false; marker();
    });
  };

  /* ═══════════ C04 — Fremlæg dit bevis ═══════════ */
  mounts.billedbevis = function (el) {
    const B = T.billedbevis; let valgt = null, fil = null, travl = false, objUrl = null;
    const bakke = ['ko', 'skjold', 'stol', 'spyd'];
    el.innerHTML = `<p class="lead">${esc(B.lead)}</p><div class="r6-split r6-split-bred"><div class="r6-lab">${img(AI + 'bevislaboratorium.webp', B.scene, 1279, 720, 'r6-lab-ramme', ' loading="lazy"')}<div class="r6-lab-preview" id="bb-preview"><span class="note">${esc(B.bakkeNote)}</span></div></div>
      <div class="r6-txt"><p><b>${esc(B.bakke)}</b></p><div class="r6-bakke" role="group" aria-label="${esc(B.bakke)}">${bakke.map(id => `<button type="button" class="r6-bakke-knap" data-id="${id}" aria-pressed="false">${img(PAK + 'web/' + id + '.webp', '', 1200, 675, '', ' loading="lazy"')}<span>${esc(B.genstande[id])}</span></button>`).join('')}</div>
      <div class="r6-upload"><label for="bb-fil"><b>${esc(B.upload)}</b></label><div class="r6-rk"><input type="file" id="bb-fil" accept="image/jpeg,image/png,image/webp"><button type="button" class="knap sek" id="bb-vaelg">${esc(B.uploadKnap)}</button></div><p class="note" id="bb-upnote">${esc(har('vision_upload') ? B.uploadNote : B.uploadOff)}</p></div>
      <div class="r6-rk"><button type="button" class="knap" id="bb-send" disabled>${esc(B.fremlaeg)}</button><span class="r6-status" id="bb-status" aria-live="polite"></span></div></div></div>
      <div class="r6-bevis-svar" id="bb-svar" aria-live="polite"></div>`;
    const prev = $('#bb-preview', el), st = $('#bb-status', el), svar = $('#bb-svar', el), send = $('#bb-send', el), inp = $('#bb-fil', el);
    if (!har('vision_upload')) { inp.disabled = true; $('#bb-vaelg', el).disabled = true; }
    $('#bb-vaelg', el).addEventListener('click', () => inp.click());
    function visPreview(src, alt) { if (objUrl) { URL.revokeObjectURL(objUrl); objUrl = null; } const img = document.createElement('img'); img.src = src; img.alt = alt || ''; img.decoding = 'async'; prev.replaceChildren(img); send.disabled = false; }
    $$('.r6-bakke-knap', el).forEach(b => b.addEventListener('click', () => { valgt = b.dataset.id; fil = null; inp.value = ''; $$('.r6-bakke-knap', el).forEach(x => x.setAttribute('aria-pressed', String(x === b))); visPreview(PAK + 'web/' + valgt + '.webp', B.genstande[valgt]); status(st, ''); }));
    inp.addEventListener('change', () => { const f = inp.files && inp.files[0]; if (!f) return; if (!/^image\/(jpeg|png|webp)$/.test(f.type)) { status(st, B.forkertType, 'fejl'); inp.value = ''; return; } if (f.size > 2 * 1024 * 1024) { status(st, B.forstor, 'fejl'); inp.value = ''; return; } fil = f; valgt = null; $$('.r6-bakke-knap', el).forEach(x => x.setAttribute('aria-pressed', 'false')); objUrl = URL.createObjectURL(f); visPreview(objUrl, f.name); status(st, ''); });
    function vis(d, src) { svar.innerHTML = `<div class="r6-kildelinje">${kilde(src)}</div><div class="r6-bevis-felter"><article class="r6-felt"><h4>${esc(B.beskrivelse)}</h4><p>${esc(d.description)}</p>${Array.isArray(d.observations) && d.observations.length ? `<b>${esc(B.observationer)}</b><ul>${d.observations.map(o => `<li>${esc(o)}</li>`).join('')}</ul>` : ''}</article><article class="r6-felt r6-felt-gudrun"><header>${avatar('gudrun')}<h4>${esc(B.vurdering)}</h4></header><p>${esc(d.fictionalVerdict)}</p><p class="note">${esc(B.vurderingNote)}</p></article></div>`; }
    send.addEventListener('click', async () => {
      if (travl || (!valgt && !fil)) return; travl = true; send.disabled = true; status(st, B.fremlaegger, 'venter');
      let res;
      if (fil) { const fd = new FormData(); fd.append('file', fil, fil.name); fd.append('lang', lang); res = await api('vision', { method: 'POST', body: fd }); }
      else res = await api('vision', { method: 'POST', json: { galleryId: valgt, lang } });
      travl = false; send.disabled = false;
      if (res.ok && res.data && res.data.description) { status(st, ''); vis(res.data, res.source || 'ai'); return; }
      if ((res.code === 'not_configured' || res.code === 'network') && valgt && B.eksempler[valgt]) { status(st, T.kilde.offline, 'fejl'); vis(B.eksempler[valgt], 'editorial'); return; }
      if (res.code === 'not_configured' || res.code === 'network') { status(st, B.ikkeSet, 'fejl'); svar.innerHTML = ''; return; }
      status(st, fejlTekst(res), 'fejl');
    });
    onCleanup(() => { if (objUrl) URL.revokeObjectURL(objUrl); });
  };

  /* ═══════════ C05 — Lav et falsk historisk bevis ═══════════ */
  mounts.vaerksted = function (el) {
    const W = T.vaerksted; let travl = false, poll = 0;
    const sel = (navn, liste) => `<label class="r6-valg"><span>${esc(W[navn])}</span><select id="fv-${navn}">${liste.map(v => `<option value="${v[0]}">${esc(v[1])}</option>`).join('')}</select></label>`;
    el.innerHTML = `<div class="r6-split">${scene('bevisvaerksted', W.scene)}<div class="r6-txt"><p class="lead">${esc(W.lead)}</p>
      <form id="fv-form" class="r6-form"><div class="r6-valgrk">${sel('genstand', W.valg.genstand)}${sel('fundsted', W.valg.fundsted)}${sel('tilstand', W.valg.tilstand)}</div><div class="r6-rk"><button type="submit" class="knap" id="fv-lav"${har('forge') ? '' : ' disabled'}>${esc(W.lav)}</button><span class="r6-status" id="fv-status" aria-live="polite">${har('forge') ? '' : esc(W.lukket)}</span></div></form></div></div>
      <div class="r6-fund" id="fv-fund" hidden></div>`;
    const st = $('#fv-status', el), fund = $('#fv-fund', el);
    function vis(d, src) {
      fund.hidden = false;
      fund.innerHTML = `<div class="r6-kildelinje">${kilde(src)}</div><div class="r6-fund-grid"><div class="r6-fund-billede"><img id="fv-img" src="${esc(d.imageUrl)}" alt="${esc(d.alt || '')}" width="1024" height="1024" decoding="async" crossorigin="anonymous"><span class="r6-stempel">${esc(W.stempel)}</span></div><div class="r6-txt"><h4>${esc(W.proveniens)}</h4><p>${esc(d.provenance)}</p><button type="button" class="knap sek" id="fv-hent">${esc(W.hent)}</button></div></div>`;
      $('#fv-hent', el).addEventListener('click', () => {
        const im = $('#fv-img', el); const c = document.createElement('canvas'); const w = im.naturalWidth || 1024, h = im.naturalHeight || 1024; c.width = w; c.height = h + Math.round(h * .12);
        const x = c.getContext('2d'); x.fillStyle = '#efe8d6'; x.fillRect(0, 0, c.width, c.height); try { x.drawImage(im, 0, 0, w, h); } catch (e) { }
        x.fillStyle = '#2a1e14'; x.font = `bold ${Math.round(h * .045)}px sans-serif`; x.textBaseline = 'middle'; x.fillText(W.stempel.toUpperCase() + ' · tingsvad.dk', Math.round(w * .04), h + Math.round(h * .06));
        x.save(); x.translate(w * .78, h * .14); x.rotate(-.25); x.strokeStyle = 'rgba(140,40,30,.85)'; x.lineWidth = Math.round(h * .012); x.strokeRect(-w * .2, -h * .05, w * .4, h * .1); x.fillStyle = 'rgba(140,40,30,.9)'; x.font = `bold ${Math.round(h * .05)}px sans-serif`; x.textAlign = 'center'; x.fillText(da ? 'OPDIGTET' : 'FICTIONAL', 0, 0); x.restore();
        try { const a = document.createElement('a'); a.href = c.toDataURL('image/png'); a.download = `tingsvad-opdigtet-fund-${d.key || 'x'}.png`; a.click(); } catch (e) { status(st, W.fejl, 'fejl'); }
      });
    }
    async function vent(jobRef, n) { if (!jobRef) return; status(st, fmt(W.koe, { n: n || 1 }), 'venter'); const res = await api('forge/' + encodeURIComponent(jobRef)); if (res.ok && res.data && res.data.state === 'done') { status(st, ''); vis(res.data, res.source || 'ai'); travl = false; return; } if (res.ok && res.data && res.data.state !== 'failed' && n < 20) { poll = setTimeout(() => vent(jobRef, (n || 1) + 1), 3000); return; } status(st, fejlTekst(res.ok ? { ok: false, message: W.fejl } : res), 'fejl'); travl = false; }
    $('#fv-form', el).addEventListener('submit', async e => {
      e.preventDefault(); if (travl) return; travl = true; status(st, W.laver, 'venter');
      const json = { object: $('#fv-genstand', el).value, site: $('#fv-fundsted', el).value, condition: $('#fv-tilstand', el).value, lang };
      const res = await api('forge', { method: 'POST', json, headers: { 'idempotency-key': 'forge:' + Object.values(json).join(':') + ':' + Date.now().toString(36) } });
      if (res.ok && res.data && res.data.state === 'done') { status(st, ''); vis(res.data, res.source || 'ai'); travl = false; return; }
      if (res.ok && res.data && res.data.jobRef) { vent(res.data.jobRef, 1); return; }
      travl = false; status(st, res.code === 'not_configured' ? W.lukket : fejlTekst(res), 'fejl');
    });
    onCleanup(() => clearTimeout(poll));
  };

  /* ═══════════ C06 — Bureaukratiet arbejder videre ═══════════ */
  mounts.sagskontor = function (el) {
    const K = T.sagskontor; let travl = false;
    el.innerHTML = `<div class="r6-split">${scene('sagskontor', K.scene)}<div class="r6-txt"><p class="lead">${esc(K.lead)}</p><div id="sk-ind"></div></div></div>`;
    const ind = $('#sk-ind', el);
    const tidspunkt = iso => { try { return new Date(iso).toLocaleString(da ? 'da-DK' : 'en-GB', { timeZone: 'Europe/Copenhagen', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }); } catch (e) { return iso; } };
    function visSag(c, src, besked, erFejl) {
      const idx = Math.max(0, K.trin.indexOf(K.trin[c.stateIndex]) >= 0 ? c.stateIndex : 0);
      ind.innerHTML = `<div class="r6-kildelinje">${kilde(src)}</div>${besked ? `<p class="r6-status${erFejl ? ' fejl' : ''}">${esc(besked)}</p>` : ''}
        <p><b>${esc(K.sagsnr)}</b> <code>${esc(c.caseId)}</code></p>
        <ol class="r6-trin">${K.trin.map((t, i) => `<li class="${i < idx ? 'ok' : i === idx ? 'nu' : ''}"${i === idx ? ' aria-current="step"' : ''}><b>${esc(t)}</b>${c.history && c.history[i] ? `<span>${esc(tidspunkt(c.history[i]))}</span>` : ''}</li>`).join('')}</ol>
        <p>${c.done ? esc(K.faerdig) : `<b>${esc(K.naeste)}</b>: ${c.nextAt ? esc(tidspunkt(c.nextAt)) : '…'}`}</p>
        <div class="r6-rk"><button type="button" class="knap sek" id="sk-hent">${esc(K.hent)}</button><button type="button" class="knap sek" id="sk-glem">${esc(K.glem)}</button><span class="r6-status" id="sk-status" aria-live="polite"></span></div>
        <details class="r6-kode"><summary>${esc(K.kode)}</summary><code>${esc(c.token)}</code><p class="note">${esc(K.kodeNote)}</p></details>`;
      $('#sk-hent', el).addEventListener('click', () => hent(c));
      $('#sk-glem', el).addEventListener('click', () => { S.chairCase = null; save(); visTom(); });
    }
    async function hent(c) { const st = $('#sk-status', el); if (st) status(st, K.henter, 'venter'); const res = await api('jobs/' + encodeURIComponent(c.caseId) + '?token=' + encodeURIComponent(c.token)); if (res.ok && res.data) { S.chairCase = Object.assign({}, c, res.data); save(); visSag(S.chairCase, res.source || 'server'); return; } if (res.code === 'not_found' || res.code === 'forbidden') { S.chairCase = null; save(); visTom(K.kodeFejl); return; } visSag(c, 'server', K.senest, true); }
    function visTom(besked) {
      if (!har('cases')) { ind.innerHTML = `<p class="r6-status fejl">${esc(K.offline)}</p>`; return; }
      const p = S.pendingStool;
      ind.innerHTML = `${besked ? `<p class="r6-status fejl">${esc(besked)}</p>` : ''}<p class="note">${esc(K.ingen)}</p>${p ? `<p class="note">${esc(K.fraStol)}</p>` : ''}
        <form id="sk-form" class="r6-form"><label for="sk-valg">${esc(K.valgLabel)}</label><input id="sk-valg" type="text" maxlength="120" placeholder="${esc(K.valgPlaceholder)}" value="${esc(p ? p.join(', ') : '')}"><div class="turnstile-slot" id="sk-ts"></div><div class="r6-rk"><button type="submit" class="knap">${esc(K.ansoeg)}</button><span class="r6-status" id="sk-status" aria-live="polite"></span></div></form>
        <form id="sk-kodeform" class="r6-form"><label for="sk-kode">${esc(K.kodeInd)}</label><div class="r6-rk"><input id="sk-kode" type="text" maxlength="80" autocomplete="off"><button type="submit" class="knap sek">${esc(K.kodeKnap)}</button></div></form>`;
      let ts = { token: () => '', reset() { } }; if (window.tvTurnstile) window.tvTurnstile.mount($('#sk-ts', el), 'stol').then(t => ts = t);
      $('#sk-form', el).addEventListener('submit', async e => {
        e.preventDefault(); if (travl) return; travl = true; const st = $('#sk-status', el); status(st, K.sender, 'venter');
        const key = 'case:' + (crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2));
        const res = await api('jobs', { method: 'POST', json: { wishes: $('#sk-valg', el).value.trim().slice(0, 120), lang, turnstile: await (ts.ready ? ts.ready(10000) : ts.token()) }, headers: { 'idempotency-key': key } });
        travl = false; ts.reset();
        if (res.ok && res.data && res.data.caseId && res.data.token) { S.chairCase = res.data; S.pendingStool = null; save(); visSag(res.data, res.source || 'server', K.oprettet); return; }
        status(st, fejlTekst(res), 'fejl');
      });
      $('#sk-kodeform', el).addEventListener('submit', async e => { e.preventDefault(); const kode = $('#sk-kode', el).value.trim(); const m = kode.match(/^([A-Za-z0-9-]+)[.:]([A-Za-z0-9_-]+)$/); if (!m) { visTom(K.kodeFejl); return; } hent({ caseId: m[1], token: m[2] }); });
    }
    if (S.chairCase && S.chairCase.caseId) { visSag(S.chairCase, 'server'); hent(S.chairCase); } else visTom();
  };

  /* ═══════════ C07 — Mímir, modvillig AI-guide ═══════════ */
  mounts.brian = function (el) {
    const G = T.brian; let travl = false;
    el.innerHTML = `<div class="r6-split r6-split-bred">${scene('brians-arkiv', G.scene)}<div class="r6-txt"><p class="lead">${esc(G.lead)}</p>
      <form id="bg-form" class="r6-form"><fieldset class="r6-niveau"><legend>${esc(G.niveau)}</legend>${G.niveauer.map((n, i) => `<label><input type="radio" name="bg-niveau" value="${n[0]}"${i === 0 ? ' checked' : ''}><span>${esc(n[1])}</span></label>`).join('')}</fieldset>
      <label for="bg-q">${esc(G.label)}</label><div class="r6-rk"><input id="bg-q" type="text" maxlength="500" placeholder="${esc(G.placeholder)}"><button type="submit" class="knap" id="bg-send">${esc(G.spoerg)}</button></div>
      <p class="note">${esc(fmt(G.kendte, { n: kendteFragmenter().length }))}</p><p class="r6-status" id="bg-status" aria-live="polite"></p></form>
      <div class="r6-taler" id="bg-svar" aria-live="polite"></div><p class="note">${esc(G.gammel)}</p></div></div>`;
    const st = $('#bg-status', el), svar = $('#bg-svar', el);
    function vis(d, src) { svar.innerHTML = `<div class="r6-kildelinje">${kilde(src)}</div>${taleKort('brian', d.answer)}${Array.isArray(d.sources) && d.sources.length ? `<p class="note"><b>${esc(G.kilde)}:</b> ${d.sources.map(s => esc(s)).join(' · ')}</p>` : `<p class="note">${esc(G.ingenKilde)}</p>`}`; }
    $('#bg-form', el).addEventListener('submit', async e => {
      e.preventDefault(); if (travl) return; const q = $('#bg-q', el).value.trim(); const lvl = ($('input[name="bg-niveau"]:checked', el) || {}).value || 'hint';
      travl = true; status(st, G.spoerger, 'venter'); $('#bg-send', el).disabled = true;
      const res = await api('guide', { method: 'POST', json: { question: q || (da ? 'Hvor begynder jeg?' : 'Where do I start?'), spoilerLevel: lvl, knownFragments: kendteFragmenter(), lang } });
      travl = false; $('#bg-send', el).disabled = false;
      if (res.ok && res.data && res.data.answer) { status(st, ''); vis(res.data, res.source || 'ai'); return; }
      if (res.code === 'not_configured' || res.code === 'network') { status(st, T.kilde.offline, 'fejl'); vis(G.eksempel, 'editorial'); return; }
      status(st, fejlTekst(res), 'fejl');
    });
  };

  /* ═══════════ C08 — Radio med stemmer ═══════════ */
  mounts.radio = function (el) {
    const Rd = T.radio;
    // Ravnen står på bordet til venstre for mikrofonen; taleløkke kun mens lyden faktisk spiller (illustrativ, ikke lipsync)
    const ravnScene = `<figure class="r6-scene ting-radio-scene">${img(AI + 'radio-studie.webp', Rd.scene, 1279, 720, '', ' loading="lazy"')}<img class="ting-radio-raven" id="rd-ravn" src="${base}ravn/ravn-stille.webp" data-still="${base}ravn/ravn-stille.webp" data-talking="${base}ravn/ravn-taler.webp" width="320" height="300" alt="" aria-hidden="true" loading="lazy"></figure>`;
    el.innerHTML = `<div class="r6-split">${ravnScene}<div class="r6-txt"><p class="lead">${esc(Rd.lead)}</p>
      <p class="r6-lampe" id="rd-lampe"><i aria-hidden="true"></i><span>${esc(Rd.lampe.off)}</span></p><p class="note">${esc(Rd.lampeNote)}</p>
      <p class="r6-status" id="rd-status" aria-live="polite">${esc(Rd.henter)}</p><div id="rd-kilde"></div><p class="r6-avis-dato" id="rd-dato"></p>
      <div id="rd-player"></div><p class="note" id="rd-stemme" hidden>${esc(Rd.stemme)}</p></div></div>
      <article class="r6-manus" id="rd-manus" hidden><h4>${esc(Rd.manuskript)}</h4><div id="rd-tekst"></div></article>`;
    const st = $('#rd-status', el), lampe = $('#rd-lampe', el), pl = $('#rd-player', el), manus = $('#rd-manus', el), tekst = $('#rd-tekst', el), dato = $('#rd-dato', el), ki = $('#rd-kilde', el);
    function sætLampe(mode) { lampe.dataset.mode = mode; $('span', lampe).textContent = Rd.lampe[mode]; }
    function vis(d, src, besked) {
      ki.innerHTML = kilde(src); dato.textContent = d.date ? fmt(Rd.udgave, { d: datoDK(d.date) }) : '';
      status(st, besked || '', besked ? 'fejl' : ''); manus.hidden = false; tekst.innerHTML = String(d.script || '').split(/\n\s*\n/).map(p => `<p>${esc(p)}</p>`).join('');
      if (d.audioUrl) { sætLampe('off'); pl.innerHTML = `<audio controls preload="metadata" id="rd-audio" src="${esc(d.audioUrl)}"></audio>`; $('#rd-stemme', el).hidden = false; const a = $('#rd-audio', el); ravnTilLyd(a, $('#rd-ravn', el)); a.addEventListener('play', () => sætLampe('on')); a.addEventListener('pause', () => sætLampe('off')); a.addEventListener('ended', () => sætLampe('off')); a.addEventListener('error', () => { sætLampe('text'); status(st, Rd.lydFejl, 'fejl'); }); }
      else { sætLampe('text'); pl.innerHTML = `<p class="note">${esc(Rd.ingenLyd)}</p>` + (Rd.kunEngelsk ? `<p class="note r6-kun-en">${esc(Rd.kunEngelsk)} <a href="${esc(Rd.kunEngelskUrl)}">${esc(Rd.kunEngelskLink)}</a> →</p>` : ''); }
    }
    /* Runde 12: live gennem Cloudflare Realtime SFU. Alle lyttere hører samme sted i udsendelsen; browseren får kun en
       SFU-offer fra Workeren og svarer. Kun modtagelse: ingen mikrofon, intet kamera. */
    const L = da ? { titel: 'Live fra studiet', knap: 'Lyt live med de andre', stop: 'Stop', forbinder: 'Forbinder til Realtime SFU …', sender: 'Sendes live · {p} af {t}', slut: 'Udsendelsen er slut. Tryk igen for næste.', fejl: 'Live-udsendelsen svarer ikke lige nu. Optagelsen herunder virker stadig.', note: 'Udsendelsen er på engelsk og sendes gennem Cloudflare Realtime SFU over WebRTC. Alle, der lytter, er samme sted i den. Din browser modtager kun.', andre: 'Der sendes allerede: du kommer ind midt i.' }
      : { titel: 'Live from the studio', knap: 'Listen live with the others', stop: 'Stop', forbinder: 'Connecting to Realtime SFU …', sender: 'Live · {p} of {t}', slut: 'The broadcast has ended. Press again for the next one.', fejl: 'The live broadcast is not answering right now. The recording below still works.', note: 'The broadcast is in English and is sent through Cloudflare Realtime SFU over WebRTC. Everyone listening is at the same point in it. Your browser only receives.', andre: 'Already on air: you are joining in the middle.' };
    function live() {
      if (!har('live_radio') || typeof RTCPeerConnection !== 'function') return;
      if (!MASKINERI.radio.p.includes('Realtime SFU')) { MASKINERI.radio.p.push('Durable Objects', 'Realtime SFU'); MASKINERI.radio.f.push('worker/src/features/liveradio.js', 'worker/src/radiostation.js', 'worker/src/lib/sfu.js'); tegnMaskineri(); }
      pl.insertAdjacentHTML('beforebegin', `<div class="r6-live" id="rd-live"><figure class="r6-live-fig"><img src="/assets/pak/cloudflare/live-radio-800.webp" srcset="/assets/pak/cloudflare/live-radio-800.webp 800w, /assets/pak/cloudflare/live-radio-1600.webp 1600w" sizes="(max-width: 760px) 92vw, 34rem" width="1600" height="900" alt="${esc(da ? 'Maleri: ravnen ved mikrofonen i radiohytten med en rød lanterne tændt; lysende tråde løber gennem tågen ud til hytterne i dalen.' : 'Painting: the raven at the microphone in the radio hut with a red lantern lit; glowing threads run through the mist to the huts in the valley.')}" loading="lazy"></figure><p><b>${esc(L.titel)}</b></p><div class="r6-rk"><button type="button" class="knap" id="rd-live-knap">${esc(L.knap)}</button></div><p class="r6-status" id="rd-live-st" aria-live="polite"></p><audio id="rd-live-lyd" hidden></audio><p class="note">${esc(L.note)}</p></div>`);
      const knap = $('#rd-live-knap', el), lst = $('#rd-live-st', el), lyd = $('#rd-live-lyd', el);
      let pc = null, tik = 0, skew = 0;
      const mmss = ms => { const s = Math.max(0, Math.round(ms / 1000)); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };
      function stop(tekst, cls) { clearInterval(tik); if (pc) { try { pc.close(); } catch (e) { } pc = null; } lyd.srcObject = null; knap.textContent = L.knap; sætLampe('off'); status(lst, tekst || '', cls || ''); }
      knap.addEventListener('click', async () => {
        if (pc) { stop(); return; }
        knap.textContent = L.stop; status(lst, L.forbinder);
        try {
          const t0 = Date.now(); const res = await api('radio/live/lyt?lang=' + lang, { method: 'POST', json: { lang } });
          if (!res.ok || !res.data || !res.data.sessionDescription) { stop(fejlTekst(res) || L.fejl, 'fejl'); return; }
          const d = res.data; skew = (d.server || Date.now()) - (t0 + Date.now()) / 2;
          pc = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.cloudflare.com:3478' }], bundlePolicy: 'max-bundle' });
          pc.ontrack = e => { lyd.srcObject = new MediaStream([e.track]); lyd.play().catch(() => { }); };
          pc.onconnectionstatechange = () => { if (pc && (pc.connectionState === 'failed' || pc.connectionState === 'closed')) stop(L.fejl, 'fejl'); };
          await pc.setRemoteDescription(d.sessionDescription);
          const svar = await pc.createAnswer(); await pc.setLocalDescription(svar);
          const r2 = await api('radio/live/svar', { method: 'POST', json: { lang, sessionId: d.sessionId, sessionDescription: { type: 'answer', sdp: pc.localDescription.sdp } } });
          if (!r2.ok) { stop(fejlTekst(r2) || L.fejl, 'fejl'); return; }
          const a = $('#rd-audio', el); if (a && !a.paused) a.pause();
          sætLampe('on'); if (Date.now() + skew - d.start > 4000) status(lst, L.andre);
          tik = setInterval(() => { const nu = Date.now() + skew; if (nu > d.slut) { stop(L.slut); return; } status(lst, fmt(L.sender, { p: mmss(nu - d.start), t: mmss(d.slut - d.start) })); }, 1000);
        } catch (e) { stop(L.fejl, 'fejl'); }
      });
      onCleanup(() => stop());
    }
    hentKonfig().then(live);
    api('radio?lang=' + lang).then(res => {
      if (res.ok && res.data && res.data.script) { vis(res.data, res.source || 'ai'); return; }
      if (res.code === 'not_configured' || res.code === 'network' || res.code === 'not_found') { vis(Rd.eksempel, 'editorial', Rd.tekstudgave + ' · ' + T.drift.offline); return; }
      status(st, fejlTekst(res), 'fejl');
    });
  };

  /* ── Bro fra round5: stolekonfiguratorens ansøgning kan sendes videre til sagskontoret ── */
  document.addEventListener('tingsvad:stol-ansoegt', e => { const valg = e.detail && Array.isArray(e.detail.valg) ? e.detail.valg.map(String).slice(0, 8) : []; S.pendingStool = valg; save();
    const res = document.getElementById('stol-resultat'); if (!res || res.querySelector('.r6-videre')) return;
    const b = document.createElement('button'); b.type = 'button'; b.className = 'knap sek r6-videre'; b.textContent = T.sagskontor.ansoeg + ' →'; b.addEventListener('click', () => { aabn('sagskontor'); }); res.appendChild(b); });

  /* ── Ankerlinks: #paafund-retssal osv. åbner panelet ── */
  function fraHash() {
    const m = (location.hash || '').match(/^#paafund-([a-z]+)$/); if (!m || !mounts[m[1]]) return;
    if (!egen && rum(m[1])) { location.replace(rum(m[1])); return; } // gamle links til panelet går nu til maskinens rum
    if (aktivt !== m[1]) aabn(m[1], true); // åbn kun, hvis panelet ikke allerede er åbent (aabn på samme id ville lukke det)
    panelEl.scrollIntoView?.({ block: 'start', behavior: reduce() ? 'auto' : 'smooth' });
  }
  window.addEventListener('hashchange', fraHash); fraHash();
  if (egen && mounts[egen]) aabn(egen);
  // Links til #paafund-… virker også, når hash'en allerede er den samme (ingen hashchange), fx ved andet klik
  document.addEventListener('click', e => { const a = e.target.closest('a[href^="#paafund-"]'); if (a && a.getAttribute('href') === location.hash) { e.preventDefault(); fraHash(); } });
})();
