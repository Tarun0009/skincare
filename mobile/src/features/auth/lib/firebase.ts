import auth, { type FirebaseAuthTypes } from '@react-native-firebase/auth';

/**
 * Thin wrapper around @react-native-firebase/auth so screens and RTK layers
 * don't import the module directly. Keeps a single seam we can swap if we ever
 * change providers.
 */

export type FirebaseUser = FirebaseAuthTypes.User;
export type FirebaseAuthError = FirebaseAuthTypes.NativeFirebaseAuthError;

export function signInWithEmail(email: string, password: string) {
  return auth().signInWithEmailAndPassword(email, password);
}

export function createAccountWithEmail(email: string, password: string) {
  return auth().createUserWithEmailAndPassword(email, password);
}

export function signOutCurrentUser() {
  return auth().signOut();
}

export function currentUser(): FirebaseUser | null {
  return auth().currentUser;
}

export function subscribeToAuthState(cb: (user: FirebaseUser | null) => void) {
  return auth().onAuthStateChanged(cb);
}

/**
 * Grabs a fresh ID token from Firebase. Called by baseQuery on every request
 * so the server always sees a token that Admin SDK can verify. Firebase caches
 * unexpired tokens locally, so this is cheap.
 */
export async function getIdToken(forceRefresh = false): Promise<string | null> {
  const user = auth().currentUser;
  if (!user) return null;
  try {
    return await user.getIdToken(forceRefresh);
  } catch {
    return null;
  }
}

/** Turn Firebase's error codes into short, human-friendly copy. */
export function friendlyAuthError(code: string | undefined): string {
  switch (code) {
    case 'auth/invalid-email':
      return 'That email address doesn’t look right.';
    case 'auth/user-disabled':
      return 'This account has been disabled.';
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Email or password is incorrect.';
    case 'auth/email-already-in-use':
      return 'An account with that email already exists.';
    case 'auth/weak-password':
      return 'Password should be at least 6 characters.';
    case 'auth/network-request-failed':
      return 'No network. Check your connection and retry.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Try again in a minute.';
    default:
      return 'Sign-in failed. Please try again.';
  }
}
