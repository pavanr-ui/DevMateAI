/**
 * Streaming chat engine, shared by the AI Assistant (aiChat) and the
 * JavaScript Learning Assistant (aiLearn).
 *
 * Client sends: { conversationId?, message, ...tool-specific options }
 * Client receives, as a stream:
 *   { type: 'meta', conversationId }      first, so a new chat gets its URL
 *   { type: 'text', text }                 many times, as Gemini writes
 * and finally returns: { conversationId, messageId, usage, stopped }
 *
 * Security notes:
 * - History is loaded from Firestore, NOT accepted from the client, so a
 *   client can't inject fake "assistant" turns into the context.
 * - A conversation can only be continued by the tool that created it.
 * - All writes happen here with the Admin SDK; clients can only read chats.
 */
import { onCall } from 'firebase-functions/v2/https'
import { AI_CONFIG } from '../config.js'
import { conversationsCol, db, FieldValue, messagesCol, Timestamp, userDoc } from '../db.js'
import { requireAuth } from '../middleware/auth.js'
import { releaseRequest, recordTokens, reserveRequest } from '../middleware/usage.js'
import { chatRequestSchema, learnRequestSchema, parseOrThrow } from '../schemas/chat.js'
import { errors, HttpsError, logError, logEvent } from '../utils/errors.js'
import { GEMINI_API_KEY, streamReply } from './gemini.js'
import { buildAssistantPrompt } from './prompts/assistant.js'
import { buildLearnPrompt } from './prompts/learn.js'

const LEARN_MODE_LABELS = {
  chat: 'Chat',
  explain: 'Explained',
  examples: 'Examples',
  exercise: 'Exercise',
  interview: 'Interview',
}

/** First line of the first message, shortened: used as the chat title. */
export function makeTitle(message) {
  const firstLine = message.split('\n').find((l) => l.trim()) ?? 'New chat'
  const title = firstLine.trim().replace(/\s+/g, ' ')
  return title.length > 60 ? `${title.slice(0, 57)}…` : title
}

async function loadProject(uid, projectId) {
  if (!projectId) return null
  const snap = await userDoc(uid).collection('projects').doc(projectId).get()
  return snap.exists ? snap.data() : null
}

async function loadHistory(uid, conversationId) {
  const snap = await messagesCol(uid, conversationId)
    .orderBy('createdAt', 'desc')
    .limit(AI_CONFIG.historyMessages)
    .get()
  return snap.docs
    .map((d) => d.data())
    .reverse()
    .filter((m) => m.content)
    .map((m) => ({ role: m.role === 'model' ? 'model' : 'user', text: m.content }))
}

/**
 * @param {object} tool
 * @param {string} tool.module                    saved on conversations, usage and activity
 * @param {import('zod').ZodType} tool.requestSchema
 * @param {(input, project) => string} tool.buildPrompt
 * @param {(input) => object} [tool.extraFields]  extra fields saved on user messages / conversation
 * @param {(input) => string} [tool.titleFrom]    text used for a new chat's title
 */
