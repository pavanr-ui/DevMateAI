<script setup>
/**
 * ScoreBadge - review score (0-100) as a ring with a text label.
 * The label (not only the color) carries the meaning.
 */
import { computed } from 'vue'

const props = defineProps({
  score: { type: Number, required: true },
})

const band = computed(() => {
  const s = props.score
  if (s >= 90) return { label: 'Excellent', tone: 'text-success', ring: 'var(--dm-success)' }
  if (s >= 70) return { label: 'Good', tone: 'text-primary', ring: 'var(--dm-primary)' }
  if (s >= 50) return { label: 'Needs work', tone: 'text-warning', ring: 'var(--dm-warning)' }
  return { label: 'Serious problems', tone: 'text-danger', ring: 'var(--dm-danger)' }
})

// SVG ring: circumference of r=26 circle
const CIRCUMFERENCE = 2 * Math.PI * 26
const dash = computed(() => (Math.min(100, Math.max(0, props.score)) / 100) * CIRCUMFERENCE)
</script>

<template>
  <div
    class="flex items-center gap-3"
    role="img"
    :aria-label="`Score ${score} out of 100: ${band.label}`"
  >
    <svg viewBox="0 0 64 64" class="size-16 shrink-0 -rotate-90" aria-hidden="true">
      <circle
        cx="32"
        cy="32"
        r="26"
        fill="none"
        stroke="var(--dm-surface-muted)"
        stroke-width="6"
      />
      <circle
        cx="32"
        cy="32"
        r="26"
        fill="none"
        :stroke="band.ring"
        stroke-width="6"
        stroke-linecap="round"
        :stroke-dasharray="`${dash} ${CIRCUMFERENCE}`"
      />
    </svg>
    <div aria-hidden="true">
      <p class="text-2xl leading-none font-semibold text-fg tabular-nums">
        {{ score }}<span class="text-sm font-normal text-subtle">/100</span>
      </p>
      <p :class="['mt-1 text-sm font-medium', band.tone]">{{ band.label }}</p>
    </div>
  </div>
</template>
