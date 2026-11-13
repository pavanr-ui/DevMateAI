<script setup>
/**
 * ActivityList - recent AI actions (written by the backend in Phase 4+).
 */
import { RouterLink } from 'vue-router'
import { Sparkles } from '@lucide/vue'
import { tools } from '@/router/navigation'
import { formatRelativeTime, toDate } from '@/utils/dates'

defineProps({
  items: { type: Array, required: true },
})

const toolByName = Object.fromEntries(tools.map((t) => [t.name, t]))

/** Activity that points at a saved chat opens it; others aren't links (yet). */
function linkFor(item) {
  if (item.module === 'assistant' && item.targetId) {
    return { name: 'assistant', query: { c: item.targetId } }
  }
  return null
}
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
        <RouterLink
          v-if="linkFor(item)"
          :to="linkFor(item)"
          class="block truncate text-sm font-medium text-fg hover:text-primary hover:underline"
        >
          {{ item.title }}
        </RouterLink>
        <p v-else class="truncate text-sm font-medium text-fg">{{ item.title }}</p>
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
