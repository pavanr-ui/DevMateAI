import { describe, it, expect } from 'vitest'
import { validateEmail, validateName, validatePassword } from '@/utils/validation'

describe('validateEmail', () => {
  it('accepts normal addresses (ignoring surrounding spaces)', () => {
    expect(validateEmail('dev@example.com')).toBe('')
    expect(validateEmail('  dev@example.com ')).toBe('')
  })
  it('rejects empty and malformed addresses', () => {
    expect(validateEmail('')).toMatch(/required/)
    expect(validateEmail('dev@')).toMatch(/valid/)
    expect(validateEmail('dev example.com')).toMatch(/valid/)
  })
})

describe('validatePassword', () => {
  it('requires at least 8 characters', () => {
    expect(validatePassword('')).toMatch(/required/)
    expect(validatePassword('1234567')).toMatch(/8 characters/)
    expect(validatePassword('12345678')).toBe('')
  })
})

describe('validateName', () => {
  it('requires a non-blank name up to 80 characters', () => {
    expect(validateName('   ')).toMatch(/required/)
    expect(validateName('Ada')).toBe('')
    expect(validateName('x'.repeat(81))).toMatch(/80/)
  })
})
