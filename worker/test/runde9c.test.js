import { test } from 'node:test';
import assert from 'node:assert/strict';
import { tilBrev } from '../src/lib/ravnepostlogic.js';
import { koerOevelse } from '../src/features/oevelse.js';

test('ravnepost: no addresses or links kept, quotes dropped, [offentlig] is an explicit opt-in', () => {
  const b = tilBrev({ to: 'Brev@sitesite.dk', subject: '[offentlig] Om koen', text: 'Kære ting,\nkoen er min. Skriv til ulf@example.com eller se https://example.com/ko\n> citat fra før\nHilsen Ulf' });
  assert.equal(b.local, 'brev'); assert.equal(b.offentlig, true); assert.equal(b.emne, 'Om koen');
  assert.ok(!b.uddrag.includes('@') && !b.uddrag.includes('http') && !b.uddrag.includes('citat'));
  assert.match(b.uddrag, /\[adresse\].*\[link\]/);
  assert.equal(tilBrev({ to: 'x@sitesite.dk', subject: 'Privat', text: 'hej' }).offentlig, false);
  assert.equal(tilBrev({ to: 'x@sitesite.dk', subject: '', html: '<p>Hej <b>ting</b></p><script>x()</script>' }).uddrag, 'Hej ting');
  assert.ok(tilBrev({ to: 'x@sitesite.dk', subject: 's', text: 'a'.repeat(2000) }).uddrag.length <= 400);
});

test('nødøvelser: the real code paths behave under simulated failure', async () => {
  const t = await koerOevelse('timeout', 'en');
  assert.ok(t.trin.some(x => x.status === 'advarsel' && /aborted/.test(x.tekst)));
  const d = await koerOevelse('dublet', 'da');
  assert.equal(d.trin.filter(x => /oprettet/.test(x.tekst)).length, 1);
  assert.equal(d.trin.filter(x => /findes allerede/.test(x.tekst)).length, 1);
  const r = await koerOevelse('reconnect', 'da');
  assert.ok(r.trin.some(x => /plads 3 \(den samme\)/.test(x.tekst)));
  assert.ok(r.trin.some(x => /already_voted/.test(x.tekst)));
  await assert.rejects(() => koerOevelse('nope', 'da'));
});
