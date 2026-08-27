-- Users are owned by Firebase Auth. We store scans keyed by Firebase UID
-- directly — no local `users` table, no FK constraint.
--
-- Photos live in Cloudinary; we only persist the `public_id` and derive both
-- full-size and thumbnail URLs on read via delivery transformations
-- (f_auto,q_auto → WebP/AVIF where supported).

CREATE TABLE IF NOT EXISTS scans (
  id              TEXT PRIMARY KEY,
  user_id         TEXT NOT NULL,
  photo_public_id TEXT NOT NULL,
  analysis_json   TEXT NOT NULL,
  routine_json    TEXT NOT NULL,
  overall_score   INTEGER NOT NULL,
  created_at      TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_scans_user_created
  ON scans(user_id, created_at DESC);
