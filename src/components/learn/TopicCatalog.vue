<script setup>
/**
 * TopicCatalog - JavaScript topics by level, with search and a check mark
 * on topics the learner has already explored.
 */
import { computed, ref, useId } from 'vue'
import { CircleCheck, Search } from '@lucide/vue'
import { LEVELS, TOPICS } from '@/utils/learnTopics'

const level = defineModel('level', { type: String, default: 'beginner' })
const props = defineProps({
  activeTopic: { type: String, default: null },
  /** Set of topic names that already have a conversation */
  explored: { type: Object, default: () => new Set() },
})
defineEmits(['select'])

const searchId = useId()
const query = ref('')

const topics = computed(() => {
  const q = query.value.trim().toLowerCase()
  const list = q
    ? LEVELS.flatMap((l) => TOPICS[l.id].map((name) => ({ name, level: l.id })))
    : TOPICS[level.value].map((name) => ({ name, level: level.value }))
  return q ? list.filter((t) => t.name.toLowerCase().includes(q)) : list
})

const progress = computed(() => {
  const all = TOPICS[level.value]
  const done = all.filter((t) => props.explored.has(t)).length
  return { done, total: all.length, percent: Math.round((done / all.length) * 100) }
})
</script>

<template>
  <div class="flex h-full flex-col">
    <div class="p-3">
      <div
        role="tablist"
        aria-label="Level"
        class="grid grid-cols-3 rounded-lg bg-surface-muted p-0.5"
      >
        <button
          v-for="l in LEVELS"
          :key="l.id"
          type="button"
          role="tab"
          :aria-selected="level === l.id"
          :class="[
            'rounded-md px-2 py-1.5 text-xs font-medium transition-colors',
            level === l.id ? 'bg-surface text-fg shadow-card' : 'text-muted hover:text-fg',
          ]"
          @click="level = l.id"
        >
          {{ l.label }}
        </button>
      </div>

      <div class="mt-3">
        <div class="mb-1 flex justify-between text-xs text-subtle">
          <span>Explored</span>
          <span class="tabular-nums">{{ progress.done }} / {{ progress.total }}</span>
        </div>
        <div
          class="h-1.5 rounded-full bg-surface-muted"
          role="progressbar"
          :aria-valuenow="progress.percent"
          aria-valuemin="0"
          aria-valuemax="100"
          :aria-label="`${progress.done} of ${progress.total} topics explored`"
        >
          <div class="h-full rounded-full bg-primary" :style="{ width: `${progress.percent}%` }" />
        </div>
      </div>

      <label :for="searchId" class="sr-only">Search topics</label>
      <div class="relative mt-3">
        <Search
          :size="14"
          class="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-subtle"
          aria-hidden="true"
        />
        <input
          :id="searchId"
          v-model="query"
          type="search"
          placeholder="Search all topics…"
          class="h-9 w-full rounded-lg border border-line bg-surface pr-3 pl-8 text-sm text-fg placeholder:text-subtle focus:outline-none focus-visible:outline-2"
        />
      </div>
    </div>

    <ul class="min-h-0 flex-1 overflow-y-auto px-3 pb-3" aria-label="Topics">
      <li v-for="t in topics" :key="t.name">
        <button
          type="button"
          :aria-current="t.name === activeTopic ? 'true' : undefined"
          :class="[
            'flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm transition-colors',
            t.name === activeTopic
              ? 'bg-primary-soft font-medium text-primary'
              : 'text-fg hover:bg-surface-muted',
          ]"
          @click="$emit('select', t)"
        >
          <span class="min-w-0 flex-1 truncate">{{ t.name }}</span>
          <CircleCheck
            v-if="explored.has(t.name)"
            :size="15"
            class="shrink-0 text-success"
            aria-label="Explored"
          />
        </button>
      </li>
      <li v-if="!topics.length" class="px-2.5 py-4 text-sm text-muted">No topics match.</li>
    </ul>
  </div>
</template>
