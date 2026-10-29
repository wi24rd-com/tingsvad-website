/* tingsvad.dk — runde 5: det levende tingsted.
   15 indslag (F01–F15) + faktaspor (H01–H03). Tekster i round5-tekst.js, stil i site.css.
   Alt kører lokalt i browseren. Intet sendes, intet oprettes, intet afgøres. */
(function () {
  const lang = document.documentElement.lang === 'en' ? 'en' : 'da', da = lang === 'da';
  const T = window.TV5 && window.TV5[lang]; if (!T) return;
  const $ = (s, r) => (r || document).querySelector(s), $$ = (s, r) => [...(r || document).querySelectorAll(s)];
  const reduceMQ = matchMedia('(prefers-reduced-motion: reduce)'); const reduce = () => reduceMQ.matches;
  const smal = () => matchMedia('(max-width: 700px)').matches;
  const base = ($('link[rel="stylesheet"][href*="site.css"]').getAttribute('href').split('site.css')[0]);
  const NY = base + 'pak/nye/', PAK = base + 'pak/';
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const portræt = window.tingsvadPortraet || (() => '');
  const img = (src, alt, w, h, cls, extra) => `<img src="${src}" alt="${esc(alt || '')}" width="${w}" height="${h}" loading="lazy" decoding="async"${cls ? ` class="${cls}"` : ''}${alt ? '' : ' aria-hidden="true"'}${extra || ''}>`;
  const nf = n => n.toLocaleString(da ? 'da-DK' : 'en-GB');

  /* ── Fælles dato (Europe/Copenhagen), sæson og dagligt seed ── */
  function cph(d) {
    const p = {}; new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Copenhagen', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(d || new Date()).forEach(x => p[x.type] = x.value);
    const y = +p.year, m = +p.month, dd = +p.day; return { y, m, d: dd, iso: `${p.year}-${p.month}-${p.day}`, nr: y * 372 + m * 31 + dd };
  }
  const idag = cph();
  const seed = n => { const x = Math.sin(n * 9301 + 49297) * 233280; return x - Math.floor(x); };
  const sæsonAf = m => m === 12 || m <= 2 ? 'vinter' : m <= 5 ? 'foraar' : m <= 8 ? 'sommer' : 'efteraar';
  const erMorten = (m, d) => m === 11 && d >= 9 && d <= 11;

  /* ── Lokal hukommelse: ét versionsstyret objekt, tilbagefald til hukommelsen ── */
  const KEY = 'tingsvad.experience.v1';
  const defaults = () => ({ schemaVersion: 1, fragments: [], foundObjects: [], queueTicket: null, shieldBackSeen: false, museumVisited: false, lastSeenLocalDate: null, seasonOverride: null });
  function load() {
    try { const raw = localStorage.getItem(KEY); if (raw) { const o = JSON.parse(raw); if (o && o.schemaVersion === 1 && Array.isArray(o.fragments) && Array.isArray(o.foundObjects)) return Object.assign(defaults(), o); } } catch (e) { }
    return defaults();
  }
  let S = load();
  const sidsteBesøg = S.lastSeenLocalDate;
  function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { } }
  const lyt = [];
  function emit() { lyt.forEach(f => { try { f(); } catch (e) { } }); }
  function addFragment(id) { if (S.fragments.includes(id)) return false; S.fragments.push(id); save(); emit(); return true; }
  function addFound(id) { if (S.foundObjects.includes(id)) return false; S.foundObjects.push(id); save(); emit(); return true; }
  S.lastSeenLocalDate = idag.iso; save();

  /* ── Status: Side 2 – n af 3 ── */
  function statusHtml() { const n = S.fragments.length; return `${T.status.side2} – <b>${n} ${T.status.af} 3</b> ${T.status.fragmenter}`; }
  function opdaterStatus() { $$('.r5-status, #r5-hero-status').forEach(el => { el.innerHTML = statusHtml(); el.classList.toggle('faerdig', S.fragments.length === 3); }); }
  lyt.push(opdaterStatus);

  /* ── Opryddere ved nulstilling ── */
  let cleanup = [];
  const onCleanup = f => cleanup.push(f);

  /* ── Hjælpere til paneler ── */
  function panel(id, titel, under, indhold, open) { return `<details class="r5-fold" id="r5-${id}"${open ? ' open' : ''}><summary><span class="r5-fold-titel">${esc(titel)}</span><span class="r5-fold-under">${esc(under)}</span></summary><div class="r5-fold-ind">${indhold}</div></details>`; }
  const vidfakta = (tekst, kilde, url) => `<aside class="vidfakta"><img class="sten-ik" src="${PAK}grafik/loes-sten.webp" alt="" width="512" height="512" loading="lazy"><b>${esc(T.fakta)}</b><p>${esc(tekst)}</p><cite><a href="${esc(url)}" rel="noopener">${esc(kilde)}</a></cite></aside>`;
  const samlKnap = (id, cls) => `<button type="button" class="knap r5-saml${cls ? ' ' + cls : ''}" data-fragment="${id}"${S.fragments.includes(id) ? ' disabled' : ''}>${S.fragments.includes(id) ? esc(T.akt.samlet) : esc(T.akt.saml)}</button>`;
  function bindSaml(root) { $$('.r5-saml', root).forEach(b => b.addEventListener('click', () => { if (addFragment(b.dataset.fragment)) { b.disabled = true; b.textContent = T.akt.samlet; } })); }
  lyt.push(() => $$('.r5-saml').forEach(b => { if (S.fragments.includes(b.dataset.fragment)) { b.disabled = true; b.textContent = T.akt.samlet; } }));

  /* ═══════════════ GRUPPE 1: UNDERSØG SAGEN ═══════════════ */

  /* F02 – Aktindsigt */
  function mountAkt(el) {
    const A = T.akt;
    const linjer = A.linjer.map((l, i) => i < 4 ? `<p>${esc(l)}</p>` : '').join('');
    const strege = A.skjult.map((s, i) => `<span class="akt-linje"><button type="button" class="akt-streg" aria-expanded="false" aria-controls="akt-s${i}" aria-label="${esc(s[1])}"></button><span class="akt-afsl" id="akt-s${i}" hidden>${esc(s[0])}</span></span>`).join('');
    el.innerHTML = `<div class="akt"><div class="akt-dok">${img(NY + 'arkivdokument.webp', '', 800, 1200)}<div class="akt-tekst"><div class="akt-hoved">${esc(A.hoved)}</div>${linjer}<p>${esc(A.linjer[4])}${strege}</p><div class="akt-saml" id="akt-saml" hidden>${samlKnap('archive')}<span class="note">${esc(A.fund)}</span></div></div></div><p class="note">${esc(A.fod)}</p></div>`;
    $$('.akt-streg', el).forEach((b, i) => b.addEventListener('click', () => {
      const åben = b.getAttribute('aria-expanded') === 'true'; b.setAttribute('aria-expanded', String(!åben)); const t = $('#' + b.getAttribute('aria-controls'), el); t.hidden = åben; b.classList.toggle('aaben', !åben);
      if (i === 3 && !åben) { $('#akt-saml', el).hidden = false; }
    }));
    bindSaml(el);
  }

  /* F12 – Vend skjoldet */
  function mountSkjold(el) {
    const K = T.skjold;
    el.innerHTML = `<div class="skjold"><div class="skjold-ramme" data-side="for">${img(PAK + 'web/skjold.webp', K.forside, 1200, 675, 'skjold-for')}${img(NY + 'skjold-bagside.webp', K.alt, 768, 768, 'skjold-bag')}<button type="button" class="skjold-rem" hidden aria-label="${esc(K.rem)}" title="${esc(K.remHint)}"></button></div>
      <div class="skjold-ui"><button type="button" class="knap" id="skjold-vend" aria-pressed="false">${esc(K.vend)}</button><button type="button" class="knap sek" id="skjold-rem2" hidden>${esc(K.rem)}</button><span class="note" id="skjold-side">${esc(K.forside)}</span></div>
      <div class="skjold-seddel" id="skjold-seddel" hidden><p class="skjold-seddel-t">${esc(K.seddel)}</p>${samlKnap('shield')}<p class="note">${esc(K.asgeir)}</p></div></div>`;
    const ramme = $('.skjold-ramme', el), vend = $('#skjold-vend', el), rem = $('.skjold-rem', el), rem2 = $('#skjold-rem2', el), side = $('#skjold-side', el), seddel = $('#skjold-seddel', el);
    vend.addEventListener('click', () => {
      const bag = ramme.dataset.side !== 'bag'; ramme.dataset.side = bag ? 'bag' : 'for'; ramme.classList.toggle('uden-anim', reduce());
      vend.textContent = bag ? K.vendTilbage : K.vend; vend.setAttribute('aria-pressed', String(bag)); side.textContent = bag ? K.bagside : K.forside; rem.hidden = !bag; rem2.hidden = !bag;
      if (bag && !S.shieldBackSeen) { S.shieldBackSeen = true; save(); }
      if (!bag) seddel.hidden = true;
    });
    const åbn = () => { seddel.hidden = false; seddel.querySelector('.r5-saml, p').focus?.(); };
    rem.addEventListener('click', åbn); rem2.addEventListener('click', åbn); bindSaml(el);
  }

  /* F04 – Arkæologisk udgravning */
  function mountGrav(el) {
    const G = T.grav;
    const fund = [['kam', 'kam.webp', .22, .22, .30, .30], ['moent', 'moent.webp', .62, .14, .26, .26], ['runepind', 'runepind.webp', .20, .60, .62, .41]]; // id, fil, x, y, w, h (normaliseret)
    el.innerHTML = `<div class="grav"><div class="grav-felt" id="grav-felt">${img(NY + 'udgravning.webp', G.alt, 768, 768, 'grav-jord')}
      ${fund.map(f => `<img class="grav-fund" data-id="${f[0]}" src="${NY + f[1]}" alt="${esc(G.fund[f[0]][0])}" width="768" height="${f[0] === 'runepind' ? 512 : 768}" loading="lazy" style="left:${f[2] * 100}%;top:${f[3] * 100}%;width:${f[4] * 100}%;height:${f[5] * 100}%">`).join('')}
      <canvas class="grav-daek" id="grav-daek" width="768" height="768" aria-hidden="true"></canvas></div>
      <div class="grav-ui"><p class="note">${esc(G.hint)}</p><div class="grav-knapper">${fund.map((f, i) => `<button type="button" class="knap sek" data-felt="${f[0]}">${esc(G.felt)} ${G.felter[i]}</button>`).join('')}<button type="button" class="knap sek" id="grav-igen">${esc(G.nulstil)}</button></div>
      <ul class="grav-liste" id="grav-liste" aria-live="polite"></ul><div class="grav-saml" id="grav-saml" hidden><p>${esc(G.alle)}</p>${samlKnap('excavation')}</div></div></div>`;
    const felt = $('#grav-felt', el), cv = $('#grav-daek', el), ctx = cv.getContext('2d'), liste = $('#grav-liste', el), saml = $('#grav-saml', el);
    const jord = new Image(); jord.src = NY + 'udgravning.webp';
    const tegnDæk = () => { ctx.globalCompositeOperation = 'source-over'; ctx.clearRect(0, 0, 768, 768); if (jord.complete && jord.naturalWidth) ctx.drawImage(jord, 0, 0, 768, 768); else { ctx.fillStyle = '#3b2e22'; ctx.fillRect(0, 0, 768, 768); } ctx.fillStyle = 'rgba(40,30,20,.35)'; ctx.fillRect(0, 0, 768, 768); };
    jord.onload = () => { if (!S.foundObjects.length) tegnDæk(); else { tegnDæk(); fund.forEach(f => { if (S.foundObjects.includes(f[0])) afdæk(f, true); }); } };
    tegnDæk();
    // prøvepunkter pr. fund: 5 punkter, afdækket når 4 er børstet
    const prøver = {}; fund.forEach(f => { const cx = f[2] + f[4] / 2, cy = f[3] + f[5] / 2; prøver[f[0]] = [[cx, cy], [cx - f[4] * .3, cy], [cx + f[4] * .3, cy], [cx, cy - f[5] * .3], [cx, cy + f[5] * .3]].map(p => ({ x: p[0], y: p[1], ok: false })); });
    const R = 0.075; let kø = [], raf = 0;
    function flush() { raf = 0; ctx.globalCompositeOperation = 'destination-out'; kø.forEach(p => { ctx.beginPath(); ctx.arc(p.x * 768, p.y * 768, R * 768, 0, 7); ctx.fill(); }); kø = []; ctx.globalCompositeOperation = 'source-over'; tjek(); }
    function børst(x, y) { kø.push({ x, y }); for (const id in prøver) prøver[id].forEach(p => { if (!p.ok && Math.hypot(p.x - x, p.y - y) < R * 1.1) p.ok = true; }); if (!raf) raf = requestAnimationFrame(flush); }
    function afdæk(f, stille) { ctx.globalCompositeOperation = 'destination-out'; ctx.beginPath(); ctx.ellipse((f[2] + f[4] / 2) * 768, (f[3] + f[5] / 2) * 768, f[4] * 768 * .62, f[5] * 768 * .62, 0, 0, 7); ctx.fill(); ctx.globalCompositeOperation = 'source-over'; prøver[f[0]].forEach(p => p.ok = true); if (!stille) addFound(f[0]); visListe(); }
    function tjek() { fund.forEach(f => { if (!S.foundObjects.includes(f[0]) && prøver[f[0]].filter(p => p.ok).length >= 4) afdæk(f); }); }
    function visListe() {
      liste.innerHTML = S.foundObjects.length ? fund.filter(f => S.foundObjects.includes(f[0])).map(f => `<li><b>${esc(G.fund[f[0]][0])}</b><span>${esc(G.fund[f[0]][1])}</span></li>`).join('') : `<li class="sager-tom">${esc(G.ingen)}</li>`;
      saml.hidden = !fund.every(f => S.foundObjects.includes(f[0]));
      $$('.grav-fund', el).forEach(i => i.classList.toggle('fundet', S.foundObjects.includes(i.dataset.id)));
    }
    visListe();
    let aktiv = false;
    const pos = e => { const r = cv.getBoundingClientRect(); return [(e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height]; };
    cv.addEventListener('pointerdown', e => { aktiv = true; cv.setPointerCapture?.(e.pointerId); const [x, y] = pos(e); børst(x, y); });
    cv.addEventListener('pointermove', e => { if (!aktiv) return; const [x, y] = pos(e); if (x >= 0 && x <= 1 && y >= 0 && y <= 1) børst(x, y); });
    const slip = () => { aktiv = false; }; cv.addEventListener('pointerup', slip); cv.addEventListener('pointercancel', slip); cv.addEventListener('pointerleave', slip);
    $$('[data-felt]', el).forEach(b => b.addEventListener('click', () => { const f = fund.find(x => x[0] === b.dataset.felt); afdæk(f); b.setAttribute('aria-pressed', 'true'); }));
    $('#grav-igen', el).addEventListener('click', () => { tegnDæk(); for (const id in prøver) prøver[id].forEach(p => p.ok = false); fund.forEach(f => { if (S.foundObjects.includes(f[0])) afdæk(f, true); }); });
    bindSaml(el);
  }

  /* F03 – Den forsvundne side 2 */
  function mountSide2(el) {
    const P = T.side2;
    const brikker = [['archive', '0 0,33% 0,33% 5%,40% 25%,47% 36%,52% 44%,30% 50%,20% 52%,0 52%', '12% 70% 58% 6%'], ['shield', '33% 0,100% 0,100% 52%,80% 50%,68% 48%,52% 44%,47% 36%,40% 25%,33% 5%', '10% 6% 60% 52%'], ['excavation', '0 52%,20% 52%,30% 50%,52% 44%,68% 48%,80% 50%,100% 52%,100% 100%,0 100%', '60% 12% 22% 12%']];
    const alle = S.fragments.length === 3;
    el.innerHTML = `<div class="side2"><div class="side2-ark" role="img" aria-label="${esc(P.alt)}">${brikker.map((b, i) => `<div class="side2-brik${S.fragments.includes(b[0]) ? ' fundet' : ''}" data-id="${b[0]}" style="clip-path:polygon(${b[1]})"><img src="${NY}side-to.webp" alt="" width="800" height="1200" loading="lazy" aria-hidden="true"><span class="side2-tekst" style="inset:${b[2]}">${esc(S.fragments.includes(b[0]) ? P.tekst[b[0]] : P.tom)}</span></div>`).join('')}</div>
      <div class="side2-ui"><ol class="side2-liste">${brikker.map((b, i) => { const f = S.fragments.includes(b[0]); return `<li class="${f ? 'ok' : ''}"><span class="ik">${f ? '✓' : '○'}</span><b>${esc(P.brik[i])} · ${esc(P.findesteder[b[0]][0])}</b><span>${f ? esc(P.fundet) : esc(P.mangler) + ' – ' + esc(P.findesteder[b[0]][1])}</span></li>`; }).join('')}</ol>
      <div class="side2-resultat" aria-live="polite">${alle ? `<p class="side2-afsl">${esc(P.afsloer)}</p><p class="side2-brian">${portræt('Mímir', true)}${esc(P.brian)}</p><div class="side2-segl">${img(PAK + 'grafik/segl.webp', P.segl, 512, 512)}<span class="note">${esc(P.segl)}</span></div>` : `<p class="note">${esc(P.venter)}</p>`}</div></div></div>`;
  }

  /* ═══════════════ GRUPPE 2: LIVET VED VADESTEDET ═══════════════ */

  /* F11 – Opslagstavlen */
  function mountTavle(el) {
    const O = T.tavle; const boxes = [[23, 19, 14, 27], [24, 48, 10, 19], [40, 18, 22, 52], [66, 19, 14, 26], [65, 49, 15, 19], [81, 44, 7, 25]];
    const n = O.opslag.length, dagens = []; let s = idag.nr; while (dagens.length < 6) { const i = Math.floor(seed(s++) * n); if (!dagens.includes(i)) dagens.push(i); }
    const rest = O.opslag.map((_, i) => i).filter(i => !dagens.includes(i));
    // længste tekster på de største sedler
    const efterStr = [...dagens].sort((a, b) => O.opslag[b].length - O.opslag[a].length), efterAreal = boxes.map((b, k) => k).sort((a, b) => boxes[b][2] * boxes[b][3] - boxes[a][2] * boxes[a][3]);
    el.innerHTML = `<div class="tavle"><div class="tavle-wrap" aria-hidden="true">${img(NY + 'opslagstavle.webp', '', 1440, 960)}${efterStr.map((i, n) => { const bx = boxes[efterAreal[n]]; return `<div class="tavle-seddel" style="left:${bx[0]}%;top:${bx[1]}%;width:${bx[2]}%;height:${bx[3]}%">${esc(O.opslag[i])}</div>`; }).join('')}</div>
      <ul class="tavle-liste" id="tavle-liste">${dagens.map(i => `<li>${esc(O.opslag[i])}</li>`).join('')}</ul>
      <button type="button" class="knap sek" id="tavle-flere" aria-expanded="false">${esc(O.flere)}</button><ul class="tavle-liste tavle-ekstra" id="tavle-ekstra" hidden>${rest.map(i => `<li>${esc(O.opslag[i])}</li>`).join('')}</ul></div>`;
    const k = $('#tavle-flere', el), ex = $('#tavle-ekstra', el);
    k.addEventListener('click', () => { const åben = !ex.hidden; ex.hidden = åben; k.setAttribute('aria-expanded', String(!åben)); k.textContent = åben ? O.flere : O.faerre; });
  }

  /* F08 – Køsedlen */
  function mountKø(el) {
    const K = T.koe;
    const vis = (besked) => {
      const t = S.queueTicket;
      $('#koe-slate', el).innerHTML = t ? `<small>${esc(K.betjener)}</small><b>${esc(K.foerste)}</b>` : `<small>${esc(K.betjener)}</small><b>${esc(K.foerste)}</b>`;
      $('#koe-strip', el).textContent = t ? t.nr : '';
      $('#koe-tekst', el).innerHTML = t ? `<p><b>${esc(K.dit)}:</b> <code>${esc(t.nr)}</code> · ${esc(K.betjener)} <code>${esc(K.foerste)}</code></p><p>${esc(K.vent[t.v])}</p>${besked ? `<p class="koe-brian">${portræt('Mímir', true)}${esc(besked)}</p>` : ''}` : `<p class="note">${esc(K.ingen)}</p>`;
    };
    el.innerHTML = `<div class="koe"><div class="koe-wrap">${img(NY + 'koeautomat.webp', K.alt, 1200, 675)}<div class="koe-slate" id="koe-slate" aria-hidden="true"></div><div class="koe-strip" id="koe-strip" aria-hidden="true"></div></div>
      <div class="koe-ui"><button type="button" class="knap" id="koe-traek">${esc(K.traek)}</button><div class="koe-tekst" id="koe-tekst" aria-live="polite"></div><p class="note">${esc(K.note)}</p></div></div>`;
    vis(S.queueTicket && sidsteBesøg && sidsteBesøg !== idag.iso ? K.tilbage : '');
    $('#koe-traek', el).addEventListener('click', () => {
      if (S.queueTicket) { vis(K.igen); return; }
      const nr = 2 + Math.floor(Math.random() * 9000); S.queueTicket = { nr: `K-0980-${String(nr).padStart(4, '0')}`, v: Math.floor(Math.random() * K.vent.length), d: idag.iso }; save(); vis('');
    });
  }

  /* F09 – Tågekamera */
  function mountKamera(el) {
    const C = T.kamera; let timer = 0, kører = false, synlig = true, gåsTimer = 0;
    el.innerHTML = `<div class="kamera"><div class="kamera-ramme" id="kamera-ramme">${img(NY + 'taagekamera.webp', C.alt, 1200, 675, 'kamera-bg')}<div class="kamera-taage" aria-hidden="true"></div><img class="kamera-gaas" id="kamera-gaas" src="${NY}gudrun-fritlagt.webp" alt="" width="768" height="768" aria-hidden="true" loading="lazy"><span class="kamera-maerke">${esc(C.maerke)}</span><span class="kamera-rec" id="kamera-rec" hidden>● ${esc(C.koerer)}</span></div>
      <div class="kamera-ui"><button type="button" class="knap" id="kamera-start" aria-pressed="false">${esc(C.start)}</button><button type="button" class="knap sek" id="kamera-nu">${esc(C.nu)}</button><p class="kamera-obs" id="kamera-obs" aria-live="polite">${esc(reduce() ? C.reduce : C.stille)}</p></div>
      <div class="kamera-arkiv"><b class="kicker" style="margin:0">${esc(C.arkiv)}</b><ul>${C.arkivT.map(a => `<li><time>${esc(a[0])}</time>${esc(a[1])}</li>`).join('')}</ul></div></div>`;
    const ramme = $('#kamera-ramme', el), gås = $('#kamera-gaas', el), start = $('#kamera-start', el), obs = $('#kamera-obs', el), rec = $('#kamera-rec', el);
    function observation() { obs.textContent = C.obs; if (reduce()) { gås.classList.add('stille'); clearTimeout(gåsTimer); gåsTimer = setTimeout(() => gås.classList.remove('stille'), 6000); return; } gås.classList.remove('glider'); void gås.offsetWidth; gås.classList.add('glider'); }
    gås.addEventListener('animationend', () => gås.classList.remove('glider'));
    function plan() { clearTimeout(timer); if (!kører || !synlig || document.hidden) return; timer = setTimeout(() => { observation(); plan(); }, 8000 + Math.random() * 7000); }
    function sæt(on) { kører = on; ramme.classList.toggle('koerer', on && !reduce()); rec.hidden = !on; start.textContent = on ? C.pause : C.start; start.setAttribute('aria-pressed', String(on)); if (on) plan(); else { clearTimeout(timer); gås.classList.remove('glider'); } }
    start.addEventListener('click', () => sæt(!kører));
    $('#kamera-nu', el).addEventListener('click', observation);
    const io = 'IntersectionObserver' in window ? new IntersectionObserver(es => { synlig = es[0].isIntersecting; if (synlig) plan(); else clearTimeout(timer); }) : null; io?.observe(ramme);
    const vh = () => { if (document.hidden) clearTimeout(timer); else plan(); }; document.addEventListener('visibilitychange', vh);
    onCleanup(() => { clearTimeout(timer); clearTimeout(gåsTimer); io?.disconnect(); document.removeEventListener('visibilitychange', vh); });
  }

  /* F14 – Museet for det, der næsten skete */
  function mountMuseum(el) {
    const M = T.museum; let klik = 0;
    el.innerHTML = `<div class="museum"><div class="museum-wrap">${img(NY + 'museum.webp', M.alt, 1200, 675)}${M.montrer.map((m, i) => `<span class="museum-plade" aria-hidden="true" style="left:${[20, 50, 80][i]}%;top:57%">${esc(m)}</span>`).join('')}<img class="museum-klaede" id="museum-klaede" src="${NY}museumsklaede.webp" alt="" width="800" height="1200" aria-hidden="true" loading="lazy"></div>
      <ul class="museum-liste">${M.montrer.map((m, i) => `<li><b>${esc(m)}</b><span>${esc(M.beskr[i])}</span></li>`).join('')}</ul>
      <div class="museum-ui"><button type="button" class="knap" id="museum-loeft" aria-pressed="false">${esc(M.loeft)}</button><p class="museum-svar" id="museum-svar" aria-live="polite"></p></div>
      <div class="museum-hjelm"><div class="museum-hjelm-ind">${img(NY + 'hjelm.webp', M.hjelm.alt, 768, 768)}<div><b class="kicker" style="margin:0 0 .4rem">${esc(M.hjelm.titel)}</b><p>${esc(M.hjelm.tekst)}</p><p class="note">${esc(M.hjelm.ting)}</p></div></div>${vidfakta(M.hjelm.fakta, M.hjelm.kilde, M.hjelm.url)}</div></div>`;
    const kl = $('#museum-klaede', el), b = $('#museum-loeft', el), svar = $('#museum-svar', el);
    b.addEventListener('click', () => { const løftet = kl.classList.toggle('loeftet'); b.setAttribute('aria-pressed', String(løftet)); if (løftet) { klik++; svar.textContent = klik === 1 ? M.loeftet : M.igen; b.textContent = M.laeg; if (!S.museumVisited) { S.museumVisited = true; save(); } } else { b.textContent = M.loeft; svar.textContent = M.tom; } });
  }

  /* F15 – Årstider */
  let sæsonLag = null, sideLag = null;
  function aktuelSæson() { return S.seasonOverride || sæsonAf(idag.m); }
  function anvendSæson() {
    const s = aktuelSæson(); document.body.classList.remove('aarstid-vinter', 'aarstid-foraar', 'aarstid-sommer', 'aarstid-efteraar'); document.body.classList.add('aarstid-' + s);
    if (sæsonLag) { sæsonLag.remove(); sæsonLag = null; }
    if (sideLag) { sideLag.remove(); sideLag = null; }
    if (!reduce() && (s === 'efteraar' || s === 'vinter')) {
      sæsonLag = document.createElement('div'); sæsonLag.className = 'aarstid-lag aarstid-lag-' + s; sæsonLag.setAttribute('aria-hidden', 'true');
      if (s === 'efteraar') { const blade = [[3, 2, 40, 42], [59, 2, 33, 35], [35, 30, 30, 40], [72, 36, 27, 24], [5, 52, 30, 44]]; sæsonLag.innerHTML = blade.map((b, i) => `<i style="--bx:${b[0]};--by:${b[1]};--bw:${b[2]};--bh:${b[3]};--bl:${8 + i * 19}%;--bd:${i * 3.7}s;--bt:${26 + i * 5}s;background-image:url('${NY}efteraarsblade.webp')"></i>`).join(''); }
      ($('.r12-hero') || $('.r12s-hero') || (s === 'efteraar' && ($('.hero-lag') || $('.side-hoved'))) || document.body).appendChild(sæsonLag); // blade og frost kun i toppen (runde 12: i maleriet), aldrig hen over tekst og formularer
      // Runde 12: om efteråret daler blade også ned over resten af siden, men bag indholdet (kort, billeder og tekst ligger ovenpå)
      if (s === 'efteraar') {
        const B = [[3, 2, 40, 42], [59, 2, 33, 35], [35, 30, 30, 40], [72, 36, 27, 24], [5, 52, 30, 44]], N = 14;
        sideLag = document.createElement('div'); sideLag.className = 'aarstid-lag aarstid-lag-efteraar aarstid-side'; sideLag.setAttribute('aria-hidden', 'true');
        sideLag.innerHTML = Array.from({ length: N }, (_, i) => { const b = B[(i * 3) % 5], t = 22 + ((i * 7) % 19), str = .65 + ((i * 5) % 7) / 10;
          return `<i style="--bx:${b[0]};--by:${b[1]};--bw:${b[2]};--bh:${b[3]};--bl:${(i * 37) % 96}%;--bd:${-((i * 11) % t)}s;--bt:${t}s;--bs:${str};background-image:url('${NY}efteraarsblade.webp')" class="${i % 2 ? 'blad-h' : 'blad-v'}"></i>`; }).join('');
        document.body.prepend(sideLag);
      }
    }
    let linje = $('#aarstid-linje'); const bar = $('.hero-bar'); if (!bar) return;
    if (!linje) { linje = document.createElement('div'); linje.id = 'aarstid-linje'; linje.className = 'aarstid-linje'; bar.appendChild(linje); }
    linje.innerHTML = `<b>${esc(T.saeson.nu)}</b>${esc(T.saeson.navne[s])}: ${esc(T.saeson.besked[s])}${erMorten(idag.m, idag.d) ? ` · ${esc(T.saeson.morten)}` : ''}`;
  }
  function mountSæson(el) {
    const Z = T.saeson;
    el.innerHTML = `<div class="saeson"><label class="saeson-vaelg">${esc(Z.vaelg)} <select id="saeson-select"><option value="">${esc(Z.auto)} (${esc(Z.navne[sæsonAf(idag.m)])})</option>${['vinter', 'foraar', 'sommer', 'efteraar'].map(k => `<option value="${k}"${S.seasonOverride === k ? ' selected' : ''}>${esc(Z.navne[k])}</option>`).join('')}</select></label><p class="saeson-besked" id="saeson-besked" aria-live="polite"></p></div>`;
    const sel = $('#saeson-select', el), bes = $('#saeson-besked', el);
    const vis = () => { const s = aktuelSæson(); bes.textContent = `${Z.navne[s]}: ${Z.besked[s]}`; };
    sel.addEventListener('change', () => { S.seasonOverride = sel.value || null; save(); anvendSæson(); vis(); }); vis();
  }
  reduceMQ.addEventListener?.('change', anvendSæson);

  /* ═══════════════ GRUPPE 3: TINGETS KONTORER ═══════════════ */

  /* F05 – Tokes stolekonfigurator */
  function mountStol(el) {
    const ST = T.stol;
    el.innerHTML = `<div class="stol"><figure class="stol-fig">${img(NY + 'stol-tegning.webp', ST.alt, 1440, 960)}</figure><form class="stol-form" id="stol-form"><fieldset><legend class="kicker" style="margin-bottom:.6rem">${esc(ST.oversigt)}</legend>${ST.valg.map(v => `<label class="stol-valg"><input type="checkbox" name="${v[0]}" value="${v[0]}"><span>${esc(v[1])}</span><em>${esc(v[2])}</em></label>`).join('')}</fieldset>
      <div class="stol-oversigt" id="stol-oversigt" aria-live="polite"><p class="note">${esc(ST.ingen)}</p></div><button type="submit" class="knap" id="stol-send">${esc(ST.send)}</button><p class="note">${esc(ST.note)}</p></form>
      <div class="stol-resultat" id="stol-resultat" hidden></div></div>`;
    const form = $('#stol-form', el), ov = $('#stol-oversigt', el), res = $('#stol-resultat', el);
    const opd = () => { const v = $$('input:checked', form).map(i => ST.valg.find(x => x[0] === i.value)); ov.innerHTML = v.length ? `<ul>${v.map(x => `<li><b>${esc(x[1])}</b><span>${esc(x[2])}</span></li>`).join('')}</ul>` : `<p class="note">${esc(ST.ingen)}</p>`; };
    form.addEventListener('change', opd);
    form.addEventListener('submit', e => { e.preventDefault(); res.hidden = false; res.innerHTML = `${img(PAK + 'web/stol.webp', '', 1200, 675)}<div><p class="stol-udfald">${esc(ST.resultat)} <b>${esc(ST.forbehold)}</b></p><ol>${ST.fem.map(f => `<li>${esc(f)}</li>`).join('')}</ol><p class="note">${esc(ST.resten)}</p></div>`; $('#stol-send', el).textContent = ST.sendt; document.dispatchEvent(new CustomEvent('tingsvad:stol-ansoegt', { detail: { valg: $$('input:checked', form).map(i => i.value) } })); res.scrollIntoView?.({ block: 'nearest', behavior: reduce() ? 'auto' : 'smooth' }); });
  }

  /* F06 – Ekspertpanelet */
  function mountPanel(el) {
    const E = T.panel;
    el.innerHTML = `<div class="panel"><div class="panel-wrap">${img(NY + 'ekspertbord.webp', E.alt, 1200, 675)}${E.eksperter.map(x => `<i class="panel-mark" data-id="${x[0]}" style="left:${x[3]}%;top:${x[4]}%" aria-hidden="true"></i>`).join('')}<div class="panel-laage" id="panel-laage" aria-hidden="true"><span></span></div></div>
      <div class="panel-knapper" role="group" aria-label="${esc(E.titel)}">${E.eksperter.map(x => `<button type="button" data-id="${x[0]}" aria-pressed="false">${esc(x[1])}</button>`).join('')}</div>
      <blockquote class="forkl-svar panel-svar" id="panel-svar" aria-live="polite"><span class="forkl-hvem" id="panel-hvem"></span><span id="panel-tekst">${esc(E.vaelg)}</span></blockquote><p class="note">${esc(E.note)}</p></div>`;
    $$('.panel-knapper button', el).forEach(b => b.addEventListener('click', () => {
      const x = E.eksperter.find(e => e[0] === b.dataset.id); $$('.panel-knapper button', el).forEach(k => k.setAttribute('aria-pressed', String(k === b))); $$('.panel-mark', el).forEach(m => m.classList.toggle('aktiv', m.dataset.id === x[0]));
      $('#panel-hvem', el).textContent = x[1] + ':'; const laage = $('#panel-laage', el); const åben = x[0] === 'landmand'; laage.classList.toggle('aaben', åben); $('#panel-tekst', el).textContent = x[2] + (åben ? ' ' + E.laage : '');
    }));
  }

  /* F07 – Beredskabsplan */
  function mountBeredskab(el) {
    const B = T.beredskab; let sidst = null;
    const knap = (r, i, cls) => `<button type="button" class="${cls}" data-i="${i}" aria-expanded="false" aria-controls="bered-instruks"${cls === 'bered-knap' ? ` style="left:${r[2]}%;top:${r[3]}%"` : ''}><small>${esc(B.rumNr)} ${i + 1}</small>${esc(r[0])}</button>`;
    el.innerHTML = `<div class="bered"><div class="bered-wrap">${img(NY + 'beredskabsskab.webp', B.alt, 1440, 960)}<div class="bered-overlag">${B.rum.map((r, i) => knap(r, i, 'bered-knap')).join('')}</div></div>
      <div class="bered-liste">${B.rum.map((r, i) => knap(r, i, 'bered-li')).join('')}</div>
      <div class="bered-instruks" id="bered-instruks" hidden tabindex="-1" role="region" aria-live="polite"><b class="kicker" id="bered-titel" style="margin:0"></b><p id="bered-tekst"></p><button type="button" class="knap sek" id="bered-luk">${esc(B.luk)}</button></div></div>`;
    const ins = $('#bered-instruks', el);
    const luk = () => { ins.hidden = true; $$('[aria-controls="bered-instruks"]', el).forEach(b => b.setAttribute('aria-expanded', 'false')); sidst?.focus(); };
    $$('[data-i]', el).forEach(b => b.addEventListener('click', () => { const r = B.rum[+b.dataset.i]; sidst = b; $$('[aria-controls="bered-instruks"]', el).forEach(k => k.setAttribute('aria-expanded', String(k.dataset.i === b.dataset.i))); $('#bered-titel', el).textContent = `${B.instruks} · ${B.rumNr} ${+b.dataset.i + 1}: ${r[0]}`; $('#bered-tekst', el).textContent = r[1]; ins.hidden = false; ins.focus({ preventScroll: true }); }));
    $('#bered-luk', el).addEventListener('click', luk);
    ins.addEventListener('keydown', e => { if (e.key === 'Escape') luk(); });
  }

  /* F13 – Kontoret for upræcise målinger */
  function mountMål(el) {
    const M = T.maal;
    el.innerHTML = `<div class="maal"><figure class="maal-fig">${img(NY + 'maalekontor.webp', M.alt, 1200, 675)}</figure><ul class="maal-regler">${M.regler.map(r => `<li>${esc(r)}</li>`).join('')}</ul>
      <div class="maal-grid">${M.omr.map(o => `<form class="maal-form" data-type="${o[0]}"><b class="kicker" style="margin:0">${esc(o[1])}</b><div class="maal-rk"><label>${esc(M.vaerdi)} <input type="number" step="any" inputmode="decimal" name="v" required></label><label>${esc(M.enhed)} <select name="e">${o[3].map(u => `<option value="${u[0]}">${esc(u[1])}</option>`).join('')}</select></label><button type="submit" class="knap sek">${esc(M.beregn)}</button></div><p class="maal-svar" aria-live="polite"></p></form>`).join('')}</div><p class="note">${esc(M.under)}</p></div>`;
    $$('.maal-form', el).forEach(f => f.addEventListener('submit', e => {
      e.preventDefault(); const v = parseFloat(f.v.value.replace(',', '.')), en = f.e.value, ud = $('.maal-svar', f); if (!isFinite(v)) { ud.textContent = M.ugyldig; return; }
      let s;
      if (f.dataset.type === 'tid') { const år = en === 'aar' ? v : en === 'mdr' ? v / 12 : v / 365.25; const m = år / tvAar(); s = v < 0 ? M.svarTid.neg : v === 0 ? M.svarTid.nul : m < .5 ? M.svarTid.lille : m < 1.5 ? M.svarTid.et : M.svarTid.flere.replace('{n}', nf(Math.round(m))); }
      else if (f.dataset.type === 'afstand') { const m = en === 'm' ? v : en === 'km' ? v * 1000 : v * .75; s = v < 0 ? M.svarAfstand.neg : v === 0 ? M.svarAfstand.nul : m < 10 ? M.svarAfstand.lille : m < 10000 ? M.svarAfstand.mellem : M.svarAfstand.stor; }
      else { const ord = en === 'ord' ? v : en === 'kb' ? v * 170 : v * 170e6; s = v < 0 ? M.svarData.neg : v === 0 ? M.svarData.nul : ord <= 1 ? M.svarData.et : ord <= 6 ? M.svarData.faa : M.svarData.mange; }
      ud.textContent = s;
    }));
  }

  /* F10 – Søg i tågen */
  function mountSøg(el) {
    const Q = T.soeg;
    const norm = s => s.toLowerCase().normalize('NFC').replace(/\s+/g, ' ').trim();
    const slug = s => norm(s).replace(/[^a-z0-9æøå]+/g, '-').replace(/^-|-$/g, '').slice(0, 40);
    let indeks = null;
    function byg() {
      indeks = [];
      $$('main section, main .band').forEach((sec, i) => {
        const h = $('h2, h3, .band-titel', sec); if (!h) return;
        if (!sec.id) sec.id = 's-' + (slug(h.textContent) || i);
        const kicker = $('.kicker', sec)?.textContent || '';
        const tekst = $$('p, li, dd, dt, summary, figcaption, td, q, .r5-fold-titel', sec).map(x => x.textContent).join(' ');
        indeks.push({ id: sec.id, titel: h.textContent.trim(), kicker: kicker.trim(), h: norm(h.textContent + ' ' + $$('h3, .r5-fold-titel', sec).map(x => x.textContent).join(' ')), t: norm(tekst) });
        $$('.r5-fold', sec).forEach(f => { const ft = $('.r5-fold-titel', f); if (!ft) return; indeks.push({ id: f.id, titel: ft.textContent.trim(), kicker: h.textContent.trim(), h: norm(ft.textContent), t: norm(f.textContent) }); });
      });
    }
    el.innerHTML = `<form class="soeg" id="soeg-form" role="search"><label for="soeg-ind">${esc(Q.label)}</label><div class="soeg-rk"><input type="search" id="soeg-ind" maxlength="60" placeholder="${esc(Q.placeholder)}" autocomplete="off"><button type="submit" class="knap">${esc(Q.knap)}</button><button type="button" class="knap sek" id="soeg-ryd">${esc(Q.ryd)}</button></div><p class="soeg-kommentar" id="soeg-kommentar" aria-live="polite"></p><ol class="soeg-res" id="soeg-res"></ol></form>`;
    const ind = $('#soeg-ind', el), res = $('#soeg-res', el), kom = $('#soeg-kommentar', el);
    function søg() {
      const q = norm(ind.value); res.innerHTML = ''; if (!q) { kom.textContent = ''; return; } if (!indeks) byg();
      // Relevans: hele ord i titel vægter mest, hele ord i tekst dernæst, delord (»ko« i »kontorer«) mindst
      const ordRe = new RegExp('(^|[^a-z0-9æøå])' + q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '(?=$|[^a-z0-9æøå])', 'g');
      const score = x => { const hh = (x.h.match(ordRe) || []).length, th = (x.t.match(ordRe) || []).length; return hh * 40 + Math.min(th, 10) * 6 + (x.h.includes(q) ? 4 : 0) + (x.t.includes(q) ? 1 : 0); };
      const hits = indeks.filter(x => x.h.includes(q) || x.t.includes(q)).map(x => ({ x, s: score(x) })).sort((a, b) => b.s - a.s).map(o => o.x);
      const sær = Q.saer[q]; kom.textContent = hits.length ? `${sær || Q.alm} · ${Q.antal.replace('{n}', hits.length)}` : Q.ingen;
      res.innerHTML = hits.slice(0, 12).map(x => { const i = x.t.indexOf(q), ud = i < 0 ? '' : '…' + x.t.slice(Math.max(0, i - 40), i + 60).replace(/^\S*\s/, '') + '…'; return `<li><a href="#${esc(x.id)}">${esc(x.titel)}</a><small>${esc(x.kicker)}</small>${ud ? `<span>${esc(ud)}</span>` : ''}</li>`; }).join('');
    }
    $('#soeg-form', el).addEventListener('submit', e => { e.preventDefault(); søg(); });
    $('#soeg-ryd', el).addEventListener('click', () => { ind.value = ''; søg(); ind.focus(); });
    res.addEventListener('click', e => { const a = e.target.closest('a'); if (!a) return; const m = $(a.getAttribute('href')); if (m) { const f = m.closest('.fold'); if (f) f.classList.add('aaben'); if (m.tagName === 'DETAILS') m.open = true; const p = m.closest('.r5-gruppe'); if (p && p.hidden) visFane(p.id.replace('r5-g-', '')); } });
  }

  /* ═══════════════ FAKTASPOR ═══════════════ */

  /* H01+H02 – Send en pind / Høvl beskeden væk */
  function mountPind() {
    const el = $('#r5-runepind'), ri = $('#rune-ind'), ru = $('#rune-ud'); if (!el || !ri || !ru) return;
    const P = T.pind; let sendt = 0;
    el.innerHTML = `<div class="pind"><b class="kicker" style="margin:0">${esc(P.titel)}</b><p class="note">${esc(P.under)}</p><div class="pind-scene" id="pind-scene"><div class="pind-pinde" id="pind-pinde"></div><img class="pind-kniv" id="pind-kniv" src="${NY}snittekniv.webp" alt="${esc(P.knivAlt)}" width="768" height="768" loading="lazy"></div>
      <p class="pind-moderne" id="pind-moderne"><b>${esc(P.modern)}:</b> <span id="pind-moderne-t"></span></p>
      <div class="rune-knapper"><button type="button" class="knap" id="pind-send">${esc(P.send)}</button><button type="button" class="knap sek" id="pind-hoevl">${esc(P.hoevl)}</button></div><p class="pind-status" id="pind-status" aria-live="polite"></p>
      ${$('#runer-fakta') ? '' : vidfakta(P.fakta1 + ' ' + P.fakta2, P.kilde, P.url)}</div>`;
    const faktaRk = $('#runer-fakta'); if (faktaRk) { faktaRk.querySelector('.pind-fakta')?.remove(); faktaRk.insertAdjacentHTML('afterbegin', vidfakta(P.fakta1 + ' ' + P.fakta2, P.kilde, P.url).replace('class="vidfakta"', 'class="vidfakta pind-fakta"')); } // de to faktabokse side om side; mountPind kan køre igen (nulstil/sprog), så den gamle fjernes først
    const pinde = $('#pind-pinde', el), kniv = $('#pind-kniv', el), status = $('#pind-status', el), mod = $('#pind-moderne-t', el);
    function tegn() {
      const runer = ru.textContent === '…' ? '' : ru.textContent; mod.textContent = ri.value; const PR = 22, dele = []; for (let i = 0; i < Math.max(1, runer.length); i += PR) dele.push(runer.slice(i, i + PR));
      pinde.innerHTML = dele.map(d => `<div class="pind-en"><img src="${NY}runepind.webp" alt="${esc(P.pindAlt)}" width="1440" height="960" loading="lazy"><span class="pind-runer" aria-hidden="true" style="font-size:${d.length > 16 ? 'clamp(.8rem,2.6vw,1.5rem)' : 'clamp(1rem,3.4vw,2rem)'}">${esc(d)}</span></div>`).join('');
    }
    ri.addEventListener('input', () => { tegn(); status.textContent = ''; pinde.classList.remove('smal'); }); tegn();
    $('#pind-send', el).addEventListener('click', () => { if (!ri.value.trim()) { status.textContent = P.tom; return; } pinde.classList.remove('sendes'); void pinde.offsetWidth; if (!reduce()) pinde.classList.add('sendes'); status.textContent = P.sendt; sendt++; });
    pinde.addEventListener('animationend', () => pinde.classList.remove('sendes'));
    $('#pind-hoevl', el).addEventListener('click', () => { if (!ri.value.trim()) { status.textContent = P.tom; return; } const gør = () => { ri.value = ''; ri.dispatchEvent(new Event('input')); pinde.classList.add('smal'); status.textContent = P.hoevlet; }; if (reduce()) { gør(); return; } kniv.classList.remove('hoevler'); void kniv.offsetWidth; kniv.classList.add('hoevler'); setTimeout(gør, 650); });
    kniv.addEventListener('animationend', () => kniv.classList.remove('hoevler'));
  }

  /* H03 – Gråtand */
  function mountGråtand() {
    const el = $('#r5-graatand'); if (!el) return; const G = T.graatand; let on = false;
    el.innerHTML = `<div class="graatand"><div class="graatand-rune" aria-label="${esc(G.runerForkl)}" role="img"><span>ᚼ</span><span>ᛒ</span></div><div><b class="kicker" style="margin:0">${esc(G.titel)}</b><p class="note">${esc(G.under)}</p><button type="button" class="knap sek" id="graatand-par" aria-pressed="false">${esc(G.par)}</button><p class="graatand-status" id="graatand-status" aria-live="polite">${esc(G.status1)}</p></div>${vidfakta(G.fakta, G.kilde, G.url)}</div>`;
    $('#graatand-par', el).addEventListener('click', e => { on = !on; e.currentTarget.setAttribute('aria-pressed', String(on)); $('#graatand-status', el).textContent = on ? G.status2 : G.status1; });
  }

  /* F01 – Koens egen forklaring (i beviskortet) */
  function mountKotolk() {
    const el = $('#r5-kotolk'); if (!el) return; const K = T.kotolk; let timer = 0;
    el.innerHTML = `<button type="button" class="knap sek" id="kotolk-knap" aria-expanded="false" aria-controls="kotolk-dialog">${esc(K.knap)}</button>
      <div class="kotolk" id="kotolk-dialog" hidden tabindex="-1"><div class="kotolk-hoved"><b class="kicker" style="margin:0">${esc(K.titel)}</b><button type="button" class="knap sek" id="kotolk-luk">${esc(K.luk)}</button></div>
      <div class="kotolk-scene">${img(PAK + 'web/ko.webp', '', 1200, 675, 'kotolk-ko')}<svg class="kotolk-kurve" viewBox="0 0 200 40" aria-hidden="true"><path d="M0 20 Q10 20 20 20 T40 20 T60 20 T80 20 T100 20 T120 20 T140 20 T160 20 T180 20 T200 20"/></svg><div class="kotolk-under" aria-live="polite"><b id="kotolk-hvem">${esc(K.under)}</b><span id="kotolk-tekst">${esc(K.intro)}</span></div></div>
      <div class="kotolk-ui"><div class="forkl-knapper" role="group" aria-label="${esc(K.tolk)}">${K.tolke.map((t, i) => `<button type="button" data-i="${i}" aria-pressed="false">${portræt(t[0], true)}${esc(t[0])}</button>`).join('')}</div><button type="button" class="knap" id="kotolk-afhoer">${esc(K.afhoer)}</button></div><p class="note">${esc(K.note)}</p></div>`;
    const d = $('#kotolk-dialog', el), åbn = $('#kotolk-knap', el), kurve = $('.kotolk-kurve', el), hvem = $('#kotolk-hvem', el), tekst = $('#kotolk-tekst', el), af = $('#kotolk-afhoer', el); let valgt = null;
    const vis = o => { d.hidden = !o; åbn.setAttribute('aria-expanded', String(o)); if (o) d.focus({ preventScroll: true }); else åbn.focus(); };
    åbn.addEventListener('click', () => vis(d.hidden)); $('#kotolk-luk', el).addEventListener('click', () => vis(false)); d.addEventListener('keydown', e => { if (e.key === 'Escape') vis(false); });
    $$('.forkl-knapper button', el).forEach(b => b.addEventListener('click', () => { valgt = +b.dataset.i; $$('.forkl-knapper button', el).forEach(k => k.setAttribute('aria-pressed', String(k === b))); hvem.textContent = `${K.tolk}: ${K.tolke[valgt][0]}`; tekst.textContent = K.muh; }));
    af.addEventListener('click', () => { if (valgt === null) { valgt = 0; $$('.forkl-knapper button', el)[0].setAttribute('aria-pressed', 'true'); } clearTimeout(timer); af.disabled = true; af.textContent = K.afhoerer; kurve.classList.toggle('taler', !reduce()); hvem.textContent = `${K.tolk}: ${K.tolke[valgt][0]}`; tekst.textContent = K.muh; timer = setTimeout(() => { kurve.classList.remove('taler'); tekst.textContent = `${K.muh} – ${K.tolke[valgt][1]}`; af.disabled = false; af.textContent = K.afhoer; }, reduce() ? 0 : 1600); });
    onCleanup(() => clearTimeout(timer));
  }

  /* ═══════════════ SEKTIONEN: faner, grupper, nulstil ═══════════════ */
  const sek = $('#undersoeg');
  function visFane(id) { $$('.r5-fane', sek).forEach(b => { const on = b.dataset.g === id; b.setAttribute('aria-selected', String(on)); b.tabIndex = on ? 0 : -1; }); $$('.r5-gruppe', sek).forEach(g => g.hidden = g.id !== 'r5-g-' + id); }
  function byg() {
    cleanup.forEach(f => { try { f(); } catch (e) { } }); cleanup = [];
    const valgt = $('.r5-fane[aria-selected="true"]', sek)?.dataset.g || 'undersoeg';
    $('#r5-faner', sek).innerHTML = T.faner.map(f => `<button type="button" role="tab" class="r5-fane" id="r5-fane-${f[0]}" data-g="${f[0]}" aria-selected="false" aria-controls="r5-g-${f[0]}" tabindex="-1"><b>${esc(f[1])}</b><span>${esc(f[2])}</span></button>`).join('');
    const G = $('#r5-grupper', sek);
    G.innerHTML = `<div class="r5-gruppe" id="r5-g-undersoeg" role="tabpanel" aria-labelledby="r5-fane-undersoeg" hidden>${panel('akt', T.akt.titel, T.akt.under, '', true)}${panel('skjold', T.skjold.titel, T.skjold.under, '')}${panel('grav', T.grav.titel, T.grav.under, '')}${panel('side2', T.side2.titel, T.side2.under, '')}</div>
      <div class="r5-gruppe" id="r5-g-livet" role="tabpanel" aria-labelledby="r5-fane-livet" hidden>${panel('tavle', T.tavle.titel, T.tavle.under, '', true)}${panel('koe', T.koe.titel, T.koe.under, '')}${panel('kamera', T.kamera.titel, T.kamera.under, '')}${panel('museum', T.museum.titel, T.museum.under, '')}${panel('saeson', T.saeson.titel, T.saeson.under, '')}</div>
      <div class="r5-gruppe" id="r5-g-kontorer" role="tabpanel" aria-labelledby="r5-fane-kontorer" hidden>${panel('stol', T.stol.titel, T.stol.under, '', true)}${panel('panel', T.panel.titel, T.panel.under, '')}${panel('beredskab', T.beredskab.titel, T.beredskab.under, '')}${panel('maal', T.maal.titel, T.maal.under, '')}${panel('soeg', T.soeg.titel, T.soeg.under, '')}</div>`;
    const m = { akt: mountAkt, skjold: mountSkjold, grav: mountGrav, side2: mountSide2, tavle: mountTavle, koe: mountKø, kamera: mountKamera, museum: mountMuseum, saeson: mountSæson, stol: mountStol, panel: mountPanel, beredskab: mountBeredskab, maal: mountMål, soeg: mountSøg };
    for (const id in m) { const el = $(`#r5-${id} .r5-fold-ind`, sek); if (el) m[id](el); }
    $$('.r5-fane', sek).forEach(b => { b.addEventListener('click', () => visFane(b.dataset.g)); b.addEventListener('keydown', e => { const alle = $$('.r5-fane', sek), i = alle.indexOf(b); if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { e.preventDefault(); const n = alle[(i + (e.key === 'ArrowRight' ? 1 : alle.length - 1)) % alle.length]; visFane(n.dataset.g); n.focus(); } }); });
    visFane(valgt);
    mountKotolk(); mountPind(); mountGråtand(); opdaterStatus();
  }
  // side 2 gentegnes ved nye fund
  lyt.push(() => { const el = $('#r5-side2 .r5-fold-ind', sek); if (el) mountSide2(el); });

  if (sek) {
    byg(); anvendSæson();
    const n = $('#r5-nulstil'); if (n) n.addEventListener('click', () => { S = defaults(); S.lastSeenLocalDate = idag.iso; save(); byg(); anvendSæson(); emit(); const st = $('#r5-nulstil-status'); if (st) st.textContent = T.nulstil.ok; });
    // ankerlink ind i en fane: åbn den rigtige gruppe
    if (location.hash) { const m = $(location.hash.replace(/[^#\w-]/g, '')); const p = m && m.closest('.r5-gruppe'); if (p) { visFane(p.id.replace('r5-g-', '')); if (m.tagName === 'DETAILS') m.open = true; } }
  } else { anvendSæson(); }
})();
