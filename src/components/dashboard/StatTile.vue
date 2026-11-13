<script setup>
/**
 * StatTile - one headline number.
 * label · value · optional change vs. a named period.
 * The change shows an arrow + text, so it never relies on color alone.
 */
import { computed } from 'vue'
import { ArrowDownRight, ArrowUpRight, Minus } from '@lucide/vue'
import AppSkeleton from '@/components/common/AppSkeleton.vue'

const props = defineProps({
  label: { type: String, required: true },
  value: { type: [String, Number], default: '' },
  icon: { type: [Object, Function], default: null },
  /** % change; null = no baseline yet; undefined = don't show */
  change: { type: Number, default: undefined },
  changeLabel: { type: String, default: 'vs last week' },
  hint: { type: String, default: '' },
  loading: { type: Boolean, default: false },
})

const trend = computed(() => {
  if (props.change === undefined) return null
  if (props.change === null) return { text: 'New', icon: Minus, tone: 'text-subtle' }
  if (props.change > 0)
    return { text: `+${props.change}%`, icon: ArrowUpRight, tone: 'text-success' }
  if (props.change < 0)
    return { text: `${props.change}%`, icon: ArrowDownRight, tone: 'text-muted' }
  return { text: '0%', icon: Minus, tone: 'text-subtle' }
})
</script>

<template>
  <div class="rounded-2xl border border-line bg-surface p-4 shadow-card sm:p-5">
    <div class="flex items-center justify-between gap-2">
      <p class="text-sm text-muted">{{ label }}</p>
      <component :is="icon" v-if="icon" :size="16" class="text-subtle" aria-hidden="true" />
    </div>

    <template v-if="loading">
      <AppSkeleton class="mt-3 h-7 w-20" />
      <AppSkeleton class="mt-2 h-3 w-28" />
    </template>
    <template v-else>
      <p class="mt-2 text-2xl font-semibold tracking-tight text-fg tabular-nums">{{ value }}</p>
      <p v-if="trend" class="mt-1 flex items-center gap-1 text-xs">
        <span :class="['inline-flex items-center gap-0.5 font-medium', trend.tone]">
          <component :is="trend.icon" :size="14" aria-hidden="true" />
          {{ trend.text }}
        </span>
        <span class="text-subtle">{{ changeLabel }}</span>
      </p>
      <p v-else-if="hint" class="mt-1 text-xs text-subtle">{{ hint }}</p>
    </template>
  </div>
</template>
