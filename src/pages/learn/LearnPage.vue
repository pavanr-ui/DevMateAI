<script setup>
/**
 * JavaScript Learning Assistant.
 *  Wide screens: [ topics | chat ]     Phones: chat, with Topics / History dialogs.
 *
 * Pick a topic, then an activity (Explain, Examples, Exercise, Interview).
 * Each activity starts a new chat; follow-up messages (e.g. your exercise
 * answer) keep the same activity so the tutor reviews instead of restarting.
 * URL: /learn or /learn?c=<conversationId>
 */
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { IonContent, IonPage } from '@ionic/vue'
import { BookOpen, GraduationCap, History, Plus } from '@lucide/vue'
import AppButton from '@/components/common/AppButton.vue'
import AppDialog from '@/components/common/AppDialog.vue'
import AppSkeleton from '@/components/common/AppSkeleton.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import ErrorState from '@/components/common/ErrorState.vue'
import ChatComposer from '@/components/chat/ChatComposer.vue'
import ChatMessage from '@/components/chat/ChatMessage.vue'
import ConversationList from '@/components/chat/ConversationList.vue'
import TopicCatalog from '@/components/learn/TopicCatalog.vue'
import { useLearnStore } from '@/stores/chat'
import { ACTIVITIES, LEVELS } from '@/utils/learnTopics'

const route = useRoute()
const router = useRouter()
const learn = useLearnStore()

const draft = ref('')
const composer = ref(null)
const scroller = ref(null)
const topicsOpen = ref(false)
const historyOpen = ref(false)
const stickToBottom = ref(true)

/** The activity follow-up messages belong to: { mode, topic } */
const context = ref({ mode: 'chat', topic: null })
/** Topic picked in the catalog but not started yet */
const selectedTopic = ref(null)

const routeId = computed(() =>
  typeof route.query.c === 'string' && route.query.c ? route.query.c : null,
)

onMounted(() => learn.loadConversations())

// URL -> store
watch(
  routeId,
  async (id) => {
    if (route.name !== 'learn') return
    if (id === learn.currentId && (id || learn.messagesStatus === 'ready')) return
    await learn.open(id)
    stickToBottom.value = true
    scrollToBottom()
  },
  { immediate: true },
)

// store -> URL (new chats get an id mid-stream)
watch(
  () => learn.currentId,
  (id) => {
    if (route.name === 'learn' && id && id !== routeId.value) {
      router.replace({ name: 'learn', query: { c: id } })
    }
  },
)

// Opening a saved chat restores its activity and topic.
watch(
  () => learn.current,
  (conversation) => {
    if (!conversation) return
    context.value = { mode: conversation.mode ?? 'chat', topic: conversation.topic ?? null }
    selectedTopic.value = conversation.topic ?? selectedTopic.value
    if (conversation.level) learn.settings.level = conversation.level
  },
)

const explored = computed(() => new Set(learn.conversations.map((c) => c.topic).filter(Boolean)))

const placeholder = computed(
  () =>
    ({
      exercise: 'Write your attempt or ask for a hint…',
      interview: 'Type your answer…',
    })[context.value.mode] ?? 'Ask anything about JavaScript…',
)

const levelLabel = computed(() => LEVELS.find((l) => l.id === learn.settings.level)?.label)

// --- Scrolling ---
async function scrollToBottom() {
  await nextTick()
  const el = scroller.value
  if (el && stickToBottom.value) el.scrollTop = el.scrollHeight
}
function onScroll() {
  const el = scroller.value
  stickToBottom.value = el.scrollHeight - el.scrollTop - el.clientHeight < 80
}
watch(
  () => learn.messages.at(-1)?.content,
  () => scrollToBottom(),
)

// --- Actions ---
function pickTopic(topic) {
  selectedTopic.value = topic.name
  if (topic.level !== learn.settings.level) learn.settings.level = topic.level
  topicsOpen.value = false
}

async function startActivity(activity) {
  if (!selectedTopic.value || learn.sending) return
  // Each activity is its own chat, so history stays tidy ("Closures · Exercise").
  // Wait for the URL to settle first, so the URL watcher can't interrupt the reply.
  await router.replace({ name: 'learn' })
  await learn.open(null)
  context.value = { mode: activity.mode, topic: selectedTopic.value }
  stickToBottom.value = true
  await learn.send(activity.message(selectedTopic.value), context.value)
}

async function send() {
  const text = draft.value
  draft.value = ''
  stickToBottom.value = true
  scrollToBottom()
  await learn.send(text, context.value)
}

function newChat() {
  historyOpen.value = false
  router.replace({ name: 'learn' })
  learn.open(null)
  context.value = { mode: 'chat', topic: null }
  composer.value?.focus()
}
function openConversation(id) {
  historyOpen.value = false
  router.replace({ name: 'learn', query: { c: id } })
}
</script>

