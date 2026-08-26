import { nanoid } from 'nanoid';
import { scansRepo, type ScanRow } from '../db/scans.repo.js';
import { savePhoto } from '../storage/photos.js';
import { analyzeSelfie, compareScans } from './gemini.js';
import type { Comparison, Scan, ScanSummary } from '../../../shared/types.js';

function toScan(row: ScanRow): Scan {
  return {
    id: row.id,
    userId: row.user_id,
    photoUrl: `/photos/${row.photo_path}`,
    createdAt: row.created_at,
    analysis: JSON.parse(row.analysis_json),
    routine: JSON.parse(row.routine_json),
  };
}

function toSummary(row: {
  id: string;
  thumb_path: string;
  overall_score: number;
  created_at: string;
}): ScanSummary {
  return {
    id: row.id,
    createdAt: row.created_at,
    overallScore: row.overall_score,
    thumbnailUrl: `/photos/${row.thumb_path}`,
  };
}

export const scansService = {
  async create(userId: string, photo: Buffer): Promise<Scan> {
    const scanId = nanoid();
    const stored = await savePhoto(userId, scanId, photo);

    const baseline = scansRepo.findBaseline(userId);
    const previousBaselineSummary = baseline
      ? (JSON.parse(baseline.analysis_json).summary as string)
      : undefined;

    const { analysis, routine } = await analyzeSelfie(stored.photoPath, {
      previousBaselineSummary,
    });

    scansRepo.insert({
      id: scanId,
      userId,
      photoPath: stored.photoPath,
      thumbPath: stored.thumbPath,
      analysis,
      routine,
    });

    const row = scansRepo.findById(scanId, userId);
    if (!row) throw new Error('scan not found after insert');
    return toScan(row);
  },

  get(userId: string, scanId: string): Scan | null {
    const row = scansRepo.findById(scanId, userId);
    return row ? toScan(row) : null;
  },

  list(userId: string, limit = 50): ScanSummary[] {
    return scansRepo.listByUser(userId, limit).map(toSummary);
  },

  async compareLatestToBaseline(userId: string): Promise<Comparison | null> {
    const baseline = scansRepo.findBaseline(userId);
    const latest = scansRepo.findLatest(userId);
    if (!baseline || !latest || baseline.id === latest.id) return null;

    const baselineAnalysis = JSON.parse(baseline.analysis_json);
    const currentAnalysis = JSON.parse(latest.analysis_json);

    const daysBetween = Math.max(
      1,
      Math.round(
        (new Date(latest.created_at).getTime() -
          new Date(baseline.created_at).getTime()) /
          (1000 * 60 * 60 * 24)
      )
    );

    return compareScans({
      baselineAnalysis,
      currentAnalysis,
      baselineScanId: baseline.id,
      currentScanId: latest.id,
      daysBetween,
    });
  },
};
