// Workflow for stolsager (C06): vedvarende sleep + idempotente overgange i D1. Kører videre, mens browseren er lukket.
import { WorkflowEntrypoint } from 'cloudflare:workers';
import { transition, delays, STEPS } from './features/jobs.js';
import { overgang, skrivBilag } from './features/ravn.js';
import { revisionsliste, revisérSide, afslut, registrerFejl, fuldDag } from './features/revision.js';
import { gudrunPaaGithub, gemGithubUdfald } from './features/gudrun-github.js';

export class ChairCaseWorkflow extends WorkflowEntrypoint {
  async run(event, step) {
    const caseId = String(event.payload && event.payload.caseId || '');
    if (!/^S-\d{8}-[A-F0-9]{6}$/.test(caseId)) return { error: 'bad caseId' };
    const d = delays(this.env);
    const log = [];
    for (let i = 0; i < STEPS - 1; i++) {
      await step.sleep(`sleep-${i}`, `${d[i]} seconds`);
      const r = await step.do(`transition-${i}`, { retries: { limit: 5, delay: '10 seconds', backoff: 'exponential' } }, () => transition(this.env.DB, caseId, i, d[i + 1] || 0));
      log.push(r);
    }
    return { caseId, log };
  }
}

// Ravnecentralen (runde 9): ét bilag pr. instans. Hvert trin er en idempotent overgang i D1; selve skrivningen genforsøges.
export class RavnWorkflow extends WorkflowEntrypoint {
  async run(event, step) {
    const id = String(event.payload && event.payload.id || '');
    if (!/^R-\d{8}-[A-F0-9]{6}$/.test(id)) return { error: 'bad id' };
    const db = this.env.DB;
    try {
      await step.do('modtaget', () => overgang(db, id, ['i_koe'], 'modtaget'));
      await step.sleep('ravnen-letter', '3 seconds');
      await step.do('flyver', () => overgang(db, id, ['modtaget'], 'flyver'));
      const key = await step.do('skriver', { retries: { limit: 3, delay: '15 seconds', backoff: 'exponential' }, timeout: '2 minutes' }, async () => {
        await overgang(db, id, ['flyver'], 'skriver');
        return await skrivBilag(this.env, id);
      });
      await step.do('leveret', () => overgang(db, id, ['skriver'], 'leveret', { result_key: key }));
      return { id, key };
    } catch (e) {
      await step.do('fejlet', () => overgang(db, id, ['i_koe', 'modtaget', 'flyver', 'skriver'], 'fejlet', { error: String(e && e.message || e).slice(0, 200) }));
      return { id, error: true };
    }
  }
}

// Revisionen (runde 9): én instans pr. dato; én side pr. step med pause imellem (Browser Run på gratisplanen: én Quick Action pr. 10 s).
export class RevisionWorkflow extends WorkflowEntrypoint {
  async run(event, step) {
    const dateKey = String(event.payload && event.payload.dateKey || '');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) return { error: 'bad date' };
    const liste = revisionsliste(), resultat = [], fuld = fuldDag(dateKey);
    for (let i = 0; i < liste.length; i++) {
      if (i && resultat[i - 1] && resultat[i - 1].browser !== false) await step.sleep(`pause-${i}`, '12 seconds'); // pause kun efter et browsertjek (step-resultater er gemt, så forløbet er deterministisk)
      try { resultat.push(await step.do(`side-${liste[i].side}`, { retries: { limit: 2, delay: '20 seconds', backoff: 'linear' }, timeout: '90 seconds' }, () => revisérSide(this.env, dateKey, liste[i], { fuld }))); }
      catch (e) { // én side må ikke stoppe revisionen, men den skal stå som fejlet
        const besked = String(e && e.message).slice(0, 120);
        resultat.push(await step.do(`fejl-${liste[i].side}`, () => registrerFejl(this.env, dateKey, liste[i], besked)));
      }
    }
    const sum = await step.do('afslut', () => afslut(this.env, dateKey));
    let github; // GitHub må aldrig vælte revisionen: tre forsøg, derefter noteres fejlen i Workflow-loggen
    try { github = await step.do('github', { retries: { limit: 3, delay: '30 seconds', backoff: 'exponential' }, timeout: '60 seconds' }, () => gudrunPaaGithub(this.env, dateKey)); }
    catch (e) { github = { github: 'failed', error: String(e && e.message).slice(0, 120) }; }
    // Udfaldet gemmes, så revisionssiden kan vise det (KV, to uger; fejler det, er det kun visningen, der mangler)
    try { await step.do('github-gem', () => gemGithubUdfald(this.env, dateKey, github)); } catch (e) { }
    return { ...sum, ...github };
  }
}
