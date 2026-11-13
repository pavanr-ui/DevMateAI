<script setup>
/**
 * ProjectCard - compact project summary with tech-stack tags.
 * Emits 'edit' / 'delete' when actions are enabled.
 */
import { FolderKanban, Pencil, Trash2 } from '@lucide/vue'
import { formatRelativeTime } from '@/utils/dates'

defineProps({
  project: { type: Object, required: true },
  actions: { type: Boolean, default: false },
  compact: { type: Boolean, default: false },
})
defineEmits(['edit', 'delete'])
</script>

<template>
  <article
    :class="[
      'flex h-full flex-col rounded-xl border border-line bg-surface',
      compact ? 'p-3' : 'p-4 shadow-card',
    ]"
  >
    <div class="flex items-start gap-3">
      <span
        class="grid size-9 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary"
        aria-hidden="true"
      >
        <FolderKanban :size="16" />
      </span>
      <div class="min-w-0 flex-1">
        <h3 class="truncate text-sm font-medium text-fg">{{ project.name }}</h3>
        <p class="text-xs text-subtle">Updated {{ formatRelativeTime(project.updatedAt) }}</p>
      </div>
      <div v-if="actions" class="-mt-1 -mr-1 flex shrink-0">
        <button
          type="button"
          class="grid size-8 place-items-center rounded-lg text-subtle hover:bg-surface-muted hover:text-fg"
          :aria-label="`Edit ${project.name}`"
          @click="$emit('edit', project)"
        >
          <Pencil :size="15" aria-hidden="true" />
        </button>
        <button
          type="button"
          class="grid size-8 place-items-center rounded-lg text-subtle hover:bg-danger-soft hover:text-danger"
          :aria-label="`Delete ${project.name}`"
          @click="$emit('delete', project)"
        >
          <Trash2 :size="15" aria-hidden="true" />
        </button>
      </div>
    </div>

    <p v-if="project.description && !compact" class="mt-3 line-clamp-2 text-sm text-muted">
      {{ project.description }}
    </p>

    <ul v-if="project.techStack?.length" class="mt-3 flex flex-wrap gap-1.5">
      <li
        v-for="tag in project.techStack.slice(0, compact ? 3 : 10)"
        :key="tag"
        class="rounded-md bg-surface-muted px-2 py-0.5 text-xs text-muted"
      >
        {{ tag }}
      </li>
      <li v-if="compact && project.techStack.length > 3" class="px-1 py-0.5 text-xs text-subtle">
        +{{ project.techStack.length - 3 }}
      </li>
    </ul>
  </article>
</template>
