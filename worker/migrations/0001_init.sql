-- tingsvad-ting-ai: grundskema. Ingen komplette brugersamtaler gemmes; retssalens runder udløber efter 20 min.
CREATE TABLE IF NOT EXISTS daily_editions (
  date_key TEXT NOT NULL, language TEXT NOT NULL, status TEXT NOT NULL, body_json TEXT NOT NULL,
  source TEXT NOT NULL, published_at TEXT, PRIMARY KEY (date_key, language)
);
CREATE TABLE IF NOT EXISTS radio_editions (
  date_key TEXT NOT NULL, language TEXT NOT NULL, script TEXT NOT NULL, script_hash TEXT NOT NULL,
  audio_key TEXT, voice TEXT, status TEXT NOT NULL, created_at TEXT NOT NULL, PRIMARY KEY (date_key, language)
);
CREATE TABLE IF NOT EXISTS generation_jobs (
  id TEXT PRIMARY KEY, kind TEXT NOT NULL, cache_key TEXT NOT NULL UNIQUE, owner_hash TEXT, state TEXT NOT NULL,
  error_code TEXT, lease_until INTEGER NOT NULL, result_json TEXT, created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS media_assets (
  key TEXT PRIMARY KEY, content_type TEXT NOT NULL, prompt_version TEXT NOT NULL, model TEXT NOT NULL,
  meta_json TEXT, created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS chair_cases (
  id TEXT PRIMARY KEY, owner_hash TEXT NOT NULL, token_hash TEXT NOT NULL, state INTEGER NOT NULL DEFAULT 0,
  wishes TEXT, language TEXT NOT NULL, history_json TEXT NOT NULL, next_at TEXT, updated_at TEXT NOT NULL, created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS chair_transitions (
  case_id TEXT NOT NULL, step_key TEXT NOT NULL, done_at TEXT NOT NULL, PRIMARY KEY (case_id, step_key)
);
CREATE TABLE IF NOT EXISTS event_totals (
  day_key TEXT NOT NULL, event_type TEXT NOT NULL, count INTEGER NOT NULL DEFAULT 0, PRIMARY KEY (day_key, event_type)
);
CREATE TABLE IF NOT EXISTS quota_buckets (
  scope TEXT NOT NULL, bucket_key TEXT NOT NULL, used INTEGER NOT NULL DEFAULT 0, PRIMARY KEY (scope, bucket_key)
);
CREATE TABLE IF NOT EXISTS quota_reservations (
  id TEXT PRIMARY KEY, scope TEXT NOT NULL, bucket_key TEXT NOT NULL, expires_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_quota_res ON quota_reservations (scope, bucket_key, expires_at);
CREATE TABLE IF NOT EXISTS rate_limits (
  scope TEXT NOT NULL, key TEXT NOT NULL, window_start INTEGER NOT NULL, n INTEGER NOT NULL DEFAULT 0, PRIMARY KEY (scope, key, window_start)
);
CREATE TABLE IF NOT EXISTS idempotency_keys (
  key TEXT PRIMARY KEY, owner_hash TEXT NOT NULL, endpoint TEXT NOT NULL, input_hash TEXT NOT NULL,
  status INTEGER, response_json TEXT, created_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS court_rounds (
  ref TEXT PRIMARY KEY, owner_hash TEXT NOT NULL, language TEXT NOT NULL, argument TEXT NOT NULL, speeches_json TEXT NOT NULL,
  replied INTEGER NOT NULL DEFAULT 0, expires_at INTEGER NOT NULL
);
