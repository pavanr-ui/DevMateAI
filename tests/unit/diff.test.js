import { describe, it, expect } from 'vitest'
import { collapseUnchanged, diffLines, diffStats } from '@/utils/diff'

describe('diffLines', () => {
  it('marks unchanged, removed and added lines with both line numbers', () => {
    const before = 'a\nb\nc'
    const after = 'a\nB\nc\nd'
    const lines = diffLines(before, after)
    expect(lines.map((l) => `${l.type}:${l.text}`)).toEqual([
      'same:a',
      'del:b',
      'add:B',
      'same:c',
      'add:d',
    ])
    expect(lines[3]).toMatchObject({ oldLine: 3, newLine: 3 })
    expect(diffStats(lines)).toEqual({ added: 2, removed: 1 })
  })

  it('treats Windows and Unix line endings as equal', () => {
    const lines = diffLines('a\r\nb\r\n', 'a\nb\n')
    expect(diffStats(lines)).toEqual({ added: 0, removed: 0 })
  })

  it('refuses huge inputs instead of freezing the page', () => {
    const big = Array.from({ length: 3000 }, (_, i) => `line ${i}`).join('\n')
    expect(diffLines(big, `${big}\nmore`)).toBeNull()
  })
})

describe('collapseUnchanged', () => {
  it('keeps 3 lines of context around changes and collapses the rest', () => {
    const before = Array.from({ length: 20 }, (_, i) => `l${i}`).join('\n')
    const after = before.replace('l10', 'CHANGED')
    const rows = collapseUnchanged(diffLines(before, after))
    expect(rows[0]).toEqual({ type: 'skip', count: 7 })
    expect(rows.filter((r) => r.type === 'same')).toHaveLength(6)
    expect(rows.at(-1)).toEqual({ type: 'skip', count: 6 })
  })
})
