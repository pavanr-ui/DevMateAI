/**
 * Calls the aiChat Cloud Function and streams the answer.
 *
 * The browser never talks to Gemini directly and never sees the API key:
 * it calls OUR backend function, which checks the user, applies limits and
 * then calls Gemini.
 */
import { httpsCallable } from 'firebase/functions'
import { functions } from '@/services/firebase'

const aiChatCallable = httpsCallable(functions, 'aiChat', { timeout: 130_000 })

/**
 * @param {object} input  { conversationId?, message, mode, language, responseLanguage, projectId? }
 * @param {object} handlers  { onMeta({conversationId}), onText(text) }
 * @param {AbortSignal} [signal]  abort to stop generating
 * @returns {Promise<{conversationId, messageId, usage, stopped}>}
 */
export async function streamAiChat(input, { onMeta, onText } = {}, signal) {
  const { stream, data } = await aiChatCallable.stream(input, { signal })
  for await (const chunk of stream) {
    if (chunk?.type === 'meta') onMeta?.(chunk)
    else if (chunk?.type === 'text') onText?.(chunk.text)
  }
  return data
}

/** Server errors already carry friendly messages; anything else gets a generic one. */
const FRIENDLY_CODES = new Set([
  'functions/resource-exhausted',
  'functions/invalid-argument',
  'functions/failed-precondition',
  'functions/unavailable',
  'functions/not-found',
  'functions/unauthenticated',
])

export function getAiErrorMessage(error) {
  // The SDK appends the HTTP status, e.g. "... resets at 00:00 UTC. [429]"; drop it.
  if (FRIENDLY_CODES.has(error?.code) && error.message)
    return error.message.replace(/\s*\[\d+\]\s*$/, '')
  if (error?.code === 'functions/deadline-exceeded')
    return 'The AI took too long to answer. Please try again.'
  if (!navigator.onLine) return "You're offline. Check your connection and try again."
  return 'Something went wrong. Please try again.'
}

export function isAbortError(error) {
  return error?.name === 'AbortError' || error?.code === 'functions/cancelled'
}
