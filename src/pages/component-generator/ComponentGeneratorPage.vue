<script setup>
/**
 * Vue Component Generator: describe a component (or composable) and get
 * Vue 3 <script setup> code, its props / emits / slots, a usage example,
 * an explanation and the accessibility features included.
 */
import { computed, onMounted, reactive, useId, watch } from 'vue'
import { Accessibility, Component, Sparkles } from '@lucide/vue'
import AnalysisWorkspace from '@/components/analysis/AnalysisWorkspace.vue'
import PointList from '@/components/analysis/PointList.vue'
import AppButton from '@/components/common/AppButton.vue'
import AppCard from '@/components/common/AppCard.vue'
import AppInput from '@/components/common/AppInput.vue'
import AppTextarea from '@/components/common/AppTextarea.vue'
import InlineCode from '@/components/common/InlineCode.vue'
import CodeBlock from '@/components/code/CodeBlock.vue'
import { useComponentStore } from '@/stores/analysis'
import { useProjectsStore } from '@/stores/projects'
import { RESPONSE_LANGUAGES } from '@/utils/codeLanguages'

const store = useComponentStore()
const projects = useProjectsStore()
onMounted(() => projects.load())

const ids = { styling: useId(), answer: useId(), project: useId() }
const MAX_DESCRIPTION = 2000

const KINDS = [
  { value: 'component', label: 'Component', hint: 'A .vue file' },
  { value: 'composable', label: 'Composable', hint: 'A useXxx() .js file' },
]
const STYLING = [
  ['tailwind', 'Tailwind CSS'],
  ['scoped-css', 'Scoped CSS'],
  ['none', 'No styling'],
]
const STARTERS = [
  {
    kind: 'component',
    text: 'A modal dialog with a title, close button, Esc to close, focus trap and a footer slot for actions.',
  },
  {
    kind: 'component',
    text: 'A searchable dropdown (combobox) that supports v-model, keyboard navigation and an empty state.',
  },
  {
    kind: 'component',
    text: 'A data table with sortable columns, pagination and a loading skeleton.',
  },
  {
    kind: 'composable',
    text: 'A composable that fetches JSON from a URL with loading, error, refresh and abort on unmount.',
  },
]

const blank = () => ({
  description: '',
  kind: 'component',
  name: '',
  styling: 'tailwind',
  responseLanguage: 'en',
  projectId: null,
})
const form = reactive(blank())
const resetForm = () => Object.assign(form, blank())

// Opening a saved result (or returning to the page) shows what was asked.
watch(
  () => store.input,
  (saved) => {
    if (!saved || store.status === 'running') return
    Object.assign(form, {
      description: saved.description ?? saved.code ?? '',
      kind: saved.kind ?? 'component',
      name: saved.name ?? '',
      styling: saved.styling ?? 'tailwind',
    })
  },
  { immediate: true },
)

const nameError = computed(() =>
  form.name && !/^[A-Za-z][A-Za-z0-9]{0,59}$/.test(form.name)
    ? 'Use letters and numbers only, e.g. UserCard or useFetch.'
    : '',
)
const canSubmit = computed(
  () =>
    form.description.trim().length >= 10 &&
    form.description.length <= MAX_DESCRIPTION &&
    !nameError.value &&
    store.status !== 'running',
)

function submit() {
  if (canSubmit.value) store.run({ ...form })
}

function useStarter(starter) {
  form.kind = starter.kind
  form.description = starter.text
}

const result = computed(() => store.result)
/** The AI sometimes writes "null" / "none" as text for "no value". */
const hasValue = (v) =>
  v != null && !['', 'null', 'none', 'undefined', 'void'].includes(String(v).trim().toLowerCase())
const langOf = (file) => (file.language === 'javascript' ? 'javascript' : file.language)
const selectClass =
  'h-10 w-full rounded-lg border border-line bg-surface px-3 text-sm text-fg shadow-card hover:border-line-strong'
</script>

