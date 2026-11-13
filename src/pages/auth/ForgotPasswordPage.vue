<script setup>
import { ref } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { ArrowLeft, Mail } from '@lucide/vue'
import AuthLayout from '@/layouts/AuthLayout.vue'
import AppAlert from '@/components/common/AppAlert.vue'
import AppButton from '@/components/common/AppButton.vue'
import AppInput from '@/components/common/AppInput.vue'
import { useAuthStore } from '@/stores/auth'
import { getAuthErrorMessage } from '@/utils/authErrors'
import { validateEmail } from '@/utils/validation'

// Problems the user can actually fix; they don't reveal whether an account exists.
const VISIBLE_ERRORS = new Set([
  'auth/network-request-failed',
  'auth/too-many-requests',
  'auth/invalid-email',
])

const auth = useAuthStore()
const route = useRoute()

const email = ref(typeof route.query.email === 'string' ? route.query.email : '')
const error = ref('')
const sent = ref(false)
const submitting = ref(false)

async function submit() {
  error.value = validateEmail(email.value)
  if (error.value) return
  submitting.value = true
  try {
    await auth.resetPassword(email.value)
    sent.value = true
  } catch (err) {
    if (VISIBLE_ERRORS.has(err?.code)) {
      error.value = getAuthErrorMessage(err)
    } else {
      // Any other error (e.g. no such account) is hidden on purpose: we show
      // the same message either way, so this form can't reveal which emails
      // have accounts.
      sent.value = true
    }
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <AuthLayout
    title="Reset your password"
    subtitle="Enter your email and we'll send you a link to choose a new password."
  >
    <AppAlert v-if="sent" variant="success" title="Check your inbox" class="mb-5">
      If an account exists for {{ email.trim() }}, a reset link is on its way.
    </AppAlert>

    <form class="flex flex-col gap-4" novalidate @submit.prevent="submit">
      <AppInput
        v-model="email"
        label="Email"
        type="email"
        :icon="Mail"
        autocomplete="email"
        placeholder="you@example.com"
        :error="error"
        required
      />
      <AppButton type="submit" size="lg" block :loading="submitting">
        {{ sent ? 'Send again' : 'Send reset link' }}
      </AppButton>
    </form>

    <RouterLink
      :to="{ name: 'login' }"
      class="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
    >
      <ArrowLeft :size="16" aria-hidden="true" />
      Back to sign in
    </RouterLink>
  </AuthLayout>
</template>
