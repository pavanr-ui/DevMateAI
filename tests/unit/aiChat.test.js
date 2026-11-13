import { describe, it, expect, vi } from 'vitest'

// The service creates a callable at import time; stub Firebase so tests stay offline.
vi.mock('@/services/firebase', () => ({ functions: {} }))
vi.mock('firebase/functions', () => ({ httpsCallable: () => ({}) }))

const { getAiErrorMessage, isAbortError } = await import('@/services/api/aiChat')

describe('getAiErrorMessage', () => {
  it('shows friendly server messages without the "[429]" status suffix', () => {
    const error = {
      code: 'functions/resource-exhausted',
      message: "You've reached today's limit of 50 AI requests. It resets at 00:00 UTC. [429]",
    }
    expect(getAiErrorMessage(error)).toBe(
      "You've reached today's limit of 50 AI requests. It resets at 00:00 UTC.",
    )
    expect(getAiErrorMessage({ code: 'functions/unavailable', message: 'Busy [0]' })).toBe('Busy')
  })

  it('hides technical messages from unexpected errors', () => {
    const error = { code: 'functions/internal', message: 'TypeError at line 42' }
    expect(getAiErrorMessage(error)).toBe('Something went wrong. Please try again.')
  })
})

describe('isAbortError', () => {
  it('recognises cancelled requests', () => {
    expect(isAbortError({ code: 'functions/cancelled' })).toBe(true)
    expect(isAbortError({ name: 'AbortError' })).toBe(true)
    expect(isAbortError({ code: 'functions/internal' })).toBe(false)
  })
})
