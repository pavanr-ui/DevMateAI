import { describe, it, expect } from 'vitest'
import { parseTechStack, validateProject } from '@/utils/projectValidation'

describe('parseTechStack', () => {
  it('splits, trims, drops blanks and removes case-insensitive duplicates', () => {
    expect(parseTechStack(' Vue 3, firebase, , Firebase ,Tailwind ')).toEqual([
      'Vue 3',
      'firebase',
      'Tailwind',
    ])
  })
})

describe('validateProject', () => {
  const valid = { name: 'Portfolio', description: '', techStack: ['Vue'] }

  it('accepts a minimal valid project', () => {
    expect(validateProject(valid).valid).toBe(true)
  })

  it('mirrors the Firestore rule limits', () => {
    expect(validateProject({ ...valid, name: '   ' }).errors.name).toMatch(/required/)
    expect(validateProject({ ...valid, name: 'x'.repeat(81) }).errors.name).toMatch(/80/)
    expect(validateProject({ ...valid, description: 'x'.repeat(501) }).errors.description).toMatch(
      /500/,
    )
    const elevenTags = Array.from({ length: 11 }, (_, i) => `t${i}`)
    expect(validateProject({ ...valid, techStack: elevenTags }).errors.techStack).toMatch(/10/)
    expect(validateProject({ ...valid, techStack: ['x'.repeat(31)] }).errors.techStack).toMatch(
      /30/,
    )
  })
})
