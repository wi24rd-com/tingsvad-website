// Cron kører i UTC. Datoer i universet følger Europe/Copenhagen, også hen over sommertidsskift.
export function cphDateKey(d = new Date()) {
  const p = {};
  new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Copenhagen', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(d).forEach(x => { p[x.type] = x.value; });
  return `${p.year}-${p.month}-${p.day}`;
}
export function cphHour(d = new Date()) {
  const p = {};
  new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Copenhagen', hour: '2-digit', hour12: false }).formatToParts(d).forEach(x => { p[x.type] = x.value; });
  return +p.hour % 24;
}
/** Sekunder til næste midnat i Europe/Copenhagen (kvoterne nulstilles pr. Copenhagen-dato, så retry-after skal følge samme ur). */
export function secondsToCphMidnight(now = Date.now()) {
  const p = {};
  new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Copenhagen', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }).formatToParts(new Date(now)).forEach(x => { p[x.type] = x.value; });
  const brugt = (+p.hour % 24) * 3600 + (+p.minute) * 60 + (+p.second);
  return Math.max(60, 86_400 - brugt);
}
export const prevDateKey = key => { const d = new Date(key + 'T12:00:00Z'); d.setUTCDate(d.getUTCDate() - 1); return d.toISOString().slice(0, 10); };
