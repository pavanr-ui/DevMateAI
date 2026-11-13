<script setup>
/**
 * List of past assistant conversations, newest first.
 */
import { MessageSquare, Plus } from '@lucide/vue'
import AppButton from '@/components/common/AppButton.vue'
import AppSkeleton from '@/components/common/AppSkeleton.vue'
import { formatRelativeTime } from '@/utils/dates'

defineProps({
  conversations: { type: Array, required: true },
  status: { type: String, required: true },
  activeId: { type: String, default: null },
})
defineEmits(['select', 'new', 'retry'])
</script>

<template>
  <div class="flex h-full flex-col">
    <div class="p-3">
      <AppButton block variant="secondary" :icon="Plus" @click="$emit('new')">New chat</AppButton>
    </div>

    <div class="min-h-0 flex-1 overflow-y-auto px-3 pb-3">
      <p class="mb-1.5 px-2 text-xs font-medium tracking-wide text-subtle uppercase">Recent</p>

      <div v-if="status === 'idle' || status === 'loading'" class="flex flex-col gap-2 px-2">
        <AppSkeleton v-for="n in 5" :key="n" class="h-9" />
      </div>

      <p v-else-if="status === 'error'" class="px-2 py-4 text-sm text-muted">
        Couldn't load chats.
        <button
          type="button"
          class="font-medium text-primary hover:underline"
          @click="$emit('retry')"
        >
          Retry
        </button>
      </p>

      <p v-else-if="!conversations.length" class="px-2 py-4 text-sm text-muted">
        Your chats will appear here.
      </p>

      <ul v-else class="flex flex-col gap-0.5">
        <li v-for="c in conversations" :key="c.id">
          <button
            type="button"
            :aria-current="c.id === activeId ? 'page' : undefined"
            :class="[
              'flex w-full items-start gap-2.5 rounded-lg px-2 py-2 text-left transition-colors',
              c.id === activeId ? 'bg-primary-soft' : 'hover:bg-surface-muted',
            ]"
            @click="$emit('select', c.id)"
          >
            <MessageSquare
              :size="15"
              :class="['mt-0.5 shrink-0', c.id === activeId ? 'text-primary' : 'text-subtle']"
              aria-hidden="true"
            />
            <span class="min-w-0 flex-1">
              <span
                :class="[
                  'block truncate text-sm',
                  c.id === activeId ? 'font-medium text-primary' : 'text-fg',
                ]"
              >
                {{ c.title }}
              </span>
              <span class="block text-xs text-subtle">{{ formatRelativeTime(c.updatedAt) }}</span>
            </span>
          </button>
        </li>
      </ul>
    </div>
  </div>
</template>
