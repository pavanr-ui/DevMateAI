<script setup>
/**
 * IssueList - review findings, filterable by severity.
 * Severity is shown as an icon + word (never color alone).
 */
import { computed, ref } from 'vue'
import { CircleAlert, Info, OctagonAlert, TriangleAlert, Lightbulb } from '@lucide/vue'
import InlineCode from '@/components/common/InlineCode.vue'

const props = defineProps({
  issues: { type: Array, required: true },
})

const SEVERITIES = [
  {
    id: 'critical',
    label: 'Critical',
    icon: OctagonAlert,
    tone: 'text-danger',
    bg: 'bg-danger-soft',
  },
  { id: 'high', label: 'High', icon: CircleAlert, tone: 'text-danger', bg: 'bg-danger-soft' },
  {
    id: 'medium',
    label: 'Medium',
    icon: TriangleAlert,
    tone: 'text-warning',
    bg: 'bg-warning-soft',
  },
  { id: 'low', label: 'Low', icon: Info, tone: 'text-info', bg: 'bg-info-soft' },
]
const bySeverity = Object.fromEntries(SEVERITIES.map((s) => [s.id, s]))

const CATEGORY_LABELS = {
  bug: 'Bug',
  security: 'Security',
  performance: 'Performance',
  quality: 'Code quality',
  style: 'Style',
}

const filter = ref('all')
const counts = computed(() =>
  Object.fromEntries(
    SEVERITIES.map((s) => [s.id, props.issues.filter((i) => i.severity === s.id).length]),
  ),
)
const visible = computed(() =>
  filter.value === 'all' ? props.issues : props.issues.filter((i) => i.severity === filter.value),
)
</script>

<template>
  <div>
    <div role="radiogroup" aria-label="Filter by severity" class="mb-3 flex flex-wrap gap-1.5">
      <button
        type="button"
        role="radio"
        :aria-checked="filter === 'all'"
        :class="[
          'rounded-full border px-3 py-1 text-xs font-medium',
          filter === 'all'
            ? 'border-primary bg-primary-soft text-primary'
            : 'border-line text-muted hover:text-fg',
        ]"
        @click="filter = 'all'"
      >
        All {{ issues.length }}
      </button>
      <template v-for="s in SEVERITIES" :key="s.id">
        <button
          v-if="counts[s.id]"
          type="button"
          role="radio"
          :aria-checked="filter === s.id"
          :class="[
            'inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-medium',
            filter === s.id
              ? 'border-primary bg-primary-soft text-primary'
              : 'border-line text-muted hover:text-fg',
          ]"
          @click="filter = s.id"
        >
          <component :is="s.icon" :size="12" :class="s.tone" aria-hidden="true" />
          {{ s.label }} {{ counts[s.id] }}
        </button>
      </template>
    </div>

    <ul class="flex flex-col gap-2">
      <li
        v-for="(issue, i) in visible"
        :key="i"
        class="rounded-xl border border-line bg-surface p-4"
      >
        <div class="flex flex-wrap items-center gap-2">
          <span
            :class="[
              'inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs font-medium',
              bySeverity[issue.severity].bg,
              bySeverity[issue.severity].tone,
            ]"
          >
            <component :is="bySeverity[issue.severity].icon" :size="12" aria-hidden="true" />
            {{ bySeverity[issue.severity].label }}
          </span>
          <span class="rounded-md bg-surface-muted px-1.5 py-0.5 text-xs text-muted">
            {{ CATEGORY_LABELS[issue.category] ?? issue.category }}
          </span>
          <span v-if="issue.line" class="font-mono text-xs text-subtle">Line {{ issue.line }}</span>
        </div>
        <h4 class="mt-2 text-sm font-semibold text-fg"><InlineCode :text="issue.title" /></h4>
        <p class="mt-1 text-sm text-muted"><InlineCode :text="issue.description" /></p>
        <p v-if="issue.suggestion" class="mt-2 flex gap-2 text-sm text-fg">
          <Lightbulb :size="15" class="mt-0.5 shrink-0 text-primary" aria-hidden="true" />
          <span
            ><span class="sr-only">Suggestion: </span><InlineCode :text="issue.suggestion"
          /></span>
        </p>
      </li>
    </ul>
  </div>
</template>
