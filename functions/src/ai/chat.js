/**
 * aiChat - the AI Code Assistant endpoint (a streaming callable function).
 *
 * Client sends: { conversationId?, message, mode, language, responseLanguage, projectId? }
 * Client receives, as a stream:
 *   { type: 'meta', conversationId }      first, so a new chat gets its URL
 *   { type: 'text', text }                 many times, as Gemini writes
 * and finally returns: { conversationId, messageId, usage }
 *
 * Security notes:
 * - History is loaded from Firestore, NOT accepted from the client, so a
 *   client can't inject fake "assistant" turns into the context.
 * - All writes happen here with the Admin SDK; clients can only read chats.
 */
import { onCall } from 'firebase-functions/v2/https'
import { AI_CONFIG } from '../config.js'
import { conversationsCol, db, FieldValue, messagesCol, Timestamp, userDoc } from '../db.js'
import { requireAuth } from '../middleware/auth.js'
import { releaseRequest, recordTokens, reserveRequest } from '../middleware/usage.js'
import { chatRequestSchema, parseOrThrow } from '../schemas/chat.js'
import { errors, HttpsError, logError, logEvent } from '../utils/errors.js'
import { GEMINI_API_KEY, streamReply } from './gemini.js'
import { buildAssistantPrompt } from './prompts/assistant.js'

const MODULE = 'assistant'

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

export const aiChat = onCall(
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
    const input = parseOrThrow(chatRequestSchema, request.data, errors.invalidInput)
    const startedAt = Date.now()

    // --- Conversation: existing (must belong to this user) or new ---
    let conversationRef
    let isNew = false
    if (input.conversationId) {
      conversationRef = conversationsCol(uid).doc(input.conversationId)
      const snap = await conversationRef.get()
      if (!snap.exists) throw errors.notFound('Conversation')
    } else {
      conversationRef = conversationsCol(uid).doc()
      isNew = true
    }

    const [history, project] = await Promise.all([
      isNew ? [] : loadHistory(uid, conversationRef.id),
      loadProject(uid, input.projectId),
    ])

    // --- Limit check (throws a friendly error when the daily limit is hit) ---
    const day = await reserveRequest(uid, MODULE)

    await response?.sendChunk({ type: 'meta', conversationId: conversationRef.id })

    let reply = ''
    let result = null
    try {
      const stream = streamReply({
        systemInstruction: buildAssistantPrompt({ ...input, project }),
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
        await releaseRequest(uid, MODULE, day)
        return { conversationId: conversationRef.id, stopped: true }
      }
      if (!reply) {
        await releaseRequest(uid, MODULE, day)
        if (error instanceof HttpsError) throw error
        logError('aiChat.failed', error, { uid, ms: Date.now() - startedAt })
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
      language: input.language,
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
      language: input.language,
      projectId: input.projectId ?? null,
    }
    if (isNew) {
      Object.assign(conversationData, {
        title: makeTitle(input.message),
        module: MODULE,
        createdAt: now,
      })
      batch.set(userDoc(uid).collection('activity').doc(), {
        module: MODULE,
        title: makeTitle(input.message),
        projectId: input.projectId ?? null,
        targetId: conversationRef.id,
        createdAt: now,
      })
    }
    batch.set(conversationRef, conversationData, { merge: true })
    await batch.commit()
    await recordTokens(uid, day, usage)

    logEvent('aiChat.done', {
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
