import { safeRedirect } from '@/utils/safeRedirect'

/**
 * Decides where a navigation may go, based on sign-in state.
 *
 * Routes mark themselves with meta:
 *   requiresAuth: true  -> signed-in users only (else go to /login)
 *   guestOnly: true     -> signed-out users only (else go to the app)
 *
 * Written as a factory so tests can pass a fake auth store.
 */
export function createAuthGuard(getAuth) {
  return async function authGuard(to) {
    const auth = getAuth()
    await auth.init()

    const requiresAuth = to.matched.some((r) => r.meta.requiresAuth)
    const guestOnly = to.matched.some((r) => r.meta.guestOnly)

    if (requiresAuth && !auth.isAuthenticated) {
      return { name: 'login', query: { redirect: to.fullPath } }
    }
    if (guestOnly && auth.isAuthenticated) {
      return safeRedirect(to.query.redirect)
    }
    return true
  }
}
