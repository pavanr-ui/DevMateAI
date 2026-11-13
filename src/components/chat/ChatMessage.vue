<script setup>
/**
 * One chat message. User: plain text bubble. AI: rendered markdown,
 * a typing indicator while waiting, and copy / retry actions.
 */
import { CircleAlert, Check, Copy, RefreshCw, Square } from '@lucide/vue'
import AppLogo from '@/components/common/AppLogo.vue'
import MarkdownContent from './MarkdownContent.vue'
import { useClipboard } from '@/composables/useClipboard'

defineProps({
  message: { type: Object, required: true },
  canRetry: { type: Boolean, default: false },
})
defineEmits(['retry'])

const { copy, copied } = useClipboard()
</script>

<template>
  <!-- User -->
  <div v-if="message.role === 'user'" class="flex justify-end">
    <div
      class="max-w-[85%] rounded-2xl rounded-br-md bg-primary-soft px-4 py-2.5 text-[0.9375rem] leading-relaxed whitespace-pre-wrap text-fg sm:max-w-[75%]"
    >
      <span class="sr-only">You said:</span>
      {{ message.content }}
    </div>
  </div>

  <!-- AI -->
  <div v-else class="flex gap-3">
    <AppLogo :show-text="false" size="sm" class="mt-0.5 shrink-0" />
    <div class="min-w-0 flex-1">
      <span class="sr-only">DevMate AI said:</span>

      <!-- Waiting for the first words -->
      <div
        v-if="message.status === 'streaming' && !message.content"
        class="flex h-8 items-center gap-1"
        role="status"
        aria-label="DevMate AI is thinking"
      >
        <span v-for="n in 3" :key="n" class="typing-dot size-1.5 rounded-full bg-subtle" />
      </div>

      <MarkdownContent
        v-if="message.content"
        :content="message.content"
        :streaming="message.status === 'streaming'"
      />

      <!-- Error -->
      <div
        v-if="message.status === 'error'"
        role="alert"
        class="mt-1 flex flex-wrap items-center gap-3 rounded-xl bg-danger-soft px-4 py-3 text-sm"
      >
        <CircleAlert :size="16" class="shrink-0 text-danger" aria-hidden="true" />
        <span class="flex-1 text-fg">{{ message.error }}</span>
        <button
          v-if="canRetry"
          type="button"
          class="inline-flex items-center gap-1.5 font-medium text-danger hover:underline"
          @click="$emit('retry')"
        >
          <RefreshCw :size="14" aria-hidden="true" /> Retry
        </button>
      </div>

      <!-- Actions -->
      <div
        v-if="message.content && message.status !== 'streaming'"
        class="mt-1 flex items-center gap-1 text-xs text-subtle"
      >
        <button
          type="button"
          class="inline-flex items-center gap-1.5 rounded-md px-2 py-1 hover:bg-surface-muted hover:text-fg"
          @click="copy(message.content)"
        >
          <Check v-if="copied" :size="13" class="text-success" aria-hidden="true" />
          <Copy v-else :size="13" aria-hidden="true" />
          {{ copied ? 'Copied' : 'Copy answer' }}
        </button>
        <span v-if="message.status === 'stopped'" class="inline-flex items-center gap-1 px-2">
          <Square :size="11" aria-hidden="true" /> Stopped
        </span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.typing-dot {
  animation: typing 1.2s infinite ease-in-out;
}
.typing-dot:nth-child(2) {
  animation-delay: 0.15s;
}
.typing-dot:nth-child(3) {
  animation-delay: 0.3s;
}
@keyframes typing {
  0%,
  60%,
  100% {
    opacity: 0.3;
    transform: translateY(0);
  }
  30% {
    opacity: 1;
    transform: translateY(-3px);
  }
}
</style>
