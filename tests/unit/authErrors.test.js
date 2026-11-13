import { describe, it, expect } from 'vitest'
import { getAuthErrorMessage, isSilentAuthError } from '@/utils/authErrors'

describe('getAuthErrorMessage', () => {
  it('uses the same message for wrong email and wrong password', () => {
    const a = getAuthErrorMessage({ code: 'auth/user-not-found' })
    const b = getAuthErrorMessage({ code: 'auth/wrong-password' })
    const c = getAuthErrorMessage({ code: 'auth/invalid-credential' })
    expect(a).toBe(b)
    expect(b).toBe(c)
  })

  it('never exposes raw technical errors', () => {
    const message = getAuthErrorMessage(new Error('internal stack trace details'))
    expect(message).toBe('Something went wrong. Please try again.')
  })
})

describe('isSilentAuthError', () => {
  it('treats a closed popup as a silent cancel', () => {
    expect(isSilentAuthError({ code: 'auth/popup-closed-by-user' })).toBe(true)
    expect(isSilentAuthError({ code: 'auth/invalid-credential' })).toBe(false)
  })
})
