<script setup>
import { watch } from 'vue'
import { useRouter } from 'vue-router'
import { IonApp, IonRouterOutlet } from '@ionic/vue'
import { useAuthStore } from '@/stores/auth'
import { useDashboardStore } from '@/stores/dashboard'
import { useProjectsStore } from '@/stores/projects'
import { useChatStore } from '@/stores/chat'

const auth = useAuthStore()
const router = useRouter()
const dashboard = useDashboardStore()
const projects = useProjectsStore()
const chat = useChatStore()

// A different user (or nobody) is signed in: forget the previous user's data
// so it can never flash on screen for the next person.
watch(
  () => auth.user?.uid,
  () => {
    dashboard.reset()
    projects.reset()
    chat.reset()
  },
)

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
