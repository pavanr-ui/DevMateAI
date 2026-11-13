<script setup>
/**
 * ModuleBreakdown - requests per AI tool as labelled horizontal bars.
 * Text uses text colors; only the bar uses the brand color.
 */
import { computed } from 'vue'
import { tools } from '@/router/navigation'

const props = defineProps({
  /** [{ module: 'assistant', requests: 12 }] largest first */
  items: { type: Array, required: true },
})

const toolByName = Object.fromEntries(tools.map((t) => [t.name, t]))
const max = computed(() => Math.max(...props.items.map((i) => i.requests), 1))
const total = computed(() => props.items.reduce((sum, i) => sum + i.requests, 0))
</script>

<template>
  <ul class="flex flex-col gap-4">
    <li v-for="item in items" :key="item.module">
      <div class="mb-1.5 flex items-center justify-between gap-3 text-sm">
        <span class="flex min-w-0 items-center gap-2 text-fg">
          <component
            :is="toolByName[item.module]?.icon"
            v-if="toolByName[item.module]"
            :size="15"
            class="shrink-0 text-subtle"
            aria-hidden="true"
          />
          <span class="truncate">{{ toolByName[item.module]?.label ?? item.module }}</span>
        </span>
        <span class="shrink-0 text-muted tabular-nums">
          {{ item.requests }}
          <span class="text-subtle">· {{ Math.round((item.requests / total) * 100) }}%</span>
        </span>
      </div>
      <div class="h-2 rounded-full bg-surface-muted" aria-hidden="true">
        <div
          class="h-full rounded-full bg-primary"
          :style="{ width: `${(item.requests / max) * 100}%` }"
        />
      </div>
    </li>
  </ul>
</template>
