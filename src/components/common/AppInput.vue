<script setup>
/**
 * AppInput - labelled text input with hint, error and password toggle.
 *
 * <AppInput v-model="email" label="Email" type="email" autocomplete="email" :error="errors.email" />
 *
 * Accessibility: the label is always linked to the input, errors are
 * announced via aria-describedby + aria-invalid.
 */
import { computed, ref, useId } from 'vue'
import { Eye, EyeOff } from '@lucide/vue'

const model = defineModel({ type: String, default: '' })

const props = defineProps({
  label: { type: String, required: true },
  type: { type: String, default: 'text' },
  placeholder: { type: String, default: '' },
  hint: { type: String, default: '' },
  error: { type: String, default: '' },
  icon: { type: [Object, Function], default: null },
  autocomplete: { type: String, default: 'off' },
  required: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
})

const id = useId()
const hintId = `${id}-hint`
const errorId = `${id}-error`

const showPassword = ref(false)
const isPassword = computed(() => props.type === 'password')
const inputType = computed(() => (isPassword.value && showPassword.value ? 'text' : props.type))

const describedBy = computed(
  () => [props.error && errorId, props.hint && hintId].filter(Boolean).join(' ') || undefined,
)
</script>

<template>
  <div class="flex flex-col gap-1.5">
    <label :for="id" class="text-sm font-medium text-fg">
      {{ label }}
      <span v-if="required" class="text-danger" aria-hidden="true">*</span>
    </label>

    <div class="relative">
      <component
        :is="icon"
        v-if="icon"
        :size="16"
        class="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-subtle"
        aria-hidden="true"
      />
      <input
        :id="id"
        v-model="model"
        :type="inputType"
        :placeholder="placeholder"
        :autocomplete="autocomplete"
        :required="required"
        :disabled="disabled"
        :aria-invalid="error ? 'true' : undefined"
        :aria-describedby="describedBy"
        :class="[
          'h-11 w-full rounded-lg border bg-surface text-sm text-fg shadow-card transition-colors',
          'placeholder:text-subtle focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-0',
          'disabled:cursor-not-allowed disabled:opacity-60',
          error ? 'border-danger' : 'border-line hover:border-line-strong',
          icon ? 'pl-9' : 'pl-3',
          isPassword ? 'pr-11' : 'pr-3',
        ]"
      />
      <button
        v-if="isPassword"
        type="button"
        class="absolute top-1/2 right-1.5 grid size-8 -translate-y-1/2 place-items-center rounded-md text-subtle hover:text-fg"
        :aria-label="showPassword ? 'Hide password' : 'Show password'"
        :aria-pressed="showPassword"
        @click="showPassword = !showPassword"
      >
        <EyeOff v-if="showPassword" :size="16" aria-hidden="true" />
        <Eye v-else :size="16" aria-hidden="true" />
      </button>
    </div>

    <p v-if="error" :id="errorId" class="text-sm text-danger">{{ error }}</p>
    <p v-else-if="hint" :id="hintId" class="text-xs text-subtle">{{ hint }}</p>
  </div>
</template>
