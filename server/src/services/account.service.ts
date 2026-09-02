import { scansRepo } from '../db/scans.repo.js';
import { adherenceRepo } from '../db/adherence.repo.js';
import { destroyPhotosByPublicIds } from './cloudinary.js';
import { firebaseAuth } from './firebase.js';
import { Sentry } from './sentry.js';

export interface AccountDeletionSummary {
  scansDeleted: number;
  adherenceDaysDeleted: number;
  photosDeleted: number;
  photosFailed: number;
  firebaseUserDeleted: boolean;
}

/**
 * Erase a user's data across every store we own. Execution order matters:
 *
 *  1. Cloudinary photos — best-effort. If the provider is down we still
 *     want to progress; orphan assets can be swept later by a nightly job.
 *  2. Postgres scans — authoritative delete. If this fails we abort BEFORE
 *     touching Firebase so the user can retry from a consistent state.
 *  3. Firebase user — last, because deleting it revokes the ID token that
 *     authorized this request in the first place.
 *
 * Failures on step 1 are logged but don't stop the flow. Failures on step 2
 * or 3 throw so the caller can surface a retryable error to the user.
 */
export async function deleteAccount(userId: string): Promise<AccountDeletionSummary> {
  const publicIds = await scansRepo.listPublicIds(userId);

  const { deleted: photosDeleted, failed: photosFailed } = await destroyPhotosByPublicIds(publicIds);
  if (photosFailed.length > 0) {
    Sentry.captureMessage('cloudinary_partial_delete_on_account_deletion', {
      level: 'warning',
      tags: { userId },
      extra: { failedCount: photosFailed.length, totalCount: publicIds.length },
    });
  }

  const scansDeleted = await scansRepo.deleteAllByUser(userId);
  const adherenceDaysDeleted = await adherenceRepo.deleteAllByUser(userId);

  await firebaseAuth.deleteUser(userId);

  return {
    scansDeleted,
    adherenceDaysDeleted,
    photosDeleted: photosDeleted.length,
    photosFailed: photosFailed.length,
    firebaseUserDeleted: true,
  };
}
