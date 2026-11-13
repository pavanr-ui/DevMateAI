/**
 * Authentication service: the ONLY file that calls Firebase Auth directly.
 * Stores and pages call these functions, so swapping the implementation
 * later (e.g. native sign-in on Android/iOS in Phase 9) touches one file.
 */
import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  onAuthStateChanged,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut as firebaseSignOut,
  updateProfile,
} from 'firebase/auth'
import { auth } from './index'

/** Plain, serializable copy of the fields the UI needs. */
export function toAppUser(user) {
  if (!user) return null
  return {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName,
    photoURL: user.photoURL,
    emailVerified: user.emailVerified,
    providerId: user.providerData[0]?.providerId ?? 'password',
  }
}

/** Calls `callback(firebaseUser | null)` now and whenever auth changes. */
export function watchAuthState(callback) {
  return onAuthStateChanged(auth, callback)
}

export async function signUpWithEmail({ name, email, password }) {
  const { user } = await createUserWithEmailAndPassword(auth, email, password)
  await updateProfile(user, { displayName: name })
  // Not blocking: the account works before verification. Enforcement comes later.
  sendEmailVerification(user).catch(() => {})
  return user
}

export async function signInWithEmail({ email, password }) {
  const { user } = await signInWithEmailAndPassword(auth, email, password)
  return user
}

/**
 * Web: Google popup. Native apps can't use popups inside a WebView, so
 * Phase 9 switches this to the @capacitor-firebase/authentication plugin.
 */
export async function signInWithGoogle() {
  const provider = new GoogleAuthProvider()
  provider.setCustomParameters({ prompt: 'select_account' })
  const { user } = await signInWithPopup(auth, provider)
  return user
}

export function sendPasswordReset(email) {
  return sendPasswordResetEmail(auth, email)
}

export function signOut() {
  return firebaseSignOut(auth)
}
