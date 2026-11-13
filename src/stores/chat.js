import { defineStore } from 'pinia'
import { computed, ref, watch } from 'vue'
import { streamAiChat, getAiErrorMessage, isAbortError } from '@/services/api/aiChat'
import { getConversation, listConversations, listMessages } from '@/services/firebase/conversations'
import { useAuthStore } from './auth'

const SETTINGS_KEY = 'devmate-assistant-settings'
const DEFAULT_SETTINGS = { mode: 'chat', language: 'auto', responseLanguage: 'en', projectId: null }

let localId = 0
const tempId = (prefix) => `${prefix}-${Date.now()}-${++localId}`

/**
 * AI Assistant state: conversation list, the open conversation's messages,
 * streaming status and the composer settings (mode, language...).
 */
export const useChatStore = defineStore('chat', () => {
  const conversations = ref([])
  const conversationsStatus = ref('idle')

  const currentId = ref(null)
  const currentTitle = ref('')
  const messages = ref([])
  const messagesStatus = ref('idle') // idle | loading | ready | error | not-found

  const sending = ref(false)
  let abortController = null

  const settings = ref({ ...DEFAULT_SETTINGS, ...readSettings() })
  watch(settings, (value) => saveSettings(value), { deep: true })

  const uid = () => useAuthStore().user?.uid
  const isEmpty = computed(() => !messages.value.length)

  async function loadConversations() {
    if (!uid()) return
    if (conversationsStatus.value !== 'ready') conversationsStatus.value = 'loading'
    try {
      conversations.value = await listConversations(uid())
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
      if (!conversation) {
        messagesStatus.value = 'not-found'
        messages.value = []
        return
      }
      currentTitle.value = conversation.title ?? 'Chat'
      messages.value = list.map((m) => ({ ...m, status: 'done' }))
      messagesStatus.value = 'ready'
    } catch {
      if (currentId.value === id) messagesStatus.value = 'error'
    }
  }

  /**
   * Send a message and stream the answer into a placeholder.
   * @returns the conversation id (new chats get one from the server)
   */
  async function send(text) {
    const message = text.trim()
    if (!message || sending.value) return currentId.value

    sending.value = true
    const controller = new AbortController()
    abortController = controller
    const { mode, language, responseLanguage, projectId } = settings.value

    messages.value.push({ id: tempId('user'), role: 'user', content: message, status: 'done' })
    messages.value.push({ id: tempId('model'), role: 'model', content: '', status: 'streaming' })
    // Always work on the reactive copy (the array item), not a plain object.
    const reply = messages.value.at(-1)

    try {
      const result = await streamAiChat(
        { conversationId: currentId.value, message, mode, language, responseLanguage, projectId },
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
      }
    } finally {
      sending.value = false
      if (abortController === controller) abortController = null
      loadConversations() // refresh titles / order in the sidebar
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
    const text = last.retryText
    removeLastExchange()
    return send(text)
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
    messages.value = []
    messagesStatus.value = 'idle'
  }

  return {
    conversations,
    conversationsStatus,
    currentId,
    currentTitle,
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

function readSettings() {
  try {
    return JSON.parse(localStorage.getItem(SETTINGS_KEY)) ?? {}
  } catch {
    return {}
  }
}
function saveSettings(value) {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(value))
  } catch {
    /* ignore */
  }
}
