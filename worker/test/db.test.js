import { test } from 'node:test';
import assert from 'node:assert/strict';
import { makeDb } from './d1mock.js';
import { reserve, commit, release, withQuota, rateLimit } from '../src/lib/quota.js';
import { begin, finish, abort } from '../src/lib/idempotency.js';
import { transition, STEPS } from '../src/features/jobs.js';
import { publishEdition, getNews, getNewsArkiv, bumpEvent } from '../src/features/news.js';
import { ApiError } from '../src/lib/http.js';

const log = () => { };

test('kvote: reservation før kald, samtidige requests, lease udløber, frigivelse ved fejl', async () => {
  const db = makeDb();
  const a = await reserve(db, 'image', 'd', 2, 'da', 1000), b = await reserve(db, 'image', 'd', 2, 'da', 1000);
  await assert.rejects(reserve(db, 'image', 'd', 2, 'da', 1000), e => e instanceof ApiError && e.code === 'quota');
  await release(db, b);
  const c = await reserve(db, 'image', 'd', 2, 'da', 1000); await commit(db, a); await commit(db, c);
  await assert.rejects(reserve(db, 'image', 'd', 2, 'da', 1000), /blæk/); // brugt op: 2 af 2
  // lease: en hængende reservation tæller ikke efter 90 s
  const d = await reserve(db, 'text', 'd', 1, 'da', 1000);
  await assert.rejects(reserve(db, 'text', 'd', 1, 'da', 1000));
  const e = await reserve(db, 'text', 'd', 1, 'da', 1000 + 91_000); assert.ok(e.id && d.id !== e.id);
  // withQuota: provider-fejl frigiver reservationen uden at bogføre
  await assert.rejects(withQuota(db, 'audio', 'd', 1, 'da', async () => { throw new ApiError('provider_error', 'x', 502); }), /x/);
  const used = await db.prepare('SELECT used FROM quota_buckets WHERE scope = ? AND bucket_key = ?').bind('audio', 'd').first();
  assert.equal(used.used, 0);
  const ok = await withQuota(db, 'audio', 'd', 1, 'da', async () => 42); assert.equal(ok, 42);
  await assert.rejects(withQuota(db, 'audio', 'd', 1, 'da', async () => 1), /quota|blæk/);
});

test('rate limit: n pr. minut, derefter 429 med retryAfter', async () => {
  const db = makeDb(); const t = 60_000 * 100 + 5000;
  for (let i = 0; i < 3; i++) await rateLimit(db, 'court', 'k', 3, 'da', t);
  await assert.rejects(rateLimit(db, 'court', 'k', 3, 'da', t), e => e.code === 'rate_limited' && e.retryAfter > 0);
  await rateLimit(db, 'court', 'k', 3, 'da', t + 60_000); // nyt vindue
});

test('idempotency: gensend ved samme input, konflikt ved andet input, afbrudt nøgle kan genbruges', async () => {
  const db = makeDb();
  const i1 = await begin(db, { key: 'k1', ownerHash: 'o', endpoint: 'forge', input: { a: 1 }, now: 1 });
  assert.equal(i1.replay, null);
  await assert.rejects(begin(db, { key: 'k1', ownerHash: 'o', endpoint: 'forge', input: { a: 1 }, now: 2 }), e => e.code === 'in_progress');
  await finish(db, i1, 200, { ok: true, data: 'x' });
  const i2 = await begin(db, { key: 'k1', ownerHash: 'o', endpoint: 'forge', input: { a: 1 }, now: 3 });
  assert.equal(i2.replay.status, 200); assert.equal(JSON.parse(i2.replay.body).data, 'x');
  await assert.rejects(begin(db, { key: 'k1', ownerHash: 'o', endpoint: 'forge', input: { a: 2 }, now: 4 }), e => e.code === 'conflict');
  const i3 = await begin(db, { key: 'k1', ownerHash: 'o2', endpoint: 'forge', input: { a: 2 }, now: 5 }); assert.equal(i3.replay, null); // anden session
  const i4 = await begin(db, { key: 'k2', ownerHash: 'o', endpoint: 'jobs', input: {}, now: 6 }); await abort(db, i4);
  assert.equal((await begin(db, { key: 'k2', ownerHash: 'o', endpoint: 'jobs', input: {}, now: 7 })).replay, null);
  assert.equal(await begin(db, { key: null, ownerHash: 'o', endpoint: 'jobs', input: {} }), null);
});

