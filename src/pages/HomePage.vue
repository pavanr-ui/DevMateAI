<script setup>
import { onMounted } from 'vue'
import { IonPage, IonContent } from '@ionic/vue'
import { Code2, Moon, Sun, CheckCircle2 } from '@lucide/vue'
import { useThemeStore } from '@/stores/theme'

const theme = useThemeStore()
onMounted(() => theme.apply())

// Phase 1 checklist shown on the placeholder page
const stack = ['Vue 3', 'Vite 8', 'Ionic Vue 9', 'Tailwind CSS 4', 'Pinia', 'Vue Router', 'Lucide']
</script>

<template>
  <IonPage>
    <IonContent>
      <main class="mx-auto flex min-h-full max-w-2xl flex-col justify-center gap-6 p-6">
        <header class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <span
              class="grid size-11 place-items-center rounded-xl bg-primary text-on-primary"
              aria-hidden="true"
            >
              <Code2 :size="24" />
            </span>
            <div>
              <h1 class="text-xl font-semibold text-fg">DevMate AI</h1>
              <p class="text-sm text-muted">Your AI-Powered Development Companion</p>
            </div>
          </div>

          <button
            type="button"
            class="grid size-10 place-items-center rounded-lg border border-line bg-surface text-fg transition hover:border-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            :aria-label="theme.isDark ? 'Switch to light theme' : 'Switch to dark theme'"
            @click="theme.toggle()"
          >
            <Sun v-if="theme.isDark" :size="18" aria-hidden="true" />
            <Moon v-else :size="18" aria-hidden="true" />
          </button>
        </header>

        <section class="rounded-2xl border border-line bg-surface p-6 shadow-sm">
          <h2 class="mb-1 font-semibold text-fg">Phase 1 setup complete</h2>
          <p class="mb-4 text-sm text-muted">
            The foundation is running. The design system and login arrive in Phase 2.
          </p>
          <ul class="grid gap-2 sm:grid-cols-2">
            <li v-for="item in stack" :key="item" class="flex items-center gap-2 text-sm text-fg">
              <CheckCircle2 :size="16" class="text-primary" aria-hidden="true" />
              {{ item }}
            </li>
          </ul>
        </section>
      </main>
    </IonContent>
  </IonPage>
</template>
