<script setup>
/**
 * PageContainer - standard page wrapper inside the app shell.
 * Gives every page the same Ionic scroll area, max width and padding.
 *
 * <PageContainer title="Settings" description="Manage your account">...</PageContainer>
 * The title is shown on mobile only (desktop shows it in the top bar).
 */
import { IonContent, IonPage } from '@ionic/vue'

defineProps({
  title: { type: String, default: '' },
  description: { type: String, default: '' },
  width: { type: String, default: 'xl', validator: (v) => ['md', 'xl', 'full'].includes(v) },
})

const widths = { md: 'max-w-3xl', xl: 'max-w-6xl', full: 'max-w-none' }
</script>

<template>
  <IonPage>
    <IonContent>
      <div :class="['mx-auto w-full px-4 py-5 sm:px-6 lg:px-8 lg:py-8', widths[width]]">
        <header
          v-if="title || description || $slots.actions"
          class="mb-6 flex flex-wrap items-end gap-3"
        >
          <div class="min-w-0 flex-1">
            <h1 v-if="title" class="text-xl font-semibold tracking-tight text-fg lg:hidden">
              {{ title }}
            </h1>
            <p v-if="description" class="mt-1 text-sm text-muted lg:mt-0">{{ description }}</p>
          </div>
          <slot name="actions" />
        </header>
        <slot />
      </div>
    </IonContent>
  </IonPage>
</template>
