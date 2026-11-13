import { describe, it, expect } from 'vitest'
import { safeRedirect } from '@/utils/safeRedirect'

describe('safeRedirect', () => {
  it('allows in-app paths', () => {
    expect(safeRedirect('/history')).toBe('/history')
    expect(safeRedirect('/reviewer?tab=2#top')).toBe('/reviewer?tab=2#top')
  })

  it.each([
    ['https://evil.example', 'absolute URL'],
    ['//evil.example', 'protocol-relative URL'],
    ['/\\evil.example', 'backslash trick'],
    ['javascript:alert(1)', 'javascript: URL'],
    ['history', 'relative path'],
    ['/a\nb', 'control characters'],
  ])('rejects %s (%s)', (value) => {
    expect(safeRedirect(value)).toBe('/dashboard')
  })

  it('falls back for missing or non-string values', () => {
    expect(safeRedirect(undefined)).toBe('/dashboard')
    expect(safeRedirect(['/a', '/b'])).toBe('/dashboard')
    expect(safeRedirect(null, '/settings')).toBe('/settings')
  })
})
