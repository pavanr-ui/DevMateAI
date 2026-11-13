<script setup>
/**
 * ErrorState - shown when loading something failed, with an optional retry.
 *
 * <ErrorState message="Couldn't load your history." @retry="load" />
 *
 * Never pass raw technical errors here; show a friendly message.
 */
import { CircleAlert, RefreshCw } from '@lucide/vue'
import AppButton from './AppButton.vue'

defineProps({
  title: { type: String, default: 'Something went wrong' },
  message: { type: String, default: 'Please try again in a moment.' },
  retryable: { type: Boolean, default: true },
})
defineEmits(['retry'])
</script>

<template>
  <div role="alert" class="flex flex-col items-center px-6 py-12 text-center">
    <div
      class="mb-4 grid size-12 place-items-center rounded-2xl bg-danger-soft text-danger"
      aria-hidden="true"
    >
      <CircleAlert :size="22" />
    </div>
    <h3 class="text-base font-semibold text-fg">{{ title }}</h3>
    <p class="mt-1 max-w-sm text-sm text-muted">{{ message }}</p>
    <AppButton
      v-if="retryable"
      variant="secondary"
      size="sm"
      :icon="RefreshCw"
      class="mt-5"
      @click="$emit('retry')"
    >
      Try again
    </AppButton>
  </div>
</template>