test('sagsgang: gentaget step flytter aldrig to trin; forkert udgangstilstand springes over', async () => {
  const db = makeDb();
  await db.prepare('INSERT INTO chair_cases (id, owner_hash, token_hash, state, wishes, language, history_json, next_at, updated_at, created_at) VALUES (?, ?, ?, 0, ?, ?, ?, ?, ?, ?)').bind('S-20261025-ABCDEF', 'o', 't', '', 'da', '["t0"]', null, 'u', 'c').run();
  assert.equal(await transition(db, 'S-20261025-ABCDEF', 0, 7200), 'moved');
  assert.ok(['already', 'skipped'].includes(await transition(db, 'S-20261025-ABCDEF', 0, 7200))); // Workflow-retry: intet ekstra trin
  assert.equal(await transition(db, 'S-20261025-ABCDEF', 2, 0), 'skipped'); // ude af rækkefølge
  assert.equal(await transition(db, 'S-20261025-ABCDEF', 1, 86400), 'moved');
  assert.equal(await transition(db, 'S-20261025-ABCDEF', 2, 0), 'moved');
  const row = await db.prepare('SELECT state, next_at, history_json FROM chair_cases WHERE id = ?').bind('S-20261025-ABCDEF').first();
  assert.equal(row.state, STEPS - 1); assert.equal(row.next_at, null); assert.equal(JSON.parse(row.history_json).length, 4);
});

test('avis: to Cron-triggers for samme dato giver én udgave; fejl fra modellen udgiver intet; GET viser seneste', async () => {
  const db = makeDb();
  let calls = 0;
  const good = { response: JSON.stringify({ lead: { title: 'Stol fundet ledig. Undersøgelse indledt.', body: 'B'.repeat(60) }, notice: { title: 'Notat fra sekretariatet', body: 'N'.repeat(40) }, ad: { title: 'Søges', body: 'A'.repeat(30) } }) };
  const env = { DB: db, TEXT_MODEL: 'm', QUOTA_EDITION_TEXT_PER_DAY: '6', AI: { run: async () => { calls++; if (calls === 1) return { response: 'ikke json' }; return good; } } };
  await bumpEvent(db, 'vote_round_closed', '2026-10-24');
  assert.equal(await publishEdition(env, 'da', '2026-10-25', log), 'failed'); // forkert JSON → intet udgives
  assert.equal(await db.prepare('SELECT COUNT(*) AS n FROM daily_editions').first().then(r => r.n), 0);
  const [a, b] = await Promise.all([publishEdition(env, 'da', '2026-10-25', log), publishEdition(env, 'da', '2026-10-25', log)]);
  assert.deepEqual([a, b].sort(), ['locked', 'published']);
  assert.equal(await publishEdition(env, 'da', '2026-10-25', log), 'exists');
  const res = await getNews(new Request('https://x/api/ting-ai/news?lang=da'), env, {});
  const body = await res.json();
  assert.equal(body.ok, true); assert.equal(body.source, 'ai'); assert.equal(body.data.date, '2026-10-25');
  assert.equal(body.data.numbers['Gennemførte afstemningsrunder'], 1);
  const en = await (await getNews(new Request('https://x/api/ting-ai/news?lang=en'), env, {})).json();
  assert.equal(en.source, 'editorial'); assert.equal(en.data.date, null); // ingen engelsk udgave endnu → mærket særudgave
});

test('avisarkivet: en bestemt dato, forrige/næste udgave og listen over udgaver; ukendt dato giver 404', async () => {
  const db = makeDb();
  const krop = t => JSON.stringify({ lead: { title: t, body: 'B'.repeat(60) }, notice: { title: 'Notat', body: 'N'.repeat(40) }, ad: { title: 'Søges', body: 'A'.repeat(30) }, numbers: null });
  for (const [d, t] of [['2026-10-25', 'Første'], ['2026-10-26', 'Anden'], ['2026-10-27', 'Tredje']]) await db.prepare('INSERT INTO daily_editions (date_key, language, status, body_json, source, published_at) VALUES (?, ?, ?, ?, ?, ?)').bind(d, 'da', 'published', krop(t), 'ai', d + 'T05:00:00Z').run();
  const env = { DB: db };
  const hent = async q => (await getNews(new Request('https://x/api/ting-ai/news?lang=da' + q), env, {})).json();
  const seneste = await hent('');
  assert.equal(seneste.data.date, '2026-10-27'); assert.equal(seneste.data.prev, '2026-10-26'); assert.equal(seneste.data.next, null); assert.equal(seneste.data.arkiv, false);
  const midt = await hent('&date=2026-10-26');
  assert.equal(midt.data.lead.title, 'Anden'); assert.equal(midt.data.prev, '2026-10-25'); assert.equal(midt.data.next, '2026-10-27'); assert.equal(midt.data.arkiv, true);
  await assert.rejects(getNews(new Request('https://x/api/ting-ai/news?lang=da&date=2026-10-20'), env, {}), e => e instanceof ApiError && e.status === 404);
  await assert.rejects(getNews(new Request('https://x/api/ting-ai/news?lang=da&date=i-går'), env, {}), e => e instanceof ApiError && e.status === 400);
  const liste = await (await getNewsArkiv(new Request('https://x/api/ting-ai/news/arkiv?lang=da'), env, {})).json();
  assert.deepEqual(liste.data.udgaver.map(u => u.date), ['2026-10-27', '2026-10-26', '2026-10-25']);
  assert.equal(liste.data.udgaver[2].title, 'Første');
  const en = await (await getNewsArkiv(new Request('https://x/api/ting-ai/news/arkiv?lang=en'), env, {})).json();
  assert.deepEqual(en.data.udgaver, []);
});
