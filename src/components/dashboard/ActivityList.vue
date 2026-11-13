<script setup>
/**
 * ActivityList - recent AI actions (written by the backend in Phase 4+).
 */
import { Sparkles } from '@lucide/vue'
import { tools } from '@/router/navigation'
import { formatRelativeTime, toDate } from '@/utils/dates'

defineProps({
  items: { type: Array, required: true },
})

const toolByName = Object.fromEntries(tools.map((t) => [t.name, t]))
</script>

<template>
  <ul class="flex flex-col">
    <li
      v-for="item in items"
      :key="item.id"
      class="flex items-center gap-3 border-b border-line py-3 first:pt-0 last:border-0 last:pb-0"
    >
      <span
        class="grid size-9 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary"
        aria-hidden="true"
      >
        <component :is="toolByName[item.module]?.icon ?? Sparkles" :size="16" />
      </span>
      <div class="min-w-0 flex-1">
        <p class="truncate text-sm font-medium text-fg">{{ item.title }}</p>
        <p class="text-xs text-subtle">
          {{ toolByName[item.module]?.label ?? 'AI' }} ·
          <time :datetime="toDate(item.createdAt)?.toISOString()">
            {{ formatRelativeTime(item.createdAt) }}
          </time>
        </p>
      </div>
    </li>
  </ul>
</template>
