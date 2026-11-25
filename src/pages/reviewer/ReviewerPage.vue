<script setup>
/**
 * AI Code Reviewer: paste code -> score, issues by severity, strengths,
 * and the corrected code as a diff.
 */
import { computed, onMounted, reactive, watch } from 'vue'
import { ScanSearch, ThumbsUp } from '@lucide/vue'
import AnalysisWorkspace from '@/components/analysis/AnalysisWorkspace.vue'
import AnalysisOptions from '@/components/analysis/AnalysisOptions.vue'
import IssueList from '@/components/analysis/IssueList.vue'
import PointList from '@/components/analysis/PointList.vue'
import InlineCode from '@/components/common/InlineCode.vue'
import ScoreBadge from '@/components/analysis/ScoreBadge.vue'
import AppButton from '@/components/common/AppButton.vue'
import AppCard from '@/components/common/AppCard.vue'
import CodeInput from '@/components/code/CodeInput.vue'
import DiffView from '@/components/code/DiffView.vue'
import { useReviewStore } from '@/stores/analysis'
import { useProjectsStore } from '@/stores/projects'
import { MAX_CODE_CHARS } from '@/utils/codeLanguages'
import { normalizeLang } from '@/utils/markdown'

const store = useReviewStore()
const projects = useProjectsStore()
onMounted(() => projects.load())

const FOCUS = [
  { id: 'bugs', label: 'Bugs' },
  { id: 'security', label: 'Security' },
  { id: 'performance', label: 'Performance' },
  { id: 'quality', label: 'Code quality' },
]

const blank = () => ({
  code: '',
  language: 'auto',
  responseLanguage: 'en',
  projectId: null,
  focus: FOCUS.map((f) => f.id),
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
      language: saved.language ?? 'auto',
      focus: saved.focus?.length ? saved.focus : form.focus,
    })
  },
  { immediate: true },
)

const canSubmit = computed(
  () =>
    form.code.trim() &&
    form.code.length <= MAX_CODE_CHARS &&
    form.focus.length &&
    store.status !== 'running',
)

function submit() {
  if (canSubmit.value) store.run({ ...form, focus: [...form.focus] })
}

const result = computed(() => store.result)
const originalCode = computed(() => store.input?.code ?? form.code)
const lang = computed(() => normalizeLang(result.value?.language ?? form.language))
</script>

<template>
  <AnalysisWorkspace
    :store="store"
    route-name="reviewer"
    :icon="ScanSearch"
    empty-title="Your review will appear here"
    empty-description="Paste code on the left and get a score, issues sorted by severity and a corrected version."
    running-label="Reviewing your code…"
    new-label="New review"
    @retry="submit"
    @new="resetForm"
  >
    <template #form>
      <form class="flex flex-col gap-4" novalidate @submit.prevent="submit">
        <CodeInput
          v-model="form.code"
          label="Code to review"
          :max-length="MAX_CODE_CHARS"
          placeholder="Paste a function, component or file…"
        />

        <fieldset>
          <legend class="mb-1.5 text-sm font-medium text-fg">Check for</legend>
          <div class="flex flex-wrap gap-2">
            <label
              v-for="f in FOCUS"
              :key="f.id"
              :class="[
                'flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-1.5 text-sm transition-colors',
                form.focus.includes(f.id)
                  ? 'border-primary bg-primary-soft text-primary'
                  : 'border-line text-muted hover:text-fg',
              ]"
            >
              <input v-model="form.focus" type="checkbox" :value="f.id" class="accent-primary" />
              {{ f.label }}
            </label>
          </div>
          <p v-if="!form.focus.length" class="mt-1.5 text-sm text-danger">
            Pick at least one area.
          </p>
        </fieldset>

        <AnalysisOptions
          v-model:language="form.language"
          v-model:response-language="form.responseLanguage"
          v-model:project-id="form.projectId"
          :projects="projects.items"
        />

        <AppButton
          type="submit"
          size="lg"
          :icon="ScanSearch"
          :loading="store.status === 'running'"
          :disabled="!canSubmit"
        >
          Review code
        </AppButton>
      </form>
    </template>

    <template #result>
      <div v-if="result" class="flex flex-col gap-4">
        <AppCard>
          <div class="flex flex-wrap items-center gap-5">
            <ScoreBadge :score="result.score" />
            <p class="min-w-60 flex-1 text-sm text-muted"><InlineCode :text="result.summary" /></p>
          </div>
        </AppCard>

        <AppCard
          :title="result.issues.length ? `Issues (${result.issues.length})` : 'No issues found'"
          :description="
            result.issues.length ? 'Most severe first.' : 'Nothing to fix in the selected areas.'
          "
        >
          <IssueList v-if="result.issues.length" :issues="result.issues" />
          <PointList
            :class="result.issues.length ? 'mt-5' : ''"
            title="What's good"
            :items="result.strengths"
            :icon="ThumbsUp"
            tone="text-success"
          />
        </AppCard>

        <AppCard title="Corrected code">
          <DiffView :original="originalCode" :updated="result.correctedCode" :lang="lang" />
        </AppCard>
      </div>
    </template>
  </AnalysisWorkspace>
</template>
