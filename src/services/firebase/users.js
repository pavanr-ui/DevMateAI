/**
 * User profile documents: users/{uid} in Firestore.
 * Firestore security rules (firestore.rules) allow each user to create and
 * update ONLY their own document, with a fixed set of fields.
 */
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore'
import { db } from './index'

/**
 * Creates the profile document on first sign-in. Safe to call every time:
 * it does nothing if the document already exists.
 */
export async function ensureUserProfile(user, { displayName } = {}) {
  const ref = doc(db, 'users', user.uid)
  const snapshot = await getDoc(ref)
  if (snapshot.exists()) return snapshot.data()

  const profile = {
    displayName: (displayName ?? user.displayName ?? '').slice(0, 80),
    email: user.email,
    photoURL: user.photoURL ?? null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }
  await setDoc(ref, profile)
  return profile
}
