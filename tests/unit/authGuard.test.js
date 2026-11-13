import { describe, it, expect, vi } from 'vitest'
import { createAuthGuard } from '@/router/guards'

const fakeAuth = (isAuthenticated) => ({ isAuthenticated, init: vi.fn().mockResolvedValue() })

const route = ({ requiresAuth = false, guestOnly = false, query = {}, fullPath = '/x' } = {}) => ({
  matched: [{ meta: { requiresAuth, guestOnly } }],
  query,
  fullPath,
})

describe('auth guard', () => {
  it('waits for Firebase to report the auth state first', async () => {
    const auth = fakeAuth(true)
    await createAuthGuard(() => auth)(route())
    expect(auth.init).toHaveBeenCalled()
  })

  it('sends signed-out users to login, remembering where they were going', async () => {
    const guard = createAuthGuard(() => fakeAuth(false))
    const result = await guard(route({ requiresAuth: true, fullPath: '/history?q=vue' }))
    expect(result).toEqual({ name: 'login', query: { redirect: '/history?q=vue' } })
  })

  it('lets signed-in users into protected pages', async () => {
    const guard = createAuthGuard(() => fakeAuth(true))
    expect(await guard(route({ requiresAuth: true }))).toBe(true)
  })

  it('sends signed-in users away from the login page', async () => {
    const guard = createAuthGuard(() => fakeAuth(true))
    expect(await guard(route({ guestOnly: true }))).toBe('/dashboard')
    expect(await guard(route({ guestOnly: true, query: { redirect: '/learn' } }))).toBe('/learn')
  })

  it('ignores malicious redirect targets', async () => {
    const guard = createAuthGuard(() => fakeAuth(true))
    const result = await guard(route({ guestOnly: true, query: { redirect: '//evil.example' } }))
    expect(result).toBe('/dashboard')
  })

  it('lets signed-out users see guest pages', async () => {
    const guard = createAuthGuard(() => fakeAuth(false))
    expect(await guard(route({ guestOnly: true }))).toBe(true)
  })
})
