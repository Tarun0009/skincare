import { initializeApp, cert, getApps, type App } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { readFileSync } from 'node:fs';
import { config } from '../config.js';

/**
 * Lazily boot Firebase Admin. Called once at import; subsequent imports get
 * the memoised instance. Credentials come from either:
 *  - a service account JSON at $GOOGLE_APPLICATION_CREDENTIALS
 *  - individual env vars ($FIREBASE_CLIENT_EMAIL, $FIREBASE_PRIVATE_KEY)
 * The first form is preferred; the second is a fallback for platforms that
 * only let you set env vars (Fly.io, Render, etc).
 */
let app: App | undefined;

function bootFirebase(): App {
  if (getApps().length > 0) return getApps()[0]!;

  const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (serviceAccountPath) {
    const raw = readFileSync(serviceAccountPath, 'utf8');
    const parsed = JSON.parse(raw) as {
      project_id: string;
      client_email: string;
      private_key: string;
    };
    return initializeApp({
      credential: cert({
        projectId: parsed.project_id,
        clientEmail: parsed.client_email,
        privateKey: parsed.private_key,
      }),
      projectId: parsed.project_id,
    });
  }

  const { projectId, clientEmail, privateKey } = config.firebase;
  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      'Firebase Admin is not configured. Set GOOGLE_APPLICATION_CREDENTIALS ' +
        'to a service-account JSON path, or provide FIREBASE_PROJECT_ID, ' +
        'FIREBASE_CLIENT_EMAIL and FIREBASE_PRIVATE_KEY.'
    );
  }
  return initializeApp({
    credential: cert({
      projectId,
      clientEmail,
      // Env vars can't hold real newlines; support the standard "\\n" escape.
      privateKey: privateKey.replace(/\\n/g, '\n'),
    }),
    projectId,
  });
}

app = bootFirebase();

export const firebaseAuth = getAuth(app);
