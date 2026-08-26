import { mkdirSync } from 'node:fs';
import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import sharp from 'sharp';
import { config } from '../config.js';

mkdirSync(config.storage.photoDir, { recursive: true });

export interface StoredPhoto {
  photoPath: string;
  thumbPath: string;
  bytes: number;
}

/**
 * Persist a full-size JPEG plus a small square thumbnail for history views.
 * Paths returned are relative to the photo dir so they can be served by /photos.
 */
export async function savePhoto(
  userId: string,
  scanId: string,
  buffer: Buffer
): Promise<StoredPhoto> {
  const userDir = join(config.storage.photoDir, userId);
  mkdirSync(userDir, { recursive: true });

  const fullPath = join(userDir, `${scanId}.jpg`);
  const thumbPath = join(userDir, `${scanId}.thumb.jpg`);

  const full = await sharp(buffer)
    .rotate()
    .resize({ width: 1280, height: 1280, fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: 88 })
    .toBuffer();

  const thumb = await sharp(buffer)
    .rotate()
    .resize({ width: 256, height: 256, fit: 'cover' })
    .jpeg({ quality: 78 })
    .toBuffer();

  await Promise.all([writeFile(fullPath, full), writeFile(thumbPath, thumb)]);

  return {
    photoPath: `${userId}/${scanId}.jpg`,
    thumbPath: `${userId}/${scanId}.thumb.jpg`,
    bytes: full.byteLength,
  };
}

/**
 * Read an original photo back as a base64 payload for the Gemini vision call.
 */
export async function photoAsInlineData(relativePath: string): Promise<{
  mimeType: string;
  data: string;
}> {
  const { readFile } = await import('node:fs/promises');
  const abs = join(config.storage.photoDir, relativePath);
  const buf = await readFile(abs);
  return { mimeType: 'image/jpeg', data: buf.toString('base64') };
}
