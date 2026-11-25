import { defineStore } from 'pinia'
import { ref } from 'vue'
import { runAnalysis } from '@/services/api/aiAnalysis'
import { getAiErrorMessage, isAbortError } from '@/services/api/aiChat'
import { getConversation, listConversations, listMessages } from '@/services/firebase/conversations'
import { useAuthStore } from './auth'

/**
 * Store factory for one-shot AI tools. Each tool gets its own store:
 *   export const useReviewStore = createAnalysisStore('reviewer', 'aiReview')
 *
 * status: 'idle' | 'running' | 'done' | 'error' | 'loading' (opening history) | 'not-found'
 */
export function createAnalysisStore(module, functionName) {
  return defineStore(`analysis-${module}`, () => {
    const status = ref('idle')
    const progressChars = ref(0)
    const error = ref('')
    const currentId = ref(null)
    const input = ref(null) // what was analysed (code, error, language...)
    const result = ref(null)

    const history = ref([])
    const historyStatus = ref('idle')

    let controller = null
    const uid = () => useAuthStore().user?.uid

    async function run(payload) {
      if (status.value === 'running') return
      controller = new AbortController()
      const mine = controller
      status.value = 'running'
      progressChars.value = 0
      error.value = ''
      result.value = null
      currentId.value = null
      input.value = { ...payload }

      try {
        const data = await runAnalysis(
          functionName,
          payload,
          { onProgress: (chars) => (progressChars.value = chars) },
          mine.signal,
        )
        if (data?.stopped) {
          status.value = 'idle'
          return null
        }
        result.value = data.result
        currentId.value = data.conversationId
        status.value = 'done'
        loadHistory()
        return data.conversationId
      } catch (err) {
        if (mine.signal.aborted || isAbortError(err)) {
          status.value = 'idle'
        } else {
          error.value = getAiErrorMessage(err)
          status.value = 'error'
        }
        return null
      } finally {
        if (controller === mine) controller = null
      }
    }

    function cancel() {
      controller?.abort()
    }

    /** Re-open a saved result from history. */
    async function open(id) {
      if (!id) return reset({ keepHistory: true })
      if (id === currentId.value && status.value === 'done') return
      cancel()
      currentId.value = id
      status.value = 'loading'
      try {
        const [conversation, messages] = await Promise.all([
          getConversation(uid(), id),
          listMessages(uid(), id),
        ])
        if (currentId.value !== id) return
        const asked = messages.find((m) => m.role === 'user')
        const answered = messages.find((m) => m.role === 'model')
        if (!conversation || conversation.module !== module || !answered?.result) {
          status.value = 'not-found'
          return
        }
        input.value = { ...asked, code: asked?.content ?? '' }
        result.value = answered.result
        status.value = 'done'
      } catch {
        if (currentId.value === id) {
          error.value = "We couldn't open this result."
          status.value = 'error'
        }
      }
    }

    async function loadHistory() {
      if (!uid()) return
      if (historyStatus.value !== 'ready') historyStatus.value = 'loading'
      try {
        history.value = await listConversations(uid(), { module })
        historyStatus.value = 'ready'
      } catch {
        historyStatus.value = 'error'
      }
    }

    function reset({ keepHistory = false } = {}) {
      cancel()
      status.value = 'idle'
      progressChars.value = 0
      error.value = ''
      currentId.value = null
      input.value = null
      result.value = null
      if (!keepHistory) {
        history.value = []
        historyStatus.value = 'idle'
      }
    }

    return {
      status,
      progressChars,
      error,
      currentId,
      input,
      result,
      history,
      historyStatus,
      run,
      cancel,
      open,
      loadHistory,
      reset,
    }
  })
}

export const useReviewStore = createAnalysisStore('reviewer', 'aiReview')
export const useBugFixStore = createAnalysisStore('bug-fixer', 'aiFixBug')
