// Runde 10, trin 4d: Gudruns GitHub-issues ved fejlet revision (idempotent oprettelse, lukning når alt består, ingen interne detaljer).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { issueTekst, gudrunPaaGithub, githubEnabled, markoer } from '../src/features/gudrun-github.js';
import { revisionsliste } from '../src/features/revision.js';

const DATO = '2026-10-28';
const alle = revisionsliste();
const bestaaet = alle.map(p => ({ side: p.side, path: p.path, status: 'bestaaet', http: 200, mangler_json: '[]', fejl_json: '[]' }));
const db = rows => ({ prepare: () => ({ bind: () => ({ all: async () => ({ results: rows }) }) }) });
const env = (rows, extra = {}) => ({ DB: db(rows), GITHUB_TOKEN: 'github_pat_test', GITHUB_REPO: 'wi24rd-com/tingsvad-website', ...extra });

/** Falsk GitHub: åbne issues i hukommelsen, logger kald. */
function falskGithub(aabne = []) {
  const kald = [], issues = aabne.map(i => ({ ...i }));
  globalThis.fetch = async (url, init = {}) => {
    const u = new URL(url), m = init.method || 'GET', body = init.body ? JSON.parse(init.body) : null;
    kald.push({ m, path: u.pathname + u.search, body, auth: init.headers.authorization, ua: init.headers['user-agent'] });
    if (m === 'GET' && u.pathname.endsWith('/issues')) return Response.json(issues.filter(i => i.state === 'open'));
    if (m === 'POST' && u.pathname.endsWith('/issues')) { const i = { number: 100 + issues.length, state: 'open', ...body }; issues.push(i); return Response.json(i, { status: 201 }); }
    if (m === 'POST' && u.pathname.endsWith('/comments')) return Response.json({ id: 1 }, { status: 201 });
    if (m === 'PATCH') { const n = +u.pathname.split('/').pop(); const i = issues.find(x => x.number === n); Object.assign(i, body); return Response.json(i); }
    return new Response('nope', { status: 404 });
  };
  return { kald, issues };
}

test('githubEnabled: needs both the token and a well-formed repo', () => {
  assert.equal(githubEnabled({}), false);
  assert.equal(githubEnabled({ GITHUB_TOKEN: 'x' }), false);
  assert.equal(githubEnabled({ GITHUB_TOKEN: 'x', GITHUB_REPO: 'no slash' }), false);
  assert.equal(githubEnabled({ GITHUB_TOKEN: 'x', GITHUB_REPO: 'wi24rd-com/tingsvad-website' }), true);
});

test('issueTekst: English, a marker, a table row per failed page, and nothing internal', () => {
  const fejlede = [
    { side: 'stolen-da', path: '/oplevelser/stolen/', http: 200, mangler_json: '["felt"]', fejl_json: '["TypeError: x is undefined"]' },
    { side: 'arkivet-en', path: '/en/archive/', http: 0, mangler_json: '[]', fejl_json: '["revision: Browser Run 429 account 1234abcd quota"]' },
  ];
  const { title, body } = issueTekst(DATO, fejlede, alle.length);
  assert.equal(title, `Audit ${DATO}: 2 of ${alle.length} pages failed`);
  assert.ok(body.startsWith(markoer(DATO)));
  assert.match(body, /\| `stolen-da` \| \[\/oplevelser\/stolen\/\]\(https:\/\/tingsvad\.dk\/oplevelser\/stolen\/\) \| 200 \| missing: felt; 1 JS error \|/);
  assert.match(body, /\| `arkivet-en` .*\| – \| check could not be completed \|/);
  assert.ok(!/Browser Run 429|1234abcd|TypeError|github_pat/.test(body), 'no internal error texts or secrets');
});

test('off without configuration: no network at all', async () => {
  const { kald } = falskGithub();
  assert.deepEqual(await gudrunPaaGithub({ DB: db(bestaaet) }, DATO), { github: 'off' });
  assert.equal(kald.length, 0);
});

test('a failed audit opens one issue with the label; a retry of the same day does not open another', async () => {
  const rows = bestaaet.map(r => r.side === 'stolen-en' ? { ...r, status: 'fejlet', mangler_json: '["felt"]' } : r);
  const gh = falskGithub([{ number: 7, state: 'open', body: 'an unrelated issue' }, { number: 8, state: 'open', pull_request: {}, body: markoer(DATO) }]);
  const r1 = await gudrunPaaGithub(env(rows), DATO);
  assert.equal(r1.github, 'opened');
  const post = gh.kald.find(k => k.m === 'POST');
  assert.deepEqual(post.body.labels, ['gudrun']);
  assert.equal(post.auth, 'Bearer github_pat_test');
  assert.match(post.ua, /tingsvad-revisionen/);
  const r2 = await gudrunPaaGithub(env(rows), DATO);
  assert.deepEqual(r2, { github: 'exists', issue: r1.issue });
  assert.equal(gh.kald.filter(k => k.m === 'POST').length, 1);
});

test('pages without a row count as failed (never silently passed)', async () => {
  falskGithub();
  const r = await gudrunPaaGithub(env(bestaaet.slice(1)), DATO);
  assert.equal(r.github, 'opened');
});

test('a fully passed audit comments on and closes every open Gudrun issue, and only those', async () => {
  const gh = falskGithub([{ number: 3, state: 'open', body: markoer('2026-10-26') + '\nx' }, { number: 4, state: 'open', body: markoer('2026-10-27') }, { number: 5, state: 'open', body: 'someone else' }]);
  const r = await gudrunPaaGithub(env(bestaaet), DATO);
  assert.deepEqual(r, { github: 'closed', issues: [3, 4] });
  assert.equal(gh.issues.find(i => i.number === 5).state, 'open');
  assert.deepEqual(gh.kald.filter(k => k.m === 'PATCH').map(k => k.body), [{ state: 'closed', state_reason: 'completed' }, { state: 'closed', state_reason: 'completed' }]);
  assert.equal(gh.kald.filter(k => k.path.endsWith('/comments')).length, 2);
});

test('nothing open and everything passed: quiet', async () => {
  falskGithub();
  assert.deepEqual(await gudrunPaaGithub(env(bestaaet), DATO), { github: 'quiet', issues: [] });
});

test('a GitHub error throws (so the Workflow step retries) without leaking the repo or token', async () => {
  globalThis.fetch = async () => new Response('bad credentials', { status: 401 });
  await assert.rejects(gudrunPaaGithub(env(bestaaet), DATO), e => /→ 401/.test(e.message) && !/wi24rd|github_pat/.test(e.message));
});
