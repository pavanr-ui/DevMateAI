/**
 * Shared engine for one-shot code analysis tools (Code Reviewer, Bug Fixer).
 *
 * Every tool follows the same safe flow:
 *   auth -> validate input -> reserve daily request -> Gemini (JSON) ->
 *   validate result -> save to history -> record usage + activity
 *
 * Streaming is used only to show progress and allow cancelling:
 *   { type: 'meta', conversationId }  then  { type: 'progress', chars }
 * The function finally returns { conversationId, result, usage }.
 */
import { onCall } from 'firebase-functions/v2/https'
import { AI_CONFIG } from '../config.js'
import { conversationsCol, db, FieldValue, messagesCol, Timestamp, userDoc } from '../db.js'
import { requireAuth } from '../middleware/auth.js'
import { recordTokens, releaseRequest, reserveRequest } from '../middleware/usage.js'
import { parseOrThrow } from '../schemas/chat.js'
import { errors, HttpsError, logError, logEvent } from '../utils/errors.js'
import { GEMINI_API_KEY, generateJson } from './gemini.js'
import { buildAnalysisInput } from './prompts/analysis.js'

async function loadProject(uid, projectId) {
  if (!projectId) return null
  const snap = await userDoc(uid).collection('projects').doc(projectId).get()
  return snap.exists ? snap.data() : null
}

/**
 * @param {object} tool
 * @param {string} tool.module                e.g. 'reviewer'
 * @param {import('zod').ZodType} tool.inputSchema
 * @param {import('zod').ZodType} tool.resultSchema
 * @param {(input, project) => string} tool.buildPrompt   system prompt
 * @param {(input, result) => string} tool.makeTitle     history title
 * @param {(input) => object} tool.mockResult            emulator-only fake result
 * @param {(input) => object} [tool.extraUserFields]     extra fields saved on the user message
 */
export function createAnalysisFunction(tool) {
  return onCall(
    {
      secrets: [GEMINI_API_KEY],
      timeoutSeconds: AI_CONFIG.timeoutSeconds,
      memory: '512MiB',
      enforceAppCheck: false, // switched on in Phase 8
    },
    async (request, response) => {
      const uid = requireAuth(request)
      const input = parseOrThrow(tool.inputSchema, request.data, errors.invalidInput)
      const startedAt = Date.now()
      const conversationRef = conversationsCol(uid).doc()

      const project = await loadProject(uid, input.projectId)
      const day = await reserveRequest(uid, tool.module)
      await response?.sendChunk({ type: 'meta', conversationId: conversationRef.id })

      let lastSent = 0
      let output
      try {
        output = await generateJson({
          systemInstruction: tool.buildPrompt(input, project),
          userText: buildAnalysisInput(input),
          resultSchema: tool.resultSchema,
          signal: response?.signal,
          mockResult: () => tool.mockResult(input),
          onProgress: (chars) => {
            // Throttle progress messages to roughly one per 400 characters.
            if (chars - lastSent >= 400) {
              lastSent = chars
              response?.sendChunk({ type: 'progress', chars }).catch(() => {})
            }
          },
        })
      } catch (error) {
        await releaseRequest(uid, tool.module, day)
        if (error instanceof HttpsError) throw error
        if (response?.signal?.aborted) return { conversationId: null, stopped: true }
        logError(`${tool.module}.failed`, error, { uid, ms: Date.now() - startedAt })
        throw errors.aiUnavailable()
      }

      if (!output) {
        // Cancelled by the user before the result was complete.
        // NOTE: the local emulator does not report browser disconnects, so a
        // cancelled run still finishes and is saved there. Verify on real
        // Firebase in Phase 10 that cancelling releases the request.
        await releaseRequest(uid, tool.module, day)
        return { conversationId: null, stopped: true }
      }

      const { result, usage, model } = output
      const title = tool.makeTitle(input, result)
      const now = FieldValue.serverTimestamp()
      const askedAt = Timestamp.now()
      const batch = db.batch()

      batch.set(conversationRef, {
        title,
        module: tool.module,
        language: input.language === 'auto' ? (result.language ?? 'auto') : input.language,
        projectId: input.projectId ?? null,
        lastMessagePreview: (result.summary ?? '').slice(0, 140),
        ...(typeof result.score === 'number' ? { score: result.score } : {}),
        messageCount: 2,
        createdAt: now,
        updatedAt: now,
      })
      batch.set(messagesCol(uid, conversationRef.id).doc(), {
        role: 'user',
        content: input.code,
        language: input.language,
        ...(tool.extraUserFields?.(input) ?? {}),
        createdAt: askedAt,
      })
      batch.set(messagesCol(uid, conversationRef.id).doc(), {
        role: 'model',
        content: result.summary ?? '',
        result,
        model,
        tokensIn: usage.tokensIn,
        tokensOut: usage.tokensOut,
        createdAt: Timestamp.fromMillis(askedAt.toMillis() + 1),
      })
      batch.set(userDoc(uid).collection('activity').doc(), {
        module: tool.module,
        title,
        projectId: input.projectId ?? null,
        targetId: conversationRef.id,
        createdAt: now,
      })
      await batch.commit()
      await recordTokens(uid, day, usage)

      logEvent(`${tool.module}.done`, {
        uid,
        conversationId: conversationRef.id,
        codeChars: input.code.length,
        ...usage,
        ms: Date.now() - startedAt,
      })

      return { conversationId: conversationRef.id, result, usage }
    },
  )
}
