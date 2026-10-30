#!/usr/bin/env node
// Samler assets/kilde/*.js til bundterne i assets/filer.json (runde 13, AP7). Ingen afhængigheder, ingen omskrivning:
// filerne kædes sammen i rækkefølge med en linje, der siger hvor hvert stykke kommer fra, og et semikolon imellem.
// Kør: node tools/bundt.mjs [--tjek]   (eller npm run prep, som også kører sagsregister, headers og bump; --tjek fejler hvis bundterne er bagud)
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const rod = join(dirname(fileURLToPath(import.meta.url)), '..');
const filer = JSON.parse(readFileSync(join(rod, 'assets', 'filer.json'), 'utf8'));
export function bundt(navn, kilder) {
  return kilder.map(k => `/* ═══ ${k} (assets/kilde/${k}) ═══ */\n${readFileSync(join(rod, 'assets', 'kilde', k), 'utf8').replace(/\s+$/, '')}\n;`).join('\n') + '\n';
}
export const bundtTekst = (navn, kilder) => `/* tingsvad.dk — ${navn}: samlet af tools/bundt.mjs fra assets/kilde/ (${kilder.join(', ')}). Ret kilderne, ikke denne fil. */\n` + bundt(navn, kilder);
/** Navnene på de bundter, hvis fil i assets/ ikke svarer til kilderne. */
export function bagud() {
  return Object.entries(filer.bundter).filter(([navn, kilder]) => { try { return readFileSync(join(rod, 'assets', navn), 'utf8') !== bundtTekst(navn, kilder); } catch { return true; } }).map(([navn]) => navn);
}
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  if (process.argv.includes('--tjek')) { const b = bagud(); if (b.length) { console.error('bundter bagud: ' + b.join(', ') + ' – kør node tools/bundt.mjs'); process.exit(1); } console.log('bundterne er ajour'); }
  else {
    let aendret = 0;
    for (const [navn, kilder] of Object.entries(filer.bundter)) {
      const ud = join(rod, 'assets', navn), ny = bundtTekst(navn, kilder);
      let gammel = null; try { gammel = readFileSync(ud, 'utf8'); } catch { }
      if (gammel !== ny) { writeFileSync(ud, ny); aendret++; console.log('skrev assets/' + navn, `(${kilder.length} filer, ${Math.round(ny.length / 1024)} KB)`); }
    }
    console.log(aendret ? `${aendret} bundt${aendret === 1 ? '' : 'er'} opdateret` : 'bundterne er allerede ajour');
  }
}
