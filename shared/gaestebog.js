// Gæstebogen (runde 13): det, site-Workeren, ting-ai og MCP-serveren er enige om – grundsagerne, rensning og nummerformatet.
// Selve listen bor i D1 (ting-ai, worker/src/lib/gaestebog.js); site-Workeren skriver og læser gennem service bindingen.
// Før runde 13 lå listen i KV med read-modify-write, og to samtidige gæster kunne få samme sagsnummer (ChatGPT T2).
export const GRUNDSAGER = [
  { nr: '980-0003', navn: 'Toke den Yngre', sag: 'Jeg vil gerne sidde ned. Stolen står lige der.', dato: '1010' },
  { nr: '980-0002', navn: 'Mímir', sag: 'Jeg vil gerne have en ny protokol. Den gamle er våd.', dato: '1943' },
  { nr: '980-0001', navn: 'Ragnhild Tingsvad', sag: 'Jeg har løsningen på sagen om koen. Den tager tredive sekunder. Jeg har også to økser, hvis tinget vil have det overstået hurtigere. Jeg står på bredden. I ved, hvor jeg er. I har vidst det siden år 1000.', dato: '1000' },
];
export const ren = s => String(s || '').replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim();
export const NR = /^980-\d{4}$/;
/** D1-id → sagsnummer: de tre grundsager har 0001–0003, første gæst får 0004. */
export const nummer = id => '980-' + String(id + GRUNDSAGER.length).padStart(4, '0');
/** Sagsnummer → D1-id, eller null for grundsager og ugyldige numre. */
export const idAf = nr => { const n = NR.test(nr) ? +nr.slice(4) - GRUNDSAGER.length : 0; return n > 0 ? n : null; };
