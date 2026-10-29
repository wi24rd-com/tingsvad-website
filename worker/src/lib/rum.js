// Runde 13 (M4): tilladte rumnavne for TingRoom (afstemningen). Alt andet er 404, så vilkårlige ?room=-navne ikke
// opretter Durable Objects (hver med egen SQLite) i det uendelige. Nye rum tilføjes her.
export const RUM = new Set(['vadestedet']);
export const rumNavn = raw => { const r = String(raw || 'vadestedet').replace(/[^a-z0-9-]/g, '').slice(0, 24) || 'vadestedet'; return RUM.has(r) ? r : null; };
