<script setup>
/**
 * AnalysisWorkspace - shared layout for one-shot AI tools.
 *
 *   wide screens:  [ form | results ]       phones: form, then results
 *
 * Slots:  #form   the input form
 *         #result the rendered result (only shown when status === 'done')
 * Handles: URL ?c=<id> for saved results, history dialog, progress,
 * cancel, error / empty / not-found states.
 */
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { IonContent, IonPage } from '@ionic/vue'
import { History, LoaderCircle, Plus } from '@lucide/vue'
import AppButton from '@/components/common/AppButton.vue'
import AppCard from '@/components/common/AppCard.vue'
import AppDialog from '@/components/common/AppDialog.vue'
import AppSkeleton from '@/components/common/AppSkeleton.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import ErrorState from '@/components/common/ErrorState.vue'
import ConversationList from '@/components/chat/ConversationList.vue'

const props = defineProps({
  /** Pinia store from createAnalysisStore() */
  store: { type: Object, required: true },
  routeName: { type: String, required: true },
  icon: { type: [Object, Function], required: true },
  emptyTitle: { type: String, required: true },
  emptyDescription: { type: String, required: true },
  runningLabel: { type: String, default: 'Analysing your code…' },
  newLabel: { type: String, default: 'New' },
})
const emit = defineEmits(['retry', 'new'])

const route = useRoute()
const router = useRouter()
const historyOpen = ref(false)
const resultsEl = ref(null)

const routeId = computed(() =>
  typeof route.query.c === 'string' && route.query.c ? route.query.c : null,
)

onMounted(() => props.store.loadHistory())

// URL -> store
watch(
  routeId,
  (id) => {
    if (route.name !== props.routeName) return
    if (id && id !== props.store.currentId) props.store.open(id)
  },
  { immediate: true },
)

// store -> URL (a finished run gets its own link)
watch(
  () => props.store.currentId,
  (id) => {
    if (route.name === props.routeName && id && id !== routeId.value) {
      router.replace({ name: props.routeName, query: { c: id } })
    }
  },
)

// On phones the results sit below the form: bring them into view when they arrive.
watch(
  () => props.store.status,
  (status) => {
    if (['running', 'done', 'error'].includes(status) && window.innerWidth < 1280) {
      requestAnimationFrame(() =>
        resultsEl.value?.scrollIntoView({ behavior: 'smooth', block: 'start' }),
      )
    }
  },
)

function openSaved(id) {
  historyOpen.value = false
  router.replace({ name: props.routeName, query: { c: id } })
}
function startNew() {
  historyOpen.value = false
  props.store.reset({ keepHistory: true })
  router.replace({ name: props.routeName })
  emit('new')
}

const kb = computed(() => (props.store.progressChars / 1024).toFixed(1))
</script>

<template>
  <IonPage>
    <IonContent>
      <div class="mx-auto w-full max-w-7xl px-4 py-5 sm:px-6 lg:px-8 lg:py-6">
        <div class="mb-4 flex items-center justify-end gap-1">
          <AppButton variant="ghost" size="sm" :icon="History" @click="historyOpen = true">
            History
          </AppButton>
          <AppButton variant="ghost" size="sm" :icon="Plus" @click="startNew">
            {{ newLabel }}
          </AppButton>
        </div>

        <!-- minmax(0, …) lets columns shrink below their content, so a long
             line of code scrolls inside its block instead of widening the page -->
        <div
          class="grid grid-cols-[minmax(0,1fr)] items-start gap-5 xl:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]"
        >
          <!-- Form -->
          <AppCard as="section" aria-label="Input">
            <slot name="form" />
          </AppCard>

          <!-- Results -->
          <section ref="resultsEl" aria-label="Results" class="scroll-mt-4" aria-live="polite">
            <AppCard v-if="store.status === 'idle'" padding="none">
              <EmptyState :icon="icon" :title="emptyTitle" :description="emptyDescription" />
            </AppCard>

            <AppCard v-else-if="store.status === 'running'" aria-busy="true">
              <div class="mb-5 flex items-center gap-3">
                <LoaderCircle :size="20" class="animate-spin text-primary" aria-hidden="true" />
                <div class="flex-1">
                  <p class="text-sm font-medium text-fg">{{ runningLabel }}</p>
                  <p class="text-xs text-subtle">
                    {{
                      store.progressChars
                        ? `Receiving results… ${kb} KB`
                        : 'This usually takes 10–30 seconds.'
                    }}
                  </p>
                </div>
                <AppButton variant="secondary" size="sm" @click="store.cancel()">Cancel</AppButton>
              </div>
              <div class="flex flex-col gap-3">
                <AppSkeleton class="h-16" />
                <AppSkeleton variant="text" :lines="3" />
                <AppSkeleton class="h-24" />
                <AppSkeleton class="h-40" />
              </div>
            </AppCard>

            <AppCard v-else-if="store.status === 'loading'" aria-busy="true">
              <div class="flex flex-col gap-3">
                <AppSkeleton class="h-16" />
                <AppSkeleton class="h-40" />
              </div>
            </AppCard>

            <AppCard v-else-if="store.status === 'error'" padding="none">
              <ErrorState :message="store.error" @retry="emit('retry')" />
            </AppCard>

            <AppCard v-else-if="store.status === 'not-found'" padding="none">
              <EmptyState
                :icon="icon"
                title="Result not found"
                description="It may have been deleted, or the link is wrong."
              >
                <AppButton :icon="Plus" @click="startNew">Start new</AppButton>
              </EmptyState>
            </AppCard>

            <slot v-else name="result" />
          </section>
        </div>
      </div>

      <AppDialog v-model:open="historyOpen" title="History">
        <div class="-mx-3 -mb-3 max-h-[60vh]">
          <ConversationList
            :conversations="store.history"
            :status="store.historyStatus"
            :active-id="store.currentId"
            :new-label="newLabel"
            empty-text="Your saved results will appear here."
            @select="openSaved"
            @new="startNew"
            @retry="store.loadHistory()"
          />
        </div>
      </AppDialog>
    </IonContent>
  </IonPage>
</template>
