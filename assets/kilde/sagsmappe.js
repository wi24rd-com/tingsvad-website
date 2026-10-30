/* tingsvad.dk — runde 9: Sagsmappen + Ravnecentralen (bilag som baggrundsjob) og Revisionen (Gudruns daglige gennemgang).
   Tekster i sagsmappe-tekst.js. API-kontrakt som maskinpark.js: {ok, source, requestId, data} / {ok:false, code, message, retryAfter?}. */
(function () {
  const lang = document.documentElement.lang === 'en' ? 'en' : 'da', da = lang === 'da';
  const T = (window.TV_R9 || {})[lang]; if (!T) return;
  const $ = (s, r) => (r || document).querySelector(s);
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const fmt = (s, o) => String(s).replace(/\{(\w+)\}/g, (m, k) => (o && k in o ? o[k] : m));
  const tid = iso => { try { return new Date(iso).toLocaleTimeString(da ? 'da-DK' : 'en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' }); } catch (e) { return ''; } };
  const dato = iso => { try { return new Date(iso + (iso.length === 10 ? 'T12:00:00Z' : '')).toLocaleDateString(da ? 'da-DK' : 'en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Europe/Copenhagen' }); } catch (e) { return iso; } };
  const kilde = src => `<span class="r6-kilde r6-kilde-${esc(src)}">${esc(T.kilde[src] || src)}</span>`;
  const GH = 'https://github.com/wi24rd-com/tingsvad-website/blob/main/';

  /* ── Vis maskineriet (samme komponent og klasser som maskinparken) ── */
  function maskineri(host, spec) {
    if (!host) return { log() {} };
    const M = T.mk, kald = [];
    host.insertAdjacentHTML('beforeend', `<details class="r6-maskineri"><summary>${esc(M.titel)}</summary>
      <div class="r6-mk-kaede"></div>
      <p><b>${esc(M.kald)}</b></p><ul class="r6-mk-kald" aria-live="polite"><li class="note">${esc(M.ingen)}</li></ul>
      <p class="r6-mk-kode"><b>${esc(M.kode)}:</b> ${spec.f.map(x => `<a href="${GH}${x}" rel="noopener">${esc(x)}</a>`).join(' · ')}</p></details>`);
    const ul = host.querySelector('.r6-maskineri:last-of-type .r6-mk-kald');
    const kaede = host.querySelector('.r6-maskineri:last-of-type .r6-mk-kaede'); // runde 12: kæden som på infrastrukturkortet
    const tegnKaede = k => { if (window.tvKaede) window.tvKaede.tegn(kaede, spec, k || null); };
    tegnKaede(null);
    const ms = x => (x < 10 ? x.toFixed(1) : Math.round(x)) + ' ms';
    const del = h => String(h || '').split(',').map(x => x.trim()).filter(Boolean).map(x => { const [n, ...r] = x.split(';'); const o = { n: n.trim() }; r.forEach(p => { const [k, v] = p.split('='); if (k && v) o[k.trim()] = v.trim().replace(/^"|"$/g, ''); }); return o; });
    return { tegn() { tegnKaede(kald[0]); }, log(k) {
      kald.unshift(k); kald.splice(5); tegnKaede(k);
      ul.innerHTML = kald.map(k => { const d = del(k.timing), tot = d.find(x => x.n === 'total'), rest = d.filter(x => x.n !== 'total' && x.dur != null);
        return `<li><code>${esc(k.method)} /api/ting-ai/${esc(k.path.split('?')[0])}</code> <span class="r6-mk-status">${esc(k.status)}</span> ${k.source ? kilde(k.source) : ''}${k.cache ? ' ' + kilde('cached') : ''}${k.kantcache ? ` <span class="r6-kilde r6-kilde-kant">Workers Cache · ${esc(k.kantcache)}</span>` : ''}
        <div class="r6-mk-tal"><b>${esc(ms(k.ms))}</b> ${esc(M.browser)}${tot ? ` · <b>${esc(ms(+tot.dur))}</b> ${esc(M.total)}` : ''} · ${esc(M.tid)} ${esc(tid(k.at))}</div>
        ${rest.length ? `<div class="r6-mk-dele">${rest.map(x => `<span><code>${esc(x.n)}</code> ${esc(ms(+x.dur))} <i>${esc(parseInt(x.desc, 10) || '')} ${esc(M.kald1)}</i></span>`).join('')}</div>` : ''}</li>`; }).join('');
    } };
  }
  async function api(path, opts, mk) {
    const o = Object.assign({ method: 'GET', headers: {} }, opts || {});
    if (o.json) { o.body = JSON.stringify(o.json); o.headers['content-type'] = 'application/json'; delete o.json; }
    o.credentials = 'same-origin';
    const t0 = performance.now(); let r, body = null;
    try { r = await fetch('/api/ting-ai/' + path, o); } catch (e) { return { ok: false, code: 'network' }; }
    try { body = await r.json(); } catch (e) { }
    if (mk) mk.log({ method: o.method, path, status: r.status, ms: performance.now() - t0, timing: r.headers.get('server-timing'), cache: r.headers.get('x-tingsvad-cache'), kantcache: r.headers.get('x-tingsvad-kantcache'), source: body && body.source, at: new Date().toISOString() });
    if (!body || typeof body.ok !== 'boolean') return { ok: false, code: 'not_configured', status: r.status };
    body.status = r.status; return body;
  }
  const læs = k => { try { return JSON.parse(localStorage.getItem(k) || 'null'); } catch (e) { return null; } };

  /* ── Sagsmappen + Ravnecentralen ── */
  const mappeEl = $('#sagsmappe');
  if (mappeEl) {
    const M = T.mappe, R = T.ravn, RKEY = 'tingsvad.ravn.v1';
    const exp = læs('tingsvad.experience.v1') || {}, ai = læs('tingsvad.ai.v1') || {}, cert = læs('tingsvad.cert.v1');
    let forsøg = 0; try { forsøg = Math.max(0, parseInt(localStorage.getItem('afgoer') || '0', 10) || 0); } catch (e) { }
    const ok = id => typeof id === 'string';
    const data = {
      fragments: (Array.isArray(exp.fragments) ? exp.fragments : []).filter(x => ok(x) && M.stykker[x]),
      found: (Array.isArray(exp.foundObjects) ? exp.foundObjects : []).filter(x => ok(x) && M.fundNavne[x]),
      ticket: exp.queueTicket && /^K-0980-\d{4}$/.test(exp.queueTicket.nr || '') ? exp.queueTicket.nr : null,
      chairCase: ai.chairCase && /^S-\d{8}-[A-F0-9]{6}$/.test(ai.chairCase.caseId || '') ? ai.chairCase.caseId : null,
      stool: Array.isArray(ai.pendingStool) ? ai.pendingStool.map(String).slice(0, 8) : [],
      decideAttempts: forsøg,
      cert: cert && typeof cert.navn === 'string' && /^980-\d{4}$/.test(cert.nr || '') && /^\d{4}-\d{2}-\d{2}$/.test(cert.dato || '') ? { navn: cert.navn.slice(0, 40), nr: cert.nr, dato: cert.dato } : null,
    };
    const tom = !data.fragments.length && !data.found.length && !data.ticket && !data.chairCase && !data.stool.length && !data.decideAttempts && !data.cert;
    const certDato = d => new Date(d + 'T12:00:00Z').toLocaleDateString(lang === 'da' ? 'da-DK' : 'en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
    const række = (k, v) => `<div><dt>${esc(k)}</dt><dd>${v}</dd></div>`;
    const ingen = `<span class="note">${esc(M.ingen)}</span>`;
    mappeEl.innerHTML = `<dl class="r9-mappe">
      ${række(M.felter.side2, data.fragments.length === 3 ? esc(M.samlet) : esc(`${data.fragments.length} ${M.af} 3`))}
      ${række(M.felter.stykker, data.fragments.length ? data.fragments.map(f => esc(M.stykker[f])).join('<br>') : ingen)}
      ${række(M.felter.fund, data.found.length ? data.found.map(f => esc(M.fundNavne[f])).join(', ') : ingen)}
      ${række(M.felter.koe, data.ticket ? `<code>${esc(data.ticket)}</code>` : ingen)}
      ${række(M.felter.stol, data.chairCase ? `<code>${esc(data.chairCase)}</code>` : ingen)}
      ${række(M.felter.oensker, data.stool.length ? esc(data.stool.join(', ')) + (data.chairCase ? '' : ` <span class="note">(${esc(M.ikkeIndsendt)})</span>`) : ingen)}
      ${række(M.felter.cert, data.cert ? `${esc(data.cert.navn)} · <code>${esc(data.cert.nr)}</code> · ${esc(certDato(data.cert.dato))}` : `${ingen} <a href="${esc(M.certLink)}">${esc(M.certHent)}</a>`)}
      ${række(M.felter.forsoeg, esc(data.decideAttempts) + (data.decideAttempts ? ` · ${esc(M.alleUdsat)}` : ''))}
    </dl>${tom ? `<p class="r6-status">${esc(M.tom)}</p><p class="note">${esc(M.tomHjaelp)}</p>` : ''}<p class="note">${esc(M.lokalt)}</p>`;

    const ravnEl = $('#ravnecentralen');
    ravnEl.innerHTML = `<form class="r6-form r9-ravn-form" id="rv-form"><label for="rv-navn">${esc(M.navn)}</label><input id="rv-navn" type="text" maxlength="40" placeholder="${esc(M.navnPh)}" value="${data.cert ? esc(data.cert.navn) : ''}" autocomplete="off">
      <div class="turnstile-slot" id="rv-ts"></div><button class="knap" type="submit" id="rv-send">${esc(M.send)}</button></form>
      <p class="r6-status" id="rv-status" aria-live="polite"></p><div id="rv-job" aria-live="polite"></div>`;
    const mk = maskineri(ravnEl, { p: ['Turnstile', 'Workers', 'D1 (unik pr. ejer og input)', 'Queues', 'Workflows', 'Browser Run · PDF', 'R2', 'Idempotency'], f: ['worker/src/features/ravn.js', 'worker/src/workflow.js', 'worker/migrations/0002_runde9.sql', 'assets/kilde/sagsmappe.js'] });
    let ts = { token: () => '', reset() { } }; if (window.tvTurnstile) window.tvTurnstile.mount($('#rv-ts', ravnEl), 'ravn').then(t => ts = t);
    const st = $('#rv-status', ravnEl), jobEl = $('#rv-job', ravnEl), knap = $('#rv-send', ravnEl);
    const status = (t, cls) => { st.className = 'r6-status' + (cls ? ' ' + cls : ''); st.textContent = t || ''; };
    const gem = j => { try { const o = læs(RKEY) || { schemaVersion: 1, jobs: [] }; o.jobs = [{ id: j.id, token: j.token, at: new Date().toISOString() }, ...o.jobs.filter(x => x.id !== j.id)].slice(0, 5); localStorage.setItem(RKEY, JSON.stringify(o)); } catch (e) { } };
    let timer = null, tæller = 0, aktivt = null;
    function visJob(j, token, cached) {
      const rk = ['i_koe', 'modtaget', 'flyver', 'skriver', 'leveret'], nu = rk.indexOf(j.state), tider = {};
      (j.steps || []).forEach(s => { tider[s.s] = s.at; });
      jobEl.innerHTML = `<div class="r9-ravn"><img src="/assets/pak/maskinpark/ravnecentralen-600.webp" srcset="/assets/pak/maskinpark/ravnecentralen-600.webp 600w, /assets/pak/maskinpark/ravnecentralen-1200.webp 1200w" sizes="(max-width: 700px) 40vw, 14rem" width="600" height="418" alt="" loading="lazy">
        <div><p class="r6-kildelinje">${kilde('server')}${cached ? ' ' + kilde('cached') : ''} <code>${esc(j.id)}</code> · ${esc(R.via[j.via] || j.via)}</p>
        ${cached ? `<p class="note">${esc(R.samme)}</p>` : ''}
        <ol class="r9-trin">${rk.map((s, i) => `<li class="${j.state === 'fejlet' ? (tider[s] ? 'gjort' : '') : i < nu ? 'gjort' : i === nu ? 'nu' : ''}"><b>${esc(R.trin[s])}</b>${tider[s] ? ` <span>${esc(R.kl)} ${esc(tid(tider[s]))}</span>` : ''}</li>`).join('')}
        ${j.state === 'fejlet' ? `<li class="fejl"><b>${esc(R.trin.fejlet)}</b> <span>${esc(R.fejl)}</span></li>` : ''}</ol>
        <p class="note">${esc(fmt(R.forsoeg, { a: (j.attempts || 0) + 1, b: j.maxAttempts || 3 }))}</p>
        ${j.file ? `<p><a class="knap" href="${esc(j.file)}" target="_blank" rel="noopener">${esc(R.hent)}</a></p>` : ''}
        ${j.state === 'fejlet' ? (j.canRetry ? `<p><button class="knap sek" type="button" id="rv-igen">${esc(R.igen)}</button></p>` : `<p class="note">${esc(R.opbrugt)}</p>`) : ''}</div></div>`;
      const ig = $('#rv-igen', jobEl);
      if (ig) ig.addEventListener('click', async () => { ig.disabled = true; const r = await api(`ravn/${j.id}/igen?token=${encodeURIComponent(token)}&lang=${lang}`, { method: 'POST', json: {} }, mk); if (r.ok) { visJob(r.data, token); følg(j.id, token); } else { status(r.message || R.netfejl, 'fejl'); ig.disabled = false; } });
    }
    function følg(id, token) {
      clearTimeout(timer); tæller = 0; aktivt = id;
      const tik = async () => {
        if (aktivt !== id) return;
        const r = await api(`ravn/${id}?token=${encodeURIComponent(token)}&lang=${lang}`, null, tæller % 3 === 0 ? mk : null); tæller++;
        if (r.ok) { visJob(r.data, token); if (r.data.state === 'leveret' || r.data.state === 'fejlet') return; }
        timer = setTimeout(tik, tæller < 60 ? 2000 : 10000);
      };
      timer = setTimeout(tik, 1500);
    }
    $('#rv-form', ravnEl).addEventListener('submit', async e => {
      e.preventDefault(); knap.disabled = true; status(M.sender, 'venter');
      const tokenNu = ts.ready ? await ts.ready(10000) : ts.token();
      if (!tokenNu && window.tvTurnstile && ts.ready) { knap.disabled = false; status(fmt(R.turnstile, { kode: (ts.fejl && ts.fejl()) || 'timeout' }), 'fejl'); ts.reset(); return; }
      const res = await api('ravn', { method: 'POST', json: { kind: 'sagsmappe', lang, data: { ...data, navn: $('#rv-navn', ravnEl).value.trim().slice(0, 40) }, turnstile: tokenNu } }, mk);
      knap.disabled = false; ts.reset();
      if (res.ok && res.data && res.data.id) { status(''); gem(res.data); visJob(res.data, res.data.token, res.status === 200); if (res.data.state !== 'leveret' && res.data.state !== 'fejlet') følg(res.data.id, res.data.token); return; }
      status(res.code === 'not_configured' ? R.ikkeTilsluttet : res.code === 'network' ? R.netfejl : (res.message || R.netfejl), 'fejl');
    });
    // seneste bestilling i denne browser
    const seneste = ((læs(RKEY) || {}).jobs || [])[0];
    if (seneste && seneste.id && seneste.token) api(`ravn/${seneste.id}?token=${encodeURIComponent(seneste.token)}&lang=${lang}`, null, mk).then(r => { if (r.ok) { visJob(r.data, seneste.token); if (r.data.state !== 'leveret' && r.data.state !== 'fejlet') følg(seneste.id, seneste.token); } });
  }


  /* ── Den fælles stol: Durable Object + WebSocket. Serveren ejer positionen; vi beder kun om ét skridt ad gangen. ── */
  const stolEl = $('#stolen');
  if (stolEl) {
    const S = T.stol, mk = maskineri($('#stolen-maskineri'), { p: ['Durable Objects (SQLite)', 'WebSocket Hibernation', 'Workers', 'Workers Cache', 'Sessionscookie (HMAC)'], f: ['worker/src/chair.js', 'worker/src/lib/chairlogic.js', 'worker/src/lib/dagbog.js', 'assets/kilde/sagsmappe.js'] });
    const W = 12, H = 6, STEN = new Set(['5,1', '6,2', '5,3', '6,3', '5,5', '6,4', '5,0']), LØS = '5,3', TOKE = '10,3';
    const type = (x, y) => { const k = `${x},${y}`; return k === LØS ? 'loes' : STEN.has(k) ? 'sten' : (x === 5 || x === 6) ? 'aa' : k === TOKE ? 'toke' : 'bred'; };
    stolEl.innerHTML = `<p class="r6-status venter" id="st-status" aria-live="polite">${esc(S.forbinder)}</p>
      <div class="r9-stol" id="st-felt" role="group" aria-label="${esc(S.flyt)}" tabindex="0">${Array.from({ length: H }, (_, y) => Array.from({ length: W }, (_, x) => `<button type="button" class="r9-felt r9-${type(x, y)}" data-x="${x}" data-y="${y}" tabindex="-1" aria-label="${esc(S.felt[type(x, y)])} ${x + 1},${y + 1}"></button>`).join('')).join('')}
        <img class="r9-stol-img" id="st-img" src="/assets/pak/maskinpark/stolen-600.webp" alt="${esc(S.stolAlt)}" width="600" height="511" hidden></div>
      <div class="r9-stol-knapper"><button type="button" class="knap sek" data-d="-1,0" aria-label="${esc(S.venstre)}">←</button><button type="button" class="knap sek" data-d="0,-1" aria-label="${esc(S.op)}">↑</button><button type="button" class="knap sek" data-d="0,1" aria-label="${esc(S.ned)}">↓</button><button type="button" class="knap sek" data-d="1,0" aria-label="${esc(S.hoejre)}">→</button></div>
      <p class="note">${esc(S.traek)}</p><p class="r9-stol-tal" id="st-tal" aria-live="polite"></p><p class="r6-status" id="st-besked" aria-live="assertive"></p><div class="r6-dagbog" id="st-dagbog" hidden></div>`;
    const felt = $('#st-felt', stolEl), img = $('#st-img', stolEl), stEl = $('#st-status', stolEl), tal = $('#st-tal', stolEl), besked = $('#st-besked', stolEl);
    let ws = null, pos = null, sendt = 0, forsøg = 0, beskedT = null;
    const sig = (t, cls) => { besked.className = 'r6-status' + (cls ? ' ' + cls : ''); besked.textContent = t || ''; clearTimeout(beskedT); if (t) beskedT = setTimeout(() => { besked.textContent = ''; }, 4000); };
    function vis(s) {
      pos = { x: s.x, y: s.y };
      const c = felt.querySelector(`[data-x="${s.x}"][data-y="${s.y}"]`);
      felt.querySelectorAll('.r9-felt').forEach(b => b.classList.toggle('nabo', Math.abs(+b.dataset.x - s.x) + Math.abs(+b.dataset.y - s.y) === 1));
      if (c) { img.hidden = false; img.style.left = (s.x / W * 100) + '%'; img.style.top = (s.y / H * 100) + '%'; img.style.width = (100 / W) + '%'; }
      stEl.textContent = fmt(S.online, { n: s.online }); stEl.className = 'r6-status';
      const sek = s.lastAgoMs == null ? null : Math.max(0, Math.round(s.lastAgoMs / 1000));
      tal.innerHTML = `${esc(fmt(S.flytninger, { n: s.moves }))} · ${esc(fmt(S.vip, { n: s.wobbles }))}<br>${esc(fmt(S.toke, { n: s.visits }))}<br>${sek == null ? esc(S.aldrig) : esc(fmt(S.senest, { s: sek })) + ' ' + esc(s.lastWasYou ? S.afDig : S.afAnden)}`;
      if (s.event && S.begiv[s.event]) sig(S.begiv[s.event]);
      if (sendt) { mk.log({ method: 'WS', path: 'stol/ws · move', status: 101, ms: performance.now() - sendt, source: 'server', at: new Date().toISOString() }); sendt = 0; }
    }
    function flyt(dx, dy) { if (!ws || ws.readyState !== 1) return; sendt = performance.now(); ws.send(JSON.stringify({ type: 'move', dx, dy })); }
    function forbind() {
      fetch('/api/ting-ai/health', { credentials: 'same-origin' }).then(r => r.json()).then(h => {
        if (!h || !h.ok || !h.data.configured.chair_room) { stEl.textContent = S.offline; stEl.className = 'r6-status fejl'; return; }
        ws = new WebSocket(location.origin.replace(/^http/, 'ws') + '/api/ting-ai/stol/ws');
        ws.onopen = () => { forsøg = 0; ws.send(JSON.stringify({ type: 'hello' })); };
        ws.onmessage = e => { let m; try { m = JSON.parse(e.data); } catch (x) { return; } if (m.type === 'snapshot') vis(m); else if (m.type === 'error') { sig(S.fejl[m.code] || m.code, 'fejl'); sendt = 0; } };
        ws.onclose = () => { stEl.textContent = S.mistet; stEl.className = 'r6-status venter'; setTimeout(forbind, Math.min(15000, 1000 * 2 ** forsøg++)); };
      }).catch(() => { stEl.textContent = S.offline; stEl.className = 'r6-status fejl'; });
    }
    stolEl.querySelectorAll('[data-d]').forEach(b => b.addEventListener('click', () => { const [dx, dy] = b.dataset.d.split(',').map(Number); flyt(dx, dy); }));
    felt.addEventListener('click', e => { const b = e.target.closest('.r9-felt'); if (!b || !pos) return; const dx = +b.dataset.x - pos.x, dy = +b.dataset.y - pos.y; if (Math.abs(dx) + Math.abs(dy) === 1) flyt(dx, dy); });
    felt.addEventListener('keydown', e => { const d = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[e.key]; if (d) { e.preventDefault(); flyt(d[0], d[1]); } });
    forbind();
    // runde 12: stolens dagbog fra Durable Objectens SQLite-lager (hvilken vej den oftest bliver skubbet)
    if (window.tvKaede && window.tvKaede.dagbog) window.tvKaede.dagbog($('#st-dagbog', stolEl), 'stol/dagbog?lang=' + lang, da ? { 'øst': 'mod øst', vest: 'mod vest', nord: 'mod nord', syd: 'mod syd' } : { 'øst': 'east', vest: 'west', nord: 'north', syd: 'south' });
  }

  /* ── Hittegodskontoret: Vectorize + bge-m3. Svarene kommer fra kataloget i koden. ── */
  const hgEl = $('#hittegods');
  if (hgEl) {
    const G = T.hg, mk = maskineri($('#hittegods-maskineri'), { p: ['Vectorize (namespace hittegods-da/-en)', 'Workers AI · bge-m3 embeddings', 'AI Gateway', 'D1 (joblås)', 'Rate Limiting'], f: ['worker/src/features/hittegods.js', 'worker/src/lib/hittegods.js', 'assets/kilde/sagsmappe.js'] });
    hgEl.innerHTML = `<form class="r6-form" id="hg-form"><label for="hg-q">${esc(G.label)}</label><input id="hg-q" type="search" maxlength="120" placeholder="${esc(G.ph)}" autocomplete="off"><button class="knap" type="submit">${esc(G.soeg)}</button></form>
      <p class="r9-chips">${G.eksempler.map(x => `<button type="button" class="knap sek r9-chip-knap">${esc(x)}</button>`).join('')}</p>
      <p class="r6-status" id="hg-status" aria-live="polite"></p><div id="hg-fund" aria-live="polite"></div><p class="note">${esc(G.note)}</p>`;
    const q = $('#hg-q', hgEl), st = $('#hg-status', hgEl), ud = $('#hg-fund', hgEl);
    async function søg(tekst) {
      if (tekst.trim().length < 2) { st.className = 'r6-status fejl'; st.textContent = G.kort; return; }
      st.className = 'r6-status venter'; st.textContent = G.soeger; ud.innerHTML = '';
      const r = await api('hittegods', { method: 'POST', json: { q: tekst.trim(), lang } }, mk);
      if (!r.ok) { st.className = 'r6-status fejl'; st.textContent = r.code === 'not_configured' ? G.offline : (r.message || T.ravn.netfejl); return; }
      const fund = r.data.fund || [];
      st.className = 'r6-status'; st.textContent = r.data.nyIndeks ? G.nyIndeks : !fund.length ? G.ingen : fund[0].score < 0.5 ? G.lav : '';
      ud.innerHTML = `<ol class="r9-hylde">${fund.map(g => `<li${/^\/assets\/pak\/[a-z0-9/-]+\.webp$/.test(g.billede || '') ? ` class="r9-hg-med"><img class="r9-hg-billede" src="${esc(g.billede)}" alt="" width="96" height="96" loading="lazy" decoding="async">` : '>'}<div class="r9-score" style="--s:${Math.max(0, Math.min(1, g.score))}" aria-hidden="true"></div><b>${esc(g.titel)}</b> <span class="r9-score-tal">${esc(Math.round(g.score * 100))} % ${esc(G.score)}</span><p>${esc(g.tekst)}</p><p class="note">${esc(G.fundet)}: ${esc(g.sted)} · ${esc(g.aar)}</p>${(g.emner || []).length ? `<p class="r9-emner">${g.emner.map(x => `<span>${esc(x)}</span>`).join('')}</p>` : ''}</li>`).join('')}</ol>`;
      ud.querySelectorAll('.r9-hg-billede').forEach(i => i.addEventListener('error', () => { i.closest('li').classList.remove('r9-hg-med'); i.remove(); }));
    }
    $('#hg-form', hgEl).addEventListener('submit', e => { e.preventDefault(); søg(q.value); });
    hgEl.querySelectorAll('.r9-chip-knap').forEach(b => b.addEventListener('click', () => { q.value = b.textContent; søg(b.textContent); }));
  }


  /* ── Kodegryden: gæstens kode i en Web Worker fra sitet selv (egen CSP: intet netværk). Intet sendes til tinget. ── */
  const kgEl = $('#kodegryden');
  if (kgEl) {
    const K = T.kg, KKEY = 'tingsvad.kodegryde.v1';
    const S = Object.assign({ schemaVersion: 1, loest: [], kode: {} }, læs(KKEY) || {});
    const gem = () => { try { localStorage.setItem(KKEY, JSON.stringify(S)); } catch (e) { } };
    const mk = maskineri($('#kodegryden-maskineri'), { p: ['Web Worker (din browser)', 'Content Security Policy: worker-src \'self\'', 'Egen CSP for workeren: default-src \'none\'', 'Ingen server'], f: ['assets/kodegryde-worker-v1.js', '_headers', 'assets/kilde/sagsmappe.js', 'assets/kilde/sagsmappe-tekst.js'] });
    let aktiv = K.opgaver[0].id;
    kgEl.innerHTML = `<p class="r6-kildelinje">${kilde('browser')}</p><div class="r9-faner" role="tablist" id="kg-faner"></div><div id="kg-opgave"></div><p class="note">${esc(K.lokalt)}</p>`;
    const faner = $('#kg-faner', kgEl), boks = $('#kg-opgave', kgEl);
    function tegnFaner() { faner.innerHTML = K.opgaver.map(o => `<button type="button" role="tab" class="knap sek${o.id === aktiv ? ' aktiv' : ''}" aria-selected="${o.id === aktiv}" data-id="${esc(o.id)}">${S.loest.includes(o.id) ? '✓ ' : ''}${esc(o.titel)}</button>`).join(''); }
    function vis(id) {
      aktiv = id; tegnFaner(); const o = K.opgaver.find(x => x.id === id);
      boks.innerHTML = `<h3>${esc(o.titel)}</h3><p>${esc(o.tekst)}</p><label for="kg-kode">${esc(K.label)}</label>
        <textarea id="kg-kode" class="r9-kode" spellcheck="false" autocapitalize="off" autocomplete="off" rows="9" maxlength="4000">${esc(S.kode[id] || o.start)}</textarea>
        <div class="r9-stol-knapper"><button class="knap" type="button" id="kg-koer">${esc(K.koer)}</button><button class="knap sek" type="button" id="kg-nul">${esc(K.nulstil)}</button><button class="knap sek" type="button" id="kg-los" aria-expanded="false">${esc(K.visLos)}</button></div>
        <pre class="r9-los" id="kg-losning" hidden>${esc(o.losning)}</pre><p class="r6-status" id="kg-status" aria-live="polite"></p><ol class="r9-prover" id="kg-prover"></ol>`;
      const ta = $('#kg-kode', boks), st = $('#kg-status', boks), pr = $('#kg-prover', boks);
      ta.addEventListener('input', () => { S.kode[id] = ta.value.slice(0, 4000); gem(); });
      ta.addEventListener('keydown', e => { if (e.key === 'Tab' && !e.shiftKey) { e.preventDefault(); const a = ta.selectionStart; ta.setRangeText('  ', a, ta.selectionEnd, 'end'); } });
      $('#kg-nul', boks).addEventListener('click', () => { ta.value = o.start; delete S.kode[id]; gem(); pr.innerHTML = ''; st.textContent = ''; });
      $('#kg-los', boks).addEventListener('click', e => { const p = $('#kg-losning', boks); p.hidden = !p.hidden; e.target.setAttribute('aria-expanded', String(!p.hidden)); e.target.textContent = p.hidden ? K.visLos : K.skjulLos; });
      $('#kg-koer', boks).addEventListener('click', () => {
        st.className = 'r6-status venter'; st.textContent = K.koger; pr.innerHTML = '';
        const t0 = performance.now(); let w;
        try { w = new Worker('/assets/kodegryde-worker-v1.js'); } catch (e) { st.className = 'r6-status fejl'; st.textContent = String(e.message); return; }
        const stop = setTimeout(() => { w.terminate(); st.className = 'r6-status fejl'; st.textContent = K.overkog; mk.log({ method: 'Worker', path: 'kodegryde · ' + id, status: 'timeout', ms: performance.now() - t0, source: 'browser', at: new Date().toISOString() }); }, 2000);
        w.onmessage = e => {
          clearTimeout(stop); w.terminate(); const d = e.data || {};
          mk.log({ method: 'Worker', path: 'kodegryde · ' + id, status: d.res ? 'ok' : 'fejl', ms: performance.now() - t0, source: 'browser', at: new Date().toISOString() });
          if (d.compile || d.fejl) { st.className = 'r6-status fejl'; st.textContent = fmt(K.compile, { f: d.compile || d.fejl }); return; }
          const n = d.res.filter(r => r.ok).length;
          pr.innerHTML = d.res.map((r, i) => `<li class="${r.ok ? 'gjort' : 'fejl'}"><code>${esc(JSON.stringify(o.tests[i].input))}</code> → ${r.ok ? '✓' : `${esc(K.forventet)} <code>${esc(JSON.stringify(o.tests[i].forventet))}</code>, ${r.fejl ? `${esc(K.fejl)}: ${esc(r.fejl)}` : `${esc(K.fik)} <code>${esc(r.ud)}</code>`}`}</li>`).join('');
          if (n === d.res.length) { st.className = 'r6-status'; st.textContent = K.alle; if (!S.loest.includes(id)) { S.loest.push(id); gem(); tegnFaner(); } }
          else { st.className = 'r6-status fejl'; st.textContent = fmt(K.nogle, { a: n, b: d.res.length }); }
        };
        w.onerror = e => { clearTimeout(stop); w.terminate(); st.className = 'r6-status fejl'; st.textContent = fmt(K.compile, { f: e.message || 'error' }); };
        w.postMessage({ kode: ta.value, tests: o.tests });
      });
    }
    faner.addEventListener('click', e => { const b = e.target.closest('[data-id]'); if (b) vis(b.dataset.id); });
    vis(aktiv);
  }

  /* ── Nødøvelser: tydeligt mærkede simulationer mod falske tjenester. Intet i produktionen påvirkes. ── */
  const oevEl = $('#noedoevelser');
  if (oevEl) {
    const O = T.oev, mk = maskineri($('#noedoevelser-maskineri'), { p: ['Workers', 'Falsk sprogmodel (timeout)', 'Falsk Workflows (dobbeltlevering)', 'Afstemningens logik i hukommelsen (reconnect)'], f: ['worker/src/features/oevelse.js', 'worker/src/lib/ai.js', 'worker/src/features/ravn.js', 'worker/src/lib/roomlogic.js'] });
    oevEl.innerHTML = `<div class="r9-oev">${['timeout', 'dublet', 'reconnect'].map(k => `<article class="r9-oev-kort"><h3>${esc(O.titler[k])}</h3><button class="knap" type="button" data-oev="${k}">${esc(O.koer)}</button><div class="r9-oev-ud" id="oev-${k}" aria-live="polite"></div></article>`).join('')}</div>`;
    oevEl.querySelectorAll('[data-oev]').forEach(b => b.addEventListener('click', async () => {
      const k = b.dataset.oev, ud = $('#oev-' + k, oevEl); b.disabled = true; ud.innerHTML = `<p class="r6-status venter">${esc(O.koerer)}</p>`;
      const r = await api('oevelse', { method: 'POST', json: { kind: k, lang } }, mk); b.disabled = false;
      if (!r.ok) { ud.innerHTML = `<p class="r6-status fejl">${esc(r.message || T.ravn.netfejl)}</p>`; return; }
      ud.innerHTML = `<p class="r6-kildelinje">${kilde('simulation')}</p><ol class="r9-trin r9-tidslinje">${r.data.trin.map(t => `<li class="${t.status === 'konklusion' ? 'gjort' : t.status === 'advarsel' ? 'nu' : t.status === 'fejl' ? 'fejl' : t.status === 'info' ? '' : 'gjort'}"><span>${esc(t.ms)} ${esc(O.ms)}</span> ${t.status === 'konklusion' ? `<b>${esc(t.tekst)}</b>` : esc(t.tekst)}</li>`).join('')}</ol>`;
    }));
  }

  /* ── Ravnepost: godkendte offentlige breve (aldrig afsendere) ── */
  const postEl = $('#ravnepost');
  if (postEl) {
    const P = T.post;
    api(`ravnepost?lang=${lang}`).then(r => {
      if (!r.ok || !r.data) { postEl.innerHTML = `<p class="note">${esc(P.vent)}</p>`; return; }
      const d = r.data;
      postEl.innerHTML = `${d.aktiv ? `<p class="r9-adresse">${esc(P.adresse)} <a href="mailto:${esc(d.adresse)}">${esc(d.adresse)}</a></p>` : `<p class="note">${esc(P.vent)}</p>`}
        <p class="r9-tal">${esc(fmt(P.tal, { n: d.iAlt, v: d.venter }))}</p>
        ${d.breve.length ? `<ol class="r9-hylde">${d.breve.map(b => `<li><b>${esc(b.emne)}</b><p>${esc(b.uddrag)}</p><p class="note">${esc(P.modtaget)} ${esc(dato(b.modtaget.slice(0, 10)))}</p></li>`).join('')}</ol>` : `<p class="note">${esc(P.ingen)}</p>`}`;
    });
  }

  /* ── Revisionen ── */
  const revEl = $('#revisionen-ind');
  if (revEl) {
    const V = T.rev;
    revEl.innerHTML = `<p class="r6-status venter">${esc(V.henter)}</p>`;
    const mkSpec = { p: ['Cron Triggers', 'Workflows', 'Browser Run · snapshot', 'R2', 'D1', 'Workers KV', V.ghLed] };
    const mk = maskineri($('#revisionen-maskineri'), Object.assign(mkSpec, { f: ['worker/src/features/revision.js', 'worker/src/workflow.js', 'worker/src/features/gudrun-github.js', 'assets/kilde/sagsmappe.js'] }));
    api(`revision?lang=${lang}`, null, mk).then(res => {
      if (!res.ok || !res.data) { revEl.innerHTML = `<p class="note">${esc(V.ikkeTilsluttet)}</p>`; return; }
      const d = res.data, sider = d.pages || [];
      const n = { ok: sider.filter(p => p.status === 'bestaaet').length, fejl: sider.filter(p => p.status === 'fejlet').length, ikke: sider.filter(p => p.status === 'ikke_koert').length };
      const gud = !d.date ? V.ikkeKoert : d.state === 'running' ? fmt(V.koerer, { n: n.ok + n.fejl + 1 }) : !n.fejl ? V.gudrun.alle : n.fejl > sider.length / 2 ? V.gudrun.mange : fmt(V.gudrun.nogle, { n: n.fejl });
      const navn = (side, p) => { const i = side.lastIndexOf('-'), k = side.slice(0, i), l = side.slice(i + 1); return `${(p && p.navn && p.navn[lang]) || V.sider[k] || k} · ${l}`; }; // runde 13: navnet kommer fra kanon.json via Workeren
      const chip = s => `<span class="r9-chip r9-${esc(s)}">${esc(s === 'bestaaet' ? V.bestaaet : s === 'fejlet' ? V.fejlet : V.ikke)}</span>`;
      revEl.innerHTML = `<p class="r6-kildelinje">${kilde('server')}${d.date ? ` <b>${esc(V.seneste)}:</b> ${esc(dato(d.date))}${d.finishedAt ? ` ${esc(T.ravn.kl)} ${esc(tid(d.finishedAt))}` : ''}` : ''}</p>
        <ul class="r9-fliser" role="list"><li class="r9-flise-ok"><b>${n.ok}</b><span>${esc(V.bestaaet)}</span></li><li class="r9-flise-fejl${n.fejl ? ' har' : ''}"><b>${n.fejl}</b><span>${esc(V.fejlet)}</span></li><li class="r9-flise-ikke"><b>${n.ikke}</b><span>${esc(V.ikke)}</span></li><li class="r9-flise-alle"><b>${sider.length}</b><span>${esc(V.iAltK)}</span></li></ul>
        <p class="r9-gudrun">${esc(gud)}</p>
        ${d.daekning ? `<p class="note">${esc(fmt(V.udgave, { c: d.release && d.release.commit ? d.release.commit.slice(0, 7) : '–', n: d.daekning.sider, k: d.daekning.kanon }))}</p>` : ''}
        ${ghLinje()}
        ${d.date && d.state !== 'running' ? `<p class="note">${d.full ? esc(V.fuld) + ' ' : ''}${esc(fmt(V.spar, { s: (d.browserMs || 0) >= 90000 ? (Math.round((d.browserMs || 0) / 6000) / 10).toLocaleString(da ? 'da-DK' : 'en-GB') + ' min' : Math.round((d.browserMs || 0) / 1000) + ' s', g: d.reused || 0 }))}</p>` : ''}
        ${tabel()}`;
      function ghLinje() {
        const g = d.github, repo = (g && g.repo) || 'wi24rd-com/tingsvad-website', alle = `https://github.com/${repo}/issues?q=label%3Agudrun`;
        const lnk = (url, t) => `<a href="${esc(url)}" rel="noopener">${esc(t)}</a>`, iss = n => `https://github.com/${repo}/issues/${n}`;
        let t, st = 'konf', kort;
        if (!g) { t = n.fejl ? esc(V.gh.venter) : esc(V.gh.ingenData); kort = V.gh.ledVenter; }
        else if (g.state === 'opened' || g.state === 'exists') { t = esc(fmt(g.state === 'opened' ? V.gh.aabnet : V.gh.findes, { n: g.issue || '' })).replace('{link}', g.issue ? lnk(iss(g.issue), '#' + g.issue) : ''); st = 'live'; kort = fmt(V.gh.ledAabnet, { n: g.issue || '' }); }
        else if (g.state === 'closed') { t = esc(V.gh.lukket).replace('{link}', (g.issues || []).map(x => lnk(iss(x), '#' + x)).join(', ')); st = 'live'; kort = fmt(V.gh.ledLukket, { n: (g.issues || []).map(x => '#' + x).join(' ') }); }
        else if (g.state === 'quiet') { t = esc(V.gh.stille); st = 'live'; kort = V.gh.ledStille; }
        else if (g.state === 'off') { t = esc(V.gh.slukket); st = 'fra'; kort = V.gh.ledSlukket; }
        else { t = esc(V.gh.fejl); st = 'fejl'; kort = V.gh.ledFejl; }
        mkSpec.ekstern = { GitHub: { s: st, tekst: kort } }; mk.tegn();
        return `<p class="r9-github r9-github-${st}"><b>GitHub</b> ${t} ${lnk(alle, V.gh.alle)} <span aria-hidden="true">↗</span></p>`;
      }
      function bemKort(p) {
        const m = (p.mangler || []).length, f = (p.fejl || []).length;
        if (m || f) return [m ? fmt(V.nMangler, { n: m }) : '', f ? fmt(V.nJs, { n: f }) : ''].filter(Boolean).join(' · ');
        return p.genbrugt ? fmt(V.uaendretKort, { dato: dato(p.genbrugt) }) : V.ingenBem;
      }
      function harMere(p) { return !!(p.screenshot || (p.mangler || []).length || (p.fejl || []).length || p.genbrugt); }
      function tabel() {
        return `<div class="r9-tabel-wrap" tabindex="0" role="region" aria-label="${esc(V.titel || 'Revision')}"><table class="r9-tabel"><thead><tr><th>${esc(V.kol.side)}</th><th>${esc(V.kol.status)}</th><th>${esc(V.kol.http)}</th><th>${esc(V.kol.ms)}</th><th>${esc(V.kol.fund)}</th><th><span class="sr-only">${esc(V.kol.billede)}</span></th></tr></thead><tbody>
        ${sider.map((p, i) => `<tr class="r9-r-${esc(p.status)}"><td><a href="${esc(p.path)}">${esc(navn(p.side, p))}</a></td><td>${chip(p.status)}</td><td>${esc(p.http || '–')}</td><td>${p.browserMs ? esc(Math.round(p.browserMs / 100) / 10 + ' s') : '–'}</td>
          <td class="r9-bem">${esc(bemKort(p))}</td>
          <td class="r9-handling">${harMere(p) ? `<button type="button" class="r9-vis" data-i="${i}">${esc(p.screenshot ? V.seBillede : V.detaljer)}</button>` : ''}</td></tr>`).join('')}
        </tbody></table></div>`;
      }
      // Billede og detaljer i et vindue oven på siden (<dialog>: baggrunden gråtones, Esc lukker, fokus bliver i vinduet)
      let dlg = document.getElementById('r9-dlg'), vist = 0;
      const med = sider.map((p, i) => i).filter(i => harMere(sider[i]));
      if (!dlg) {
        dlg = document.createElement('dialog'); dlg.id = 'r9-dlg'; dlg.className = 'r9-dlg'; dlg.setAttribute('aria-labelledby', 'r9-dlg-h');
        document.body.appendChild(dlg);
        dlg.addEventListener('click', e => { if (e.target === dlg) dlg.close(); const k = e.target.closest('[data-gaa]'); if (k) visDlg(+k.dataset.gaa); });
        dlg.addEventListener('keydown', e => { if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { const j = med.indexOf(vist) + (e.key === 'ArrowRight' ? 1 : -1); if (med[j] != null) visDlg(med[j]); } });
        dlg.addEventListener('close', () => { const b = revEl.querySelector(`.r9-vis[data-i="${vist}"]`); if (b) b.focus(); });
      }
      revEl.addEventListener('click', e => { const b = e.target.closest('.r9-vis'); if (b) visDlg(+b.dataset.i); });
      function visDlg(i) {
        const p = sider[i]; if (!p) return; vist = i;
        const j = med.indexOf(i), forr = med[j - 1], naes = med[j + 1];
        const rk = (t, v) => v ? `<div><dt>${esc(t)}</dt><dd>${v}</dd></div>` : '';
        dlg.innerHTML = `<div class="r9-dlg-in">
          <header class="r9-dlg-hoved"><div><p class="r9-dlg-over">${chip(p.status)} <span>HTTP ${esc(p.http || '–')}${p.browserMs ? ' · ' + esc(V.kol.ms) + ' ' + esc(Math.round(p.browserMs / 100) / 10 + ' s') : ''}</span></p><h3 id="r9-dlg-h">${esc(navn(p.side, p))}</h3></div>
            <button type="button" class="r9-dlg-luk" data-luk aria-label="${esc(V.luk)}">×</button></header>
          ${p.screenshot ? `<a class="r9-dlg-fig" href="${esc(p.screenshot)}" target="_blank" rel="noopener"><img src="${esc(p.screenshot)}" alt="${esc(fmt(V.billedeAlt, { side: navn(p.side, p) }))}" decoding="async"></a>` : `<p class="note">${esc(V.ingenBillede)}</p>`}
          <dl class="r9-dlg-dl">
            ${rk(V.mangler, (p.mangler || []).length ? (p.mangler || []).map(x => `<code>${esc(x)}</code>`).join(' ') : '')}
            ${rk(V.fejlJs, (p.fejl || []).length ? `<ul>${(p.fejl || []).map(x => `<li><code>${esc(x)}</code></li>`).join('')}</ul>` : '')}
            ${rk(V.tjekket, p.checkedAt ? esc(dato(p.checkedAt.slice(0, 10)) + ' ' + T.ravn.kl + ' ' + tid(p.checkedAt)) : '')}
            ${rk(V.genbrugtH, p.genbrugt ? esc(fmt(V.genbrugt, { dato: dato(p.genbrugt) })) : '')}
            ${rk(V.sti, `<a href="${esc(p.path)}">${esc(p.path)}</a>`)}
          </dl>
          <footer class="r9-dlg-fod">
            <button type="button" class="knap sek" data-gaa="${forr}" ${forr == null ? 'disabled' : ''}>← ${esc(V.forrige)}</button>
            <span class="r9-dlg-tal">${j + 1} / ${med.length}</span>
            <button type="button" class="knap sek" data-gaa="${naes}" ${naes == null ? 'disabled' : ''}>${esc(V.naeste)} →</button>
          </footer></div>`;
        dlg.querySelector('[data-luk]').addEventListener('click', () => dlg.close());
        if (!dlg.open) dlg.showModal();
        dlg.querySelector(naes != null ? `[data-gaa="${naes}"]` : '[data-luk]').focus();
      }
    });
  }
})();
