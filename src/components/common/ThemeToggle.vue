<script setup>
import { Moon, Sun } from '@lucide/vue'
import { useThemeStore } from '@/stores/theme'

const theme = useThemeStore()
</script>

<template>
  <button
    type="button"
    class="grid size-9 place-items-center rounded-lg text-muted transition-colors hover:bg-surface-muted hover:text-fg"
    :aria-label="theme.isDark ? 'Switch to light theme' : 'Switch to dark theme'"
    :title="theme.isDark ? 'Light theme' : 'Dark theme'"
    @click="theme.toggle()"
  >
    <Sun v-if="theme.isDark" :size="18" aria-hidden="true" />
    <Moon v-else :size="18" aria-hidden="true" />
  </button>
</template>
