/**
 * Firebase client initialisation.
 *
 * The values below are Firebase's PUBLIC web config. They identify the
 * project, they are not secrets; security comes from Auth + Firestore rules
 * + App Check. Real secrets (Gemini key, GitHub App key) live ONLY in
 * Cloud Functions, never here.
 *
 * Emulators: during `npm run dev`, if no real Firebase config is provided,
 * the app automatically talks to the local Firebase Emulator Suite, so no
 * real data or money is involved. Override with VITE_USE_EMULATORS=true/false.
 */
import { initializeApp } from 'firebase/app'
import { getAuth, connectAuthEmulator } from 'firebase/auth'
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore'
import { getFunctions, connectFunctionsEmulator } from 'firebase/functions'

const env = import.meta.env

export const usingEmulators =
  env.VITE_USE_EMULATORS != null && env.VITE_USE_EMULATORS !== ''
    ? env.VITE_USE_EMULATORS === 'true'
    : Boolean(env.DEV && !env.VITE_FIREBASE_API_KEY)

const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY || 'demo-api-key',
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID || 'demo-devmate-ai',
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.VITE_FIREBASE_APP_ID,
}

export const firebaseApp = initializeApp(firebaseConfig)
export const auth = getAuth(firebaseApp)
export const db = getFirestore(firebaseApp)
export const functions = getFunctions(firebaseApp, env.VITE_FUNCTIONS_REGION || 'us-central1')

if (usingEmulators) {
  const host = env.VITE_EMULATOR_HOST || '127.0.0.1'
  connectAuthEmulator(auth, `http://${host}:9099`, { disableWarnings: true })
  connectFirestoreEmulator(db, host, 8080)
  connectFunctionsEmulator(functions, host, 5001)
}
