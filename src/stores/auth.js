import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import * as authService from '@/services/firebase/auth'
import { ensureUserProfile } from '@/services/firebase/users'

/**
 * Auth store: who is signed in, and the actions to sign in/out.
 *
 * `init()` resolves once Firebase has told us whether a user is already
 * signed in (from a previous visit). The router waits for it before
 * deciding whether a page is allowed.
 */
export const useAuthStore = defineStore('auth', () => {
  const user = ref(null)
  const ready = ref(false)
  let readyPromise = null

  const isAuthenticated = computed(() => Boolean(user.value))
  const displayName = computed(
    () => user.value?.displayName || user.value?.email?.split('@')[0] || '',
  )
  const firstName = computed(() => displayName.value.split(' ')[0])

  function init() {
    readyPromise ??= new Promise((resolve) => {
      authService.watchAuthState((firebaseUser) => {
        user.value = authService.toAppUser(firebaseUser)
        if (!ready.value) {
          ready.value = true
          resolve()
        }
      })
    })
    return readyPromise
  }

  /** Profile creation must not block sign-in; it retries on the next sign-in. */
  async function syncProfile(firebaseUser, extra) {
    try {
      await ensureUserProfile(firebaseUser, extra)
    } catch {
      // Intentionally silent: never log user data. Monitoring comes in Phase 8.
    }
  }

  async function signUp({ name, email, password }) {
    const firebaseUser = await authService.signUpWithEmail({
      name: name.trim(),
      email: email.trim(),
      password,
    })
    // The auth listener fired before the display name was set; refresh it.
    user.value = authService.toAppUser(firebaseUser)
    await syncProfile(firebaseUser, { displayName: name.trim() })
  }

  async function login({ email, password }) {
    const firebaseUser = await authService.signInWithEmail({ email: email.trim(), password })
    await syncProfile(firebaseUser)
  }

  async function loginWithGoogle() {
    const firebaseUser = await authService.signInWithGoogle()
    await syncProfile(firebaseUser)
  }

  function resetPassword(email) {
    return authService.sendPasswordReset(email.trim())
  }

  async function logout() {
    await authService.signOut()
    // The router watches auth state and moves to /login (see App.vue).
  }

  return {
    user,
    ready,
    isAuthenticated,
    displayName,
    firstName,
    init,
    signUp,
    login,
    loginWithGoogle,
    resetPassword,
    logout,
  }
})
