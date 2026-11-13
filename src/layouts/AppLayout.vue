<script setup>
/**
 * Main app shell for signed-in users.
 *
 *  Desktop (lg+):  [ Sidebar | Topbar / page ]
 *  Mobile:         [ Header / page / Bottom tabs ]
 *
 * Child pages render inside the nested IonRouterOutlet, so the sidebar and
 * bars stay put while only the page content animates on navigation.
 */
import { IonPage, IonRouterOutlet } from '@ionic/vue'
import AppSidebar from '@/components/layout/AppSidebar.vue'
import AppTopbar from '@/components/layout/AppTopbar.vue'
import MobileTabBar from '@/components/layout/MobileTabBar.vue'
</script>

<template>
  <IonPage>
    <!-- Keyboard users can jump past the navigation straight to the page -->
    <a
      href="#main-content"
      class="sr-only z-50 rounded-lg bg-primary px-4 py-2 text-sm text-on-primary focus:not-sr-only focus:absolute focus:top-3 focus:left-3"
    >
      Skip to main content
    </a>
    <div class="flex h-full bg-bg">
      <AppSidebar />

      <div class="flex min-w-0 flex-1 flex-col">
        <AppTopbar />
        <main id="main-content" class="relative min-h-0 flex-1">
          <IonRouterOutlet />
        </main>
        <MobileTabBar />
      </div>
    </div>
  </IonPage>
</template>
