import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { revisionsliste } from '../src/features/revision.js';

// Gudruns tjekliste skal følge sitets markup: hver selektors første led (id, klasse eller attribut) skal findes i sidens
// HTML eller i et af sitets scripts (for det, der tegnes af JavaScript). Ellers fejler alle sider en morgen efter et redesign.
const ROD = new URL('../../', import.meta.url);
const js = readdirSync(new URL('assets/', ROD)).filter(f => f.endsWith('.js')).map(f => readFileSync(new URL('assets/' + f, ROD), 'utf8')).join('\n');
const findes = (html, sel) => {
  const forste = sel.trim().split(/\s+/)[0];
  const m = forste.match(/^([#.])([\w-]+)/) || forste.match(/^\[([\w-]+)/);
  if (!m) return true; // fx 'footer' eller 'main' – tjekkes af partials
  if (m[1] === '#') return html.includes(`id="${m[2]}"`) || js.includes(m[2]);
  const navn = m[2] || m[1];
  return html.includes(navn) || js.includes(navn);
};

test('revisionen: alle Gudruns selektorer findes i sitets HTML eller scripts', () => {
  const mangler = [];
  for (const { side, path, sel } of revisionsliste()) {
    const html = readFileSync(new URL((path.replace(/^\//, '') || '') + 'index.html', ROD), 'utf8');
    for (const [k, s] of Object.entries(sel)) if (!findes(html, s)) mangler.push(`${side}: ${k} (${s})`);
  }
  assert.deepEqual(mangler, []);
});
