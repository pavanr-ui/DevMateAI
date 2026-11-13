/**
 * Rules tests for dashboard data: projects, activity, usage.
 * Runs against the Firestore emulator (npm run test:rules).
 */
import { readFileSync } from 'node:fs'
import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest'
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
} from '@firebase/rules-unit-testing'
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore'

let env
const ALICE = 'alice'
const BOB = 'bob'

const db = (uid) => env.authenticatedContext(uid).firestore()
const projects = (uid, owner = uid) => collection(db(uid), 'users', owner, 'projects')

const newProject = (overrides = {}) => ({
  name: 'Portfolio site',
  description: 'Personal site built with Vue',
  techStack: ['Vue', 'Firebase'],
  createdAt: serverTimestamp(),
  updatedAt: serverTimestamp(),
  ...overrides,
})

beforeAll(async () => {
  env = await initializeTestEnvironment({
    projectId: 'demo-devmate-rules-test',
    firestore: { rules: readFileSync('firestore.rules', 'utf8'), host: '127.0.0.1', port: 8080 },
  })
})
beforeEach(() => env.clearFirestore())
afterAll(() => env.cleanup())

async function seed(path, data) {
  await env.withSecurityRulesDisabled((ctx) => setDoc(doc(ctx.firestore(), path), data))
}

describe('projects', () => {
  it('lets a user create, read, update and delete their own projects', async () => {
    const ref = await assertSucceeds(addDoc(projects(ALICE), newProject()))
    await assertSucceeds(getDocs(projects(ALICE)))
    await assertSucceeds(updateDoc(ref, { name: 'Renamed', updatedAt: serverTimestamp() }))
    await assertSucceeds(deleteDoc(ref))
  })

  it("blocks access to someone else's projects", async () => {
    await seed(`users/${ALICE}/projects/p1`, { name: 'x' })
    await assertFails(getDocs(projects(BOB, ALICE)))
    await assertFails(getDoc(doc(db(BOB), `users/${ALICE}/projects/p1`)))
    await assertFails(addDoc(projects(BOB, ALICE), newProject()))
    await assertFails(deleteDoc(doc(db(BOB), `users/${ALICE}/projects/p1`)))
  })

  it.each([
    ['empty name', { name: '' }],
    ['name over 80 chars', { name: 'x'.repeat(81) }],
    ['description over 500 chars', { description: 'x'.repeat(501) }],
    ['more than 10 tech tags', { techStack: Array.from({ length: 11 }, (_, i) => `t${i}`) }],
    ['techStack not a list', { techStack: 'Vue' }],
    ['extra field', { ownerRole: 'admin' }],
    ['client-chosen createdAt', { createdAt: new Date('2000-01-01') }],
  ])('rejects a project with %s', async (_label, overrides) => {
    await assertFails(addDoc(projects(ALICE), newProject(overrides)))
  })

  it('blocks changing createdAt on update', async () => {
    const ref = await addDoc(projects(ALICE), newProject())
    await assertFails(
      updateDoc(ref, { createdAt: serverTimestamp(), updatedAt: serverTimestamp() }),
    )
  })
})

describe.each(['activity', 'usage'])('%s (backend-written)', (sub) => {
  const path = (owner) => `users/${owner}/${sub}/2026-11-13`

  it('can be read by its owner', async () => {
    await seed(path(ALICE), { requests: 3 })
    await assertSucceeds(getDoc(doc(db(ALICE), path(ALICE))))
    await assertSucceeds(getDocs(collection(db(ALICE), 'users', ALICE, sub)))
  })

  it('cannot be read by other users', async () => {
    await seed(path(ALICE), { requests: 3 })
    await assertFails(getDoc(doc(db(BOB), path(ALICE))))
  })

  it('cannot be written by the client, even by its owner', async () => {
    await assertFails(setDoc(doc(db(ALICE), path(ALICE)), { requests: 999 }))
    await seed(path(ALICE), { requests: 3 })
    await assertFails(updateDoc(doc(db(ALICE), path(ALICE)), { requests: 0 }))
    await assertFails(deleteDoc(doc(db(ALICE), path(ALICE))))
  })
})
