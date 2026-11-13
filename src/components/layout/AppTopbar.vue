<script setup>
/**
 * Top bar. Desktop: page title + actions. Mobile: logo + actions
 * (respecting the phone's notch / status bar via safe-area insets).
 */
import { computed } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import AppLogo from '@/components/common/AppLogo.vue'
import ThemeToggle from '@/components/common/ThemeToggle.vue'
import UserAvatar from '@/components/common/UserAvatar.vue'
import { useAuthStore } from '@/stores/auth'

const route = useRoute()
const auth = useAuthStore()
const title = computed(() => route.meta.title ?? '')
</script>

<template>
  <header
    class="shrink-0 border-b border-line bg-surface/80 pt-[env(safe-area-inset-top)] backdrop-blur lg:bg-bg"
  >
    <div class="flex h-14 items-center gap-3 px-4 lg:h-16 lg:px-8">
      <!-- Mobile: logo -->
      <RouterLink :to="{ name: 'dashboard' }" class="rounded-lg lg:hidden">
        <AppLogo size="sm" />
      </RouterLink>

      <!-- Desktop: page title -->
      <h1 class="hidden truncate text-lg font-semibold text-fg lg:block">{{ title }}</h1>

      <div class="ml-auto flex items-center gap-1">
        <ThemeToggle />
        <RouterLink
          :to="{ name: 'settings' }"
          class="ml-1 rounded-full lg:hidden"
          aria-label="Profile and settings"
        >
          <UserAvatar :name="auth.displayName" :photo-url="auth.user?.photoURL" size="sm" />
        </RouterLink>
      </div>
    </div>
  </header>
</template>
