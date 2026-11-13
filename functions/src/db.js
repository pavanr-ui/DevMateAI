/**
 * Firebase Admin SDK. Runs with full access and bypasses security rules,
 * which is why only trusted backend code may write activity and usage.
 */
import { initializeApp, getApps } from 'firebase-admin/app'
import { getFirestore, FieldValue, Timestamp } from 'firebase-admin/firestore'

if (!getApps().length) initializeApp()

export const db = getFirestore()
export { FieldValue, Timestamp }

export const userDoc = (uid) => db.collection('users').doc(uid)
export const conversationsCol = (uid) => userDoc(uid).collection('conversations')
export const messagesCol = (uid, conversationId) =>
  conversationsCol(uid).doc(conversationId).collection('messages')

/** "YYYY-MM-DD" in UTC; same key format the dashboard reads. */
export const utcDayKey = (date = new Date()) => date.toISOString().slice(0, 10)
