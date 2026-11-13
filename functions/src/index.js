/**
 * DevMate AI - Cloud Functions entry point.
 *
 * Every function the app can call is exported from this file.
 * GitHub functions arrive in Phase 7.
 */
import { setGlobalOptions } from 'firebase-functions/v2'
import { onCall } from 'firebase-functions/v2/https'

// Cap instances so a bug or abuse can't scale costs without limit.
setGlobalOptions({ region: 'us-central1', maxInstances: 10 })

export const healthCheck = onCall(() => ({
  status: 'ok',
  service: 'devmate-ai-functions',
  time: new Date().toISOString(),
}))

export { aiChat } from './ai/chat.js'
