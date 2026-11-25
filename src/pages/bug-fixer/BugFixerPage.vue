<script setup>
/**
 * AI Bug Fixer: code + error message -> root cause, explanation, fix
 * steps, the fixed code as a diff, and tips to prevent it next time.
 */
import { computed, onMounted, reactive, useId, watch } from 'vue'
import { Bug, Footprints, ShieldCheck, Target } from '@lucide/vue'
import AnalysisWorkspace from '@/components/analysis/AnalysisWorkspace.vue'
import AnalysisOptions from '@/components/analysis/AnalysisOptions.vue'
import PointList from '@/components/analysis/PointList.vue'
import InlineCode from '@/components/common/InlineCode.vue'
import AppButton from '@/components/common/AppButton.vue'
import AppCard from '@/components/common/AppCard.vue'
import AppInput from '@/components/common/AppInput.vue'
import CodeInput from '@/components/code/CodeInput.vue'
import DiffView from '@/components/code/DiffView.vue'
import { useBugFixStore } from '@/stores/analysis'
import { useProjectsStore } from '@/stores/projects'
import { MAX_CODE_CHARS } from '@/utils/codeLanguages'
import { normalizeLang } from '@/utils/markdown'

const store = useBugFixStore()
const projects = useProjectsStore()
onMounted(() => projects.load())

const errorId = useId()
const MAX_ERROR = 4000

const blank = () => ({
  code: '',
  error: '',
  expected: '',
  language: 'auto',
  responseLanguage: 'en',
  projectId: null,
})
const form = reactive(blank())
const resetForm = () => Object.assign(form, blank())

// Opening a saved result (or coming back to this page) shows the code that was analysed.
watch(
  () => store.input,
  (saved) => {
    if (!saved || store.status === 'running') return
    Object.assign(form, {
      code: saved.code ?? '',
      error: saved.error ?? '',
      expected: saved.expected ?? '',
      language: saved.language ?? 'auto',
    })
  },
  { immediate: true },
)

const canSubmit = computed(
  () =>
    form.code.trim() &&
    form.code.length <= MAX_CODE_CHARS &&
    form.error.length <= MAX_ERROR &&
    store.status !== 'running',
)

function submit() {
  if (canSubmit.value) store.run({ ...form })
}

const result = computed(() => store.result)
const originalCode = computed(() => store.input?.code ?? form.code)
const lang = computed(() => normalizeLang(result.value?.language ?? form.language))
</script>

<template>
  <AnalysisWorkspace
    :store="store"
    route-name="bug-fixer"
    :icon="Bug"
    empty-title="Your fix will appear here"
    empty-description="Paste the broken code and the error message. You'll get the root cause, an explanation and the fixed code."
    running-label="Finding the bug…"
    new-label="New fix"
    @retry="submit"
    @new="resetForm"
  >
    <template #form>
      <form class="flex flex-col gap-4" novalidate @submit.prevent="submit">
        <CodeInput
          v-model="form.code"
          label="Broken code"
          :rows="12"
          :max-length="MAX_CODE_CHARS"
          placeholder="Paste the code that isn't working…"
        />

        <div class="flex flex-col gap-1.5">
          <div class="flex items-baseline justify-between">
            <label :for="errorId" class="text-sm font-medium text-fg">
              Error message <span class="font-normal text-subtle">(optional)</span>
            </label>
            <span class="text-xs text-subtle tabular-nums">
              {{ form.error.length }}/{{ MAX_ERROR }}
            </span>
          </div>
          <textarea
            :id="errorId"
            v-model="form.error"
            rows="4"
            :maxlength="MAX_ERROR"
            spellcheck="false"
            placeholder="e.g. TypeError: Cannot read properties of undefined (reading 'map')"
            class="error-font w-full resize-y rounded-xl border border-line bg-surface px-3 py-2.5 text-xs leading-5 text-fg shadow-card placeholder:text-subtle hover:border-line-strong focus:outline-none focus-visible:outline-2"
          />
        </div>

        <AppInput
          v-model="form.expected"
          label="What should happen? (optional)"
          placeholder="e.g. The list of users should appear after loading"
        />

        <AnalysisOptions
          v-model:language="form.language"
          v-model:response-language="form.responseLanguage"
          v-model:project-id="form.projectId"
          :projects="projects.items"
        />

        <AppButton
          type="submit"
          size="lg"
          :icon="Bug"
          :loading="store.status === 'running'"
          :disabled="!canSubmit"
        >
          Find &amp; fix bug
        </AppButton>
      </form>
    </template>

    <template #result>
      <div v-if="result" class="flex flex-col gap-4">
        <AppCard>
          <p class="text-xs font-medium tracking-wide text-subtle uppercase">The bug</p>
          <p class="mt-1 text-base font-semibold text-fg"><InlineCode :text="result.summary" /></p>

          <div class="mt-4 rounded-xl bg-danger-soft p-4">
            <h3 class="flex items-center gap-2 text-sm font-semibold text-fg">
              <Target :size="16" class="text-danger" aria-hidden="true" />
              Root cause
            </h3>
            <p class="mt-1 text-sm text-fg"><InlineCode :text="result.rootCause" /></p>
          </div>

          <p class="mt-4 text-sm whitespace-pre-line text-muted">
            <InlineCode :text="result.explanation" />
          </p>
        </AppCard>

        <AppCard title="How to fix it">
          <div class="flex flex-col gap-5">
            <PointList title="Steps" :items="result.fixSteps" :icon="Footprints" ordered />
            <PointList title="What changed" :items="result.changes" />
          </div>
        </AppCard>

        <AppCard title="Fixed code">
          <DiffView :original="originalCode" :updated="result.fixedCode" :lang="lang" />
        </AppCard>

        <AppCard v-if="result.prevention.length">
          <PointList
            title="Avoid this next time"
            :items="result.prevention"
            :icon="ShieldCheck"
            tone="text-success"
          />
        </AppCard>
      </div>
    </template>
  </AnalysisWorkspace>
</template>

<style scoped>
.error-font {
  font-family: var(--font-mono);
  font-variant-ligatures: none;
}
</style>
