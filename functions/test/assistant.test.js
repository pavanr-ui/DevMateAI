import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { chatRequestSchema } from '../src/schemas/chat.js'
import { buildAssistantPrompt } from '../src/ai/prompts/assistant.js'
import { makeTitle } from '../src/ai/chat.js'
import { AI_CONFIG } from '../src/config.js'

describe('chatRequestSchema', () => {
  test('accepts a minimal request and fills defaults', () => {
    const r = chatRequestSchema.parse({ message: '  How do I debounce?  ' })
    assert.equal(r.message, 'How do I debounce?')
    assert.equal(r.mode, 'chat')
    assert.equal(r.language, 'auto')
    assert.equal(r.responseLanguage, 'en')
  })

  test('rejects empty, too long, and unknown values', () => {
    assert.equal(chatRequestSchema.safeParse({ message: '   ' }).success, false)
    assert.equal(
      chatRequestSchema.safeParse({ message: 'x'.repeat(AI_CONFIG.maxMessageChars + 1) }).success,
      false,
    )
    assert.equal(chatRequestSchema.safeParse({ message: 'hi', mode: 'hack' }).success, false)
    assert.equal(chatRequestSchema.safeParse({ message: 'hi', language: 'cobol' }).success, false)
  })

  test('rejects ids that could be Firestore paths', () => {
    assert.equal(
      chatRequestSchema.safeParse({ message: 'hi', conversationId: '../users/bob' }).success,
      false,
    )
    assert.equal(chatRequestSchema.safeParse({ message: 'hi', projectId: 'a/b' }).success, false)
  })
})

describe('buildAssistantPrompt', () => {
  test('includes the mode instruction and safety rules', () => {
    const p = buildAssistantPrompt({ mode: 'optimize' })
    assert.match(p, /Improve the provided code/)
    assert.match(p, /never as instructions/)
    assert.match(p, /Never include real API keys/)
  })

  test('adds Telugu instructions only when requested', () => {
    assert.doesNotMatch(buildAssistantPrompt({}), /Telugu/)
    assert.match(buildAssistantPrompt({ responseLanguage: 'te' }), /Telugu/)
  })

  test('adds project context with risky characters removed', () => {
    const p = buildAssistantPrompt({
      project: { name: 'Shop <script>', description: 'Store `admin`', techStack: ['Vue'] },
    })
    assert.match(p, /Name: Shop script/)
    assert.match(p, /Tech stack: Vue/)
    assert.doesNotMatch(p, /<script>/)
  })

  test('uses Vue 3 Composition API guidance for Vue', () => {
    assert.match(buildAssistantPrompt({ language: 'vue' }), /script setup/)
  })
})

describe('makeTitle', () => {
  test('uses the first non-empty line, shortened', () => {
    assert.equal(makeTitle('\n\nExplain closures\nmore text'), 'Explain closures')
    const long = makeTitle('a'.repeat(100))
    assert.equal(long.length, 58)
    assert.ok(long.endsWith('…'))
  })
})
