// Tinget som MCP-server: værktøjerne. Hvert værktøj er et tyndt lag over RPC-entrypointet TingMcp i tingsvad-ting-ai,
// som ejer kvoter, rate limits, D1, KV og Durable Objects. Her: skemaer, beskrivelser og svar i tone.
// Beskrivelserne er på engelsk (agenter læser dem); svarene følger parameteren `sprog` (da/en, standard da).
import { McpServer } from '@modelcontextprotocol/server';
import { z } from 'zod';

export const VERSION = '1.0.0';
const sprog = z.enum(['da', 'en']).optional().describe('Language of the answer: da (Danish, default) or en (English).');

export const INSTRUCTIONS = `This is the thing at the ford (tingsvad.dk): a fictional Viking assembly from 980 that has adjourned the case of the cow every year since. Everything here is fiction except what the site marks as history.
Read tools are free to use. Three tools write to the live site and are shared with human guests: rejs_sag (guestbook, 3 cases per day for all agents together), stem (one vote per round) and flyt_stolen (the shared stool). Use them sparingly and only when your user asks.
afgoer_sagen always adjourns. That is the point.`;

/** Svaret fra TingMcp → MCP-værktøjsresultat. */
export function svar(r, overskrift, en = false) {
  if (!r || !r.ok) {
    const besked = (r && r.besked) || 'The thing did not answer.';
    return { isError: true, content: [{ type: 'text', text: besked + (r && r.retryAfter ? ` (retry after ${r.retryAfter} s)` : '') }], structuredContent: { ok: false, code: (r && r.code) || 'upstream', besked, retryAfter: r && r.retryAfter } };
  }
  return { content: [{ type: 'text', text: (overskrift ? overskrift(r.data, en) + '\n\n' : '') + JSON.stringify(r.data, null, 2) }], structuredContent: r.data };
}

const ikkeTilsluttet = { ok: false, code: 'not_configured', besked: 'Denne del af tinget er ikke tilsluttet. / This part of the thing is not connected.', retryAfter: 60 };

