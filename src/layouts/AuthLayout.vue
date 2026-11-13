<script setup>
/**
 * Wrapper for sign-in / sign-up / reset pages: centered card with the logo,
 * plus a short product pitch on wide screens.
 */
import { IonContent, IonPage } from '@ionic/vue'
import { CircleCheck } from '@lucide/vue'
import AppLogo from '@/components/common/AppLogo.vue'
import ThemeToggle from '@/components/common/ThemeToggle.vue'

defineProps({
  title: { type: String, required: true },
  subtitle: { type: String, default: '' },
})

const highlights = [
  'Generate, review and fix code with AI',
  'Vue 3 component generator',
  'Learn JavaScript with guided examples',
]
</script>

<template>
  <IonPage>
    <IonContent>
      <div class="flex min-h-full">
        <!-- Brand panel (desktop only) -->
        <aside
          class="hidden w-[44%] max-w-xl flex-col justify-between border-r border-line bg-sidebar p-10 lg:flex"
        >
          <AppLogo />
          <div>
            <h2 class="text-3xl leading-tight font-semibold tracking-tight text-fg">
              Your AI-Powered<br />Development Companion
            </h2>
            <ul class="mt-6 flex flex-col gap-3">
              <li
                v-for="item in highlights"
                :key="item"
                class="flex items-center gap-3 text-sm text-muted"
              >
                <CircleCheck :size="18" class="text-primary" aria-hidden="true" />
                {{ item }}
              </li>
            </ul>
          </div>
          <p class="text-xs text-subtle">© {{ new Date().getFullYear() }} DevMate AI</p>
        </aside>

        <!-- Form -->
        <main
          class="flex flex-1 flex-col px-5 pt-[calc(env(safe-area-inset-top)+1rem)] pb-[calc(env(safe-area-inset-bottom)+1.5rem)] sm:px-8"
        >
          <div class="flex items-center justify-between lg:justify-end">
            <AppLogo class="lg:hidden" size="sm" />
            <ThemeToggle />
          </div>

          <div class="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-10">
            <h1 class="text-2xl font-semibold tracking-tight text-fg">{{ title }}</h1>
            <p v-if="subtitle" class="mt-1.5 text-sm text-muted">{{ subtitle }}</p>
            <div class="mt-8">
              <slot />
            </div>
          </div>
        </main>
      </div>
    </IonContent>
  </IonPage>
</template>
