<script setup>
/**
 * CodeBlock - highlighted code with a language label and a copy button.
 * Shows plain code instantly, then swaps in highlighted HTML when ready.
 */
import { onBeforeUnmount, ref, watch } from 'vue'
import { Check, Copy } from '@lucide/vue'
import { highlight } from '@/services/ai/highlighter'
import { useClipboard } from '@/composables/useClipboard'

const props = defineProps({
  code: { type: String, required: true },
  lang: { type: String, default: '' },
  /** True while the AI is still writing this block (highlight less often). */
  streaming: { type: Boolean, default: false },
})

const html = ref('')
const { copy, copied } = useClipboard()
let timer
let requestId = 0

async function run() {
  const id = ++requestId
  try {
    const result = await highlight(props.code, props.lang)
    if (id === requestId) html.value = result ?? ''
  } catch {
    if (id === requestId) html.value = '' // fall back to plain code
  }
}

watch(
  () => [props.code, props.lang, props.streaming],
  () => {
    clearTimeout(timer)
    timer = setTimeout(run, props.streaming ? 250 : 0)
  },
  { immediate: true },
)
onBeforeUnmount(() => clearTimeout(timer))
</script>

<template>
  <figure class="code-block my-3 overflow-hidden rounded-xl border border-line bg-surface-muted">
    <figcaption
      class="flex h-9 items-center justify-between border-b border-line px-3 text-xs text-muted"
    >
      <span class="font-mono">{{ lang || 'text' }}</span>
      <button
        type="button"
        class="inline-flex items-center gap-1.5 rounded-md px-2 py-1 font-medium hover:bg-surface hover:text-fg"
        :aria-label="copied ? 'Copied' : `Copy ${lang || ''} code`"
        @click="copy(code)"
      >
        <Check v-if="copied" :size="14" class="text-success" aria-hidden="true" />
        <Copy v-else :size="14" aria-hidden="true" />
        {{ copied ? 'Copied' : 'Copy' }}
      </button>
    </figcaption>
    <!-- Shiki output is generated from escaped code, so v-html is safe here -->
    <!-- eslint-disable-next-line vue/no-v-html -->
    <div v-if="html" class="code-scroll" v-html="html" />
    <pre v-else class="code-scroll"><code>{{ code }}</code></pre>
  </figure>
</template>
