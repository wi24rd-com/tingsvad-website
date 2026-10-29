/* tingsvad.dk — alt det levende. Tekster slås op i T[lang]. */
/* Fejlopsamling til Revisionen (runde 9): JS-fejl på siden gemmes i window.__tvFejl, som Gudruns daglige snapshot læser. Ingen data forlader browseren. */
(function () { const f = window.__tvFejl = window.__tvFejl || []; const add = m => { if (f.length < 10) f.push(String(m).slice(0, 200)); };
  // Kun sitets egne filer: fremmede scripts (Turnstile, Web Analytics) giver det anonyme "Script error." uden filnavn, og det er ikke tingets fejl.
  addEventListener('error', e => { if (!e.filename || !e.filename.startsWith(location.origin)) return; add((e.message || 'error') + ' @ ' + e.filename.split('/').pop().split('?')[0] + ':' + e.lineno); });
  addEventListener('unhandledrejection', e => add('promise: ' + (e.reason && e.reason.message || e.reason))); })();
(function () {
  const lang = document.documentElement.lang === 'en' ? 'en' : 'da';
  const T = {
    da: {
      udsat: 'Udsat.', stadig: '…stadig udsat.', nej: 'Nej.', kvak: 'Kvak.',
      aar: 'år', mdr: 'måneder', dage: 'dage', timer: 'timer', min: 'minutter', sek: 'sekunder',
      sidenUdsat: 'Sagen om koen har været udsat i', sidenAfg: 'Dage siden tinget sidst afgjorde en sag:',
      dagens: 'Dagens udsættelse',
      taage: [
        ['fog', 'Tæt tåge', 'Tinget mødes ikke. Koen er ikke synlig for andre enheder.'],
        ['fog', 'Meget tæt tåge', 'Tinget mødes ikke. Asgeir har ikke kunnet finde sin sten.'],
        ['haze', 'Tåge med let dis', 'Tinget mødes ikke. Halvdan er mødt op alligevel, til eventuelt.'],
        ['fog', 'Tåge', 'Tinget mødes ikke. Mímir har ført det til protokols.'],
        ['haze', 'Tyk tåge, opklarende mod aften', 'Tinget overvejer at mødes. Overvejelsen er udsat.'],
        ['fog', 'Tåge fra åen', 'Tinget mødes ikke. Gudrun har set koen. Koen har set Gudrun.'],
        ['haze', 'Tåge, stedvis sigtbarhed til den fjerde sten', 'Tinget mødes ikke. Toke har ikke sat sig.'],
      ],
      sommer: ['sun', 'Sommer', 'Tågen er lettet. Tinget overvejer det. Mødet er udsat til tågen er tilbage.'],
      varselM: 'Tågevarsel for vadestedet i dag',
      fogKnap: ['Tilkald tågen', 'Send tågen til udvalget'], fogStatus: ['Tåge: fra. Koen har ingen yderligere kommentarer.', 'Tåge: til. Sigtbarheden er nu et administrativt spørgsmål.'], fogLet: 'Let tågen', fogSr: 'Tågen er lagt ud over siden. Tryk et sted, eller på Esc, for at lette den.',
      taelt: 'Mímir er blevet spurgt {n} gange. Svar: {u} udsat, {s} stadig udsat, {k} nej.',
      gbTom: 'Ingen sager endnu. Din kan blive den første, der udsættes.',
      gbFejl: 'Nettet svarer ikke. Beskeden er sendt nedstrøms. Prøv igen om lidt.',
      gbSendt: 'Sagen er modtaget og udsat. Sagsnummer {nr}.',
      gbSender: 'Sender sagen gennem runestenene…',
      gbKort: 'Skriv lidt mere – tinget udsætter kun sager, der findes.',
      status: 'Udsat',
      kurveTitel: 'Tågedage pr. år ved vadestedet, 980–2026', kurveNote: '1572: åen tørrede ud. Tågen blev. Tinget stod.',
      tema: ['Mørk', 'Lys'], temaHjaelp: ['Skift til mørkt tema', 'Skift til lyst tema'],
    },
    en: {
      udsat: 'Adjourned.', stadig: '…still adjourned.', nej: 'No.', kvak: 'Honk.',
      aar: 'years', mdr: 'months', dage: 'days', timer: 'hours', min: 'minutes', sek: 'seconds',
      sidenUdsat: 'The case of the cow has been adjourned for', sidenAfg: 'Days since the thing last decided a case:',
      dagens: 'Today\'s adjournment',
      taage: [
        ['fog', 'Dense fog', 'The thing does not meet. The cow is not visible to other devices.'],
        ['fog', 'Very dense fog', 'The thing does not meet. Asgeir could not find his stone.'],
        ['haze', 'Fog with light haze', 'The thing does not meet. Halvdan turned up anyway, for any other business.'],
        ['fog', 'Fog', 'The thing does not meet. Mímir has entered it into the minutes.'],
        ['haze', 'Thick fog, clearing towards evening', 'The thing considers meeting. The consideration is adjourned.'],
        ['fog', 'Fog off the river', 'The thing does not meet. Gudrun has seen the cow. The cow has seen Gudrun.'],
        ['haze', 'Fog, visibility to the fourth stone in places', 'The thing does not meet. Toke has not sat down.'],
      ],
      sommer: ['sun', 'Summer', 'The fog has lifted. The thing is considering it. The meeting is adjourned until the fog returns.'],
      varselM: 'Fog forecast for the ford today',
      fogKnap: ['Summon the fog', 'Refer the fog to the committee'], fogStatus: ['Fog: off. The cow has no further comment.', 'Fog: on. Visibility is now an administrative matter.'], fogLet: 'Lift the fog', fogSr: 'The fog covers the page. Tap anywhere, or press Esc, to lift it.',
      taelt: 'Mímir has been asked {n} times. Answers: {u} adjourned, {s} still adjourned, {k} no.',
      gbTom: 'No cases yet. Yours could be the first to be adjourned.',
      gbFejl: 'The network is not responding. The message was sent downstream. Try again shortly.',
      gbSendt: 'Your case has been received and adjourned. Case number {nr}.',
      gbSender: 'Sending the case through the runestones…',
      gbKort: 'Write a little more – the thing only adjourns cases that exist.',
      status: 'Adjourned',
      kurveTitel: 'Foggy days per year at the ford, 980–2026', kurveNote: '1572: the river dried up. The fog stayed. The thing stood.',
      tema: ['Dark', 'Light'], temaHjaelp: ['Switch to dark theme', 'Switch to light theme'],
    }
  }[lang];
  const $ = s => document.querySelector(s), $$ = s => document.querySelectorAll(s);
  const base2 = (document.querySelector('link[rel="stylesheet"][href*="site.css"]').getAttribute('href').split('site.css')[0]);
  const PORT = { asgeir: 'asgeir', toke: 'toke', høvdingen: 'hoevdingen', 'the chieftain': 'hoevdingen', chieftain: 'hoevdingen', ulf: 'ulf', ravn: 'ravn', halvdan: 'halvdan', bjørn: 'bjoern', brian: 'brian', gudrun: 'gudrun', ragnhild: 'ragnhild', koen: null, 'the cow': null, tågen: null, 'the fog': null };
  const portræt = (navn, px) => { const t = ' ' + navn.toLowerCase().replace(/[,.:;]/g, ' ') + ' '; if (/\b(koen|the cow|skjoldet|the shield|tågen|the fog|alle|everyone)\b/.test(t)) return ''; const k = Object.keys(PORT).find(k => t.includes(' ' + k + ' ') || t.includes(' ' + k + 's ')); const f = k ? PORT[k] : null; return f ? `<img src="${base2}pak/portraetter/${f}${px ? '-128' : ''}.webp" alt="" width="${px ? 128 : 512}" height="${px ? 128 : 512}" loading="lazy">` : ''; };
  window.tingsvadPortraet = portræt;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const store = { get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }, set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} } };

  /* ── Persongalleri ── */
  const spots = $$('.spot'), rows = $$('#personer li');
  function vis(p) {
    spots.forEach(s => s.setAttribute('aria-pressed', String(s.dataset.p === p)));
    rows.forEach(r => r.classList.toggle('aktiv', r.dataset.p === p));
    const r = $('#personer li[data-p="' + p + '"]');
    if (r) r.scrollIntoView({ block: 'nearest', behavior: reduce ? 'auto' : 'smooth' });
  }
  spots.forEach(s => s.addEventListener('click', () => vis(s.dataset.p)));
  rows.forEach(r => r.addEventListener('mouseenter', () => spots.forEach(s => s.setAttribute('aria-pressed', String(s.dataset.p === r.dataset.p)))));

  /* ── Presse-avatarer ── */
  $$('.presse cite').forEach(c => { const im = window.tingsvadPortraet(c.textContent, true); if (im) c.insertAdjacentHTML('afterbegin', im); });

  /* ── Tema: Lys / Mørk (»tåge« betyder kun tågeeffekten) ── */
  const temaKnap = $('#tema');
  function saetTema(t) {
    if (t) document.documentElement.setAttribute('data-theme', t); else document.documentElement.removeAttribute('data-theme');
    const erLys = t === 'light' || (!t && matchMedia('(prefers-color-scheme: light)').matches);
    if (temaKnap) { temaKnap.querySelector('span').textContent = erLys ? T.tema[0] : T.tema[1]; temaKnap.setAttribute('aria-label', erLys ? T.temaHjaelp[0] : T.temaHjaelp[1]); temaKnap.title = erLys ? T.temaHjaelp[0] : T.temaHjaelp[1]; }
  }
  saetTema(store.get('tema'));
  if (temaKnap) temaKnap.addEventListener('click', () => {
    const erLys = document.documentElement.getAttribute('data-theme') === 'light' || (!document.documentElement.getAttribute('data-theme') && matchMedia('(prefers-color-scheme: light)').matches);
    const ny = erLys ? 'dark' : 'light'; store.set('tema', ny); saetTema(ny);
  });

  /* ── Tællere ── */
  // Datoer og definitioner kommer fra én kilde: assets/kanon.json (læses også af Workeren). Tallene herunder er kun reserve, til filen er hentet.
  let START = new Date(Date.UTC(980, 5, 21, 6, 0, 0)); // midsommer 980, ved daggry
  let SIDSTE = new Date(Date.UTC(1996, 2, 1)); // seneste afgørelse: domænet, 90'erne
  // Tingets alder i hele år, regnet fra tingets sætning (kanon: tingSat.iso, midsommer 980) – samme regel som tælleren på forsiden
  // og Workerens aarSiden(). Bruges af alle figurreplikker, så intet tal skal rettes; det skifter ved midsommer, ikke ved nytår.
  // tvAar() → tal, tvAar('da'|'en') → formateret. START er reserven, til kanon.json er hentet (samme værdi).
  window.tvAar = l => {
    const nu = new Date(), s = new Date(START.getTime()); s.setUTCFullYear(nu.getUTCFullYear());
    const n = nu.getUTCFullYear() - START.getUTCFullYear() - (nu < s ? 1 : 0);
    return l ? n.toLocaleString(l === 'da' ? 'da-DK' : 'en-GB') : n;
  };
  const kanonV = ((document.querySelector('script[src*="assets/site.js"]') || {}).src || '').split('v=')[1] || String(Date.now() / 6e5 | 0);
  fetch('/assets/kanon.json?v=' + kanonV).then(r => r.ok ? r.json() : null).then(K => {
    if (!K) return;
    window.TINGSVAD_KANON = K;
    if (K.tingSat && K.tingSat.iso) { const d = new Date(K.tingSat.iso); if (!isNaN(d)) START = d; }
    if (K.sidsteAfgoerelse) { const d = new Date(K.sidsteAfgoerelse + 'T00:00:00Z'); if (!isNaN(d)) SIDSTE = d; }
    const fmt = n => n.toLocaleString(lang === 'da' ? 'da-DK' : 'en-GB');
    const v = { aar: window.tvAar(lang), afgjorte: fmt((K.afgoerelser || []).length), taage: fmt(K.taageDageOmAaret), sommer: fmt(K.sommerHverNteDag) };
    document.querySelectorAll('[data-kanon]').forEach(el => { const x = v[el.getAttribute('data-kanon')]; if (x != null) el.textContent = x; });
    tik();
  }).catch(() => {});
  const tEl = $('#taeller-udsat'), dEl = $('#taeller-dage');
  function pad(n) { return String(n); }
  function tik() {
    const nu = new Date();
    if (tEl) {
      let y = nu.getUTCFullYear() - START.getUTCFullYear(), m = nu.getUTCMonth() - START.getUTCMonth(), d = nu.getUTCDate() - START.getUTCDate();
      if (d < 0) { m--; d += new Date(nu.getUTCFullYear(), nu.getUTCMonth(), 0).getDate(); }
      if (m < 0) { y--; m += 12; }
      const h = nu.getUTCHours(), mi = nu.getUTCMinutes(), s = nu.getUTCSeconds();
      tEl.innerHTML = `${T.sidenUdsat} <b>${y.toLocaleString(lang === 'da' ? 'da-DK' : 'en-GB')}</b> ${T.aar}, <b>${m}</b> ${T.mdr}, <b>${d}</b> ${T.dage}, <b>${h}</b> ${T.timer}, <b>${mi}</b> ${T.min} ${lang === 'da' ? 'og' : 'and'} <b>${pad(s)}</b> ${T.sek}.`;
    }
    if (dEl) dEl.innerHTML = `${T.sidenAfg} <b>${Math.floor((nu - SIDSTE) / 864e5).toLocaleString(lang === 'da' ? 'da-DK' : 'en-GB')}</b>`;
  }
  tik(); setInterval(tik, 1000);

  /* ── Dagens udsættelse + tågevarsel (seedet på dato) ── */
  const nu = new Date(), dagNr = Math.floor(Date.UTC(nu.getFullYear(), nu.getMonth(), nu.getDate()) / 864e5);
  function seed(n) { let x = Math.sin(n * 9301 + 49297) * 233280; return x - Math.floor(x); }
  const dagens = $('#dagens');
  if (dagens) {
    const linjer = [...$$('.protokol tbody tr')].map(tr => { const td = tr.querySelectorAll('td'); return td.length === 3 ? [td[0].textContent.trim(), td[1].textContent.trim()] : null; }).filter(Boolean);
    if (linjer.length) { const l = linjer[Math.floor(seed(dagNr) * linjer.length)]; dagens.innerHTML = `<b style="text-transform:uppercase;letter-spacing:.06em;font-family:var(--mono);font-style:normal;font-size:.7rem">${esc(T.dagens)} · ${esc(l[0])}</b><br>${esc(l[1])}`; }
  }
  const varsel = $('#varsel');
  const IK = {
    fog: '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M6 18h22M14 25h28M6 32h30M18 39h20" opacity=".9"/><path d="M10 11h16" opacity=".45"/></svg>',
    haze: '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><circle cx="30" cy="15" r="6" opacity=".9"/><path d="M6 26h30M12 33h30M6 40h24" opacity=".9"/><path d="M30 4v3M41 15h3M38 7l-2 2" opacity=".6"/></svg>',
    sun: '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><circle cx="24" cy="24" r="8"/><path d="M24 4v6M24 38v6M4 24h6M38 24h6M9.9 9.9l4.2 4.2M33.9 33.9l4.2 4.2M9.9 38.1l4.2-4.2M33.9 14.1l4.2-4.2"/></svg>'
  };
  let varselKey = 'fog';
  if (varsel) {
    const sommer = dagNr % 53 === 0;
    const v = sommer ? T.sommer : T.taage[Math.floor(seed(dagNr + 7) * T.taage.length)];
    varselKey = v[0];
    varsel.innerHTML = `<div class="ikon" aria-hidden="true">${IK[v[0]] || IK.fog}</div><div><span class="m">${T.varselM} · ${nu.toLocaleDateString(lang === 'da' ? 'da-DK' : 'en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}</span><b>${v[1]}</b><span>${v[2]}</span></div>`;
  }
  // Stenknappen tilkalder sidens tåge (hele skærmen); »Let tågen«, klik på tågen eller Esc letter den igen. Én tågetilstand.
  // Sidens tågelag (bruges af Ragnhild-optrinnet i runde 3 via body.i-taage)
  const taage = document.createElement('div'); taage.className = 'taage'; taage.setAttribute('aria-hidden', 'true');
  taage.innerHTML = '<div class="lag l1"></div><div class="lag l2"></div><div class="lag l3"></div><div class="lag l4"></div>';
  // Sømløs tågetekstur: sum af sinusbølger med heltallige frekvenser på en torus = ingen flisekanter.
  function tageTekstur(size, seedN) {
    const c = document.createElement('canvas'); c.width = c.height = size; const g = c.getContext('2d');
    const img = g.createImageData(size, size), d = img.data; let r = seedN;
    const rnd = () => (r = (r * 16807) % 2147483647) / 2147483647;
    const waves = []; for (let i = 0; i < 14; i++) { const f = 1 + Math.floor(rnd() * 4); waves.push([f * (rnd() < .5 ? 1 : -1), 1 + Math.floor(rnd() * 4), rnd() * Math.PI * 2, 1 / (1 + i * .35)]); }
    const TAU = Math.PI * 2; let mn = 9, mx = -9; const v = new Float32Array(size * size);
    for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
      let a = 0; for (const [fx, fy, ph, w] of waves) a += Math.sin((x / size) * TAU * fx + (y / size) * TAU * fy + ph) * w;
      v[y * size + x] = a; if (a < mn) mn = a; if (a > mx) mx = a;
    }
    for (let i = 0; i < size * size; i++) { let t = (v[i] - mn) / (mx - mn); t = Math.pow(t, 1.6); d[i * 4] = 214; d[i * 4 + 1] = 217; d[i * 4 + 2] = 212; d[i * 4 + 3] = Math.round(t * 255); }
    g.putImageData(img, 0, 0); return c.toDataURL('image/png');
  }
  window.tingsvadTekstur = tageTekstur;
  try {
    taage.querySelector('.l1').style.backgroundImage = `url(${tageTekstur(256, 7)})`;
    taage.querySelector('.l2').style.backgroundImage = `url(${tageTekstur(256, 42)})`;
    taage.querySelector('.l4').style.backgroundImage = `url(${tageTekstur(192, 99)})`;
  } catch (e) {}
  const letKnap = document.createElement('button'); letKnap.type = 'button'; letKnap.className = 'knap let-taagen'; letKnap.textContent = T.fogLet; letKnap.hidden = true;
  document.body.append(taage, letKnap);
  const sr = document.createElement('div'); sr.className = 'sr-only'; sr.setAttribute('aria-live', 'polite'); document.body.append(sr);
  const fogKnapper = $$('[data-fog-toggle]'), fogStatus = $$('[data-fog-status]');
  function saetTaage(on) {
    document.body.classList.toggle('i-taage', on);
    taage.classList.toggle('taet', varselKey === 'fog'); taage.classList.toggle('let', varselKey === 'sun');
    letKnap.hidden = !on;
    for (const k of fogKnapper) { k.setAttribute('aria-pressed', String(on)); k.textContent = T.fogKnap[on ? 1 : 0]; }
    for (const st of fogStatus) st.textContent = T.fogStatus[on ? 1 : 0];
    sr.textContent = on ? T.fogSr : '';
    if (on) letKnap.focus({ preventScroll: true });
  }
  for (const k of fogKnapper) { k.hidden = false; k.addEventListener('click', () => saetTaage(!document.body.classList.contains('i-taage'))); }
  for (const st of fogStatus) st.textContent = T.fogStatus[0];
  letKnap.addEventListener('click', () => saetTaage(false));
  taage.addEventListener('click', () => saetTaage(false));
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && document.body.classList.contains('i-taage')) saetTaage(false); });

  /* ── Op/ned-pile i højre side: én skærm ad gangen. Scrollbaren er desuden altid synlig (CSS). ── */
  (function () {
    if (matchMedia('(pointer: coarse)').matches || innerWidth <= 700 || document.querySelector('.rul')) return;
    const rul = document.createElement('div'); rul.className = 'rul';
    const pil = (op) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${op ? 'M12 19V5M5 12l7-7 7 7' : 'M12 5v14M19 12l-7 7-7-7'}"/></svg>`;
    const lbl = lang === 'da' ? ['Rul en skærm op', 'Rul en skærm ned'] : ['Scroll one screen up', 'Scroll one screen down'];
    rul.innerHTML = `<button type="button" data-rul="-1" aria-label="${lbl[0]}" title="${lbl[0]}">${pil(true)}</button><button type="button" data-rul="1" aria-label="${lbl[1]}" title="${lbl[1]}">${pil(false)}</button>`;
    document.body.append(rul);
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    rul.addEventListener('click', e => { const b = e.target.closest('[data-rul]'); if (!b) return; scrollBy({ top: innerHeight * .85 * +b.dataset.rul, behavior: reduce ? 'auto' : 'smooth' }); });
    const [op, ned] = rul.querySelectorAll('button');
    const opd = () => { op.disabled = scrollY < 4; ned.disabled = scrollY + innerHeight >= document.documentElement.scrollHeight - 4; };
    addEventListener('scroll', opd, { passive: true }); addEventListener('resize', opd); opd();
  })();

  /* ── Mobilmenuen i topbaren (runde 10): lukker ved Escape, klik udenfor og valg af en side ── */
  (function () {
    const m = $('.mobilmenu'); if (!m) return;
    const luk = () => { if (m.open) m.open = false; };
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && m.open) { luk(); m.querySelector('summary').focus(); } });
    document.addEventListener('click', e => { if (m.open && !m.contains(e.target)) luk(); });
    m.addEventListener('click', e => { if (e.target.closest('.mobilmenu-liste a')) luk(); });
  })();

  /* ── Lag og kort (runde 12, maskinrummet og revisionen): hvert .mr-lag folder sine kort ud for sig;
     hvert kort har fast højde og »Læs mere«, når teksten er længere. Delegeret, så kort tegnet senere også virker. ── */
  (function () {
    const DA = document.documentElement.lang !== 'en';
    function maal(g) {
      if (!g) return; g.classList.add('mr-klar');
      g.querySelectorAll(':scope > article').forEach(a => {
        const p = a.querySelector('p'); if (!p) return;
        let k = a.querySelector('.mr-mere');
        if (!k) { k = document.createElement('button'); k.type = 'button'; k.className = 'mr-mere'; k.setAttribute('aria-expanded', 'false'); k.textContent = DA ? 'Læs mere' : 'Read more'; a.appendChild(k); }
        if (a.classList.contains('aaben')) return;
        const lang = p.scrollHeight > p.clientHeight + 2;
        k.classList.toggle('mr-mere-tom', !lang); k.tabIndex = lang ? 0 : -1; k.setAttribute('aria-hidden', String(!lang)); a.classList.toggle('mr-lang', lang);
      });
    }
    function saetLag(l, on) {
      const k = l && l.querySelector('.mr-lag-knap'); if (!k) return; const g = document.getElementById(k.getAttribute('aria-controls')); if (!g) return;
      g.hidden = !on; k.setAttribute('aria-expanded', String(on)); k.textContent = on ? k.dataset.luk : k.dataset.aaben; l.classList.toggle('aaben', on); if (on) maal(g);
    }
    document.addEventListener('click', e => {
      const t = e.target.closest && e.target.closest('.mr-lag-knap, .mr-mere'); if (!t) return;
      if (t.classList.contains('mr-lag-knap')) return saetLag(t.closest('.mr-lag'), t.getAttribute('aria-expanded') !== 'true');
      const a = t.closest('article'), on = !a.classList.contains('aaben');
      a.classList.toggle('aaben', on); t.setAttribute('aria-expanded', String(on)); t.textContent = on ? (DA ? 'Fold sammen' : 'Show less') : (DA ? 'Læs mere' : 'Read more');
      if (!on && a.getBoundingClientRect().top < 0) a.scrollIntoView({ block: 'start' });
    });
    let rt; addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(() => document.querySelectorAll('.mr-lag.aaben .maskinrum').forEach(maal), 150); });
    window.tvFold = { saetLag, maal };
  })();

  /* ── Tilbage-knappen (runde 12): tilbage til den side, man faktisk kom fra. En lille stak i sessionStorage følger
     gæstens vej på sitet (også ved browserens egen tilbage-knap); uden historik står knappen som før: »Tilbage til kortet«.
     Øverst i brødkrummen på alle undersider og nederst på lange sider. ── */
  (function () {
    const top = document.querySelector('.r12s-krumme .r12s-tilbage'); if (!top) return;
    const DA = document.documentElement.lang !== 'en', KEY = 'tv-vej';
    const navnHer = () => { const c = document.querySelector('.r12s-krumme [aria-current="page"]'); if (c) return c.textContent.trim(); const h = document.querySelector('h1'); return (h ? h.textContent : document.title.split(' · ')[0]).trim(); };
    const her = { u: location.pathname + location.search, n: navnHer() };
    let vej = [];
    try { vej = JSON.parse(sessionStorage.getItem(KEY) || '[]'); if (!Array.isArray(vej)) vej = []; } catch (e) { vej = []; }
    vej = vej.filter(x => x && typeof x.u === 'string' && /^\/(?![\/\\])/.test(x.u) && typeof x.n === 'string');
    if (vej.length > 1 && vej[vej.length - 2].u === her.u) vej.pop();            // gæsten gik tilbage
    else if (!vej.length || vej[vej.length - 1].u !== her.u) vej.push(her);       // ny side (en genindlæsning ændrer intet)
    vej[vej.length - 1] = her; vej = vej.slice(-30);
    try { sessionStorage.setItem(KEY, JSON.stringify(vej)); } catch (e) { }
    // forsiden gemmes af forsidens eget kald nedenfor; her bruges kun det, der står i stakken
    const maal = vej.length > 1 ? vej[vej.length - 2] : null;
    const fraRef = (() => { try { const r = new URL(document.referrer); return r.origin === location.origin ? r.pathname + r.search : ''; } catch (e) { return ''; } })();
    const href = maal ? (maal.u === '/' || maal.u === '/en/' ? maal.u + '#kortet' : maal.u) : top.getAttribute('href');
    const tekst = maal ? (DA ? 'Tilbage til ' : 'Back to ') + (maal.u === '/' || maal.u === '/en/' ? (DA ? 'kortet' : 'the map') : maal.n) : top.textContent.replace(/^[\s←]+/, '');
    const lav = a => { a.href = href; a.innerHTML = `<span class="tv-pil" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5M11 6l-6 6 6 6"/></svg></span><span class="tv-tilbage-tekst"></span>`; a.querySelector('.tv-tilbage-tekst').textContent = tekst; a.classList.add('tv-tilbage'); };
    lav(top);
    const klik = e => { if (maal && fraRef === maal.u && history.length > 1 && !e.metaKey && !e.ctrlKey && !e.shiftKey) { e.preventDefault(); history.back(); } }; // samme side som lige før: browserens tilbage bevarer rullepositionen
    top.addEventListener('click', klik);
    // nederst, når siden er lang (mere end to en halv skærmhøjde)
    const bund = () => {
      if (document.querySelector('.tv-tilbage-bund') || (!document.body.hasAttribute('data-tilbage-bund') && document.documentElement.scrollHeight < innerHeight * 2.5)) return; // data-tilbage-bund: altid (fx maskinrummets statistiksider, der kan være korte, før tallene kommer)
      const nav = document.createElement('nav'); nav.className = 'tv-tilbage-bund gutter'; nav.setAttribute('aria-label', DA ? 'Tilbage' : 'Back');
      const a = document.createElement('a'); a.className = 'r12s-tilbage'; lav(a); a.addEventListener('click', klik); nav.appendChild(a);
      const op = document.createElement('a'); op.className = 'tv-til-toppen'; op.href = '#top'; op.textContent = DA ? 'Til toppen ↑' : 'Back to top ↑'; nav.appendChild(op);
      const foer = document.querySelector('.r12s-afslut, .tv-graense') || document.querySelector('body > footer, footer.fod, footer'); // en grafisk kant over footeren (fx Værnet) bliver liggende nederst
      if (foer) foer.parentNode.insertBefore(nav, foer); else document.body.appendChild(nav);
    };
    if (document.readyState === 'complete') bund(); else addEventListener('load', bund);
    addEventListener('tv:indhold', bund); // sider, der først tegner deres indhold efter load (fx Værnet og Crawlerne)
  })();
  // Forsiden tæller med i vejen, så »Tilbage« fra en underside kan føre til kortet
  if (document.body.dataset.side === 'forside') { try { const KEY = 'tv-vej', u = location.pathname; let v = JSON.parse(sessionStorage.getItem(KEY) || '[]'); if (!Array.isArray(v)) v = []; if (v.length > 1 && v[v.length - 2].u === u) v.pop(); else if (!v.length || v[v.length - 1].u !== u) v.push({ u, n: document.documentElement.lang === 'en' ? 'The ford' : 'Vadestedet' }); sessionStorage.setItem(KEY, JSON.stringify(v.slice(-30))); } catch (e) { } }

  /* ── Spørg Mímir ── */
  const bk = $('#brian-knap'), bs = $('#brian-svar'), bt = $('#brian-taelt');
  if (bk && bs) {
    let n = +(store.get('brian-n') || 0);
    const tael = () => { const k = Math.floor(n / 100), s = Math.floor(n / 10) - k, u = n - s - k; if (bt) bt.textContent = T.taelt.replace('{n}', n).replace('{u}', u).replace('{s}', s).replace('{k}', k); };
    tael();
    bk.addEventListener('click', () => {
      n++; store.set('brian-n', n);
      bs.textContent = n % 100 === 0 ? T.nej : n % 10 === 0 ? T.stadig : T.udsat;
      bs.classList.remove('ny'); void bs.offsetWidth; bs.classList.add('ny'); tael();
    });
    const gk = $('#gudrun-knap'); if (gk) gk.addEventListener('click', () => { bs.textContent = T.kvak; bs.classList.remove('ny'); void bs.offsetWidth; bs.classList.add('ny'); });
  }

  /* ── Skriv "ko": koen galopperer over skærmen ── */
  let buf = '';
  document.addEventListener('keydown', e => {
    if (e.target.matches('input, textarea')) return;
    buf = (buf + e.key.toLowerCase()).slice(-3);
    if ((buf.endsWith('ko') || buf.endsWith('cow'.slice(-2))) && !$('.ko-galop.kor')) {
      if (reduce) return;
      const el = document.createElement('div'); el.className = 'ko-galop'; el.setAttribute('aria-hidden', 'true');
      const base = document.querySelector('link[rel="stylesheet"][href*="site.css"]').getAttribute('href').replace('site.css', '');
      el.innerHTML = `<img src="${base}ko-galop.png" alt="">`; document.body.appendChild(el);
      requestAnimationFrame(() => el.classList.add('kor')); setTimeout(() => el.remove(), 5000); buf = '';
    }
  });

  /* ── Tågekurve med tidslinje ── */
  const kurve = $('#kurve');
  if (kurve) {
    const W = 760, H = 240, L = 46, R = 16, Tp = 28, B = 34, y0 = 980, y1 = 2026;
    const x = yr => L + (yr - y0) / (y1 - y0) * (W - L - R), y = v => Tp + (1 - v / 365) * (H - Tp - B);
    const vaerdi = yr => yr === 1572 ? 11 : (yr === 1571 || yr === 1573) ? 300 : 312 + Math.round(Math.sin(yr * 1.7) * 2 + Math.cos(yr * .37) * 1.5);
    let pts = []; for (let yr = y0; yr <= y1; yr++) pts.push([x(yr), y(vaerdi(yr))]);
    const d = pts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' ');
    const ticks = [980, 1200, 1400, 1600, 1800, 2026];
    // Protokollens linjer → årstal
    const aarAf = t => { t = t.toLowerCase(); if (t.includes('erne')) return 1995; const m = t.match(/\d{3,4}/); return m ? +m[0] : null; };
    const poster = [...$$('.protokol tbody tr')].map(tr => { const td = tr.querySelectorAll('td'); const yr = aarAf(td[0].textContent); return yr ? { yr, label: td[0].textContent.trim(), tekst: td[1].textContent.trim(), afg: td[2].textContent.trim(), cls: td[2].className } : null; }).filter(Boolean);
    const dag = lang === 'da' ? ['Tågedage','Træk i tidslinjen, eller hold musen over grafen','Ingen post i protokollen. Tågen var der.'] : ['Foggy days','Drag the timeline, or hover over the chart','No entry in the minutes. The fog was there.'];
    kurve.innerHTML = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${T.kurveTitel}">
      <text x="${L}" y="16" style="font-size:12px;fill:var(--mist)">${T.kurveTitel}</text>
      ${[0, 100, 200, 312, 365].map(v => `<line class="akse" x1="${L}" x2="${W - R}" y1="${y(v)}" y2="${y(v)}"/><text x="${L - 6}" y="${y(v) + 4}" text-anchor="end">${v}</text>`).join('')}
      ${ticks.map(t => `<text x="${x(t)}" y="${H - 10}" text-anchor="middle">${t}</text>`).join('')}
      <path class="flade" d="${d} L${x(y1)} ${y(0)} L${x(y0)} ${y(0)} Z"/><path class="linje" d="${d}"/>
      ${poster.map(p => `<circle class="post" data-yr="${p.yr}" cx="${x(p.yr)}" cy="${y(vaerdi(p.yr))}" r="4"><title>${esc2(p.label)}</title></circle>`).join('')}
      <circle class="pkt" cx="${x(1572)}" cy="${y(11)}" r="4"/>
      <text class="note" x="${x(1572) + 10}" y="${y(11) - 6}">${T.kurveNote}</text>
      <g class="markoer"><line x1="0" x2="0" y1="${Tp}" y2="${y(0)}"/><circle r="6" cx="0" cy="0"/><text y="${y(0) - 8}" text-anchor="middle"></text></g>
      <rect class="fang" x="${L}" y="${Tp}" width="${W - L - R}" height="${y(0) - Tp}" fill="transparent"/>
    </svg>
    <div class="tidslinje">
      <input type="range" id="tid" min="${y0}" max="${y1}" value="${y1}" step="1" aria-label="${lang === 'da' ? 'Årstal' : 'Year'}">
      <div class="tid-ud"><div class="tid-aar" id="tid-aar"></div><div class="tid-tekst" id="tid-tekst"></div></div>
      <p class="note">${dag[1]}</p>
    </div>`;
    const svg = kurve.querySelector('svg'), mk = kurve.querySelector('.markoer'), mkL = mk.querySelector('line'), mkC = mk.querySelector('circle'), mkT = mk.querySelector('text');
    const slider = $('#tid'), udAar = $('#tid-aar'), udTekst = $('#tid-tekst'), prikker = kurve.querySelectorAll('.post');
    function visAar(yr) {
      yr = Math.max(y0, Math.min(y1, Math.round(yr)));
      const px = x(yr), py = y(vaerdi(yr));
      mkL.setAttribute('x1', px); mkL.setAttribute('x2', px); mkC.setAttribute('cx', px); mkC.setAttribute('cy', py); mkT.setAttribute('x', px); mkT.textContent = yr;
      // nærmeste post inden for 12 år, ellers tågen
      let best = null, bd = 13; poster.forEach(p => { const dd = Math.abs(p.yr - yr); if (dd < bd) { bd = dd; best = p; } });
      prikker.forEach(c => c.classList.toggle('aktiv', best && +c.dataset.yr === best.yr));
      udAar.innerHTML = `<b>${yr}</b> <span>${dag[0]}: ${vaerdi(yr)}</span>`;
      if (best) udTekst.innerHTML = `<span class="tid-label">${esc2(best.label)} · <i class="${best.cls}">${esc2(best.afg)}</i></span>${esc2(best.tekst)}`;
      else udTekst.innerHTML = `<span class="tid-label">${yr}</span><em>${dag[2]}</em>`;
      if (slider.value != yr) slider.value = yr;
      slider.setAttribute('aria-valuetext', `${yr}. ${dag[0]}: ${vaerdi(yr)}. ${best ? best.label + ', ' + best.afg : dag[2]}`); // skærmlæsere hører år, tågedage og posten, ikke kun tallet
    }
    function esc2(s) { return String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }
    slider.addEventListener('input', () => visAar(+slider.value));
    const fraEvent = e => { const r = svg.getBoundingClientRect(); const cx = (e.touches ? e.touches[0].clientX : e.clientX) - r.left; const sx = cx / r.width * W; return y0 + (sx - L) / (W - L - R) * (y1 - y0); };
    const fang = kurve.querySelector('.fang');
    fang.addEventListener('mousemove', e => visAar(fraEvent(e)));
    fang.addEventListener('touchstart', e => { visAar(fraEvent(e)); }, { passive: true });
    fang.addEventListener('touchmove', e => { visAar(fraEvent(e)); }, { passive: true });
    prikker.forEach(c => c.addEventListener('click', () => visAar(+c.dataset.yr)));
    visAar(2026);
    // Autoplay fra 980 til 2026 én gang, når grafen kommer i syne (stopper ved første berøring)
    if (!reduce && 'IntersectionObserver' in window) {
      let spillet = false, stop = false;
      ['mousemove', 'touchstart', 'input'].forEach(ev => kurve.addEventListener(ev, () => { stop = true; }, { passive: true }));
      new IntersectionObserver((es, io) => { if (es[0].isIntersecting && !spillet) { spillet = true; io.disconnect(); let yr = y0; visAar(yr); const t = setInterval(() => { if (stop || yr >= y1) { clearInterval(t); if (!stop) visAar(y1); return; } yr += 6; visAar(yr); }, 40); } }, { threshold: .5 }).observe(kurve);
    }
  }

  /* ── Gæstebog ── */
  /* Turnstile (valgfri): widget vises kun, hvis sitet har en sitekey. Hjælperen deles med round6.js via window.tvTurnstile. */
  window.tvTurnstile = (() => {
    let sitekeyP = null, scriptP = null;
    const sitekey = () => sitekeyP || (sitekeyP = fetch('/api/turnstile').then(r => r.ok ? r.json() : {}).then(j => (j && j.sitekey) || null).catch(() => null));
    const script = () => scriptP || (scriptP = new Promise(res => { const s = document.createElement('script'); s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'; s.async = true; s.defer = true; s.onload = () => res(true); s.onerror = () => res(false); document.head.appendChild(s); }));
    return {
      async mount(container, action) {
        const key = await sitekey(); if (!key || !container) return { token: () => '', reset() { } };
        if (!(await script()) || !window.turnstile) return { token: () => '', reset() { } };
        // Runde 9: callbacks i stedet for at gætte. ready() venter på et token (eller en fejlkode), så en formular aldrig sender et tomt token.
        let tok = '', fejl = null, vent = [];
        const meld = () => { vent.forEach(f => f()); vent = []; };
        const id = window.turnstile.render(container, { sitekey: key, action, size: 'flexible', appearance: 'interaction-only', retry: 'auto', 'refresh-expired': 'auto', theme: document.documentElement.dataset.theme === 'light' ? 'light' : 'dark',
          callback: t => { tok = t || ''; fejl = null; meld(); }, 'error-callback': code => { fejl = String(code || 'error'); tok = ''; meld(); return true; }, 'expired-callback': () => { tok = ''; }, 'timeout-callback': () => { fejl = 'timeout'; meld(); } });
        const token = () => { try { return window.turnstile.getResponse(id) || tok || ''; } catch (e) { return tok; } };
        return { token, fejl: () => fejl, reset() { tok = ''; fejl = null; try { window.turnstile.reset(id); } catch (e) { } },
          ready(ms = 10000) { const t = token(); if (t) return Promise.resolve(t); return new Promise(res => { const tm = setTimeout(() => res(token()), ms); vent.push(() => { clearTimeout(tm); res(token()); }); }); } };
      },
    };
  })();
  const gbForm = $('#gb-form'), gbList = $('#sager'), gbStatus = $('#gb-status');
  let gbTs = { token: () => '', reset() { } };
  if (gbForm) { const slot = document.createElement('div'); slot.className = 'turnstile-slot'; gbForm.querySelector('button[type=submit], button').insertAdjacentElement('beforebegin', slot); window.tvTurnstile.mount(slot, 'gaestebog').then(t => gbTs = t); }
  function esc(s) { return s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }
  const PR_SIDE = 3; let alleSager = [], side = 0;
  const sagNav = $('#sager-nav'), sagNyere = $('#sager-nyere'), sagAeldre = $('#sager-aeldre'), sagSide = $('#sager-side');
  function visSager(sager) {
    if (!gbList) return;
    if (sager) { alleSager = sager; side = 0; }
    if (!alleSager.length) { gbList.innerHTML = `<li class="sager-tom">${T.gbTom}</li>`; if (sagNav) sagNav.hidden = true; return; }
    const sider = Math.ceil(alleSager.length / PR_SIDE); side = Math.max(0, Math.min(side, sider - 1));
    const vis = alleSager.slice(side * PR_SIDE, side * PR_SIDE + PR_SIDE);
    gbList.innerHTML = vis.map(s => `<li><span class="nr">${esc(s.nr)}${s.dato ? '<br><span style="color:var(--mist-dim)">' + esc(String(s.dato)) + '</span>' : ''}</span><div><b>${esc(s.navn)}</b><p>${esc(s.sag)}</p></div><span class="u">${T.status}</span></li>`).join('');
    if (sagNav) { sagNav.hidden = sider <= 1; sagNyere.disabled = side === 0; sagAeldre.disabled = side >= sider - 1; sagSide.textContent = (lang === 'da' ? 'Side {a} af {b} · {n} sager, alle udsat' : 'Page {a} of {b} · {n} cases, all adjourned').replace('{a}', side + 1).replace('{b}', sider).replace('{n}', alleSager.length); }
  }
  if (sagNyere) sagNyere.addEventListener('click', () => { side--; visSager(); gbList.scrollIntoView({ block: 'nearest', behavior: reduce ? 'auto' : 'smooth' }); });
  if (sagAeldre) sagAeldre.addEventListener('click', () => { side++; visSager(); gbList.scrollIntoView({ block: 'nearest', behavior: reduce ? 'auto' : 'smooth' }); });
  async function hentSager() {
    if (!gbList) return;
    try { const r = await fetch('/api/sager'); if (!r.ok) throw 0; visSager(await r.json()); }
    catch (e) { gbList.innerHTML = `<li class="sager-tom">${T.gbFejl}</li>`; }
  }
  hentSager().then(() => { if (location.hash.startsWith('#sag-')) { const nr = decodeURIComponent(location.hash.slice(5)); const i = alleSager.findIndex(s => s.nr === nr); if (i >= 0) { side = Math.floor(i / PR_SIDE); visSager(); } } });
  if (gbForm) gbForm.addEventListener('submit', async e => {
    e.preventDefault();
    const fd = new FormData(gbForm), sag = (fd.get('sag') || '').toString().trim(), navn = (fd.get('navn') || '').toString().trim();
    if (sag.length < 4) { gbStatus.textContent = T.gbKort; return; }
    gbStatus.textContent = T.gbSender; gbForm.querySelector('button').disabled = true;
    try {
      const r = await fetch('/api/sager', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ navn, sag, hp: fd.get('website') || '', turnstile: await (gbTs.ready ? gbTs.ready(10000) : gbTs.token()) }) });
      gbTs.reset();
      if (!r.ok) throw 0; const ny = await r.json();
      gbStatus.textContent = T.gbSendt.replace('{nr}', ny.nr); gbForm.reset(); hentSager();
    } catch (err) { gbStatus.textContent = T.gbFejl; }
    gbForm.querySelector('button').disabled = false;
  });

  /* ── Undersidetoppen: fremdrift som tekst fra gæstens egne fund (samme nøgle som undersøgelsen; ingen ny nøgle) ── */
  (function () {
    let n = 0;
    try { const e = JSON.parse(localStorage.getItem('tingsvad.experience.v1') || 'null'); n = new Set(((e && e.fragments) || []).filter(x => ['archive', 'shield', 'excavation'].includes(x))).size; } catch (x) { }
    document.querySelectorAll('[data-tv-stykker]').forEach(el => { el.textContent = String(n); });
    if (n === 3) document.querySelectorAll('[data-tv-side2]').forEach(el => { el.textContent = el.getAttribute('data-tv-side2'); });
  })();
})();
