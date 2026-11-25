<script setup>
/**
 * CodeInput - monospace textarea with a line-number gutter, so AI findings
 * like "line 12" are easy to match. Tab inserts two spaces instead of
 * leaving the field.
 */
import { computed, ref, useId } from 'vue'

const model = defineModel({ type: String, default: '' })
const props = defineProps({
  label: { type: String, required: true },
  placeholder: { type: String, default: '' },
  maxLength: { type: Number, default: 20000 },
  rows: { type: Number, default: 14 },
  error: { type: String, default: '' },
  hint: { type: String, default: '' },
})

const id = useId()
const textarea = ref(null)
const gutter = ref(null)

const lineCount = computed(() => Math.max(1, model.value.split('\n').length))
const tooLong = computed(() => model.value.length > props.maxLength)

function syncScroll() {
  if (gutter.value) gutter.value.scrollTop = textarea.value.scrollTop
}

function onKeydown(event) {
  if (event.key !== 'Tab' || event.shiftKey) return
  event.preventDefault()
  const el = event.target
  const { selectionStart: start, selectionEnd: end } = el
  model.value = `${model.value.slice(0, start)}  ${model.value.slice(end)}`
  requestAnimationFrame(() => el.setSelectionRange(start + 2, start + 2))
}

defineExpose({ focus: () => textarea.value?.focus() })
</script>

<template>
  <div class="flex flex-col gap-1.5">
    <div class="flex items-baseline justify-between gap-2">
      <label :for="id" class="text-sm font-medium text-fg">{{ label }}</label>
      <span :class="['text-xs tabular-nums', tooLong ? 'text-danger' : 'text-subtle']">
        {{ lineCount }} {{ lineCount === 1 ? 'line' : 'lines' }} ·
        {{ model.length.toLocaleString() }} / {{ maxLength.toLocaleString() }}
      </span>
    </div>

    <div
      :class="[
        'flex overflow-hidden rounded-xl border bg-surface shadow-card focus-within:outline-2 focus-within:outline-focus',
        error || tooLong ? 'border-danger' : 'border-line',
      ]"
    >
      <div
        ref="gutter"
        class="code-font shrink-0 overflow-hidden border-r border-line bg-surface-muted px-2 py-3 text-right text-xs leading-6 text-subtle select-none"
        aria-hidden="true"
      >
        <div v-for="n in lineCount" :key="n">{{ n }}</div>
      </div>
      <textarea
        :id="id"
        ref="textarea"
        v-model="model"
        :rows="rows"
        :placeholder="placeholder"
        spellcheck="false"
        autocapitalize="off"
        autocomplete="off"
        wrap="off"
        :aria-invalid="error || tooLong ? 'true' : undefined"
        class="code-font min-h-40 w-full resize-y bg-transparent px-3 py-3 text-xs leading-6 whitespace-pre text-fg placeholder:text-subtle focus:outline-none"
        @scroll="syncScroll"
        @keydown="onKeydown"
      />
    </div>

    <p v-if="error" class="text-sm text-danger">{{ error }}</p>
    <p v-else-if="tooLong" class="text-sm text-danger">
      Please shorten the code to {{ maxLength.toLocaleString() }} characters or fewer.
    </p>
    <p v-else-if="hint" class="text-xs text-subtle">{{ hint }}</p>
  </div>
</template>

<style scoped>
.code-font {
  font-family: var(--font-mono);
  font-variant-ligatures: none;
  tab-size: 2;
}
</style>
