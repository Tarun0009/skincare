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

  auth: {
    jwtSecret: required('JWT_SECRET'),
    jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '30d',
  },

  storage: {
    dbPath: process.env.DB_PATH ?? './data/selfcare.db',
    photoDir: process.env.PHOTO_DIR ?? './photos',
    photoMaxBytes: Number(process.env.PHOTO_MAX_BYTES ?? 8 * 1024 * 1024),
  },
} as const;

export type AppConfig = typeof config;
