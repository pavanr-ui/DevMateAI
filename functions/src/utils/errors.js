/**
 * Errors and logging.
 *
 * Rule: never log prompts, code or AI answers (they are the user's private
 * content). Log only ids, sizes, codes and timings.
 */
import { HttpsError } from 'firebase-functions/v2/https'
import { logger } from 'firebase-functions'

export { HttpsError }

/** Friendly, safe-to-show errors (the client shows `message` as-is). */
export const errors = {
  unauthenticated: () => new HttpsError('unauthenticated', 'Please sign in to use the AI tools.'),
  invalidInput: (message = 'Your request could not be processed.') =>
    new HttpsError('invalid-argument', message),
  notFound: (what = 'That item') => new HttpsError('not-found', `${what} was not found.`),
  dailyLimit: (limit) =>
    new HttpsError(
      'resource-exhausted',
      `You've reached today's limit of ${limit} AI requests. It resets at 00:00 UTC.`,
    ),
  aiBlocked: () =>
    new HttpsError(
      'failed-precondition',
      "The AI couldn't answer this request. Try rephrasing it.",
    ),
  aiUnavailable: () =>
    new HttpsError('unavailable', 'The AI service is busy right now. Please try again shortly.'),
  aiTooSlow: () =>
    new HttpsError('unavailable', 'The AI is taking too long to respond. Please try again.'),
  internal: () => new HttpsError('internal', 'Something went wrong. Please try again.'),
}

/** Structured log with metadata only. */
export function logEvent(event, meta = {}) {
  logger.info(event, meta)
}

/** Logs an unexpected error WITHOUT its message (messages can echo user content). */
export function logError(event, error, meta = {}) {
  logger.error(event, {
    ...meta,
    errorName: error?.name,
    errorCode: error?.code ?? error?.status,
  })
}