<template>
  <AnalysisWorkspace
    :store="store"
    route-name="component-generator"
    :icon="Component"
    empty-title="Your component will appear here"
    empty-description="Describe what you need. You'll get Vue 3 code with props, events, a usage example and an explanation."
    running-label="Writing your component…"
    new-label="New component"
    @retry="submit"
    @new="resetForm"
  >
    <template #form>
      <form class="flex flex-col gap-4" novalidate @submit.prevent="submit">
        <div role="radiogroup" aria-label="What to generate" class="grid grid-cols-2 gap-2">
          <button
            v-for="k in KINDS"
            :key="k.value"
            type="button"
            role="radio"
            :aria-checked="form.kind === k.value"
            :class="[
              'rounded-xl border px-3 py-2.5 text-left transition-colors',
              form.kind === k.value
                ? 'border-primary bg-primary-soft'
                : 'border-line hover:border-line-strong',
            ]"
            @click="form.kind = k.value"
          >
            <span
              :class="[
                'block text-sm font-medium',
                form.kind === k.value ? 'text-primary' : 'text-fg',
              ]"
            >
              {{ k.label }}
            </span>
            <span class="block text-xs text-subtle">{{ k.hint }}</span>
          </button>
        </div>

        <AppTextarea
          v-model="form.description"
          label="Describe it"
          :rows="5"
          :maxlength="MAX_DESCRIPTION"
          placeholder="What should it do? Which props, events and states does it need?"
          hint="Mention behaviour, props, events, states and accessibility needs."
        />

        <div>
          <p class="mb-1.5 text-xs text-subtle">Or start from an example:</p>
          <div class="flex flex-wrap gap-1.5">
            <button
              v-for="s in STARTERS"
              :key="s.text"
              type="button"
              class="inline-flex items-center gap-1 rounded-full border border-line px-2.5 py-1 text-xs text-muted hover:border-line-strong hover:text-fg"
              @click="useStarter(s)"
            >
              <Sparkles :size="12" class="text-primary" aria-hidden="true" />
              {{ s.text.split(' ').slice(1, 4).join(' ') }}
            </button>
          </div>
        </div>

        <div class="grid gap-3 sm:grid-cols-2">
          <AppInput
            v-model="form.name"
            label="Name (optional)"
            :placeholder="form.kind === 'composable' ? 'useFetch' : 'UserCard'"
            :error="nameError"
          />
          <div v-if="form.kind === 'component'" class="flex flex-col gap-1.5">
            <label :for="ids.styling" class="text-sm font-medium text-fg">Styling</label>
            <select :id="ids.styling" v-model="form.styling" :class="selectClass">
              <option v-for="[value, label] in STYLING" :key="value" :value="value">
                {{ label }}
              </option>
            </select>
          </div>
          <div class="flex flex-col gap-1.5">
            <label :for="ids.answer" class="text-sm font-medium text-fg">Explain in</label>
            <select :id="ids.answer" v-model="form.responseLanguage" :class="selectClass">
              <option v-for="[value, label] in RESPONSE_LANGUAGES" :key="value" :value="value">
                {{ label }}
              </option>
            </select>
          </div>
          <div class="flex flex-col gap-1.5">
            <label :for="ids.project" class="text-sm font-medium text-fg">Project</label>
            <select :id="ids.project" v-model="form.projectId" :class="selectClass">
              <option :value="null">None</option>
              <option v-for="p in projects.items" :key="p.id" :value="p.id">{{ p.name }}</option>
            </select>
          </div>
        </div>

        <AppButton
          type="submit"
          size="lg"
          :icon="Sparkles"
          :loading="store.status === 'running'"
          :disabled="!canSubmit"
        >
          Generate {{ form.kind }}
        </AppButton>
      </form>
    </template>

    <template #result>
      <div v-if="result" class="flex flex-col gap-4">
        <AppCard>
          <div class="flex flex-wrap items-center gap-2">
            <h2 class="font-mono text-lg font-semibold text-fg">{{ result.name }}</h2>
            <span class="rounded-md bg-primary-soft px-2 py-0.5 text-xs font-medium text-primary">
              {{ result.kind === 'composable' ? 'Composable' : 'Component' }}
            </span>
          </div>
          <p class="mt-2 text-sm text-muted"><InlineCode :text="result.summary" /></p>
        </AppCard>

        <AppCard :title="result.files.length > 1 ? 'Files' : 'Code'">
          <CodeBlock
            v-for="file in result.files"
            :key="file.filename"
            :code="file.code"
            :lang="langOf(file)"
            :title="file.filename"
          />
        </AppCard>

        <AppCard v-if="result.props.length" title="Props">
          <div class="overflow-x-auto">
            <table class="w-full text-left text-sm">
              <thead class="border-b border-line text-xs text-subtle">
                <tr>
                  <th scope="col" class="py-2 pr-4 font-medium">Name</th>
                  <th scope="col" class="py-2 pr-4 font-medium">Type</th>
                  <th scope="col" class="py-2 pr-4 font-medium">Default</th>
                  <th scope="col" class="py-2 font-medium">Description</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="p in result.props"
                  :key="p.name"
                  class="border-b border-line last:border-0"
                >
                  <th scope="row" class="py-2 pr-4 align-top font-mono text-xs font-medium text-fg">
                    {{ p.name
                    }}<span v-if="p.required" class="text-danger" title="Required"> *</span>
                  </th>
                  <td class="py-2 pr-4 align-top font-mono text-xs text-muted">{{ p.type }}</td>
                  <td class="py-2 pr-4 align-top font-mono text-xs text-muted">
                    {{ hasValue(p.default) ? p.default : '—' }}
                  </td>
                  <td class="py-2 align-top text-muted"><InlineCode :text="p.description" /></td>
                </tr>
              </tbody>
            </table>
          </div>
          <p class="mt-2 text-xs text-subtle"><span class="text-danger">*</span> required</p>
        </AppCard>

        <AppCard v-if="result.emits.length || result.slots.length" title="Events and slots">
          <dl class="flex flex-col gap-3 text-sm">
            <div v-for="e in result.emits" :key="`e-${e.name}`">
              <dt class="font-mono text-xs font-medium text-fg">
                @{{ e.name }}
                <span v-if="hasValue(e.payload)" class="text-subtle">({{ e.payload }})</span>
              </dt>
              <dd class="text-muted"><InlineCode :text="e.description" /></dd>
            </div>
            <div v-for="s in result.slots" :key="`s-${s.name}`">
              <dt class="font-mono text-xs font-medium text-fg">#{{ s.name }} slot</dt>
              <dd class="text-muted"><InlineCode :text="s.description" /></dd>
            </div>
          </dl>
        </AppCard>

        <AppCard v-if="result.usage" title="How to use it">
          <CodeBlock :code="result.usage" lang="vue" title="Usage" />
        </AppCard>

        <AppCard title="How it works">
          <p class="text-sm whitespace-pre-line text-muted">
            <InlineCode :text="result.explanation" />
          </p>
          <PointList
            class="mt-5"
            title="Accessibility"
            :items="result.accessibility"
            :icon="Accessibility"
            tone="text-success"
          />
        </AppCard>
      </div>
    </template>
  </AnalysisWorkspace>
</template>
