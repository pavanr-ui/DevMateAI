<script setup>
/**
 * InlineCode - shows text where `backticked` parts become <code>.
 * Renders with Vue text nodes only (no v-html), so AI text can never inject HTML.
 */
import { computed } from 'vue'

const props = defineProps({
  text: { type: String, default: '' },
})

const parts = computed(() =>
  props.text
    .split(/(`[^`\n]+`)/)
    .filter(Boolean)
    .map((part) =>
      part.length > 2 && part.startsWith('`') && part.endsWith('`')
        ? { code: true, value: part.slice(1, -1) }
        : { code: false, value: part },
    ),
)
</script>

<template>
  <template v-for="(part, i) in parts" :key="i">
    <code
      v-if="part.code"
      class="rounded border border-line bg-surface-muted px-1 py-px font-mono text-[0.85em] text-fg [font-variant-ligatures:none]"
      >{{ part.value }}</code
    >
    <template v-else>{{ part.value }}</template>
  </template>
</template>
