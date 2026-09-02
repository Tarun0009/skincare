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
    // Postgres connection string. For Neon paste the "Pooled" URL from
    // Dashboard → Connection Details — it includes `?sslmode=require`.
    databaseUrl: required('DATABASE_URL'),
    photoMaxBytes: Number(process.env.PHOTO_MAX_BYTES ?? 8 * 1024 * 1024),
  },

  observability: {
    // Sentry DSN — optional. Boot logs a warning if unset; the server keeps
    // running so a missing DSN never takes prod down.
    sentryDsn: process.env.SENTRY_DSN,
    // Ratio of scan-creation requests captured as Sentry performance
    // transactions. 0 disables tracing; 1 samples every request.
    tracesSampleRate: Number(process.env.SENTRY_TRACES_SAMPLE_RATE ?? 0),
  },

  rateLimit: {
    // Broad guard covering every route — hard cap on abusive clients per
    // Firebase UID or IP.
    globalPerMinute: Number(process.env.RATE_LIMIT_GLOBAL_PER_MINUTE ?? 60),
    // Tighter cap on the AI-cost endpoint. Twenty scans per hour is far
    // above real usage and well under the Gemini free-tier quota.
    scanPerHour: Number(process.env.RATE_LIMIT_SCAN_PER_HOUR ?? 20),
  },
} as const;

export type AppConfig = typeof config;
