<script setup>
import { reactive, ref } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { Lock, Mail, UserRound } from '@lucide/vue'
import AuthLayout from '@/layouts/AuthLayout.vue'
import AppAlert from '@/components/common/AppAlert.vue'
import AppButton from '@/components/common/AppButton.vue'
import AppInput from '@/components/common/AppInput.vue'
import AuthDivider from '@/components/auth/AuthDivider.vue'
import GoogleSignInButton from '@/components/auth/GoogleSignInButton.vue'
import { useAuthStore } from '@/stores/auth'
import { getAuthErrorMessage } from '@/utils/authErrors'
import { safeRedirect } from '@/utils/safeRedirect'
import {
  PASSWORD_MIN_LENGTH,
  validateEmail,
  validateName,
  validatePassword,
} from '@/utils/validation'

const auth = useAuthStore()
const route = useRoute()
const router = useRouter()

const form = reactive({ name: '', email: '', password: '' })
const errors = reactive({ name: '', email: '', password: '' })
const formError = ref('')
const submitting = ref(false)

function goToApp() {
  router.replace(safeRedirect(route.query.redirect))
}

function validate() {
  errors.name = validateName(form.name)
  errors.email = validateEmail(form.email)
  errors.password = validatePassword(form.password)
  return !errors.name && !errors.email && !errors.password
}

async function submit() {
  formError.value = ''
  if (!validate()) return
  submitting.value = true
  try {
    await auth.signUp(form)
    goToApp()
  } catch (error) {
    formError.value = getAuthErrorMessage(error)
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <AuthLayout title="Create your account" subtitle="Start building faster with your AI companion.">
    <AppAlert v-if="formError" variant="error" class="mb-5">{{ formError }}</AppAlert>

    <GoogleSignInButton @success="goToApp" @error="formError = $event" />
    <AuthDivider />

    <form class="flex flex-col gap-4" novalidate @submit.prevent="submit">
      <AppInput
        v-model="form.name"
        label="Full name"
        :icon="UserRound"
        autocomplete="name"
        placeholder="Ada Lovelace"
        :error="errors.name"
        required
      />
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
      <AppInput
        v-model="form.password"
        label="Password"
        type="password"
        :icon="Lock"
        autocomplete="new-password"
        :hint="`At least ${PASSWORD_MIN_LENGTH} characters.`"
        :error="errors.password"
        required
      />

      <AppButton type="submit" size="lg" block :loading="submitting" class="mt-2">
        Create account
      </AppButton>
    </form>

    <p class="mt-6 text-center text-sm text-muted">
      Already have an account?
      <RouterLink
        :to="{ name: 'login', query: route.query }"
        class="font-medium text-primary hover:underline"
      >
        Sign in
      </RouterLink>
    </p>
  </AuthLayout>
</template>
