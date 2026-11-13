<script setup>
/**
 * Message box + options (mode, code language, answer language, project).
 *
 * Keyboard: Enter sends, Shift+Enter adds a new line (on touch devices
 * Enter adds a new line; use the send button).
 */
import { computed, nextTick, ref, watch } from 'vue'
import { ArrowUp, Square } from '@lucide/vue'

const model = defineModel({ type: String, default: '' })
const settings = defineModel('settings', { type: Object, required: true })

const props = defineProps({
  sending: { type: Boolean, default: false },
  projects: { type: Array, default: () => [] },
  maxLength: { type: Number, default: 12000 },
})
const emit = defineEmits(['send', 'stop'])

const textarea = ref(null)
const isTouch = typeof window !== 'undefined' && window.matchMedia?.('(pointer: coarse)').matches

const modes = [
  { value: 'chat', label: 'Chat' },
  { value: 'generate', label: 'Generate' },
  { value: 'explain', label: 'Explain' },
  { value: 'optimize', label: 'Optimize' },
]

const languages = [
  ['auto', 'Any language'],
  ['javascript', 'JavaScript'],
  ['typescript', 'TypeScript'],
  ['vue', 'Vue 3'],
  ['html', 'HTML'],
  ['css', 'CSS'],
  ['json', 'JSON'],
  ['python', 'Python'],
  ['java', 'Java'],
  ['kotlin', 'Kotlin'],
  ['swift', 'Swift'],
  ['csharp', 'C#'],
  ['cpp', 'C++'],
  ['go', 'Go'],
  ['rust', 'Rust'],
  ['php', 'PHP'],
  ['sql', 'SQL'],
  ['bash', 'Bash'],
]

const placeholders = {
  chat: 'Ask anything about code…',
  generate: 'Describe the code you need…',
  explain: 'Paste code or name a concept…',
  optimize: 'Paste code to improve…',
}

const tooLong = computed(() => model.value.length > props.maxLength)
const nearLimit = computed(() => model.value.length > props.maxLength * 0.8)
const canSend = computed(() => model.value.trim() && !tooLong.value && !props.sending)

function autoGrow() {
  const el = textarea.value
  if (!el) return
  el.style.height = 'auto'
  el.style.height = `${Math.min(el.scrollHeight, 240)}px`
}
watch(model, () => nextTick(autoGrow))

function onKeydown(event) {
  if (event.key === 'Enter' && !event.shiftKey && !isTouch && !event.isComposing) {
    event.preventDefault()
    submit()
  }
}

function submit() {
  if (canSend.value) emit('send')
}

defineExpose({ focus: () => textarea.value?.focus() })

const selectClass =
  'h-8 shrink-0 rounded-lg border border-line bg-surface px-2 text-xs text-fg hover:border-line-strong'
</script>

<template>
  <form
    class="rounded-2xl border border-line bg-surface shadow-raised focus-within:border-line-strong"
    @submit.prevent="submit"
  >
    <label for="chat-input" class="sr-only">Message DevMate AI</label>
    <textarea
      id="chat-input"
      ref="textarea"
      v-model="model"
      rows="1"
      :placeholder="placeholders[settings.mode]"
      :aria-invalid="tooLong || undefined"
      aria-describedby="chat-input-help"
      class="block max-h-60 w-full resize-none bg-transparent px-4 pt-3.5 pb-2 text-[0.9375rem] text-fg placeholder:text-subtle focus:outline-none"
      @keydown="onKeydown"
    />

    <div class="flex items-center gap-2 px-3 pb-3">
      <!-- Options: one row that scrolls sideways on small screens -->
      <div class="no-scrollbar -my-1 flex min-w-0 flex-1 items-center gap-2 overflow-x-auto py-1">
        <!-- Mode -->
        <div
          role="radiogroup"
          aria-label="Mode"
          class="flex shrink-0 rounded-lg bg-surface-muted p-0.5"
        >
          <button
            v-for="m in modes"
            :key="m.value"
            type="button"
            role="radio"
            :aria-checked="settings.mode === m.value"
            :class="[
              'rounded-md px-2.5 py-1 text-xs font-medium transition-colors',
              settings.mode === m.value
                ? 'bg-surface text-fg shadow-card'
                : 'text-muted hover:text-fg',
            ]"
            @click="settings.mode = m.value"
          >
            {{ m.label }}
          </button>
        </div>

        <label class="sr-only" for="chat-language">Code language</label>
        <select id="chat-language" v-model="settings.language" :class="selectClass">
          <option v-for="[value, label] in languages" :key="value" :value="value">
            {{ label }}
          </option>
        </select>

        <label class="sr-only" for="chat-response-language">Answer language</label>
        <select
          id="chat-response-language"
          v-model="settings.responseLanguage"
          :class="selectClass"
        >
          <option value="en">English</option>
          <option value="te">తెలుగు (Telugu)</option>
        </select>

        <template v-if="projects.length">
          <label class="sr-only" for="chat-project">Project context</label>
          <select id="chat-project" v-model="settings.projectId" :class="[selectClass, 'max-w-40']">
            <option :value="null">No project</option>
            <option v-for="p in projects" :key="p.id" :value="p.id">{{ p.name }}</option>
          </select>
        </template>
      </div>

      <div class="flex shrink-0 items-center gap-2">
        <span
          v-if="nearLimit"
          id="chat-input-help"
          :class="['text-xs tabular-nums', tooLong ? 'text-danger' : 'text-subtle']"
        >
          {{ model.length.toLocaleString() }} / {{ maxLength.toLocaleString() }}
        </span>
        <span v-else id="chat-input-help" class="sr-only">
          {{
            isTouch ? 'Use the send button to send.' : 'Enter to send, Shift+Enter for a new line.'
          }}
        </span>

        <button
          v-if="sending"
          type="button"
          class="grid size-9 place-items-center rounded-xl bg-fg text-bg hover:opacity-90"
          aria-label="Stop generating"
          @click="emit('stop')"
        >
          <Square :size="14" fill="currentColor" aria-hidden="true" />
        </button>
        <button
          v-else
          type="submit"
          class="grid size-9 place-items-center rounded-xl bg-primary text-on-primary hover:bg-primary-hover disabled:opacity-40"
          :disabled="!canSend"
          aria-label="Send message"
        >
          <ArrowUp :size="18" aria-hidden="true" />
        </button>
      </div>
    </div>
  </form>
</template>
