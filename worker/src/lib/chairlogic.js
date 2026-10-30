// Den fælles stol (runde 9): ren logik uden I/O, så den kan testes. Serveren ejer positionen; klienter beder kun om ét skridt.
// Vadestedet er 12 × 6 felter. Kolonne 5–6 er åen; kun vadestenene kan bære en stol.
export const W = 12, H = 6;
export const START = { x: 2, y: 3 };
export const TOKE = { x: 10, y: 3 }; // Toke står her og venter på at sidde ned
const STEN = new Set(['5,1', '6,2', '5,3', '6,3', '5,5', '6,4', '5,0']); // syv vadesten; den fjerde (5,3) er løs
export const LØS = '5,3';
export const erÅ = (x, y) => (x === 5 || x === 6) && !STEN.has(`${x},${y}`);
export function feltType(x, y) { const k = `${x},${y}`; return k === LØS ? 'loes' : STEN.has(k) ? 'sten' : erÅ(x, y) ? 'aa' : x === TOKE.x && y === TOKE.y ? 'toke' : 'bred'; }

export function freshState() { return { x: START.x, y: START.y, moves: 0, last: 0, lastBy: '', wobbles: 0, visits: 0, version: 1 }; }

export const RATE_MS = 250, BURST = 12, WINDOW_MS = 10_000;
/** Ét skridt. Returnerer {ok, code?, event?}. Ændrer kun state ved ok. */
export function move(st, rate, owner, dx, dy, now) {
  dx = dx | 0; dy = dy | 0;
  if (Math.abs(dx) + Math.abs(dy) !== 1) return { ok: false, code: 'one_step' };
  const r = rate[owner] || (rate[owner] = { t: 0, n: 0, w: now });
  if (now - r.w > WINDOW_MS) { r.w = now; r.n = 0; }
  if (now - r.t < RATE_MS || r.n >= BURST) return { ok: false, code: 'too_fast' };
  const x = st.x + dx, y = st.y + dy;
  if (x < 0 || y < 0 || x >= W || y >= H) return { ok: false, code: 'edge' };
  if (erÅ(x, y)) return { ok: false, code: 'river' };
  r.t = now; r.n++;
  st.x = x; st.y = y; st.moves++; st.last = now; st.lastBy = owner;
  let event = null;
  if (`${x},${y}` === LØS) { st.wobbles++; event = 'wobble'; }
  if (x === TOKE.x && y === TOKE.y) { st.visits++; event = 'toke'; }
  return { ok: true, event };
}
/** Det, en klient må se. Ejer-id'er afsløres aldrig; kun om det var dig selv. */
export function snapshot(st, owner, online, now) {
  return { type: 'snapshot', x: st.x, y: st.y, w: W, h: H, moves: st.moves, wobbles: st.wobbles, visits: st.visits, online, lastAgoMs: st.last ? now - st.last : null, lastWasYou: !!owner && st.lastBy === owner, toke: TOKE };
}
