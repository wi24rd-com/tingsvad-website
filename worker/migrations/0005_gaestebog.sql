-- Runde 13 (AP7): gæstebogen, afgørelsestælleren og dagens besøgende flyttes fra KV (read-modify-write) til D1,
-- så sagsnumre og tællinger er atomiske (ChatGPT T2). Første skrivning importerer KV-listen én gang (worker/src/lib/gaestebog.js).
CREATE TABLE IF NOT EXISTS gaestebog (
  id INTEGER PRIMARY KEY AUTOINCREMENT,        -- sagsnummer = '980-' + (id + 3); de tre grundsager er 0001–0003
  navn TEXT NOT NULL, sag TEXT NOT NULL, dato TEXT NOT NULL, kilde TEXT,
  oprettet TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  slettet TEXT, slettet_af TEXT                 -- admin-sletning: rækken bliver stående uden tekst (nr, dato, hvem)
);
CREATE INDEX IF NOT EXISTS gaestebog_aktiv ON gaestebog (slettet, id);
CREATE TABLE IF NOT EXISTS taellere (navn TEXT PRIMARY KEY, n INTEGER NOT NULL DEFAULT 0);
CREATE TABLE IF NOT EXISTS besoeg (dag TEXT NOT NULL, h TEXT NOT NULL, PRIMARY KEY (dag, h));
-- Opfølgning fra analysen: stolens sager slås op pr. ejer og tilstand.
CREATE INDEX IF NOT EXISTS chair_cases_ejer ON chair_cases (owner_hash, state);
