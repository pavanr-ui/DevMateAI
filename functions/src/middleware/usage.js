/**
 * Daily request limit + usage counters, stored in users/{uid}/usage/{YYYY-MM-DD}
 * (the same documents the dashboard chart reads).
 *
 * Flow:  reserveRequest()  ->  call Gemini  ->  recordTokens()   (success)
 *                                          ->  releaseRequest() (failure)
 *
 * reserveRequest runs in a transaction, so two requests sent at the same
 * moment can't both slip past the limit.
 */
import { AI_CONFIG } from '../config.js'
import { db, FieldValue, userDoc, utcDayKey } from '../db.js'
import { errors } from '../utils/errors.js'

const usageRef = (uid, day) => userDoc(uid).collection('usage').doc(day)

export async function reserveRequest(uid, module, limit = AI_CONFIG.dailyRequestLimit) {
  const day = utcDayKey()
  const ref = usageRef(uid, day)

  await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref)
    const used = snap.exists ? (snap.get('requests') ?? 0) : 0
    if (used >= limit) throw errors.dailyLimit(limit)
    tx.set(
      ref,
      {
        requests: FieldValue.increment(1),
        byModule: { [module]: FieldValue.increment(1) },
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    )
  })
  return day
}

/** Give the request back when the AI call failed, so failures don't count. */
export async function releaseRequest(uid, module, day) {
  await usageRef(uid, day).set(
    {
      requests: FieldValue.increment(-1),
      byModule: { [module]: FieldValue.increment(-1) },
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true },
  )
}

export async function recordTokens(uid, day, { tokensIn = 0, tokensOut = 0 }) {
  await usageRef(uid, day).set(
    {
      tokensIn: FieldValue.increment(tokensIn),
      tokensOut: FieldValue.increment(tokensOut),
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true },
  )
}
