#!/usr/bin/env node
/**
 * Fills the LOCAL Firebase emulators with demo dashboard data.
 *
 *   npm run seed                         -> demo account (see DEMO_USER below)
 *   npm run seed -- --email you@test.com -> add demo data to an existing emulator account
 *
 * Safety: talks only to 127.0.0.1 emulator ports and the offline
 * "demo-devmate-ai" project. It can never touch a real Firebase project.
 * Re-running is safe: documents use fixed ids, so they are overwritten, not duplicated.
 */

const PROJECT = 'demo-devmate-ai'
const AUTH = 'http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1'
const FIRESTORE = `http://127.0.0.1:8080/v1/projects/${PROJECT}/databases/(default)/documents`
// "Bearer owner" is the emulator's admin token: it bypasses security rules,
// exactly like Cloud Functions will when they write activity and usage.
const ADMIN = { Authorization: 'Bearer owner', 'Content-Type': 'application/json' }

// Local-only test account (exists only inside the emulator).
const DEMO_USER = {
  email: 'demo@devmate.test',
  password: 'demo-password-123',
  name: 'Demo Developer',
}

// ---------- Firestore REST helpers ----------
function encode(value) {
  if (value === null) return { nullValue: null }
  if (value instanceof Date) return { timestampValue: value.toISOString() }
  if (Array.isArray(value)) return { arrayValue: { values: value.map(encode) } }
  if (typeof value === 'number')
    return Number.isInteger(value) ? { integerValue: String(value) } : { doubleValue: value }
  if (typeof value === 'object')
    return {
      mapValue: {
        fields: Object.fromEntries(Object.entries(value).map(([k, v]) => [k, encode(v)])),
      },
    }
  return { stringValue: String(value) }
}

async function setDoc(path, data) {
  const fields = Object.fromEntries(Object.entries(data).map(([k, v]) => [k, encode(v)]))
  const res = await fetch(`${FIRESTORE}/${path}`, {
    method: 'PATCH',
    headers: ADMIN,
    body: JSON.stringify({ fields }),
  })
  if (!res.ok)
    throw new Error(`Firestore write failed for ${path}: ${res.status} ${await res.text()}`)
}

// ---------- Auth helpers ----------
async function authPost(endpoint, body) {
  const res = await fetch(`${AUTH}/${endpoint}?key=demo-api-key`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  return { ok: res.ok, data: await res.json() }
}

async function ensureDemoUser() {
  const signUp = await authPost('accounts:signUp', {
    email: DEMO_USER.email,
    password: DEMO_USER.password,
    displayName: DEMO_USER.name,
    returnSecureToken: true,
  })
  if (signUp.ok) return { uid: signUp.data.localId, email: DEMO_USER.email, name: DEMO_USER.name }

  if (signUp.data?.error?.message !== 'EMAIL_EXISTS') throw new Error(JSON.stringify(signUp.data))
  const signIn = await authPost('accounts:signInWithPassword', {
    email: DEMO_USER.email,
    password: DEMO_USER.password,
    returnSecureToken: true,
  })
  if (!signIn.ok) throw new Error(JSON.stringify(signIn.data))
  return { uid: signIn.data.localId, email: DEMO_USER.email, name: DEMO_USER.name }
}

async function findUserByEmail(email) {
  const res = await fetch(`${AUTH}/projects/${PROJECT}/accounts:batchGet?maxResults=1000`, {
    headers: ADMIN,
  })
  const { users = [] } = await res.json()
  const user = users.find((u) => u.email?.toLowerCase() === email.toLowerCase())
  if (!user) throw new Error(`No emulator account with email ${email}. Sign up in the app first.`)
  return { uid: user.localId, email: user.email, name: user.displayName ?? email.split('@')[0] }
}

// ---------- Demo data ----------
const MODULES = ['assistant', 'reviewer', 'bug-fixer', 'component-generator', 'learn', 'github']
const WEIGHTS = [0.42, 0.2, 0.16, 0.12, 0.07, 0.03]

/** Deterministic pseudo-random numbers, so every run produces the same chart. */
function seededRandom(seed) {
  let s = seed
  return () => {
    s = (s * 9301 + 49297) % 233280
    return s / 233280
  }
}

function usageDays(today = new Date(), days = 14) {
  const rand = seededRandom(42)
  const out = []
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(
      Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() - i),
    )
    const weekend = [0, 6].includes(d.getUTCDay())
    // Slight upward trend, quieter weekends, a couple of zero days.
    let requests = Math.round((weekend ? 2 : 8) + rand() * 10 + (days - i) * 0.6)
    if (i === 9) requests = 0
    const byModule = {}
    MODULES.forEach((m, idx) => {
      const n = Math.round(requests * WEIGHTS[idx])
      if (n > 0) byModule[m] = n
    })
    const total = Object.values(byModule).reduce((a, b) => a + b, 0)
    out.push({
      id: d.toISOString().slice(0, 10),
      data: {
        requests: total,
        tokensIn: total * Math.round(400 + rand() * 300),
        tokensOut: total * Math.round(600 + rand() * 500),
        byModule,
        updatedAt: new Date(),
      },
    })
  }
  return out
}

