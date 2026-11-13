<script setup>
/**
 * UsageChart - AI requests per day (single series column chart).
 *
 * Accessibility:
 * - every column is focusable; hover OR keyboard focus shows its tooltip
 * - each column has an aria-label ("Nov 13: 5 requests")
 * - "Show table" switches to a plain data table
 */
import { computed, ref } from 'vue'
import { Table2, ChartColumn } from '@lucide/vue'
import { formatDayKey } from '@/utils/dates'

const props = defineProps({
  /** [{ key: 'YYYY-MM-DD', requests: number, tokens: number }] oldest first */
  series: { type: Array, required: true },
})

const showTable = ref(false)
const activeIndex = ref(null)

/** Round the axis top up to a clean number (4, 6, 8, 10, 20, 30, 40...) so bars fill the space. */
const axisMax = computed(() => {
  const max = Math.max(...props.series.map((d) => d.requests), 0)
  if (max <= 4) return 4
  const magnitude = 10 ** Math.floor(Math.log10(max))
  const step = [1, 2, 3, 4, 5, 6, 8, 10].find((s) => s * magnitude >= max)
  return step * magnitude
})
const ticks = computed(() => [axisMax.value, axisMax.value / 2, 0])

const label = (key) => formatDayKey(key)
const plural = (n) => `${n} request${n === 1 ? '' : 's'}`
const height = (requests) => `${(requests / axisMax.value) * 100}%`
const active = computed(() => (activeIndex.value === null ? null : props.series[activeIndex.value]))
</script>

<template>
  <div>
    <div class="mb-3 flex justify-end">
      <button
        type="button"
        class="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-medium text-muted hover:bg-surface-muted hover:text-fg"
        :aria-pressed="showTable"
        @click="showTable = !showTable"
      >
        <component :is="showTable ? ChartColumn : Table2" :size="14" aria-hidden="true" />
        {{ showTable ? 'Show chart' : 'Show table' }}
      </button>
    </div>

    <!-- Table view -->
    <div v-if="showTable" class="max-h-64 overflow-y-auto rounded-xl border border-line">
      <table class="w-full text-sm">
        <caption class="sr-only">
          AI requests and tokens per day
        </caption>
        <thead class="sticky top-0 bg-surface-muted text-left text-xs text-muted">
          <tr>
            <th scope="col" class="px-3 py-2 font-medium">Day</th>
            <th scope="col" class="px-3 py-2 text-right font-medium">Requests</th>
            <th scope="col" class="px-3 py-2 text-right font-medium">Tokens</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="day in [...series].reverse()" :key="day.key" class="border-t border-line">
            <th scope="row" class="px-3 py-2 text-left font-normal text-fg">
              {{ label(day.key) }}
            </th>
            <td class="px-3 py-2 text-right text-fg tabular-nums">{{ day.requests }}</td>
            <td class="px-3 py-2 text-right text-muted tabular-nums">
              {{ day.tokens.toLocaleString() }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Chart view -->
    <div v-else class="flex gap-2">
      <!-- Y axis -->
      <div
        class="flex h-48 flex-col justify-between pb-0 text-right text-[11px] text-subtle tabular-nums"
        aria-hidden="true"
      >
        <span v-for="t in ticks" :key="t" class="-my-1.5 leading-3">{{ t }}</span>
      </div>

      <div class="min-w-0 flex-1">
        <div class="relative h-48">
          <!-- Hairline gridlines -->
          <div
            v-for="(t, i) in ticks"
            :key="t"
            class="absolute inset-x-0 border-t border-line"
            :style="{ top: `${i * 50}%` }"
            aria-hidden="true"
          />

          <!-- Columns -->
          <ul class="absolute inset-0 flex items-end gap-[2px]" aria-label="Requests per day">
            <li
              v-for="(day, i) in series"
              :key="day.key"
              class="group relative flex h-full flex-1 cursor-default items-end justify-center rounded-md outline-none focus-visible:bg-surface-muted"
              tabindex="0"
              :aria-label="`${label(day.key)}: ${plural(day.requests)}`"
              @pointerenter="activeIndex = i"
              @pointerleave="activeIndex = null"
              @focus="activeIndex = i"
              @blur="activeIndex = null"
            >
              <span
                class="w-full max-w-6 rounded-t-[4px] bg-primary transition-opacity"
                :class="activeIndex !== null && activeIndex !== i ? 'opacity-40' : ''"
                :style="{ height: height(day.requests) }"
              />
            </li>
          </ul>

          <!-- Tooltip -->
          <div
            v-if="active"
            class="pointer-events-none absolute -top-2 z-10 -translate-x-1/2 -translate-y-full rounded-lg border border-line bg-surface px-3 py-2 text-xs whitespace-nowrap shadow-raised"
            :style="{ left: `${((activeIndex + 0.5) / series.length) * 100}%` }"
            role="status"
          >
            <p class="font-medium text-fg">{{ label(active.key) }}</p>
            <p class="text-muted tabular-nums">{{ plural(active.requests) }}</p>
            <p class="text-subtle tabular-nums">{{ active.tokens.toLocaleString() }} tokens</p>
          </div>
        </div>

        <!-- X axis: first, middle, last (today) -->
        <div class="mt-2 flex justify-between text-[11px] text-subtle" aria-hidden="true">
          <span>{{ label(series[0].key) }}</span>
          <span>{{ label(series[Math.floor(series.length / 2)].key) }}</span>
          <span>Today</span>
        </div>
      </div>
    </div>
  </div>
</template>
