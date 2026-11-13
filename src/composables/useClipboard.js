import { ref } from 'vue'

/**
 * Copy text to the clipboard with a short "Copied!" state.
 *   const { copy, copied } = useClipboard()
 */
export function useClipboard({ resetAfter = 2000 } = {}) {
  const copied = ref(false)
  const failed = ref(false)
  let timer

  async function copy(text) {
    failed.value = false
    try {
      await navigator.clipboard.writeText(text)
      copied.value = true
      clearTimeout(timer)
      timer = setTimeout(() => (copied.value = false), resetAfter)
      return true
    } catch {
      failed.value = true
      return false
    }
  }

  return { copy, copied, failed }
}
