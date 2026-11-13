/**
 * Gemini client wrapper. The API key comes from Google Secret Manager
 * (defineSecret) and is only ever read here, on the server.
 *
 * Mock mode: in the local emulator, if no key is configured, a fake
 * streaming responder is used so the app can be built and tested for free.
 * Mock mode can NEVER run in production (FUNCTIONS_EMULATOR is unset there).
 */
import { GoogleGenAI } from '@google/genai'
import { defineSecret } from 'firebase-functions/params'
import { AI_CONFIG } from '../config.js'
import { errors } from '../utils/errors.js'

export const GEMINI_API_KEY = defineSecret('GEMINI_API_KEY')

const isEmulator = process.env.FUNCTIONS_EMULATOR === 'true'

let client = null
function getClient() {
  const key = GEMINI_API_KEY.value()
  if (!key) return null
  client ??= new GoogleGenAI({ apiKey: key })
  return client
}

export function isMockMode() {
  return isEmulator && !GEMINI_API_KEY.value()
}

/**
 * Streams a reply. Yields { text } chunks, then one final
 * { done: true, usage: { tokensIn, tokensOut }, finishReason, model }.
 *
 * @param {object} opts
 * @param {string} opts.systemInstruction
 * @param {Array<{role: 'user'|'model', text: string}>} opts.messages oldest first
 * @param {AbortSignal} [opts.signal] stops generation when the user disconnects
 */
export async function* streamReply({ systemInstruction, messages, signal, model }) {
  const modelId = AI_CONFIG.allowedModels.includes(model) ? model : AI_CONFIG.defaultModel

  if (isMockMode()) {
    yield* mockStream(messages.at(-1)?.text ?? '', signal)
    return
  }

  const ai = getClient()
  if (!ai) throw errors.aiUnavailable() // production without a key: misconfiguration

  const stream = await ai.models.generateContentStream({
    model: modelId,
    contents: messages.map((m) => ({ role: m.role, parts: [{ text: m.text }] })),
    config: {
      systemInstruction,
      temperature: AI_CONFIG.temperature,
      maxOutputTokens: AI_CONFIG.maxOutputTokens,
      abortSignal: signal,
    },
  })

  let usage = { tokensIn: 0, tokensOut: 0 }
  let finishReason = null
  let sawText = false

  for await (const chunk of stream) {
    const text = chunk.text
    if (text) {
      sawText = true
      yield { text }
    }
    const candidate = chunk.candidates?.[0]
    if (candidate?.finishReason) finishReason = candidate.finishReason
    if (chunk.promptFeedback?.blockReason) throw errors.aiBlocked()
    if (chunk.usageMetadata) {
      usage = {
        tokensIn: chunk.usageMetadata.promptTokenCount ?? 0,
        tokensOut:
          (chunk.usageMetadata.candidatesTokenCount ?? 0) +
          (chunk.usageMetadata.thoughtsTokenCount ?? 0),
      }
    }
  }

  if (
    !sawText &&
    ['SAFETY', 'RECITATION', 'PROHIBITED_CONTENT', 'BLOCKLIST', 'SPII'].includes(finishReason)
  ) {
    throw errors.aiBlocked()
  }
  yield { done: true, usage, finishReason, model: modelId }
}

// ---------------------------------------------------------------------------
// Mock responder (emulator only)
// ---------------------------------------------------------------------------
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

async function* mockStream(prompt, signal) {
  const reply = [
    '> 🧪 **Mock AI response** (local emulator, no Gemini key configured).\n\n',
    `You asked: _"${prompt.slice(0, 120).replace(/[_*`]/g, '')}${prompt.length > 120 ? '…' : ''}"_\n\n`,
    'Here is an example of what a real answer looks like:\n\n',
    '```javascript\n',
    '// Debounce: wait until the user stops typing\n',
    'export function debounce(fn, delay = 300) {\n',
    '  let timer\n',
    '  return (...args) => {\n',
    '    clearTimeout(timer)\n',
    '    timer = setTimeout(() => fn(...args), delay)\n',
    '  }\n',
    '}\n',
    '```\n\n',
    '**How it works**\n\n',
    '1. Every call clears the previous timer.\n',
    '2. Only the last call within `delay` ms actually runs.\n\n',
    'Add your Gemini key to `functions/.secret.local` to get real answers.',
  ]
  for (const part of reply) {
    if (signal?.aborted) return
    await sleep(60)
    yield { text: part }
  }
  const words = reply.join('').split(/\s+/).length
  yield {
    done: true,
    usage: { tokensIn: Math.ceil(prompt.length / 4), tokensOut: Math.ceil(words * 1.3) },
    finishReason: 'STOP',
    model: 'mock',
  }
}
