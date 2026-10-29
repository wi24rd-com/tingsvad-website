// Gæstebogens sagsliste i KV (SAGER): fælles for Pages-funktionen /api/sager og tingets MCP-server (Workeren tingsvad-ting-ai).
// Nøgler: 'liste' (JSON, nyeste først, højst 500) og 'taeller'. Read-modify-write som hidtil (KV har ingen transaktioner).
export const GRUNDSAGER = [
  { nr: '980-0003', navn: 'Toke den Yngre', sag: 'Jeg vil gerne sidde ned. Stolen står lige der.', dato: '1010' },
  { nr: '980-0002', navn: 'Mímir', sag: 'Jeg vil gerne have en ny protokol. Den gamle er våd.', dato: '1943' },
  { nr: '980-0001', navn: 'Ragnhild Tingsvad', sag: 'Jeg har løsningen på sagen om koen. Den tager tredive sekunder. Jeg har også to økser, hvis tinget vil have det overstået hurtigere. Jeg står på bredden. I ved, hvor jeg er. I har vidst det siden år 1000.', dato: '1000' },
];
export const ren = s => String(s || '').replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim();

export async function laesSager(kv, max = 50) {
  const liste = (await kv.get('liste', 'json')) || [];
  return [...liste.slice(0, max), ...GRUNDSAGER];
}

/** Skriver en ny sag og returnerer den. navn/sag skal være renset og valideret af kalderen. kilde: 'mcp' for agenter. */
export async function skrivSag(kv, { navn, sag, kilde }) {
  const liste = (await kv.get('liste', 'json')) || [];
  const n = (await kv.get('taeller', 'text')) | 0;
  const nr = '980-' + String(n + 1 + GRUNDSAGER.length).padStart(4, '0');
  const ny = { nr, navn, sag, dato: new Date().toISOString().slice(0, 10), ...(kilde ? { kilde } : {}) };
  liste.unshift(ny);
  await Promise.all([kv.put('liste', JSON.stringify(liste.slice(0, 500))), kv.put('taeller', String(n + 1))]);
  return ny;
}
