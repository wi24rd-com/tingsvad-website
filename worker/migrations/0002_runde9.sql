-- Runde 9: Ravnecentralen (bilag som baggrundsjob) og Revisionen (Gudruns daglige gennemgang af siderne).
CREATE TABLE IF NOT EXISTS ravn_jobs (
  id TEXT PRIMARY KEY,                 -- R-YYYYMMDD-XXXXXX
  owner_hash TEXT NOT NULL,
  kind TEXT NOT NULL,                  -- 'sagsmappe'
  input_hash TEXT NOT NULL,            -- sha256 af normaliseret input: samme bestilling giver samme job
  input_json TEXT NOT NULL,
  language TEXT NOT NULL,
  state TEXT NOT NULL,                 -- i_koe → modtaget → flyver → skriver → leveret | fejlet
  steps_json TEXT NOT NULL,            -- [{s, at}]
  attempts INTEGER NOT NULL DEFAULT 0,
  via TEXT NOT NULL,                   -- 'queue' | 'direct'
  result_key TEXT,
  error TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE (owner_hash, kind, input_hash)
);
CREATE INDEX IF NOT EXISTS ravn_jobs_owner ON ravn_jobs (owner_hash, created_at);

CREATE TABLE IF NOT EXISTS revisioner (
  date_key TEXT PRIMARY KEY,           -- én revision pr. dag (Europe/Copenhagen)
  state TEXT NOT NULL,                 -- running | done | failed
  pages INTEGER NOT NULL DEFAULT 0,
  passed INTEGER NOT NULL DEFAULT 0,
  failed INTEGER NOT NULL DEFAULT 0,
  started_at TEXT NOT NULL,
  finished_at TEXT
);
CREATE TABLE IF NOT EXISTS revision_sider (
  date_key TEXT NOT NULL,
  side TEXT NOT NULL,                  -- fx 'historien-da'
  path TEXT NOT NULL,
  status TEXT NOT NULL,                -- bestaaet | fejlet
  http INTEGER,
  dele TEXT,                           -- x-tingsvad-dele fra middleware
  mangler_json TEXT,                   -- nøgleelementer, der ikke blev fundet
  fejl_json TEXT,                      -- JavaScript-fejl opsamlet på siden
  screenshot_key TEXT,
  browser_ms INTEGER,
  checked_at TEXT NOT NULL,
  PRIMARY KEY (date_key, side)
);
