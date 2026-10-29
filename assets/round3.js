/* tingsvad.dk — runde 3: parallax, døgnlys, tidsmaskine, scroll-sten, nettet lever, lyd, cursor-tåge,
   favicon, titel, afgør-knap, konami, delbar sag, radio, horoskop, certifikat, runer, besøgstæller, service worker */
(function () {
  const lang = document.documentElement.lang === 'en' ? 'en' : 'da', da = lang === 'da';
  const $ = s => document.querySelector(s), $$ = s => document.querySelectorAll(s);
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const store = { get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }, set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} } };
  const base = (document.querySelector('link[rel="stylesheet"][href*="site.css"]').getAttribute('href').split('site.css')[0]);
  const nu = new Date(), dagNr = Math.floor(Date.UTC(nu.getFullYear(), nu.getMonth(), nu.getDate()) / 864e5);
  const seed = n => { const x = Math.sin(n * 9301 + 49297) * 233280; return x - Math.floor(x); };
  const pick = (arr, n) => arr[Math.floor(seed(n) * arr.length)];
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  /* ── 2. Døgnlys ── */
  function doegn() {
    const h = new Date().getHours();
    document.body.classList.remove('d-gry', 'd-dag', 'd-aften', 'd-nat');
    document.body.classList.add(h >= 5 && h < 9 ? 'd-gry' : h >= 9 && h < 17 ? 'd-dag' : h >= 17 && h < 22 ? 'd-aften' : 'd-nat');
  }
  doegn(); setInterval(doegn, 60000);

  /* ── 1. Parallax i hero (baggrunden er hero-bg med figurerne fjernet; lagene står præcist oven på ved hvile) ── */
  const hero = $('#hero'), fg = $('.lag-fg'), brian = $('.lag-brian'), lagTaage = $('.lag-taage');
  if (lagTaage && window.tingsvadTekstur) lagTaage.style.backgroundImage = `url(${window.tingsvadTekstur(256, 13)})`;
  if (hero && fg && !reduce && matchMedia('(hover: hover) and (pointer: fine)').matches) { // parallax kun med mus; på touch står figurerne stille
    let tx = 0, ty = 0, cx = 0, cy = 0, raf = null;
    const anvend = () => { cx += (tx - cx) * .08; cy += (ty - cy) * .08; fg.style.transform = `translate3d(${(cx * 8).toFixed(2)}px, ${(cy * 5).toFixed(2)}px, 0)`; brian.style.transform = `translate3d(${(cx * 14).toFixed(2)}px, ${(cy * 8).toFixed(2)}px, 0)`; if (Math.abs(tx - cx) > .001 || Math.abs(ty - cy) > .001) raf = requestAnimationFrame(anvend); else raf = null; };
    const saet = (x, y) => { tx = x; ty = y; if (!raf) raf = requestAnimationFrame(anvend); };
    hero.addEventListener('mousemove', e => { const r = hero.getBoundingClientRect(); saet((e.clientX - r.left) / r.width - .5, (e.clientY - r.top) / r.height - .5); });
    hero.addEventListener('mouseleave', () => saet(0, 0));
  }

  /* ── 4. Tidsmaskine i hero ── */
  const heroTid = $('#hero-tid'), heroAar = $('#hero-aar'), heroPost = $('#hero-post'), lagTing = $('.lag-ting');
  if (heroTid && lagTing) {
    const aarAf = t => { t = t.toLowerCase(); if (t.includes('erne') || t.includes('1990s')) return 1995; const m = t.match(/\d{3,4}/); return m ? +m[0] : null; };
    const posterAf = rod => [...rod.querySelectorAll('.protokol tbody tr')].map(tr => { const td = tr.querySelectorAll('td'); const yr = aarAf(td[0].textContent); return yr ? { yr, label: td[0].textContent.trim(), tekst: td[1].textContent.trim() } : null; }).filter(Boolean);
    let poster = posterAf(document);
    // Protokollen bor i arkivet siden runde 9; forsidens tidsmaskine henter posterne derfra (samme origin, ét kald, først ved brug)
    let hentet = !!poster.length;
    const hentPoster = () => { if (hentet) return; hentet = true;
      fetch(da ? '/arkivet/' : '/en/archive/', { credentials: 'same-origin', headers: { 'x-tingsvad-hent': 'protokol' } }).then(r => r.ok ? r.text() : '').then(h => { if (!h) return; poster = posterAf(new DOMParser().parseFromString(h, 'text/html')); visAar(+heroTid.value); }).catch(() => { }); };
    // Objekter der dukker op i maleriet (x,y i 1672×941)
    const ting = [
      { yr: 965, x: 1180, y: 300, svg: '<path d="M-12 20 L0 -24 L12 20 Z"/><text x="0" y="12" text-anchor="middle" style="font-size:14px">ᛏ</text>', t: da ? 'Jellingstenen' : 'Jelling Stone' },
      { yr: 1572, x: 520, y: 700, svg: '<path d="M-30 0 Q -15 -10 0 0 T 30 0" stroke-dasharray="4 4"/>', t: da ? 'Åen tørrer ud' : 'River dries up' },
      { yr: 1837, x: 1000, y: 560, svg: '<circle r="13"/><circle r="4"/><path d="M0 -17v8M0 9v8M-17 0h8M9 0h8"/>', t: 'Babbage' },
      { yr: 1945, x: 1300, y: 560, svg: '<rect x="-14" y="-18" width="28" height="36" rx="2"/><circle cx="-5" cy="-7" r="2.5" class="fyld"/><circle cx="5" cy="-7" r="2.5" class="fyld"/><path d="M-8 6h16M-8 11h16"/>', t: 'ENIAC' },
      { yr: 1969, x: 1500, y: 620, svg: '<path d="M-14 24 L-14 -12 Q-14 -24 0 -26 Q14 -24 14 -12 L14 24 Z"/><rect x="-8" y="-10" width="16" height="11" class="fyld"/>', t: da ? 'Nettet' : 'The network' },
      { yr: 1991, x: 1100, y: 190, svg: '<text text-anchor="middle" y="7" style="font-size:22px;font-weight:600;letter-spacing:2px">www</text>', t: 'World Wide Web' },
      { yr: 1997, x: 870, y: 640, svg: '<path d="M-9 16h18v-5h-3v-8l3-5-3-4h-12l-3 4 3 5v8h-3z"/>', t: 'Deep Blue' },
      { yr: 2007, x: 1360, y: 400, svg: '<rect x="-9" y="-18" width="18" height="36" rx="4"/><circle cy="13" r="2" class="fyld"/>', t: 'iPhone' },
      { yr: 2012, x: 255, y: 780, ramme: true, svg: '<rect class="ramme" x="-200" y="-110" width="400" height="190"/><text x="130" y="-120" text-anchor="middle">KAT 62 %</text>', t: 'KAT 62 %' },
      { yr: 2026, x: 700, y: 540, svg: '<path d="M-24 10h48l5 10h-58z"/><rect x="-20" y="-18" width="40" height="28" rx="3"/>', t: da ? 'Stenlaptop' : 'Stone laptop' },
    ];
    lagTing.innerHTML = ting.map((o, i) => `<g transform="translate(${o.x} ${o.y})"><g class="ting${o.ramme ? ' ramme-g' : ''}" data-yr="${o.yr}">${o.svg}</g></g>`).join('');
    const grupper = lagTing.querySelectorAll('.ting');
    function visAar(yr) {
      heroAar.textContent = yr;
      grupper.forEach(g => g.classList.toggle('vis', +g.dataset.yr <= yr));
      let best = null, bd = 13; poster.forEach(p => { const d = Math.abs(p.yr - yr); if (d < bd) { bd = d; best = p; } });
      heroPost.innerHTML = best ? `<b>${esc(best.label)}</b>${esc(best.tekst)}` : `<b>${yr}</b>${da ? 'Tågen var der.' : 'The fog was there.'}`;
      heroTid.setAttribute('aria-valuetext', best ? `${da ? 'År' : 'Year'} ${yr}. ${best.label}: ${best.tekst.slice(0, 120)}` : `${da ? 'År' : 'Year'} ${yr}. ${da ? 'Tågen var der.' : 'The fog was there.'}`);
      // døgnlys-tilpasning: før 1969 ingen skærme → intet natteskær
    }
    let tidsTimer = null;
    const rejse = () => { hero.classList.add('tidsrejse'); clearTimeout(tidsTimer); tidsTimer = setTimeout(() => hero.classList.remove('tidsrejse'), 3000); };
    heroTid.addEventListener('input', () => { visAar(+heroTid.value); rejse(); });
    ['pointerdown', 'focus'].forEach(ev => heroTid.addEventListener(ev, () => { rejse(); hentPoster(); }));
    visAar(2026);
  }

  /* ── 7. Scroll-sten ── */
  const sten = $$('.sten-bar i');
  if (sten.length) {
    let sidste = -1;
    const opdater = () => {
      const h = document.documentElement, p = h.scrollTop / (h.scrollHeight - h.clientHeight || 1);
      document.body.classList.toggle('scrollet', h.scrollTop > 200);
      const n = Math.min(7, Math.floor(p * 7.999));
      sten.forEach((s, i) => { s.classList.toggle('lyst', i < n); });
      if (n !== sidste) { sidste = n; }
    };
    addEventListener('scroll', opdater, { passive: true }); opdater();
  }

  /* ── 3. Nettet lever ── */
  const netSvg = $('#net-svg');
  if (netSvg) {
    // skærme i 1672×941-koordinater (fra maleriet)
    const S = [[370, 382, 48, 60], [758, 384, 60, 90], [1098, 470, 42, 56], [272, 720, 70, 26], [1024, 815, 80, 22], [1448, 690, 60, 26]];
    const c = S[1];
    netSvg.innerHTML = S.map((s, i) => `<rect class="skaerm" data-i="${i}" x="${s[0] - s[2] / 2}" y="${s[1] - s[3] / 2}" width="${s[2]}" height="${s[3]}" rx="3" style="animation-delay:${i * .5}s"/>`).join('') +
      S.map((s, i) => i === 1 ? '' : `<path class="tov" id="tov${i}" d="M${c[0]} ${c[1] + 50} Q ${(c[0] + s[0]) / 2} ${Math.max(c[1], s[1]) + 60} ${s[0]} ${s[1]}"/>`).join('') +
      `<circle class="puls" id="puls" r="7"/><text class="runetekst" id="runetekst" text-anchor="middle">ᚢᛏᛋᛅᛏ</text>`;
    const puls = $('#puls'), rt = $('#runetekst');
    function send(i) {
      if (reduce || i === 1) return;
      const path = $('#tov' + i); if (!path) return; const L = path.getTotalLength(); const t0 = performance.now(), dur = 1400 + seed(i + dagNr) * 1200;
      puls.style.opacity = 1;
      (function f(t) { const k = Math.min(1, (t - t0) / dur); const p = path.getPointAtLength(k * L); puls.setAttribute('cx', p.x); puls.setAttribute('cy', p.y); if (k < 1) requestAnimationFrame(f); else { puls.style.opacity = 0; const s = S[i]; rt.setAttribute('x', s[0]); rt.setAttribute('y', s[1] - s[3] / 2 - 10); rt.style.opacity = 1; netSvg.querySelector(`.skaerm[data-i="${i}"]`).classList.add('aktiv'); setTimeout(() => { rt.style.opacity = 0; netSvg.querySelector(`.skaerm[data-i="${i}"]`).classList.remove('aktiv'); }, 1800); } })(t0);
    }
    netSvg.querySelectorAll('.skaerm').forEach(r => r.addEventListener('click', () => { const i = +r.dataset.i; if (i === 1) [0, 2, 3, 4, 5].forEach((j, k) => setTimeout(() => send(j), k * 500)); else send(i); }));
    if (!reduce) { let tur = 0; const io = new IntersectionObserver(es => { if (es[0].isIntersecting) { const t = setInterval(() => { if (!document.body.contains(netSvg)) return clearInterval(t); send([0, 2, 3, 4, 5][tur++ % 5]); }, 4200); send(0); io.disconnect(); } }, { threshold: .4 }); io.observe(netSvg); }
  }

  /* ── 5. Lyd fra vadestedet ── */
  const lydKnap = $('#lyd');
  if (lydKnap) {
    let ctx = null, master = null, noder = [];
    function start() {
      ctx = new (window.AudioContext || window.webkitAudioContext)(); master = ctx.createGain(); master.gain.value = 0; master.connect(ctx.destination);
      // Å: brun støj → lavpas med langsom modulation
      const buf = ctx.createBuffer(1, ctx.sampleRate * 4, ctx.sampleRate), d = buf.getChannelData(0); let last = 0; for (let i = 0; i < d.length; i++) { const w = Math.random() * 2 - 1; d[i] = (last + .02 * w) / 1.02; last = d[i]; d[i] *= 3.5; }
      const aa = ctx.createBufferSource(); aa.buffer = buf; aa.loop = true; const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 900; const lfo = ctx.createOscillator(); lfo.frequency.value = .11; const lg = ctx.createGain(); lg.gain.value = 300; lfo.connect(lg); lg.connect(lp.frequency); const ag = ctx.createGain(); ag.gain.value = .5; aa.connect(lp); lp.connect(ag); ag.connect(master); aa.start(); lfo.start();
      // Vind: hvid støj → båndpas der vandrer
      const wb = ctx.createBuffer(1, ctx.sampleRate * 3, ctx.sampleRate), wd = wb.getChannelData(0); for (let i = 0; i < wd.length; i++) wd[i] = Math.random() * 2 - 1;
      const ws = ctx.createBufferSource(); ws.buffer = wb; ws.loop = true; const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 400; bp.Q.value = .6; const wl = ctx.createOscillator(); wl.frequency.value = .05; const wg2 = ctx.createGain(); wg2.gain.value = 250; wl.connect(wg2); wg2.connect(bp.frequency); const wg = ctx.createGain(); wg.gain.value = .12; ws.connect(bp); bp.connect(wg); wg.connect(master); ws.start(); wl.start();
      noder = [aa, lfo, ws, wl];
      master.gain.linearRampToValueAtTime(document.body.classList.contains('i-taage') ? .35 : .7, ctx.currentTime + 2);
      // Gudrun og Mímir
      const kvak = () => { if (!ctx) return; const o = ctx.createOscillator(), g = ctx.createGain(); o.type = 'sawtooth'; o.frequency.setValueAtTime(420, ctx.currentTime); o.frequency.exponentialRampToValueAtTime(260, ctx.currentTime + .18); const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 1400; g.gain.setValueAtTime(0, ctx.currentTime); g.gain.linearRampToValueAtTime(.12, ctx.currentTime + .03); g.gain.exponentialRampToValueAtTime(.001, ctx.currentTime + .25); o.connect(f); f.connect(g); g.connect(master); o.start(); o.stop(ctx.currentTime + .3); };
      const suk = () => { if (!ctx) return; const s = ctx.createBufferSource(); s.buffer = wb; const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.setValueAtTime(700, ctx.currentTime); f.frequency.exponentialRampToValueAtTime(250, ctx.currentTime + 1.6); f.Q.value = 1.2; const g = ctx.createGain(); g.gain.setValueAtTime(0, ctx.currentTime); g.gain.linearRampToValueAtTime(.18, ctx.currentTime + .5); g.gain.linearRampToValueAtTime(0, ctx.currentTime + 1.8); s.connect(f); f.connect(g); g.connect(master); s.start(); s.stop(ctx.currentTime + 2); };
      const tilf = () => { if (!ctx) return; (Math.random() < .5 ? kvak : suk)(); setTimeout(tilf, 9000 + Math.random() * 16000); }; setTimeout(tilf, 5000);
      window.tingsvadKvak = kvak;
    }
    function stop() { if (!ctx) return; master.gain.linearRampToValueAtTime(0, ctx.currentTime + 1); const c = ctx; setTimeout(() => { try { c.close(); } catch (e) {} }, 1300); ctx = null; window.tingsvadKvak = null; }
    lydKnap.addEventListener('click', () => { const on = lydKnap.getAttribute('aria-pressed') !== 'true'; lydKnap.setAttribute('aria-pressed', String(on)); if (on) start(); else stop(); });
    // tågen dæmper lyden
    new MutationObserver(() => { if (ctx) master.gain.linearRampToValueAtTime(document.body.classList.contains('i-taage') ? .3 : .7, ctx.currentTime + 1.5); }).observe(document.body, { attributes: true, attributeFilter: ['class'] });
    const gk = $('#gudrun-knap'); if (gk) gk.addEventListener('click', () => { if (window.tingsvadKvak) window.tingsvadKvak(); });
  }

  /* ── 6. Cursor-tåge ── */
  if (!reduce && matchMedia('(hover: hover)').matches) {
    const cv = document.createElement('canvas'); cv.className = 'cursor-taage'; document.body.appendChild(cv); const g = cv.getContext('2d');
    let P = [], W, H; const size = () => { W = cv.width = innerWidth; H = cv.height = innerHeight; }; size(); addEventListener('resize', size);
    let sidst = 0; addEventListener('mousemove', e => { const t = performance.now(); if (t - sidst < 28) return; sidst = t; for (let i = 0; i < 2; i++) P.push({ x: e.clientX + (Math.random() - .5) * 20, y: e.clientY + (Math.random() - .5) * 20, r: 14 + Math.random() * 22, a: .16, vx: (Math.random() - .5) * .4, vy: -.2 - Math.random() * .3 }); if (P.length > 160) P.splice(0, P.length - 160); }, { passive: true });
    (function tegn() { g.clearRect(0, 0, W, H); P = P.filter(p => p.a > .004); for (const p of P) { p.x += p.vx; p.y += p.vy; p.r += .5; p.a *= .965; const gr = g.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r); gr.addColorStop(0, `rgba(214,217,212,${p.a})`); gr.addColorStop(1, 'rgba(214,217,212,0)'); g.fillStyle = gr; g.beginPath(); g.arc(p.x, p.y, p.r, 0, 7); g.fill(); } requestAnimationFrame(tegn); })();
  }

  /* ── 8+9. Favicon og titel når fanen er inaktiv ── */
  const favLinks = [...$$('link[rel="icon"]')], favOrig = favLinks.map(l => l.href), titelOrig = document.title;
  const erMímir = favOrig.some(h => h.includes('fav-brian'));
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { document.title = (da ? 'Udsat · ' : 'Adjourned · ') + titelOrig; if (erMímir) favLinks.forEach(l => l.href = l.href.replace('fav-brian-', 'fav-brian-sover-')); }
    else { document.title = titelOrig; favLinks.forEach((l, i) => l.href = favOrig[i]); }
  });

  /* ── 10. Afgør sagen ── */
  const ak = $('#afgoer-knap'), ast = $('#afgoer-status'), at = $('#afgoer-taelt');
  if (ak) {
    const visTal = n => { at.innerHTML = (da ? 'Sagen er forsøgt afgjort <b>{n}</b> gange.' : 'The case has been decided <b>{n}</b> times.').replace('{n}', n.toLocaleString(da ? 'da-DK' : 'en-GB')); };
    let lokal = +(store.get('afgoer') || 0);
    fetch('/api/afgoer').then(r => r.ok ? r.json() : Promise.reject()).then(j => visTal(j.n)).catch(() => visTal(lokal + 1284));
    const trin = da ? ['Indkalder tinget…', 'Venter på tågen…', 'Spørger koen…', 'Koen svarer ikke…', 'Spørger Mímir…'] : ['Convening the thing…', 'Waiting for the fog…', 'Asking the cow…', 'The cow does not reply…', 'Asking Mímir…'];
    ak.addEventListener('click', async () => {
      ak.disabled = true; ast.classList.remove('stemplet'); const st0 = document.getElementById('udsat-stempel'); if (st0) st0.hidden = true; let i = 0; ast.innerHTML = `<span class="behandler"><span class="spin"></span>${trin[0]}</span>`;
      const t = setInterval(() => { i++; if (i < trin.length) ast.querySelector('.behandler').lastChild.textContent = trin[i]; }, 650);
      await new Promise(r => setTimeout(r, 3300)); clearInterval(t);
      ast.textContent = da ? 'Udsat.' : 'Adjourned.'; const st = document.getElementById('udsat-stempel'); if (st) { ast.classList.add('stemplet'); st.hidden = false; st.classList.remove('slaa'); void st.offsetWidth; st.classList.add('slaa'); } ak.disabled = false; lokal++; store.set('afgoer', lokal);
      try { const r = await fetch('/api/afgoer', { method: 'POST' }); if (r.ok) { const j = await r.json(); visTal(j.n); } else visTal(lokal + 1284); } catch (e) { visTal(lokal + 1284); }
    });
  }

  /* ── 11. Konami: Ragnhild overtager ── */
  const KONAMI = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a']; let kpos = 0;
  document.addEventListener('keydown', e => {
    if (e.target.matches('input, textarea')) return;
    const k = e.key.length === 1 ? e.key.toLowerCase() : e.key; kpos = (k === KONAMI[kpos]) ? kpos + 1 : (k === KONAMI[0] ? 1 : 0);
    if (kpos === KONAMI.length) { kpos = 0; ragnhild(); }
  });
  document.addEventListener('tingsvad:ragnhild', ragnhild);
  function ragnhild() {
    if (document.body.classList.contains('ragnhild')) return;
    let img = $('.lag-ragnhild'); if (!img) { img = document.createElement('img'); img.className = 'lag-ragnhild'; img.src = base + 'r/skjoldmoeen-1200.webp'; img.alt = ''; $('.hero-lag').appendChild(img); }
    const h1 = $('.hero h1'), t = h1.textContent, tag = $('.hero .tag'), tagHtml = tag.innerHTML, tl = $('#taeller-udsat'), tlHtml = tl && tl.innerHTML;
    document.body.classList.add('ragnhild'); h1.textContent = da ? 'Afgjort.' : 'Decided.'; tag.innerHTML = `<span>${da ? 'Sagen om koen: <b>afgjort på 30 sekunder</b>' : 'The case of the cow: <b>decided in 30 seconds</b>'}</span><span>${da ? 'Ordstyrer: <b>Ragnhild Tingsvad</b>' : 'Chair: <b>Ragnhild Tingsvad</b>'}</span>`; if (tl) tl.innerHTML = da ? 'Sagen om koen har været udsat i <b>0</b> sekunder.' : 'The case of the cow has been adjourned for <b>0</b> seconds.';
    scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
    setTimeout(() => { document.body.classList.add('i-taage'); }, 8000);
    setTimeout(() => { document.body.classList.remove('ragnhild'); h1.textContent = t; tag.innerHTML = tagHtml; if (tl) tl.innerHTML = tlHtml; const hp = $('#hero-post'); if (hp) hp.innerHTML = `<b>${da ? 'Efterspil' : 'Aftermath'}</b>${da ? 'Tinget er tilbage og har nedsat et udvalg, der skal undersøge, hvordan det kunne ske. Udvalgets første møde er udsat.' : 'The thing is back and has appointed a committee to investigate how this could happen. The committee\'s first meeting is adjourned.'}`; setTimeout(() => document.body.classList.remove('i-taage'), 2500); }, 10000);
  }

  /* ── 12. Delbar sag ── */
  const sagerEl = $('#sager');
  if (sagerEl) {
    const mo = new MutationObserver(() => {
      sagerEl.querySelectorAll('li:not(.sager-tom):not([data-del])').forEach(li => {
        const nr = li.querySelector('.nr'); if (!nr) return; const id = nr.firstChild.textContent.trim(); li.id = 'sag-' + id; li.dataset.del = '1';
        const b = document.createElement('button'); b.type = 'button'; b.className = 'del'; b.textContent = da ? 'Del sagen' : 'Share case';
        b.addEventListener('click', async () => { const url = location.origin + location.pathname + '#sag-' + id; try { await navigator.clipboard.writeText(url); b.textContent = da ? 'Link kopieret' : 'Link copied'; } catch (e) { prompt(da ? 'Kopiér linket:' : 'Copy the link:', url); } setTimeout(() => b.textContent = da ? 'Del sagen' : 'Share case', 2000); });
        li.querySelector('div').appendChild(b);
      });
      if (location.hash.startsWith('#sag-')) { const m = $(CSS.escape ? '#' + CSS.escape(location.hash.slice(1)) : location.hash); if (m && !m.classList.contains('markeret')) { m.classList.add('markeret'); m.scrollIntoView({ block: 'center', behavior: reduce ? 'auto' : 'smooth' }); } }
    });
    mo.observe(sagerEl, { childList: true });
  }

  /* ── 13. Radio ── */
  const rt = $('#radio-tekst');
  if (rt) {
    const B = da ? {
      aabn: ['God morgen fra vadestedet.', 'Dette er Tingsvad Radio.', 'Vi sender direkte fra den fjerde sten.', 'Godaften. Eller godmorgen. Tågen gør det svært at sige.'],
      vejr: ['Tågen er tæt.', 'Tågen er meget tæt.', 'Der er tåge.', 'Sigtbarheden er nul, hvilket er normalt.', 'Det regner ikke. Det er bare tågen, der er våd.'],
      ting: ['Tinget er ikke sat.', 'Tinget er stadig ikke sat.', 'Vi gentager: tinget er ikke sat.', 'Tinget overvejer at blive sat. Overvejelsen er udsat.'],
      ko: ['Koen er set ved den fjerde sten.', 'Koen har ikke udtalt sig.', 'Koen er muligvis en kat. Vi følger sagen.', 'Koen er ikke synlig for andre enheder.', 'Gudrun sidder stadig på koen.'],
      folk: ['Toke står op.', 'Halvdan er mødt op til eventuelt.', 'Asgeir har skjoldet med. Det er ikke relevant.', 'Ragnhild står på bredden. Ingen kigger.', 'Bjørn har ikke sagt noget. Det er ' + tvAar('da') + ' år i dag.', 'Mímir har ført til protokols.'],
      slut: ['Vi følger sagen.', 'Mere, når tågen letter.', 'Det var alt fra vadestedet. Sagen er udsat.', 'Næste udsendelse: når tågen tillader det.', 'God vind, nedstrøms.']
    } : {
      aabn: ['Good morning from the ford.', 'This is Tingsvad Radio.', 'Broadcasting live from the fourth stone.', 'Good evening. Or good morning. The fog makes it hard to tell.'],
      vejr: ['The fog is dense.', 'The fog is very dense.', 'There is fog.', 'Visibility is zero, which is normal.', 'It is not raining. The fog is just wet.'],
      ting: ['The thing is not in session.', 'The thing is still not in session.', 'We repeat: the thing is not in session.', 'The thing is considering convening. The consideration is adjourned.'],
      ko: ['The cow has been seen at the fourth stone.', 'The cow has not commented.', 'The cow is possibly a cat. We are following the case.', 'The cow is not visible to other devices.', 'Gudrun is still sitting on the cow.'],
      folk: ['Toke is standing.', 'Halvdan has turned up for any other business.', 'Asgeir has brought the shield. It is not relevant.', 'Ragnhild is on the bank. Nobody is looking.', 'Bjørn has said nothing. That is ' + tvAar('en') + ' years today.', 'Mímir has entered it into the minutes.'],
      slut: ['We are following the case.', 'More when the fog lifts.', 'That was all from the ford. The case is adjourned.', 'Next broadcast: fog permitting.', 'Fair winds, downstream.']
    };
    const manus = [pick(B.aabn, dagNr), pick(B.vejr, dagNr + 1), pick(B.ting, dagNr + 2), pick(B.ko, dagNr + 3), pick(B.folk, dagNr + 4), pick(B.folk, dagNr + 11), pick(B.slut, dagNr + 5)].join(' ');
    let i = 0, kørt = false;
    const skriv = () => { if (i <= manus.length) { rt.textContent = manus.slice(0, i); i += 1; setTimeout(skriv, manus[i - 1] === '.' ? 420 : 24 + Math.random() * 30); } else rt.classList.add('faerdig'); };
    if (reduce) { rt.textContent = manus; rt.classList.add('faerdig'); }
    else { const io = new IntersectionObserver((es) => { if (es[0].isIntersecting && !kørt) { kørt = true; io.disconnect(); skriv(); } }, { threshold: .1 }); io.observe(rt); setTimeout(() => { if (!kørt) { kørt = true; io.disconnect(); rt.textContent = manus; rt.classList.add('faerdig'); } }, 6000); }
  }

  /* ── 14. Horoskop ── */
  const hs = $('#horoskop');
  if (hs) {
    const H = da ? [
      ['Toke den Yngre', ['I dag får du ikke sat dig.', 'Stolen står der stadig. Det gør du også.', 'En stol kommer ind i dit liv. Du lader den stå.', 'Dagen bringer hvile. Ikke til dig.']],
      ['Asgeir', ['Skjoldet er ikke relevant i dag heller.', 'Nogen spørger til økserne. Du svarer ikke.', 'Et skjold. Samme sten. Alt er, som det skal være.']],
      ['Høvdingen', ['Du siger "om tusind år". Du bliver taget på ordet.', 'Tasten virker. Du trykker på den.', 'Batteriet holder. Knapt.']],
      ['Ulf Sortkappe', ['Dit vidne siger "muh". Eller "miav". Det er uklart.', 'Koen er din. Ifølge dig.', 'Et vidne vender sig om og går til den fjerde sten.']],
      ['Gamle Ravn', ['Du husker en præcedens. Ingen andre gør.', 'Dagen minder om 1086. Ingen spurgte dengang heller.']],
      ['Halvdan', ['Punktet "eventuelt" nås ikke. Du er mødt op alligevel.', 'I dag stemmer du eventuelt. Igen.']],
      ['Bjørn Pelsværk', ['Du siger ikke noget. Det er klogt.', '…', 'Tavshed. Som i går. Som i morgen.']],
      ['Mímir', ['Udsat.', 'Du fører ét ord til protokols. Det er det samme ord.', 'Nogen spørger dig om noget. Du ved svaret.']],
      ['Gudrun', ['Kvak.', 'Du sidder på en ko. Det går fint.', 'Regnskabet balancerer: 0 = 0. Kvak.']],
      ['Ragnhild', ['Du har løsningen. Du har haft den siden år 1000.', 'Tredive sekunder. Du har tid nu.', 'Ingen kigger mod bredden. Du kigger mod tinget.']],
    ] : [
      ['Toke the Younger', ['Today you will not sit down.', 'The stool is still there. So are you.', 'A stool enters your life. You leave it standing.', 'The day brings rest. Not to you.']],
      ['Asgeir', ['The shield is not relevant today either.', 'Someone asks about the axes. You do not answer.', 'A shield. The same stone. All is as it should be.']],
      ['The chieftain', ['You say "in a thousand years". You are taken at your word.', 'The key works. You press it.', 'The battery lasts. Barely.']],
      ['Ulf Blackcloak', ['Your witness says "moo". Or "meow". It is unclear.', 'The cow is yours. According to you.', 'A witness turns and walks to the fourth stone.']],
      ['Old Ravn', ['You remember a precedent. Nobody else does.', 'The day resembles 1086. Nobody asked then either.']],
      ['Halvdan', ['"Any other business" is not reached. You turned up anyway.', 'Today you vote on any other business. Again.']],
      ['Bjørn Furcoat', ['You say nothing. That is wise.', '…', 'Silence. As yesterday. As tomorrow.']],
      ['Mímir', ['Adjourned.', 'You enter one word into the minutes. It is the same word.', 'Someone asks you something. You know the answer.']],
      ['Gudrun', ['Honk.', 'You sit on a cow. It goes fine.', 'The accounts balance: 0 = 0. Honk.']],
      ['Ragnhild', ['You have the solution. You have had it since the year 1000.', 'Thirty seconds. You have time now.', 'Nobody looks towards the bank. You look towards the thing.']],
    ];
    hs.innerHTML = H.map(([n, arr], i) => `<dt>${window.tingsvadPortraet ? window.tingsvadPortraet(n, true) : ''}${n}</dt><dd>${esc(pick(arr, dagNr + i * 7))}</dd>`).join('');
  }

  /* ── 16. Certifikat ── */
  const cf = $('#cert-form'), cv2 = $('#cert'), cud = $('#cert-ud');
  if (cf && cv2) cf.addEventListener('submit', async e => {
    e.preventDefault(); const navn = $('#cert-navn').value.trim().slice(0, 40) || (da ? 'Ukendt part' : 'Unknown party');
    try { await document.fonts.load('800 60px "Bricolage Grotesque"'); await document.fonts.load('400 24px Spectral'); await document.fonts.load('600 18px "JetBrains Mono"'); } catch (x) {}
    const g = cv2.getContext('2d'), W = cv2.width, Hh = cv2.height;
    const img = new Image(); img.src = base + 'cert-bg.jpg'; await new Promise(r => { img.onload = r; img.onerror = r; });
    g.drawImage(img, 0, 0, W, Hh); g.fillStyle = 'rgba(17,20,23,.72)'; g.fillRect(0, 0, W, Hh);
    g.strokeStyle = '#d9a441'; g.lineWidth = 3; g.strokeRect(36, 36, W - 72, Hh - 72); g.lineWidth = 1; g.strokeRect(48, 48, W - 96, Hh - 96);
    g.textAlign = 'center'; g.fillStyle = '#d9a441'; g.font = '600 18px "JetBrains Mono", monospace'; g.fillText((da ? 'TINGET VED VADESTEDET · TINGSVAD.DK' : 'THE THING AT THE FORD · TINGSVAD.DK'), W / 2, 110);
    g.fillStyle = '#e8e9e3'; g.font = '800 64px "Bricolage Grotesque", sans-serif'; g.fillText(da ? 'BEVIS FOR FREMMØDE' : 'CERTIFICATE OF ATTENDANCE', W / 2, 200);
    g.font = '400 26px Spectral, serif'; g.fillText(da ? 'Det bevidnes herved, at' : 'It is hereby witnessed that', W / 2, 262);
    g.fillStyle = '#d9a441'; g.font = '800 72px "Bricolage Grotesque", sans-serif'; g.fillText(navn, W / 2, 350);
    g.fillStyle = '#e8e9e3'; g.font = '400 26px Spectral, serif'; g.fillText(da ? 'har været til stede ved tinget, mens sagen om koen blev udsat.' : 'was present at the thing while the case of the cow was adjourned.', W / 2, 410);
    const nr = '980-' + String(1000 + Math.floor(seed(dagNr + navn.length) * 8999)); const dato = new Date().toLocaleDateString(da ? 'da-DK' : 'en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
    g.fillStyle = '#8d948f'; g.font = '600 16px "JetBrains Mono", monospace'; g.fillText((da ? 'SAGSNR. ' : 'CASE NO. ') + nr + '  ·  ' + dato.toUpperCase() + '  ·  ' + (da ? 'STATUS: UDSAT' : 'STATUS: ADJOURNED'), W / 2, 470);
    // stempel
    g.save(); g.translate(W - 230, Hh - 150); g.rotate(-.25); g.strokeStyle = 'rgba(140,74,47,.95)'; g.lineWidth = 5; g.strokeRect(-110, -44, 220, 88); g.fillStyle = 'rgba(140,74,47,.95)'; g.font = '800 44px "Bricolage Grotesque", sans-serif'; g.fillText(da ? 'UDSAT' : 'ADJOURNED', 0, 16); g.restore();
    // voks-segl (fra billedpakken) nederst til højre, under stemplet
    try { const sg = new Image(); sg.src = base + 'pak/grafik/segl.webp'; await new Promise(res => { sg.onload = res; sg.onerror = res; }); if (sg.naturalWidth) g.drawImage(sg, W - 150, Hh - 290, 120, 120); } catch (x) {}
    // underskrifter
    // underskrifter: gåsefod og ulvepote fra billedpakken
    try { const gf = new Image(); gf.src = base + 'pak/grafik/gaasefod.webp'; const up = new Image(); up.src = base + 'pak/grafik/ulvepote.webp'; await Promise.all([gf, up].map(i => new Promise(res => { i.onload = res; i.onerror = res; }))); if (gf.naturalWidth) g.drawImage(gf, 120, Hh - 190, 64, 64); if (up.naturalWidth) g.drawImage(up, 420, Hh - 190, 64, 64); } catch (x) {}
    g.textAlign = 'left'; g.fillStyle = '#e8e9e3'; g.font = 'italic 400 22px Spectral, serif'; g.fillText('Kvak.', 120, Hh - 120); g.fillStyle = '#8d948f'; g.font = '600 13px "JetBrains Mono", monospace'; g.fillText((da ? 'GUDRUN, REVISOR' : 'GUDRUN, AUDITOR'), 120, Hh - 96);
    g.fillStyle = '#e8e9e3'; g.font = '400 26px serif'; g.fillText('ᚢᛏᛋᛅᛏ', 420, Hh - 120); g.fillStyle = '#8d948f'; g.font = '600 13px "JetBrains Mono", monospace'; g.fillText((da ? 'BRIAN, PROTOKOLFØRER' : 'BRIAN, KEEPER OF THE MINUTES'), 420, Hh - 96);
    try { localStorage.setItem('tingsvad.cert.v1', JSON.stringify({ navn, nr, dato: new Date().toISOString().slice(0, 10) })); } catch (x) {} // til Sagsmappen
    cv2.hidden = false; cud.hidden = false; $('#cert-dl').href = cv2.toDataURL('image/png'); $('#cert-note').textContent = da ? 'Beviset er ikke gyldigt nogen steder. Det er det, der gør det ægte.' : 'The certificate is valid nowhere. That is what makes it real.';
    pqBevis(navn, nr, g, W, Hh);
  });

  /* Runde 12: kvantesikker underskrift. Workeren signerer beviset med ML-DSA-65 (FIPS 204) i Web Crypto; nøglen ligger
     hos tinget, den offentlige halvdel er åben. Uden forbindelse til tinget vises boksen ikke, og beviset er som før. */
  async function pqBevis(navn, nr, g, W, Hh) {
    const box = $('#cert-pq'); if (!box) return;
    const API = '/api/ting-ai/', post = (sti, body) => fetch(API + sti, { method: 'POST', credentials: 'same-origin', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) }).then(r => r.json());
    const L = da ? { titel: 'Kvantesikker underskrift', under: 'Tinget har underskrevet dit bevis med ML-DSA-65, den nye standard (FIPS 204), som også holder mod en kvantecomputer. Underskriften er {b} bytes.', tjek: 'Tjek ægtheden', fals: 'Prøv at forfalske navnet', hent: 'Download bevis.json', noegle: 'Tingets offentlige nøgle', ok: 'Ægte. Underskriften passer til beviset og tingets nøgle.', nej: 'Forfalsket. Navnet blev ændret til »{n}«, og underskriften passer ikke længere.', fejl: 'Tinget svarer ikke lige nu.', note: 'Sagen om koen er stadig udsat. Det kan matematikken ikke ændre.' }
      : { titel: 'Quantum-safe signature', under: 'The thing has signed your certificate with ML-DSA-65, the new standard (FIPS 204), which holds even against a quantum computer. The signature is {b} bytes.', tjek: 'Check that it is genuine', fals: 'Try forging the name', hent: 'Download bevis.json', noegle: 'The thing’s public key', ok: 'Genuine. The signature matches the certificate and the thing’s key.', nej: 'Forged. The name was changed to “{n}” and the signature no longer matches.', fejl: 'The thing is not answering right now.', note: 'The case of the cow is still adjourned. Mathematics cannot change that.' };
    let b; try { b = await post('bevis', { navn, nr, lang: da ? 'da' : 'en' }); } catch (e) { return; }
    if (!b || !b.ok || !b.data || !b.data.sig) { box.hidden = true; return; }
    const d = b.data, fil = { ...d, verificer: location.origin + API + 'bevis/tjek', noegle: location.origin + API + 'bevis/noegle' };
    // linjen nederst på billedet, så PNG'en også bærer nøgle-id'et
    g.textAlign = 'center'; g.fillStyle = '#8d948f'; g.font = '600 13px "JetBrains Mono", monospace'; g.fillText(d.alg + ' · KID ' + d.kid + ' · ' + d.bytes + ' BYTES', W / 2, Hh - 58);
    // kvanteseglet lægges over voksseglet: beviset er nu underskrevet
    try { const ks = new Image(); ks.src = '/assets/pak/cloudflare/segl-kvante-256.webp'; await new Promise(res => { ks.onload = res; ks.onerror = res; }); if (ks.naturalWidth) g.drawImage(ks, W - 162, Hh - 302, 140, 138); } catch (x) {}
    $('#cert-dl').href = cv2.toDataURL('image/png');
    const url = URL.createObjectURL(new Blob([JSON.stringify(fil, null, 2)], { type: 'application/json' }));
    box.innerHTML = `<figure class="cert-pq-fig"><img src='/assets/pak/cloudflare/kvante-runemaskine-800.webp' srcset='/assets/pak/cloudflare/kvante-runemaskine-800.webp 800w, /assets/pak/cloudflare/kvante-runemaskine-1600.webp 1600w' sizes="(max-width: 760px) 92vw, 34rem" width="1600" height="900" alt="${esc(da ? 'Maleri: gåsen Gudrun sætter segl på et pergament ved vikingernes kvantecomputer, en maskine af bronzeringe om en kugle af lysende rav.' : 'Painting: Gudrun the goose seals a parchment at the Vikings’ quantum computer, a machine of bronze rings around a sphere of glowing amber.')}" loading="lazy"></figure>
      <p class="cert-pq-h"><img class="cert-pq-segl" src='/assets/pak/cloudflare/segl-kvante-256.webp' width="48" height="47" alt=""><b>${esc(L.titel)}</b> <code>${esc(d.alg)} · kid ${esc(d.kid)}</code></p><p>${esc(L.under.replace('{b}', d.bytes.toLocaleString(da ? 'da-DK' : 'en-GB')))}</p>
      <pre class="cert-pq-sig" aria-label="${esc(L.titel)}"><code>${esc(d.sig.slice(0, 180))}…</code></pre>
      <div class="cert-pq-knapper"><button type="button" class="knap sek" id="cert-pq-tjek">${esc(L.tjek)}</button><button type="button" class="knap sek" id="cert-pq-fals">${esc(L.fals)}</button><a class="knap sek" href="${url}" download="bevis-${esc(d.payload.nr)}.json">${esc(L.hent)}</a></div>
      <p class="r6-status" id="cert-pq-st" aria-live="polite"></p><p class="note">${esc(L.note)} <a href="${API}bevis/noegle" rel="noopener">${esc(L.noegle)}</a> · <a href="https://github.com/wi24rd-com/tingsvad-website/blob/main/worker/src/features/bevis.js" rel="noopener">bevis.js</a></p>`;
    box.hidden = false;
    const st = $('#cert-pq-st');
    const tjek = async (payload, falsk) => {
      st.className = 'r6-status venter'; st.textContent = '…';
      try { const r = await post('bevis/tjek', { payload, sig: d.sig }); if (!r.ok) throw 0; st.className = 'r6-status ' + (r.data.gyldig ? 'ok' : 'fejl'); st.textContent = r.data.gyldig ? L.ok : L.nej.replace('{n}', falsk || ''); }
      catch (e) { st.className = 'r6-status fejl'; st.textContent = L.fejl; }
    };
    $('#cert-pq-tjek').addEventListener('click', () => tjek(d.payload));
    $('#cert-pq-fals').addEventListener('click', () => { const falsk = d.payload.navn === 'Gudrun' ? 'Brian' : 'Gudrun'; tjek({ ...d.payload, navn: falsk }, falsk); });
  }

  /* ── 17. Runer (yngre futhark) ── */
  const ri = $('#rune-ind'), ru = $('#rune-ud');
  if (ri && ru) {
    const R = { a: 'ᛅ', b: 'ᛒ', c: 'ᚴ', d: 'ᛏ', e: 'ᛁ', f: 'ᚠ', g: 'ᚴ', h: 'ᚼ', i: 'ᛁ', j: 'ᛁ', k: 'ᚴ', l: 'ᛚ', m: 'ᛘ', n: 'ᚾ', o: 'ᚢ', p: 'ᛒ', q: 'ᚴ', r: 'ᚱ', s: 'ᛋ', t: 'ᛏ', u: 'ᚢ', v: 'ᚢ', w: 'ᚢ', x: 'ᚴᛋ', y: 'ᚢ', z: 'ᛋ', 'æ': 'ᛅ', 'ø': 'ᚢ', 'å': 'ᚢ', 'ä': 'ᛅ', 'ö': 'ᚢ', 'ü': 'ᚢ', ' ': ' ', '.': '᛫', ',': '᛫', ':': '᛬', '-': '᛫' };
    const til = s => { s = s.toLowerCase().replace(/ng/g, 'ᚾᚴ').replace(/th/g, 'ᚦ').replace(/(.)\1/g, '$1'); let o = ''; for (const ch of s) o += R[ch] !== undefined ? R[ch] : (/[ᚠ-ᛪ]/.test(ch) ? ch : ''); return o; };
    const opd = () => { ru.textContent = til(ri.value) || '…'; const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${Math.max(200, ru.textContent.length * 36)} 80"><rect width="100%" height="100%" fill="#111417"/><text x="50%" y="56" text-anchor="middle" font-size="44" fill="#d9a441" letter-spacing="4">${esc(ru.textContent)}</text></svg>`; $('#rune-svg').href = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg); };
    ri.addEventListener('input', opd); opd();
    $('#rune-kopi').addEventListener('click', async () => { const b = $('#rune-kopi'); try { await navigator.clipboard.writeText(ru.textContent); b.textContent = da ? 'Kopieret' : 'Copied'; } catch (e) { const r = document.createRange(); r.selectNodeContents(ru); getSelection().removeAllRanges(); getSelection().addRange(r); } setTimeout(() => b.textContent = da ? 'Kopiér runer' : 'Copy runes', 1800); });
  }

  /* ── 21. Besøgende i dag ── */
  const bes = $('#besoeg');
  if (bes) fetch('/api/besoeg', { method: 'POST' }).then(r => r.ok ? r.json() : Promise.reject()).then(j => { bes.textContent = j.n.toLocaleString(da ? 'da-DK' : 'en-GB'); bes.classList.add('live'); }).catch(() => {});

  /* ── 20. Service worker ── */
  if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('/sw.js').catch(() => {});
})();
