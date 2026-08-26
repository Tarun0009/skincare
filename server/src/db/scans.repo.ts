import { db } from './index.js';
import type { Routine, SkinAnalysis } from '../../../shared/types.js';

export interface ScanRow {
  id: string;
  user_id: string;
  photo_path: string;
  thumb_path: string;
  analysis_json: string;
  routine_json: string;
  overall_score: number;
  created_at: string;
}

const insertStmt = db.prepare(
  `INSERT INTO scans
     (id, user_id, photo_path, thumb_path, analysis_json, routine_json, overall_score)
   VALUES (?, ?, ?, ?, ?, ?, ?)`
);

const findByIdStmt = db.prepare(
  `SELECT * FROM scans WHERE id = ? AND user_id = ?`
);

const listByUserStmt = db.prepare(
  `SELECT id, user_id, thumb_path, overall_score, created_at
     FROM scans
    WHERE user_id = ?
    ORDER BY created_at DESC
    LIMIT ?`
);

const findFirstByUserStmt = db.prepare(
  `SELECT * FROM scans WHERE user_id = ? ORDER BY created_at ASC LIMIT 1`
);

const findLatestByUserStmt = db.prepare(
  `SELECT * FROM scans WHERE user_id = ? ORDER BY created_at DESC LIMIT 1`
);

export interface ScanInsert {
  id: string;
  userId: string;
  photoPath: string;
  thumbPath: string;
  analysis: SkinAnalysis;
  routine: Routine;
}

export const scansRepo = {
  insert(scan: ScanInsert): void {
    insertStmt.run(
      scan.id,
      scan.userId,
      scan.photoPath,
      scan.thumbPath,
      JSON.stringify(scan.analysis),
      JSON.stringify(scan.routine),
      scan.analysis.overallScore
    );
  },

  findById(id: string, userId: string): ScanRow | undefined {
    return findByIdStmt.get(id, userId) as ScanRow | undefined;
  },

  listByUser(
    userId: string,
    limit = 50
  ): Pick<ScanRow, 'id' | 'user_id' | 'thumb_path' | 'overall_score' | 'created_at'>[] {
    return listByUserStmt.all(userId, limit) as Array<
      Pick<ScanRow, 'id' | 'user_id' | 'thumb_path' | 'overall_score' | 'created_at'>
    >;
  },

  findBaseline(userId: string): ScanRow | undefined {
    return findFirstByUserStmt.get(userId) as ScanRow | undefined;
  },

  findLatest(userId: string): ScanRow | undefined {
    return findLatestByUserStmt.get(userId) as ScanRow | undefined;
  },
};
