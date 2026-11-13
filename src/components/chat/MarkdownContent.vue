<script setup>
/**
 * Renders AI markdown: sanitized HTML for text, <CodeBlock> for code.
 */
import { computed } from 'vue'
import CodeBlock from '@/components/code/CodeBlock.vue'
import { splitMarkdown } from '@/utils/markdown'

const props = defineProps({
  content: { type: String, required: true },
  streaming: { type: Boolean, default: false },
})

const segments = computed(() => splitMarkdown(props.content))
</script>

<template>
  <div class="markdown">
    <template v-for="(segment, i) in segments" :key="i">
      <CodeBlock
        v-if="segment.type === 'code'"
        :code="segment.code"
        :lang="segment.lang"
        :streaming="streaming && i === segments.length - 1"
      />
      <!-- Sanitized by DOMPurify in splitMarkdown() -->
      <!-- eslint-disable-next-line vue/no-v-html -->
      <div v-else v-html="segment.html" />
    </template>
  </div>
</template>
