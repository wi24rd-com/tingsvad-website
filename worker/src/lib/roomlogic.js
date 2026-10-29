// Ren tilstandslogik for afstemningsrummet (C02), uden I/O, så den kan testes i Node.
// Serveren er autoritativ: syv pladser, en afgrænset runde, én stemme pr. plads, reconnect giver ikke en ekstra stemme.
export const SEATS = 7, VOTES = ['ja', 'nej', 'eventuelt'];
export const CLOSED_MS = 12_000, GRACE_MS = 45_000;

export function freshState(roundNo = 1) {
  return { version: 0, round: roundNo, phase: 'lobby', deadline: null, slots: {}, votes: { ja: 0, nej: 0, eventuelt: 0 }, closedAt: null };
}
const touch = st => { st.version++; return st; };

export function join(st, owner, slot, now, roundMs) {
  if (st.phase === 'closed') return { ok: false, code: 'closed' };
  if (!Number.isInteger(slot) || slot < 1 || slot > SEATS) return { ok: false, code: 'bad_slot' };
  const mine = seatOf(st, owner);
  if (mine) return { ok: true, slot: mine, already: true };
  if (st.slots[slot]) return { ok: false, code: 'taken', full: Object.keys(st.slots).length >= SEATS };
  st.slots[slot] = { owner, vote: null, joinedAt: now, lastSeen: now };
  if (st.phase === 'lobby') { st.phase = 'voting'; st.deadline = now + roundMs; }
  touch(st); return { ok: true, slot };
}
export function vote(st, owner, v, now) {
  const slot = seatOf(st, owner);
  if (!slot) return { ok: false, code: 'no_seat' };
  if (st.phase !== 'voting' || (st.deadline && now >= st.deadline)) return { ok: false, code: 'not_voting' };
  if (!VOTES.includes(v)) return { ok: false, code: 'bad_vote' };
  const s = st.slots[slot];
  if (s.vote) return { ok: false, code: 'already_voted' };
  s.vote = v; st.votes[v]++; touch(st); return { ok: true, slot, vote: v };
}
export function leave(st, owner) {
  const slot = seatOf(st, owner); if (!slot) return false;
  // En afgivet stemme bliver stående på pladsen (runden er autoritativ); kun ubrugte pladser frigives.
  if (!st.slots[slot].vote || st.phase !== 'voting') delete st.slots[slot];
  else st.slots[slot].left = true;
  touch(st); return true;
}
export function seen(st, owner, now) { const slot = seatOf(st, owner); if (slot) st.slots[slot].lastSeen = now; }
export function seatOf(st, owner) { for (const k in st.slots) if (st.slots[k].owner === owner) return +k; return null; }

/** Tidsstyring: lukker runden ved frist, starter ny runde efter CLOSED_MS, rydder forladte ubrugte pladser. Returnerer hændelser. */
export function tick(st, now, hasSocket) {
  const events = [];
  if (st.phase === 'voting' && st.deadline && now >= st.deadline) { st.phase = 'closed'; st.closedAt = now; st.deadline = null; touch(st); events.push('closed'); }
  if (st.phase === 'closed' && st.closedAt && now >= st.closedAt + CLOSED_MS) { const n = st.round + 1; Object.assign(st, freshState(n), { version: st.version + 1 }); events.push('new_round'); }
  if (st.phase !== 'closed') for (const k in st.slots) { const s = st.slots[k]; if (!s.vote && !hasSocket(s.owner) && now - (s.lastSeen || s.joinedAt) > GRACE_MS) { delete st.slots[k]; touch(st); events.push('expired'); } }
  if (st.phase === 'voting' && !Object.keys(st.slots).length) { Object.assign(st, freshState(st.round), { version: st.version + 1 }); events.push('reset'); }
  return events;
}
export function nextAlarm(st, now) {
  if (st.phase === 'voting' && st.deadline) return Math.min(st.deadline, now + GRACE_MS);
  if (st.phase === 'closed' && st.closedAt) return st.closedAt + CLOSED_MS;
  return Object.keys(st.slots).length ? now + GRACE_MS : null;
}
export function snapshot(st, owner, now, connections) {
  const slots = []; for (let i = 1; i <= SEATS; i++) slots.push({ n: i, taken: !!st.slots[i] });
  const mine = seatOf(st, owner);
  return { type: 'snapshot', version: st.version, round: st.round, phase: st.phase, deadline: st.deadline, now, slots, votes: { ...st.votes }, full: Object.keys(st.slots).length >= SEATS, connections, you: mine ? { slot: mine, vote: st.slots[mine].vote } : null };
}
