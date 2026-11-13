/**
 * Input validation for aiChat. Every field from the client is untrusted;
 * zod checks types, lengths and allowed values before anything else runs.
 */
import { z } from 'zod'
import { AI_CONFIG, ASSISTANT_MODES, CODE_LANGUAGES, RESPONSE_LANGUAGES } from '../config.js'

const firestoreId = z.string().regex(/^[A-Za-z0-9_-]{1,64}$/, 'Invalid id')

export const chatRequestSchema = z.object({
  conversationId: firestoreId.nullish(),
  message: z
    .string()
    .trim()
    .min(1, 'Please type a message.')
    .max(
      AI_CONFIG.maxMessageChars,
      `Messages can be up to ${AI_CONFIG.maxMessageChars} characters.`,
    ),
  mode: z.enum(ASSISTANT_MODES).default('chat'),
  language: z.enum(CODE_LANGUAGES).default('auto'),
  responseLanguage: z.enum(RESPONSE_LANGUAGES).default('en'),
  projectId: firestoreId.nullish(),
})

/** Returns parsed data, or throws a friendly invalid-argument error. */
export function parseOrThrow(schema, data, makeError) {
  const result = schema.safeParse(data ?? {})
  if (!result.success) throw makeError(result.error.issues[0]?.message)
  return result.data
}
