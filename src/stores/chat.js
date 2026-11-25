import { defineStore } from 'pinia'
import { computed, ref, watch } from 'vue'
import { streamAiChat, getAiErrorMessage, isAbortError } from '@/services/api/aiChat'
import { getConversation, listConversations, listMessages } from '@/services/firebase/conversations'
import { useAuthStore } from './auth'

let localId = 0
const tempId = (prefix) => `${prefix}-${Date.now()}-${++localId}`

/**
 * Store factory for streaming chat tools (AI Assistant, Learn JavaScript).
 * Each tool gets its own conversation list, open conversation, streaming
 * status and composer settings, saved separately.
 *
 * @param {object} tool
 * @param {string} tool.id             Pinia store id
 * @param {string} tool.module         conversation module (must match the backend)
 * @param {string} tool.functionName   Cloud Function to call
 * @param {string} tool.settingsKey    localStorage key for the settings
 * @param {object} tool.defaultSettings
 */
export function createChatStore({ id, module, functionName, settingsKey, defaultSettings }) {
  return defineStore(id, () => {
    const conversations = ref([])
    const conversationsStatus = ref('idle')

    const currentId = ref(null)
    const currentTitle = ref('')
    /** The open conversation document (title, topic, level, mode...), or null for a new chat. */
    const current = ref(null)
    const messages = ref([])
    const messagesStatus = ref('idle') // idle | loading | ready | error | not-found

    const sending = ref(false)
    let abortController = null

    const settings = ref({ ...defaultSettings, ...readSettings(settingsKey) })
    watch(settings, (value) => saveSettings(settingsKey, value), { deep: true })

    const uid = () => useAuthStore().user?.uid
    const isEmpty = computed(() => !messages.value.length)

    async function loadConversations() {
      if (!uid()) return
      if (conversationsStatus.value !== 'ready') conversationsStatus.value = 'loading'
      try {
        conversations.value = await listConversations(uid(), { module })
        conversationsStatus.value = 'ready'
      } catch {
        conversationsStatus.value = 'error'
      }
    }

    /** Open an existing conversation, or start a new one when id is null. */
    async function open(id) {
      if (sending.value) stop()
      if (!id) {
        currentId.value = null
        currentTitle.value = ''
        current.value = null
        messages.value = []
        messagesStatus.value = 'ready'
        return
      }
      if (id === currentId.value && messagesStatus.value === 'ready') return

      currentId.value = id
      messagesStatus.value = 'loading'
      try {
        const [conversation, list] = await Promise.all([
          getConversation(uid(), id),
          listMessages(uid(), id),
        ])
        if (currentId.value !== id) return // user switched chats meanwhile
        if (!conversation || (conversation.module ?? 'assistant') !== module) {
          messagesStatus.value = 'not-found'
          messages.value = []
          return
        }
        currentTitle.value = conversation.title ?? 'Chat'
        current.value = conversation
        messages.value = list.map((m) => ({ ...m, status: 'done' }))
        messagesStatus.value = 'ready'
      } catch {
        if (currentId.value === id) messagesStatus.value = 'error'
      }
    }

    /**
     * Send a message and stream the answer into a placeholder.
     * @param {string} text
     * @param {object} [overrides]  one-off options for this message (e.g. { mode, topic })
     * @returns the conversation id (new chats get one from the server)
     */
    async function send(text, overrides = {}) {
      const message = text.trim()
      if (!message || sending.value) return currentId.value

      sending.value = true
      const controller = new AbortController()
      abortController = controller

      messages.value.push({ id: tempId('user'), role: 'user', content: message, status: 'done' })
      messages.value.push({ id: tempId('model'), role: 'model', content: '', status: 'streaming' })
      // Always work on the reactive copy (the array item), not a plain object.
      const reply = messages.value.at(-1)

      try {
        const result = await streamAiChat(
          { ...settings.value, ...overrides, conversationId: currentId.value, message },
          {
            onMeta: ({ conversationId }) => {
              if (!currentId.value) {
                currentId.value = conversationId
                currentTitle.value = message.split('\n')[0].slice(0, 60)
              }
            },
            onText: (chunk) => {
              reply.content += chunk
            },
          },
          controller.signal,
          functionName,
        )
        reply.status = result?.stopped ? 'stopped' : 'done'
        if (result?.messageId) reply.id = result.messageId
        if (result?.stopped && !reply.content) removeLastExchange()
      } catch (error) {
        // If WE aborted (Stop button), it's a stop, whatever error the SDK raises.
        if (controller.signal.aborted || isAbortError(error)) {
          reply.status = 'stopped'
          if (!reply.content) removeLastExchange()
        } else {
          reply.status = 'error'
          reply.error = getAiErrorMessage(error)
          reply.retryText = message
          reply.retryOverrides = overrides
        }
      } finally {
        sending.value = false
        if (abortController === controller) abortController = null
        // Refresh the list, then adopt the server's title and details for this
        // chat (e.g. "Closures · Exercise" instead of the raw first message).
        loadConversations().then(() => {
          const saved = conversations.value.find((c) => c.id === currentId.value)
          if (saved) {
            currentTitle.value = saved.title
            current.value = saved
          }
        })
      }
      return currentId.value
    }

    function stop() {
      abortController?.abort()
    }

    /** Remove the failed exchange and send the same text again. */
    function retry() {
      const last = messages.value.at(-1)
      if (last?.status !== 'error') return
      const { retryText, retryOverrides } = last
      removeLastExchange()
      return send(retryText, retryOverrides)
    }

    function removeLastExchange() {
      messages.value.splice(-2, 2)
    }

    function reset() {
      stop()
      conversations.value = []
      conversationsStatus.value = 'idle'
      currentId.value = null
      currentTitle.value = ''
      current.value = null
      messages.value = []
      messagesStatus.value = 'idle'
    }

    return {
      conversations,
      conversationsStatus,
      currentId,
      currentTitle,
      current,
      messages,
      messagesStatus,
      sending,
      settings,
      isEmpty,
      loadConversations,
      open,
      send,
      stop,
      retry,
      reset,
    }
  })
}

function readSettings(key) {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? {}
  } catch {
    return {}
  }
}
function saveSettings(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    /* ignore */
  }
}

/** AI Code Assistant */
export const useChatStore = createChatStore({
  id: 'chat',
  module: 'assistant',
  functionName: 'aiChat',
  settingsKey: 'devmate-assistant-settings',
  defaultSettings: { mode: 'chat', language: 'auto', responseLanguage: 'en', projectId: null },
})

/** JavaScript Learning Assistant */
export const useLearnStore = createChatStore({
  id: 'learn',
  module: 'learn',
  functionName: 'aiLearn',
  settingsKey: 'devmate-learn-settings',
  defaultSettings: { mode: 'chat', level: 'beginner', responseLanguage: 'en' },
})
