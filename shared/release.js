// Release-id (runde 13, AP7 – ChatGPT T5): hvilken udgave svarer? `RELEASE` sættes ved deploy (--var RELEASE:<commit>:
// Workers Builds giver $WORKERS_CI_COMMIT_SHA, npm run deploy bruger git rev-parse), og version_metadata-bindingen
// giver Workers' eget versions-id og tidspunkt. CI venter på commit'en i /api/kant i stedet for på en ?v=-hash.
// Workers Builds' preview-kommando kan ikke sætte en var (previews.vars vinder), så commit'en kan også bages ind ved bundling:
//   --define __RELEASE__:'"<commit>"'   (esbuild erstatter identifikatoren; uden define er den udefineret)
/* global __RELEASE__ */
const INDBAGT = typeof __RELEASE__ === 'string' ? __RELEASE__ : null;
export function release(env) {
  const m = (env && env.CF_VERSION_METADATA) || {};
  const raa = typeof env?.RELEASE === 'string' && env.RELEASE ? env.RELEASE : INDBAGT;
  const commit = typeof raa === 'string' && /^[0-9a-f]{7,40}$/.test(raa) ? raa : null;
  return { commit, version: m.id || null, tag: m.tag || null, timestamp: m.timestamp || null };
}
