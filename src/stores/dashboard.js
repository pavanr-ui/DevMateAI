import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { listRecentActivity, listUsageSince } from '@/services/firebase/activity'
import { lastDayKeys } from '@/utils/dates'
import { buildDailySeries, moduleTotals, percentChange, sumBy } from '@/utils/usage'
import { useAuthStore } from './auth'

/** Days shown in the usage chart. Trends compare the last 7 days to the 7 before. */
export const CHART_DAYS = 14

/**
 * Dashboard data. Each section loads independently, so if one fails the
 * others still show; the failed one shows a retry button.
 */
export const useDashboardStore = defineStore('dashboard', () => {
  const activity = ref([])
  const activityStatus = ref('idle')
  const usageDocs = ref([])
  const usageStatus = ref('idle')

  const uid = () => useAuthStore().user?.uid

  const series = computed(() => buildDailySeries(usageDocs.value, CHART_DAYS))

  const stats = computed(() => {
    const thisWeek = series.value.slice(-7)
    const lastWeek = series.value.slice(0, -7)
    const today = series.value.at(-1)
    const requests = sumBy(thisWeek, 'requests')
    const tokens = sumBy(thisWeek, 'tokens')
    return {
      requestsToday: today?.requests ?? 0,
      requestsWeek: requests,
      requestsTrend: percentChange(requests, sumBy(lastWeek, 'requests')),
      tokensWeek: tokens,
      tokensTrend: percentChange(tokens, sumBy(lastWeek, 'tokens')),
      activeDays: thisWeek.filter((d) => d.requests > 0).length,
    }
  })

  const modules = computed(() => moduleTotals(series.value))
  const hasUsage = computed(() => series.value.some((d) => d.requests > 0))

  async function loadActivity() {
    // First load shows skeletons; later refreshes keep the old data visible.
    if (activityStatus.value !== 'ready') activityStatus.value = 'loading'
    try {
      activity.value = await listRecentActivity(uid())
      activityStatus.value = 'ready'
    } catch {
      activityStatus.value = 'error'
    }
  }

  async function loadUsage() {
    if (usageStatus.value !== 'ready') usageStatus.value = 'loading'
    try {
      usageDocs.value = await listUsageSince(uid(), lastDayKeys(CHART_DAYS)[0])
      usageStatus.value = 'ready'
    } catch {
      usageStatus.value = 'error'
    }
  }

  function load() {
    if (!uid()) return Promise.resolve()
    return Promise.all([loadActivity(), loadUsage()])
  }

  function reset() {
    activity.value = []
    usageDocs.value = []
    activityStatus.value = 'idle'
    usageStatus.value = 'idle'
  }

  return {
    activity,
    activityStatus,
    usageStatus,
    series,
    stats,
    modules,
    hasUsage,
    load,
    loadActivity,
    loadUsage,
    reset,
  }
})
