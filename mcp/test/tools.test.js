// tingsvad-mcp: værktøjslaget (uden netværk). Kør: npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { svar, klientId, cphDato, lavServer } from '../src/tools.js';

test('klientId: 32 hex, stable for the same IP and date, different across days and IPs', async () => {
  const a = await klientId('192.0.2.1', '2026-10-28');
  assert.match(a, /^[a-f0-9]{32}$/);
  assert.equal(a, await klientId('192.0.2.1', '2026-10-28'));
  assert.notEqual(a, await klientId('192.0.2.1', '2026-10-29'));
  assert.notEqual(a, await klientId('192.0.2.2', '2026-10-28'));
  assert.match(cphDato(new Date('2026-10-27T23:30:00Z')), /^2026-10-28$/);
});

test('svar: errors become isError with the message in tone; success carries structuredContent', () => {
  const f = svar({ ok: false, code: 'quota', besked: 'Dagens bevilling er gået til blæk.', retryAfter: 3600 });
  assert.equal(f.isError, true);
  assert.match(f.content[0].text, /blæk.*3600/);
  const o = svar({ ok: true, data: { a: 1 } }, (d, en) => en ? 'one' : 'en', true);
  assert.equal(o.isError, undefined);
  assert.deepEqual(o.structuredContent, { a: 1 });
  assert.ok(o.content[0].text.startsWith('one\n\n'));
});

test('lavServer: builds without a binding (tools then answer “not connected”)', () => {
  assert.ok(lavServer(undefined, 'a'.repeat(32)));
});
