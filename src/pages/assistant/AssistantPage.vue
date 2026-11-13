<script setup>
/**
 * AI Code Assistant.
 *  Desktop: [ conversation list | chat ]
 *  Mobile:  chat full-screen; "Chats" button opens the list in a dialog.
 * URL: /assistant (new chat) or /assistant?c=<conversationId>
 */
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { IonContent, IonPage } from '@ionic/vue'
import { History, Plus } from '@lucide/vue'
import AppButton from '@/components/common/AppButton.vue'
import AppDialog from '@/components/common/AppDialog.vue'
import AppSkeleton from '@/components/common/AppSkeleton.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import ErrorState from '@/components/common/ErrorState.vue'
import ChatComposer from '@/components/chat/ChatComposer.vue'
import ChatMessage from '@/components/chat/ChatMessage.vue'
import ChatWelcome from '@/components/chat/ChatWelcome.vue'
import ConversationList from '@/components/chat/ConversationList.vue'
import { useChatStore } from '@/stores/chat'
import { useProjectsStore } from '@/stores/projects'

const MAX_MESSAGE = 12000 // mirrors functions/src/config.js

const route = useRoute()
const router = useRouter()
const chat = useChatStore()
const projects = useProjectsStore()

const draft = ref('')
const composer = ref(null)
const scroller = ref(null)
const listOpen = ref(false)
const stickToBottom = ref(true)

const routeId = computed(() =>
  typeof route.query.c === 'string' && route.query.c ? route.query.c : null,
)

onMounted(() => {
  chat.loadConversations()
  projects.load()
})

// URL -> store: open whichever conversation the URL points to.
watch(
  routeId,
  async (id) => {
    if (route.name !== 'assistant') return
    if (id === chat.currentId && (id || chat.messagesStatus === 'ready')) return
    await chat.open(id)
    stickToBottom.value = true
    scrollToBottom()
  },
  { immediate: true },
)

// Store -> URL: a new chat receives its id from the server mid-stream.
watch(
  () => chat.currentId,
  (id) => {
    if (route.name === 'assistant' && id && id !== routeId.value) {
      router.replace({ name: 'assistant', query: { c: id } })
    }
  },
)

// Follow the streaming answer, unless the user scrolled up to read.
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
  () => chat.messages.at(-1)?.content,
  () => scrollToBottom(),
)

async function send() {
  const text = draft.value
  draft.value = ''
  stickToBottom.value = true
  scrollToBottom()
  await chat.send(text)
}

function pickSuggestion(s) {
  chat.settings.mode = s.mode
  chat.settings.language = s.language
  draft.value = s.text
  composer.value?.focus()
}

function openConversation(id) {
  listOpen.value = false
  router.replace({ name: 'assistant', query: { c: id } })
}
function newChat() {
  listOpen.value = false
  router.replace({ name: 'assistant' })
  chat.open(null)
  composer.value?.focus()
}
</script>

<template>
  <IonPage>
    <IonContent :scroll-y="false">
      <div class="flex h-full">
        <!-- Conversation list (wide screens) -->
        <aside
          class="hidden w-72 shrink-0 border-r border-line bg-surface xl:block"
          aria-label="Chats"
        >
          <ConversationList
            :conversations="chat.conversations"
            :status="chat.conversationsStatus"
            :active-id="chat.currentId"
            @select="openConversation"
            @new="newChat"
            @retry="chat.loadConversations()"
          />
        </aside>

        <!-- Chat -->
        <section class="flex min-w-0 flex-1 flex-col" aria-label="Chat">
          <!-- Chat header -->
          <div class="flex h-12 shrink-0 items-center gap-2 border-b border-line px-4">
            <h2 class="min-w-0 flex-1 truncate text-sm font-medium text-fg">
              {{ chat.currentTitle || 'New chat' }}
            </h2>
            <AppButton
              variant="ghost"
              size="sm"
              :icon="History"
              class="xl:hidden"
              @click="listOpen = true"
            >
              Chats
            </AppButton>
            <AppButton variant="ghost" size="sm" :icon="Plus" @click="newChat">New</AppButton>
          </div>

          <!-- Messages -->
          <div
            ref="scroller"
            class="min-h-0 flex-1 overflow-y-auto"
            aria-live="polite"
            :aria-busy="chat.sending"
            @scroll.passive="onScroll"
          >
            <div class="mx-auto max-w-3xl px-4 py-6">
              <div
                v-if="chat.messagesStatus === 'loading'"
                class="flex flex-col gap-6"
                aria-busy="true"
              >
                <AppSkeleton class="ml-auto h-10 w-2/3 rounded-2xl" />
                <AppSkeleton variant="text" :lines="4" />
              </div>

              <ErrorState
                v-else-if="chat.messagesStatus === 'error'"
                message="We couldn't load this conversation."
                @retry="chat.open(routeId)"
              />

              <EmptyState
                v-else-if="chat.messagesStatus === 'not-found'"
                title="Conversation not found"
                description="It may have been deleted, or the link is wrong."
              >
                <AppButton :icon="Plus" @click="newChat">Start a new chat</AppButton>
              </EmptyState>

              <ChatWelcome v-else-if="chat.isEmpty" @pick="pickSuggestion" />

              <ol v-else class="flex flex-col gap-6">
                <li v-for="(m, i) in chat.messages" :key="m.id">
                  <ChatMessage
                    :message="m"
                    :can-retry="i === chat.messages.length - 1"
                    @retry="chat.retry()"
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
                v-model:settings="chat.settings"
                :sending="chat.sending"
                :projects="projects.items"
                :max-length="MAX_MESSAGE"
                @send="send"
                @stop="chat.stop()"
              />
              <p class="mt-2 text-center text-[11px] text-subtle">
                AI can make mistakes. Review code before using it.
              </p>
            </div>
          </div>
        </section>
      </div>

      <!-- Conversation list (narrower screens) -->
      <AppDialog v-model:open="listOpen" title="Chats">
        <div class="-mx-3 -mb-3 max-h-[60vh]">
          <ConversationList
            :conversations="chat.conversations"
            :status="chat.conversationsStatus"
            :active-id="chat.currentId"
            @select="openConversation"
            @new="newChat"
            @retry="chat.loadConversations()"
          />
        </div>
      </AppDialog>
    </IonContent>
  </IonPage>
</template>
