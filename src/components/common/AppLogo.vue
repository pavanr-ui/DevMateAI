<script setup>
/**
 * AppLogo - DevMate AI mark, optionally with the wordmark.
 */
import { CodeXml } from '@lucide/vue'

defineProps({
  showText: { type: Boolean, default: true },
  size: { type: String, default: 'md', validator: (v) => ['sm', 'md', 'lg'].includes(v) },
})

const box = { sm: 'size-8 rounded-lg', md: 'size-9 rounded-xl', lg: 'size-12 rounded-2xl' }
const icon = { sm: 16, md: 18, lg: 24 }
</script>

<template>
  <span class="inline-flex items-center gap-2.5">
    <span
      :class="[
        'grid shrink-0 place-items-center bg-primary text-on-primary shadow-card',
        box[size],
      ]"
      aria-hidden="true"
    >
      <CodeXml :size="icon[size]" :stroke-width="2.25" />
    </span>
    <span v-if="showText" class="text-base font-semibold tracking-tight text-fg">
      DevMate <span class="text-primary">AI</span>
    </span>
    <span v-else class="sr-only">DevMate AI</span>
  </span>
</template>
