-- Ravnepost (runde 9): indgående breve til *@ravn.tingsvad.dk via Cloudflare Email Routing → Email Worker.
-- Kun emne, et kort uddrag og tidspunkt gemmes. Afsenderen gemmes kun som hash (til rate limiting), aldrig som adresse.
-- Et brev vises kun offentligt, hvis afsenderen selv har bedt om det ([offentlig]/[public] i emnet) OG det er godkendt.
CREATE TABLE IF NOT EXISTS ravn_post (
  id TEXT PRIMARY KEY,
  received_at TEXT NOT NULL,
  to_local TEXT NOT NULL,              -- fx 'brev'
  subject TEXT NOT NULL,
  uddrag TEXT NOT NULL,
  public_request INTEGER NOT NULL DEFAULT 0,
  approved INTEGER NOT NULL DEFAULT 0,
  sender_hash TEXT NOT NULL,
  size INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS ravn_post_offentlig ON ravn_post (approved, public_request, received_at);
CREATE INDEX IF NOT EXISTS ravn_post_afsender ON ravn_post (sender_hash, received_at);
