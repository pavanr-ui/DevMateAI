/**
 * Pure functions that turn raw usage documents into dashboard numbers.
 * Kept separate from Vue/Firebase so they are easy to unit test.
 */
import { lastDayKeys } from './dates'

/**
 * One entry per day for the last `days` days (oldest first). Days with no
 * document count as zero, so charts never have gaps.
 * @param {Array<{id: string, requests?: number, tokensIn?: number, tokensOut?: number, byModule?: object}>} docs
 */
export function buildDailySeries(docs, days, today = new Date()) {
  const byId = new Map(docs.map((d) => [d.id, d]))
  return lastDayKeys(days, today).map((key) => {
    const d = byId.get(key) ?? {}
    return {
      key,
      requests: d.requests ?? 0,
      tokens: (d.tokensIn ?? 0) + (d.tokensOut ?? 0),
      byModule: d.byModule ?? {},
    }
  })
}

export function sumBy(series, field) {
  return series.reduce((total, day) => total + (day[field] ?? 0), 0)
}

/**
 * Percentage change from `previous` to `current`.
 * Returns null when there's no baseline (previous = 0), so the UI can show
 * "new" instead of a misleading "+∞%".
 */
export function percentChange(current, previous) {
  if (!previous) return null
  return Math.round(((current - previous) / previous) * 100)
}

/** Requests per module across the series, largest first. */
export function moduleTotals(series) {
  const totals = {}
  for (const day of series) {
    for (const [module, count] of Object.entries(day.byModule)) {
      totals[module] = (totals[module] ?? 0) + count
    }
  }
  return Object.entries(totals)
    .map(([module, requests]) => ({ module, requests }))
    .filter((m) => m.requests > 0)
    .sort((a, b) => b.requests - a.requests)
}

/** 1234 -> "1.2K", 2500000 -> "2.5M" */
export function formatCompact(value, locale) {
  return new Intl.NumberFormat(locale, { notation: 'compact', maximumFractionDigits: 1 }).format(
    value,
  )
}
