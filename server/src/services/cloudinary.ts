import { config } from '../config.js';

const hasUrl = config.cloudinary.url?.startsWith('cloudinary://') === true;
const hasSplitCredentials = Boolean(
  config.cloudinary.cloudName && config.cloudinary.apiKey && config.cloudinary.apiSecret
);

/** Whether scans should be retained in Cloudinary. Without credentials the
 * scan pipeline remains usable and keeps the original only on the device. */
export const cloudinaryConfigured = hasUrl || hasSplitCredentials;

// Cloudinary reads CLOUDINARY_URL as soon as its package is imported and
// throws on placeholder values. Import it only when valid credentials exist.
let cloudinary: typeof import('cloudinary').v2 | null = null;
if (cloudinaryConfigured) {
  const cloudinaryModule = await import('cloudinary');
  cloudinary = cloudinaryModule.v2;
  if (hasUrl) {
    cloudinary.config({ secure: true });
  } else {
    cloudinary.config({
      cloud_name: config.cloudinary.cloudName,
      api_key: config.cloudinary.apiKey,
      api_secret: config.cloudinary.apiSecret,
      secure: true,
    });
  }
}

function configuredClient(): typeof import('cloudinary').v2 {
  if (!cloudinary) throw new Error('cloudinary_not_configured');
  return cloudinary;
}

export interface UploadedPhoto {
  publicId: string;
  bytes: number;
  width: number;
  height: number;
}

export async function uploadPhotoToCloudinary(
  buffer: Buffer,
  opts: { userId: string; scanId: string }
): Promise<UploadedPhoto> {
  const client = configuredClient();
  return new Promise<UploadedPhoto>((resolve, reject) => {
    const stream = client.uploader.upload_stream(
      {
        folder: config.cloudinary.folder,
        public_id: `${opts.userId}/${opts.scanId}`,
        resource_type: 'image',
        overwrite: false,
      },
      (err, result) => {
        if (err || !result) {
          return reject(err ?? new Error('cloudinary_upload_failed'));
        }
        resolve({
          publicId: result.public_id,
          bytes: result.bytes,
          width: result.width,
          height: result.height,
        });
      }
    );
    stream.end(buffer);
  });
}

// f_auto lets Cloudinary serve WebP / AVIF based on the client's Accept
// header; q_auto picks the smallest quality that keeps perceptual fidelity.
const FULL_TRANSFORMATION = {
  fetch_format: 'auto',
  quality: 'auto',
  width: 1280,
  height: 1280,
  crop: 'limit',
} as const;

const THUMB_TRANSFORMATION = {
  fetch_format: 'auto',
  quality: 'auto',
  width: 256,
  height: 256,
  crop: 'fill',
  gravity: 'face',
} as const;

export function cloudinaryFullUrl(publicId: string): string {
  if (!publicId || !cloudinary) return '';
  return cloudinary.url(publicId, {
    secure: true,
    transformation: [FULL_TRANSFORMATION],
  });
}

export function cloudinaryThumbUrl(publicId: string): string {
  if (!publicId || !cloudinary) return '';
  return cloudinary.url(publicId, {
    secure: true,
    transformation: [THUMB_TRANSFORMATION],
  });
}
