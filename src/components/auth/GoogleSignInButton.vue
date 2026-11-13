<script setup>
/**
 * "Continue with Google" button. Emits the friendly error message (or
 * nothing if the user simply closed the popup) and navigates on success.
 */
import { ref } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { getAuthErrorMessage, isSilentAuthError } from '@/utils/authErrors'
import AppButton from '@/components/common/AppButton.vue'

const emit = defineEmits(['success', 'error'])
const auth = useAuthStore()
const loading = ref(false)

async function signIn() {
  loading.value = true
  emit('error', '')
  try {
    await auth.loginWithGoogle()
    emit('success')
  } catch (error) {
    if (!isSilentAuthError(error)) emit('error', getAuthErrorMessage(error))
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <AppButton variant="secondary" size="lg" block :loading="loading" @click="signIn">
    <svg v-if="!loading" viewBox="0 0 24 24" class="size-[18px]" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.76h3.57c2.08-1.92 3.27-4.74 3.27-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.76c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.11a6.6 6.6 0 0 1 0-4.22V7.05H2.18a11 11 0 0 0 0 9.9l3.66-2.84z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15A10.95 10.95 0 0 0 12 1 11 11 0 0 0 2.18 7.05l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z"
      />
    </svg>
    Continue with Google
  </AppButton>
</template>
