import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

const STORAGE_KEY = 'devmate-theme'
const DARK_CLASS = 'ion-palette-dark'
const MODES = ['light', 'dark', 'system']

/**
 * Theme store: 'light' | 'dark' | 'system'.
 * Adds/removes one class on <html>; Ionic and Tailwind both react to it.
 * In 'system' mode it follows the OS setting, live.
 */
export const useThemeStore = defineStore('theme', () => {
  const mode = ref(readSavedMode())

  const media =
    typeof window !== 'undefined' ? window.matchMedia?.('(prefers-color-scheme: dark)') : null
  const systemDark = ref(media?.matches === true)
  media?.addEventListener?.('change', (event) => {
    systemDark.value = event.matches
    apply()
  })

  const isDark = computed(() =>
    mode.value === 'system' ? systemDark.value : mode.value === 'dark',
  )

  function apply() {
    document.documentElement.classList.toggle(DARK_CLASS, isDark.value)
  }

  function setMode(next) {
    if (!MODES.includes(next)) return
    mode.value = next
    try {
      localStorage.setItem(STORAGE_KEY, next)
    } catch {
      /* storage unavailable; theme still applies for this session */
    }
    apply()
  }

  function toggle() {
    setMode(isDark.value ? 'light' : 'dark')
  }

  return { mode, isDark, setMode, toggle, apply }
})

function readSavedMode() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    return MODES.includes(saved) ? saved : 'system'
  } catch {
    return 'system'
  }
}
