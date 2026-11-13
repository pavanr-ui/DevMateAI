/**
 * Read-only access to backend-written data: activity feed and daily usage.
 * (Cloud Functions write these in Phase 4+; the client can only read.)
 */
import {
  collection,
  documentId,
  getDocs,
  limit as limitTo,
  orderBy,
  query,
  where,
} from 'firebase/firestore'
import { db } from './index'

export async function listRecentActivity(uid, { max = 6 } = {}) {
  const q = query(
    collection(db, 'users', uid, 'activity'),
    orderBy('createdAt', 'desc'),
    limitTo(max),
  )
  const snapshot = await getDocs(q)
  return snapshot.docs.map((snap) => ({ id: snap.id, ...snap.data() }))
}

/** Usage documents with id (UTC "YYYY-MM-DD") >= fromKey. */
export async function listUsageSince(uid, fromKey) {
  const q = query(collection(db, 'users', uid, 'usage'), where(documentId(), '>=', fromKey))
  const snapshot = await getDocs(q)
  return snapshot.docs.map((snap) => ({ id: snap.id, ...snap.data() }))
}
