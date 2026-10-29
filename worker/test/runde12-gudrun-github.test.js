// Runde 12: GitHub-udfaldet for revisionen gemmes i KV, så siden kan vise det, og kun ufarlige felter kommer med.
import test from 'node:test';
import assert from 'node:assert/strict';
import { githubUdfald, gemGithubUdfald, hentGithubUdfald, githubNoegle } from '../src/features/gudrun-github.js';

test('githubUdfald keeps only state, issue numbers and a valid repo name', () => {
  assert.deepEqual(githubUdfald({ github: 'opened', issue: 12, error: 'secret' }, 'wi24rd-com/tingsvad-website'), { state: 'opened', issue: 12, issues: [], repo: 'wi24rd-com/tingsvad-website' });
  assert.deepEqual(githubUdfald({ github: 'closed', issues: [3, 'x', -1, 4] }, 'nope'), { state: 'closed', issue: null, issues: [3, 4], repo: null });
  assert.equal(githubUdfald({ github: 'weird' }).state, 'failed');
  assert.equal(githubUdfald(null).state, 'failed');
});

test('gem/hent round-trips through KV with a TTL; missing binding or bad data gives null', async () => {
  const lager = new Map(); let ttl;
  const env = { GITHUB_REPO: 'a/b', SAGER: { put: async (k, v, o) => { lager.set(k, v); ttl = o.expirationTtl; }, get: async (k, t) => (lager.has(k) ? JSON.parse(lager.get(k)) : null) } };
  assert.equal(await gemGithubUdfald(env, '2026-10-28', { github: 'quiet' }), true);
  assert.ok(lager.has(githubNoegle('2026-10-28')));
  assert.equal(ttl, 14 * 86400);
  const v = await hentGithubUdfald(env, '2026-10-28');
  assert.equal(v.state, 'quiet'); assert.equal(v.repo, 'a/b');
  assert.equal(await hentGithubUdfald(env, '2026-10-27'), null);
  assert.equal(await hentGithubUdfald({}, '2026-10-28'), null);
  assert.equal(await gemGithubUdfald({}, '2026-10-28', { github: 'quiet' }), false);
  const bad = { SAGER: { get: async () => ({ state: 'hacked' }) } };
  assert.equal(await hentGithubUdfald(bad, 'x'), null);
});
