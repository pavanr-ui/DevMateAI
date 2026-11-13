<script setup>
/**
 * Settings (Phase 2 version): profile summary, theme, sign out.
 * Phase 8 adds profile editing, AI model preferences, usage and account deletion.
 */
import { ref } from 'vue'
import { LogOut, Monitor, Moon, Sun } from '@lucide/vue'
import PageContainer from '@/components/common/PageContainer.vue'
import AppCard from '@/components/common/AppCard.vue'
import AppButton from '@/components/common/AppButton.vue'
import UserAvatar from '@/components/common/UserAvatar.vue'
import { useAuthStore } from '@/stores/auth'
import { useThemeStore } from '@/stores/theme'

const auth = useAuthStore()
const theme = useThemeStore()
const signingOut = ref(false)

const themeOptions = [
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
  { value: 'system', label: 'System', icon: Monitor },
]

const providerLabel = { 'google.com': 'Google', password: 'Email and password' }

async function signOut() {
  signingOut.value = true
  try {
    await auth.logout()
  } finally {
    signingOut.value = false
  }
}
</script>

<template>
  <PageContainer title="Settings" description="Manage your profile and preferences." width="md">
    <div class="flex flex-col gap-4">
      <AppCard title="Profile">
        <div class="flex items-center gap-4">
          <UserAvatar :name="auth.displayName" :photo-url="auth.user?.photoURL" size="lg" />
          <div class="min-w-0">
            <p class="truncate font-medium text-fg">{{ auth.displayName }}</p>
            <p class="truncate text-sm text-muted">{{ auth.user?.email }}</p>
            <p class="mt-1 text-xs text-subtle">
              Signed in with {{ providerLabel[auth.user?.providerId] ?? 'email' }}
            </p>
          </div>
        </div>
      </AppCard>

      <AppCard title="Appearance" description="Choose how DevMate AI looks on this device.">
        <div role="radiogroup" aria-label="Theme" class="grid grid-cols-3 gap-2">
          <button
            v-for="option in themeOptions"
            :key="option.value"
            type="button"
            role="radio"
            :aria-checked="theme.mode === option.value"
            :class="[
              'flex flex-col items-center gap-2 rounded-xl border px-3 py-4 text-sm font-medium transition-colors',
              theme.mode === option.value
                ? 'border-primary bg-primary-soft text-primary'
                : 'border-line text-muted hover:border-line-strong hover:text-fg',
            ]"
            @click="theme.setMode(option.value)"
          >
            <component :is="option.icon" :size="20" aria-hidden="true" />
            {{ option.label }}
          </button>
        </div>
      </AppCard>

      <AppCard title="Account">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <p class="text-sm text-muted">Sign out of DevMate AI on this device.</p>
          <AppButton variant="secondary" :icon="LogOut" :loading="signingOut" @click="signOut">
            Sign out
          </AppButton>
        </div>
      </AppCard>
    </div>
  </PageContainer>
</template>
