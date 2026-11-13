<script setup>
import { reactive, ref } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { Lock, Mail } from '@lucide/vue'
import AuthLayout from '@/layouts/AuthLayout.vue'
import AppAlert from '@/components/common/AppAlert.vue'
import AppButton from '@/components/common/AppButton.vue'
import AppInput from '@/components/common/AppInput.vue'
import AuthDivider from '@/components/auth/AuthDivider.vue'
import GoogleSignInButton from '@/components/auth/GoogleSignInButton.vue'
import { useAuthStore } from '@/stores/auth'
import { getAuthErrorMessage } from '@/utils/authErrors'
import { safeRedirect } from '@/utils/safeRedirect'
import { validateEmail } from '@/utils/validation'

const auth = useAuthStore()
const route = useRoute()
const router = useRouter()

const form = reactive({ email: '', password: '' })
const errors = reactive({ email: '', password: '' })
const formError = ref('')
const submitting = ref(false)

function goToApp() {
  router.replace(safeRedirect(route.query.redirect))
}

function validate() {
  errors.email = validateEmail(form.email)
  errors.password = form.password ? '' : 'Password is required.'
  return !errors.email && !errors.password
}

async function submit() {
  formError.value = ''
  if (!validate()) return
  submitting.value = true
  try {
    await auth.login(form)
    goToApp()
  } catch (error) {
    formError.value = getAuthErrorMessage(error)
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <AuthLayout title="Welcome back" subtitle="Sign in to continue to DevMate AI.">
    <AppAlert v-if="formError" variant="error" class="mb-5">{{ formError }}</AppAlert>

    <GoogleSignInButton @success="goToApp" @error="formError = $event" />
    <AuthDivider />

    <form class="flex flex-col gap-4" novalidate @submit.prevent="submit">
      <AppInput
        v-model="form.email"
        label="Email"
        type="email"
        :icon="Mail"
        autocomplete="email"
        placeholder="you@example.com"
        :error="errors.email"
        required
      />
      <div class="flex flex-col gap-1.5">
        <AppInput
          v-model="form.password"
          label="Password"
          type="password"
          :icon="Lock"
          autocomplete="current-password"
          :error="errors.password"
          required
        />
        <RouterLink
          :to="{ name: 'forgot-password', query: { email: form.email || undefined } }"
          class="self-end text-sm font-medium text-primary hover:underline"
        >
          Forgot password?
        </RouterLink>
      </div>

      <AppButton type="submit" size="lg" block :loading="submitting" class="mt-2">
        Sign in
      </AppButton>
    </form>

    <p class="mt-6 text-center text-sm text-muted">
      New to DevMate AI?
      <RouterLink
        :to="{ name: 'signup', query: route.query }"
        class="font-medium text-primary hover:underline"
      >
        Create an account
      </RouterLink>
    </p>
  </AuthLayout>
</template>
