/**
 * Firestore security rules tests for users/{uid}.
 * Runs against the local Firestore emulator:  npm run test:rules
 */
import { readFileSync } from 'node:fs'
import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest'
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
} from '@firebase/rules-unit-testing'
import {
  doc,
  getDoc,
  getDocs,
  collection,
  setDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
} from 'firebase/firestore'

let env

const ALICE = { uid: 'alice', email: 'alice@example.com' }
const BOB = { uid: 'bob', email: 'bob@example.com' }

const db = (user) =>
  user
    ? env.authenticatedContext(user.uid, { email: user.email }).firestore()
    : env.unauthenticatedContext().firestore()

const newProfile = (overrides = {}) => ({
  displayName: 'Alice',
  email: ALICE.email,
  photoURL: null,
  createdAt: serverTimestamp(),
  updatedAt: serverTimestamp(),
  ...overrides,
})

/** Seed a profile, bypassing rules (like an admin would). */
async function seedAlice() {
  await env.withSecurityRulesDisabled(async (ctx) => {
    await setDoc(doc(ctx.firestore(), 'users', ALICE.uid), {
      displayName: 'Alice',
      email: ALICE.email,
      photoURL: null,
      createdAt: new Date('2026-01-01'),
      updatedAt: new Date('2026-01-01'),
    })
  })
}

beforeAll(async () => {
  env = await initializeTestEnvironment({
    projectId: 'demo-devmate-rules-test',
    firestore: { rules: readFileSync('firestore.rules', 'utf8'), host: '127.0.0.1', port: 8080 },
  })
})

beforeEach(() => env.clearFirestore())
afterAll(() => env.cleanup())

describe('users/{uid} - create', () => {
  it('lets a user create their own profile', async () => {
    await assertSucceeds(setDoc(doc(db(ALICE), 'users', ALICE.uid), newProfile()))
  })

  it("blocks creating someone else's profile", async () => {
    await assertFails(setDoc(doc(db(BOB), 'users', ALICE.uid), newProfile()))
  })

  it('blocks signed-out users', async () => {
    await assertFails(setDoc(doc(db(null), 'users', ALICE.uid), newProfile()))
  })

  it('blocks claiming a different email', async () => {
    await assertFails(
      setDoc(doc(db(ALICE), 'users', ALICE.uid), newProfile({ email: 'boss@example.com' })),
    )
  })

  it('blocks extra fields (e.g. self-granted admin role)', async () => {
    await assertFails(setDoc(doc(db(ALICE), 'users', ALICE.uid), newProfile({ role: 'admin' })))
  })

  it('blocks client-chosen timestamps', async () => {
    await assertFails(
      setDoc(doc(db(ALICE), 'users', ALICE.uid), newProfile({ createdAt: new Date('2000-01-01') })),
    )
  })

  it('blocks names longer than 80 characters', async () => {
    await assertFails(
      setDoc(doc(db(ALICE), 'users', ALICE.uid), newProfile({ displayName: 'x'.repeat(81) })),
    )
  })
})

describe('users/{uid} - read', () => {
  beforeEach(seedAlice)

  it('lets a user read their own profile', async () => {
    await assertSucceeds(getDoc(doc(db(ALICE), 'users', ALICE.uid)))
  })

  it("blocks reading someone else's profile", async () => {
    await assertFails(getDoc(doc(db(BOB), 'users', ALICE.uid)))
  })

  it('blocks listing all users', async () => {
    await assertFails(getDocs(collection(db(ALICE), 'users')))
  })
})

describe('users/{uid} - update and delete', () => {
  beforeEach(seedAlice)

  it('lets a user change their display name', async () => {
    await assertSucceeds(
      updateDoc(doc(db(ALICE), 'users', ALICE.uid), {
        displayName: 'Alice L.',
        updatedAt: serverTimestamp(),
      }),
    )
  })

  it('blocks changing the email field', async () => {
    await assertFails(
      updateDoc(doc(db(ALICE), 'users', ALICE.uid), {
        email: 'new@example.com',
        updatedAt: serverTimestamp(),
      }),
    )
  })

  it('blocks changing createdAt', async () => {
    await assertFails(
      updateDoc(doc(db(ALICE), 'users', ALICE.uid), {
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }),
    )
  })

  it("blocks updating someone else's profile", async () => {
    await assertFails(
      updateDoc(doc(db(BOB), 'users', ALICE.uid), {
        displayName: 'Hacked',
        updatedAt: serverTimestamp(),
      }),
    )
  })

  it('blocks deleting a profile from the client', async () => {
    await assertFails(deleteDoc(doc(db(ALICE), 'users', ALICE.uid)))
  })
})

describe('everything else', () => {
  it('is locked by default', async () => {
    await assertFails(setDoc(doc(db(ALICE), 'secrets', 'x'), { a: 1 }))
    await assertFails(getDoc(doc(db(ALICE), 'secrets', 'x')))
  })
})
