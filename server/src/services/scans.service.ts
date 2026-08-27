import { nanoid } from 'nanoid';
import sharp from 'sharp';
import { scansRepo, type ScanRow } from '../db/scans.repo.js';
import {
  cloudinaryConfigured,
  uploadPhotoToCloudinary,
  cloudinaryFullUrl,
  cloudinaryThumbUrl,
} from './cloudinary.js';
import { analyzeSelfie, compareScans } from './gemini.js';
import type { Comparison, Scan, ScanSummary } from '../../../shared/types.js';

function toScan(row: ScanRow): Scan {
  // pg with JSONB returns already-parsed objects, so no JSON.parse here.
  return {
    id: row.id,
    userId: row.user_id,
    photoUrl: cloudinaryFullUrl(row.photo_public_id),
    createdAt: row.created_at,
    analysis: row.analysis_json,
    routine: row.routine_json,
  };
}

function toSummary(row: {
  id: string;
  photo_public_id: string;
  overall_score: number;
  created_at: string;
}): ScanSummary {
  return {
    id: row.id,
    createdAt: row.created_at,
    overallScore: row.overall_score,
    thumbnailUrl: cloudinaryThumbUrl(row.photo_public_id),
  };
}

// Auto-orient, cap dimensions, and re-encode before shipping to Cloudinary.
// Cuts upload bandwidth and gives Gemini a predictably-oriented JPEG.
async function prepareForUpload(input: Buffer): Promise<Buffer> {
  return sharp(input)
    .rotate()
    .resize({ width: 1600, height: 1600, fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: 90 })
    .toBuffer();
}

export const scansService = {
  async create(userId: string, photo: Buffer): Promise<Scan> {
    const scanId = nanoid();
    const prepared = await prepareForUpload(photo);
    const baseline = await scansRepo.findBaseline(userId);
    const previousBaselineSummary = baseline?.analysis_json.summary;

    const { analysis, routine } = await analyzeSelfie(prepared, {
      previousBaselineSummary,
    });

    // Do not retain failed scans remotely. Upload only after the analysis has
    // completed, so provider errors cannot leave an orphaned selfie behind.
    const uploaded = cloudinaryConfigured
      ? await uploadPhotoToCloudinary(prepared, { userId, scanId })
      : null;

    await scansRepo.insert({
      id: scanId,
      userId,
      photoPublicId: uploaded?.publicId ?? '',
      analysis,
      routine,
    });

    const row = await scansRepo.findById(scanId, userId);
    if (!row) throw new Error('scan not found after insert');
    return toScan(row);
  },

  async get(userId: string, scanId: string): Promise<Scan | null> {
    const row = await scansRepo.findById(scanId, userId);
    return row ? toScan(row) : null;
  },

  async list(userId: string, limit = 50): Promise<ScanSummary[]> {
    const rows = await scansRepo.listByUser(userId, limit);
    return rows.map(toSummary);
  },

  async compareLatestToBaseline(userId: string): Promise<Comparison | null> {
    const [baseline, latest] = await Promise.all([
      scansRepo.findBaseline(userId),
      scansRepo.findLatest(userId),
    ]);
    if (!baseline || !latest || baseline.id === latest.id) return null;

    const baselineAnalysis = baseline.analysis_json;
    const currentAnalysis = latest.analysis_json;

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
