import { describe, it, expect } from 'vitest'
import { buildDailySeries, moduleTotals, percentChange, sumBy } from '@/utils/usage'
import { lastDayKeys, formatRelativeTime } from '@/utils/dates'

const TODAY = new Date('2026-11-13T15:00:00Z')

describe('lastDayKeys', () => {
  it('returns N UTC days ending today, oldest first', () => {
    expect(lastDayKeys(3, TODAY)).toEqual(['2026-11-11', '2026-11-12', '2026-11-13'])
  })
  it('crosses month boundaries', () => {
    expect(lastDayKeys(2, new Date('2026-03-01T01:00:00Z'))).toEqual(['2026-02-28', '2026-03-01'])
  })
})

describe('buildDailySeries', () => {
  it('fills missing days with zeros so the chart has no gaps', () => {
    const docs = [{ id: '2026-11-12', requests: 4, tokensIn: 100, tokensOut: 50 }]
    const series = buildDailySeries(docs, 3, TODAY)
    expect(series.map((d) => d.requests)).toEqual([0, 4, 0])
    expect(series[1].tokens).toBe(150)
  })
  it('ignores documents outside the window', () => {
    const docs = [{ id: '2026-10-01', requests: 99 }]
    expect(sumBy(buildDailySeries(docs, 7, TODAY), 'requests')).toBe(0)
  })
})

describe('percentChange', () => {
  it('computes rounded percentage change', () => {
    expect(percentChange(15, 10)).toBe(50)
    expect(percentChange(5, 10)).toBe(-50)
  })
  it('returns null without a baseline instead of Infinity', () => {
    expect(percentChange(10, 0)).toBeNull()
  })
})

describe('moduleTotals', () => {
  it('sums modules across days, largest first, dropping zeros', () => {
    const series = [
      { byModule: { assistant: 2, learn: 1 } },
      { byModule: { assistant: 3, reviewer: 4, github: 0 } },
    ]
    expect(moduleTotals(series)).toEqual([
      { module: 'assistant', requests: 5 },
      { module: 'reviewer', requests: 4 },
      { module: 'learn', requests: 1 },
    ])
  })
})

describe('formatRelativeTime', () => {
  const now = new Date('2026-11-13T12:00:00Z')
  it('formats recent times', () => {
    expect(formatRelativeTime(new Date('2026-11-13T11:59:50Z'), now, 'en')).toBe('just now')
    expect(formatRelativeTime(new Date('2026-11-13T09:00:00Z'), now, 'en')).toBe('3 hours ago')
    expect(formatRelativeTime(new Date('2026-11-12T12:00:00Z'), now, 'en')).toBe('yesterday')
  })
  it('accepts Firestore Timestamp-like objects and handles missing values', () => {
    const ts = { toDate: () => new Date('2026-11-13T11:00:00Z') }
    expect(formatRelativeTime(ts, now, 'en')).toBe('1 hour ago')
    expect(formatRelativeTime(null, now, 'en')).toBe('')
  })
})
