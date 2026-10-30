// Release-id (runde 13, AP7 – ChatGPT T5): hvilken udgave svarer? `RELEASE` sættes ved deploy (--var RELEASE:<commit>:
// Workers Builds giver $WORKERS_CI_COMMIT_SHA, npm run deploy bruger git rev-parse), og version_metadata-bindingen
// giver Workers' eget versions-id og tidspunkt. CI venter på commit'en i /api/kant i stedet for på en ?v=-hash.
export function release(env) {
  const m = (env && env.CF_VERSION_METADATA) || {};
  const commit = typeof env?.RELEASE === 'string' && /^[0-9a-f]{7,40}$/.test(env.RELEASE) ? env.RELEASE : null;
  return { commit, version: m.id || null, tag: m.tag || null, timestamp: m.timestamp || null };
}