export function createChatFunction(tool) {
  return onCall(
    {
      secrets: [GEMINI_API_KEY],
      timeoutSeconds: AI_CONFIG.timeoutSeconds,
      memory: '512MiB',
      // App Check enforcement is switched on in Phase 8, once the web and
      // mobile apps are registered with App Check.
      enforceAppCheck: false,
    },
    async (request, response) => {
      const uid = requireAuth(request)
      const input = parseOrThrow(tool.requestSchema, request.data, errors.invalidInput)
      const startedAt = Date.now()
      const extra = tool.extraFields?.(input) ?? {}

      // --- Conversation: existing (must belong to this user AND tool) or new ---
      let conversationRef
      let isNew = false
      if (input.conversationId) {
        conversationRef = conversationsCol(uid).doc(input.conversationId)
        const snap = await conversationRef.get()
        if (!snap.exists || snap.get('module') !== tool.module) {
          throw errors.notFound('Conversation')
        }
      } else {
        conversationRef = conversationsCol(uid).doc()
        isNew = true
      }

      const [history, project] = await Promise.all([
        isNew ? [] : loadHistory(uid, conversationRef.id),
        loadProject(uid, input.projectId),
      ])

      // --- Limit check (throws a friendly error when the daily limit is hit) ---
      const day = await reserveRequest(uid, tool.module)

      await response?.sendChunk({ type: 'meta', conversationId: conversationRef.id })

      let reply = ''
      let result = null
      try {
        const stream = streamReply({
          systemInstruction: tool.buildPrompt(input, project),
          messages: [...history, { role: 'user', text: input.message }],
          signal: response?.signal,
        })
        for await (const part of stream) {
          if (part.done) {
            result = part
            break
          }
          reply += part.text
          await response?.sendChunk({ type: 'text', text: part.text })
        }
      } catch (error) {
        // Stopped by the user before any text arrived: nothing to save or count.
        if (response?.signal?.aborted && !reply) {
          await releaseRequest(uid, tool.module, day)
          return { conversationId: conversationRef.id, stopped: true }
        }
        if (!reply) {
          await releaseRequest(uid, tool.module, day)
          if (error instanceof HttpsError) throw error
          logError(`${tool.module}.failed`, error, { uid, ms: Date.now() - startedAt })
          throw errors.aiUnavailable()
        }
        // Partial answer (e.g. user pressed Stop): keep what we have.
      }

      const stopped = !result
      const usage = result?.usage ?? { tokensIn: 0, tokensOut: 0 }

      // --- Save both messages + conversation + activity in one batch ---
      const now = FieldValue.serverTimestamp()
      // Explicit times (reply = question + 1 ms) keep "user then model" order stable.
      const askedAt = Timestamp.now()
      const answeredAt = Timestamp.fromMillis(askedAt.toMillis() + 1)
      const batch = db.batch()
      const userMsgRef = messagesCol(uid, conversationRef.id).doc()
      const modelMsgRef = messagesCol(uid, conversationRef.id).doc()

      batch.set(userMsgRef, {
        role: 'user',
        content: input.message,
        mode: input.mode,
        ...extra,
        createdAt: askedAt,
      })
      batch.set(modelMsgRef, {
        role: 'model',
        content: reply,
        model: result?.model ?? null,
        finishReason: stopped ? 'STOPPED' : (result.finishReason ?? 'STOP'),
        tokensIn: usage.tokensIn,
        tokensOut: usage.tokensOut,
        createdAt: answeredAt,
      })

      const conversationData = {
        updatedAt: now,
        messageCount: FieldValue.increment(2),
        lastMessagePreview: reply
          .replace(/```[\s\S]*?```/g, '[code]')
          .replace(/\s+/g, ' ')
          .slice(0, 140),
        projectId: input.projectId ?? null,
        ...extra,
      }
      if (isNew) {
        const title = makeTitle(tool.titleFrom?.(input) ?? input.message)
        Object.assign(conversationData, { title, module: tool.module, createdAt: now })
        batch.set(userDoc(uid).collection('activity').doc(), {
          module: tool.module,
          title,
          projectId: input.projectId ?? null,
          targetId: conversationRef.id,
          createdAt: now,
        })
      }
      batch.set(conversationRef, conversationData, { merge: true })
      await batch.commit()
      await recordTokens(uid, day, usage)

      logEvent(`${tool.module}.done`, {
        uid,
        conversationId: conversationRef.id,
        isNew,
        mode: input.mode,
        stopped,
        inChars: input.message.length,
        outChars: reply.length,
        ...usage,
        ms: Date.now() - startedAt,
      })

      return { conversationId: conversationRef.id, messageId: modelMsgRef.id, usage, stopped }
    },
  )
}

export const aiChat = createChatFunction({
  module: 'assistant',
  requestSchema: chatRequestSchema,
  buildPrompt: (input, project) => buildAssistantPrompt({ ...input, project }),
  extraFields: (input) => ({ language: input.language }),
})

export const aiLearn = createChatFunction({
  module: 'learn',
  requestSchema: learnRequestSchema,
  buildPrompt: (input) => buildLearnPrompt(input),
  // mode is saved so follow-ups (e.g. answers to an exercise) keep the same activity.
  extraFields: (input) => ({ level: input.level, topic: input.topic ?? null, mode: input.mode }),
  // "Closures · Exercise" reads better in history than the full templated prompt.
  titleFrom: (input) =>
    input.topic ? `${input.topic} · ${LEARN_MODE_LABELS[input.mode] ?? 'Chat'}` : input.message,
})
