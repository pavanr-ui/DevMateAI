import { describe, it, expect } from 'vitest'
import { normalizeLang, splitMarkdown } from '@/utils/markdown'

describe('splitMarkdown', () => {
  it('separates text and code blocks', () => {
    const segments = splitMarkdown('Intro **bold**\n\n```js\nconst a = 1\n```\n\nOutro')
    expect(segments.map((s) => s.type)).toEqual(['html', 'code', 'html'])
    expect(segments[0].html).toContain('<strong>bold</strong>')
    expect(segments[1]).toMatchObject({ lang: 'javascript', code: 'const a = 1' })
  })

  it('treats an unclosed fence (still streaming) as a growing code block', () => {
    const segments = splitMarkdown('Here:\n\n```vue\n<template>')
    expect(segments.at(-1)).toMatchObject({ type: 'code', lang: 'vue' })
  })

  it('removes dangerous HTML from AI output (XSS protection)', () => {
    const html = splitMarkdown(
      'Hi <img src=x onerror="alert(1)"> <script>alert(2)</script> [link](javascript:alert(3))',
    )[0].html
    expect(html).not.toMatch(/onerror|<script|javascript:/i)
  })

  it('opens links in a new tab without leaking the page', () => {
    const html = splitMarkdown('[docs](https://vuejs.org)')[0].html
    expect(html).toContain('target="_blank"')
    expect(html).toContain('rel="noopener noreferrer nofollow"')
  })
})

describe('normalizeLang', () => {
  it('maps common aliases', () => {
    expect(normalizeLang('JS')).toBe('javascript')
    expect(normalizeLang('sh')).toBe('bash')
    expect(normalizeLang('ts title="x"')).toBe('typescript')
    expect(normalizeLang('')).toBe('')
  })
})
