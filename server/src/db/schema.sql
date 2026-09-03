-- Users are owned by Firebase Auth. We store scans keyed by Firebase UID
-- directly — no local users table, no FK constraint.
--
-- Photos live in Cloudinary; we only persist the `public_id` and derive both
-- full-size and thumbnail URLs on read via delivery transformations
-- (f_auto,q_auto → WebP/AVIF where supported). When Cloudinary is not
-- configured we still record the scan with an empty string here.

CREATE TABLE IF NOT EXISTS scans (
  id              TEXT PRIMARY KEY,
  user_id         TEXT NOT NULL,
  photo_public_id TEXT NOT NULL,
  analysis_json   JSONB NOT NULL,
  routine_json    JSONB NOT NULL,
  overall_score   INTEGER NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_scans_user_created
  ON scans (user_id, created_at DESC);

-- Adherence checks — one row per (user, date). `step_ids` is the set of
-- completed step identifiers for that date; empty array is valid and means
-- the user has explicitly cleared all their marks for the day.
CREATE TABLE IF NOT EXISTS adherence (
  user_id     TEXT NOT NULL,
  date        DATE NOT NULL,
  step_ids    JSONB NOT NULL DEFAULT '[]'::jsonb,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, date)
);

CREATE INDEX IF NOT EXISTS idx_adherence_user
  ON adherence (user_id);

-- Cache for Amazon Real-Time Data API responses. Keyed by normalized search
-- query so multiple users benefit from the same cached ingredient lookups.
-- TTL is enforced at read time by comparing `fetched_at` to NOW().
CREATE TABLE IF NOT EXISTS amazon_search_cache (
  query       TEXT PRIMARY KEY,
  results     JSONB NOT NULL,
  fetched_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_amazon_cache_fetched
  ON amazon_search_cache (fetched_at);
