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
