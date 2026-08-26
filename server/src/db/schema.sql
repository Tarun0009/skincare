CREATE TABLE IF NOT EXISTS users (
  id           TEXT PRIMARY KEY,
  email        TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at   TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS scans (
  id           TEXT PRIMARY KEY,
  user_id      TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  photo_path   TEXT NOT NULL,
  thumb_path   TEXT NOT NULL,
  analysis_json TEXT NOT NULL,
  routine_json TEXT NOT NULL,
  overall_score INTEGER NOT NULL,
  created_at   TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_scans_user_created
  ON scans(user_id, created_at DESC);
