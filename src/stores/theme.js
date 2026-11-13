import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

const STORAGE_KEY = 'devmate-theme'
const DARK_CLASS = 'ion-palette-dark'

/**
 * Theme store: 'light' | 'dark' | 'system'.
 * Adds/removes one class on <html>; Ionic and Tailwind both react to it.
 */
export const useThemeStore = defineStore('theme', () => {
  const mode = ref(readSavedMode())

  const prefersDark = () =>
    typeof window !== 'undefined' &&
    window.matchMedia?.('(prefers-color-scheme: dark)').matches === true

  const isDark = computed(() => (mode.value === 'system' ? prefersDark() : mode.value === 'dark'))

  function apply() {
    document.documentElement.classList.toggle(DARK_CLASS, isDark.value)
  }

  function setMode(next) {
    if (!['light', 'dark', 'system'].includes(next)) return
    mode.value = next
    localStorage.setItem(STORAGE_KEY, next)
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
    return ['light', 'dark', 'system'].includes(saved) ? saved : 'system'
  } catch {
    return 'system'
  }
}
