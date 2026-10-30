/* tingsvad.dk — tingsvad.js: samlet af tools/bundt.mjs fra assets/kilde/ (tingstedet.js, historien.js, indslag-tekst.js, indslag.js, maskinpark-tekst.js, kaede.js, maskinpark.js, ankre.js). Ret kilderne, ikke denne fil. */
/* ═══ tingstedet.js (assets/kilde/tingstedet.js) ═══ */
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

  /* ── 5. Lyd fra vadestedet: flyttet til site.js (runde 12), så knappen virker på alle sider ── */

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
    const visTal = n => { at.innerHTML = (da ? 'Sagen er forsøgt afgjort <b>{n}</b> gange.' : 'Deciding the case has been attempted <b>{n}</b> times.').replace('{n}', n.toLocaleString(da ? 'da-DK' : 'en-GB')); };
    let lokal = +(store.get('afgoer') || 0);
    fetch('/api/afgoer').then(r => r.ok ? r.json() : Promise.reject()).then(j => visTal((j.data || j).n)).catch(() => visTal(lokal + 1284));
    const trin = da ? ['Indkalder tinget…', 'Venter på tågen…', 'Spørger koen…', 'Koen svarer ikke…', 'Spørger Mímir…'] : ['Convening the thing…', 'Waiting for the fog…', 'Asking the cow…', 'The cow does not reply…', 'Asking Mímir…'];
    ak.addEventListener('click', async () => {
      ak.disabled = true; ast.classList.remove('stemplet'); const st0 = document.getElementById('udsat-stempel'); if (st0) st0.hidden = true; let i = 0; ast.innerHTML = `<span class="behandler"><span class="spin"></span>${trin[0]}</span>`;
      const t = setInterval(() => { i++; if (i < trin.length) ast.querySelector('.behandler').lastChild.textContent = trin[i]; }, 650);
      await new Promise(r => setTimeout(r, 3300)); clearInterval(t);
      ast.textContent = da ? 'Udsat.' : 'Adjourned.'; const st = document.getElementById('udsat-stempel'); if (st) { ast.classList.add('stemplet'); st.hidden = false; st.classList.remove('slaa'); void st.offsetWidth; st.classList.add('slaa'); } ak.disabled = false; lokal++; store.set('afgoer', lokal);
      try { const r = await fetch('/api/afgoer', { method: 'POST' }); if (r.ok) { const j = await r.json(); visTal((j.data || j).n); } else visTal(lokal + 1284); } catch (e) { visTal(lokal + 1284); }
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
  if (bes) fetch('/api/besoeg', { method: 'POST' }).then(r => r.ok ? r.json() : Promise.reject()).then(j => { bes.textContent = (j.data || j).n.toLocaleString(da ? 'da-DK' : 'en-GB'); bes.classList.add('live'); }).catch(() => {});

  /* ── 20. Service worker ── */
  if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('/sw.js').catch(() => {});
})();
;
/* ═══ historien.js (assets/kilde/historien.js) ═══ */
/* tingsvad.dk — runde 4: sektionsnav, modstridende forklaringer, mødeindkaldelse, nettets driftsstatus, genbesøg */
(function () {
  const lang = document.documentElement.lang === 'en' ? 'en' : 'da', da = lang === 'da';
  const $ = s => document.querySelector(s), $$ = s => document.querySelectorAll(s);
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const store = { get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }, set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} } };
  const nu = new Date(), dagNr = Math.floor(Date.UTC(nu.getFullYear(), nu.getMonth(), nu.getDate()) / 864e5);
  const seed = n => { const x = Math.sin(n * 9301 + 49297) * 233280; return x - Math.floor(x); };
  const pick = (arr, n) => arr[Math.floor(seed(n) * arr.length)];
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const portræt = window.tingsvadPortraet;
  const base = (document.querySelector('link[rel="stylesheet"][href*="site.css"]').getAttribute('href').split('site.css')[0]);

  /* ── Sektionsnav: aktiv markering ── */
  const navLinks = [...$$('#sidenav a[href^="#"]')]; // sidelinks (/historien/ osv.) markeres af middleware med aria-current
  if (navLinks.length && 'IntersectionObserver' in window) {
    const mål = navLinks.map(a => $(a.getAttribute('href'))).filter(Boolean);
    const io = new IntersectionObserver(es => { es.forEach(e => { if (e.isIntersecting) navLinks.forEach(a => a.classList.toggle('aktiv', a.getAttribute('href') === '#' + e.target.id)); }); }, { rootMargin: '-40% 0px -55% 0px' });
    mål.forEach(m => io.observe(m));
  }

  /* ── Modstridende forklaringer ── */
  const fk = $('#forkl-knapper'), fs = $('#forkl-svar'), fh = $('#forkl-hvem'), ft = $('#forkl-tekst');
  if (fk) {
    const F = da ? [
      ['Asgeir', 'Jeg husker skjoldet. Det stod op ad stenen, som det skal. Resten husker jeg ikke, da det ikke var relevant.'],
      ['Toke', 'Jeg husker frokosten. Der var ingen frokost. Jeg troede, det var et marked. Jeg har stået her siden, så jeg må have husket forkert.'],
      ['Høvdingen', 'Jeg sagde "om tusind år". Jeg mente det som en talemåde. Jeg har siden lært, at tinget ikke har talemåder.'],
      ['Ulf Sortkappe', 'Koen var min. Den var min om morgenen, og den var min om aftenen. Det var det, der var hele sagen. Jeg forstår ikke, hvad der skulle drøftes.'],
      ['Gamle Ravn', 'Det var præcis som forrige gang. Der var også en ko. Det var også udsat. Jeg sagde det dengang, og ingen hørte efter, og det er præcedens.'],
      ['Halvdan', 'Jeg var der til eventuelt. Jeg kan ikke udtale mig om de foregående punkter, da jeg ikke har stemmeret til dem, og de ikke er nået.'],
      ['Bjørn Pelsværk', '…'],
      ['Mímir', 'Jeg kan ikke kommentere en verserende sag. Den har været verserende i ' + tvAar('da') + ' år. Jeg har ikke kunnet kommentere noget siden 1636. Udsat.'],
      ['Gudrun', 'Kvak. Jeg sad på koen. Jeg så det hele. Jeg har ført det til protokols i 400 år. Protokollen lå i åen. Kvak.'],
      ['Ragnhild', 'Jeg stod på bredden. Det gør jeg stadig. Jeg havde løsningen. Det har jeg stadig. Syv mænd kiggede på en ko i stedet for på mig. Det gør de stadig. Spørg dem, hvorfor.'],
    ] : [
      ['Asgeir', 'I remember the shield. It leaned against the stone, as it should. The rest I do not remember, as it was not relevant.'],
      ['Toke', 'I remember lunch. There was no lunch. I thought it was a market. I have been standing here since, so I must have remembered wrong.'],
      ['The chieftain', 'I said "in a thousand years". I meant it as a figure of speech. I have since learned that the thing has no figures of speech.'],
      ['Ulf Blackcloak', 'The cow was mine. It was mine in the morning and mine in the evening. That was the whole case. I do not understand what there was to discuss.'],
      ['Old Ravn', 'It was exactly like last time. There was a cow then too. It was adjourned then too. I said so at the time, nobody listened, and that is precedent.'],
      ['Halvdan', 'I was there for any other business. I cannot comment on the preceding items, as I have no vote on them, and they have not been reached.'],
      ['Bjørn Furcoat', '…'],
      ['Mímir', 'I cannot comment on a pending case. It has been pending for ' + tvAar('en') + ' years. I have not been able to comment on anything since 1636. Adjourned.'],
      ['Gudrun', 'Honk. I was sitting on the cow. I saw everything. I entered it into the minutes for 400 years. The minutes were in the river. Honk.'],
      ['Ragnhild', 'I stood on the bank. I still do. I had the solution. I still do. Seven men looked at a cow instead of at me. They still do. Ask them why.'],
    ];
    fk.innerHTML = F.map((f, i) => `<button type="button" data-i="${i}" aria-pressed="false">${portræt(f[0], true)}${f[0]}</button>`).join('');
    fk.addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; fk.querySelectorAll('button').forEach(x => x.setAttribute('aria-pressed', String(x === b))); const f = F[+b.dataset.i]; fs.querySelector('.forkl-portraet')?.remove(); const im = portræt(f[0], false); if (im) { fs.insertAdjacentHTML('afterbegin', im.replace('<img ', '<img class="forkl-portraet" ')); } fh.textContent = f[0] + (da ? ' forklarer:' : ' explains:'); ft.textContent = f[1]; });
  }

  /* ── Mødeindkaldelse ── */
  const mf = $('#moede-form'), ms = $('#moede-svar'), md = $('#moede-dato');
  if (mf && ms) {
    if (md && !md.value) md.value = new Date(Date.now() + 7 * 864e5).toISOString().slice(0, 10);
    mf.addEventListener('submit', e => {
      e.preventDefault(); const d = new Date(md.value + 'T12:00:00'); if (isNaN(d)) return;
      const aar = d.getFullYear(), m = d.getMonth() + 1, dag = d.getDate(), ugedag = d.getDay(), n = Math.floor(d / 864e5);
      const mortens = (m === 11 && (dag === 10 || dag === 11));
      const taage = n % 53 !== 0;
      const R = [];
      const kan = (navn, ok, hvorfor) => R.push({ navn, ok, hvorfor });
      kan(da ? 'Høvdingen' : 'The chieftain', aar < 1066, da ? (aar < 1066 ? 'Kan. Det er før 1066.' : 'Kan kun før 1066. Han har ikke opdateret kalenderen siden.') : (aar < 1066 ? 'Can. It is before 1066.' : 'Only available before 1066. Has not updated the calendar since.'));
      kan('Asgeir', ugedag !== 4, da ? (ugedag === 4 ? 'Torsdag. Skjoldet skal pudses. Det er ikke relevant.' : 'Kan. Medbringer skjoldet. Det er ikke relevant.') : (ugedag === 4 ? 'Thursday. The shield needs polishing. Not relevant.' : 'Can. Will bring the shield. Not relevant.'));
      kan('Toke', true, da ? 'Kan. Står der allerede. Har stået der siden 1010.' : 'Can. Is already there. Has been since 1010.');
      kan(da ? 'Ulf Sortkappe' : 'Ulf Blackcloak', seed(n + 1) > .4, da ? (seed(n + 1) > .4 ? 'Kan, hvis koen kan. Koen er ikke spurgt.' : 'Kan ikke. Koen er optaget. Af hvad, er ikke oplyst.') : (seed(n + 1) > .4 ? 'Can, if the cow can. The cow has not been asked.' : 'Cannot. The cow is busy. With what, is not stated.'));
      kan(da ? 'Gamle Ravn' : 'Old Ravn', true, da ? 'Kan. Husker, at han også kunne forrige gang. Ingen kom.' : 'Can. Remembers he could last time too. Nobody came.');
      kan('Halvdan', false, da ? 'Kommer kun til punktet "eventuelt". Punktet er ikke på dagsordenen, da det aldrig er nået.' : 'Only attends "any other business". The item is not on the agenda, as it has never been reached.');
      kan(da ? 'Bjørn Pelsværk' : 'Bjørn Furcoat', false, da ? 'Har endnu ikke svaret. Indkaldelsen fra 980 er heller ikke besvaret.' : 'Has not yet replied. The summons from 980 is also unanswered.');
      kan('Mímir', true, da ? 'Kan. Har allerede ført mødet til protokols: udsat.' : 'Can. Has already entered the meeting into the minutes: adjourned.');
      kan('Gudrun', !mortens, da ? (mortens ? 'Mortensaften. Gudrun deltager principielt ikke. Hun har sine grunde.' : 'Kan. Sidder på koen og tager referat.') : (mortens ? 'Martinmas. Gudrun does not attend on principle. She has her reasons.' : 'Can. Sits on the cow and takes notes.'));
      kan('Ragnhild', true, da ? 'Kan. Har kunnet siden år 1000. Medbringer to økser og løsningen.' : 'Can. Has been able since the year 1000. Brings two axes and the solution.');
      const vejr = taage ? (da ? 'Vejret: tåge. Tinget mødes ikke i tåge.' : 'Weather: fog. The thing does not meet in fog.') : (da ? 'Vejret: sommer. Tinget overvejer det. Overvejelsen er udsat.' : 'Weather: summer. The thing is considering it. The consideration is adjourned.');
      const dato = d.toLocaleDateString(da ? 'da-DK' : 'en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
      ms.innerHTML = `<li class="sager-tom">${da ? 'Indkaldelse til' : 'Summons for'} ${esc(dato)}</li>` + R.map(r => `<li class="${r.ok ? 'ok' : ''}"><span class="ik">${r.ok ? '✓' : '✕'}</span><b>${portræt(r.navn, true)}${esc(r.navn)}</b><span>${esc(r.hvorfor)}</span></li>`).join('') + `<li><span class="ik">${taage ? '✕' : '~'}</span><b>${da ? 'Tågen' : 'The fog'}</b><span>${esc(vejr)}</span></li><li class="konk">${da ? 'Mødet er udsat.' : 'The meeting is adjourned.'}</li>`;
    });
  }

  /* ── Nettets driftsstatus ── */
  const dl = $('#drift-liste'), ds = $('#drift-send'), dlog = $('#drift-log');
  if (dl) {
    const navne = da ? ['Serveren', 'Klient I', 'Klient II', 'Klient III', 'Klient IV', 'Backup (solhjul)'] : ['Server', 'Client I', 'Client II', 'Client III', 'Client IV', 'Backup (sun wheel)'];
    const status = da ? [['Fugtig', 'gul'], ['Afventer ravn', 'gul'], ['Mosgroet, i drift', 'ok'], ['Sender nedstrøms', 'ok'], ['Modtager ikke (ingen gør)', 'ok'], ['Tov løst, 1 sten', 'gul'], ['Tåge i porten', 'gul'], ['Skærm lyser. Ingen ved hvorfor', 'ok'], ['Ingen fejl fundet. Ingen har ledt', 'ok'], ['Kold, men svarer', 'ok']] : [['Damp', 'gul'], ['Awaiting raven', 'gul'], ['Mossy, operational', 'ok'], ['Sending downstream', 'ok'], ['Not receiving (nobody is)', 'ok'], ['Rope loose, 1 stone', 'gul'], ['Fog in the port', 'gul'], ['Screen lit. Nobody knows why', 'ok'], ['No faults found. Nobody looked', 'ok'], ['Cold, but responding', 'ok']];
    dl.innerHTML = navne.map((n, i) => { const s = i === 5 ? [da ? 'Backup ikke prøvet' : 'Backup never tested', 'roed'] : pick(status, dagNr + i * 3); return `<li class="${s[1]}${i === 0 ? ' server' : ''}"><i></i><img src="${base}pak/grafik/runesten.webp" alt="" width="512" height="512" loading="lazy"><b>${n}</b><span>${s[0]}</span></li>`; }).join('');
    if (ds) ds.addEventListener('click', () => {
      const trin = da ? ['Besked oprettet på serveren: "udsat"', 'Sendt gennem tov 2 (tjæret 1969)', 'Passerer Klient II. Klient II læser den ikke, den er ikke til den', 'Når åen. Følger strømmen nedstrøms', 'Passerer vadestedet. Toke vinker', 'Når sivene ved den fjerde sten', 'Hænger fast i sivene', 'Status: leveret (ifølge nettet). Modtaget: nej'] : ['Message created on the server: "adjourned"', 'Sent via rope 2 (tarred 1969)', 'Passes Client II. Client II does not read it, it is not for it', 'Reaches the river. Follows the current downstream', 'Passes the ford. Toke waves', 'Reaches the reeds at the fourth stone', 'Stuck in the reeds', 'Status: delivered (according to the network). Received: no'];
      dlog.hidden = false; dlog.innerHTML = ''; ds.disabled = true; let i = 0;
      const t = setInterval(() => { const li = document.createElement('li'); li.textContent = trin[i]; if (i >= trin.length - 2) li.className = 'sidst'; dlog.appendChild(li); i++; if (i >= trin.length) { clearInterval(t); ds.disabled = false; } }, reduce ? 0 : 650);
    });
  }

  /* ── Genbesøg ── */
  const bes = +(store.get('besoeg-n') || 0) + 1; store.set('besoeg-n', bes);
  const bar = $('.hero-bar');
  if (bar && bes > 1) {
    const T = da ? [
      'Mímir genkender dig. Du har været her {n} gange. Han har ført det til protokols.',
      'Velkommen tilbage. Toke har flyttet stolen 4 cm, siden du var her sidst. Han har stadig ikke sat sig.',
      'Du igen. Gudrun har noteret det. Hun noterer alt. Kvak.',
      'Tinget bemærker, at du er kommet tilbage {n} gange. Det er flere gange, end tinget har afgjort noget.',
      'Asgeir nikkede, da du kom. Det er første gang. Det er ikke relevant.',
    ] : [
      'Mímir recognises you. You have been here {n} times. He has entered it into the minutes.',
      'Welcome back. Toke has moved the stool 4 cm since your last visit. He still has not sat down.',
      'You again. Gudrun has noted it. She notes everything. Honk.',
      'The thing notes that you have returned {n} times. That is more times than the thing has decided anything.',
      'Asgeir nodded when you arrived. It is the first time. It is not relevant.',
    ];
    const el = document.createElement('div'); el.className = 'genbesoeg'; el.innerHTML = `<b>${da ? 'Besøg nr. ' + bes : 'Visit no. ' + bes}</b>${esc(pick(T, bes * 7 + dagNr).replace('{n}', bes))}`; bar.appendChild(el);
    const tk = $('.bevis dd.u'); // stolen flyttet: opdatér bilag C
  }

  /* ── Fold-knapper i arkivet ── */
  // Runde 12: knappen folder både ud og ind igen og bliver stående
  const foldTekst = (b, aaben) => { b.textContent = aaben ? (document.documentElement.lang === 'en' ? 'Show less' : 'Fold sammen') : (b.dataset.mere || b.textContent); };
  $$('.fold-knap').forEach(b => {
    const f = b.previousElementSibling; if (!f) return;
    if (f.id) b.setAttribute('aria-controls', f.id);
    b.addEventListener('click', () => {
      const aaben = !f.classList.contains('aaben');
      f.classList.toggle('aaben', aaben); b.setAttribute('aria-expanded', String(aaben)); foldTekst(b, aaben);
      if (!aaben) { const top = f.getBoundingClientRect().top; if (top < 0) f.scrollIntoView({ block: 'start', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' }); }
    });
  });
  // åbn automatisk hvis man lander på et anker inde i en fold, eller ved print
  if (location.hash) { const m = $(location.hash.replace(/[^#\w-]/g, '')); const f = m && m.closest('.fold'); if (f) { f.classList.add('aaben'); const b = f.nextElementSibling; if (b && b.classList.contains('fold-knap')) { b.setAttribute('aria-expanded', 'true'); foldTekst(b, true); } } }
  addEventListener('beforeprint', () => $$('.fold').forEach(f => f.classList.add('aaben')));

  /* ── Til toppen ── */
  const tt = $('.til-top');
  if (tt) { const opd = () => document.body.classList.toggle('scrollet-langt', scrollY > innerHeight * 2); addEventListener('scroll', opd, { passive: true }); opd(); tt.addEventListener('click', e => { e.preventDefault(); scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' }); }); }

  /* ── Dagens udsættelse: åben på desktop ── */
  const df = $('.dagens-fold'); if (df) { const sæt = () => { df.open = matchMedia('(min-width: 801px)').matches; }; sæt(); matchMedia('(min-width: 801px)').addEventListener('change', sæt); }

  /* ── Konami på telefon: tryk 7 gange på runerne ── */
  const runer = $('.hero .runes');
  if (runer) { let n = 0, t = null; runer.addEventListener('click', () => { n++; clearTimeout(t); t = setTimeout(() => n = 0, 2500); if (n >= 7) { n = 0; document.dispatchEvent(new CustomEvent('tingsvad:ragnhild')); } }); }
})();
;
/* ═══ indslag-tekst.js (assets/kilde/indslag-tekst.js) ═══ */
/* tingsvad.dk — runde 5: tekstdata (da/en) til de 15 indslag og faktasporet.
   Ren data. Ingen logik. indslag.js slår op i window.TV5[lang]. */
window.TV5 = {
  da: {
    faner: [
      ['undersoeg', 'Undersøg sagen', 'Aktindsigt, skjoldets bagside, udgravningen og den forsvundne side 2.'],
      ['livet', 'Livet ved vadestedet', 'Opslagstavlen, køen, tågekameraet, museet og årstiderne.'],
      ['kontorer', 'Tingets kontorer', 'Stolekonfigurator, ekspertpanel, beredskab, målinger og søgning.'],
    ],
    status: { side2: 'Side 2', af: 'af', fragmenter: 'fragmenter', samlet: 'Side 2 er samlet. Sagen er ikke.' },
    nulstil: { knap: 'Nulstil oplevelsen', note: 'Rydder kun dine fund, kønummer og sæsonvalg på denne enhed. Gæstebog, lyd og tema rører den ikke.', ok: 'Oplevelsen er nulstillet. Mímir har ført det til protokols: udsat.' },
    ikonTekst: 'Illustration af et fiktivt univers – ikke dokumentation.',

    /* F01 */
    kotolk: {
      knap: 'Afhør vidnet', titel: 'Afhøring af vidnet', luk: 'Luk afhøringen',
      intro: 'Vidnet siger det samme hver gang. Tolken er det, der varierer. Vælg en tolk.',
      tolk: 'Tolk', muh: 'Muh.', under: 'Undertekst',
      tolke: [
        ['Ulf', 'Hun siger tydeligt, at hun er min.'],
        ['Gudrun', 'Hun efterspørger bilag.'],
        ['Mímir', 'Vidnet ønsker frokost.'],
        ['Ragnhild', 'Hun vil over på den anden mark. Flyt jer.'],
      ],
      afhoer: 'Afhør', afhoerer: 'Afhører…', note: 'Afhøringen er lydløs. Vidnet har ikke godkendt optagelse. Ejerskabet ændres ikke af tolkningen.',
    },

    /* F02 */
    akt: {
      titel: 'Aktindsigt', under: 'Et dokument fra arkivet. Fire overstregninger. Tryk på dem.',
      hoved: 'TINGSVAD TING · AFGØRELSE · SIDE 1 AF 2',
      linjer: [
        'Tinget sat ved vadestedet omkring år 980 i tæt tåge.',
        'Sagen: ejendomsretten til én (1) ko, rødbroget, med gås.',
        'Fremmødt: syv stemmeberettigede, én ulv, én gås (siddende på koen).',
        'Vidneforklaring afgivet af koen: se ovenfor.',
        'Afgørelse: udsat. Begrundelse: ',
      ],
      skjult: [
        ['Ingen ved, hvorfor dette er overstreget.', 'Overstregning 1'],
        ['Frokost.', 'Overstregning 2'],
        ['Mímir har spist originalen. Dette er en rekonstruktion.', 'Overstregning 3'],
        ['Ejeren af koen er … se side 2.', 'Overstregning 4'],
      ],
      afsloer: 'Afslør', afsloeret: 'Afsløret:',
      saml: 'Saml fragment', samlet: 'Fragment samlet', fund: 'Et stykke af side 2 lå i folden. Du har samlet det.',
      fod: 'Overstregningerne er en leg; dokumenterne er opdigtede.',
    },

    /* F12 */
    skjold: {
      titel: 'Vend skjoldet', under: 'Asgeir har aldrig vist bagsiden. Den er, ifølge ham, endnu mindre relevant.',
      vend: 'Vend skjoldet', vendTilbage: 'Vend til forsiden', forside: 'Forsiden', bagside: 'Bagsiden',
      rem: 'Undersøg remmen', remHint: 'Der sidder en seddel under læderremmen.',
      seddel: 'Første udkast til afgørelse. Se side 2.', asgeir: 'Asgeir: Bagsiden er endnu mindre relevant end forsiden.',
      saml: 'Saml fragment', samlet: 'Fragment samlet',
      alt: 'Maleri: bagsiden af et rundt træskjold med læderrem. Under remmen stikker en gammel seddel frem. Nederst er en lille ko ridset ind i træet.',
    },

    /* F04 */
    grav: {
      titel: 'Arkæologisk udgravning', under: 'Et felt ved den fjerde sten. Børst jorden væk, eller undersøg felterne et ad gangen.',
      hint: 'Træk fingeren eller musen over feltet for at børste. Fundene er illustrationer af fiktive fund.',
      felt: 'Undersøg felt', felter: ['A', 'B', 'C'],
      fund: {
        kam: ['Kam', 'Har ordnet flere problemer end tinget.'],
        moent: ['Mønt', 'Indbetalt som gebyr. Beløbet kunne ikke læses.'],
        runepind: ['Runepind', 'Husk at spørge koen.'],
      },
      fundet: 'Fundet', fundliste: 'Fund', ingen: 'Ingen fund endnu. Jorden er stadig jord.',
      alle: 'Alle tre fund er registreret. Under det sidste lå et stykke af side 2.',
      saml: 'Saml fragment', samlet: 'Fragment samlet', nulstil: 'Grav igen',
      alt: 'Udgravningsfelt: mørk, fugtig jord set ovenfra.',
    },

    /* F03 */
    side2: {
      titel: 'Den forsvundne side 2', under: 'Afgørelsens anden side gik i tre stykker. Ingen ved hvornår. Mímir var til stede.',
      findesteder: { archive: ['Aktindsigten', 'Overstregning 4 i dokumentet.'], shield: ['Skjoldets bagside', 'Under læderremmen.'], excavation: ['Udgravningen', 'Under det tredje fund.'] },
      fundet: 'Fundet', mangler: 'Mangler',
      brik: ['Stykke A', 'Stykke B', 'Stykke C'],
      tekst: { archive: 'Ejeren af koen er', shield: 'endnu ikke identificeret.', excavation: 'Fortsæt på side 3.' },
      tom: '…',
      afsloer: 'Ejeren af koen er endnu ikke identificeret. Fortsæt på side 3.',
      brian: 'Mímir tilføjer: Godt arbejde. Sagen er nu blevet længere.',
      venter: 'Find alle tre stykker. Rækkefølgen er ligegyldig. Det er sagen også.',
      segl: 'Tingets segl. Tildelt for at have samlet noget.',
      alt: 'Et ældgammelt, revnet pergament i tre stykker med lakstempel i hjørnet.',
    },

    /* F11 */
    tavle: {
      titel: 'Opslagstavlen', under: 'Seks opslag om dagen. Skiftes ved midnat, dansk tid, af nogen.',
      flere: 'Vis flere opslag', faerre: 'Vis kun dagens', alt: 'Maleri: en gammel opslagstavle af træ ved åen med seks tomme sedler fastgjort med søm og snor.',
      opslag: [
        'Bortkommet: én gås. Fundet: én gås. Sammenhæng undersøges.',
        'Ønskes: sekundær protokolfører. Skal kunne skrive ét ord.',
        'Den, der har flyttet stolen fire centimeter, bedes flytte den tilbage.',
        'Fælles arbejdsdag ved den løse sten. Medbring en undskyldning.',
        'Frokostudvalget mangler en beslutning om frokost.',
        'Hittegods: en hånd, der blev rakt op i 1799. Ejeren bedes melde sig.',
        'Sælges: ét skjold. Ikke relevant. Henvendelse: ikke til Asgeir.',
        'Tågen holder åbent hus. Alle dage. Ingen tilmelding.',
        'Ko efterlyses ikke. Den står ved den fjerde sten. Som altid.',
        'Kursus: "Sådan udsætter du". Fuldt booket siden 980.',
        'Byttes: én afgørelse mod to forbehold. Kontakt Gamle Ravn.',
        'Mødet i morgen er udsat. Mødet om udsættelsen er også udsat.',
        'Tabt: tråden. Sidst set i 1241.',
        'Gudrun søger hjælp til et spørgsmålstegn. Henvendelse skriftligt.',
        'Halvdan tilbyder sin stemme til eventuelt. Uprøvet.',
        'Bjørn Pelsværk har noget at sige. Han venter på det rette øjeblik. Siden 980.',
        'Vedtægtsændring foreslået: § 2 ændres til § 2. Behandles under eventuelt.',
        'Nettet er nede. Det er også oppe. Mímir undersøger.',
      ],
    },

    /* F08 */
    koe: {
      titel: 'Køsedlen', under: 'Træk et nummer. Tinget betjener i den rækkefølge, sager er indkommet. Der er én sag foran dig.',
      traek: 'Træk et nummer', dit: 'Dit nummer', betjener: 'Vi betjener', foerste: 'K-0980-0001',
      vent: ['Forventet ventetid: efter frokost.', 'Forventet ventetid: to dynastier.', 'Forventet ventetid: koens levetid plus ekspedition.'],
      igen: 'Mímir: Du står her allerede.', tilbage: 'Mímir har lagt mærke til, at du stadig venter.',
      note: 'Nummeret er lokalt for din browser. Der er ikke noget globalt køtal. Der er heller ikke nogen kø.',
      alt: 'Maleri: en gammel nummerautomat af træ og messing med skifertavle og papirstrimmel, stående på en sten ved åen.',
      ingen: 'Intet nummer endnu.',
    },

    /* F09 */
    kamera: {
      titel: 'Tågekamera', under: 'Simuleret udsigt fra vadestedet. Ikke et webcam. Ikke et optagelsestidspunkt. Tåge.',
      maerke: 'SIMULERET UDSIGT', start: 'Start overvågning', pause: 'Pause', nu: 'Vis en observation nu', koerer: 'Overvåger…',
      obs: 'Observation: en gås glider gennem forgrunden. Senere afkræftet.', stille: 'Ingen observationer. Tågen er stabil.',
      arkiv: 'Arkiv', arkivT: [['14. april', 'En kontur. Senere afkræftet.'], ['3. juni', 'Mulig sommer. Varede ikke ved.'], ['8. september', 'Ko uden yderligere kommentarer.']],
      alt: 'Maleri: tæt tåge over åen ved vadestedet med en række sten i forgrunden og en bleg sol bag disen.',
      reduce: 'Bevægelse er slået fra på din enhed. Observationer vises som stillbillede.',
    },

    /* F14 */
    museum: {
      titel: 'Museet for det, der næsten skete', under: 'Tre montrer. Alle tomme. Den tredje er tildækket, hvilket er mere end de andre.',
      montrer: ['Hammeren, der næsten faldt', 'Dokumentet, der næsten blev underskrevet', 'Punktet eventuelt'],
      beskr: ['Hævet i 1572. Ikke sænket. Står stadig i luften, et sted.', 'Fjerpennen nåede papiret. Papiret nåede åen.', 'Tildækket. Punktet er ikke nået, og udstillingen heller ikke.'],
      loeft: 'Løft klædet', loeftet: 'Udstillingen åbner efter koen.', igen: 'Du har nu set eventuelt. Det er mere, end tinget har.', laeg: 'Læg klædet på igen',
      tom: 'Montren er tom.',
      alt: 'Maleri: en lys museumssal med tre tomme glasmontrer på egetræssokler og udsigt til åen gennem en åben port.',
      hjelm: {
        titel: 'Udlånt montre: Hjelmen', tekst: 'Kunstnerisk rekonstruktion af en vikingetidshjelm. Uden horn. Udlånt fra tingets fantasi; ikke et fund.',
        ting: 'Tingets kommentar: Koen har horn. Derfor blev den fejlregistreret som kriger.',
        fakta: 'Den næsten komplette hjelm fra Gjermundbu i Norge er den bedst bevarede fra vikingetiden – og den har ingen horn. Hornede hjelme på vikinger er en opfindelse fra 1800-tallets kunst og teater. Hjelmen her er en illustration, ikke et fotografi af et fund.',
        kilde: 'Nationalmuseet: Hjelme', url: 'https://natmus.dk/historisk-viden/danmark/oldtid-indtil-aar-1050/vikingetiden-800-1050/vaaben/hjelme/',
        alt: 'Illustration: en rustrød vikingetidshjelm med næseværn, uden horn.',
      },
    },

    /* F15 */
    saeson: {
      titel: 'Årstider ved vadestedet', under: 'Vadestedet følger kalenderen i København. Du kan prøve en anden årstid uden at flytte din computer.',
      vaelg: 'Årstid', auto: 'Automatisk', navne: { vinter: 'Vinter', foraar: 'Forår', sommer: 'Sommer', efteraar: 'Efterår' },
      besked: { vinter: 'Den fjerde sten er midlertidigt stabil.', foraar: 'Åen er steget. Bevismaterialet flyder.', sommer: 'Arbejdsforholdene er blevet synlige.', efteraar: 'Bladene falder. Sagen gør ikke.' },
      morten: 'Gudrun svarer automatisk: Træffes ikke. Oplyser ikke hvor.',
      nu: 'Lige nu ved vadestedet',
    },

    /* F05 */
    stol: {
      titel: 'Tokes stolekonfigurator', under: 'Toke har en stol bevilget. Den kan tilpasses. Hver tilpasning har en konsekvens.',
      valg: [
        ['ryg', 'Ryglæn', 'Ryglæn kræver vedtægtsændring.'],
        ['arm', 'Armlæn', 'Armlæn kan opfattes som magtovertagelse.'],
        ['hjul', 'Hjul', 'Hjul betragtes som udrejse.'],
        ['polster', 'Polstring', 'Polstring afventer fåret.'],
        ['bred', 'Levering til bredden', 'Levering sker til bredden. Aldrig til stenen.'],
      ],
      oversigt: 'Bestillingsoversigt', ingen: 'Ingen tilvalg. En skammel.', send: 'Fremsend til overvejelse', sendt: 'Fremsendt',
      resultat: 'En almindelig skammel.', forbehold: '19 forbehold.',
      fem: ['Forbehold 1: Skamlen må ikke belastes, før sagen om at sidde ned er afgjort.', 'Forbehold 2: Skamlen bliver på bredden.', 'Forbehold 3: Tilvalg er noteret, ikke bevilget.', 'Forbehold 4: Toke bekræfter, at han ikke sætter sig.', 'Forbehold 5: Leveringen er sket. Det er ikke det samme som modtaget.'],
      resten: 'Yderligere 14 forbehold foreligger mundtligt.',
      note: 'Tegningen er stemningsgrafik, ikke en byggeplan. Der bestilles ikke noget.',
      alt: 'Tegning på pergament: en trebenet skammel i midten, en stol med ryglæn til venstre og en skammel på hjul til højre.',
    },

    /* F06 */
    panel: {
      titel: 'Ekspertpanelet', under: 'Fem eksperter er indkaldt. Ingen af dem er mødt op, men deres ting står på bordet.',
      eksperter: [
        ['arkaeolog', 'Arkæolog', 'Lad koen ligge urørt, til laget er registreret.', 13, 66],
        ['it', 'IT-arkitekt', 'Vi migrerer ejerskabet efter en prøveperiode.', 35, 58],
        ['revisor', 'Revisor', 'Er koen et aktiv eller en løbende udgift?', 63, 46],
        ['filosof', 'Filosof', 'Kan nogen eje en, der selv går sin vej?', 65, 63],
        ['landmand', 'Landmand', 'Jeg har åbnet lågen.', 92, 26],
      ],
      vaelg: 'Vælg en ekspert.', laage: 'Lågen er åben. Koen bliver stående. Den har ikke fået besked.',
      note: 'Svarene er manuskript. Ingen rigtige eksperter er blevet spurgt, og ingen maskine har svaret.',
      alt: 'Maleri: et bord ved åen med en arkæologs pensel og potteskår, en bærbar af sten, en kugleramme, en opslået bog med fjerpen og en høtyv.',
    },

    /* F07 */
    beredskab: {
      titel: 'Beredskabsplan', under: 'Seks rum. Seks situationer, der aldrig er indtruffet. Planen er klar.',
      rum: [
        ['Tågen letter', 'Undgå øjenkontakt. Nogen kan foreslå en afgørelse.', 30, 46],
        ['Koen får en kalv', 'Opret undersag.', 50, 46],
        ['Ragnhild nærmer sig', 'Find en procedure.', 70, 46],
        ['Mímir siger ja', 'Kontrollér, at det er Mímir.', 30, 78],
        ['Stolen er varm', 'Afspær området.', 50, 78],
        ['Nettet sender andet end udsat', 'Frakobl tovet og tilkald Gudrun.', 70, 78],
      ],
      instruks: 'Instruks', luk: 'Luk', rumNr: 'Rum',
      alt: 'Maleri: et åbent træskab med seks rum, hvori ligger en rulle, et tov, strømper, en spand, et brev og en klokke.',
    },

    /* F13 */
    maal: {
      titel: 'Kontoret for upræcise målinger', under: 'Tinget måler i enheder, der ikke findes. Måleenhederne er opdigtede.',
      regler: ['Ét møde = ' + tvAar('da') + ' år, når koen er på dagsordenen.', 'Én tør sok = længden af en fod, som Mímir ikke har målt.', 'Én runesten = plads til ét ord, når ordet er udsat.'],
      omr: [
        ['tid', 'Varighed i møder', 'År', [['aar', 'år'], ['mdr', 'måneder'], ['dage', 'dage']]],
        ['afstand', 'Afstand i tørre sokker', 'Afstand', [['m', 'meter'], ['km', 'kilometer'], ['skridt', 'skridt']]],
        ['data', 'Datamængde i runesten', 'Mængde', [['ord', 'ord'], ['kb', 'KB'], ['gb', 'GB']]],
      ],
      beregn: 'Omregn', vaerdi: 'Værdi', enhed: 'Enhed',
      svarTid: { neg: 'Gamle Ravn husker det som i morgen.', nul: 'Mødet er ikke begyndt. Det er det aldrig.', lille: 'Mindre end en indledende bemærkning.', et: 'Ét møde.', flere: '{n} møder. Koen er på dagsordenen til dem alle.' },
      svarAfstand: { neg: 'Du er gået baglæns. Det har Toke også.', nul: 'Ingen afstand. Du står på stenen.', lille: 'Færre sokker, end Mímir har. Han har ingen.', mellem: 'Et pænt antal tørre sokker. Ingen af dem er Mímirs.', stor: 'Flere sokker, end tågen kan tørre. Afstanden er udsat.' },
      svarData: { neg: 'Negativ data. Nettet har modtaget den. Det modtager ellers aldrig noget.', nul: 'Ingen sten nødvendig. Ordet er allerede udsat.', et: 'Én runesten. Ordet er: udsat.', faa: 'Et par sten. Nettet har seks. Det rækker.', mange: 'Kræver flere sten. Antallet behandles efter koen.' },
      ugyldig: 'Indtast et tal. Tinget accepterer ikke tåge som værdi.',
      alt: 'Maleri: et bord ved åen med et timeglas, en balancevægt med en sok og en sten, en rebrulle, en træmålestok og en bog.',
    },

    /* F10 */
    soeg: {
      titel: 'Søg i tågen', under: 'Søg i sagsakternes overskrifter og tekster. Resultaterne er rigtige. Kommentaren er tingets.',
      label: 'Søgeord', placeholder: 'fx ko, stol, afgørelse …', knap: 'Søg', ryd: 'Ryd',
      ingen: 'Ingen fund i tågen. Prøv et andet ord, eller følg åen.', antal: '{n} steder på siden',
      saer: { 'afgørelse': 'Ingen endelige svar. Her er de relevante sagsakter.', 'ko': 'Ét vidne. Det flytter sig.', 'stol': 'Du har ikke rettigheder til at sidde på resultatet.', 'eventuelt': 'Hele tinget føler sig kaldet.' },
      alm: 'Fundet i tågen. Tinget har ikke læst det.',
      gaa: 'Gå til',
    },

    /* H01–H03 */
    pind: {
      titel: 'Send en pind', under: 'Runerne ovenfor kan også skæres i en pind og sendes nedstrøms. Beskeden vises her som runeleg oven på pinden.',
      send: 'Send nedstrøms', sendt: 'Pinden er sendt nedstrøms. Den ankommer om mellem tre dage og fire hundrede år.',
      hoevl: 'Høvl beskeden væk', hoevlet: 'Beskeden er slettet. Pinden er nu smallere.', tom: 'Pinden er tom. Skriv noget i feltet ovenfor.',
      pindAlt: 'Illustration: en runepind af lyst træ med en snor i den ene ende.', knivAlt: 'Illustration: en lille snittekniv med træskaft.',
      modern: 'Moderne tekst',
      fakta1: 'Runer blev ikke kun hugget i sten. I middelalderen skrev man også breve og beskeder på små træpinde – Historisk Museum i Oslo viser blandt andet en bestilling på spydspidser. Det er middelaldermateriale, ikke dokumentation for præcis samme praksis ved et dansk ting i 980.',
      fakta2: 'Samme samling rummer et frierbrev fra Lom stavkirke, hvor nogen senere har forsøgt at skære navnene væk med en kniv. Også det er middelalder. Kniven her sletter kun din egen leg.',
      kilde: 'Historisk Museum, Oslo: Runic letters', url: 'https://www.historiskmuseum.no/english/exhibitions/exhibitions-archive/kiss-me-the-world-of-runes/runic-letters-and-class-exercises/',
    },
    graatand: {
      titel: 'Gråtand', under: 'Tingets udgave af Blåtand. Farven skyldes tågen. Forbindelsen oprettes, når begge parter er enige. Det er ikke sket endnu.',
      par: 'Par enhederne', status1: 'Koen er ikke synlig for andre enheder.', status2: 'Enhederne afventer samtykke fra Halvdan.',
      runer: 'ᚼ + ᛒ', runerForkl: 'Haralds initialer i yngre futhark: hagall (H) og bjarkan (B).',
      fakta: 'Bluetooth-logoet er en bindrune af ᚼ (hagall, H) og ᛒ (bjarkan, B) – initialerne på Harald Blåtand, der samlede Danmark og Norge, som standarden samler enheder. Knappen her rører ikke din egen Bluetooth og beder ikke om tilladelser.',
      kilde: 'bluetooth.com: Bluetooth origin', url: 'https://www.bluetooth.com/about-us/bluetooth-origin/',
    },
    fakta: 'Det ved vi faktisk',
  },

  en: {
    faner: [
      ['undersoeg', 'Investigate the case', 'The file, the back of the shield, the dig and the missing page 2.'],
      ['livet', 'Life at the ford', 'The notice board, the queue, the fog camera, the museum and the seasons.'],
      ['kontorer', 'The thing\'s offices', 'Stool configurator, expert panel, contingency plan, measurements and search.'],
    ],
    status: { side2: 'Page 2', af: 'of', fragmenter: 'fragments', samlet: 'Page 2 is assembled. The case is not.' },
    nulstil: { knap: 'Reset the experience', note: 'Clears only your finds, queue number and season choice on this device. Guestbook, sound and theme are untouched.', ok: 'The experience has been reset. Mímir has entered it into the minutes: adjourned.' },
    ikonTekst: 'Illustration of a fictional universe – not documentation.',

    kotolk: {
      knap: 'Question the witness', titel: 'Examination of the witness', luk: 'Close the examination',
      intro: 'The witness says the same thing every time. The interpreter is what varies. Choose an interpreter.',
      tolk: 'Interpreter', muh: 'Moo.', under: 'Subtitle',
      tolke: [
        ['Ulf', 'She says clearly that she is mine.'],
        ['Gudrun', 'She is requesting supporting documents.'],
        ['Mímir', 'The witness would like lunch.'],
        ['Ragnhild', 'She wants to go to the other field. Move.'],
      ],
      afhoer: 'Question', afhoerer: 'Questioning…', note: 'The examination is silent. The witness has not consented to recording. Ownership is not changed by interpretation.',
    },

    akt: {
      titel: 'Freedom of information', under: 'A document from the archive. Four redactions. Press them.',
      hoved: 'TINGSVAD THING · DECISION · PAGE 1 OF 2',
      linjer: [
        'The thing convened at the ford around the year 980 in dense fog.',
        'The case: ownership of one (1) cow, red and white, with goose.',
        'Present: seven voting members, one wolf, one goose (sitting on the cow).',
        'Testimony given by the cow: see above.',
        'Decision: adjourned. Grounds: ',
      ],
      skjult: [
        ['Nobody knows why this was redacted.', 'Redaction 1'],
        ['Lunch.', 'Redaction 2'],
        ['Mímir has eaten the original. This is a reconstruction.', 'Redaction 3'],
        ['The owner of the cow is … see page 2.', 'Redaction 4'],
      ],
      afsloer: 'Reveal', afsloeret: 'Revealed:',
      saml: 'Collect fragment', samlet: 'Fragment collected', fund: 'A piece of page 2 was in the fold. You have collected it.',
      fod: 'The redactions are a game; the documents are invented.',
    },

    skjold: {
      titel: 'Turn the shield', under: 'Asgeir has never shown the back. It is, according to him, even less relevant.',
      vend: 'Turn the shield', vendTilbage: 'Turn to the front', forside: 'The front', bagside: 'The back',
      rem: 'Examine the strap', remHint: 'There is a note under the leather strap.',
      seddel: 'First draft of a decision. See page 2.', asgeir: 'Asgeir: The back is even less relevant than the front.',
      saml: 'Collect fragment', samlet: 'Fragment collected',
      alt: 'Painting: the back of a round wooden shield with a leather strap. An old note sticks out from under the strap. A small cow is scratched into the wood at the bottom.',
    },

    grav: {
      titel: 'Archaeological dig', under: 'A trench by the fourth stone. Brush the soil away, or examine the squares one at a time.',
      hint: 'Drag your finger or mouse across the trench to brush. The finds are illustrations of fictional objects.',
      felt: 'Examine square', felter: ['A', 'B', 'C'],
      fund: {
        kam: ['Comb', 'Has sorted out more problems than the thing.'],
        moent: ['Coin', 'Paid as a fee. The amount could not be read.'],
        runepind: ['Rune stick', 'Remember to ask the cow.'],
      },
      fundet: 'Found', fundliste: 'Finds', ingen: 'No finds yet. The soil is still soil.',
      alle: 'All three finds are recorded. Under the last one lay a piece of page 2.',
      saml: 'Collect fragment', samlet: 'Fragment collected', nulstil: 'Dig again',
      alt: 'Excavation trench: dark, damp soil seen from above.',
    },

    side2: {
      titel: 'The missing page 2', under: 'The second page of the decision broke into three pieces. Nobody knows when. Mímir was present.',
      findesteder: { archive: ['The file', 'Redaction 4 in the document.'], shield: ['The back of the shield', 'Under the leather strap.'], excavation: ['The dig', 'Under the third find.'] },
      fundet: 'Found', mangler: 'Missing',
      brik: ['Piece A', 'Piece B', 'Piece C'],
      tekst: { archive: 'The owner of the cow has', shield: 'not yet been identified.', excavation: 'Continued on page 3.' },
      tom: '…',
      afsloer: 'The owner of the cow has not yet been identified. Continued on page 3.',
      brian: 'Mímir adds: Good work. The case is now longer.',
      venter: 'Find all three pieces. The order does not matter. Neither does the case.',
      segl: 'The thing\'s seal. Awarded for having assembled something.',
      alt: 'An ancient, cracked parchment in three pieces with a wax seal in the corner.',
    },

    tavle: {
      titel: 'The notice board', under: 'Six notices a day. Changed at midnight, Danish time, by someone.',
      flere: 'Show more notices', faerre: 'Show only today\'s', alt: 'Painting: an old wooden notice board by the river with six blank notes fixed with nails and string.',
      opslag: [
        'Lost: one goose. Found: one goose. Connection under investigation.',
        'Wanted: deputy keeper of the minutes. Must be able to write one word.',
        'Whoever moved the stool four centimetres is asked to move it back.',
        'Communal work day at the loose stone. Bring an apology.',
        'The lunch committee lacks a decision on lunch.',
        'Lost property: a hand raised in 1799. Owner please come forward.',
        'For sale: one shield. Not relevant. Enquiries: not to Asgeir.',
        'The fog holds an open house. Every day. No registration.',
        'Cow not missing. It is standing at the fourth stone. As always.',
        'Course: "How to adjourn". Fully booked since 980.',
        'Swap: one decision for two reservations. Contact Old Ravn.',
        'Tomorrow\'s meeting is adjourned. The meeting about the adjournment is also adjourned.',
        'Lost: the thread. Last seen in 1241.',
        'Gudrun seeks help with a question mark. Apply in writing.',
        'Halvdan offers his vote for any other business. Untested.',
        'Bjørn Furcoat has something to say. He is waiting for the right moment. Since 980.',
        'Proposed amendment: § 2 to be changed to § 2. To be dealt with under any other business.',
        'The network is down. It is also up. Mímir is investigating.',
      ],
    },

    koe: {
      titel: 'The queue ticket', under: 'Take a number. The thing serves cases in the order they arrived. There is one case ahead of you.',
      traek: 'Take a number', dit: 'Your number', betjener: 'Now serving', foerste: 'K-0980-0001',
      vent: ['Estimated wait: after lunch.', 'Estimated wait: two dynasties.', 'Estimated wait: the lifetime of the cow plus processing.'],
      igen: 'Mímir: You are already standing here.', tilbage: 'Mímir has noticed that you are still waiting.',
      note: 'The number is local to your browser. There is no global queue count. There is no queue either.',
      alt: 'Painting: an old ticket dispenser of wood and brass with a slate and a paper strip, standing on a stone by the river.',
      ingen: 'No number yet.',
    },

    kamera: {
      titel: 'Fog camera', under: 'Simulated view from the ford. Not a webcam. Not a timestamp. Fog.',
      maerke: 'SIMULATED VIEW', start: 'Start surveillance', pause: 'Pause', nu: 'Show an observation now', koerer: 'Watching…',
      obs: 'Observation: a goose glides through the foreground. Later refuted.', stille: 'No observations. The fog is stable.',
      arkiv: 'Archive', arkivT: [['14 April', 'An outline. Later refuted.'], ['3 June', 'Possible summer. Did not last.'], ['8 September', 'Cow, no further comment.']],
      alt: 'Painting: dense fog over the river at the ford with a row of stones in the foreground and a pale sun behind the haze.',
      reduce: 'Motion is turned off on your device. Observations are shown as a still image.',
    },

    museum: {
      titel: 'The museum of what nearly happened', under: 'Three display cases. All empty. The third is covered, which is more than the others.',
      montrer: ['The hammer that nearly fell', 'The document that was nearly signed', 'The item: any other business'],
      beskr: ['Raised in 1572. Not lowered. Still in the air, somewhere.', 'The quill reached the paper. The paper reached the river.', 'Covered. The item has not been reached, and neither has the exhibition.'],
      loeft: 'Lift the cloth', loeftet: 'The exhibition opens after the cow.', igen: 'You have now seen any other business. That is more than the thing has.', laeg: 'Put the cloth back',
      tom: 'The case is empty.',
      alt: 'Painting: a bright museum hall with three empty glass cases on oak plinths and a view of the river through an open gate.',
      hjelm: {
        titel: 'On loan: The helmet', tekst: 'Artistic reconstruction of a Viking Age helmet. No horns. On loan from the thing\'s imagination; not a find.',
        ting: 'The thing\'s comment: The cow has horns. That is why it was misregistered as a warrior.',
        fakta: 'The nearly complete helmet from Gjermundbu in Norway is the best-preserved from the Viking Age – and it has no horns. Horned helmets on Vikings are an invention of 19th-century art and theatre. The helmet here is an illustration, not a photograph of a find.',
        kilde: 'National Museum of Denmark: Helmets', url: 'https://natmus.dk/historisk-viden/danmark/oldtid-indtil-aar-1050/vikingetiden-800-1050/vaaben/hjelme/',
        alt: 'Illustration: a rust-red Viking Age helmet with a nose guard, without horns.',
      },
    },

    saeson: {
      titel: 'Seasons at the ford', under: 'The ford follows the calendar in Copenhagen. You can try another season without moving your computer.',
      vaelg: 'Season', auto: 'Automatic', navne: { vinter: 'Winter', foraar: 'Spring', sommer: 'Summer', efteraar: 'Autumn' },
      besked: { vinter: 'The fourth stone is temporarily stable.', foraar: 'The river has risen. The evidence is floating.', sommer: 'Working conditions have become visible.', efteraar: 'The leaves are falling. The case is not.' },
      morten: 'Gudrun replies automatically: Not available. Does not say where.',
      nu: 'Right now at the ford',
    },

    stol: {
      titel: 'Toke\'s stool configurator', under: 'Toke has been granted a stool. It can be customised. Every customisation has a consequence.',
      valg: [
        ['ryg', 'Backrest', 'A backrest requires an amendment to the bylaws.'],
        ['arm', 'Armrests', 'Armrests may be perceived as a seizure of power.'],
        ['hjul', 'Wheels', 'Wheels are considered emigration.'],
        ['polster', 'Upholstery', 'Upholstery awaits the sheep.'],
        ['bred', 'Delivery to the bank', 'Delivery is to the bank. Never to the stone.'],
      ],
      oversigt: 'Order summary', ingen: 'No options. A stool.', send: 'Submit for consideration', sendt: 'Submitted',
      resultat: 'An ordinary stool.', forbehold: '19 reservations.',
      fem: ['Reservation 1: The stool may not be loaded until the case on sitting down is decided.', 'Reservation 2: The stool stays on the bank.', 'Reservation 3: Options are noted, not granted.', 'Reservation 4: Toke confirms that he will not sit down.', 'Reservation 5: Delivery has taken place. That is not the same as received.'],
      resten: 'A further 14 reservations are available verbally.',
      note: 'The drawing is atmosphere, not a building plan. Nothing is ordered.',
      alt: 'Drawing on parchment: a three-legged stool in the middle, a chair with a backrest on the left and a stool on wheels on the right.',
    },

    panel: {
      titel: 'The expert panel', under: 'Five experts have been summoned. None of them turned up, but their things are on the table.',
      eksperter: [
        ['arkaeolog', 'Archaeologist', 'Leave the cow undisturbed until the layer has been recorded.', 13, 66],
        ['it', 'IT architect', 'We migrate ownership after a trial period.', 35, 58],
        ['revisor', 'Accountant', 'Is the cow an asset or an ongoing expense?', 63, 46],
        ['filosof', 'Philosopher', 'Can anyone own one who walks away on her own?', 65, 63],
        ['landmand', 'Farmer', 'I have opened the gate.', 92, 26],
      ],
      vaelg: 'Choose an expert.', laage: 'The gate is open. The cow stays put. Nobody told her.',
      note: 'The answers are script. No real experts were asked, and no machine replied.',
      alt: 'Painting: a table by the river with an archaeologist\'s brush and potsherds, a stone laptop, an abacus, an open book with a quill and a pitchfork.',
    },

    beredskab: {
      titel: 'Contingency plan', under: 'Six compartments. Six situations that have never occurred. The plan is ready.',
      rum: [
        ['The fog lifts', 'Avoid eye contact. Someone might propose a decision.', 30, 46],
        ['The cow has a calf', 'Open a sub-case.', 50, 46],
        ['Ragnhild approaches', 'Find a procedure.', 70, 46],
        ['Mímir says yes', 'Check that it is Mímir.', 30, 78],
        ['The stool is warm', 'Cordon off the area.', 50, 78],
        ['The network sends something other than adjourned', 'Disconnect the rope and call Gudrun.', 70, 78],
      ],
      instruks: 'Instruction', luk: 'Close', rumNr: 'Compartment',
      alt: 'Painting: an open wooden cabinet with six compartments containing a scroll, a rope, socks, a bucket, a letter and a bell.',
    },

    maal: {
      titel: 'The office of imprecise measurement', under: 'The thing measures in units that do not exist. The units are made up.',
      regler: ['One meeting = ' + tvAar('en') + ' years, when the cow is on the agenda.', 'One dry sock = the length of a foot Mímir has not measured.', 'One runestone = room for one word, when the word is adjourned.'],
      omr: [
        ['tid', 'Duration in meetings', 'Years', [['aar', 'years'], ['mdr', 'months'], ['dage', 'days']]],
        ['afstand', 'Distance in dry socks', 'Distance', [['m', 'metres'], ['km', 'kilometres'], ['skridt', 'steps']]],
        ['data', 'Data in runestones', 'Amount', [['ord', 'words'], ['kb', 'KB'], ['gb', 'GB']]],
      ],
      beregn: 'Convert', vaerdi: 'Value', enhed: 'Unit',
      svarTid: { neg: 'Old Ravn remembers it as tomorrow.', nul: 'The meeting has not begun. It never has.', lille: 'Less than an opening remark.', et: 'One meeting.', flere: '{n} meetings. The cow is on the agenda for all of them.' },
      svarAfstand: { neg: 'You have walked backwards. So has Toke.', nul: 'No distance. You are standing on the stone.', lille: 'Fewer socks than Mímir has. He has none.', mellem: 'A fair number of dry socks. None of them Mímir\'s.', stor: 'More socks than the fog can dry. The distance is adjourned.' },
      svarData: { neg: 'Negative data. The network has received it. It never receives anything otherwise.', nul: 'No stone needed. The word is already adjourned.', et: 'One runestone. The word is: adjourned.', faa: 'A couple of stones. The network has six. That will do.', mange: 'Requires several stones. The number will be dealt with after the cow.' },
      ugyldig: 'Enter a number. The thing does not accept fog as a value.',
      alt: 'Painting: a table by the river with an hourglass, a balance scale holding a sock and a stone, a coil of rope, a wooden ruler and a book.',
    },

    soeg: {
      titel: 'Search the fog', under: 'Search the headings and texts of the case files. The results are real. The comment is the thing\'s.',
      label: 'Search term', placeholder: 'e.g. cow, stool, decision …', knap: 'Search', ryd: 'Clear',
      ingen: 'Nothing found in the fog. Try another word, or follow the river.', antal: '{n} places on the page',
      saer: { 'decision': 'No final answers. Here are the relevant case files.', 'cow': 'One witness. It keeps moving.', 'stool': 'You do not have permission to sit on the result.', 'any other business': 'The whole thing feels called upon.', 'aob': 'The whole thing feels called upon.' },
      alm: 'Found in the fog. The thing has not read it.',
      gaa: 'Go to',
    },

    pind: {
      titel: 'Send a stick', under: 'The runes above can also be carved into a stick and sent downstream. The message is shown here as rune play on top of the stick.',
      send: 'Send downstream', sendt: 'The stick has been sent downstream. It will arrive in between three days and four hundred years.',
      hoevl: 'Plane the message away', hoevlet: 'The message is deleted. The stick is now narrower.', tom: 'The stick is empty. Write something in the field above.',
      pindAlt: 'Illustration: a rune stick of pale wood with a string at one end.', knivAlt: 'Illustration: a small whittling knife with a wooden handle.',
      modern: 'Modern text',
      fakta1: 'Runes were not only carved in stone. In the Middle Ages people also wrote letters and messages on small wooden sticks – the Museum of Cultural History in Oslo shows, among other things, an order for spearheads. That is medieval material, not evidence of exactly the same practice at a Danish thing in 980.',
      fakta2: 'The same collection holds a love letter from Lom stave church, where someone later tried to cut the names away with a knife. That too is medieval. The knife here only deletes your own game.',
      kilde: 'Museum of Cultural History, Oslo: Runic letters', url: 'https://www.historiskmuseum.no/english/exhibitions/exhibitions-archive/kiss-me-the-world-of-runes/runic-letters-and-class-exercises/',
    },
    graatand: {
      titel: 'Greytooth', under: 'The thing\'s edition of Bluetooth. The colour is the fog\'s doing. The connection is established when both parties agree. That has not happened yet.',
      par: 'Pair the devices', status1: 'The cow is not visible to other devices.', status2: 'The devices are awaiting consent from Halvdan.',
      runer: 'ᚼ + ᛒ', runerForkl: 'Harald\'s initials in the younger futhark: hagall (H) and bjarkan (B).',
      fakta: 'The Bluetooth logo is a bind rune of ᚼ (hagall, H) and ᛒ (bjarkan, B) – the initials of Harald Bluetooth, who united Denmark and Norway as the standard unites devices. The button here does not touch your own Bluetooth and asks for no permissions.',
      kilde: 'bluetooth.com: Bluetooth origin', url: 'https://www.bluetooth.com/about-us/bluetooth-origin/',
    },
    fakta: 'What we actually know',
  },
};
;
/* ═══ indslag.js (assets/kilde/indslag.js) ═══ */
/* tingsvad.dk — runde 5: det levende tingsted.
   15 indslag (F01–F15) + faktaspor (H01–H03). Tekster i indslag-tekst.js, stil i site.css.
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
    el.innerHTML = `<div class="akt"><div class="akt-dok">${img(NY + 'arkivdokument.webp', '', 800, 1200).replace('loading="lazy"', 'loading="eager"')}<div class="akt-tekst"><div class="akt-hoved">${esc(A.hoved)}</div>${linjer}<p>${esc(A.linjer[4])}${strege}</p><div class="akt-saml" id="akt-saml" hidden>${samlKnap('archive')}<span class="note">${esc(A.fund)}</span></div></div></div><p class="note">${esc(A.fod)}</p></div>`;
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
  let sæsonLag = null;
  function aktuelSæson() { return S.seasonOverride || sæsonAf(idag.m); }
  function anvendSæson() {
    const s = aktuelSæson(); document.body.classList.remove('aarstid-vinter', 'aarstid-foraar', 'aarstid-sommer', 'aarstid-efteraar'); document.body.classList.add('aarstid-' + s);
    if (sæsonLag) { sæsonLag.remove(); sæsonLag = null; }
    if (!reduce() && (s === 'efteraar' || s === 'vinter')) {
      sæsonLag = document.createElement('div'); sæsonLag.className = 'aarstid-lag aarstid-lag-' + s; sæsonLag.setAttribute('aria-hidden', 'true');
      if (s === 'efteraar') { const blade = [[3, 2, 40, 42], [59, 2, 33, 35], [35, 30, 30, 40], [72, 36, 27, 24], [5, 52, 30, 44]]; sæsonLag.innerHTML = Array.from({ length: 10 }, (_, i) => { const b = blade[(i * 3) % 5], t = 14 + ((i * 7) % 11); return `<i class="${i % 2 ? 'blad-h' : 'blad-v'}" style="--bx:${b[0]};--by:${b[1]};--bw:${b[2]};--bh:${b[3]};--bl:${(4 + i * 37) % 92}%;--bd:${-((i * 5) % t)}s;--bt:${t}s;--bs:${(.7 + ((i * 3) % 6) / 10).toFixed(1)};background-image:url('${NY}efteraarsblade-512.webp')"></i>`; }).join(''); } // runde 12: ti blade i toppen, i gang fra start
      ($('.r12-hero') || $('.r12s-hero') || (s === 'efteraar' && ($('.hero-lag') || $('.side-hoved'))) || document.body).appendChild(sæsonLag); // blade og frost kun i toppen (runde 12: i maleriet), aldrig hen over tekst og formularer
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
;
/* ═══ maskinpark-tekst.js (assets/kilde/maskinpark-tekst.js) ═══ */
/* tingsvad.dk — runde 6: Tingets maskinpark (C01–C08). Alle tekster, da/en.
   Redaktionelle eksempler er mærket i brugerfladen og udgives aldrig som AI-svar. */
window.TV6 = {
  da: {
    kilde: { ai: 'Svar fra maskinen', editorial: 'Redaktionelt eksempel', demo: 'Prøvevisning', server: 'Tingets protokol', offline: 'Maskinen er ikke tilsluttet', cached: 'Gemt resultat', replay: 'Gentaget svar', simulation: 'Simulation' },
    drift: {
      offline: 'Tingets maskiner er ikke tilsluttet endnu. Panelerne viser redaktionelle eksempler, der er mærket som sådan. Intet her er et AI-svar.',
      fejl: 'Nettet svarede ikke. Det er ført til protokols.',
      kvote: 'Dagens bevilling er gået til blæk. Prøv igen i morgen.',
      vent: 'Tinget behandler. Det tager den tid, det tager.',
      igen: 'Prøv igen',
    },
    intro: {
      titel: 'Tinget har fået maskiner. Det hjælper ikke.',
      lead: 'Tingets maskinpark står ved vadestedet: en retssal, en afstemning, en avis, to bevisværksteder, et sagskontor, Mímirs arkiv og en radio med stemme. Maskinerne er indstillet til ikke at afgøre noget. Det var ikke svært.',
      note: 'Figurerne er fiktion. Hvad maskinen siger, er fiktion. Hvad tinget beslutter, er intet.',
    },
    kort: [
      ['retssal', 'AI-retssalen', 'Fremlæg et argument. Tre figurer svarer. Mímir skriver referat.'],
      ['afstemning', 'Den Store Afstemning', 'Syv pladser ved vadestedet. Stem Ja, Nej eller Eventuelt.'],
      ['avis', 'Tingsvad Tidende', 'Dagens avis, trykt én gang i døgnet af nettet.'],
      ['billedbevis', 'Fremlæg dit bevis', 'Maskinen beskriver, hvad den ser. Gudrun vurderer resten.'],
      ['vaerksted', 'Lav et falsk historisk bevis', 'Vælg genstand, fundsted og tilstand. Få et opdigtet fund.'],
      ['sagskontor', 'Bureaukratiet arbejder videre', 'Din stolansøgning skifter status, også mens du er væk.'],
      ['brian', 'Mímirs arkiv', 'En modvillig guide til gåden. Du vælger, hvor meget han afslører.'],
      ['radio', 'Radio med stemme', 'Dagens udsendelse. Oplæsning findes kun på engelsk; den danske udgave er manuskript.'],
    ],
    luk: 'Luk panelet',
    maskineri: { titel: 'Vis maskineriet', under: 'Kolofon for netop dette panel. Tallene er målt nu, ikke skrevet af redaktionen.', produkter: 'Produkter', kald: 'Seneste kald fra dette panel', ingen: 'Ingen kald endnu. Tryk på noget i panelet, så står det her.', browser: 'målt i browseren', server: 'Workerens målinger', total: 'i alt i Workeren', kode: 'Kildekoden på GitHub', ws: 'Afstemningen taler over en WebSocket direkte med et Durable Object; de enkelte beskeder måles ikke her.', tid: 'kl.', fejl: 'fejl', note: 'Workerens ur flytter sig kun ved I/O, så tallene viser ventetid på tjenesterne, ikke regnetid.' },
    figurer: { brian: 'Mímir', gudrun: 'Gudrun', ulf: 'Ulf Sortkappe', ragnhild: 'Ragnhild', hoevdingen: 'Høvdingen', toke: 'Toke', asgeir: 'Asgeir', ravn: 'Gamle Ravn', halvdan: 'Halvdan', bjoern: 'Bjørn' },

    retssal: {
      scene: 'Maleri: tingets halvrunde bord af egetræ ved vadestedet i morgenlys, med en tom stol foran og høvdingens røde kappe over midterstolen.',
      label: 'Dit argument om kosagen', placeholder: 'Fx: Koen har stået ved den fjerde sten i ' + tvAar('da') + ' år. Den må være tingets.',
      taeller: '{n} af 500 tegn', send: 'Fremlæg argumentet', sender: 'Tinget hører efter …',
      tale: { knap: 'Indtal argumentet', stop: 'Stop ({s} s)', lytter: 'Tinget lytter … tal tydeligt, højst et minut.', skriver: 'Skriveren noterer …', klar: 'Noteret. Ret teksten, hvis skriveren har hørt forkert, og fremlæg den.', nej: 'Tinget fik ikke lov at bruge mikrofonen.', note: 'Lyden sendes til Workers AI (Whisper), bliver til tekst og gemmes ingen steder.' },
      replik: 'Én kort replik (valgfri)', replikSend: 'Svar tinget', replikBrugt: 'Replikken er brugt. Tinget har hørt nok.',
      referat: 'Referat', tomt: 'Skriv et argument først. Tinget kan ikke udsætte ingenting. Det har det prøvet.',
      forkort: 'Argumentet er for langt. Tinget læser højst 500 tegn, og helst færre.',
      note: 'Figurerne er uenige med hinanden og med dig. Sagen afgøres ikke. Det er ikke en fejl.',
      eksempel: {
        speeches: [
          { characterId: 'ulf', text: 'Jeg hører argumentet. Koen hører også argumentet. Den vælger blot tavshed, som den har gjort for mig, siden tinget blev sat i 980. Det kalder jeg loyalitet.' },
          { characterId: 'gudrun', text: 'Der foreligger ingen bilag. Et argument uden bilag er en lyd. Lyde journaliseres ikke. Jeg gør det alligevel, under »Eventuelt«.' },
          { characterId: 'ragnhild', text: 'Vi kunne begynde med at spørge, hvem der fodrer den. Det tager tredive sekunder. Jeg har stået her siden år 1000 og venter stadig på de tredive sekunder.' },
        ],
        minutes: 'Argumentet er modtaget, bestridt, bogført og udsat.',
      },
    },

    afstemning: {
      scene: 'Maleri: syv store, mosgroede sten i et vadested ved solopgang. Ingen sidder på dem endnu.',
      lead: 'Tinget har syv pladser. Tag en ledig, afgiv din stemme, og vent på, at runden slutter. Spørgsmålet kommer senere. Det har det altid gjort.',
      plads: 'Plads {n}', ledig: 'ledig', optaget: 'optaget', din: 'din plads', tag: 'Tag plads {n}',
      fuldt: 'Alle syv pladser er optaget. Du står i kø på bredden. Det er en ærefuld placering.',
      koe: 'Vent på bredden', andetRum: 'Gå til et andet vadested',
      stem: 'Afgiv din stemme', ja: 'Ja', nej: 'Nej', eventuelt: 'Eventuelt', stemt: 'Du har stemt {v}. Det kan ikke ændres. Det kan heller ikke bruges.',
      fase: { lobby: 'Tinget samles', voting: 'Afstemning i gang', closed: 'Runden er slut', idle: 'Tinget venter på den første' },
      frist: 'Runden slutter om {s} sekunder', fristUde: 'Runden er slut',
      aktive: '{n} forbindelser ved vadestedet', aktiveNote: 'En forbindelse er en deltager, ikke en dokumenteret person. Gudrun har bedt om at få det ført til protokols.',
      resultat: 'Ja {ja} · Nej {nej} · Eventuelt {ev}',
      slutning: 'Tinget konstaterer, at der er afgivet {n} stemmer, og at ingen har formuleret et spørgsmål. Stemmerne er ført til protokols under »Eventuelt«. Sagen om koen er udsat. Ny runde om lidt.',
      forbinder: 'Forbinder til vadestedet …', afbrudt: 'Forbindelsen til vadestedet er afbrudt. Din plads holdes et øjeblik.', genforbinder: 'Forbinder igen …',
      proeve: 'Prøverunde med tingets figurer', proeveNote: 'Prøverunden kører kun i din browser med tingets opdigtede figurer. Den er ikke en fælles afstemning og tæller ingen andre gæster.',
      proeveTitel: 'Prøverunde med tingets figurer',
      offline: 'Det fælles rum er ikke tilsluttet. Du kan tage en prøverunde med tingets figurer imens.',
      figurerStemmer: ['Asgeir stemmer Nej. Det er ikke relevant for skjoldet.', 'Halvdan stemmer Ja. Han ved ikke til hvad.', 'Gamle Ravn stemmer Eventuelt. Det gjorde han også i 980.', 'Toke stemmer Ja og håber, det handler om stolen.', 'Bjørn stemmer Nej af princip.', 'Gudrun afstår. Der mangler bilag.'],
    },

    avis: {
      titel: 'Tingsvad Tidende', under: 'Uafhængig af begivenheder siden 980',
      dato: 'Udgave for {d}', ingen: 'Der er ingen udgave endnu. Nettet trykker avisen én gang i døgnet, når der er nogen til at sætte sats.',
      hent: 'Hent dagens avis', henter: 'Henter avisen fra tørresnoren …',
      saer: 'Redaktionel særudgave', saerNote: 'Dagens avis kunne ikke trykkes. Dette er et færdigskrevet eksempel fra redaktionen, ikke dagens nyheder.',
      senest: 'Seneste udgave fra {d}. Dagens avis er ikke trykt endnu.',
      stempel: 'Fra arkivet', forrige: 'Forrige udgave', naeste: 'Næste udgave', idag: 'Dagens avis', bladLabel: 'Bladr i avisens udgaver',
      arkivH: 'Tidligere udgaver', arkivNote: 'Hver udgave er trykt én gang, om morgenen, og aldrig rettet bagefter. Den med prikken er den, du læser.', ikkeFundet: 'Der findes ingen udgave fra den dato i arkivet. Her er den seneste i stedet.',
      spalter: ['Hovedhistorie', 'Bureaukratisk notat', 'Rubrikannonce'],
      tal: 'Dagens tal', talNote: 'Tallene tæller kun gennemførte hændelser ved vadestedet: afsluttede afstemningsrunder og modtagne stolansøgninger. Ingen besøgende tælles.',
      stilhed: 'Der skete intet i går. Det er historien.',
      eksempel: {
        date: null,
        lead: { title: 'Stol fundet ledig. Undersøgelse indledt.', body: 'Ved vadestedet er en trebenet skammel konstateret ledig for 1.016. år i træk. Tinget har nedsat et udvalg, der skal afklare, om ledigheden er vedvarende eller blot gentaget. Toke den Yngre blev set i nærheden. Han udtalte: »Jeg vil gerne sidde ned.« Udtalelsen er ikke ny.' },
        notice: { title: 'Notat fra sekretariatet', body: 'Sekretæren meddeler, at protokollen fortsat er våd, og at dette ikke er en sag, men en tilstand. Tilstande journaliseres ikke. Protokollen er derfor tør i journalen og våd i virkeligheden. Sekretæren har ikke flere kommentarer og har heller ikke de første.' },
        ad: { title: 'Rubrikannonce', body: 'SØGES: Bilag til bevis. Alle størrelser. Henvendelse til revisor Gudrun ved den anden sten. Ingen bilag uden bilag.' },
        numbers: null,
      },
    },

    billedbevis: {
      scene: 'Maleri: et arbejdsbord af træ ved vadestedet med lup, lampe og en tom ramme, hvor beviset lægges.',
      lead: 'Læg et bevis frem. Maskinen beskriver nøgternt, hvad den ser. Gudrun vurderer bagefter, hvad det betyder for kosagen. De to felter har intet med hinanden at gøre.',
      bakke: 'Prøvebakken', bakkeNote: 'Fire genstande fra sagen, klar til fremlæggelse.',
      genstande: { ko: 'Koen', skjold: 'Skjoldet', stol: 'Stolen', spyd: 'Spyddet' },
      upload: 'Eller fremlæg dit eget billede', uploadKnap: 'Vælg en fil', uploadNote: 'JPEG, PNG eller WebP, højst 2 MB. Billedet opbevares kun kort og offentliggøres ikke.',
      uploadOff: 'Upload er ikke åbnet endnu. Prøvebakken virker.',
      forstor: 'For stor fil. Tinget tager højst 2 MB. Det tager også lang tid om det.', forkertType: 'Kun JPEG, PNG eller WebP. Tinget har ikke udstyr til andet.',
      fremlaeg: 'Fremlæg beviset', fremlaegger: 'Maskinen kigger …',
      beskrivelse: 'Hvad maskinen ser', observationer: 'Observationer', vurdering: 'Gudruns vurdering', vurderingNote: 'Fiktiv vurdering fra en hvid gås. Ikke et resultat.',
      ikkeSet: 'Billedmodellen er ikke tilgængelig, og maskinen har ikke set filen. Den lader ikke som om.',
      eksempler: {
        ko: { description: 'En rødbroget ko står i lavt vand ved mosgroede sten. Morgenlys, let dis.', observations: ['Ét dyr, fire ben, ingen synlige dokumenter.', 'Vandet når til koden.', 'Ingen ejer i billedet.'], fictionalVerdict: 'Billedet beviser, at der findes en ko. Det var ikke omstridt. Udsat.' },
        skjold: { description: 'Et rundt træskjold med jernbeslag og udskåret dragemotiv står op ad en sten.', observations: ['Overfladen er påfaldende blank.', 'Ingen hak.', 'Dragen peger væk fra koen.'], fictionalVerdict: 'Skjoldet er ikke relevant for sagen. Det er det eneste, Asgeir og jeg er enige om. Journaliseret.' },
        stol: { description: 'En trebenet skammel i træ står på en åbred. Den er tom.', observations: ['Tre ben, ingen ryg.', 'Ingen slid på sædet.', 'Afstand til vandet: kort.'], fictionalVerdict: 'Stolen er et bevis for, at der ikke sidder nogen. Det er et bilag, men ikke til denne sag.' },
        spyd: { description: 'Et langt spyd med askeskaft og jernspids står op ad et træ.', observations: ['Spidsen er skarp.', 'Skaftet er lige.', 'Det peger.'], fictionalVerdict: 'Spyddet beviser, at høvdingen kan pege. Det er ikke det samme som at pege på en ejer. Udsat.' },
      },
    },

    vaerksted: {
      scene: 'Maleri: et værksted med høvlebænk, pigmenter og en halvt sodet skammel på bordet.',
      lead: 'Tre valg, ét opdigtet fund. Resultatet er mærket som fiktion, også når du henter det. Det er ikke et historisk bevis. Det er heller ikke et bevis for noget andet.',
      genstand: 'Genstand', fundsted: 'Fundsted', tilstand: 'Tilstand',
      valg: { genstand: [['skjold', 'Skjold'], ['stol', 'Stol'], ['ske', 'Ske']], fundsted: [['vad', 'Vadestedet'], ['birk', 'Birkelunden'], ['arkiv', 'Arkivet']], tilstand: [['sodet', 'Sodet'], ['mosgroet', 'Mosgroet'], ['velbevaret', 'Usædvanligt velbevaret']] },
      lav: 'Lav fundet', laver: 'Værkstedet arbejder. Det kan tage et halvt minut …', koe: 'Fundet er i kø ({n}) …',
      stempel: 'Opdigtet fund fra Tingsvad', proveniens: 'Proveniens', hent: 'Hent som billede (med mærkning)',
      lukket: 'Værkstedet er lukket: der er ingen billedmodel tilsluttet. Intet fund kan opdigtes i dag, og intet vises som om.',
      fejl: 'Værkstedet tabte penslen. Prøv igen om lidt.',
    },

    sagskontor: {
      scene: 'Maleri: et sagskontor af træ med bakker, segl, timeglas og et vindue ud mod vadestedet.',
      lead: 'Din ansøgning om en stol behandles her. Den skifter status, også mens din browser er lukket. Næste behandling står nedenfor. Den holder sjældent.',
      trin: ['Modtaget', 'Afventer kontrol', 'Sendt tilbage til begyndelsen', 'Stol muligvis ledig'],
      ingen: 'Du har ingen sag i behandling. Ansøg om en stol via Tokes stolekonfigurator, eller send en ansøgning herfra.',
      ansoeg: 'Send ansøgning om stol', sender: 'Sagen oprettes …', valgLabel: 'Ønsker til stolen (valgfrit)', valgPlaceholder: 'Fx ryglæn, hjul, varme',
      sagsnr: 'Sagsnummer', status: 'Status', naeste: 'Næste behandling forventes', faerdig: 'Sagen er færdigbehandlet. Stolen er muligvis ledig. Toke er informeret.',
      hent: 'Hent status', henter: 'Henter status …', senest: 'Senest bekræftede status (nettet svarede ikke lige nu)',
      kode: 'Privat hentekode', kodeNote: 'Gem koden, hvis du vil følge sagen fra en anden enhed eller efter rydning af browserdata. Uden koden kan sagen ikke findes igen. Den findes stadig; det er bare dig, der ikke kan finde den.',
      kodeInd: 'Har du en hentekode?', kodeKnap: 'Find sagen', kodeFejl: 'Ingen sag med den kode. Det kan være kodens skyld. Det kan være sagens.',
      glem: 'Glem sagen på denne enhed',
      offline: 'Sagskontoret er ikke tilsluttet. Ansøgninger kan ikke oprettes, og der er ingen demosager at vise.',
      fraStol: 'Ansøgningen fra stolekonfiguratoren er klar til afsendelse.',
      oprettet: 'Sagen er oprettet og modtaget. Første behandling er planlagt.',
    },

    brian: {
      scene: 'Maleri: Mímir, en grå ulv, ligger i et arkiv af ruller og bøger med en lanterne og kigger ud mod vadestedet.',
      lead: 'Mímir hjælper med gåden og med at finde rundt. Han vil helst ikke. Du vælger selv, hvor meget han afslører.',
      niveau: 'Hvor meget må Mímir afsløre?', niveauer: [['hint', 'Et lille vink'], ['clearer', 'Et tydeligere vink'], ['solution', 'Vis løsningen']],
      label: 'Dit spørgsmål til Mímir', placeholder: 'Fx: Hvor er stykke B?', spoerg: 'Spørg Mímir', spoerger: 'Mímir bladrer …',
      kendte: 'Mímir ved, at du har fundet {n} af 3 stykker. Det bruger han kun til at tilpasse sit svar. Præmier uddeler han ikke.',
      kilde: 'Kilde i arkivet', ingenKilde: 'Det har jeg ikke i arkivet.',
      tomt: 'Stil et spørgsmål. Eller lad være; så svarer Mímir på det, du ville have spurgt om.',
      gammel: 'Den gamle Mímir-knap ovenfor svarer stadig på alt uden at blive spurgt. Dette arkiv er til, når du faktisk har et spørgsmål.',
      eksempel: { answer: 'Noteret. Side 2 ligger i tre stykker, og ingen af dem ligger, hvor du kigger nu. Begynd i aktindsigten; der er noget sort, man kan trykke på. Mere siger jeg ikke på det her niveau. Det gør det desværre til en sag.', sources: ['Sagsakt 8 · Tillæg · Undersøgelsen'] },
    },

    radio: {
      scene: 'Maleri: et radiostudie af træ ved vadestedet med to mikrofoner, en tavle og en rød lampe over døren.',
      lead: 'Dagens udsendelse fra vadestedet. Genudsendelser skyldes manglende udvikling i sagen. Stemmen er syntetisk, og alt er fiktion.',
      lampe: { on: 'På luft', off: 'Ikke på luft', text: 'Kun manuskript' }, lampeNote: 'Lampen følger afspilleren.',
      hent: 'Hent dagens udsendelse', henter: 'Henter udsendelsen …',
      manuskript: 'Manuskript', udgave: 'Udsendelse for {d}', ingen: 'Ingen udsendelse endnu i dag. Nettet læser avisen først.',
      ingenLyd: 'Der er ingen lydfil til denne udsendelse. Manuskriptet kan læses.', kunEngelsk: 'Oplæste nyheder findes kun på engelsk: nettet har ingen dansk stemme. Den danske udgave er manuskript.', kunEngelskLink: 'Hør dagens engelske udsendelse', kunEngelskUrl: '/en/#paafund-radio',
      lydFejl: 'Lyden kunne ikke afspilles. Manuskriptet står stadig.',
      tekstudgave: 'Tekstudgave', stemme: 'Fortæller: én syntetisk stemme. Ingen virkelig persons stemme er klonet.',
      eksempel: { date: null, script: 'Godmorgen fra vadestedet. Det er Tingsvad Radio. Tågen ligger, hvor den plejer.\n\nFørste nyhed: Stolen er konstateret ledig. Undersøgelsen fortsætter.\n\nAnden nyhed: Revisoren har afvist et regnskab, der endnu ikke er indleveret. Begrundelsen er, at det så kunne ske.\n\nDet var alt. Sagen om koen er udsat. Vi sender igen i morgen, hvis der er nogen.' },
    },
  },

  en: {
    kilde: { ai: 'Reply from the machine', editorial: 'Editorial example', demo: 'Preview', server: 'The thing’s minutes', offline: 'The machine is not connected', cached: 'Stored result', replay: 'Repeated reply', simulation: 'Simulation' },
    drift: {
      offline: 'The thing’s machines are not connected yet. The panels show editorial examples, marked as such. Nothing here is an AI reply.',
      fejl: 'The network did not answer. This has been minuted.',
      kvote: 'Today’s allowance has gone to ink. Try again tomorrow.',
      vent: 'The thing is processing. It takes the time it takes.',
      igen: 'Try again',
    },
    intro: {
      titel: 'The thing has acquired machines. It does not help.',
      lead: 'The thing’s machine park stands at the ford: a courtroom, a vote, a newspaper, two evidence workshops, a case office, Mímir’s archive and a radio with a voice. The machines are configured to decide nothing. That was not difficult.',
      note: 'The characters are fiction. What the machine says is fiction. What the thing decides is nothing.',
    },
    kort: [
      ['retssal', 'The AI courtroom', 'Make an argument. Three characters reply. Mímir writes the minutes.'],
      ['afstemning', 'The Great Vote', 'Seven seats at the ford. Vote Yes, No or Any other business.'],
      ['avis', 'Tingsvad Tidende', 'Today’s paper, printed once a day by the network.'],
      ['billedbevis', 'Present your evidence', 'The machine describes what it sees. Gudrun judges the rest.'],
      ['vaerksted', 'Forge a historical find', 'Pick object, site and condition. Receive a fictional find.'],
      ['sagskontor', 'The bureaucracy carries on', 'Your stool application changes status, even while you are away.'],
      ['brian', 'Mímir’s archive', 'A reluctant guide to the puzzle. You choose how much he reveals.'],
      ['radio', 'Radio with a voice', 'Today’s broadcast, read aloud. The script can always be read.'],
    ],
    luk: 'Close panel',
    maskineri: { titel: 'Show the machinery', under: 'Colophon for this panel only. The figures are measured now, not written by the editors.', produkter: 'Products', kald: 'Latest calls from this panel', ingen: 'No calls yet. Press something in the panel and it shows up here.', browser: 'measured in the browser', server: 'The Worker’s measurements', total: 'in total in the Worker', kode: 'Source code on GitHub', ws: 'The vote talks over a WebSocket directly to a Durable Object; individual messages are not measured here.', tid: 'at', fejl: 'error', note: 'The Worker’s clock only moves on I/O, so the figures show time spent waiting for services, not compute.' },
    figurer: { brian: 'Mímir', gudrun: 'Gudrun', ulf: 'Ulf Blackcloak', ragnhild: 'Ragnhild', hoevdingen: 'The Chieftain', toke: 'Toke', asgeir: 'Asgeir', ravn: 'Old Ravn', halvdan: 'Halvdan', bjoern: 'Bjørn' },

    retssal: {
      scene: 'Painting: the thing’s semicircular oak table at the ford in morning light, an empty chair in front and the chieftain’s red cloak over the middle seat.',
      label: 'Your argument on the cow case', placeholder: 'E.g.: The cow has stood by the fourth stone for ' + tvAar('en') + ' years. It must belong to the thing.',
      taeller: '{n} of 500 characters', send: 'Present the argument', sender: 'The thing is listening …',
      tale: { knap: 'Speak your argument', stop: 'Stop ({s} s)', lytter: 'The thing is listening … speak clearly, at most a minute.', skriver: 'The scribe is writing …', klar: 'Written down. Correct the text if the scribe misheard, then present it.', nej: 'The thing was not allowed to use the microphone.', note: 'The audio is sent to Workers AI (Whisper), turned into text and stored nowhere.' },
      replik: 'One short reply (optional)', replikSend: 'Answer the thing', replikBrugt: 'The reply has been used. The thing has heard enough.',
      referat: 'Minutes', tomt: 'Write an argument first. The thing cannot adjourn nothing. It has tried.',
      forkort: 'The argument is too long. The thing reads at most 500 characters, preferably fewer.',
      note: 'The characters disagree with each other and with you. The case is not decided. That is not a bug.',
      eksempel: {
        speeches: [
          { characterId: 'ulf', text: 'I hear the argument. The cow hears the argument too. It merely chooses silence, as it has done for me since the thing convened in 980. I call that loyalty.' },
          { characterId: 'gudrun', text: 'There are no supporting documents. An argument without documents is a sound. Sounds are not filed. I am filing it anyway, under “Any other business”.' },
          { characterId: 'ragnhild', text: 'We could begin by asking who feeds it. That takes thirty seconds. I have stood here since the year 1000 waiting for those thirty seconds.' },
        ],
        minutes: 'The argument was received, disputed, booked and adjourned.',
      },
    },

    afstemning: {
      scene: 'Painting: seven large, moss-grown stones in a ford at sunrise. Nobody is sitting on them yet.',
      lead: 'The thing has seven seats. Take a free one, cast your vote, and wait for the round to end. The question comes later. It always has.',
      plads: 'Seat {n}', ledig: 'free', optaget: 'taken', din: 'your seat', tag: 'Take seat {n}',
      fuldt: 'All seven seats are taken. You are queuing on the bank. It is an honourable position.',
      koe: 'Wait on the bank', andetRum: 'Go to another ford',
      stem: 'Cast your vote', ja: 'Yes', nej: 'No', eventuelt: 'Any other business', stemt: 'You voted {v}. It cannot be changed. It cannot be used either.',
      fase: { lobby: 'The thing is gathering', voting: 'Vote in progress', closed: 'The round is over', idle: 'The thing awaits the first arrival' },
      frist: 'The round ends in {s} seconds', fristUde: 'The round is over',
      aktive: '{n} connections at the ford', aktiveNote: 'A connection is a participant, not a documented person. Gudrun asked for this to be minuted.',
      resultat: 'Yes {ja} · No {nej} · Any other business {ev}',
      slutning: 'The thing notes that {n} votes were cast and that nobody formulated a question. The votes have been minuted under “Any other business”. The cow case is adjourned. New round shortly.',
      forbinder: 'Connecting to the ford …', afbrudt: 'The connection to the ford was lost. Your seat is held for a moment.', genforbinder: 'Reconnecting …',
      proeve: 'Practice round with the thing’s characters', proeveNote: 'The practice round runs only in your browser with the thing’s fictional characters. It is not a shared vote and counts no other guests.',
      proeveTitel: 'Practice round with the thing’s characters',
      offline: 'The shared room is not connected. You can take a practice round with the thing’s characters meanwhile.',
      figurerStemmer: ['Asgeir votes No. It is not relevant to the shield.', 'Halvdan votes Yes. He does not know to what.', 'Old Ravn votes Any other business. He did in 980 too.', 'Toke votes Yes and hopes it is about the stool.', 'Bjørn votes No on principle.', 'Gudrun abstains. Documents are missing.'],
    },

    avis: {
      titel: 'Tingsvad Tidende', under: 'Independent of events since 980',
      dato: 'Edition for {d}', ingen: 'There is no edition yet. The network prints the paper once a day, when someone is there to set the type.',
      hent: 'Fetch today’s paper', henter: 'Fetching the paper from the drying line …',
      saer: 'Editorial special edition', saerNote: 'Today’s paper could not be printed. This is a pre-written example from the editors, not today’s news.',
      senest: 'Latest edition from {d}. Today’s paper has not been printed yet.',
      stempel: 'From the archive', forrige: 'Previous edition', naeste: 'Next edition', idag: 'Today’s paper', bladLabel: 'Browse the paper’s editions',
      arkivH: 'Earlier editions', arkivNote: 'Each edition is printed once, in the morning, and never corrected afterwards. The one with the dot is the one you are reading.', ikkeFundet: 'There is no edition from that date in the archive. Here is the latest instead.',
      spalter: ['Lead story', 'Bureaucratic notice', 'Classified'],
      tal: 'Today’s figures', talNote: 'The figures count only completed events at the ford: finished voting rounds and received stool applications. No visitors are counted.',
      stilhed: 'Nothing happened yesterday. That is the story.',
      eksempel: {
        date: null,
        lead: { title: 'Stool found vacant. Inquiry opened.', body: 'At the ford, a three-legged stool has been found vacant for the 1,016th consecutive year. The thing has appointed a committee to establish whether the vacancy is continuous or merely repeated. Toke the Younger was seen nearby. He stated: “I would like to sit down.” The statement is not new.' },
        notice: { title: 'Notice from the secretariat', body: 'The secretary announces that the minutes remain wet, and that this is not a case but a condition. Conditions are not filed. The minutes are therefore dry in the register and wet in reality. The secretary has no further comment and did not have a first one either.' },
        ad: { title: 'Classified', body: 'WANTED: Supporting documents for evidence. All sizes. Apply to auditor Gudrun at the second stone. No documents without documents.' },
        numbers: null,
      },
    },

    billedbevis: {
      scene: 'Painting: a wooden workbench at the ford with a magnifying glass, a lamp and an empty frame where the evidence is placed.',
      lead: 'Present a piece of evidence. The machine soberly describes what it sees. Afterwards Gudrun judges what it means for the cow case. The two fields have nothing to do with each other.',
      bakke: 'The sample tray', bakkeNote: 'Four objects from the case, ready for presentation.',
      genstande: { ko: 'The cow', skjold: 'The shield', stol: 'The stool', spyd: 'The spear' },
      upload: 'Or present your own picture', uploadKnap: 'Choose a file', uploadNote: 'JPEG, PNG or WebP, at most 2 MB. The picture is kept only briefly and is not published.',
      uploadOff: 'Upload is not open yet. The sample tray works.',
      forstor: 'File too large. The thing takes at most 2 MB. It takes a long time about that, too.', forkertType: 'JPEG, PNG or WebP only. The thing has no equipment for anything else.',
      fremlaeg: 'Present the evidence', fremlaegger: 'The machine is looking …',
      beskrivelse: 'What the machine sees', observationer: 'Observations', vurdering: 'Gudrun’s assessment', vurderingNote: 'Fictional assessment by a white goose. Not a result.',
      ikkeSet: 'The vision model is unavailable, and the machine has not seen the file. It is not pretending otherwise.',
      eksempler: {
        ko: { description: 'A red-and-white cow stands in shallow water by moss-grown stones. Morning light, light haze.', observations: ['One animal, four legs, no visible documents.', 'The water reaches the hoof.', 'No owner in the picture.'], fictionalVerdict: 'The picture proves that a cow exists. That was not disputed. Adjourned.' },
        skjold: { description: 'A round wooden shield with iron fittings and a carved dragon motif leans against a stone.', observations: ['The surface is strikingly polished.', 'No notches.', 'The dragon points away from the cow.'], fictionalVerdict: 'The shield is not relevant to the case. It is the only thing Asgeir and I agree on. Filed.' },
        stol: { description: 'A three-legged wooden stool stands on a riverbank. It is empty.', observations: ['Three legs, no back.', 'No wear on the seat.', 'Distance to the water: short.'], fictionalVerdict: 'The stool is evidence that nobody is sitting. It is a document, but not for this case.' },
        spyd: { description: 'A long spear with an ash shaft and iron tip leans against a tree.', observations: ['The tip is sharp.', 'The shaft is straight.', 'It points.'], fictionalVerdict: 'The spear proves that the chieftain can point. That is not the same as pointing at an owner. Adjourned.' },
      },
    },

    vaerksted: {
      scene: 'Painting: a workshop with a workbench, pigments and a half-sooted stool on the table.',
      lead: 'Three choices, one fictional find. The result is marked as fiction, also when you download it. It is not historical evidence. It is not evidence of anything else either.',
      genstand: 'Object', fundsted: 'Find site', tilstand: 'Condition',
      valg: { genstand: [['skjold', 'Shield'], ['stol', 'Stool'], ['ske', 'Spoon']], fundsted: [['vad', 'The ford'], ['birk', 'The birch grove'], ['arkiv', 'The archive']], tilstand: [['sodet', 'Sooted'], ['mosgroet', 'Moss-grown'], ['velbevaret', 'Unusually well preserved']] },
      lav: 'Make the find', laver: 'The workshop is working. This may take half a minute …', koe: 'The find is queued ({n}) …',
      stempel: 'Fictional find from Tingsvad', proveniens: 'Provenance', hent: 'Download as image (with marking)',
      lukket: 'The workshop is closed: no image model is connected. No find can be invented today, and nothing is shown as if.',
      fejl: 'The workshop dropped the brush. Try again shortly.',
    },

    sagskontor: {
      scene: 'Painting: a wooden case office with trays, seals, an hourglass and a window onto the ford.',
      lead: 'Your stool application is processed here. It changes status even while your browser is closed. The next processing is shown below. It rarely holds.',
      trin: ['Received', 'Awaiting review', 'Returned to the beginning', 'Stool possibly available'],
      ingen: 'You have no case in progress. Apply for a stool via Toke’s stool configurator, or send an application from here.',
      ansoeg: 'Send stool application', sender: 'Creating the case …', valgLabel: 'Wishes for the stool (optional)', valgPlaceholder: 'E.g. backrest, wheels, heating',
      sagsnr: 'Case number', status: 'Status', naeste: 'Next processing expected', faerdig: 'The case has been processed. The stool is possibly available. Toke has been informed.',
      hent: 'Fetch status', henter: 'Fetching status …', senest: 'Last confirmed status (the network did not answer just now)',
      kode: 'Private retrieval code', kodeNote: 'Keep the code if you want to follow the case from another device or after clearing browser data. Without the code the case cannot be found again. It still exists; it is just you who cannot find it.',
      kodeInd: 'Have a retrieval code?', kodeKnap: 'Find the case', kodeFejl: 'No case with that code. It may be the code’s fault. It may be the case’s.',
      glem: 'Forget the case on this device',
      offline: 'The case office is not connected. Applications cannot be created, and there are no demo cases to show.',
      fraStol: 'The application from the stool configurator is ready to send.',
      oprettet: 'The case has been created and received. First processing is scheduled.',
    },

    brian: {
      scene: 'Painting: Mímir, a grey wolf, lies in an archive of scrolls and books with a lantern, looking out towards the ford.',
      lead: 'Mímir helps with the puzzle and with finding your way. He would rather not. You choose how much he reveals.',
      niveau: 'How much may Mímir reveal?', niveauer: [['hint', 'A small hint'], ['clearer', 'A clearer hint'], ['solution', 'Show the solution']],
      label: 'Your question for Mímir', placeholder: 'E.g.: Where is piece B?', spoerg: 'Ask Mímir', spoerger: 'Mímir is leafing through …',
      kendte: 'Mímir knows you have found {n} of 3 pieces. He uses that only to adjust his answer. He hands out no prizes.',
      kilde: 'Source in the archive', ingenKilde: 'I do not have that in the archive.',
      tomt: 'Ask a question. Or do not; then Mímir answers what you were going to ask.',
      gammel: 'The old Mímir button above still answers everything without being asked. This archive is for when you actually have a question.',
      eksempel: { answer: 'Noted. Page 2 lies in three pieces, and none of them lies where you are looking now. Start in the file access; there is something black you can press. I say no more at this level. That, unfortunately, makes it a case.', sources: ['Case file 8 · Supplement · The investigation'] },
    },

    radio: {
      scene: 'Painting: a wooden radio studio at the ford with two microphones, a blackboard and a red lamp above the door.',
      lead: 'Today’s broadcast from the ford. Reruns are due to a lack of developments in the case. The voice is synthetic, and all of it is fiction.',
      lampe: { on: 'On air', off: 'Off air', text: 'Script only' }, lampeNote: 'The lamp follows the player.',
      hent: 'Fetch today’s broadcast', henter: 'Fetching the broadcast …',
      manuskript: 'Script', udgave: 'Broadcast for {d}', ingen: 'No broadcast yet today. The network reads the paper first.',
      ingenLyd: 'There is no audio file for this broadcast yet. The script can be read.',
      lydFejl: 'The audio could not be played. The script remains.',
      tekstudgave: 'Text edition', stemme: 'Narrator: one synthetic voice. No real person’s voice has been cloned.',
      eksempel: { date: null, script: 'Good morning from the ford. This is Tingsvad Radio. The fog lies where it usually does.\n\nFirst item: The stool has been found vacant. The inquiry continues.\n\nSecond item: The auditor has rejected a set of accounts not yet submitted. The reason given is that it could happen.\n\nThat was all. The cow case is adjourned. We broadcast again tomorrow, if there is anyone.' },
    },
  },
};
;
/* ═══ kaede.js (assets/kilde/kaede.js) ═══ */
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
;
/* ═══ maskinpark.js (assets/kilde/maskinpark.js) ═══ */
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
;
/* ═══ ankre.js (assets/kilde/ankre.js) ═══ */
/* tingsvad.dk — ankre på tværs af undersider (runde 9).
   Fragmenter når aldrig serveren, så gamle links som /#gaestebog eller /#paafund-radio omdirigeres her
   til den underside, hvor elementet nu bor. Kun hvis målet ikke findes på den aktuelle side.
   SIDER og ID genereres af sagsregister.py ud fra assets/kanon.json og alle id'er i siderne (ret ikke i hånden);
   #sag-980-xxxx og #paafund-* har egne regler. */
(function () {
  const SIDER = {"forside":{"da":"/","en":"/en/"},"historien":{"da":"/historien/","en":"/en/history/"},"oplevelser":{"da":"/oplevelser/","en":"/en/experiences/"},"maskinparken":{"da":"/oplevelser/maskinparken/","en":"/en/experiences/machine-park/"},"undersoegelsen":{"da":"/oplevelser/undersoegelsen/","en":"/en/experiences/investigation/"},"gaestebog":{"da":"/oplevelser/gaestebog/","en":"/en/experiences/guestbook/"},"runevaerkstedet":{"da":"/oplevelser/runevaerkstedet/","en":"/en/experiences/rune-workshop/"},"sagsmappen":{"da":"/oplevelser/sagsmappen/","en":"/en/experiences/case-file/"},"stolen":{"da":"/oplevelser/stolen/","en":"/en/experiences/the-stool/"},"hittegods":{"da":"/oplevelser/hittegods/","en":"/en/experiences/lost-property/"},"kodegryden":{"da":"/oplevelser/kodegryden/","en":"/en/experiences/the-cauldron/"},"arkivet":{"da":"/arkivet/","en":"/en/archive/"},"sagsregister":{"da":"/arkivet/sagsregister/","en":"/en/archive/case-register/"},"maskinrummet":{"da":"/maskinrummet/","en":"/en/machine-room/"},"noedoevelser":{"da":"/maskinrummet/noedoevelser/","en":"/en/machine-room/emergency-drills/"},"revisionen":{"da":"/maskinrummet/revisionen/","en":"/en/machine-room/audit/"},"kortet":{"da":"/maskinrummet/kortet/","en":"/en/machine-room/map/"},"tal":{"da":"/maskinrummet/tal/","en":"/en/machine-room/numbers/"},"arkivskabet":{"da":"/maskinrummet/arkivskabet/","en":"/en/machine-room/archive-cabinet/"},"doeren":{"da":"/maskinrummet/doeren/","en":"/en/machine-room/the-door/"},"retssalen":{"da":"/oplevelser/maskinparken/retssalen/","en":"/en/experiences/machine-park/courtroom/"},"afstemningen":{"da":"/oplevelser/maskinparken/afstemningen/","en":"/en/experiences/machine-park/the-vote/"},"tidende":{"da":"/oplevelser/maskinparken/tidende/","en":"/en/experiences/machine-park/the-paper/"},"billedbevis":{"da":"/oplevelser/maskinparken/billedbevis/","en":"/en/experiences/machine-park/image-evidence/"},"bevisvaerkstedet":{"da":"/oplevelser/maskinparken/bevisvaerkstedet/","en":"/en/experiences/machine-park/evidence-workshop/"},"sagskontoret":{"da":"/oplevelser/maskinparken/sagskontoret/","en":"/en/experiences/machine-park/case-office/"},"mimirs-guide":{"da":"/oplevelser/maskinparken/mimirs-guide/","en":"/en/experiences/machine-park/mimirs-guide/"},"radio":{"da":"/oplevelser/maskinparken/radio/","en":"/en/experiences/machine-park/radio/"}};
  const ID = {"afgoer":"undersoegelsen","afgoer-knap":"undersoegelsen","afgoer-status":"undersoegelsen","afgoer-taelt":"undersoegelsen","alle":"oplevelser","arkitektur":"maskinrummet","arkitektur-h":"maskinrummet","arkiv-form":"arkivet","arkiv-q":"arkivet","arkiv-sml":"arkivet","arkiv-spoerg":"arkivet","arkiv-status":"arkivet","arkiv-svar":"arkivet","arkivskab":"arkivskabet","arkivskab-live":"arkivskabet","bevis":"undersoegelsen","borgen":"doeren","borgen-h":"doeren","brian-knap":"forside","brian-svar":"forside","brian-taelt":"forside","cert":"runevaerkstedet","cert-dl":"runevaerkstedet","cert-form":"runevaerkstedet","cert-navn":"runevaerkstedet","cert-note":"runevaerkstedet","cert-pq":"runevaerkstedet","cert-ud":"runevaerkstedet","crawlerne":"tal","crawlerne-live":"tal","danmark":"tal","danmark-live":"tal","doeren":"doeren","doeren-h":"doeren","doeren-maskineri":"doeren","doeren-selv":"doeren","doeren-tal":"doeren","dr-hvad":"doeren","drift":"historien","drift-liste":"historien","drift-log":"historien","drift-send":"historien","fakta":"arkivet","familien-zt":"doeren","fane-crawlerne":"tal","fane-danmark":"tal","fane-hastigheden":"tal","fane-vaernet":"tal","faq":"arkivet","fejltavle":"maskinrummet","forkl":"historien","forkl-hvem":"historien","forkl-knapper":"historien","forkl-svar":"historien","forkl-tekst":"historien","forklaringer":"historien","fremmoede":"runevaerkstedet","gaestebog":"gaestebog","galleri":"historien","gb-form":"gaestebog","gb-navn":"gaestebog","gb-sag":"gaestebog","gb-status":"gaestebog","gudrun-knap":"forside","hastighed-live":"tal","hastigheden":"tal","hero":"forside","historik":"arkivet","hittegods":"hittegods","hittegods-maskineri":"hittegods","hvad-h":"doeren","hvad-sker":"doeren","ikke-h":"arkivskabet","ikke-laast":"arkivskabet","infrakort":"kortet","intro":"doeren","kant-kort":"maskinrummet","klima":"historien","km-panel":"forside","km-panel-h":"forside","kodegryden":"kodegryden","kodegryden-maskineri":"kodegryden","koen-maskine":"maskinparken","kort-h":"forside","kortet":"forside","kortet-live":"kortet","kurve":"historien","lag-ai":"maskinrummet","lag-ai-kort":"maskinrummet","lag-beregning":"maskinrummet","lag-beregning-kort":"maskinrummet","lag-browser":"maskinrummet","lag-browser-kort":"maskinrummet","lag-data":"maskinrummet","lag-data-kort":"maskinrummet","lag-kant":"maskinrummet","lag-kant-kort":"maskinrummet","lag-levering":"maskinrummet","lag-levering-kort":"maskinrummet","lag-vaerktoej":"maskinrummet","lag-vaerktoej-kort":"maskinrummet","lagene":"arkivskabet","lagene-h":"arkivskabet","loven":"arkivskabet","loven-h":"arkivskabet","maaling-danmark":"tal","maaling-hastigheden":"tal","mappen":"sagsmappen","maskinrum-gitter":"maskinrummet","maskinrum-side":"maskinrummet","maskinrummet":"maskinrummet","mcp":"maskinrummet","metode-crawlerne":"tal","metode-crawlerne-h":"tal","metode-danmark":"tal","metode-danmark-h":"tal","metode-hastigheden":"tal","metode-hastigheden-h":"tal","metode-vaernet":"tal","metode-vaernet-h":"tal","mimir":"forside","moede":"maskinparken","moede-dato":"maskinparken","moede-form":"maskinparken","moede-svar":"maskinparken","net-svg":"historien","net-wrap":"historien","nettet":"historien","noedoevelser":"noedoevelser","noedoevelser-maskineri":"noedoevelser","noter":"arkivet","ordbog":"arkivet","personer":"historien","personer-sektion":"historien","praktisk":"arkivet","presse":"historien","protokol":"arkivet","r12-play":"forside","r12-radio-status":"forside","r12-titel":"forside","r5-faner":"undersoegelsen","r5-graatand":"arkivet","r5-grupper":"undersoegelsen","r5-hero-status":"forside","r5-kotolk":"undersoegelsen","r5-nulstil":"undersoegelsen","r5-nulstil-status":"undersoegelsen","r5-runepind":"runevaerkstedet","r6-kort":"maskinparken","radio-h":"forside","radio-tekst":"forside","ravn":"sagsmappen","ravnecentralen":"sagsmappen","ravnepost":"gaestebog","ravnepost-sektion":"gaestebog","revision-kort":"maskinrummet","revision-resume":"maskinrummet","revisionen":"revisionen","revisionen-ind":"revisionen","revisionen-maskineri":"revisionen","rune-ind":"runevaerkstedet","rune-kopi":"runevaerkstedet","rune-svg":"runevaerkstedet","rune-ud":"runevaerkstedet","runer-fakta":"runevaerkstedet","sager":"gaestebog","sager-aeldre":"gaestebog","sager-nav":"gaestebog","sager-nyere":"gaestebog","sager-side":"gaestebog","sagn":"historien","sagsmappe":"sagsmappen","sagsregister":"sagsregister","sagsudvalg":"arkivet","selskab-h":"forside","skjoldet":"historien","skjoldmoeen":"historien","slaegt":"historien","steder":"forside","stedet":"historien","stolen":"stolen","stolen-maskineri":"stolen","taelle":"maskinrummet","tal-h":"doeren","tingets-tilstand":"forside","udsat-stempel":"undersoegelsen","udsendelse":"forside","undersoeg":"undersoegelsen","vaernet":"tal","vaernet-live":"tal","vagt-crawlerne":"tal","vagt-vaernet":"tal","varsel":"forside","vedtaegter":"arkivet","vejen":"maskinrummet","vent-h":"forside","zt-h":"doeren","oplev":"oplevelser","prov":"oplevelser","arkiv":"arkivet"};
  const lang = document.documentElement.lang === 'en' ? 'en' : 'da';
  function side(id) {
    if (/^sag-/.test(id)) return 'gaestebog';
    if (/^paafund-/.test(id)) return 'maskinparken';
    if (/^r5-/.test(id) && !ID[id]) return 'undersoegelsen';
    return ID[id];
  }
  function maal(hash) {
    const id = decodeURIComponent((hash || '').slice(1));
    if (!id || document.getElementById(id)) return null;
    const k = side(id); if (!k || !SIDER[k]) return null;
    const p = SIDER[k][lang];
    return p === location.pathname ? null : p + '#' + encodeURIComponent(id).replace(/%2D/g, '-');
  }
  // Runde 13: filen ligger i bundtet tingsvad.js før sidens egne scripts, så første tjek venter til DOM'en (og de deferrede scripts) er færdige.
  const foerste = () => { const nu = maal(location.hash); if (nu) location.replace(nu); };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', foerste); else foerste();
  addEventListener('hashchange', () => { const m = maal(location.hash); if (m) location.replace(m); });
  document.addEventListener('click', e => {
    const a = e.target.closest && e.target.closest('a[href^="#"]'); if (!a || e.defaultPrevented) return;
    const m = maal(a.getAttribute('href')); if (m) { e.preventDefault(); location.href = m; }
  }, true);
})();
;