<template>
  <IonPage>
    <IonContent :scroll-y="false">
      <div class="flex h-full">
        <!-- Topics (wide screens) -->
        <aside
          class="hidden w-72 shrink-0 border-r border-line bg-surface xl:block"
          aria-label="JavaScript topics"
        >
          <TopicCatalog
            v-model:level="learn.settings.level"
            :active-topic="selectedTopic"
            :explored="explored"
            @select="pickTopic"
          />
        </aside>

        <section class="flex min-w-0 flex-1 flex-col" aria-label="Lesson">
          <!-- Header -->
          <div class="flex h-12 shrink-0 items-center gap-2 border-b border-line px-4">
            <h2 class="min-w-0 flex-1 truncate text-sm font-medium text-fg">
              {{ learn.currentTitle || 'Learn JavaScript' }}
            </h2>
            <AppButton
              variant="ghost"
              size="sm"
              :icon="BookOpen"
              class="xl:hidden"
              @click="topicsOpen = true"
            >
              Topics
            </AppButton>
            <AppButton variant="ghost" size="sm" :icon="History" @click="historyOpen = true">
              History
            </AppButton>
            <AppButton variant="ghost" size="sm" :icon="Plus" @click="newChat">New</AppButton>
          </div>

          <!-- Activity bar for the selected topic -->
          <div
            v-if="selectedTopic"
            class="flex shrink-0 flex-wrap items-center gap-2 border-b border-line bg-surface px-4 py-2.5"
          >
            <p class="min-w-0 flex-1 truncate text-sm">
              <span class="text-subtle">{{ levelLabel }} ·</span>
              <span class="font-medium text-fg"> {{ selectedTopic }}</span>
            </p>
            <div class="flex flex-wrap gap-1.5" role="group" aria-label="Activities">
              <AppButton
                v-for="a in ACTIVITIES"
                :key="a.mode"
                size="sm"
                :variant="
                  context.topic === selectedTopic && context.mode === a.mode
                    ? 'primary'
                    : 'secondary'
                "
                :disabled="learn.sending"
                @click="startActivity(a)"
              >
                {{ a.label }}
              </AppButton>
            </div>
          </div>

          <!-- Messages -->
          <div
            ref="scroller"
            class="min-h-0 flex-1 overflow-y-auto"
            aria-live="polite"
            :aria-busy="learn.sending"
            @scroll.passive="onScroll"
          >
            <div class="mx-auto max-w-3xl px-4 py-6">
              <div
                v-if="learn.messagesStatus === 'loading'"
                class="flex flex-col gap-6"
                aria-busy="true"
              >
                <AppSkeleton class="ml-auto h-10 w-2/3 rounded-2xl" />
                <AppSkeleton variant="text" :lines="4" />
              </div>
              <ErrorState
                v-else-if="learn.messagesStatus === 'error'"
                message="We couldn't load this lesson."
                @retry="learn.open(routeId)"
              />
              <EmptyState
                v-else-if="learn.messagesStatus === 'not-found'"
                title="Lesson not found"
                description="It may have been deleted, or the link is wrong."
              >
                <AppButton :icon="Plus" @click="newChat">Start learning</AppButton>
              </EmptyState>
              <EmptyState
                v-else-if="learn.isEmpty"
                :icon="GraduationCap"
                :title="
                  selectedTopic
                    ? `Ready to learn ${selectedTopic}?`
                    : 'What do you want to learn today?'
                "
                :description="
                  selectedTopic
                    ? 'Choose Explain, Examples, Exercise or Interview above, or ask your own question below.'
                    : 'Pick a topic, then an activity. Or just ask any JavaScript question below.'
                "
              >
                <AppButton
                  v-if="!selectedTopic"
                  variant="secondary"
                  :icon="BookOpen"
                  class="xl:hidden"
                  @click="topicsOpen = true"
                >
                  Browse topics
                </AppButton>
              </EmptyState>
              <ol v-else class="flex flex-col gap-6">
                <li v-for="(m, i) in learn.messages" :key="m.id">
                  <ChatMessage
                    :message="m"
                    :can-retry="i === learn.messages.length - 1"
                    @retry="learn.retry()"
                  />
                </li>
              </ol>
            </div>
          </div>

          <!-- Composer -->
          <div class="shrink-0 px-4 pt-2 pb-4">
            <div class="mx-auto max-w-3xl">
              <ChatComposer
                ref="composer"
                v-model="draft"
                v-model:settings="learn.settings"
                :modes="[{ value: 'chat', label: 'Ask' }]"
                :placeholders="{ chat: placeholder }"
                :sending="learn.sending"
                @send="send"
                @stop="learn.stop()"
              >
                <template #options="{ settings, selectClass }">
                  <label class="sr-only" for="learn-level">Level</label>
                  <select id="learn-level" v-model="settings.level" :class="selectClass">
                    <option v-for="l in LEVELS" :key="l.id" :value="l.id">{{ l.label }}</option>
                  </select>
                </template>
              </ChatComposer>
            </div>
          </div>
        </section>
      </div>

      <AppDialog v-model:open="topicsOpen" title="Topics">
        <div class="-mx-3 -mb-3 h-[60vh]">
          <TopicCatalog
            v-model:level="learn.settings.level"
            :active-topic="selectedTopic"
            :explored="explored"
            @select="pickTopic"
          />
        </div>
      </AppDialog>

      <AppDialog v-model:open="historyOpen" title="Lessons">
        <div class="-mx-3 -mb-3 max-h-[60vh]">
          <ConversationList
            :conversations="learn.conversations"
            :status="learn.conversationsStatus"
            :active-id="learn.currentId"
            new-label="New lesson"
            empty-text="Your lessons will appear here."
            @select="openConversation"
            @new="newChat"
            @retry="learn.loadConversations()"
          />
        </div>
      </AppDialog>
    </IonContent>
  </IonPage>
</template>
