// Én datakilde for universets datoer og definitioner: assets/kanon.json i repo-roden (samme fil som frontenden læser).
// Wrangler/esbuild bundler JSON-filen ind i Workeren ved deploy, så en ændring kræver `npx wrangler deploy`.
import K from '../../../assets/kanon.json' with { type: 'json' };

export const KANON = K;
export const tingSatAar = () => K.tingSat.aar;
// Hele år siden tinget blev sat (tingSat.iso, midsommer): skifter ved midsommer, ikke ved nytår – som tælleren på forsiden.
export const aarSiden = (dateKey) => { const d = String(dateKey); return parseInt(d.slice(0, 4), 10) - K.tingSat.aar - (d.slice(5, 10) < K.tingSat.iso.slice(5, 10) ? 1 : 0); };
export const afgjorteAntal = () => K.afgoerelser.length;
export const senesteAfgoerelse = () => K.afgoerelser[K.afgoerelser.length - 1];

/** FAKTA-blokken til avisen. Alle tal kommer herfra; modellen må ikke regne selv. */
export function faktaTekst(lang, dateKey) {
  const s = senesteAfgoerelse(), siden = aarSiden(dateKey);
  const visning = (s.visning && s.visning[lang]) || String(s.aar);
  return lang === 'da'
    ? `FAKTA: Dato ${dateKey}. Tinget blev sat i ${K.tingSat.aar}; sagen om koen har været udsat i ${siden} år. Afgjorte sager i alt: ${afgjorteAntal()}; den seneste var i ${visning} (${s.da}). Tågedage om året: ${K.taageDageOmAaret}; sommer hver ${K.sommerHverNteDag}. dag.`
    : `FACTS: Date ${dateKey}. The thing convened in ${K.tingSat.aar}; the cow case has been adjourned for ${siden} years. Cases decided in total: ${afgjorteAntal()}; the latest was in the ${visning} (${s.en}). Foggy days per year: ${K.taageDageOmAaret}; summer every ${K.sommerHverNteDag}rd day.`;
}

/** Alle tal, modellen må bruge: dem i FAKTA og i brugerteksten. */
export function tilladteTal(...tekster) {
  const set = new Set();
  for (const t of tekster) for (const m of String(t).matchAll(/\d[\d.,]*/g)) { const n = m[0].replace(/[.,]+$/, ''); set.add(n); set.add(n.replace(/[.,]/g, '')); }
  return set;
}

/** Fjerner sætninger med tal, der ikke står i FAKTA (fx »1046 timer og 32 minutter«) og årstallet for sagens alder brugt med en forkert enhed. */
export function rensTal(tekst, tilladt, siden) {
  const saetninger = String(tekst).split(/(?<=[.!?…])\s+/);
  const ok = saetninger.filter(st => {
    for (const m of st.matchAll(/\d[\d.,]*/g)) {
      const raw = m[0].replace(/[.,]+$/, ''), n = raw.replace(/[.,]/g, '');
      if (!tilladt.has(raw) && !tilladt.has(n)) return false;
      if (n === String(siden)) { const efter = st.slice(m.index + m[0].length, m.index + m[0].length + 8).toLowerCase(); if (!/^\s*(år|years?)\b/.test(efter)) return false; }
    }
    return true;
  });
  return { tekst: ok.join(' '), fjernet: saetninger.length - ok.length };
}
