// Tingets tælleværk (runde 10): Workers Analytics Engine.
// Ét datasæt, `tingsvad_taelle`, som både Pages-middlewaren (sidevisninger) og Workeren (API-kald og hændelser) skriver til.
// writeDataPoint() er ikke-blokerende og koster intet ventetid; mangler bindingen, sker der ingenting.
// Skema:  index1 = art ('side' | 'md' | 'fejl' | 'api' | 'haendelse')
//         blob1  = navn (side-nøgle, API-sti eller hændelse) · blob2 = sprog · blob3 = datacenter (colo) · blob4 = detalje (statusklasse)
//         double1 = antal · double2 = millisekunder
// Ingen IP-adresser, cookies, sessioner eller fritekst: kun det, der står her.
export const ARTER = ['side', 'md', 'fejl', 'api', 'haendelse'];
const kort = (s, n) => String(s == null ? '' : s).slice(0, n);

export function tael(env, art, navn, { lang = '', colo = '', detalje = '', antal = 1, ms = 0 } = {}) {
  const ds = env && env.TAEL;
  if (!ds || typeof ds.writeDataPoint !== 'function' || !ARTER.includes(art)) return false;
  try {
    ds.writeDataPoint({ indexes: [art], blobs: [kort(navn, 64), kort(lang, 2), kort(colo, 4), kort(detalje, 24)], doubles: [Number(antal) || 0, Math.max(0, Math.round(Number(ms) || 0))] });
    return true;
  } catch (e) { return false; }
}

/** API-stien grupperet, så ID'er og datoer ikke giver en ny række pr. kald (ravn/R-…, forge/…, radio/audio/…). */
export function apiNavn(path) {
  const p = String(path || '').replace(/^\/+|\/+$/g, '');
  if (!p) return '(rod)';
  const [a, b] = p.split('/');
  if (a === 'ravn' && b) return p.endsWith('/fil') ? 'ravn/fil' : p.endsWith('/igen') ? 'ravn/igen' : 'ravn/status';
  if (a === 'radio' && b === 'audio') return 'radio/audio';
  if (a === 'revision' && b === 'billede') return 'revision/billede';
  if (a === 'og' || a === 'forge' || a === 'jobs') return b ? a + '/*' : a;
  if (a === 'room' || a === 'stol') return a + '/ws';
  return kort(a + (b && /^[a-z]+$/.test(b) ? '/' + b : ''), 32);
}
export const statusKlasse = s => (s >= 500 ? '5xx' : s >= 400 ? '4xx' : s >= 300 ? '3xx' : s === 101 ? '101' : '2xx');
