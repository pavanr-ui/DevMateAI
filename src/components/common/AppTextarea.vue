<script setup>
/**
 * AppTextarea - labelled multi-line input with hint, error and character count.
 */
import { computed, useId } from 'vue'

const model = defineModel({ type: String, default: '' })

const props = defineProps({
  label: { type: String, required: true },
  placeholder: { type: String, default: '' },
  hint: { type: String, default: '' },
  error: { type: String, default: '' },
  rows: { type: Number, default: 3 },
  maxlength: { type: Number, default: null },
})

const id = useId()
const hintId = `${id}-hint`
const errorId = `${id}-error`
const describedBy = computed(
  () => [props.error && errorId, props.hint && hintId].filter(Boolean).join(' ') || undefined,
)
</script>

<template>
  <div class="flex flex-col gap-1.5">
    <div class="flex items-baseline justify-between gap-2">
      <label :for="id" class="text-sm font-medium text-fg">{{ label }}</label>
      <span v-if="maxlength" class="text-xs text-subtle tabular-nums" aria-hidden="true">
        {{ model.length }}/{{ maxlength }}
      </span>
    </div>
    <textarea
      :id="id"
      v-model="model"
      :rows="rows"
      :placeholder="placeholder"
      :maxlength="maxlength ?? undefined"
      :aria-invalid="error ? 'true' : undefined"
      :aria-describedby="describedBy"
      :class="[
        'w-full resize-y rounded-lg border bg-surface px-3 py-2.5 text-sm text-fg shadow-card',
        'placeholder:text-subtle focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-0',
        error ? 'border-danger' : 'border-line hover:border-line-strong',
      ]"
    />
    <p v-if="error" :id="errorId" class="text-sm text-danger">{{ error }}</p>
    <p v-else-if="hint" :id="hintId" class="text-xs text-subtle">{{ hint }}</p>
  </div>
</template>
