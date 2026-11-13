/**
 * Read-only access to AI conversations (the aiChat function writes them).
 */
import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit as limitTo,
  orderBy,
  query,
  where,
} from 'firebase/firestore'
import { db } from './index'

const conversationsCol = (uid) => collection(db, 'users', uid, 'conversations')

export async function listConversations(uid, { module = 'assistant', max = 40 } = {}) {
  const q = query(
    conversationsCol(uid),
    where('module', '==', module),
    orderBy('updatedAt', 'desc'),
    limitTo(max),
  )
  const snapshot = await getDocs(q)
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }))
}

export async function getConversation(uid, conversationId) {
  const snap = await getDoc(doc(conversationsCol(uid), conversationId))
  return snap.exists() ? { id: snap.id, ...snap.data() } : null
}

export async function listMessages(uid, conversationId, { max = 200 } = {}) {
  const q = query(
    collection(db, 'users', uid, 'conversations', conversationId, 'messages'),
    orderBy('createdAt', 'asc'),
    limitTo(max),
  )
  const snapshot = await getDocs(q)
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }))
}
