/* tingsvad.dk — forsiden (runde 12): listen over steder på mobil og radioens afspilknap.
   Ingen nye localStorage-nøgler. Lyden hentes først, når gæsten trykker. */
(function () {
  const lang = document.documentElement.lang === 'en' ? 'en' : 'da';
  const T = {
    da: {
      afspil: 'Afspil dagens udsendelse', pause: 'Sæt udsendelsen på pause', henter: 'Ravnen stemmer instrumentet …',
      ingenLyd: 'I dag sendes kun på skrift. Læs dagens manuskript i <a href="/oplevelser/maskinparken/radio/">studiet</a>.',
      fejl: 'Senderen svarer ikke. Tågen er nok for tæt. Prøv igen om lidt, eller gå til <a href="/oplevelser/maskinparken/radio/">studiet</a>.',
      spiller: 'Ravnen er på luften.', slut: 'Udsendelsen er slut. Sagen er stadig udsat.'
    },
    en: {
      afspil: "Play today's broadcast", pause: 'Pause the broadcast', henter: 'The raven is tuning the instrument …',
      ingenLyd: "Today's broadcast is text only. Read the script in <a href=\"/en/experiences/machine-park/#paafund-radio\">the studio</a>.",
      fejl: 'The transmitter is not answering. The fog is probably too thick. Try again shortly, or visit <a href="/en/experiences/machine-park/radio/">the studio</a>.',
      spiller: 'The raven is on air.', slut: 'The broadcast has ended. The case is still adjourned.'
    }
  }[lang];

  /* På smalle skærme er listen åben fra start: kortet skal skubbes, listen kan bare trykkes. */
  const steder = document.getElementById('steder');
  if (steder && matchMedia('(max-width: 760px)').matches) steder.open = true;
  /* På mobil starter kortet lidt inde, så både Mímir og vadestenene er i billedet */
  const rul = document.querySelector('.r12-kort-rul');
  if (rul && rul.scrollWidth > rul.clientWidth + 20) rul.scrollLeft = Math.round((rul.scrollWidth - rul.clientWidth) * .3);

  /* Kortets markører (runde 12): en markør er en knap, der åbner ét fælles panel med navn, en kort beskrivelse og
     linket videre. Navigation sker kun via panelets link. Panelet lukkes med Esc, lukknappen eller et klik udenfor.
     På brede skærme står panelet ved markøren inden for kortets kanter; på mobil under kortet. */
  const kort = document.querySelector('.r12-kort'), panel = document.getElementById('km-panel');
  if (kort && panel && rul) {
    const h = panel.querySelector('#km-panel-h'), p = panel.querySelector('.km-panel-tekst'), gaa = panel.querySelector('.km-gaa');
    const smal = matchMedia('(max-width: 760px)');
    let aktiv = null;
    function placer() {
      if (!aktiv) return;
      if (smal.matches) { if (panel.parentNode !== rul.parentNode || panel.previousElementSibling !== rul) rul.after(panel); panel.classList.add('km-under'); panel.style.left = panel.style.top = ''; return; }
      if (panel.parentNode !== kort) kort.appendChild(panel);
      panel.classList.remove('km-under');
      const fw = kort.clientWidth, fh = kort.clientHeight, km = aktiv.parentElement, fr = kort.getBoundingClientRect();
      const cy = parseFloat(km.style.getPropertyValue('--y')) / 100 * fh;
      // markør og skilt tilsammen: panelet står ved siden af begge og dækker aldrig det valgte steds eget skilt
      const r = [aktiv.querySelector('.km-prik'), aktiv.querySelector('.km-skilt')].map(el => el.getBoundingClientRect()).filter(b => b.width > 2)
        .reduce((a, b) => ({ l: Math.min(a.l, b.left), r: Math.max(a.r, b.right) }), { l: Infinity, r: -Infinity });
      const venstre = r.l - fr.left, hoejre = r.r - fr.left;
      const pw = panel.offsetWidth, ph = panel.offsetHeight, luft = 14, kant = 12;
      let x = hoejre + luft; if (x + pw > fw - kant) x = venstre - luft - pw; x = Math.max(kant, Math.min(x, fw - pw - kant));
      let y = cy - ph / 2; y = Math.max(kant, Math.min(y, fh - ph - kant));
      panel.style.left = Math.round(x) + 'px'; panel.style.top = Math.round(y) + 'px';
    }
    function luk(fokus) {
      if (!aktiv) return; const k = aktiv; aktiv = null;
      k.setAttribute('aria-expanded', 'false'); panel.hidden = true;
      if (fokus) k.focus();
    }
    function aabn(k) {
      if (aktiv && aktiv !== k) aktiv.setAttribute('aria-expanded', 'false');
      aktiv = k; k.setAttribute('aria-expanded', 'true');
      h.textContent = k.querySelector('.km-skilt').textContent; p.textContent = k.dataset.tekst;
      gaa.href = k.dataset.href; gaa.textContent = k.dataset.cta + ' ';
      panel.hidden = false; placer();
      if (smal.matches) panel.scrollIntoView({ block: 'nearest', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
    }
    kort.addEventListener('click', e => { const k = e.target.closest('.km-knap'); if (!k) return; if (aktiv === k) luk(false); else aabn(k); });
    panel.querySelector('.km-luk').addEventListener('click', () => luk(true));
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && aktiv) { e.preventDefault(); luk(true); } });
    document.addEventListener('click', e => { if (aktiv && !panel.contains(e.target) && !e.target.closest('.km-knap')) luk(false); });
    addEventListener('resize', placer); smal.addEventListener && smal.addEventListener('change', placer);
  }

  /* Radioen */
  const knap = document.getElementById('r12-play'), status = document.getElementById('r12-radio-status');
  const sek = knap && knap.closest('.r12-radio');
  if (!knap || !status) return;
  const PLAY = 'M8 5v14l11-7z', PAUSE = 'M7 5h4v14H7zM13 5h4v14h-4z';
  const ikon = knap.querySelector('.r12-play-ikon');
  let audio = null, henter = false;
  function tilstand(spiller) {
    knap.setAttribute('aria-pressed', String(spiller));
    knap.setAttribute('aria-label', spiller ? T.pause : T.afspil);
    if (ikon) ikon.setAttribute('d', spiller ? PAUSE : PLAY);
    if (sek) sek.classList.toggle('spiller', spiller);
  }
  async function hent() {
    henter = true; status.textContent = T.henter;
    try {
      const r = await fetch('/api/ting-ai/radio?lang=' + lang, { credentials: 'same-origin' });
      const b = await r.json().catch(() => null);
      const url = b && b.ok && b.data && b.data.audioUrl;
      if (!url) { status.innerHTML = b && b.ok ? T.ingenLyd : T.fejl; return null; }
      const a = new Audio(url); a.preload = 'auto';
      a.addEventListener('playing', () => { tilstand(true); status.textContent = T.spiller; });
      a.addEventListener('pause', () => tilstand(false));
      a.addEventListener('ended', () => { tilstand(false); status.textContent = T.slut; });
      a.addEventListener('error', () => { tilstand(false); status.innerHTML = T.fejl; audio = null; });
      return a;
    } catch (e) { status.innerHTML = T.fejl; return null; }
    finally { henter = false; }
  }
  knap.addEventListener('click', async () => {
    if (henter) return;
    if (audio && !audio.paused) { audio.pause(); return; }
    if (!audio) audio = await hent();
    if (audio) audio.play().catch(() => { status.innerHTML = T.fejl; });
  });
})();
