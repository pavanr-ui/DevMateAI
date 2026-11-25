/**
 * Calls a one-shot analysis function (aiReview, aiFixBug).
 *
 * Uses the streaming form only to receive progress and to be cancellable;
 * the result arrives all at once at the end (it is structured JSON).
 */
import { httpsCallable } from 'firebase/functions'
import { functions } from '@/services/firebase'

const callables = {}

/**
 * @param {'aiReview'|'aiFixBug'} name
 * @param {object} input
 * @param {{ onMeta?: Function, onProgress?: (chars: number) => void }} handlers
 * @param {AbortSignal} [signal]
 * @returns {Promise<{conversationId: string|null, result?: object, usage?: object, stopped?: boolean}>}
 */
export async function runAnalysis(name, input, { onMeta, onProgress } = {}, signal) {
  callables[name] ??= httpsCallable(functions, name, { timeout: 190_000 })
  const { stream, data } = await callables[name].stream(input, { signal })
  for await (const chunk of stream) {
    if (chunk?.type === 'meta') onMeta?.(chunk)
    else if (chunk?.type === 'progress') onProgress?.(chunk.chars)
  }
  return data
}
