#!/usr/bin/env node
// Skriver _headers (Workers Static Assets' headers for de statiske filer) ud fra én kilde (runde 13, AP7):
//   – sikkerhedsheaderne (CSP m.fl.) fra functions/_lib/headers.js, som Worker-koden også bruger,
//   – mikrofon-undtagelsen for retssalen samme sted,
//   – kantcache i 10 minutter for de versionerede filer i assets/filer.json (resten af /assets/* er uforanderlig i et år).
// Kør: node tools/headers.mjs [--tjek]   (--tjek ændrer intet og fejler, hvis _headers er bagud; bruges af routertesten)
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { SIKKERHED, MIKROFON_SIDER, MIKROFON_POLITIK } from '../functions/_lib/headers.js';

const rod = join(dirname(fileURLToPath(import.meta.url)), '..');
const filer = JSON.parse(readFileSync(join(rod, 'assets', 'filer.json'), 'utf8'));
const blok = (sti, linjer) => `${sti}\n${linjer.map(l => '  ' + l).join('\n')}\n`;

export function lavHeaders() {
  const ud = ['# Genereret af tools/headers.mjs – ret functions/_lib/headers.js eller assets/filer.json, ikke denne fil (npm run prep).', ''];
  ud.push(blok('/', ['Cache-Control: public, max-age=0, must-revalidate']), blok('/en/', ['Cache-Control: public, max-age=0, must-revalidate']));
  ud.push(blok('/*', Object.entries(SIKKERHED).map(([k, v]) => `${k}: ${v}`)));
  for (const s of MIKROFON_SIDER) ud.push(blok(s + '*', ['! Permissions-Policy', `Permissions-Policy: ${MIKROFON_POLITIK}`]));
  ud.push(blok('/assets/*', ['Cache-Control: public, max-age=31536000, immutable']));
  for (const f of filer.versioneret) ud.push(blok('/assets/' + f, ['! Cache-Control', 'Cache-Control: public, max-age=600, must-revalidate']));
  ud.push(blok('/assets/kodegryde-worker-v1.js', ['! Content-Security-Policy', "Content-Security-Policy: default-src 'none'; script-src 'self' 'unsafe-eval'"]));
  ud.push(blok('/partials/*', ['X-Robots-Tag: noindex', 'Cache-Control: public, max-age=300']));
  ud.push(blok('/sw.js', ['Cache-Control: no-cache']));
  ud.push('# Workers Static Assets sender text/plain uden charset; llms.txt har ·, – og →.');
  ud.push(blok('/llms.txt', ['! Content-Type', 'Content-Type: text/plain; charset=utf-8']), blok('/robots.txt', ['! Content-Type', 'Content-Type: text/plain; charset=utf-8']));
  ud.push(blok('/api/*', ['Cache-Control: no-store']));
  ud.push('# Maskinlæsbare opslag for AI-agenter (RFC 9727 API-katalog, security.txt og MCP server card)');
  ud.push(blok('/.well-known/api-catalog', ['! Content-Type', 'Content-Type: application/linkset+json; charset=utf-8', 'Access-Control-Allow-Origin: *', 'Cache-Control: public, max-age=3600']));
  ud.push(blok('/.well-known/security.txt', ['! Content-Type', 'Content-Type: text/plain; charset=utf-8', 'Cache-Control: public, max-age=3600']));
  ud.push(blok('/.well-known/mcp/server-card.json', ['! Content-Type', 'Content-Type: application/json; charset=utf-8', 'Access-Control-Allow-Origin: *', 'Cache-Control: public, max-age=3600']));
  return ud.join('\n');
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const sti = join(rod, '_headers'), ny = lavHeaders();
  let gammel = null; try { gammel = readFileSync(sti, 'utf8'); } catch { }
  if (process.argv.includes('--tjek')) { if (gammel !== ny) { console.error('_headers er bagud: kør node tools/headers.mjs'); process.exit(1); } console.log('_headers er ajour'); }
  else if (gammel !== ny) { writeFileSync(sti, ny); console.log('skrev _headers'); } else console.log('_headers er allerede ajour');
}
