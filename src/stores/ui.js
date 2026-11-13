import { defineStore } from 'pinia'
import { ref } from 'vue'

const SIDEBAR_KEY = 'devmate-sidebar-collapsed'

/** UI preferences that are not tied to the user account. */
export const useUiStore = defineStore('ui', () => {
  const sidebarCollapsed = ref(readBool(SIDEBAR_KEY))

  function toggleSidebar() {
    sidebarCollapsed.value = !sidebarCollapsed.value
    try {
      localStorage.setItem(SIDEBAR_KEY, String(sidebarCollapsed.value))
    } catch {
      /* storage can be unavailable (private mode); ignore */
    }
  }

  return { sidebarCollapsed, toggleSidebar }
})

function readBool(key) {
  try {
    return localStorage.getItem(key) === 'true'
  } catch {
    return false
  }
}