const minutesAgo = (m) => new Date(Date.now() - m * 60_000)

const ACTIVITY = [
  { module: 'assistant', title: 'Generated a debounce composable', at: 12 },
  { module: 'reviewer', title: 'Reviewed LoginForm.vue (3 issues found)', at: 95 },
  { module: 'bug-fixer', title: 'Fixed "Cannot read properties of undefined"', at: 60 * 5 },
  { module: 'component-generator', title: 'Created a DataTable component', at: 60 * 26 },
  { module: 'learn', title: 'Learned about closures in JavaScript', at: 60 * 50 },
  { module: 'assistant', title: 'Explained Array.prototype.reduce()', at: 60 * 24 * 4 },
]

const PROJECTS = [
  {
    id: 'seed-portfolio',
    name: 'Portfolio website',
    description: 'Personal portfolio with a blog, built to showcase frontend projects.',
    techStack: ['Vue 3', 'Vite', 'Tailwind CSS'],
    updated: 30,
  },
  {
    id: 'seed-devmate',
    name: 'DevMate AI',
    description: 'AI-powered developer assistant for web, Android and iOS.',
    techStack: ['Vue 3', 'Ionic', 'Capacitor', 'Firebase', 'Gemini'],
    updated: 60 * 3,
  },
  {
    id: 'seed-shop',
    name: 'Shop admin dashboard',
    description: 'Inventory and orders dashboard for a small online store.',
    techStack: ['Vue 3', 'Pinia', 'Chart.js'],
    updated: 60 * 24 * 6,
  },
]

async function main() {
  const emailFlag = process.argv.indexOf('--email')
  const user =
    emailFlag > -1 ? await findUserByEmail(process.argv[emailFlag + 1]) : await ensureDemoUser()

  const base = `users/${user.uid}`
  if (emailFlag === -1) {
    await setDoc(base, {
      displayName: user.name,
      email: user.email,
      photoURL: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
  }

  for (const day of usageDays()) await setDoc(`${base}/usage/${day.id}`, day.data)

  for (const [i, a] of ACTIVITY.entries()) {
    await setDoc(`${base}/activity/seed-${i + 1}`, {
      module: a.module,
      title: a.title,
      projectId: null,
      targetId: null,
      createdAt: minutesAgo(a.at),
    })
  }

  for (const p of PROJECTS) {
    await setDoc(`${base}/projects/${p.id}`, {
      name: p.name,
      description: p.description,
      techStack: p.techStack,
      createdAt: minutesAgo(p.updated + 60 * 24 * 10),
      updatedAt: minutesAgo(p.updated),
    })
  }

  console.log(`✔ Seeded demo data for ${user.email}`)
  if (emailFlag === -1) console.log('  Sign in with the demo account from scripts/seed-emulator.js')
}

main().catch((error) => {
  if (error.cause?.code === 'ECONNREFUSED') {
    console.error('✖ Emulators are not running. Start them first: npm run emulators')
  } else {
    console.error('✖', error.message)
  }
  process.exit(1)
})
