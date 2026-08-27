import 'dotenv/config';

function required(name: string, fallback?: string): string {
  const v = process.env[name] ?? fallback;
  if (!v) throw new Error(`Missing required env: ${name}`);
  return v;
}

export const config = {
  env: process.env.NODE_ENV ?? 'development',
  host: process.env.HOST ?? '0.0.0.0',
  port: Number(process.env.PORT ?? 8080),

  gemini: {
    apiKey: required('GEMINI_API_KEY'),
    model: process.env.GEMINI_MODEL ?? 'gemini-2.5-flash',
  },

  firebase: {
    // Either GOOGLE_APPLICATION_CREDENTIALS points at a service-account JSON
    // and these three are ignored, or you set them individually (useful on
    // hosted platforms that only expose env vars).
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY,
  },

  cloudinary: {
    // Either CLOUDINARY_URL (single string with all creds baked in) or the
    // three split fields. The SDK prefers CLOUDINARY_URL if present.
    url: process.env.CLOUDINARY_URL,
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    apiSecret: process.env.CLOUDINARY_API_SECRET,
    folder: process.env.CLOUDINARY_FOLDER ?? 'selfcare/scans',
  },

  storage: {
    dbPath: process.env.DB_PATH ?? './data/selfcare.db',
    photoMaxBytes: Number(process.env.PHOTO_MAX_BYTES ?? 8 * 1024 * 1024),
  },
} as const;

export type AppConfig = typeof config;