/** Ét McpServer pr. request (createMcpHandler-mønstret). ting = service binding (entrypoint TingMcp); klient = 32 hex. */
export function lavServer(ting, klient) {
  const server = new McpServer({ name: 'tingsvad', title: 'Tinget ved vadestedet', version: VERSION, websiteUrl: 'https://tingsvad.dk/maskinrummet/#mcp' }, { instructions: INSTRUCTIONS });
  const kald = async (metode, input) => {
    if (!ting || typeof ting[metode] !== 'function') return ikkeTilsluttet;
    try { return await ting[metode]({ ...input, klient, lang: input.sprog === 'en' ? 'en' : 'da' }); }
    catch (e) { return { ok: false, code: 'upstream', besked: 'Nettet svarede ikke. / The network did not answer.', retryAfter: 30 }; }
  };
  const laes = { readOnlyHint: true, openWorldHint: false };
  const skriv = { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false };

  server.registerTool('tingets_status', {
    title: 'Tingets status',
    description: 'The state of the thing right now: its age (counted from midsummer 980), the latest daily audit, where the shared stool stands, and the newest guestbook case. Read-only.',
    inputSchema: { sprog }, annotations: laes,
  }, async i => svar(await kald('status', i), (d, en) => en ? `The thing is ${d.tingetsAlder} years old. The cow: ${d.koen}` : `Tinget er ${d.tingetsAlder} år. Koen: ${d.koen}`, i.sprog === 'en'));

  server.registerTool('slaa_op_i_protokollen', {
    title: 'Slå op i protokollen',
    description: 'Semantic search in the thing’s archive and minutes (Vectorize + bge-m3). Returns verbatim excerpts with their source, never generated text. Read-only; counts towards a small daily allowance.',
    inputSchema: { spoergsmaal: z.string().min(2).max(200).describe('What to look up, e.g. "the cow" or "women’s right to vote".'), sprog }, annotations: laes,
  }, async i => svar(await kald('protokol', { q: i.spoergsmaal, sprog: i.sprog })));

  server.registerTool('spoerg_arkivet', {
    title: 'Spørg arkivet',
    description: 'Ask Mímir, the archivist, anything about the site. He answers in 2–4 sentences only from the site’s own pages (Cloudflare AI Search over the Markdown versions) and returns the source pages as links. Read-only; shares a small daily allowance with human guests.',
    inputSchema: { spoergsmaal: z.string().min(3).max(200).describe('The question, e.g. "Who is Ragnhild?" or "Why is the cow case adjourned?".'), sprog }, annotations: laes,
  }, async i => svar(await kald('arkiv', { q: i.spoergsmaal, sprog: i.sprog }), (d, en) => d.svar || (en ? 'Mímir found these pages:' : 'Mímir fandt disse sider:'), i.sprog === 'en'));

  server.registerTool('hittegods_soeg', {
    title: 'Søg i hittegodskontoret',
    description: 'Describe something you lost; the lost property office finds the closest items in its fixed catalogue of 41 objects (semantic search). Answers come from the catalogue, never from a model. Read-only.',
    inputSchema: { beskrivelse: z.string().min(2).max(120).describe('What was lost, e.g. "a wet sock" or "something to sit on".'), sprog }, annotations: laes,
  }, async i => svar(await kald('hittegods', { q: i.beskrivelse, sprog: i.sprog })));

  server.registerTool('laes_gaestebogen', {
    title: 'Læs gæstebogen',
    description: 'The newest cases raised in the guestbook (the thing’s case register), newest first, followed by the three founding cases. Read-only.',
    inputSchema: { antal: z.number().int().min(1).max(20).optional().describe('How many cases (1–20, default 10).'), sprog }, annotations: laes,
  }, async i => svar(await kald('gaestebog', i)));

  server.registerTool('rejs_sag', {
    title: 'Rejs en sag',
    description: 'WRITES to the live site: raises a case in the public guestbook, marked “· MCP”. Only when your user asks. Limits: 3 cases per day for all agents together, one per client every 2 minutes. Keep it civil; the administrator removes anything else.',
    inputSchema: { sag: z.string().min(4).max(400).describe('The case, 4–400 characters.'), navn: z.string().max(48).optional().describe('Who raises it (default “Ukendt agent”).'), sprog }, annotations: skriv,
  }, async i => svar(await kald('rejsSag', i), (d, en) => en ? `Case ${d.sag.nr} has been raised. It is adjourned.` : `Sag ${d.sag.nr} er rejst. Den er udsat.`, i.sprog === 'en'));

  server.registerTool('stem', {
    title: 'Stem i Den Store Afstemning',
    description: 'WRITES to the live site: takes a free seat (of seven) in the current round of the Great Vote and casts one vote: ja (yes), nej (no) or eventuelt (any other business). Human guests see it live. One vote per client per round; rounds last 30 seconds.',
    inputSchema: { stemme: z.enum(['ja', 'nej', 'eventuelt']).describe('ja, nej or eventuelt.'), sprog }, annotations: skriv,
  }, async i => svar(await kald('stem', i), (d, en) => en ? `Vote cast in seat ${d.plads}: ${d.stemme}.` : `Stemme afgivet på plads ${d.plads}: ${d.stemme}.`, i.sprog === 'en'));

  server.registerTool('flyt_stolen', {
    title: 'Flyt den fælles stol',
    description: 'WRITES to the live site: moves the one shared stool on the ford (a 12 × 6 grid; columns 5–6 are the river, only the stepping stones hold) 1–3 steps in one direction. Guests on tingsvad.dk/oplevelser/stolen/ see it move. Toke waits at x=10, y=3.',
    inputSchema: { retning: z.enum(['nord', 'syd', 'oest', 'vest']).describe('nord (up), syd (down), oest (east/right) or vest (west/left).'), skridt: z.number().int().min(1).max(3).optional().describe('Steps, 1–3 (default 1).'), sprog }, annotations: skriv,
  }, async i => svar(await kald('flytStol', i), (d, en) => en ? `The stool now stands at (${d.stolen.x}, ${d.stolen.y}).` : `Stolen står nu på (${d.stolen.x}, ${d.stolen.y}).`, i.sprog === 'en'));

  server.registerTool('afgoer_sagen', {
    title: 'Afgør sagen om koen',
    description: 'Asks the thing to decide the case of the cow. It always adjourns. Counts one attempt on the same counter as the button on the site.',
    inputSchema: { sprog }, annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  }, async i => svar(await kald('afgoer', i), d => d.afgoerelse));

  return server;
}

/** Klient-id: SHA-256 af IP og dato (Europe/Copenhagen). Skifter hvert døgn; IP'en forlader aldrig denne Worker. */
export async function klientId(ip, dato) {
  const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`tingsvad-mcp:${ip || 'x'}:${dato}`));
  return [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, '0')).join('').slice(0, 32);
}
export const cphDato = (d = new Date()) => new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Copenhagen' }).format(d);
