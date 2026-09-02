import { pool } from './index.js';

export interface AdherenceRow {
  user_id: string;
  /** ISO date (YYYY-MM-DD) — pg returns DATE columns as strings when we cast. */
  date: string;
  step_ids: string[];
  updated_at: string;
}

/** Full map (date → step ids) for a user. Shape mirrors the mobile Redux slice. */
export type AdherenceMap = Record<string, string[]>;

/**
 * Repo for the `adherence` table. All queries are UID-scoped — the route
 * layer verifies the Firebase token, then passes uid down. No SQL touches
 * a user's row without a matching WHERE user_id = $1 filter.
 */
export const adherenceRepo = {
  async findAll(userId: string): Promise<AdherenceMap> {
    const { rows } = await pool.query<{ date: string; step_ids: string[] }>(
      `SELECT to_char(date, 'YYYY-MM-DD') AS date, step_ids
         FROM adherence
        WHERE user_id = $1`,
      [userId]
    );
    const out: AdherenceMap = {};
    for (const row of rows) {
      out[row.date] = row.step_ids;
    }
    return out;
  },

  /**
   * Idempotent upsert. Sends the entire step-ids array for a date; the
   * server never diffs individual step toggles — simpler contract, no
   * race-condition surface, and DELETE-on-empty keeps the table small.
   */
  async putDay(userId: string, date: string, stepIds: string[]): Promise<void> {
    if (stepIds.length === 0) {
      await pool.query(
        `DELETE FROM adherence WHERE user_id = $1 AND date = $2`,
        [userId, date]
      );
      return;
    }
    await pool.query(
      `INSERT INTO adherence (user_id, date, step_ids, updated_at)
       VALUES ($1, $2, $3::jsonb, NOW())
       ON CONFLICT (user_id, date)
       DO UPDATE SET step_ids = EXCLUDED.step_ids, updated_at = NOW()`,
      [userId, date, JSON.stringify(stepIds)]
    );
  },

  async deleteAllByUser(userId: string): Promise<number> {
    const result = await pool.query(
      `DELETE FROM adherence WHERE user_id = $1`,
      [userId]
    );
    return result.rowCount ?? 0;
  },
};
