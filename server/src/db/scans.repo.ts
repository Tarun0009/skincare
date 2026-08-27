import { pool } from './index.js';
import type { Routine, SkinAnalysis } from '../../../shared/types.js';

export interface ScanRow {
  id: string;
  user_id: string;
  photo_public_id: string;
  analysis_json: SkinAnalysis;
  routine_json: Routine;
  overall_score: number;
  created_at: string;
}

// pg returns TIMESTAMPTZ as JS Date; the API contract wants an ISO string, so
// we normalize on read here to keep callers ignorant of DB types.
function rowFromDb<T extends { created_at: Date | string }>(row: T): T & { created_at: string } {
  return {
    ...row,
    created_at: row.created_at instanceof Date ? row.created_at.toISOString() : row.created_at,
  };
}

export interface ScanInsert {
  id: string;
  userId: string;
  photoPublicId: string;
  analysis: SkinAnalysis;
  routine: Routine;
}

export const scansRepo = {
  async insert(scan: ScanInsert): Promise<void> {
    await pool.query(
      `INSERT INTO scans (id, user_id, photo_public_id, analysis_json, routine_json, overall_score)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        scan.id,
        scan.userId,
        scan.photoPublicId,
        JSON.stringify(scan.analysis),
        JSON.stringify(scan.routine),
        scan.analysis.overallScore,
      ]
    );
  },

  async findById(id: string, userId: string): Promise<ScanRow | undefined> {
    const { rows } = await pool.query<ScanRow>(
      `SELECT id, user_id, photo_public_id, analysis_json, routine_json, overall_score, created_at
         FROM scans
        WHERE id = $1 AND user_id = $2`,
      [id, userId]
    );
    const row = rows[0];
    return row ? rowFromDb(row) : undefined;
  },

  async listByUser(
    userId: string,
    limit = 50
  ): Promise<Pick<ScanRow, 'id' | 'user_id' | 'photo_public_id' | 'overall_score' | 'created_at'>[]> {
    const { rows } = await pool.query<
      Pick<ScanRow, 'id' | 'user_id' | 'photo_public_id' | 'overall_score' | 'created_at'>
    >(
      `SELECT id, user_id, photo_public_id, overall_score, created_at
         FROM scans
        WHERE user_id = $1
        ORDER BY created_at DESC
        LIMIT $2`,
      [userId, limit]
    );
    return rows.map(rowFromDb);
  },

  async findBaseline(userId: string): Promise<ScanRow | undefined> {
    const { rows } = await pool.query<ScanRow>(
      `SELECT id, user_id, photo_public_id, analysis_json, routine_json, overall_score, created_at
         FROM scans
        WHERE user_id = $1
        ORDER BY created_at ASC
        LIMIT 1`,
      [userId]
    );
    const row = rows[0];
    return row ? rowFromDb(row) : undefined;
  },

  async findLatest(userId: string): Promise<ScanRow | undefined> {
    const { rows } = await pool.query<ScanRow>(
      `SELECT id, user_id, photo_public_id, analysis_json, routine_json, overall_score, created_at
         FROM scans
        WHERE user_id = $1
        ORDER BY created_at DESC
        LIMIT 1`,
      [userId]
    );
    const row = rows[0];
    return row ? rowFromDb(row) : undefined;
  },
};
