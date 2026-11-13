<script setup>
import { watch } from 'vue'
import { useRouter } from 'vue-router'
import { IonApp, IonRouterOutlet } from '@ionic/vue'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const router = useRouter()

// When the user signs out (here or in another tab), leave protected pages.
watch(
  () => auth.isAuthenticated,
  (signedIn, wasSignedIn) => {
    const onProtectedPage = router.currentRoute.value.matched.some((r) => r.meta.requiresAuth)
    if (wasSignedIn && !signedIn && onProtectedPage) {
      router.replace({ name: 'login' })
    }
  },
)
</script>

<template>
  <!-- IonApp + IonRouterOutlet give us native-style page transitions and
       the back-swipe gesture on mobile. -->
  <IonApp>
    <IonRouterOutlet />
  </IonApp>
</template>
