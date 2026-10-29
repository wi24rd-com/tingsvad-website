import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';

// Tingets alder må ikke stå som fast tal i figurreplikker eller Workerens tekster: den skal komme fra kanon (tvAar / faktaTekst).
// Undtaget: kodegrydens opgave (input 2026 → 1046 er en ren funktion) og daterede arkivposter i HTML (ikke scannet her).
test('ingen faste »1.046 år« i assets og Workerens tekster', () => {
  const filer = [
    ...readdirSync(new URL('../../assets/', import.meta.url)).filter(f => f.endsWith('.js')).map(f => new URL('../../assets/' + f, import.meta.url)),
    ...['canon.js', 'corpus.js'].map(f => new URL('../src/lib/' + f, import.meta.url)),
  ];
  for (const f of filer) {
    const t = readFileSync(f, 'utf8').replace(/forventet: 1046/g, '');
    assert.ok(!/1[.,]?04[67]\b/.test(t), `fast alderstal i ${f.pathname.split('/').slice(-2).join('/')}`);
  }
});
