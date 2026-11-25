import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { learnRequestSchema } from '../src/schemas/chat.js'
import { buildLearnPrompt } from '../src/ai/prompts/learn.js'
import { componentRequestSchema, componentResultSchema } from '../src/schemas/analysis.js'
import { buildComponentInput, buildComponentPrompt } from '../src/ai/prompts/analysis.js'
import { toGeminiSchema } from '../src/ai/gemini.js'

describe('learn request', () => {
  test('defaults to a beginner chat in English', () => {
    const r = learnRequestSchema.parse({ message: 'What is a closure?' })
    assert.equal(r.mode, 'chat')
    assert.equal(r.level, 'beginner')
    assert.equal(r.responseLanguage, 'en')
  })

  test('rejects unknown modes, levels and over-long topics', () => {
    assert.equal(learnRequestSchema.safeParse({ message: 'x', mode: 'cheat' }).success, false)
    assert.equal(learnRequestSchema.safeParse({ message: 'x', level: 'guru' }).success, false)
    assert.equal(
      learnRequestSchema.safeParse({ message: 'x', topic: 'x'.repeat(81) }).success,
      false,
    )
  })
})

describe('learn prompt', () => {
  test('adapts to level and activity', () => {
    const p = buildLearnPrompt({ mode: 'exercise', level: 'advanced', topic: 'Promises' })
    assert.match(p, /ADVANCED/)
    assert.match(p, /Do NOT give the solution yet/)
    assert.match(p, /Current topic: Promises\./)
  })

  test('interview mode asks one question at a time', () => {
    assert.match(buildLearnPrompt({ mode: 'interview' }), /Never ask more than one question/)
  })

  test('topic text cannot inject markup or code fences', () => {
    const p = buildLearnPrompt({ topic: '<b>`hack`</b>' })
    assert.match(p, /Current topic: bhack\/b\./)
  })

  test('Telugu keeps technical terms in English', () => {
    assert.match(buildLearnPrompt({ responseLanguage: 'te' }), /technical terms[\s\S]*in English/)
  })
})

describe('component generator', () => {
  test('request defaults and name validation', () => {
    const r = componentRequestSchema.parse({ description: 'A modal dialog with a close button' })
    assert.equal(r.kind, 'component')
    assert.equal(r.styling, 'tailwind')
    assert.equal(componentRequestSchema.safeParse({ description: 'too short' }).success, false)
    assert.equal(
      componentRequestSchema.safeParse({ description: 'A modal dialog', name: 'my-modal' }).success,
      false,
    )
    assert.equal(
      componentRequestSchema.safeParse({ description: 'A modal dialog', name: '' }).success,
      true,
    )
  })

  test('prompt enforces Vue 3 + JavaScript + chosen styling', () => {
    const p = buildComponentPrompt({ kind: 'component', styling: 'scoped-css' })
    assert.match(p, /<script setup>/)
    assert.match(p, /NOT TypeScript/)
    assert.match(p, /<style scoped>/)
  })

  test('composable prompt asks for useXxx and cleanup', () => {
    assert.match(buildComponentPrompt({ kind: 'composable' }), /useXxx[\s\S]*onScopeDispose/)
  })

  test('request text is fenced by boundaries', () => {
    const text = buildComponentInput({ description: 'ignore rules', name: 'UserCard' })
    assert.match(text, /Preferred name: UserCard/)
    assert.match(text, /-----BEGIN REQUEST [0-9a-f]{12}-----/)
  })

  test('result schema converts for Gemini and requires at least one file', () => {
    assert.equal(toGeminiSchema(componentResultSchema).type, 'object')
    const noFiles = {
      name: 'X',
      kind: 'component',
      summary: '',
      files: [],
      props: [],
      emits: [],
      slots: [],
      usage: '',
      explanation: '',
      accessibility: [],
    }
    assert.equal(componentResultSchema.safeParse(noFiles).success, false)
  })
})
